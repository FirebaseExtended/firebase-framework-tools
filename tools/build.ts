import { spawnSync } from 'child_process';
import { replaceInFile } from 'replace-in-file';

const LOCAL_NODE_MODULES = [
    '@angular-devkit/core/node',
    '@angular-devkit/core',
    '@angular-devkit/architect/node',
    '@angular-devkit/architect',
    'next/dist/build',
    'next/dist/export',
    'next/dist/trace',
    'nuxt',
    '@nuxt/kit/dist/index.mjs',
    'webpack',
    'firebase/auth',
];

const ES_MODULES = [
    ['@nuxt/kit', 'dist/index.mjs'],
];

const main = async () => {
    await replaceInFile({
        files: 'dist/**/*',
        from: ES_MODULES.map(([path]) =>  new RegExp(`Promise\\.resolve\\(\\)\\.then\\(\\(\\) => __importStar\\(require\\('${path}'\\)\\)\\)`, 'g')),
        to: ES_MODULES.map(([path, file]) => `import('${path}${file ? `/${file}` : ''}')`),
    });

    await replaceInFile({
        files: 'dist/**/*',
        from: 'Promise.resolve().then(() => __importStar(require(`${process.cwd()}/index.mjs`)))',
        to: 'import(`${process.cwd()}/index.mjs`)',
    });

    await replaceInFile({
        files: 'dist/**/*',
        from: LOCAL_NODE_MODULES.map(mod => new RegExp(`require\\(["']${mod}["']\\)`, 'g')),
        to: LOCAL_NODE_MODULES.map(mod => `require(\`\${process.cwd()}/node_modules/${mod}\`)`),
    });

    await replaceInFile({
        files: 'dist/**/*',
        from: LOCAL_NODE_MODULES.map(mod => new RegExp(`import\\(["']${mod}["']\\)`, 'g')),
        to: LOCAL_NODE_MODULES.map(mod => `import(\`\${process.cwd()}/node_modules/${mod}\`)`),
    });

    const npmList = JSON.parse(spawnSync('npm', ['list', '--json=true'], { encoding: 'utf8' }).stdout.toString());
    const from = ['__FIREBASE_FRAMEWORKS_VERSION__'];
    const to = [`file:${process.cwd()}`];
    for (const [dep, { version }] of Object.entries<Record<string, string>>(npmList.dependencies)) {
        from.push(`__${dep.toUpperCase().replace(/[^A-Z]/g, '_')}_VERSION__`);
        to.push(`^${version}`);
    }
    await replaceInFile({
        files: 'dist/**/*',
        from,
        to
    });
}

main();