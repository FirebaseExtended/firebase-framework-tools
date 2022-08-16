import { copyFile } from 'fs/promises';

export {};

const { default: { replaceInFile } } = await import('replace-in-file');
const { default: { readJSON } } = await import('fs-extra');

const LOCAL_NODE_MODULES = [
    // Angular
    '@angular-devkit/core/node/index.js',
    '@angular-devkit/core/src/index.js',
    '@angular-devkit/architect/node/index.js',
    '@angular-devkit/architect/src/index.js',
    // Next.js
    'next/dist/build/index.js',
    'next/dist/export/index.js',
    'next/dist/trace/index.js',
    'next/dist/server/config.js',
    'next/constants.js',
    // Nuxt v2
    'nuxt/dist/nuxt.js',
    '@nuxt/generator/dist/generator.js',
    '@nuxt/builder/dist/builder.js',
    // Nuxt3
    '@nuxt/kit/dist/index.mjs',
];

const main = async () => {

    await replaceInFile({
        files: 'dist/**/*',
        from: LOCAL_NODE_MODULES.map(mod => new RegExp(`require\\(["'\`]${mod}["'\`]\\)`, 'g')),
        to: LOCAL_NODE_MODULES.map(mod => `require(\`\${pathToFileURL(getProjectPath())}/node_modules/${mod}\`)`),
    });

    await replaceInFile({
        files: 'dist/**/*',
        from: LOCAL_NODE_MODULES.map(mod => new RegExp(`import\\(["'\`]${mod}["'\`]\\)`, 'g')),
        to: LOCAL_NODE_MODULES.map(mod => `import(\`\${pathToFileURL(getProjectPath())}/node_modules/${mod}\`)`),
    });

    const { devDependencies, version } = await readJSON('package.json');
    const from = ['__FIREBASE_FRAMEWORKS_VERSION__'];
    const to = [version];
    for (const [dep, version] of Object.entries<Record<string, string>>(devDependencies)) {
        from.push(`__${dep.toUpperCase().replace(/[^A-Z]/g, '_')}_VERSION__`);
        to.push(version as any);
    }
    await replaceInFile({
        files: 'dist/**/*',
        from,
        to
    });

    copyFile('src/tools.cjs', 'dist/tools.cjs');
}

main();