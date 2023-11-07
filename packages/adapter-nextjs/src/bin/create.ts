#! /usr/bin/env node
import { spawnSync } from 'child_process';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { exit } from 'process';
import { fileURLToPath } from 'url';

// TODO should be bundle this?
async function getNextVersion() {
    const main = fileURLToPath(import.meta.url);
    const path = join(main, '../../../package.json');
    const packageJson = await readFile(path);
    const { peerDependencies: { next } } = JSON.parse(packageJson.toString());
    return next;
}

getNextVersion().then(async version => {
    const [,, projectDirectory] = process.argv;
    const cwd = process.cwd();
    spawnSync('create-next-app', ['--example', 'hello-world', '--ts', '--use-npm', projectDirectory], { cwd, stdio: "inherit" });
}).catch(() => {
    exit(1);
});
