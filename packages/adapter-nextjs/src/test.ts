import { rmdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const cwd = process.cwd();
const projectDir = join(cwd, 'e2e');

const run = async () => {
    await rmdir(projectDir, { recursive: true }).catch(() => {});
    execSync(`npx -y -p . apphosting-adapter-nextjs-create ${projectDir}`, { cwd, stdio: 'inherit' });
    execSync('npx -y -p .. apphosting-adapter-nextjs-build', { cwd: projectDir, stdio: 'inherit' });
    if (!existsSync(join(projectDir, '.next'))) throw `next app wasn't build`;
}

run();

export {};
