import { dirname, extname, join } from "node:path";
import { KNOWN_ADAPTERS, PLATFORMS } from "../constants.js";
import { Command, DiscoveredFramework, DiscoveryContext, MockFileSystem } from "../interfaces.js";
import { parse as parseYaml } from "yaml";
import { parseSyml } from '@yarnpkg/parsers';

import { pathToFileURL } from "node:url";
import { readJSON } from "fs-extra";

const knownFrameworks = PLATFORMS.find(([id]) => id === "nodejs")?.[4] || [];

// TODO refactor to use DiscoveryContext
export async function discoverNodeJSFrameworks(root: string, fs: MockFileSystem, path: typeof import("node:path")) : Promise<Array<DiscoveredFramework>> {
    const { pathExists, readJson, readFile } = fs;
    const ctx: DiscoveryContext = { root, fs, path };
    if (!(await pathExists(path.join(root, "package.json")))) return [];
    // have nodejs. find the package manager
    // default to NPM, but if we find a lockfile for another package manager, use that instead
    const discoveredFrameworks: Array<DiscoveredFramework> = [];
    let packageManager: "npm"|"yarn"|"pnpm" = "npm";
    let packageManagerVersion: string|undefined = undefined;
    let lockfile: string|undefined = undefined;
    let corepack = false;
    const workspaces = new Set<string>();
    const dependencies = new Map<string, string>();
    const packageJSON = await readJson(path.join(root, "package.json"));
    if (packageJSON.packageManager) {
        const [pm, version] = packageJSON.packageManager.split("@");
        packageManager = pm;
        packageManagerVersion = version;
        corepack = true;
        if (packageJSON.workspaces) packageJSON.workspaces.forEach((workspace: string) => workspaces.add(workspace));
    } else {
        if (await pathExists(path.join(root, "package-lock.json"))) lockfile = "package-lock.json";
        if (await pathExists(path.join(root, "npm-shrinkwrap.json"))) lockfile = "npm-shrinkwrap.json";
    }
    // TODO do something if it conflicts with detected package manager above
    if (await pathExists(path.join(root, "yarn.lock"))) {
        packageManager = "yarn";
        lockfile = "yarn.lock";
    } else if (await pathExists(path.join(root, "pnpm-lock.yaml"))) {
        packageManager = "pnpm";
        lockfile = "pnpm-lock.yaml";
    }
    let installCommand: Command[] = [["npm", ["ci", "--include=dev"]]];
    if (packageManager === "yarn") installCommand = [["yarn", ["install", "--immutable"]]];
    if (packageManager === "pnpm") installCommand = [["pnpm", ["install", "--frozen-lockfile"]]];
    // if we didn't find a lockfile in the current
    // are we in a workspace? TODO validate in that package.json
    // look for pnpm-workspace.yaml, yarn workspaces, etc.
    let workspaceRoot: string|undefined;
    if (!lockfile) {
        let dir = root;
        // TODO use system root instead of "/"?
        while (dir !== "/") {
            if (await pathExists(path.join(dir, "package-lock.json"))) {
                lockfile = "package-lock.json";
                workspaceRoot = dir;
                break;
            }
            if (await pathExists(path.join(dir, "npm-shrinkwrap.json"))) {
                lockfile = "npm-shrinkwrap.json";
                workspaceRoot = dir;
                break;
            }
            if (await pathExists(path.join(dir, "yarn.lock"))) {
                lockfile = "yarn.lock";
                workspaceRoot = dir;
                break;
            }
            if (await pathExists(path.join(dir, "pnpm-lock.yaml"))) {
                lockfile = "pnpm-lock.yaml";
                workspaceRoot = dir;
                break;
            }
            dir = path.normalize(path.join(dir, ".."));
        }
    }
    if (workspaceRoot) {
        // TODO look for workspace directories from yarn, pnpm, etc.
        const rootPackageJSON = await readJson(path.join(workspaceRoot, "package.json"));
        if (rootPackageJSON.workspaces) rootPackageJSON.workspaces.forEach((workspace: string) => workspaces.add(path.join(workspaceRoot!, workspace)));
    }
    if (lockfile === "package-lock.json" || lockfile === "npm-shrinkwrap.json") {
        // read the package-lock.json to get dependencies
        const packageLock = await readJson(path.join(workspaceRoot || root, lockfile));
        for (const pkg of Object.keys(packageLock.packages)) {
            const name = pkg.replace(/^node_modules\//, "");
            if (!name) continue; // skip the root package
            const version: string = packageLock.packages[pkg].version;
            dependencies.set(name, version);
        }
    } else if (lockfile === "yarn.lock") {
        const file = await readFile(path.join(workspaceRoot || root, lockfile));
        const yarnLock = parseSyml(file.toString("utf8"));
        for (const pkg of Object.keys(yarnLock)) {
            const match = pkg.match(/^(.+)@npm:(.+$)/);
            if (!match) continue;
            dependencies.set(match[1], match[2]);
        }
    } else if (lockfile === "pnpm-lock.yaml") {
        // TODO read the pnpm-lock.yaml to get dependencies
        const pnpmLockContents = await readFile(path.join(workspaceRoot || root, lockfile));
        const pnpmLock = parseYaml(pnpmLockContents.toString());
        for (const pkg of Object.keys(pnpmLock.packages)) {
             const parts = pkg.replace(/^\//, "").split("(")[0].split("@");
            const version = parts.pop()!;
            dependencies.set(parts.join("@"), version);
        }
    }
    let monorepoTooling: string|undefined = undefined;
    // TODO should scan over all of the monorepo tools in parallel and search all of their targets, search both workspace root and current dir
    // add all these to "workspaces" so we can find them later
    if (await pathExists(path.join(workspaceRoot || root, "lerna.json"))) {
        monorepoTooling = "lerna";
        const learnaJSON = await readJson(path.join(workspaceRoot || root, "lerna.json"));
        if (learnaJSON.packages) learnaJSON.packages.forEach((workspace: string) => workspaces.add(path.join(workspaceRoot || root, workspace)));
    } else if (await pathExists(path.join(workspaceRoot || root, "turbo.json"))) {
        monorepoTooling = "turborepo";
        // TODO look into extends
        const turboJSON = await readJson(path.join(workspaceRoot || root, "turbo.json"));
    } else if (await pathExists(path.join(workspaceRoot || root, "nx.json"))) {
        monorepoTooling = "nx";
        const nxJSON = await readJson(path.join(workspaceRoot || root, "nx.json"));
    } else if (await pathExists(path.join(workspaceRoot || root, "rush.json"))) {
        monorepoTooling = "rush";
        const rushJSON = await readJson(path.join(workspaceRoot || root, "rush.json"));
    } else if (await pathExists(path.join(workspaceRoot || root, "angular.json"))) {
        monorepoTooling = "angular";
        const angularJSON = await readJson(path.join(workspaceRoot || root, "angular.json"));
        if (angularJSON.projects) {
            for (const target of Object.keys(angularJSON.projects)) {
                const project = angularJSON.projects[target];
                if (project.projectType !== "application") continue;
                if (!project.architect?.build) continue;
                const root_directory = path.join(workspaceRoot || root, project.root || ".");
                const isStatic = !project.architect?.build?.options?.ssr || project.architect?.build?.options?.outputMode === "static";
                const dist_directory = `${project.architect.build.options?.outputPath || `dist/${target}`}${isStatic && project.architect.build.builder.endsWith(":application") ? "/browser" : ""}`;
                discoveredFrameworks.push({
                    root_directory: path.relative(root, root_directory) || ".",
                    id: "angular",
                    version: dependencies.get("@angular/core") || "0.0.0",
                    single_page_app: isStatic,
                    dist_directory,
                    monorepo_tooling: {
                        id: monorepoTooling,
                        target,
                    },
                    packageManager: {
                        id: packageManager,
                        version: packageManagerVersion, // TODO: get version of package manager
                        metadata: {
                            lockfile,
                            corepack,
                            workspace: !!workspaceRoot,
                            root_directory: workspaceRoot && (path.relative(root, workspaceRoot) || "."),
                        },
                    },
                    platform: {
                        id: "nodejs",
                        version: "0.0.0", // TODO: get version of platform
                    },
                    commands: {
                        install: installCommand, // TODO use package manager commands
                        build: [[packageManager, ["run", "build"]]],
                        dev: [packageManager, ["start"]],
                        serve: isStatic ? ["npx", ["-y", "superstatic", "serve", "-p", "$PORT", "--compression", "--host", "0.0.0.0", "."]] : ["node", ["./server/server.mjs"]],
                    },
                    known_adapters: KNOWN_ADAPTERS.nodejs?.angular,
                    discoveryComplete: true,
                });
            }
        }
    }
    if (workspaces.size === 0) workspaces.add(workspaceRoot || root);
    await Promise.all(Array.from(workspaces).map((directory) => 
        Promise.all(knownFrameworks.map(async ([id, requiredPackages, requiredFiles, bundledWith, getDiscoveryProps]) => {
            if (id === "angular" && monorepoTooling === "angular") return; // already handled above
            const requiredFileExist = requiredFiles.length === 0 ||
                (
                  await Promise.all(requiredFiles.map((it) => pathExists(path.join(directory, it))))
                ).some((it) => it);
            if (!requiredFileExist) return;
            const requiredPackagePresent = requiredPackages.some((it) => dependencies.has(it));
            if (!requiredPackagePresent) return;
            const assumptions: DiscoveredFramework = {
                root_directory: path.relative(root, directory) || ".",
                id,
                version: dependencies.get(requiredPackages[0]),
                single_page_app: false,
                dist_directory: "dist",
                monorepo_tooling: monorepoTooling ? {
                    id: monorepoTooling,
                    target: undefined, // TODO: detect target
                } : undefined,
                packageManager: {
                    id: packageManager,
                    version: packageManagerVersion, // TODO: get version of package manager
                    metadata: {
                        lockfile,
                        corepack,
                        workspace: !!workspaceRoot,
                        root_directory: workspaceRoot && (path.relative(root, workspaceRoot) || "."),
                    },
                },
                platform: {
                    id: "nodejs",
                    version: "0.0.0", // TODO: get version of platform
                },
                commands: {
                    install: installCommand, // TODO use package manager commands
                    build: [[packageManager, ["run", "build"]]],
                    dev: [packageManager, ["run", "dev"]],
                    serve: [packageManager, ["start"]]
                },
                known_adapters: KNOWN_ADAPTERS.nodejs?.[id],
                discoveryComplete: true, // TODO figure out if we need to install/build, nextjs etc.
            };
            discoveredFrameworks.push({
                ...assumptions,
                ...(await getDiscoveryProps?.(ctx) || {}),
            });
        }))
    ));

    if (discoveredFrameworks.length === 0) return [{
        root_directory: root,
        id: "nodejs" as any,
        version: "0.0.0",
        single_page_app: false,
        dist_directory: ".",
        monorepo_tooling: monorepoTooling ? {
            id: monorepoTooling,
            target: undefined, // TODO: detect target
        } : undefined,
        packageManager: {
            id: packageManager,
            version: packageManagerVersion, // TODO: get version of package manager
            metadata: {
                lockfile,
                corepack,
                workspace: !!workspaceRoot,
                root_directory: workspaceRoot && (path.relative(root, workspaceRoot) || "."),
            },
        },
        platform: {
            id: "nodejs",
            version: "0.0.0", // TODO: get version of platform
        },
        commands: {
            install: installCommand,
            build: [[packageManager, ["run", "build"]]],
            dev: [packageManager, ["run", "dev"]],
            serve: [packageManager, ["start"]]
        },
        discoveryComplete: true, // TODO figure out if we need to install/build, nextjs etc.
    }]
    
    const bundledFrameworks = knownFrameworks.filter(([id]) => !!discoveredFrameworks.some((fw) => fw.id === id)).map(([,,, bundles]) => bundles).flat();

    // TODO fix typing
    return discoveredFrameworks.filter((fw) => !bundledFrameworks.includes(fw.id as any));
}


// If being compiled with webpack, use non webpack require for these calls.
// (VSCode plugin uses webpack which by default replaces require calls
// with its own require, which doesn't work on files)
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const requireFunc =
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore prevent VSCE webpack from erroring on non_webpack_require
  // eslint-disable-next-line camelcase
  typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;

function dynamicImport(mod: string) {
    if (mod.startsWith("file://")) return import(mod);
    if (mod.startsWith("/")) return import(pathToFileURL(mod).toString());
    try {
        const path = requireFunc.resolve(mod);
        return import(pathToFileURL(path).toString());
    } catch(e) {
        return Promise.reject(e);
    }
}

// Only the fields being used are defined here
export interface PackageJson {
  main: string;
  type?: "commonjs" | "module";
}

export async function relativeRequire(dir: string, mod: string) {
    // If being compiled with webpack, use non webpack require for these calls.
    // (VSCode plugin uses webpack which by default replaces require calls
    // with its own require, which doesn't work on files)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const requireFunc: typeof require =
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prevent VSCE webpack from erroring on non_webpack_require
      // eslint-disable-next-line camelcase
      typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore prevent VSCE webpack from erroring on non_webpack_require
    const path = requireFunc.resolve(mod, { paths: [dir] });

    let packageJson: PackageJson | undefined;
    let isEsm = extname(path) === ".mjs";
    if (!isEsm) {
      packageJson = await readJSON(
        join(dirname(path), "package.json"),
      ).catch(() => undefined);

      isEsm = packageJson?.type === "module";
    }

    if (isEsm) {
      // in case path resolves to a cjs file, use main from package.json
      if (extname(path) === ".cjs" && packageJson?.main) {
        return dynamicImport(join(dirname(path), packageJson.main));
      }

      return dynamicImport(pathToFileURL(path).toString());
    } else {
      return requireFunc(path);
    }
}