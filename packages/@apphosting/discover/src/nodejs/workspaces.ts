import { parse as parseYaml } from "yaml";
import { parseSyml } from '@yarnpkg/parsers';
import { DiscoveryContext } from "../interfaces.js";
import { globStream } from "glob";

export type WorkspaceInfo = {
    root?: string;
    directories: Set<string>;
    tooling?: string;
};

export async function findWorkspaceInfo(ctx: DiscoveryContext, lockfile: string | undefined): Promise<WorkspaceInfo> {
    const { root, fs: { pathExists, readJson }, path } = ctx;
    const directories = new Set<string>(["."]);
    let workspaceRoot: string | undefined;

    if (!lockfile) {
        let dir = root;
        while (dir !== path.dirname(dir)) {
            const lockfiles = ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml"];
            for (const lf of lockfiles) {
                if (await pathExists(path.join(dir, lf))) {
                    workspaceRoot = dir;
                    break;
                }
            }
            if (workspaceRoot) break;
            dir = path.dirname(dir);
        }
    }

    const searchRoot = workspaceRoot || root;
    const packageJSON = await readJson(path.join(searchRoot, "package.json")).catch(() => ({}));
    if (packageJSON.workspaces) {
        const workspaceStream = globStream(packageJSON.workspaces, { cwd: searchRoot, withFileTypes: true });
        await new Promise<void>((resolve) => {
            workspaceStream.on("data", (match) => {
                if (match.isDirectory()) directories.add(path.relative(root, match.fullpath()));
            });
            workspaceStream.on("end", () => {
                resolve();
            });
        });
    }

    let tooling: string | undefined;
    const monorepoTools = ["lerna.json", "turbo.json", "nx.json", "rush.json", "angular.json"];
    for (const toolConfigFile of monorepoTools) {
        if (await pathExists(path.join(searchRoot, toolConfigFile))) {
            tooling = toolConfigFile.split('.')[0];
            if (tooling === 'lerna') {
                const lernaJSON = await readJson(path.join(searchRoot, "lerna.json"));
                if (lernaJSON.packages) {
                    // TODO reuse code with the packageJson workspaces
                    // TODO glob doesn't work with github virtual FS, build alternative
                    const workspaceStream = globStream(lernaJSON.packages, { cwd: searchRoot, withFileTypes: true });
                    await new Promise<void>((resolve) => {
                        workspaceStream.on("data", (match) => {
                            if (match.isDirectory()) directories.add(path.relative(root, match.fullpath()));
                        });
                        workspaceStream.on("end", () => {
                            resolve();
                        });
                    });
                }
            }
            break;
        }
    }

    // TODO filter out directories that are outside the search root
    if (directories.size) {
        workspaceRoot = searchRoot;
    }

    return { root: workspaceRoot, directories, tooling };
}

export async function getDependencies(ctx: DiscoveryContext, lockfile: string | undefined, workspaceRoot: string | undefined): Promise<Map<string, Map<string, string>>> {
    const { root, fs: { readFile, readJson }, path } = ctx;
    const dependencies = new Map<string, Map<string, string>>();
    if (!lockfile) return dependencies;

    const lockfilePath = path.join(workspaceRoot || root, lockfile)
    if (lockfile === "package-lock.json" || lockfile === "npm-shrinkwrap.json") {
        const packageLock = await readJson(lockfilePath);
        for (const pkg of Object.keys(packageLock.packages || {})) {
            const match = pkg.match(/^(.+)?node_modules\/(.+)$/);
            if (!match) continue;
            const version = packageLock.packages[pkg].version;
            const [,prefix,name] = match;
            const normalizedPrefix = prefix?.replace(/\/$/, "") || ".";
            if (!dependencies.has(normalizedPrefix)) dependencies.set(normalizedPrefix, new Map<string, string>());
            dependencies.get(normalizedPrefix)!.set(name, version);
        }
    } else if (lockfile === "yarn.lock") {
        // TODO handle yarn workspaces
        const yarnLock = parseSyml((await readFile(lockfilePath)).toString("utf8"));
        for (const pkg of Object.keys(yarnLock)) {
            const match = pkg.match(/^(.+)@npm:(.+$)/);
            if (!match) continue;
            const normalizedPrefix = ".";
            const [,name,version] = match;
            if (!dependencies.has(",.")) dependencies.set(normalizedPrefix, new Map<string, string>());
            dependencies.get(normalizedPrefix)!.set(name, version);
        }
    } else if (lockfile === "pnpm-lock.yaml") {
        // TODO handle pnpm workspaces
        const pnpmLock = parseYaml((await readFile(lockfilePath)).toString());
        for (const pkg of Object.keys(pnpmLock.packages || {})) {
            const parts = pkg.replace(/^\//, "").split("(")[0].split("@");
            const version = parts.pop()!;
            const normalizedPrefix = ".";
            const name = parts.join("@");
            if (!dependencies.has(",.")) dependencies.set(normalizedPrefix, new Map<string, string>());
            dependencies.get(normalizedPrefix)!.set(name, version);
        }
    }
//    console.log({ dependencies });

    return dependencies;
}
