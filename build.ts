import { replaceInFile } from 'replace-in-file';

const ES_MODULES = ['@nuxt/kit', 'nuxt3'];

const main = async () => {
    await replaceInFile({
        files: 'dist/**/*',
        from: ES_MODULES.map(path => `Promise.resolve().then(() => __importStar(require(\`\${getProjectPath('node_modules')}/${path}/dist/index.mjs\`)))`),
        to: ES_MODULES.map(path => `import(\`\${getProjectPath('node_modules')}/${path}/dist/index.mjs\`)`)
    });
}

main();