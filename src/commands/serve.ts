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

import { build } from "../frameworks";
import { defaultFirebaseToolsOptions, getDeployConfig, getProjectPathFactory } from "../utils";
import firebaseTools from 'firebase-tools';
import winston from "winston";
import tripleBeam from 'triple-beam';
import ora from "ora";

// TODO allow override
const DEFAULT_EMULATOR_PORT = 3000;
const DEFAULT_EMULATOR_HOST = 'localhost';

export const serve = async (key: string='default') => {
    const config = await getDeployConfig(key, true);
    const getProjectPath = getProjectPathFactory(config);

    if (!process.env.FIREBASE_TOKEN) {
        await firebaseTools.login();
        const projectRoot = getProjectPath('.deploy');
        const cwd = projectRoot;
        const { email } = await firebaseTools.login({ projectRoot, cwd });
        ora(`Logged into Firebase as ${email}`).succeed();
    }

    await build(config, true, getProjectPath);

    // TODO get this working
    // HTTP Error: 400, Request contains an invalid argument.
    /*const runtimeConfig = await (firebaseTools as any).functions.config.get({
        ...defaultFirebaseToolsOptions(getProjectPath('.deploy')),
    });*/

    const logger = new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
            winston.format(info => {
                // Reduce the verbosity of logging from serving Next.js over functions
                const text: string|undefined = info[tripleBeam.SPLAT as any]?.[0];
                if (text === `Beginning execution of "${config.function.region}-${config.function.name}"`) return false;
                if (typeof text === 'string' && text.startsWith(`Finished "${config.function.region}-${config.function.name}" in `)) return false;
                if (typeof text === 'string' && text.includes('GET /_next/')) return false;
                if (typeof text === 'string' && text.includes('GET /__nextjs_original-stack-frame?')) return false;
                if (typeof info.message === 'string' && info.message.startsWith('[hosting] Rewriting /_next/')) return false;
                if (typeof info.message === 'string' && info.message.startsWith('[hosting] Rewriting /__nextjs_original-stack-frame?')) return false;
                if (typeof text === 'string' && text.includes('https://telemetry.nextjs.org/api/v1/record')) return false;
                return info;
            })(),
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
};