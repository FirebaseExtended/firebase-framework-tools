import { spawnSync } from 'child_process';
import { replaceInFile } from 'replace-in-file';

const ES_MODULES = [
    "getProjectPath('node_modules', '@nuxt', 'kit', 'dist', 'index.mjs')",
    "`${process.cwd()}/index.mjs`",
];

const main = async () => {
    await replaceInFile({
        files: 'dist/**/*',
        from: ES_MODULES.map(path => `Promise.resolve().then(() => __importStar(require(${path})))`),
        to: ES_MODULES.map(path => `import(${path})`)
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