import { DiscoveredFramework, Command } from "../index.js";
import { DiscoveryContext } from "../interfaces.js";
import { PackageManagerInfo } from "./pm.js";
import { WorkspaceInfo } from "./workspaces.js";
import { FRAMEWORK_ID, knownAdapters, knownFrameworks } from "./frameworks.js";

// lodash/fp doesn't have types :(
// @ts-ignore
import { merge as _merge } from "lodash/fp/object";
const merge = _merge as typeof import("lodash")["merge"];

export async function discoverAngularProjects(
    ctx: DiscoveryContext,
    pm: PackageManagerInfo,
    workspace: WorkspaceInfo,
    dependencies: Map<string, Map<string, string>>,
    installCommand: Command[],
    packageJSON: any,
): Promise<DiscoveredFramework[]> {
    // TODO handle angular inside of nx, etc.
    if (workspace.tooling! !== "angular") return [];
    const { root, fs, path } = ctx;
    const discoveredFrameworks: DiscoveredFramework[] = [];
    const angularJSON = await fs.readJson(path.join(workspace.root || root, "angular.json"));
    if (angularJSON.projects) {
        for (const target of Object.keys(angularJSON.projects)) {
            const project = angularJSON.projects[target];
            if (project.projectType !== "application" || !project.architect?.build) continue;
            
            const root_directory = path.join(workspace.root || root, project.root || ".");
            const isStatic = !project.architect?.build?.options?.ssr || project.architect?.build?.options?.outputMode === "static";
            const dist_directory = `${project.architect.build.options?.outputPath || `dist/${target}`}${isStatic && project.architect.build.builder.endsWith(":application") ? "/browser" : ""}`;
            
            discoveredFrameworks.push({
                root_directory: path.relative(root, root_directory) || ".",
                id: "angular",
                //version:  dependencies.get("@angular/core")?.version,
                single_page_app: isStatic,
                dist_directory,
                monorepo_tooling: {
                    id: workspace.tooling!,
                    target,
                    version: dependencies.get("@angular/core"),
                },
                packageManager: {
                    id: pm.id,
                    version: pm.version,
                    metadata: {
                        lockfile: pm.lockfile,
                        corepack: pm.corepack,
                        workspace: !!workspace.root,
                        root_directory: workspace.root && path.relative(root, workspace.root) || ".",
                    },
                },
                platform: { id: "nodejs", version: packageJSON.engines?.node },
                commands: {
                    install: installCommand,
                    build: [[pm.id, ["run", "build"]]],
                    dev: [pm.id, ["start"]],
                    serve: isStatic ? ["npx", ["-y", "superstatic", "serve", "-p", "$PORT", "--compression", "--host", "0.0.0.0", "."]] : ["node", ["./server/server.mjs"]],
                },
                known_adapters: knownAdapters.angular,
                discoveryComplete: true,
            });
        }
    }
    return discoveredFrameworks;
}

export async function discoverOtherFrameworks(
    ctx: DiscoveryContext,
    pm: PackageManagerInfo,
    workspace: WorkspaceInfo,
    dependencies: Map<string, Map<string, string>>,
    installCommand: Command[],
    packageJSON: any,
): Promise<DiscoveredFramework[]> {
    const { root, fs, path } = ctx;
    console.log({ctx, pm, workspace});
    const discoveredFrameworks: DiscoveredFramework[] = [];
    await Promise.all(Array.from(workspace.directories).map(async (directory) => {
        for (const framework of knownFrameworks) {
            if (framework.id === "angular" && workspace.tooling === "angular") continue;

            const hasRequiredFile = framework.requiredFiles.length === 0 || (await Promise.all(framework.requiredFiles.map(file => fs.pathExists(path.join(directory, file))))).some(exists => exists);
            if (!hasRequiredFile) continue;

            const hasRequiredPackage = framework.requiredPackages.some(pkg => !!dependencies.get(directory)?.has(pkg));
            if (!hasRequiredPackage) continue;

            let target: string|undefined;
            if (workspace.tooling) {
                const packageJson = await fs.readJson(path.join(directory, "package.json"));
                target = packageJson.name;
            }

            const baseFramework: DiscoveredFramework = {
                root_directory: path.relative(root, directory) || ".",
                id: framework.id as FRAMEWORK_ID,
                //version: dependencies.get(framework.requiredPackages[0])?.version || "0.0.0",
                single_page_app: false,
                dist_directory: "dist",
                monorepo_tooling: workspace.tooling ? {
                    id: workspace.tooling,
                    target,
                    root: workspace.root && path.relative(root, workspace.root) || "."
                } : undefined,
                packageManager: {
                    id: pm.id,
                    version: pm.version,
                    metadata: {
                        lockfile: pm.lockfile,
                        corepack: pm.corepack,
                        workspace: !!workspace.root,
                        root_directory: workspace.root && path.relative(root, workspace.root) || "."
                    },
                },
                platform: { id: "nodejs", version: packageJSON.engines?.node },
                // TODO check that these commands are present
                commands: {
                    install: installCommand,
                    build: workspace.tooling ? [[workspace.tooling, ["run", "build", `--scope=${target!}`]]] : [[pm.id, ["run", "build"]]],
                    dev: [pm.id, ["run", "dev", `--prefix=${path.relative(root, directory) || "."}`]], // add prefix
                    serve: [pm.id, ["start"]]
                },
                known_adapters: knownAdapters[framework.id as FRAMEWORK_ID],
                discoveryComplete: true,
            };

            const discoveryProps = framework.getDiscoveryProps ? await framework.getDiscoveryProps(ctx) : {};
            discoveredFrameworks.push(merge(baseFramework, discoveryProps));
        }
    }));
    return discoveredFrameworks;
}

export function createDefaultNodeProject(
    ctx: DiscoveryContext,
    pm: PackageManagerInfo,
    workspace: WorkspaceInfo,
    installCommand: Command[],
    packageJSON: any,
): DiscoveredFramework {
    const { root, path } = ctx;
    return {
        root_directory: ".",
        id: "nodejs",
        version: "0.0.0",
        single_page_app: false,
        dist_directory: ".",
        monorepo_tooling: workspace.tooling ? { id: workspace.tooling, target: undefined } : undefined,
        packageManager: {
            id: pm.id,
            version: pm.version,
            metadata: { lockfile: pm.lockfile, corepack: pm.corepack, workspace: !!workspace.root, root_directory: workspace.root && (path.relative(root, workspace.root) || ".") },
        },
        platform: { id: "nodejs", version: packageJSON.engines?.node || "0.0.0" },
        commands: {
            install: installCommand,
            build: [[pm.id, ["run", "build"]]],
            dev: [pm.id, ["run", "dev"]],
            serve: [pm.id, ["start"]]
        },
        discoveryComplete: true,
    };
}
