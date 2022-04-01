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

import { join } from 'path';
import { build } from './frameworks';
import { DEFAULT_REGION } from './utils';

export type PrepareOptions = {
    includeCloudFunctions: boolean;
}

export const prepare = async (context: any, options: PrepareOptions) => {
    let startBuildQueue: () => void;
    let buildQueue = new Promise<void>((resolve) => startBuildQueue = resolve);
    context.hosting.deploys.forEach((deploy: any) => {
        if (!deploy.config.source) return;
        const buildJob = async () => {
            const source = deploy.config.source;
            if (deploy.config.public) throw `hosting.public and hosting.source cannot both be set in firebase.json`;
            const getProjectPath = (...args: string[]) => join(process.cwd(), source, ...args);
            await build({
                project: context.project,
                function: options.includeCloudFunctions ? {
                    name: 'ssrframeworksgen2',
                    region: DEFAULT_REGION,
                    gen: 2,
                } : undefined,
            }, getProjectPath);
            deploy.config.public = join(source, '.deploy', 'hosting');
        };
        buildQueue = buildQueue.then(() => buildJob());
    });
    startBuildQueue!();
    await buildQueue;
}