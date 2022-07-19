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

import { readFile, mkdir } from 'fs/promises'
import { join } from 'path';
import { copy } from 'fs-extra';
import { pathToFileURL } from 'url';

import { DeployConfig, PathFactory } from '../../utils.js';
import { build as buildNuxt3 } from '../nuxt3/index.js';

// Used by the build process, don't shake
const _pathToFileURL = pathToFileURL;

export const build = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {

    let nuxt: any;
    try {
        // @ts-ignore
        nuxt = await import('nuxt/dist/nuxt.js');
    } catch(e) {
        return await buildNuxt3(config, getProjectPath);
    }

    const nuxtApp = await nuxt.loadNuxt({
        for: 'build',
        rootDir: getProjectPath(),
    });

    const deployPath = (...args: string[]) => join(config.dist, ...args);

    const { options: { target, app: { basePath, assetsPath }, buildDir, dir: { static: staticDir } } } = await nuxt.build(nuxtApp);
    await mkdir(deployPath('hosting', basePath, assetsPath), { recursive: true });

    let usingCloudFunctions = false;
    if (target === 'static') {
        const nuxtApp = await nuxt.loadNuxt({
            for: 'start',
            rootDir: getProjectPath(),
        });
        await nuxtApp.server.listen(0);
        // @ts-ignore
        const { getBuilder } = await import('@nuxt/builder/dist/builder.js');
        // @ts-ignore
        const { Generator } = await import('@nuxt/generator/dist/generator.js');
        const builder = await getBuilder(nuxtApp);
        const generator = new Generator(nuxtApp, builder);
        await generator.generate({ build: false, init: true });
        await copy(generator.distPath, deployPath('hosting'));
        await nuxtApp.server.close();
        usingCloudFunctions = !generator.isFullStatic;
    } else {
        await copy(join(buildDir, 'dist', 'client'), deployPath('hosting', assetsPath));
        await copy(getProjectPath(staticDir), deployPath('hosting'));
    }

    if (usingCloudFunctions) {
        await mkdir(deployPath('functions'), { recursive: true });
        await copy(buildDir, deployPath('functions'));
    }

    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());

    return { usingCloudFunctions, rewrites: [], redirects: [], headers: [], packageJson, framework: 'nuxt', bootstrapScript: null };
}