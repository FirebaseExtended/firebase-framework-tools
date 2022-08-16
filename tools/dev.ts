export {};

import { exit } from 'process';
import { join } from 'path';
import { exec } from '../src/utils.js';

const { default: { replaceInFile } } = await import('replace-in-file');
const { default: { readJson } } = await import('fs-extra');

const run = async () => {
    const { name, version } = await readJson('./package.json');
    const path = join(process.cwd(), `${name}-${version}.tgz`);
    await replaceInFile({
        files: 'dist/constants.js',
        from: /^exports\.FIREBASE_FRAMEWORKS_VERSION = .*$/gm,
        to: `exports.FIREBASE_FRAMEWORKS_VERSION = 'file:${path}';`,
    });
    await exec('npm pack .');
    const npmRoot = await exec('npm -g root');
    const firebaseVersion = await exec('firebase --version');
    const cwd = join(npmRoot as string, 'firebase-tools');

    await exec(`npm install --only production --force --ignore-scripts --save ${path}`, { cwd });
    console.log(`Manually patched firebase-frameworks ${version} into firebase-tools ${firebaseVersion}.\nUndo this operation by globally installing firebase-tools again.`);
}

run().then(
    () => exit(0),
    () => exit(1)
);