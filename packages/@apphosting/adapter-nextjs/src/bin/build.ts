#! /usr/bin/env node
import { spawnSync } from "child_process";
import { join } from "path";
import fsExtra from "fs-extra";
import { stringify as yamlStringify } from "yaml";

const { copy, mkdirp, exists, readJson, writeFile } = fsExtra;

import type { RoutesManifest } from "../interfaces.js";

const cwd = process.cwd();

// TODO don't await these here, clean up these imports
// for the constants we should probably keep them the same way we do in firebase-tools
const { default: nextServerConfig }: { default: typeof import("next/dist/server/config.js") } = await import(`${cwd}/node_modules/next/dist/server/config.js`);
const { PHASE_PRODUCTION_BUILD, ROUTES_MANIFEST }: typeof import("next/constants.js") = await import(`${cwd}/node_modules/next/constants.js`);

const loadConfig = nextServerConfig.default;

// Since this tool can be executed with NPX maybe we should just call `npm run build`?
spawnSync("next", ["build"], { cwd, stdio: "inherit", env: { ...process.env, NEXT_PRIVATE_STANDALONE: 'true' } });

const { distDir, basePath } = await loadConfig(PHASE_PRODUCTION_BUILD, cwd);

const destination = join(cwd, '.apphosting_build');

const staticDestination = join(destination, "static", basePath);
const nextStaticDestination = join(staticDestination, "_next", "static");
const publicDestination = join(destination, "public");

const standaloneDir = join(cwd, distDir, "standalone");
const publicDir = join(cwd, "public");
const nextStaticDir = join(cwd, distDir, "static");

await mkdirp(nextStaticDestination);

const copyPublicDir = async () => {
    const publicDirExists = await exists(publicDir);
    if (!publicDirExists) return;
    await Promise.all([
        copy(publicDir, publicDestination),
        copy(publicDir, staticDestination)
    ]);
};

const writeBundleYaml = async () => {
    const manifest: RoutesManifest = await readJson(join(cwd, distDir, ROUTES_MANIFEST));
    const headers = manifest.headers.map(it => ({ ...it, regex: undefined }));
    const redirects = manifest.redirects.filter(it => !it.internal).map(it => ({ ...it, regex: undefined }));
    const beforeFileRewrites = Array.isArray(manifest.rewrites) ? manifest.rewrites : manifest.rewrites?.beforeFiles || [];
    const rewrites = beforeFileRewrites.map(it => ({ ...it, regex: undefined }));
    await writeFile(join(destination, "bundle.yaml"), yamlStringify({ headers, redirects, rewrites }));
}

await Promise.all([
    copy(standaloneDir, destination),
    copy(nextStaticDir, nextStaticDestination),
    copyPublicDir(),
    writeBundleYaml(),
]);
