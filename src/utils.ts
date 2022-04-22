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

import { exec as execCallback, spawn as spawnCallback, ExecOptions, SpawnOptionsWithoutStdio } from 'child_process';
import { FirebaseHostingSite } from 'firebase-tools';
import { join } from 'path';

export const DEFAULT_REGION = 'us-central1';

export const shortSiteName = (site?: FirebaseHostingSite) => site?.name && site.name.split('/').pop();

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

export const defaultFirebaseToolsOptions = (projectRoot: string) => ({
    cwd: projectRoot,
    projectRoot,
    token: process.env.FIREBASE_TOKEN,
    nonInteractive: true,
});

export type PathFactory = (...args: string[]) => string;

export const getProjectPathFactory = (config: DeployConfig): PathFactory => (...args) => join(process.cwd(), config.prefix ?? '.', ...args);
