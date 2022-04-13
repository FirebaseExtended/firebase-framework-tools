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
import { dirname, join } from 'path';

import { newServerJs, newPackageJson} from './templates';
import { shortSiteName } from '../../utils';
import { defaultFirebaseToolsOptions, DeployConfig, PathFactory, exec, spawn } from '../../utils';

const { readFile, rm, mkdir, writeFile, copyFile } = fsPromises;

export const build = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {

    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    if (packageJson.scripts?.build) {
        // TODO add to the firebaseTools logs
        await spawn('npm', ['--prefix', getProjectPath(), 'run', 'build'], {}, stdoutChunk => {
            console.log(stdoutChunk.toString());
        }, errChunk => {
            console.error(errChunk.toString());
        });
    }

    const findServerRenderMethod = async (method: string[]=[], entry?: any): Promise<string[]|undefined> => {
        if (!config.function) return undefined;
        const allowRecursion = !entry;
        entry ||= await (async () => {
            try {
                const requiredProject = require(getProjectPath());
                if (requiredProject) method = ['require'];
                return requiredProject;
            } catch(e) {
                const importedProject = await import(getProjectPath()).catch(() => undefined);
                if (importedProject) method = ['import'];
                return importedProject;
            }
        })();
        if (!entry) return undefined;
        const { default: defaultExport, app, handle } = entry;
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
                return findServerRenderMethod([...method, 'default'], awaitedDefaultExport);
            } else {
                return findServerRenderMethod([...method, 'default'], defaultExport);
            }
        }
        return undefined;
    };
    const serverRenderMethod = await findServerRenderMethod();

    let bootstrapScript = '';
    if (serverRenderMethod) {
        let stack = serverRenderMethod.slice();
        const entry = `./${packageJson.main || 'index.js'}`;
        if (stack.shift() === 'require') {
            bootstrapScript += `const bootstrap = Promise.resolve(require('${entry}'))`;
        } else {
            bootstrapScript += `const bootstrap = import('${entry}')`;
        }
        if (stack[0] === 'default') {
            stack.shift();
            bootstrapScript += '.then(({ default }) => default)';
        }
        if (stack[0] === 'app') {
            stack.shift();
            bootstrapScript += '.then(({ app }) => app())';
        }
        bootstrapScript += ';\n';
        const method = stack.shift();
        bootstrapScript += `const handle = async (req, res) => (await bootstrap)${method ? `.${method}` : ''}(req, res);`;
    }

    const deployPath = (...args: string[]) => config.dist ? join(config.dist, ...args) : getProjectPath('.deploy', ...args);
    const getHostingPath = (...args: string[]) => deployPath('hosting', ...args);

    await rm(deployPath(), { recursive: true, force: true });

    if (serverRenderMethod) {
        await mkdir(deployPath('functions'), { recursive: true });
    }

    await mkdir(getHostingPath(), { recursive: true });

    if (packageJson.directories?.serve) {
        await exec(`cp -r ${getProjectPath(packageJson.directories.serve, '*')} ${deployPath('hosting')}`);
    }

    let firebaseProjectConfig = null;
    const { project, site } = config;
    if (project && site) {
        // TODO check if firebase/auth is used
        const hasFirebaseDependency = !!packageJson.dependencies?.firebase;
        if (serverRenderMethod && hasFirebaseDependency) {
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
                    // TODO allow them to choose
                    console.warn(`No Firebase app associated with site ${site}, unable to provide authenticated server context`);
                }
            }
        }
    }

    if (serverRenderMethod) {
        const npmPackResults = JSON.parse(await exec(`npm pack ${getProjectPath()} --dry-run --json`) as string);

        await Promise.all(
            // TODO types
            npmPackResults.
                find(({ name }: any) => name === packageJson.name ).
                files.
                map(({ path }: any) =>
                    mkdir(dirname(deployPath('functions', path)), { recursive: true }).then(() =>
                        copyFile(getProjectPath(path), deployPath('functions', path))
                    )
                )
        );
        await Promise.all([
            copyFile(getProjectPath('package-lock.json'), deployPath('functions', 'package-lock.json')).catch(() => {}),
            copyFile(getProjectPath('yarn.lock'), deployPath('functions', 'yarn.lock')).catch(() => {}),
            newPackageJson(packageJson, getProjectPath).then(json => writeFile(deployPath('functions', 'package.json'), json)),
            writeFile(deployPath('functions', 'server.js'), newServerJs(config, firebaseProjectConfig, bootstrapScript)),
        ]);

        // TODO add to the firebaseTools log
        await spawn('npm', ['i', '--prefix', deployPath('functions'), '--only', 'production'], {}, stdoutChunk => {
            console.log(stdoutChunk.toString());
        }, errChunk => {
            console.error(errChunk.toString());
        });
    }

    return { usingCloudFunctions: !!serverRenderMethod };
}