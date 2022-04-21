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
import { getFirebaseTools, normalizedHostingConfigs, getInquirer, needProjectId } from './firebase';

import { build } from './frameworks';
import { DEFAULT_REGION, spawn } from './utils';

export const prepare = async (targetNames: string[], context: any, options: any, dev: boolean) => {
    await getFirebaseTools();
    const project = needProjectId(context);
    // options.site is not present when emulated. We could call requireHostingSite but IAM permissions haven't
    // been booted up (at this point) and we may be offline, so just use projectId. Most of the time
    // the default site is named the same as the project & for frameworks this is only used for naming the
    // function... unless you're using authenticated server-context TODO explore the implication here.
    const configs = normalizedHostingConfigs({ site: project, ...options}, { resolveTargets: true });
    if (configs.length === 0) return;
    const hostingConfig = options.config.get('hosting');
    for (const { source, site, target, public: publicDir } of configs) {
        if (!source) continue;
        const dist = join(process.cwd(), '.firebase', site);
        const hostingDist = join('.firebase', site, 'hosting');
        const functionsDist = join('.firebase', site, 'functions');
        if (publicDir) throw `hosting.public and hosting.source cannot both be set in firebase.json`;
        const getProjectPath = (...args: string[]) => join(process.cwd(), source, ...args);
        const functionName = `ssr${site.replace(/-/g, '')}`;
        const { usingCloudFunctions, rewrites, redirects, headers } = await build({
            dist,
            project,
            site,
            // TODO refactor to skip the function build step, if unneeded
            function: {
                name: functionName,
                region: DEFAULT_REGION,
                gen: 2,
            },
        }, getProjectPath);
        const hostingIndex = Array.isArray(hostingConfig) ? `[${hostingConfig.findIndex((it: any) => it.site === site || it.target === target)}]` : '';
        options.config.set(`hosting${hostingIndex}.public`, hostingDist);
        const existingRewrites = options.config.get(`hosting${hostingIndex}.rewrites`) || [];
        if (usingCloudFunctions) {
            // Only need to do this in dev, since we have a functions.yaml, so discovery isn't needed
            await spawn('npm', ['i', '--prefix', functionsDist, '--only', 'production', '--no-audit', '--no-fund', '--silent'], {}, stdoutChunk => {
                console.log(stdoutChunk.toString());
            }, errChunk => {
                console.error(errChunk.toString());
            });
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
            options.config.set(`hosting${hostingIndex}.rewrites`, [
                ...existingRewrites,
                ...rewrites, {
                    source: '**',
                    function: functionName,
                }
            ]);
        } else {
            options.config.set(`hosting${hostingIndex}.rewrites`, [
                ...existingRewrites,
                ...rewrites, {
                    source: '**',
                    destination: '/index.html',
                }
            ]);
        }
        const existingRedirects = options.config.get(`hosting${hostingIndex}.redirects`) || [];
        options.config.set(`hosting${hostingIndex}.redirects`, [
            ...existingRedirects,
            ...redirects
        ]);
        const existingHeaders = options.config.get(`hosting${hostingIndex}.headers`) || [];
        options.config.set(`hosting${hostingIndex}.headers`, [
            ...existingHeaders,
            ...headers
        ]);
    }
}
