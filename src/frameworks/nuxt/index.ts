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
import ora from 'ora';
import firebaseTools from 'firebase-tools';

import { newServerJs, newPackageJson, newFirebaseJson, newFirebaseRc } from './templates';
import { shortSiteName } from '../../prompts';
import { defaultFirebaseToolsOptions, DeployConfig, PathFactory, exec } from '../../utils';
import { join } from 'path';

const { readFile, rm, mkdir, writeFile, copyFile } = fsPromises;

export const serve = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {
    const buildResults = await build(config, undefined, getProjectPath);
    return { ...buildResults, stop: () => Promise.resolve() };
}

export const build = async (config: DeployConfig | Required<DeployConfig>, devServerPort: number|undefined, getProjectPath: PathFactory) => {

    const dev = !!devServerPort;

    const nuxt = await (async () => {
        try {
            return require(getProjectPath('node_modules', 'nuxt'));
        } catch(e) {
            const { loadNuxt, build }: typeof import('nuxt3/dist') = await import(getProjectPath('node_modules', 'nuxt3', 'dist', 'index.mjs'));
            const { loadNuxtConfig }: typeof import('@nuxt/kit') = await import(getProjectPath('node_modules', '@nuxt', 'kit', 'dist', 'index.mjs'));
            return { loadNuxt, build, loadNuxtConfig, isNuxt3: true };
        }
    })();
    const isNuxt3 = !!nuxt.isNuxt3;

    const { loadNuxt, build: buildNuxt } = nuxt;
    const { loadNuxtConfig } = nuxt;

    const nuxtApp = await loadNuxt({
        for: 'build',
        cwd: getProjectPath(),
        rootDir: getProjectPath(),
        overrides: { nitro: { preset: 'node' } },
    });

    const nuxtConfig = await loadNuxtConfig({
        cwd: getProjectPath(),
        rootDir: getProjectPath(),
    });

    await buildNuxt(nuxtApp);

    const functionsSpinner = ora('Building Firebase project').start();

    const baseURL = isNuxt3 ? nuxtConfig.app.baseURL : '';
    const buildAssetsDir = isNuxt3 ? nuxtConfig.app.buildAssetsDir : '_nuxt';
    const distDir = isNuxt3 ? '.output' : join('.nuxt', 'dist');

    const deployPath = (...args: string[]) => getProjectPath('.deploy', ...args);

    const getHostingPath = (...args: string[]) => deployPath('hosting', ...baseURL.split('/'), ...args);

    await rm(deployPath(), { recursive: true, force: true });

    await mkdir(deployPath('functions'), { recursive: true });
    await mkdir(getHostingPath(buildAssetsDir), { recursive: true });

    if (isNuxt3) {
        await exec(`cp -r ${getProjectPath(distDir, 'server', '*')} ${deployPath('functions')}`);
        await exec(`cp -r ${getProjectPath(distDir, 'public', '*')} ${deployPath('hosting')}`);
    } else {
        await exec(`cp -r ${getProjectPath(distDir, '..')} ${deployPath('functions')}`);
        await exec(`cp -r ${getProjectPath(distDir, 'client', '*')} ${deployPath('hosting', buildAssetsDir)}`);
        await exec(`cp -r ${getProjectPath('static', '*')} ${deployPath('hosting')}`);
    }

    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    const conditionalSteps = [];

    let firebaseProjectConfig = null;
    const { project, site } = config;
    if (project && site) {
        conditionalSteps.push(writeFile(deployPath('.firebaserc'), newFirebaseRc(project, site)));
        // TODO check if firebase/auth is used
        const hasFirebaseDependency = !!packageJson.dependencies?.firebase;
        if (hasFirebaseDependency) {
            const { sites } = await firebaseTools.hosting.sites.list({
                project,
                ...defaultFirebaseToolsOptions(getProjectPath('.deploy')),
            });
            const selectedSite = sites.find(it => shortSiteName(it) === site);
            if (selectedSite) {
                const { appId } = selectedSite;
                if (appId) {
                    const result = await firebaseTools.apps.sdkconfig('web', appId, defaultFirebaseToolsOptions(getProjectPath('.deploy')));
                    firebaseProjectConfig = result.sdkConfig;
                } else {
                    // TODO allow them to choose
                    ora(`No Firebase app associated with site ${site}, unable to provide authenticated server context`).start().warn();
                }
            }
        }
    }

    await Promise.all([
        ...conditionalSteps,
        copyFile(getProjectPath('package-lock.json'), deployPath('functions', 'package-lock.json')).catch(() => {}),
        copyFile(getProjectPath('yarn.lock'), deployPath('functions', 'yarn.lock')).catch(() => {}),
        newPackageJson(packageJson, dev, getProjectPath).then(json => writeFile(deployPath('functions', 'package.json'), json)),
        writeFile(deployPath('functions', 'server.js'), newServerJs(config, dev, firebaseProjectConfig, isNuxt3)),
        writeFile(deployPath('firebase.json'), await newFirebaseJson(config, distDir, dev)),
    ]);

    functionsSpinner.succeed();

    const npmSpinner = ora('Installing NPM dependencies').start();
    await exec(`npm i --prefix ${deployPath('functions')} --only=production`);
    npmSpinner.succeed();

    return { usingCloudFunctions: true };
}