import { spawn, execSync } from 'child_process';
import type FirebaseTools from 'firebase-tools';

let firebaseToolsPath: string;
let firebaseTools: Promise<typeof FirebaseTools>;
export const getFirebaseTools = () => firebaseTools ||=
    new Promise<typeof FirebaseTools>((resolve, reject) => {
        try {
            firebaseToolsPath = 'firebase-tools';
            resolve(require(firebaseToolsPath));
        } catch (e) {
            try {
                const root = execSync('npm root -g').toString().trim();
                firebaseToolsPath = `${root}/firebase-tools`;
                resolve(require(firebaseToolsPath));
            } catch (e) {
                console.log('Installing firebase-tools...');
                spawn('npm', ['i', '-g', 'firebase-tools'], {
                    stdio: 'pipe',
                }).on('close', (code) => {
                    if (code === 0) {
                        const root = execSync('npm root -g').toString().trim();
                        resolve(require(`${root}/firebase-tools`));
                    } else {
                        reject();
                    }
                });
            }
        }
    });

export const getWinston = (): typeof import('winston') => require(`${firebaseToolsPath}/node_modules/winston`);
export const getTripleBeam = (): typeof import('triple-beam') => require(`${firebaseToolsPath}/node_modules/triple-beam`);
export const getOra = (): typeof import('ora') => require(`${firebaseToolsPath}/node_modules/ora`);
export const getChalk = (): typeof import('chalk') => require(`${firebaseToolsPath}/node_modules/chalk`);
export const getInquirer = (): typeof import('inquirer') => require(`${firebaseToolsPath}/node_modules/inquirer`);
export const getCliColorStrip = (): typeof import('cli-color/strip') => require(`${firebaseToolsPath}/node_modules/cli-color/strip`);

export const getNormalizedHostingConfig = (): (...args: any[]) => any[] =>
    require(`${firebaseToolsPath}/lib/hosting/normalizedHostingConfigs`).
        normalizedHostingConfigs;
