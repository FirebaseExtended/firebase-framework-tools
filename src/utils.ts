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

import { exec as execCallback, spawn as spawnCallback, ExecOptions, SpawnOptionsWithoutStdio, spawnSync } from 'child_process';
import { dirname, join, relative, resolve, sep } from 'path';
import { lt } from 'semver';
import { NormalModuleReplacementPlugin } from 'webpack';
import { MIN_FIREBASE_SDK_FOR_AUTH } from './constants';

export const exec = (command: string, options: ExecOptions={}) => new Promise((resolve, reject) =>
    execCallback(command, options, (error, stdout) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(stdout.trim());
    })
);

export const spawn = (
    command: string,
    args: readonly string[] | undefined=undefined,
    options?: SpawnOptionsWithoutStdio | undefined,
    stdoutCallback?: (chunk: any) => void,
    stderrCallback?: (chunk: any) => void,
) => new Promise<void>((resolve, reject) => {
    const child = spawnCallback(command, args, {
        ...options,
        stdio: 'pipe',
    }).on('close', (code) => {
        if (code === 0) {
            resolve();
        } else {
            reject();
        }
    });
    if (stdoutCallback) child.stdout.on('data', stdoutCallback);
    if (stderrCallback) child.stderr.on('data', stderrCallback);
});

export type DeployConfig = {
    dist: string,
    prefix?: string,
    project?: string ,
    site?: string,
    function?: {
        name: string,
        region: string,
    };
};

export type PathFactory = (...args: string[]) => string;

export const getProjectPathFactory = (config: DeployConfig): PathFactory => (...args) => join(process.cwd(), config.prefix ?? '.', ...args);

export const findDependency = (name: string, cwd=process.cwd()) => {
    const result = spawnSync('npm', ['list', name, '--json', '--omit', 'dev'], { cwd });
    if (!result.stdout) return undefined;
    const json = JSON.parse(result.stdout.toString());
    const search = (searchingFor: string, dependencies={}): any => {
        for (const [name, dependency] of Object.entries(dependencies as Record<string, Record<string, any>>)) {
            if (name === searchingFor && dependency.resolved) return dependency;
            const result = search(searchingFor, dependency.dependencies);
            if (result) return result;
        }
        return null;
    }
    return search(name, json.dependencies);
}

export const getWebpackPlugin = (cwd: string) => new NormalModuleReplacementPlugin(/^firebase\/(auth)$/, (resource: any) => {
    // Don't allow firebase-frameworks to recurse
    const frameworksRoot = resolve(`${dirname(require.resolve('.'))}${sep}..`);
    if (resource.context.startsWith(frameworksRoot)) return;
    // Don't mutate their node_modules
    if (relative(cwd, resource.context).startsWith(`node_modules${sep}`)) return;
    const client = resource.request.split('firebase/')[1];
    const firebaseDependency = findDependency('firebase', cwd);
    // auth requires beforeAuthStateChanged, released in 9.8.0
    if (client === 'auth' && lt(firebaseDependency.version, MIN_FIREBASE_SDK_FOR_AUTH)) return;
    // TODO log to the firebase.log
    console.log(`Substituting import of '${resource.request}' with 'firebase-frameworks/client/${client}' in ${relative(cwd, resource.context)}.`);
    resource.request = require.resolve(`./client/${client}`);
});
