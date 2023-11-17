#! /usr/bin/env node
import { spawnSync } from "child_process";
import { loadConfig, readRoutesManifest } from "../utils.js";

import { join } from "path";
import fsExtra from "fs-extra";
import { stringify as yamlStringify } from "yaml";

const { move, exists, writeFile, mkdirp } = fsExtra;
const cwd = process.cwd();

// Set standalone mode
process.env.NEXT_PRIVATE_STANDALONE = "true"; 
// Opt-out sending telemetry to Vercel
process.env.NEXT_TELEMETRY_DISABLED = "1"; 

build(cwd);

const {distDir, basePath} = await loadConfig(cwd);
const manifest = await readRoutesManifest(join(cwd, distDir));

const destination = join(cwd, ".apphosting");
const staticDestination = join(destination,"_next", "static");
const publicDestination = join(destination, "public");
const outputBundleDestination = join(destination, "bundle.yaml");

const standaloneDir = join (cwd, distDir, "standalone");
const staticDir = join (cwd, distDir, "static");
const publicDir = join(cwd, "public");

await mkdirp(staticDestination);

// Run build command
function build(cwd: string) {
    spawnSync("npm run", ["build"], {cwd, stdio: "inherit"}); 
  }

// move public directory to both public and CDN destination
const movePublicDir = async () => {
    const publicDirExists = await exists(publicDir);
    if (!publicDirExists) return;
    await move(publicDir, publicDestination);
};
  
// generate bundle.yaml
const generateBundleYaml = async () => {
    const headers = manifest.headers.map(it => ({...it, regex: undefined}));
    const redirects = manifest.redirects.filter(it => !it.internal).map(it => ({...it, regex: undefined}));
    const beforeFileRewrites = Array.isArray(manifest.rewrites) ? manifest.rewrites : manifest.rewrites?.beforeFiles || [];
    const rewrites = beforeFileRewrites.map(it => ({...it, regec: undefined}));
    await writeFile(outputBundleDestination, yamlStringify({headers, redirects, rewrites}))
}

await Promise.all([
    move(standaloneDir, destination), 
    move(staticDir, staticDestination), 
    movePublicDir(),
    generateBundleYaml(),
]);