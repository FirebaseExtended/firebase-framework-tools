import { DiscoveredFramework } from "../index.js";
import { DiscoveryContext, MockFileSystem } from "../interfaces.js";
import { detectPackageManager, getInstallCommand } from "./pm.js";
import { findWorkspaceInfo, getDependencies } from "./workspaces.js";
import { discoverAngularProjects, discoverOtherFrameworks, createDefaultNodeProject } from "./discovery.js";
import { knownFrameworks } from "./frameworks.js";

export async function discoverNodeJSFrameworks(root: string, fs: MockFileSystem, path: typeof import("node:path")) : Promise<Array<DiscoveredFramework>> {
    const ctx: DiscoveryContext = { root, fs, path };
    const packageJsonExists = await fs.pathExists(path.join(root, "package.json"));
    if (!packageJsonExists) return [];

    const packageManager = await detectPackageManager(ctx);
    const workspace = await findWorkspaceInfo(ctx, packageManager.lockfile);
    const dependencies = await getDependencies(ctx, packageManager.lockfile, workspace.root);
    const installCommand = getInstallCommand(packageManager);
    const packageJSON = await fs.readJson(path.join(root, "package.json"));

    // TODO scope down the dependencies and add directory scanning
    const discoveredFrameworks: Array<DiscoveredFramework> = (await Promise.all([
        discoverAngularProjects(ctx, packageManager, workspace, dependencies, installCommand, packageJSON),
        discoverOtherFrameworks(ctx, packageManager, workspace, dependencies, installCommand, packageJSON),
    ])).flat();

    if (discoveredFrameworks.length === 0) {
        const defaultProject = createDefaultNodeProject(ctx, packageManager, workspace, installCommand, packageJSON);
        discoveredFrameworks.push(defaultProject);
    }
    
    const bundledFrameworkIds = new Set(
        discoveredFrameworks.flatMap(fw => knownFrameworks.find(def => def.id === fw.id)?.bundledWith || [])
    );

    return discoveredFrameworks.filter(fw => !bundledFrameworkIds.has(fw.id));
}
