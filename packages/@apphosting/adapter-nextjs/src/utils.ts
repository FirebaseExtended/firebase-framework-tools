import { join } from "path";
import fsExtra from "fs-extra";
import { PHASE_PRODUCTION_BUILD } from "./constants.js"
import { ROUTES_MANIFEST } from "./constants.js";
import { fileURLToPath } from "url";

import type { RoutesManifest } from "./interfaces.js";

// fs-extra is CJS, readJson can't be imported using shorthand
export const { readJson } = fsExtra;

export async function loadConfig(cwd: string) {
    // dynamically load NextJS so this can be used in an NPX context
    const { default: nextServerConfig }: { default: typeof import("next/dist/server/config.js") } =
        await import(`${cwd}/node_modules/next/dist/server/config.js`);    
    const loadConfig = nextServerConfig.default;
    return await loadConfig(PHASE_PRODUCTION_BUILD, cwd);
}

export async function readRoutesManifest(distDir: string): Promise<RoutesManifest> {
    return await readJson(join(distDir, ROUTES_MANIFEST));
}

export const isMain = (meta: ImportMeta) => {
    if (!meta) return false;
    if (!process.argv[1]) return false;
    return process.argv[1] === fileURLToPath(meta.url);
};
