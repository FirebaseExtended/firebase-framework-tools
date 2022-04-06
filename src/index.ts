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
import { getFirebaseTools, getNormalizedHostingConfig } from './firebase';

import { build } from './frameworks';
import { DEFAULT_REGION } from './utils';

export type PrepareOptions = {
    includeCloudFunctions: boolean;
}

type BuildResult = Awaited<ReturnType<typeof build>> & { functionName: string, site: string, hostingDist: string, functionsDist: string, };

export const prepare = async (targetNames: string[], context: any, options: any) => {
    let startBuildQueue: (arg: []) => void;
    let buildQueue = new Promise<BuildResult[]>((resolve) => startBuildQueue = resolve);
    await getFirebaseTools();
    const configs = getNormalizedHostingConfig()(options, { resolveTargets: true });
    if (configs.length === 0) return;
    configs.forEach(({ source, site, public: publicDir}: any) => {
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
            function: {
                name: functionName,
                region: DEFAULT_REGION,
                gen: 2,
            },
        }, getProjectPath).then(result => (results.push({ ...result, functionName, site, hostingDist, functionsDist }), results)));
    });
    startBuildQueue!([]);
    const results = await buildQueue;
    if (targetNames.includes('functions') && results.some(it => it.usingCloudFunctions)) {
        console.error('Unable to deploy functions alongside web frameworks at the moment.\nDeploy the seperately with "firebase deploy --only hosting" and "firebase deploy --only functions".');
        exit(1);
    }
    if (results.filter(it => it.usingCloudFunctions).length > 1) {
        console.error('Unable deploy multiple web frameworks that use Cloud Functions at the same time.\nDeploy the seperately with "firebase deploy --only hosting:YOUR_TARGET".');
        exit(1);
    }
    // TODO how should we handle pushing multiple sites?
    //      we should error if they are already deploying Cloud Functions for now
    results.forEach(({ usingCloudFunctions, hostingDist, functionsDist, functionName }) => {
        options.config.set('hosting.public', hostingDist);
        const rewrites = options.config.get('hosting.rewrites') || [];
        if (usingCloudFunctions) {
            if (!targetNames.includes('functions')) targetNames.push('functions');
            options.config.set('functions', {
                source: functionsDist,
                codebase: 'firebase-frameworks',
            });
            // TODO get the other firebase.json modifications
            options.config.set('hosting.rewrites', [ ...rewrites, {
                source: '**',
                run: {
                    serviceId: functionName,
                    region: DEFAULT_REGION,
                },
            }]);
        } else {
            options.config.set('hosting.rewrites', [...rewrites, {
                source: '**',
                destination: '/index.html',
            }]);
        }
    });
}