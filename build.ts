import { spawnSync } from 'child_process';
import { replaceInFile } from 'replace-in-file';

const LOCAL_NODE_MODULES = [
    '@angular-devkit/core/node/index.js',
    '@angular-devkit/core/index.js',
    '@angular-devkit/architect/node/index.js',
    '@angular-devkit/architect/index.js',
    'next/dist/build',
    'nuxt',
    '@nuxt/kit/dist/index.mjs'
];

const ES_MODULES = [
    ['@angular-devkit/core/node', 'index.js'],
    ['@angular-devkit/core', 'src/index.js' ],
    ['@angular-devkit/architect/node', 'index.js' ],
    ['@angular-devkit/architect', 'src/index.js' ],
    ['@nuxt/kit', 'dist/index.mjs' ],
];

const main = async () => {
    await replaceInFile({
        files: 'dist/**/*',
        from: ES_MODULES.map(([path]) => `Promise.resolve().then(() => __importStar(require('${path}')))`),
        to: ES_MODULES.map(([path, file]) => `import('${path}/${file}')`),
    });

    await replaceInFile({
        files: 'dist/**/*',
        from: 'Promise.resolve().then(() => __importStar(require(`${process.cwd()}/index.mjs`)))',
        to: 'import(`${process.cwd()}/index.mjs`)',
    });

    await replaceInFile({
        files: 'dist/frameworks/**/index.js',
        from: LOCAL_NODE_MODULES.map(mod => `require("${mod}")`),
        to: LOCAL_NODE_MODULES.map(mod => `require(\`\${process.cwd()}/node_modules/${mod}\`)`),
    });

    await replaceInFile({
        files: 'dist/frameworks/**/index.js',
        from: LOCAL_NODE_MODULES.map(mod => `require('${mod}')`),
        to: LOCAL_NODE_MODULES.map(mod => `require(\`\${process.cwd()}/node_modules/${mod}\`)`),
    });

    await replaceInFile({
        files: 'dist/frameworks/**/index.js',
        from: LOCAL_NODE_MODULES.map(mod => `import('${mod}')`),
        to: LOCAL_NODE_MODULES.map(mod => `import(\`\${process.cwd()}/node_modules/${mod}\`)`),
    });

    const { version } = require('./package.json');
    const npmList = JSON.parse(spawnSync('npm', ['list', '--json=true'], { encoding: 'utf8' }).stdout.toString());
    const from = ['__FIREBASE_FRAMEWORKS_VERSION__'];
    const to = [
        process.env.DEV ?
            `${process.cwd()}/firebase-frameworks-${version}.tgz` :
            `^${version}`
    ];
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