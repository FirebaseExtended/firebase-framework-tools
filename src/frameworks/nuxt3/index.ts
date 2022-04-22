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

import { promises as fsPromises, existsSync } from 'fs'
import { join } from 'path';

import { DeployConfig, PathFactory, exec } from '../../utils';

const { readFile, rm, mkdir, readdir } = fsPromises;

export const build = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {

    const { loadNuxt, buildNuxt, loadNuxtConfig }: typeof import('@nuxt/kit') = await import(getProjectPath('node_modules', '@nuxt', 'kit', 'dist', 'index.mjs'));

    const nuxtApp = await loadNuxt({
        cwd: getProjectPath(),
        overrides: {
            nitro: { preset: 'node' },
            _generate: true,
        },
    });
    console.log(nuxtApp);
    const { options: { app: { baseURL, buildAssetsDir } } } = nuxtApp;

    await buildNuxt(nuxtApp);

    const nuxtConfig = await loadNuxtConfig({
        cwd: getProjectPath(),
    });

    // TODO don't hardcode, can this be configured?
    const distDir = '.output';

    const deployPath = (...args: string[]) => config.dist ? join(config.dist, ...args) : getProjectPath('.deploy', ...args);

    const getHostingPath = (...args: string[]) => deployPath('hosting', ...baseURL.split('/'), ...args);

    await rm(deployPath(), { recursive: true, force: true });

    // TODO also check Nuxt's settings
    const usingCloudFunctions = !!config.function;
    await mkdir(deployPath('functions'), { recursive: true });
    await mkdir(getHostingPath(buildAssetsDir), { recursive: true });

    if (usingCloudFunctions) {
        await exec(`cp -r ${getProjectPath(distDir, 'server', '*')} ${deployPath('functions')}`);
    }
    await exec(`cp -r ${getProjectPath(distDir, 'public', '*')} ${deployPath('hosting')}`);

    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    const nodeModulesPath = getProjectPath('.output', 'server', 'node_modules');
    const directories = existsSync(nodeModulesPath) ? await readdir(nodeModulesPath) : [];
    const staticDepsArray = await Promise.all(directories.map(async directory => {
        const packageJsonBuffer = await readFile(join(nodeModulesPath, directory, 'package.json'));
        const packageJson = JSON.parse(packageJsonBuffer.toString());
        return [packageJson.name, packageJson.version];
    }));
    // TODO can we override existing deps?
    packageJson.dependencies = Object.fromEntries(staticDepsArray);

    return { usingCloudFunctions, rewrites: [], redirects: [], headers: [], packageJson, framework: 'nuxt3', bootstrapScript: null };
}