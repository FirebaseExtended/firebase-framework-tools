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
import { promises as fsPromises } from 'fs';
import { join } from 'path';

import { getCliColorStrip, getTripleBeam, getWinston } from './firebase';

export const DEFAULT_SERVICE_NAME = 'ssr';
export const DEFAULT_REGION = 'us-central1';
export const DEFAULT_GCF_GEN = 2;

const { readFile } = fsPromises;

export const exec = (command: string, options: ExecOptions={}) => new Promise((resolve, reject) =>
    execCallback(command, {}, (error, stdout) => {
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
    dist?: string,
    prefix?: string,
    project?: string ,
    site?: string,
    function?: {
        name: string,
        region: string,
        gen: 1 | 2,
    };
};

export async function getDeployConfig(key: string, required: true): Promise<Required<DeployConfig>>;
export async function getDeployConfig(key: string): Promise<DeployConfig>;
export async function getDeployConfig(key: string, required: false): Promise<DeployConfig>;
export async function getDeployConfig(key: string, required=false): Promise<DeployConfig | Required<DeployConfig>> {
    const deployJsonBuffer = await readFile('deploy.json').catch(() => undefined);
    if (required && !deployJsonBuffer) throw new Error('deploy.json not found, run `firebase-frameworks init`');
    const deployJson = deployJsonBuffer && JSON.parse(deployJsonBuffer.toString()) || {};
    const projectConfig: DeployConfig | undefined = deployJson[key];
    if (required && !projectConfig) throw(`Property ${key} not found in deploy.json, run \`firebase-frameworks init\``);
    let { dist, prefix='.', project, site, function: { name=undefined, region=undefined, gen=undefined }={}} = projectConfig || {};
    if (required) {
        if (!project) throw `Property ${key}.project not found in deploy.json, run \`firebase-frameworks init\`.`;
        if (!site) throw `Property ${key}.site not found in deploy.json, run \`firebase-frameworks init\`.`;
        if (!name) throw `Property ${key}.function.name not found in deploy.json, run \`firebase-frameworks init\`.`;
        if (!region) throw `Property ${key}.function.region not found in deploy.json, run \`firebase-frameworks init\`.`;
        if (!gen) throw `Property ${key}.function.gen not found in deploy.json, run \`firebase-frameworks init\`.`;
    } else {
        name ||= DEFAULT_SERVICE_NAME;
        region ||= DEFAULT_REGION;
        gen ||= DEFAULT_GCF_GEN;
    }
    if (gen === 1 && region !== DEFAULT_REGION) {
        throw `Cloud Functions v1 requires the region be ${DEFAULT_REGION}`;
    }
    return { dist, prefix, project, site, function: { name, region, gen } };
}

export const defaultFirebaseToolsOptions = (projectRoot: string) => ({
    cwd: projectRoot,
    projectRoot,
    token: process.env.FIREBASE_TOKEN,
    nonInteractive: true,
});

export type PathFactory = (...args: string[]) => string;

export const getProjectPathFactory = (config: DeployConfig): PathFactory => (...args) => join(process.cwd(), config.prefix ?? '.', ...args);

const tryStringify = (value: any) => {
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch {
      return value;
    }
};

export const debugLogger = () => {
    const winston = getWinston();
    const tripleBeam = getTripleBeam();
    const ansiStrip = getCliColorStrip();
    return new winston.transports.File({
        level: "debug",
        filename: join(process.cwd(), 'firebase-debug.log'),
        format: winston.format.printf((info) => {
            const segments = [info.message, ...(info[tripleBeam.SPLAT as any] || [])].map(tryStringify);
            return `[${info.level}] ${ansiStrip(segments.join(" "))}`;
        }),
    })
}