import { replaceInFile } from 'replace-in-file';

const ES_MODULES = [
    "getProjectPath('node_modules', '@nuxt', 'kit', 'dist', 'index.mjs')",
];

const main = async () => {
    await replaceInFile({
        files: 'dist/**/*',
        from: ES_MODULES.map(path => `Promise.resolve().then(() => __importStar(require(${path})))`),
        to: ES_MODULES.map(path => `import(${path})`)
    });
}

main();