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
import { promises as fs } from 'fs';

import { build } from './frameworks';
import { defaultFirebaseToolsOptions, DEFAULT_REGION, shortSiteName, spawn } from './utils';
import { getFirebaseTools, normalizedHostingConfigs, getInquirer, needProjectId } from './firebase';

const { writeFile, copyFile } = fs;

const NODE_VERSION = parseInt(process.versions.node, 10).toString();
const FIREBASE_ADMIN_VERSION = '__FIREBASE_ADMIN_VERSION__';
const FIREBASE_FUNCTIONS_VERSION = '__FIREBASE_FUNCTIONS_VERSION__';
const COOKIE_VERSION = '__COOKIE_VERSION__';
const LRU_CACHE_VERSION = '__LRU_CACHE_VERSION__';
const FIREBASE_FRAMEWORKS_VERSION = '__FIREBASE_FRAMEWORKS_VERSION__';

export const prepare = async (targetNames: string[], context: any, options: any) => {
    const firebaseTools = await getFirebaseTools();
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
        const { usingCloudFunctions, rewrites, redirects, headers, framework, packageJson, bootstrapScript='' } = await build({
            dist,
            project,
            site,
            // TODO refactor to skip the function build step, if unneeded
            function: {
                name: functionName,
                region: DEFAULT_REGION,
            },
        }, getProjectPath);
        // TODO this is a little janky, explore a better way of doing this
        const hostingIndex = Array.isArray(hostingConfig) ? `[${hostingConfig.findIndex((it: any) => it.site === site || it.target === target)}]` : '';
        options.config.set(`hosting${hostingIndex}.public`, hostingDist);
        const existingRewrites = options.config.get(`hosting${hostingIndex}.rewrites`) || [];
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
            options.config.set(`hosting${hostingIndex}.rewrites`, [
                ...existingRewrites,
                ...rewrites, {
                    source: '**',
                    function: functionName,
                }
            ]);

            let firebaseProjectConfig = null;
            // TODO check if firebase/auth is used
            const hasFirebaseDependency = !!packageJson.dependencies?.firebase;
            if (hasFirebaseDependency) {
                const { sites } = await firebaseTools.hosting.sites.list({
                    project,
                    ...defaultFirebaseToolsOptions(process.cwd()),
                });
                const selectedSite = sites.find(it => shortSiteName(it) === site);
                if (selectedSite) {
                    const { appId } = selectedSite;
                    if (appId) {
                        const result = await firebaseTools.apps.sdkconfig('web', appId, defaultFirebaseToolsOptions(process.cwd()));
                        firebaseProjectConfig = result.sdkConfig;
                    } else {
                        // TODO add color yellow, maybe prompt?
                        console.warn(`No Firebase app associated with site ${site}, unable to provide authenticated server context`);
                    }
                }
            }
            const firebaseAwareness = !!firebaseProjectConfig;

            packageJson.main = 'server.js';
            delete packageJson.devDependencies;
            packageJson.dependencies ||= {};
            packageJson.dependencies['firebase-frameworks'] = FIREBASE_FRAMEWORKS_VERSION;
            // TODO test these with semver, error if already set out of range
            packageJson.dependencies['firebase-admin'] ||= FIREBASE_ADMIN_VERSION;
            packageJson.dependencies['firebase-functions'] ||= FIREBASE_FUNCTIONS_VERSION;
            if (firebaseAwareness) {
                packageJson.dependencies['cookie'] ||= COOKIE_VERSION;
                packageJson.dependencies['lru-cache'] ||= LRU_CACHE_VERSION;
            }
            packageJson.engines ||= {};
            packageJson.engines.node ||= NODE_VERSION;

            await writeFile(join(functionsDist, 'package.json'), JSON.stringify(packageJson, null, 2));

            await copyFile(getProjectPath('package-lock.json'), join(functionsDist, 'package-lock.json')).catch(() => {});

            // Only need to do this in dev, since we have a functions.yaml, so discovery isn't needed
            // Welp, that didn't work, since firebase-tools checks that they have a minimum firebase-frameworks SDK installed...
            // TODO explore symlinks and ways to make this faster, better, stronger
            //      log to firebase-tools
            await spawn('npm', ['i', '--only', 'production', '--no-audit', '--no-fund', '--silent'], { cwd: functionsDist }, stdoutChunk => {
                console.log(stdoutChunk.toString());
            }, errChunk => {
                console.error(errChunk.toString());
            });

            // TODO allow configuration of the Cloud Function
            await writeFile(join(functionsDist, 'settings.js'), `exports.HTTPS_OPTIONS = {};
exports.FRAMEWORK = '${framework}';
exports.FIREBASE_CONFIG = ${JSON.stringify(firebaseProjectConfig)};
`);

            if (bootstrapScript) {
                await writeFile(join(functionsDist, 'bootstrap.js'), bootstrapScript);
            }
            await writeFile(join(functionsDist, 'server.js'), `exports['${functionName}'] = require('firebase-frameworks/server').default;\n`);
            await writeFile(join(functionsDist, 'functions.yaml'), JSON.stringify({
                endpoints: {
                    [functionName]: {
                        platform:  'gcfv2',
                        region: [DEFAULT_REGION],
                        labels: {},
                        httpsTrigger: {},
                        entryPoint: functionName
                    }
                },
                specVersion: 'v1alpha1',
                // TODO add persistent disk if needed
                requiredAPIs: []
            }, null, 2));
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
