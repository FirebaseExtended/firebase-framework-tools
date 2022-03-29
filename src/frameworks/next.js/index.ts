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
import { dirname, join } from 'path';
import firebaseTools from 'firebase-tools';
import { getProjectDir } from 'next/dist/lib/get-project-dir';
import loadConfig from 'next/dist/server/config';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
// import nextBuild from 'next/dist/build';

import { newServerJs, newPackageJson, newFirebaseJson, newFirebaseRc } from './templates';
import { shortSiteName } from '../../prompts';
import { defaultFirebaseToolsOptions, DeployConfig, PathFactory, spawn, exec } from '../../utils';

const { readFile, rm, mkdir, writeFile, copyFile } = fsPromises;

export const build = async (config: DeployConfig | Required<DeployConfig>, dev: boolean, getProjectPath: PathFactory) => {

    const cwd = getProjectDir(getProjectPath());
    const nextConfig = await loadConfig(PHASE_PRODUCTION_BUILD, cwd, null);

    if (!dev) {
        // Having trouble running next build in a different directory, looks like tsConfig isn't coming through, etc.
        // await nextBuild(cwd, null, false, false, true);
        // anyway, this will let me do some logging and such
        const title = 'Building Next.js application'
        const nextSpinner = ora(title).start();
        const allEntries: Array<string> = [];
        const errEntries: Array<string> = [];
        const paddedEntry = (entry: string) => entry.trim().split("\n").map(it => `  ${it}`).join("\n");
        let lastPaddedEntry = '';
        const log = (out: any) => {
            const entry: string = out.toString();
            allEntries.push(entry);
            lastPaddedEntry = paddedEntry(entry);
            nextSpinner.text = `${title}\n${lastPaddedEntry}`;
        };
        const logErr = (out:any) => {
            errEntries.push(paddedEntry(out.toString()));
            log(out);
        }
        await spawn('npx', ['next', 'build'], { cwd }, log, logErr).then(
            () => {
                if (errEntries.length) {
                    nextSpinner.text = `${title}\n\n${errEntries.join("\n")}\n\n${lastPaddedEntry}\n`;
                    nextSpinner.warn();
                } else {
                    nextSpinner.text = `${title}\n\n${lastPaddedEntry}\n`;
                    nextSpinner.succeed();
                }
            },
            e => {
                nextSpinner.text = title;
                nextSpinner.fail();
                console.log(allEntries.join("\n"));
                throw e;
            }
        );
    }

    const functionsSpinner = ora('Building Firebase project').start();
    const { distDir, basePath } = nextConfig;

    const deployPath = (...args: string[]) => getProjectPath('.deploy', ...args);

    await rm(deployPath('functions', 'public'), { recursive: true, force: true });
    await rm(deployPath('functions', distDir), { recursive: true, force: true });
    await mkdir(deployPath('functions'), { recursive: true });

    const getHostingPath = (...args: string[]) => deployPath('hosting', ...basePath.split('/'), ...args);

    await rm(getHostingPath(), { recursive: true, force: true });

    if (!dev) {
        await mkdir(getHostingPath('_next', 'static'), { recursive: true });
    }

    const conditionalSteps = dev ? [] : [
        //exec(`npx next export -o ${deployPath('hosting', ...basePath.split('/'))} -s ${getProjectPath()}`),
        copyFile(getProjectPath('next.config.js'), deployPath('functions', 'next.config.js')),
        // TODO don't shell out, needs to work in windows
        exec(`cp -r ${getProjectPath('public')} ${deployPath('functions', 'public')}`),
        exec(`cp -r ${getProjectPath('public')}/* ${getHostingPath()}`),
        exec(`cp -r ${getProjectPath(distDir)} ${deployPath('functions', distDir)}`),
        exec(`cp -r ${getProjectPath(distDir, 'static')} ${getHostingPath('_next')}`),
        copyFile(getProjectPath(distDir, 'server', 'pages', '404.html'), getHostingPath('404.html')).catch(() => {}),
        copyFile(getProjectPath(distDir, 'server', 'pages', '500.html'), getHostingPath('500.html')).catch(() => {}),
    ];

    if (!dev) {
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
            conditionalSteps.push(moveHTML);
            conditionalSteps.push(moveData);
        });
    }

    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    let firebaseProjectConfig = null;
    const { project, site } = config;
    if (project && site) {
        conditionalSteps.push(writeFile(deployPath('.firebaserc'), newFirebaseRc(project, site)));
        // TODO check if firebase/auth is used
        const hasFirebaseDependency = !!packageJson.dependencies.firebase;
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
        writeFile(deployPath('functions', 'package.json'), newPackageJson(packageJson, dev)),
        writeFile(deployPath('functions', 'server.js'), newServerJs(config, dev, firebaseProjectConfig)),
        writeFile(deployPath('firebase.json'), await newFirebaseJson(config, distDir, dev)),
    ]);

    functionsSpinner.succeed();

    const npmSpinner = ora('Installing NPM dependencies').start();
    await exec(`npm i --prefix ${deployPath('functions')} --only=production`);
    npmSpinner.succeed();
}