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

import { getChalk, getFirebaseTools, getOra, getTripleBeam, getWinston } from '../firebase';
import { build as buildFramework } from '../frameworks';
import { debugLogger, getDeployConfig, getProjectPathFactory, defaultFirebaseToolsOptions } from '../utils';

export const deploy = async (options: any[]) => {
    const config = await getDeployConfig('default', true);
    const getProjectPath = getProjectPathFactory(config);
    const firebaseTools = await getFirebaseTools();
    const ora = getOra();
    const winston = getWinston();
    const tripleBeam = getTripleBeam();
    const chalk = getChalk();

    if (!process.env.FIREBASE_TOKEN) {
        await firebaseTools.login();
        const projectRoot = getProjectPath('.deploy');
        const cwd = projectRoot;
        const { email } = await firebaseTools.login({ projectRoot, cwd });
        ora(`Logged into Firebase as ${email}`).succeed();
    }

    if (options.includes('--debug')) firebaseTools.logger.logger.add(debugLogger());

    const { usingCloudFunctions } = await buildFramework(config, getProjectPath);

    let header = 'Deploying application to Firebase';
    let spinner = ora(`${header}\n`).start();

    // Bug with Functions v2, we can't deploy hosting until function has been
    // deployed at least once. So if the function doesn't exist yet we need to
    // deploy on it's own.
    let v2deployWorkaroundNeeded = false;

    if (usingCloudFunctions && config.function.gen === 2) {
        const functions = await firebaseTools.functions.list({
            ...defaultFirebaseToolsOptions(getProjectPath('.deploy')),
        }).catch(() => []);
        const functionExists = !!functions.find(it => it.id === config.function.name);
        v2deployWorkaroundNeeded = !functionExists;
    }

    const logger = new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
            winston.format(info => {
                const text: string|undefined = info[tripleBeam.SPLAT as any]?.[0];
                if (typeof text === 'string') {
                    spinner.text = `${header}\n  ${chalk.italic(text)}`;
                    return false;
                }
                if (typeof info.message === 'string') {
                    spinner.text = `${header}\n  ${chalk.italic(info.message)}`;
                    return false;
                }
                return false;
            })(),
        )
    });

    firebaseTools.logger.logger.add(logger);

    if (usingCloudFunctions && v2deployWorkaroundNeeded) {

        header = 'Deploying application to Cloud Functions';
        spinner.text = header;
        await firebaseTools.deploy({
            ...defaultFirebaseToolsOptions(getProjectPath('.deploy')),
            only: `functions:${config.function.name}`,
        });
        spinner.text = header;
        spinner.succeed();

        header = 'Deploying application to Firebase Hosting';
        spinner = ora(`${header}\n`).start();
        await firebaseTools.deploy({
            ...defaultFirebaseToolsOptions(getProjectPath('.deploy')),
            only: `hosting:site`,
        });
        spinner.succeed();

    } else {

        await firebaseTools.deploy({
            ...defaultFirebaseToolsOptions(getProjectPath('.deploy')),
            only: `hosting:site${usingCloudFunctions ? `,functions:${config.function.name}`: ''}`,
        });
        spinner.succeed();

    }

};
