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
import { exit } from 'process';
import { getFirebaseTools, getNormalizedHostingConfig, getInquirer } from './firebase';

import { build } from './frameworks';
import { DEFAULT_REGION } from './utils';

export type PrepareOptions = {
    includeCloudFunctions: boolean;
}

type BuildResult = Awaited<ReturnType<typeof build>> & { functionName: string, target: string, site: string, hostingDist: string, functionsDist: string, };

export const prepare = async (targetNames: string[], context: any, options: any) => {
    let startBuildQueue: (arg: []) => void;
    let buildQueue = new Promise<BuildResult[]>((resolve) => startBuildQueue = resolve);
    await getFirebaseTools();
    const configs = getNormalizedHostingConfig()(options, { resolveTargets: true });
    if (configs.length === 0) return;
    configs.forEach(({ source, site, target, public: publicDir }: any) => {
        if (!source) return;
        const dist = join(process.cwd(), '.firebase', site);
        const hostingDist = join('.firebase', site, 'hosting');
        const functionsDist = join('.firebase', site, 'functions');
        if (publicDir) throw `hosting.public and hosting.source cannot both be set in firebase.json`;
        const getProjectPath = (...args: string[]) => join(process.cwd(), source, ...args);
        const functionName = `ssr${site.replace(/-/g, '')}`;
        buildQueue = buildQueue.then(results => build({
            dist,
            project: context.project,
            site,
            // TODO refactor to skip the function build step, if unneeded
            function: {
                name: functionName,
                region: DEFAULT_REGION,
                gen: 2,
            },
        }, getProjectPath).then(result => (results.push({ ...result, functionName, site, target, hostingDist, functionsDist }), results)));
    });
    startBuildQueue!([]);
    const results = await buildQueue;
    const hostingConfig = options.config.get('hosting');
    await Promise.all(results.map(async ({ usingCloudFunctions, hostingDist, site, target, functionsDist, functionName }) => {
        const hostingIndex = Array.isArray(hostingConfig) ? `[${hostingConfig.findIndex((it: any) => it.site === site || it.target === target)}]` : '';
        options.config.set(`hosting${hostingIndex}.public`, hostingDist);
        const rewrites = options.config.get(`hosting${hostingIndex}.rewrites`) || [];
        if (usingCloudFunctions) {
            if (context.hostingChannel) {
                // TODO move to prompts
                const message = 'Cannot preview changes to the backend, you will only see changes to the static content on this channel.';
                if (!options.nonInteractive) {
                    const { continueDeploy } = await getInquirer().prompt({
                        type: 'confirm',
                        name: 'continueDeploy',
                        message: `${message} Would you like to continue with the deploy?`,
                        default: true,
                    });
                    if (!continueDeploy) exit(1);
                } else {
                    console.error(message);
                }
            } else {
                const functionConfig = {
                    source: functionsDist,
                    codebase: `firebase-frameworks-${site}`,
                };
                if (targetNames.includes('functions')) {
                    const combinedFunctionsConfig = [functionConfig].concat(options.config.get('functions') || []);
                    options.config.set('functions', combinedFunctionsConfig);
                } else {
                    targetNames.unshift('functions');
                    options.config.set('functions', functionConfig);
                }
            }
            // TODO get the other firebase.json modifications
            options.config.set(`hosting${hostingIndex}.rewrites`, [ ...rewrites, {
                source: '**',
                run: {
                    serviceId: functionName,
                    region: DEFAULT_REGION,
                },
            }]);
        } else {
            options.config.set(`hosting${hostingIndex}.rewrites`, [...rewrites, {
                source: '**',
                destination: '/index.html',
            }]);
        }
    }));
}
