import { NodeJsAsyncHost } from '@angular-devkit/core/node';
import { workspaces, logging } from '@angular-devkit/core';
import { WorkspaceNodeModulesArchitectHost } from '@angular-devkit/architect/node';
import { Target, Architect, targetFromTargetString, targetStringFromTarget } from '@angular-devkit/architect';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { copy } from 'fs-extra';
import { parse } from 'jsonc-parser';

import { DeployConfig, findDependency, PathFactory, spawn } from '../../utils';

export const build = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {

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
        const angularJson = parse(await host.readFile('angular.json'));
        project = angularJson.defaultProject;
        if (!project) throw `angular.json missing defaultProject`;
    }
    // TODO if there are multiple projects warn
    const workspaceProject = workspace.projects.get(project);
    if (!workspaceProject) throw `No project ${project} found.`;
    const deployTargetDefinition = workspaceProject.targets.get('deploy');
    if (deployTargetDefinition?.builder === '@angular/fire:deploy') {
        const options = deployTargetDefinition.options;
        if (typeof options?.prerenderTarget === 'string')
            prerenderTarget = targetFromTargetString(options.prerenderTarget);
        if (typeof options?.browserTarget === 'string')
            browserTarget = targetFromTargetString(options.browserTarget);
        if (typeof options?.serverTarget === 'string')
            serverTarget = targetFromTargetString(options.serverTarget);
        if (prerenderTarget) {
            const prerenderOptions = await architectHost.getOptionsForTarget(prerenderTarget);
            if (browserTarget) {
                if (targetStringFromTarget(browserTarget) !== prerenderOptions?.browserTarget)
                    throw 'foo';
            } else {
                if (typeof prerenderOptions?.browserTarget !== 'string') throw 'foo';
                browserTarget = targetFromTargetString(prerenderOptions.browserTarget);
            }
            if (serverTarget && targetStringFromTarget(serverTarget) !== prerenderOptions?.serverTarget)
                throw 'foo';
        }
    } else if (workspaceProject.targets.has('prerender')) {
        // TODO test and warn if production doesn't exist, fallback to default
        prerenderTarget = { project, target: 'prerender', configuration: 'production' };
        const production = await architectHost.getOptionsForTarget(prerenderTarget);
        if (typeof production?.browserTarget !== 'string') throw 'foo';
        browserTarget = targetFromTargetString(production.browserTarget);
        if (typeof production?.serverTarget !== 'string') throw 'foo';
        serverTarget = targetFromTargetString(production.serverTarget);
    } else {
        // TODO test and warn if production doesn't exist, fallback to default
        const configuration = 'production';
        if (workspaceProject.targets.has('build'))
            browserTarget = { project, target: 'build', configuration };
        if (workspaceProject.targets.has('server'))
            serverTarget = { project, target: 'server', configuration };
    }

    const scheduleTarget = async (target: Target) => {
        const run = await architect.scheduleTarget(target, undefined, { logger });
        const { success, error } = await run.output.toPromise();
        if (!success) throw new Error(error);
    }

    if (!browserTarget) throw 'No build target...';

    if (prerenderTarget) {
        // TODO fix once we can migrate to ESM. Spawn for now.
        // ERR require() of ES Module .../node_modules/@nguniversal/express-engine/fesm2015/express-engine.mjs not supported.
        //     Instead change the require of .../node_modules/@nguniversal/express-engine/fesm2015/express-engine.mjs to a dynamic
        //     import() which is available in all CommonJS modules.
        // await scheduleTarget(prerenderTarget);
        await spawn(
            'node_modules/.bin/ng',
            ['run', targetStringFromTarget(prerenderTarget)],
            { cwd: process.cwd() },
            // TODO log to firebase-tools
            out => console.log(out.toString()),
            err => console.error(err.toString())
        );
    } else {
        await scheduleTarget(browserTarget);
        if (serverTarget) await scheduleTarget(serverTarget);
    }

    const deployPath = (...args: string[]) => join(config.dist, ...args);
    const getHostingPath = (...args: string[]) => deployPath('hosting', ...args);

    const browserTargetOptions = await architectHost.getOptionsForTarget(browserTarget);
    if (typeof browserTargetOptions?.outputPath !== 'string') throw 'foo';
    const browserOutputPath = browserTargetOptions.outputPath;
    await mkdir(getHostingPath(), { recursive: true });
    await copy(getProjectPath(browserOutputPath), getHostingPath());

    const usingCloudFunctions = !!serverTarget;

    let bootstrapScript = '';
    const packageJson = JSON.parse(await host.readFile('package.json'));
    if (serverTarget) {
        const serverTargetOptions = await architectHost.getOptionsForTarget(serverTarget);
        if (typeof serverTargetOptions?.outputPath !== 'string') throw 'foo';
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

    return { usingCloudFunctions, rewrites: [], redirects: [], headers: [], framework: 'express', packageJson, bootstrapScript };
};