// Copyright 2022 Google LLC
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { readFile, mkdir, copyFile, stat } from 'fs/promises';
import { dirname, extname, join } from 'path';
import type { Header, Rewrite, Redirect } from 'next/dist/lib/load-custom-routes';
import type { NextConfig } from 'next';
import nextBuild from 'next/dist/build';
import nextExport from 'next/dist/export';
import { copy } from 'fs-extra';
import { trace } from 'next/dist/trace';

import { DeployConfig, PathFactory, findDependency, getWebpackPlugin } from '../../utils';

export const build = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {

    let nextConfig: NextConfig;
    try {
        const { default: loadConfig }: typeof import('next/dist/server/config') = require(getProjectPath('node_modules', 'next', 'dist', 'server', 'config'));
        const { PHASE_PRODUCTION_BUILD }: typeof import('next/constants') = require(getProjectPath('node_modules', 'next', 'constants'));
        nextConfig = await loadConfig(PHASE_PRODUCTION_BUILD, getProjectPath(), null);
    } catch(e) {
        // Must be Next 11, just import it
        nextConfig = await import(getProjectPath('next.config.js'));
    }

    let usesFirebaseConfig = false;
    const firebaseDependency = findDependency('firebase', getProjectPath());
    let overrideConfig: NextConfig|null = null;
    if (firebaseDependency) {
        overrideConfig = {
            ...nextConfig,
            webpack: (config, context) => {
                let newConfig = config;
                if (nextConfig.webpack) newConfig = nextConfig.webpack(config, context);
                if (context.isServer) return newConfig;
                const plugin = getWebpackPlugin(context.webpack, getProjectPath());
                newConfig.plugins ||= [];
                newConfig.plugins.push(plugin);
                return newConfig;
            }
        }
    }


    // SEMVER these defaults are only needed for Next 11
    const { distDir='.next', basePath='' } = nextConfig;

    const deployPath = (...args: string[]) => config.dist ? join(config.dist, ...args) : getProjectPath('.deploy', ...args);
    const getHostingPath = (...args: string[]) => deployPath('hosting', ...basePath.split('/'), ...args);

    await nextBuild(getProjectPath(), overrideConfig as any, false, false, true);

    console.log('Attempting `next export`...');

    await nextExport(
        getProjectPath(),
        { silent: true, outdir: getHostingPath() },
        trace('next-export-cli')
    ).catch(() => {
        console.warn('\nIgnore the above error, Next.js is not respecting the silent flag. Since next export did not succeed we\'ll treat as SSR.\n\n');
    });

    let usingCloudFunctions = !!config.function;
    const asyncSteps: Array<Promise<any>> = [];

    const exportDetailJson = await readFile(getProjectPath(distDir, 'export-detail.json')).then(it => JSON.parse(it.toString()), () => { success: false });
    if (exportDetailJson.success) {
        usingCloudFunctions = false;
    } else {
        await mkdir(getHostingPath('_next', 'static'), { recursive: true });
        await copy(getProjectPath('public'), getHostingPath());
        await copy(getProjectPath(distDir, 'static'), getHostingPath('_next', 'static'));

        const serverPagesDir = getProjectPath(distDir, 'server', 'pages');
        await copy(serverPagesDir, getHostingPath(), { filter: async filename => {
            const status = await stat(filename);
            if (status.isDirectory()) return true;
            return extname(filename) === '.html'
        }});

        const prerenderManifestBuffer = await readFile(getProjectPath(distDir, 'prerender-manifest.json'));
        const prerenderManifest = JSON.parse(prerenderManifestBuffer.toString());
        // TODO drop from hosting if revalidate
        Object.keys(prerenderManifest.routes).forEach(route => {
            // / => index.json => index.html => index.html
            // /foo => foo.json => foo.html
            const parts = route.split('/').slice(1).filter(it => !!it);
            const partsOrIndex = parts.length > 0 ? parts : ['index'];
            const dataPath = `${join(...partsOrIndex)}.json`;
            const htmlPath = `${join(...partsOrIndex)}.html`;
            const moveHTML = mkdir(getHostingPath(dirname(htmlPath)), { recursive: true }).then(() => {
                return copyFile(
                    getProjectPath(distDir, 'server', 'pages', htmlPath),
                    getHostingPath(htmlPath)
                );
            });
            const dataRoute = prerenderManifest.routes[route].dataRoute;
            const moveData = mkdir(getHostingPath(dirname(dataRoute)), { recursive: true }).then(() => {
                return copyFile(getProjectPath(distDir, 'server', 'pages', dataPath), getHostingPath(dataRoute));
            });
            // TODO initialRevalidateSeconds should be used in Cloud Fuctions as a c-max-age
            asyncSteps.push(moveHTML);
            asyncSteps.push(moveData);
        });
    }

    if (usingCloudFunctions) {
        await mkdir(deployPath('functions'), { recursive: true });
        asyncSteps.push(
            copyFile(getProjectPath('next.config.js'), deployPath('functions', 'next.config.js')),
            copy(getProjectPath('public'), deployPath('functions', 'public')),
            copy(getProjectPath(distDir), deployPath('functions', distDir)),
        );
    }

    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    await Promise.all(asyncSteps);

    const manifestBuffer = await readFile(getProjectPath(distDir, 'routes-manifest.json'));
    const manifest: Manifest = JSON.parse(manifestBuffer.toString());
    const {
        headers: nextJsHeaders=[],
        redirects: nextJsRedirects=[],
        rewrites: nextJsRewrites=[],
    } = manifest;
    const headers = nextJsHeaders.map(({ source, headers }) => ({ source, headers }));
    const redirects = nextJsRedirects
        .filter(({ internal }: any) => !internal)
        .map(({ source, destination, statusCode: type }) => ({ source, destination, type }));
    const nextJsRewritesToUse = Array.isArray(nextJsRewrites) ? nextJsRewrites : nextJsRewrites.beforeFiles || [];
    const rewrites = nextJsRewritesToUse.map(({ source, destination, locale, has }) => {
        // Can we change i18n into Firebase settings?
        if (has) return undefined;
        return { source, destination };
    }).filter(it => it);

    // TODO use this better detection for usesFirebaseConfig
    return { usingCloudFunctions, usesFirebaseConfig, headers, redirects, rewrites, framework: 'next.js', packageJson, bootstrapScript: null };
}

type Manifest = {
    distDir?: string,
    basePath?: string,
    headers?: (Header & { regex: string})[],
    redirects?: (Redirect & { regex: string})[],
    rewrites?: (Rewrite & { regex: string})[] | {
        beforeFiles?: (Rewrite & { regex: string})[],
        afterFiles?: (Rewrite & { regex: string})[],
        fallback?: (Rewrite & { regex: string})[],
    },
};
