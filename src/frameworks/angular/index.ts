import type { Target } from '@angular-devkit/architect';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { copy } from 'fs-extra';
import { parse } from 'jsonc-parser';
import { pathToFileURL } from 'url';

// Used by the build process, don't shake
const _pathToFileUrl = pathToFileURL;

import { Commands, DeployConfig, findDependency, PathFactory, spawn } from '../../utils.js';

class MyError extends Error {
    constructor(reason: string) {
        console.error(reason);
        super();
    }
}

export const build = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {

    const { NodeJsAsyncHost } = await import('@angular-devkit/core/node/index.js');
    const { workspaces, logging } = await import('@angular-devkit/core/src/index.js');
    const { WorkspaceNodeModulesArchitectHost } = await import('@angular-devkit/architect/node/index.js');
    const { Architect, targetFromTargetString, targetStringFromTarget } = await import('@angular-devkit/architect/src/index.js');

    // TODO log to firebase-tools
    const logger = new logging.Logger('firebase-tools');
    logger.subscribe(it => console.log(it.message));

    const host = workspaces.createWorkspaceHost(new NodeJsAsyncHost());
    const { workspace } = await workspaces.readWorkspace(getProjectPath(), host);
    const architectHost = new WorkspaceNodeModulesArchitectHost(workspace, getProjectPath());
    const architect = new Architect(architectHost);

    let project: string|undefined = (globalThis as any).NG_DEPLOY_PROJECT;
    let browserTarget: Target|undefined;
    let serverTarget: Target|undefined;;
    let prerenderTarget: Target|undefined;

    if (!project) {
        const angularJson = parse(await host.readFile(getProjectPath('angular.json')));
        project = angularJson.defaultProject;
    }

    if (!project) {
        const apps: string[] = [];
        workspace.projects.forEach((value, key) => {
            if (value.extensions.projectType === 'application') apps.push(key);
        });
        if (apps.length === 1) project = apps[0];
    }

    if (!project) throw new MyError('Unable to detirmine the application to deploy. Use the NG_DELPOY_PROJECT enivornment varaible or `ng deploy` via @angular/fire.');

    const workspaceProject = workspace.projects.get(project);
    if (!workspaceProject) throw new MyError(`No project ${project} found.`);
    const deployTargetDefinition = workspaceProject.targets.get('deploy');

    if (deployTargetDefinition?.builder === '@angular/fire:deploy') {
        const options = deployTargetDefinition.options;
        if (typeof options?.prerenderTarget === 'string')
            prerenderTarget = targetFromTargetString(options.prerenderTarget);
        if (typeof options?.browserTarget === 'string')
            browserTarget = targetFromTargetString(options.browserTarget);
        if (typeof options?.serverTarget === 'string')
            serverTarget = targetFromTargetString(options.serverTarget);
        if (!browserTarget) throw new MyError('ng-deploy is missing a browser target. Plase check your angular.json.');
        if (prerenderTarget) {
            const prerenderOptions = await architectHost.getOptionsForTarget(prerenderTarget);
            if (targetStringFromTarget(browserTarget) !== prerenderOptions?.browserTarget)
                throw new MyError('ng-deploy\'s browserTarget and prerender\'s browserTarget do not match. Please check your angular.json');
            if (serverTarget && targetStringFromTarget(serverTarget) !== prerenderOptions?.serverTarget)
                throw new MyError('ng-deploy\'s serverTarget and prerender\'s serverTarget do not match. Please check your angular.json');
            if (!serverTarget) console.warn('Treating the application as fully rendered. Add a serverTarget to your deploy target in angular.json to utilize server-side rendering.');
        }
    } else if (workspaceProject.targets.has('prerender')) {
        const target = workspaceProject.targets.get('prerender')!;
        const configurations = Object.keys(target.configurations!);
        const configuration = configurations.includes('production') ? 'production' : target.defaultConfiguration;
        if (!configuration) throw new MyError('No production or default configutation found for prerender.');
        if (configuration !== 'production') console.warn(`Using ${configuration} configuration for the prerender, we suggest adding a production target.`);
        prerenderTarget = { project, target: 'prerender', configuration };
        const production = await architectHost.getOptionsForTarget(prerenderTarget);
        if (typeof production?.browserTarget !== 'string')
            throw new MyError('Prerender browserTarget expected to be string, check your angular.json.');
        browserTarget = targetFromTargetString(production.browserTarget);
        if (typeof production?.serverTarget !== 'string')
            throw new MyError('Prerender serverTarget expected to be string, check your angular.json.');
        serverTarget = targetFromTargetString(production.serverTarget);
    } else {
        if (workspaceProject.targets.has('build')) {
            const target = workspaceProject.targets.get('build')!;
            const configurations = Object.keys(target.configurations!);
            const configuration = configurations.includes('production') ? 'production' : target.defaultConfiguration;
            if (!configuration) throw new MyError('No production or default configutation found for build.');
            if (configuration !== 'production') console.warn(`Using ${configuration} configuration for the browser deploy, we suggest adding a production target.`);
            browserTarget = { project, target: 'build', configuration };
        }
        if (workspaceProject.targets.has('server')) {
            const target = workspaceProject.targets.get('server')!;
            const configurations = Object.keys(target.configurations!);
            const configuration = configurations.includes('production') ? 'production' : target.defaultConfiguration;
            if (!configuration) throw new MyError('No production or default configutation found for server.');
            if (configuration !== 'production') console.warn(`Using ${configuration} configuration for the server deploy, we suggest adding a production target.`);
            serverTarget = { project, target: 'server', configuration };
        }
    }

    const scheduleTarget = async (target: Target) => {
        const run = await architect.scheduleTarget(target, undefined, { logger });
        const { success, error } = await run.output.toPromise();
        if (!success) throw new Error(error);
    }

    if (!browserTarget) throw new MyError('No build target...');

    if (prerenderTarget) {
        // TODO there is a bug here. Spawn for now.
        // await scheduleTarget(prerenderTarget);
        await spawn(
            Commands.ng,
            ['run', targetStringFromTarget(prerenderTarget)],
            { cwd: getProjectPath() },
            // TODO log to firebase-tools
            (out: any) => console.log(out.toString()),
            (err: any) => console.error(err.toString())
        );
    } else {
        await scheduleTarget(browserTarget);
        if (serverTarget) await scheduleTarget(serverTarget);
    }

    const deployPath = (...args: string[]) => join(config.dist, ...args);
    const getHostingPath = (...args: string[]) => deployPath('hosting', ...args);

    const browserTargetOptions = await architectHost.getOptionsForTarget(browserTarget);
    if (typeof browserTargetOptions?.outputPath !== 'string') throw new MyError('browserTarget output path is not a string');
    const browserOutputPath = browserTargetOptions.outputPath;
    await mkdir(getHostingPath(), { recursive: true });
    await copy(getProjectPath(browserOutputPath), getHostingPath());

    const usingCloudFunctions = !!serverTarget;

    let bootstrapScript = '';
    const packageJson = JSON.parse(await host.readFile(getProjectPath('package.json')));
    if (serverTarget) {
        const serverTargetOptions = await architectHost.getOptionsForTarget(serverTarget);
        if (typeof serverTargetOptions?.outputPath !== 'string') throw new MyError('serverTarget output path is not a string');
        const serverOutputPath = serverTargetOptions.outputPath;
        await mkdir(deployPath('functions', serverOutputPath), { recursive: true });
        await mkdir(deployPath('functions', browserOutputPath), { recursive: true });
        await copy(getProjectPath(serverOutputPath), deployPath('functions', serverOutputPath));
        await copy(getProjectPath(browserOutputPath), deployPath('functions', browserOutputPath));
        bootstrapScript = `exports.handle = require('./${serverOutputPath}/main.js').app();\n`;
        const bundleDependencies = serverTargetOptions.bundleDependencies ?? true;
        if (bundleDependencies) {
            const dependencies: Record<string, string> = {};
            const externalDependencies: string[] = serverTargetOptions.externalDependencies as any || [];
            externalDependencies.forEach(externalDependency => {
                const packageVersion = findDependency(externalDependency)?.version;
                if (packageVersion) { dependencies[externalDependency] = packageVersion; }
            });
            packageJson.dependencies = dependencies;
        }
    }

    // TODO add immutable header on static assets

    return { usingCloudFunctions, rewrites: [], redirects: [], headers: [], framework: 'angular', packageJson, bootstrapScript };
};