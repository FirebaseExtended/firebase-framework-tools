import { exit } from 'process';
import { readdir, access } from 'fs/promises';
import { join } from 'path';
import { exec } from '../src/utils.js';
import { existsSync, readFileSync } from 'fs';

const site = 'nextjs-demo-73e34';

const run = async () => {
    await exec('firebase emulators:exec "exit 0"');
    if (await access('.firebase').then(() => false, () => true)) throw '.firebase does not exist';
    if (await access(join('.firebase', site)).then(() => false, () => true)) throw `.firebase/${site} does not exist`;
    if (await access(join('.firebase', site, 'hosting')).then(() => false, () => true)) throw `.firebase/${site}/hosting does not exist`;
    if (!(await readdir(join('.firebase', site, 'hosting'))).length) throw `no files in .firebase/${site}/hosting`;
    if (await access(join('.firebase', site, 'functions')).then(() => true, () => false)) throw `.firebase/${site}/functions should not exist`;
}

run().then(
    () => exit(0),
    err => {
        console.error(err.message || err);
        const logPath = 'firebase-debug.log';
        if (existsSync(logPath)) console.log(readFileSync(logPath).toString());
        exit(1);
    }
);

export {};
