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
import { dirname, join, relative } from 'path';
import firebaseTools from 'firebase-tools';

import { newServerJs, newPackageJson, newFirebaseJson, newFirebaseRc } from './templates';
import { shortSiteName } from '../../prompts';
import { defaultFirebaseToolsOptions, DeployConfig, PathFactory, exec } from '../../utils';
import type { NextConfig } from 'next/dist/server/config-shared';

const { readFile, rm, mkdir, writeFile, copyFile } = fsPromises;

export const build = async (config: DeployConfig | Required<DeployConfig>, dev: boolean, getProjectPath: PathFactory) => {

    const { default: nextBuild }: typeof import('next/dist/build') = require(getProjectPath('node_modules', 'next', 'dist', 'build'));

    if (!dev) {
        await nextBuild(getProjectPath(), null, false, false, true);
        // TODO be a bit smarter about this
        await exec(`${getProjectPath('node_modules', '.bin', 'next')} export`).catch(() => {});
    }

    const functionsSpinner = ora('Building Firebase project').start();

    let nextConfig: NextConfig;
    try {
        const { default: loadConfig }: typeof import('next/dist/server/config') = require(getProjectPath('node_modules', 'next', 'dist', 'server', 'config'));
        const { PHASE_PRODUCTION_BUILD }: typeof import('next/constants') = require(getProjectPath('node_modules', 'next', 'constants'));
        nextConfig = await loadConfig(PHASE_PRODUCTION_BUILD, getProjectPath(), null);
    } catch(e) {
        nextConfig = await import(getProjectPath('next.config.js'));
    }
    const { distDir='.next', basePath='' } = nextConfig;

    const deployPath = (...args: string[]) => getProjectPath('.deploy', ...args);
    const getHostingPath = (...args: string[]) => deployPath('hosting', ...basePath.split('/'), ...args);

    await rm(deployPath(), { recursive: true, force: true });

    if (!dev) {
        await mkdir(getHostingPath('_next', 'static'), { recursive: true });
    }

    let needsCloudFunction = true;
    const asyncSteps: Array<Promise<any>> = [];

    const exportDetailJson = await readFile(getProjectPath(distDir, 'export-detail.json')).then(it => JSON.parse(it.toString()), () => { success: false });
    if (exportDetailJson.success) {
        needsCloudFunction = false;
        if (!dev) asyncSteps.push(exec(`cp -r ${exportDetailJson.outDirectory}/* ${getHostingPath()}`));
    } else if (!dev) {
        asyncSteps.push(
            exec(`cp -r ${getProjectPath('public')}/* ${getHostingPath()}`),
            exec(`cp -r ${getProjectPath(distDir, 'static')} ${getHostingPath('_next')}`),
        )
    }

    if (needsCloudFunction) {
        await mkdir(deployPath('functions'), { recursive: true });
        if (!dev) {
            asyncSteps.push(
                copyFile(getProjectPath('next.config.js'), deployPath('functions', 'next.config.js')),
                exec(`cp -r ${getProjectPath('public')} ${deployPath('functions', 'public')}`),
                exec(`cp -r ${getProjectPath(distDir)} ${deployPath('functions', distDir)}`),
            );
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

    asyncSteps.push(writeFile(deployPath('firebase.json'), await newFirebaseJson(config, distDir, dev, needsCloudFunction)));

    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    let firebaseProjectConfig = null;
    const { project, site } = config;
    if (project && site) {
        asyncSteps.push(writeFile(deployPath('.firebaserc'), newFirebaseRc(project, site)));
        // TODO check if firebase/auth is used
        const hasFirebaseDependency = !!packageJson.dependencies.firebase;
        if (needsCloudFunction && hasFirebaseDependency) {
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

    if (needsCloudFunction) {
        asyncSteps.push(
            copyFile(getProjectPath('package-lock.json'), deployPath('functions', 'package-lock.json')).catch(() => {}),
            copyFile(getProjectPath('yarn.lock'), deployPath('functions', 'yarn.lock')).catch(() => {}),
            writeFile(deployPath('functions', 'package.json'), newPackageJson(packageJson, dev)),
            writeFile(deployPath('functions', 'server.js'), newServerJs(config, dev, firebaseProjectConfig)),
        );
    }

    await Promise.all(asyncSteps);

    functionsSpinner.succeed();

    if (needsCloudFunction) {
        const npmSpinner = ora('Installing NPM dependencies').start();
        await exec(`npm i --prefix ${deployPath('functions')} --only=production`);
        npmSpinner.succeed();
    }

    return { cloudFunctions: needsCloudFunction };
}