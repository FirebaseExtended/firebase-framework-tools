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

import { promises as fsPromises } from 'fs';
import { dirname, join, relative } from 'path';
import type { NextConfig } from 'next/dist/server/config-shared';

import { newServerJs, newPackageJson, newFirebaseJson, newFirebaseRc } from './templates';
import { shortSiteName } from '../../prompts';
import { defaultFirebaseToolsOptions, DeployConfig, PathFactory, exec, spawn } from '../../utils';

const { readFile, rm, mkdir, writeFile, copyFile } = fsPromises;
const DEFAULT_DEV_PORT = 7811;

export const serve = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {

    const { startServer }: typeof import('next/dist/server/lib/start-server') = require(getProjectPath('node_modules/next/dist/server/lib/start-server'));

    // Spin up a server that listens, we'll proxy to this from Cloud Functions
    // This is needed because A) I've found Next dev server spin up in Cloud Functions to be
    // extremely unreliable, it keeps rebuilding and has a memory leak of some kind (though
    // maybe I'm doing things wrong) but B) most importantly Cloud Functions doesn't respond
    // to websockets & Next.js has moved their HMR implementation to that.
    const app = await startServer({
        allowRetry: false,
        dev: true,
        dir: getProjectPath(),
        hostname: '0.0.0.0',
        port: DEFAULT_DEV_PORT,
        // Override assetPrefix to allow HMR's websockets to bypass the Cloud Function proxy
        // another upside is this will reduce the log noise for firebase serve.
        // This won't be required once we're integrated with Firebase tools as we can proxy
        // all traffic including the websockets to the host.
        conf: { assetPrefix: `http://localhost:${DEFAULT_DEV_PORT}` }
    });

    const prepareApp = app.prepare();
    const buildResults = await build(config, app.port, getProjectPath);
    await prepareApp;

    const stop = () => app.close().catch(() => undefined);

    return { ...buildResults, stop };

}

export const build = async (config: DeployConfig | Required<DeployConfig>, devServerPort: number|undefined, getProjectPath: PathFactory) => {

    const dev = !!devServerPort;

    if (!dev) {
        const { default: nextBuild }: typeof import('next/dist/build') = require(getProjectPath('node_modules', 'next', 'dist', 'build'));
        await nextBuild(getProjectPath(), null, false, false, true);
        // TODO be a bit smarter about this
        await exec(`${getProjectPath('node_modules', '.bin', 'next')} export`, { cwd: getProjectPath() }).catch(() => {});
    }

    let nextConfig: NextConfig;
    try {
        const { default: loadConfig }: typeof import('next/dist/server/config') = require(getProjectPath('node_modules', 'next', 'dist', 'server', 'config'));
        const { PHASE_PRODUCTION_BUILD }: typeof import('next/constants') = require(getProjectPath('node_modules', 'next', 'constants'));
        nextConfig = await loadConfig(PHASE_PRODUCTION_BUILD, getProjectPath(), null);
    } catch(e) {
        // Must be Next 11, just import it
        nextConfig = await import(getProjectPath('next.config.js'));
    }

    // SEMVER these defaults are only needed for Next 11
    const { distDir='.next', basePath='' } = nextConfig;

    const deployPath = (...args: string[]) => config.dist ? join(config.dist, ...args) : getProjectPath('.deploy', ...args);
    const getHostingPath = (...args: string[]) => deployPath('hosting', ...basePath.split('/'), ...args);

    await rm(deployPath(), { recursive: true, force: true });

    if (!dev) {
        await mkdir(getHostingPath('_next', 'static'), { recursive: true });
    }

    let needsCloudFunction = !!config.function;
    const asyncSteps: Array<Promise<any>> = [];

    if (!dev) {
        const exportDetailJson = await readFile(getProjectPath(distDir, 'export-detail.json')).then(it => JSON.parse(it.toString()), () => { success: false });
        if (exportDetailJson.success) {
            needsCloudFunction = false;
            asyncSteps.push(exec(`cp -r ${exportDetailJson.outDirectory}/* ${getHostingPath()}`));
        } else {
            await exec(`cp -r ${getProjectPath('public')}/* ${getHostingPath()}`);
            await exec(`cp -r ${getProjectPath(distDir, 'static')} ${getHostingPath('_next')}`);

            // TODO clean this up, probably conflicts with the code blow
            const serverPagesDir = getProjectPath(distDir, 'server', 'pages');
            const htmlFiles = (await exec(`find ${serverPagesDir} -name '*.html'`) as string).split("\n").map(it => it.trim());
            await Promise.all(
                htmlFiles.map(async path => {
                    const newPath = getHostingPath(relative(serverPagesDir, path));
                    await mkdir(dirname(newPath), { recursive: true });
                    await copyFile(path, newPath);
                })
            );

            const prerenderManifestBuffer = await readFile(getProjectPath(distDir, 'prerender-manifest.json'));
            const prerenderManifest = JSON.parse(prerenderManifestBuffer.toString());
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
    }

    if (needsCloudFunction) {
        await mkdir(deployPath('functions'), { recursive: true });
        if (!dev) {
            asyncSteps.push(
                copyFile(getProjectPath('next.config.js'), deployPath('functions', 'next.config.js')),
                exec(`cp -r ${getProjectPath('public')} ${deployPath('functions', 'public')}`),
                exec(`cp -r ${getProjectPath(distDir)} ${deployPath('functions', distDir)}`),
            );
        }
    }

    if (!config.dist) asyncSteps.push(writeFile(deployPath('firebase.json'), await newFirebaseJson(config, distDir, dev, needsCloudFunction)));

    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    let firebaseProjectConfig = null;
    const { project, site } = config;
    if (project && site) {
        if (!config.dist) asyncSteps.push(writeFile(deployPath('.firebaserc'), newFirebaseRc(project, site)));
        // TODO check if firebase/auth is used
        const hasFirebaseDependency = !!packageJson.dependencies.firebase;
        if (needsCloudFunction && hasFirebaseDependency) {
            const { default: firebaseTools }: typeof import('firebase-tools') = require('firebase-tools');
            const { sites } = await firebaseTools.hosting.sites.list({
                project,
                ...defaultFirebaseToolsOptions(deployPath()),
            });
            const selectedSite = sites.find(it => shortSiteName(it) === site);
            if (selectedSite) {
                const { appId } = selectedSite;
                if (appId) {
                    const result = await firebaseTools.apps.sdkconfig('web', appId, defaultFirebaseToolsOptions(deployPath()));
                    firebaseProjectConfig = result.sdkConfig;
                } else {
                    console.warn(`No Firebase app associated with site ${site}, unable to provide authenticated server context`);
                }
            }
        }
    }

    if (needsCloudFunction) {
        asyncSteps.push(
            copyFile(getProjectPath('package-lock.json'), deployPath('functions', 'package-lock.json')).catch(() => {}),
            copyFile(getProjectPath('yarn.lock'), deployPath('functions', 'yarn.lock')).catch(() => {}),
            writeFile(deployPath('functions', 'package.json'), newPackageJson(packageJson, dev)),
            writeFile(deployPath('functions', 'server.js'), newServerJs(config, devServerPort, firebaseProjectConfig)),
        );
    }

    await Promise.all(asyncSteps);

    if (needsCloudFunction) {
        // TODO add to the firebaseTools log
        await spawn('npm', ['i', '--prefix', deployPath('functions'), '--only', 'production'], {}, stdoutChunk => {
            console.log(stdoutChunk.toString());
        }, errChunk => {
            console.error(errChunk.toString());
        });
    }

    return { usingCloudFunctions: needsCloudFunction };
}