import { exit } from 'process';
import { readdir, access } from 'fs/promises';
import { join } from 'path';

const site = 'nextjs-demo-73e34';

const run = async () => {
    if (await access(join('e2e', 'next-test', '.firebase')).then(() => false, () => true)) throw '.firebase does not exist';
    if (await access(join('e2e', 'next-test', '.firebase', site)).then(() => false, () => true)) throw `.firebase/${site} does not exist`;
    if (await access(join('e2e', 'next-test', '.firebase', site, 'hosting')).then(() => false, () => true)) throw `.firebase/${site}/hosting does not exist`;
    if (!(await readdir(join('e2e', 'next-test', '.firebase', site, 'hosting'))).length) throw `no files in .firebase/${site}/hosting`;
    if (await access(join('e2e', 'next-test', '.firebase', site, 'functions')).then(() => false, () => true)) throw `.firebase/${site}/functions does not exist`;
    if (!(await readdir(join('e2e', 'next-test', '.firebase', site, 'functions'))).length) throw `no files in .firebase/${site}/functions`;
}

run().then(
    () => exit(0),
    err => {
        console.error(err.message || err);
        exit(1);
    }
);