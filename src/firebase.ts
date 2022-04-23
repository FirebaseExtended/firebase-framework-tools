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

export const getInquirer = (): typeof import('inquirer') => require(`${firebaseToolsPath}/node_modules/inquirer`);

export const normalizedHostingConfigs = (...args: any[]) =>
    require(`${firebaseToolsPath}/lib/hosting/normalizedHostingConfigs`).
        normalizedHostingConfigs(...args) as any[];

export const needProjectId = (...args: any[]) =>
    require(`${firebaseToolsPath}/lib/projectUtils`).
        needProjectId(...args) as string|undefined;
