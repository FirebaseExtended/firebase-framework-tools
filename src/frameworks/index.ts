import { Commands, spawn } from '../utils.js';
import { existsSync } from 'fs';
import { copyFile, rm, stat, writeFile, access, readFile } from 'fs/promises';
import { basename, join, relative } from 'path';

import {
    DEFAULT_REGION,
    COOKIE_VERSION,
    FIREBASE_ADMIN_VERSION,
    FIREBASE_FRAMEWORKS_VERSION,
    FIREBASE_FUNCTIONS_VERSION,
    LRU_CACHE_VERSION
} from '../constants.js';
import { DeployConfig, findDependency, PathFactory } from '../utils.js';
import { spawnSync } from 'child_process';

const NODE_VERSION = parseInt(process.versions.node, 10).toString();

const UNKNOWN_FRAMEWORK = new Error("We can't detirmine the web framework in use. TODO link");

// TODO move this entirely to firebase-tools
const dynamicImport = async (getProjectPath: PathFactory) => {
    const fileExists = (...files: string[]) => files.some(file => existsSync(getProjectPath(file)));
    if (!fileExists('package.json')) throw UNKNOWN_FRAMEWORK;
    const packageJsonBuffer = await readFile(getProjectPath('package.json'));
    const packageJson = JSON.parse(packageJsonBuffer.toString());
    if (packageJson.directories?.serve) return import('./express/index.js');
    if (fileExists('next.config.js')) return import('./next.js/index.js');
    if (fileExists('nuxt.config.js', 'nuxt.config.ts')) return import('./nuxt/index.js');
    if (fileExists('angular.json')) return import('./angular/index.js');
    throw UNKNOWN_FRAMEWORK;
};

type EmulatorInfo = { name: string, host: string, port: number };

export const injectConfig = async (dist: string, framework: string, options: any, emulators: EmulatorInfo[], ssr: boolean) => {
    if (ssr) {
        const functionsDist = join(dist, 'functions');
        await writeFile(join(functionsDist, ".env"), `FRAMEWORKS_APP_OPTIONS="${JSON.stringify(options).replace(/"/g, '\\"')}"\n`);
    }
    const hostingDist = join(dist, 'hosting');
    const { default: { replaceInFile } } = await import('replace-in-file');
    let configScript = `window.__FRAMEWORKS_APP_OPTIONS__=${JSON.stringify(options)};`;
    if (ssr) configScript += 'window.__FRAMEWORKS_SYNC_CLIENT_AUTH__=true;';
    emulators.forEach(({port, host, name}) => {
        configScript += `window.__${name.toUpperCase()}_EMULATOR_HOST__="${host}:${port}";`;
    });
    await replaceInFile({
        files: join(hostingDist, '**', '*.html'),
        from: '<head>',
        to: `<head><script>${configScript}</script>`,
    });
}

export const build = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {
    const command = await dynamicImport(getProjectPath);
    await rm(config.dist, { recursive: true, force: true });
    const results = await command.build(config, getProjectPath);
    const { usingCloudFunctions, packageJson, framework, bootstrapScript, rewrites, redirects, headers } = results;
    const usesFirebaseConfig = !!findDependency('@firebase/app', getProjectPath());
    if (usingCloudFunctions) {
        packageJson.main = 'server.js';
        delete packageJson.devDependencies;
        packageJson.dependencies ||= {};
        packageJson.dependencies['firebase-frameworks'] = FIREBASE_FRAMEWORKS_VERSION;
        const functionsDist = join(config.dist, 'functions');

        // TODO dry up deps and overrides
        for (const [name, version] of Object.entries(packageJson.dependencies as Record<string, string>)) {
            if (version.startsWith('file:')) {
                const path = version.split(':')[1];
                if (await access(path).catch(() => true)) continue;
                const stats = await stat(path);
                console.log(`Packing file-system dependency on ${path} for Cloud Functions`);
                if (stats.isDirectory()) {
                    const result = spawnSync(Commands.NPM, ['pack', relative(functionsDist, path)], { cwd: functionsDist });
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
        if (packageJson.overrides) {
            for (const [name, version] of Object.entries(packageJson.overrides as Record<string, string>)) {
                if (version.startsWith('file:')) {
                    const path = version.split(':')[1];
                    if (await access(path).catch(() => true)) continue;
                    const stats = await stat(path);
                    console.log(`Packing file-system dependency on ${path} for Cloud Functions`);
                    if (stats.isDirectory()) {
                        const result = spawnSync(Commands.NPM, ['pack', relative(functionsDist, path)], { cwd: functionsDist });
                        if (!result.stdout) continue;
                        const filename = result.stdout.toString().trim();
                        packageJson.overrides[name] = `file:${filename}`;
                    } else {
                        const filename = basename(path);
                        await copyFile(path, join(functionsDist, filename));
                        packageJson.overrides[name] = `file:${filename}`;
                    }
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

        await spawn(Commands.NPM, ['i', '--only', 'production', '--no-audit'], { cwd: functionsDist }, (stdoutChunk: any) => {
            console.log(stdoutChunk.toString());
        }, (errChunk: any) => {
            console.error(errChunk.toString());
        });

        if (bootstrapScript) {
            await writeFile(join(functionsDist, 'bootstrap.js'), bootstrapScript);
        }
        if (usesFirebaseConfig) {
            await writeFile(join(functionsDist, 'server.js'), `const { onRequest } = require('firebase-functions/v2/https');

const firebaseAwareServer = import('firebase-frameworks/server/firebase-aware');
const frameworkServer = import('firebase-frameworks/frameworks/${framework}/server');
const server = Promise.all([firebaseAwareServer, frameworkServer]).then(([ {handleFactory}, {handle} ]) => handleFactory(handle));

exports.ssr = onRequest((req, res) => server.then(it => it(req, res)));
`);
        } else {
            await writeFile(join(functionsDist, 'server.js'), `const { onRequest } = require('firebase-functions/v2/https');
const server = import('firebase-frameworks/frameworks/${framework}/server');

exports.ssr = onRequest((req, res) => server.then(({handle}) => handle(req, res)));
`);
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
