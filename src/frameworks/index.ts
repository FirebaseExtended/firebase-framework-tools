import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { copyFile, rm, stat, writeFile } from 'fs/promises';
import { basename, join, relative } from 'path';

import {
    DEFAULT_REGION,
    COOKIE_VERSION,
    FIREBASE_ADMIN_VERSION,
    FIREBASE_FRAMEWORKS_VERSION,
    FIREBASE_FUNCTIONS_VERSION,
    LRU_CACHE_VERSION
} from '../constants';
import { DeployConfig, findDependency, PathFactory } from '../utils';

const NODE_VERSION = parseInt(process.versions.node, 10).toString();

const dynamicImport = (getProjectPath: PathFactory) => {
    const exists = (...files: string[]) => files.some(file => existsSync(getProjectPath(file)));
    if (exists('next.config.js')) return import('./next.js/index.js');
    if (exists('nuxt.config.js', 'nuxt.config.ts')) return import('./nuxt/index.js');
    if (exists('angular.json')) return import('./angular/index.js');
    return import('./express/index.js');
};

export const build = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {
    const command = await dynamicImport(getProjectPath);
    await rm(config.dist, { recursive: true, force: true });
    const results = await command.build(config, getProjectPath);
    const { usingCloudFunctions, packageJson, framework, bootstrapScript, rewrites, redirects, headers } = results;
    let usesFirebaseConfig = false;
    if (usingCloudFunctions) {
        const firebaseAuthDependency = findDependency('@firebase/auth', getProjectPath());
        usesFirebaseConfig = !!firebaseAuthDependency;

        packageJson.main = 'server.js';
        delete packageJson.devDependencies;
        packageJson.dependencies ||= {};
        packageJson.dependencies['firebase-frameworks'] = FIREBASE_FRAMEWORKS_VERSION;
        const functionsDist = join(config.dist, 'functions');
        for (const [name, version] of Object.entries(packageJson.dependencies as Record<string, string>)) {
            if (version.startsWith('file:')) {
                const path = version.split(':')[1];
                const stats = await stat(path);
                if (stats.isDirectory()) {
                    const result = spawnSync('npm', ['pack', relative(functionsDist, path)], { cwd: functionsDist });
                    if (!result.stdout) continue;
                    const filename = result.stdout.toString().trim();
                    packageJson.dependencies[name] = `file:${filename}`;
                } else {
                    const filename = basename(path);
                    await copyFile(path, join(functionsDist, filename));
                    packageJson.dependencies[name] = `file:${filename}`;
                }
            }
        }

        // TODO(jamesdaniels) test these with semver, error if already set out of range
        packageJson.dependencies['firebase-admin'] ||= FIREBASE_ADMIN_VERSION;
        packageJson.dependencies['firebase-functions'] ||= FIREBASE_FUNCTIONS_VERSION;
        if (usesFirebaseConfig) {
            packageJson.dependencies['cookie'] ||= COOKIE_VERSION;
            packageJson.dependencies['lru-cache'] ||= LRU_CACHE_VERSION;
        }
        packageJson.engines ||= {};
        packageJson.engines.node ||= NODE_VERSION;

        await writeFile(join(functionsDist, 'package.json'), JSON.stringify(packageJson, null, 2));

        await copyFile(getProjectPath('package-lock.json'), join(functionsDist, 'package-lock.json')).catch(() => {});

        const npmInstall = spawnSync('npm', ['i', '--only', 'production', '--no-audit', '--silent'], { cwd: functionsDist });
        if (npmInstall.status) {
            console.error(npmInstall.output.toString());
        }

        // TODO(jamesdaniels) allow configuration of the Cloud Function
        await writeFile(join(functionsDist, 'settings.js'), `exports.HTTPS_OPTIONS = {};
exports.FRAMEWORK = '${framework}';
`);

        if (bootstrapScript) {
            await writeFile(join(functionsDist, 'bootstrap.js'), bootstrapScript);
        }
        if (usesFirebaseConfig) {
            await writeFile(join(functionsDist, 'server.js'), "exports.ssr = require('firebase-frameworks/server/firebase-aware').ssr;\n");
        } else {
            await writeFile(join(functionsDist, 'server.js'), "exports.ssr = require('firebase-frameworks/server').ssr;\n");
        }

        await writeFile(join(functionsDist, 'functions.yaml'), JSON.stringify({
            endpoints: {
                [config.function!.name]: {
                    platform:  'gcfv2',
                    region: [DEFAULT_REGION],
                    labels: {},
                    httpsTrigger: {},
                    entryPoint: 'ssr'
                }
            },
            specVersion: 'v1alpha1',
            // TODO(jamesdaniels) add persistent disk if needed
            requiredAPIs: []
        }, null, 2));
    }
    return { usingCloudFunctions, rewrites, redirects, headers, usesFirebaseConfig };
};
