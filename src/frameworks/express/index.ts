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
import { join } from 'path';

import { DeployConfig, PathFactory, exec, spawn } from '../../utils';

const { readFile, rm, mkdir, copyFile } = fsPromises;

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
        const entry = packageJson.name;
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
        bootstrapScript += `exports.handle = async (req, res) => (await bootstrap)${method ? `.${method}` : ''}(req, res);`;
    }

    const deployPath = (...args: string[]) => config.dist ? join(config.dist, ...args) : getProjectPath('.deploy', ...args);
    const getHostingPath = (...args: string[]) => deployPath('hosting', ...args);

    if (serverRenderMethod) {
        await mkdir(deployPath('functions'), { recursive: true });
    }

    await mkdir(getHostingPath(), { recursive: true });

    if (packageJson.directories?.serve) {
        await exec(`cp -r ${getProjectPath(packageJson.directories.serve, '*')} ${deployPath('hosting')}`);
    }

    if (serverRenderMethod) {
        const npmPackResults = JSON.parse(await exec(`npm pack ${getProjectPath()} --json`, { cwd: deployPath('functions')}) as string);
        const matchingPackResult = npmPackResults.find((it: any) => it.name === packageJson.name);
        const { filename } = matchingPackResult;
        packageJson.dependencies ||= {};
        packageJson.dependencies[packageJson.name] = `file:${filename}`;
    }

    return { usingCloudFunctions: !!serverRenderMethod, framework: 'express', rewrites: [], redirects: [], headers: [], packageJson, bootstrapScript };
}