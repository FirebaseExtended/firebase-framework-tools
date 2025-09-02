import { readJSON } from "fs-extra";
import { Command } from "../index.js";
import { DiscoveryContext } from "../interfaces.js";

export type PackageManagerInfo = {
    id: "npm" | "yarn" | "pnpm";
    version?: string;
    lockfile?: string;
    corepack: boolean;
};

export async function detectPackageManager(ctx: DiscoveryContext): Promise<PackageManagerInfo> {
    const { root, fs: { pathExists }, path } = ctx;
    const packageJSON = await readJSON(path.join(root, "package.json"));

    let id: "npm" | "yarn" | "pnpm" = "npm";
    let version: string | undefined;
    let corepack = false;

    if (packageJSON.packageManager) {
        const [pm, v] = packageJSON.packageManager.split("@");
        id = pm as "npm" | "yarn" | "pnpm";
        version = v;
        corepack = true;
    }

    let lockfile: string | undefined;
    if (await pathExists(path.join(root, "yarn.lock"))) {
        id = "yarn";
        lockfile = "yarn.lock";
    } else if (await pathExists(path.join(root, "pnpm-lock.yaml"))) {
        id = "pnpm";
        lockfile = "pnpm-lock.yaml";
    } else if (await pathExists(path.join(root, "package-lock.json"))) {
        lockfile = "package-lock.json";
    } else if (await pathExists(path.join(root, "npm-shrinkwrap.json"))) {
        lockfile = "npm-shrinkwrap.json";
    }

    version ||= packageJSON.engines?.[id];

    return { id, version, lockfile, corepack };
}

export function getInstallCommand(pm: PackageManagerInfo): Command[] {
    if (pm.id === "yarn") return [["yarn", ["install", "--immutable"]]];
    if (pm.id === "pnpm") return [["pnpm", ["install", "--frozen-lockfile"]]];
    return [["npm", ["ci", "--include=dev"]]];
}
