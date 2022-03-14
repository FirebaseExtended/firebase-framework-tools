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

import { build as buildNextJsApp } from '../frameworks/next.js/build';
import { debugLogger, getDeployConfig, getProjectPathFactory } from '../utils';
import { deploy as deployNextJsApp } from '../frameworks/next.js/deploy';
import firebaseTools from 'firebase-tools';
import ora from 'ora';

export const deploy = async (key: string='default', options: { debug?: true }) => {
    const config = await getDeployConfig(key, true);
    const getProjectPath = getProjectPathFactory(config);

    if (!process.env.FIREBASE_TOKEN) {
        await firebaseTools.login();
        const projectRoot = getProjectPath('.deploy');
        const cwd = projectRoot;
        const { email } = await firebaseTools.login({ projectRoot, cwd });
        ora(`Logged into Firebase as ${email}`).succeed();
    }

    if (options.debug) firebaseTools.logger.logger.add(debugLogger);

    await buildNextJsApp(config, false, getProjectPath);
    await deployNextJsApp(config, getProjectPath);
};
