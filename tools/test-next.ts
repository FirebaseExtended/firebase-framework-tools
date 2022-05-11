import { exit } from 'process';
import { readdir, access } from 'fs/promises';
import { join } from 'path';

const site = 'nextjs-demo-73e34';

const run = async () => {
    if (await access(join('e2e', 'nuxt', '.firebase')).then(() => false, () => true)) throw '.firebase does not exist';
    if (await access(join('e2e', 'nuxt', '.firebase', site)).then(() => false, () => true)) throw `.firebase/${site} does not exist`;
    if (await access(join('e2e', 'nuxt', '.firebase', site, 'hosting')).then(() => false, () => true)) throw `.firebase/${site}/hosting does not exist`;
    if (!(await readdir(join('e2e', 'next', '.firebase', site, 'hosting'))).length) throw `no files in .firebase/${site}/hosting`;
    if (await access(join('e2e', 'next', '.firebase', site, 'functions')).then(() => true, () => false)) throw `.firebase/${site}/functions should not exist`;
}

run().then(
    () => exit(0),
    err => {
        console.error(err.message);
        exit(1);
    }
);