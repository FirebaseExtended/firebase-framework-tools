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
import { DeployConfig, exec, PathFactory } from '../../utils';

const { readFile, rm, mkdir, writeFile, copyFile } = fsPromises;

import { newServerJs, newPackageJson, newFirebaseJson, newFirebaseRc, Manifest } from './templates';

export const build = async (config: DeployConfig | Required<DeployConfig>, dev: boolean, getProjectPath: PathFactory) => {

    if (!dev) {
        const nextSpinner = ora('Building Next.js application').start();
        await exec(`npm --prefix ${getProjectPath()} run build`);
        nextSpinner.succeed();
    }

    const functionsSpinner = ora('Building Firebase project').start();
    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    const nextConfig: Manifest = await import(getProjectPath('next.config.js')).catch(() => undefined);
    if (!nextConfig) throw 'No next.config.js found.';
    const { distDir='.next', basePath='.' } = nextConfig;

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
        copyFile(getProjectPath(distDir, 'server', 'pages', '404.html'), getHostingPath('404.html')),
        copyFile(getProjectPath(distDir, 'server', 'pages', '500.html'), getHostingPath('500.html')),
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

    const { project, site} = config;
    if (project && site) {
        conditionalSteps.push(writeFile(deployPath('.firebaserc'), newFirebaseRc(project, site)));
    }

    await Promise.all([
        ...conditionalSteps,
        copyFile(getProjectPath('package-lock.json'), deployPath('functions', 'package-lock.json')),
        writeFile(deployPath('functions', 'package.json'), newPackageJson(packageJson, dev)),
        writeFile(deployPath('functions', 'server.js'), newServerJs(config, dev)),
        writeFile(deployPath('firebase.json'), await newFirebaseJson(config, distDir, dev)),
    ]);

    functionsSpinner.succeed();

    const npmSpinner = ora('Installing NPM dependencies').start();
    await exec(`npm i --prefix ${deployPath('functions')} --only=production`);
    npmSpinner.succeed();
}