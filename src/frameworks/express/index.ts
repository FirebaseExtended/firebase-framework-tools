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

    const functionsSpinner = ora('Building Firebase project').start();


    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    if (packageJson.scripts?.build) {
        // TODO spawn so we can log
        await exec(`npm --prefix ${getProjectPath()} run build`);
    }

    // TODO turn this into an import
    const findRenderFunction = async (method: string[]=[], entry?: any): Promise<string[]|undefined> => {
        const allowRecursion = !entry;
        entry ||= await (async () => {
            try {
                const requiredProject = require(getProjectPath());
                if (requiredProject) method = ['require', `./${packageJson.main || 'index.js'}`];
                return requiredProject;
            } catch(e) {
                const importedProject = await import(getProjectPath()).catch(() => undefined);
                if (importedProject) method = ['import', `./${packageJson.main || 'index.js'}`];
                return importedProject;
            }
        })();
        if (!entry) return undefined;
        const { default: defaultExport, render, app, handle } = entry;
        if (typeof render === 'function') return [...method, 'render'];
        if (typeof handle === 'function') return [...method, 'handle'];
        if (typeof app === 'function') {
            try {
                const express = app();
                if (typeof express.render === 'function') return [...method, 'app'];
            } catch(e) { }
        }
        if (!allowRecursion) return undefined;
        if (typeof defaultExport === 'object') {
            if (typeof defaultExport.then === 'function') {
                const awaitedDefaultExport = await defaultExport;
                return findRenderFunction([...method, 'await default'], awaitedDefaultExport);
            } else {
                return findRenderFunction([...method, 'default'], defaultExport);
            }
        }
        return undefined;
    };
    const render = await findRenderFunction();
    console.log('express app', render);

    const deployPath = (...args: string[]) => getProjectPath('.deploy', ...args);
    const getHostingPath = (...args: string[]) => deployPath('hosting', ...args);

    await rm(getHostingPath(), { recursive: true, force: true });
    await rm(deployPath('functions'), { recursive: true, force: true });

    await mkdir(deployPath('functions'), { recursive: true });
    await mkdir(getHostingPath(), { recursive: true });

    if (packageJson.directories?.serve) {
        await exec(`cp -r ${getProjectPath(packageJson.directories.serve, '*')} ${deployPath('hosting')}`);
    }

    let firebaseProjectConfig = null;
    const { project, site } = config;
    if (project && site) {
        await writeFile(deployPath('.firebaserc'), newFirebaseRc(project, site));
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
        copyFile(getProjectPath('package-lock.json'), deployPath('functions', 'package-lock.json')).catch(() => {}),
        copyFile(getProjectPath('yarn.lock'), deployPath('functions', 'yarn.lock')).catch(() => {}),
        newPackageJson(packageJson, dev, getProjectPath).then(json => writeFile(deployPath('functions', 'package.json'), json)),
        writeFile(deployPath('functions', 'server.js'), newServerJs(config, dev, firebaseProjectConfig, '')),
        writeFile(deployPath('firebase.json'), await newFirebaseJson(config, dev)),
    ]);

    functionsSpinner.succeed();

    const npmSpinner = ora('Installing NPM dependencies').start();
    await exec(`npm i --prefix ${deployPath('functions')} --only=production`);
    npmSpinner.succeed();
}