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

import { promises as fsPromises } from 'fs';
import { join } from 'path';
import firebaseTools from 'firebase-tools';
import { projectPrompt, shortSiteName, sitePrompt, userPrompt } from '../prompts';
import { DEFAULT_REGION, DEFAULT_SERVICE_NAME, DEFAULT_GCF_GEN, DeployConfig } from '../utils';

const { writeFile, mkdir, readFile } = fsPromises;

export const init = async (key: string='default') => {
    // TODO pull defaults from existing deploy.json
    //      add .gitignore
    //      add deploy scripts
    const projectRoot = join(process.cwd(), '.deploy');
    const { email: account } = await userPrompt({ projectRoot });
    const project = await projectPrompt(undefined, { projectRoot, account });
    const site = await sitePrompt(project, { projectRoot, account });
    const deployJsonBuffer = await readFile('deploy.json').catch(() => undefined);
    const config: Record<string, DeployConfig> = deployJsonBuffer && JSON.parse(deployJsonBuffer.toString()) || {};
    if (typeof config !== 'object' || config[key] && typeof config[key] !== 'object') throw 'deploy.json malformed';
    config[key] ||= {} as any;
    config[key].project = project.projectId;
    config[key].site = shortSiteName(site)!;
    config[key].function ||= { } as any;
    config[key].function.name ||= DEFAULT_SERVICE_NAME;
    config[key].function.region ||= DEFAULT_REGION;
    config[key].function.gen ||= DEFAULT_GCF_GEN;
    await writeFile('deploy.json', JSON.stringify(config, null, 2));
    await mkdir(projectRoot).catch(() => undefined);
    await writeFile(join(projectRoot, 'firebase.json'), '{}');
    await firebaseTools.login.use(account, { cwd: projectRoot, projectRoot });
}