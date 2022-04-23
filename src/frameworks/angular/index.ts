import { spawnSync } from 'child_process';
import { promises } from 'fs';
import { join } from 'path';

import { DeployConfig, exec, PathFactory, spawn } from '../../utils';

const { mkdir } = promises;

const escapeRegExp = (str: string) => str.replace(/[\-\[\]\/{}()*+?.\\^$|]/g, '\\$&');

const findPackageVersion = (packageManager: string, name: string) => {
    const match = spawnSync(packageManager, ['list', name], { cwd: process.cwd() }).output.toString().match(`[^|\s]${escapeRegExp(name)}[@| ][^\s]+(\s.+)?$`);
    return match ? match[0].split(new RegExp(`${escapeRegExp(name)}[@| ]`))[1].split(/\s/)[0] : null;
};

export const build = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {

    const { NodeJsAsyncHost } = await import('@angular-devkit/core/node');
    const { workspaces, logging } = await import('@angular-devkit/core');
    const { WorkspaceNodeModulesArchitectHost } = await import('@angular-devkit/architect/node');
    const { Architect } = await import('@angular-devkit/architect');

    const host = workspaces.createWorkspaceHost(new NodeJsAsyncHost());
    const logger = new logging.Logger('foo');
    // TODO pipe to firebase-tools log
    logger.subscribe(it => console.log(it));
    const { workspace } = await workspaces.readWorkspace(getProjectPath(), host);
    const architectHost = new WorkspaceNodeModulesArchitectHost(workspace, getProjectPath());
    const architect = new Architect(architectHost);
    const angularJson = JSON.parse(await host.readFile('angular.json'));
    const project = angularJson.defaultProject;
    const workspaceProject = workspace.projects.get(project);
    if (!workspaceProject) throw 'foo';
    const buildTarget = workspaceProject.targets.get('build');
    if (!buildTarget) throw 'bar';
    const serverTarget = workspaceProject.targets.get('server');
    const usingCloudFunctions = !!serverTarget;
    const prerenderTarget = workspaceProject.targets.get('prerender');
    if (prerenderTarget) {
        // TODO fix once we can migrate to ESM. Spawn for now.
        // ERR require() of ES Module .../node_modules/@nguniversal/express-engine/fesm2015/express-engine.mjs not supported.
        //     Instead change the require of .../node_modules/@nguniversal/express-engine/fesm2015/express-engine.mjs to a dynamic
        //     import() which is available in all CommonJS modules.
        // const run = await architect.scheduleTarget({ project, target: 'prerender', configuration: 'production' }, undefined, { logger });
        // const result = await run.output.toPromise();
        // console.log(result);
        // if (!result.success) throw result.error;
        await spawn(
            'node_modules/.bin/ng',
            ['run', [project, 'prerender'].join(':')],
            {cwd: process.cwd() },
            out => console.log(out.toString()),
            err => console.error(err.toString())
        );
    } else {
        const run = await architect.scheduleTarget({ project, target: 'build' }, undefined, { logger });
        const { error, success } = await run.output.toPromise();
        if (!success) throw error;
        if (serverTarget) {
            const run = await architect.scheduleTarget({ project, target: 'server' }, undefined, { logger });
            const { error, success } = await run.output.toPromise();
            if (!success) throw error;
        }
    }

    const deployPath = (...args: string[]) => join(config.dist, ...args);
    const getHostingPath = (...args: string[]) => deployPath('hosting', ...args);

    const browserOutputPath = buildTarget.options!.outputPath as string;
    await mkdir(getHostingPath(), { recursive: true });
    await exec(`cp -r ${getProjectPath(browserOutputPath)}/* ${getHostingPath()}`);

    let bootstrapScript = '';
    const packageJson = JSON.parse(await host.readFile('package.json'));
    if (usingCloudFunctions) {
        const serverOutputPath = serverTarget.options!.outputPath as string;
        await mkdir(deployPath('functions', serverOutputPath), { recursive: true });
        await mkdir(deployPath('functions', browserOutputPath), { recursive: true });
        await exec(`cp -r ${getProjectPath(serverOutputPath)}/* ${deployPath('functions', serverOutputPath)}`);
        await exec(`cp -r ${getProjectPath(browserOutputPath)}/* ${deployPath('functions', browserOutputPath)}`);
        bootstrapScript = `exports.handle = require('./${serverOutputPath}/main.js').app();\n`;
        const bundleDependencies = serverTarget.options?.bundleDependencies ?? true;
        if (bundleDependencies) {
            const packageManager = angularJson.cli?.packageManager ?? 'npm';
            const dependencies: Record<string, string> = {};
            const externalDependencies: string[] = serverTarget.options?.externalDependencies as any || [];
            externalDependencies.forEach(externalDependency => {
                const packageVersion = findPackageVersion(packageManager, externalDependency);
                if (packageVersion) { dependencies[externalDependency] = packageVersion; }
            });
            packageJson.dependencies = dependencies;
        }
    }

    return { usingCloudFunctions, rewrites: [], redirects: [], headers: [], framework: 'express', packageJson, bootstrapScript };
};