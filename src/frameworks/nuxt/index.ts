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

import { promises as fsPromises } from 'fs'

import { newServerJs, newPackageJson, newFirebaseJson, newFirebaseRc } from './templates';
import { shortSiteName } from '../../prompts';
import { defaultFirebaseToolsOptions, DeployConfig, PathFactory, exec, spawn } from '../../utils';
import { join } from 'path';

const { readFile, rm, mkdir, writeFile, copyFile } = fsPromises;
const DEFAULT_DEV_PORT = 7812;

let _nuxt;
const getNuxt = async (getProjectPath: PathFactory): Promise<typeof import('@nuxt/kit')> => _nuxt ||= await (async () => {
    try {
        const nuxt = require(getProjectPath('node_modules', 'nuxt'));
        return {
            ...nuxt,
            buildNuxt: nuxt.build,
            isNuxt3: () => false,
            getNuxtVersion: () => nuxt.Nuxt.version.split('v')[1],
        }
    } catch(e) {
        return {
            ...(await import(getProjectPath('node_modules', '@nuxt', 'kit', 'dist', 'index.mjs'))),
            // Simplify until we can pass the app to serve, isNuxt3 requires an app be passed
            // though unsure if we even need to do this Next.js style, perhaps we can serve directly
            isNuxt3: () => true,
        }
    }
})();

export const serve = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {

    const { loadNuxt, buildNuxt } = await getNuxt(getProjectPath);

    // as any to load in Nuxt2 options
    // Spin up a dev server and listen, this might not be strictly nessisary as it is in Next.js
    // This command seems unreliable on Nuxt3... perhaps we should pull in Nuxi or just fork?
    const nuxtApp = await loadNuxt({
        for: 'dev',
        dev: true,
        ready: true,
        cwd: getProjectPath(),
        rootDir: getProjectPath(),
        // Overrides is respected in Nuxt3
        // Bypass the Cloud Functions proxy, AFAIK Nuxt3 still usings SSE for it's HMR but
        // if they switch to websockets this will just work.
        overrides: { app: { baseURL: `http://localhost:${DEFAULT_DEV_PORT}/` } },
    } as any);

    await buildNuxt(nuxtApp);

    await nuxtApp.ready();
    // port is only respected in Nuxt3
    const { url } = await nuxtApp.server.listen({
        port: DEFAULT_DEV_PORT,
    });
    const { port } = new URL(url);

    const stop = () => nuxtApp.close().catch(() => undefined);

    const buildResults = await build(config, parseInt(port, 10), getProjectPath);
    return { ...buildResults, stop };
}

export const build = async (config: DeployConfig | Required<DeployConfig>, devServerPort: number|undefined, getProjectPath: PathFactory) => {

    const dev = !!devServerPort;

    const { loadNuxt, isNuxt3, buildNuxt, loadNuxtConfig } = await getNuxt(getProjectPath);

    if (!dev) {

        const nuxtApp = await loadNuxt({
            for: 'build',
            cwd: getProjectPath(),
            rootDir: getProjectPath(),
            overrides: { nitro: { preset: 'node' } },
        } as any);

        await buildNuxt(nuxtApp);

    }

    const nuxtConfig = await loadNuxtConfig({
        cwd: getProjectPath(),
        rootDir: getProjectPath(),
    } as any);

    const baseURL = isNuxt3() ? nuxtConfig.app.baseURL : '';
    const buildAssetsDir = isNuxt3() ? nuxtConfig.app.buildAssetsDir : '_nuxt';
    const distDir = isNuxt3() ? '.output' : join('.nuxt', 'dist');

    const deployPath = (...args: string[]) => config.dist ? join(config.dist, ...args) : getProjectPath('.deploy', ...args);

    const getHostingPath = (...args: string[]) => deployPath('hosting', ...baseURL.split('/'), ...args);

    await rm(deployPath(), { recursive: true, force: true });

    // TODO also check Nuxt's settings
    const needsCloudFunction = !!config.function;
    await mkdir(deployPath('functions'), { recursive: true });
    await mkdir(getHostingPath(buildAssetsDir), { recursive: true });

    if (!dev) {
        if (isNuxt3()) {
            if (needsCloudFunction) {
                await exec(`cp -r ${getProjectPath(distDir, 'server', '*')} ${deployPath('functions')}`);
            }
            await exec(`cp -r ${getProjectPath(distDir, 'public', '*')} ${deployPath('hosting')}`);
        } else {
            if (needsCloudFunction) {
                await exec(`cp -r ${getProjectPath(distDir, '..')} ${deployPath('functions')}`);
            }
            await exec(`cp -r ${getProjectPath(distDir, 'client', '*')} ${deployPath('hosting', buildAssetsDir)}`);
            await exec(`cp -r ${getProjectPath('static', '*')} ${deployPath('hosting')}`);
        }
    }

    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    let firebaseProjectConfig = null;
    const { project, site } = config;
    if (project && site) {
        if (!config.dist) {
            await writeFile(deployPath('.firebaserc'), newFirebaseRc(project, site));
        }
        // TODO check if firebase/auth is used
        const hasFirebaseDependency = !!packageJson.dependencies?.firebase;
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
                    // TODO add color yellow, maybe prompt?
                    console.warn(`No Firebase app associated with site ${site}, unable to provide authenticated server context`);
                }
            }
        }
    }

    if (!config.dist) {
        await writeFile(deployPath('firebase.json'), await newFirebaseJson(config, distDir, dev));
    }

    if (needsCloudFunction) {
        await Promise.all([
            copyFile(getProjectPath('package-lock.json'), deployPath('functions', 'package-lock.json')).catch(() => {}),
            copyFile(getProjectPath('yarn.lock'), deployPath('functions', 'yarn.lock')).catch(() => {}),
            newPackageJson(packageJson, dev, getProjectPath).then(json => writeFile(deployPath('functions', 'package.json'), json)),
            writeFile(deployPath('functions', 'server.js'), newServerJs(config, devServerPort, firebaseProjectConfig, isNuxt3())),
        ]);
    }

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