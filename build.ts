import { replaceInFile } from 'replace-in-file';

const ES_MODULES = ['@nuxt/kit', 'nuxt3'];

const main = async () => {
    await replaceInFile({
        files: 'dist/**/*',
        from: ES_MODULES.map(path => `Promise.resolve().then(() => __importStar(require('${path}')))`),
        to: ES_MODULES.map(path => `import('${path}')`)
    });
}

main();