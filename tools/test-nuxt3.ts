import { exit } from 'process';
import { existsSync, readFileSync } from 'fs';
import { readdir, access } from 'fs/promises';
import { join } from 'path';
import { exec } from '../src/utils.js';

const site = 'nextjs-demo-73e34';
const cwd = join('e2e', 'nuxt3-test');

const run = async () => {
    await exec('firebase emulators:exec "exit 0"', { cwd });
    if (await access(join(cwd, '.firebase')).then(() => false, () => true)) throw '.firebase does not exist';
    if (await access(join(cwd, '.firebase', site)).then(() => false, () => true)) throw `.firebase/${site} does not exist`;
    if (await access(join(cwd, '.firebase', site, 'hosting')).then(() => false, () => true)) throw `.firebase/${site}/hosting does not exist`;
    if (!(await readdir(join(cwd, '.firebase', site, 'hosting'))).length) throw `no files in .firebase/${site}/hosting`;
}

run().then(
    () => exit(0),
    err => {
        console.error(err.message || err);
        const logPath = join(cwd, 'firebase-debug.log');
        if (existsSync(logPath)) console.log(readFileSync(logPath).toString());
        exit(1);
    }
);

export {};
