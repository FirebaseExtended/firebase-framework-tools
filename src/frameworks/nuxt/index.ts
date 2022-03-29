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

const { readFile, rm, mkdir, writeFile, copyFile } = fsPromises;

export const build = async (config: DeployConfig | Required<DeployConfig>, dev: boolean, getProjectPath: PathFactory) => {

    const { build: buildNuxt, loadNuxt } = await import('nuxt3');
    const { loadNuxtConfig } = await import('@nuxt/kit');

    const nuxt = await loadNuxt({
        cwd: getProjectPath(),
        overrides: { nitro: { preset: 'node' } },
    });

    await buildNuxt(nuxt);

    const nuxtConfig = await loadNuxtConfig({
        cwd: getProjectPath(),
    });

    const functionsSpinner = ora('Building Firebase project').start();
    const { app: { baseURL, buildAssetsDir } } = nuxtConfig;

    // TODO should this be hardcoded? I can't find reference to it
    const buildDir = '.output';

    const deployPath = (...args: string[]) => getProjectPath('.deploy', ...args);

    const getHostingPath = (...args: string[]) => deployPath('hosting', ...baseURL.split('/'), ...args);

    await rm(getHostingPath(), { recursive: true, force: true });
    await rm(deployPath('functions'), { recursive: true, force: true });

    await mkdir(deployPath('functions'), { recursive: true });
    await mkdir(getHostingPath(buildAssetsDir), { recursive: true });

    await exec(`cp -r ${getProjectPath(buildDir, 'server', '*')} ${deployPath('functions')}`);
    await exec(`cp -r ${getProjectPath(buildDir, 'public', '*')} ${deployPath('hosting')}`);

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
        copyFile(getProjectPath('package-lock.json'), deployPath('functions', 'package-lock.json')),
        newPackageJson(packageJson, dev, getProjectPath).then(json => writeFile(deployPath('functions', 'package.json'), json)),
        writeFile(deployPath('functions', 'server.js'), newServerJs(config, dev, firebaseProjectConfig)),
        writeFile(deployPath('firebase.json'), await newFirebaseJson(config, buildDir, dev)),
    ]);

    functionsSpinner.succeed();

    const npmSpinner = ora('Installing NPM dependencies').start();
    await exec(`npm i --prefix ${deployPath('functions')} --only=production`);
    npmSpinner.succeed();
}