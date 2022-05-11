import { exit } from 'process';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const site = 'nextjs-demo-73e34';

const run = async () => {
    if (!(await stat(join('e2e', 'angular', '.firebase'))).isDirectory()) throw '.firebase does not exist';
    if (!(await stat(join('e2e', 'angular', '.firebase', site))).isDirectory()) throw `.firebase/${site} does not exist`;
    if (!(await stat(join('e2e', 'angular', '.firebase', site, 'hosting'))).isDirectory()) throw `.firebase/${site}/hosting does not exist`;
    if (!(await readdir(join('e2e', 'angular', '.firebase', site, 'hosting'))).length) throw `no files in .firebase/${site}/hosting`;
    if (await stat(join('e2e', 'angular', '.firebase', site, 'functions')).then(() => true, () => false)) throw `.firebase/${site}/functions should not exist`;
}

run().then(
    () => exit(0),
    err => {
        console.error(err);
        exit(1);
    }
);