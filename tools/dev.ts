import { exit } from 'process';
import { replaceInFile } from 'replace-in-file';
import { join } from 'path';
import { readJson } from 'fs-extra';
import { exec } from '../src/utils';

const run = async () => {
    const { name, version } = await readJson('./package.json');
    const path = join(process.cwd(), `${name}-${version}.tgz`);
    await replaceInFile({
        files: 'dist/constants.js',
        from: /^exports\.FIREBASE_FRAMEWORKS_VERSION = .*$/gm,
        to: `exports.FIREBASE_FRAMEWORKS_VERSION = 'file:${path}';`,
    });
    await exec('npm pack .');
    const npmRoot = await exec('npm root');
    await exec(`npm install --force --ignore-scripts --save ${path}`, { cwd: join(npmRoot as string, 'firebase-tools') });
}

run().then(
    () => exit(0),
    () => exit(1)
);