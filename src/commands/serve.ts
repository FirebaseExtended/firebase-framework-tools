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

import { getFirebaseTools, getOra, getTripleBeam, getWinston } from '../firebase';
import { defaultFirebaseToolsOptions, getDeployConfig, getProjectPathFactory } from "../utils";
import { serve as serveFramework } from '../frameworks';

// TODO allow override
const DEFAULT_EMULATOR_PORT = 3000;
const DEFAULT_EMULATOR_HOST = 'localhost';

export const serve = async (options: any[]) => {
    const config = await getDeployConfig('default', true);
    const getProjectPath = getProjectPathFactory(config);
    const firebaseTools = await getFirebaseTools();
    const ora = getOra();
    const winston = getWinston();
    const tripleBeam = getTripleBeam();

    if (!process.env.FIREBASE_TOKEN) {
        await firebaseTools.login();
        const projectRoot = getProjectPath('.deploy');
        const cwd = projectRoot;
        const { email } = await firebaseTools.login({ projectRoot, cwd });
        ora(`Logged into Firebase as ${email}`).succeed();
    }

    const { stop } = await serveFramework(config, getProjectPath);

    const logger = new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
            winston.format.printf(info =>
                [info.message, ...(info[tripleBeam.SPLAT as any] || [])]
                    .filter((chunk) => typeof chunk === 'string')
                    .join(' ')
            )
        )
    });

    firebaseTools.logger.logger.add(logger);

    await firebaseTools.serve({
        ...defaultFirebaseToolsOptions(getProjectPath('.deploy')),
        port: DEFAULT_EMULATOR_PORT,
        host: DEFAULT_EMULATOR_HOST,
    });

    await stop();

};