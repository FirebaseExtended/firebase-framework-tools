#! /usr/bin/env node
import { spawnSync } from "child_process";
import { loadConfig, readRoutesManifest } from "../utils.js";

import { join, relative, dirname, normalize } from "path";
import fsExtra from "fs-extra";
import { stringify as yamlStringify } from "yaml";

// unable to use shorthand imports on fsExtra since fsExtra is CJS
const { move, exists, writeFile, mkdirp } = fsExtra;
const cwd = process.cwd();

// Set standalone mode
process.env.NEXT_PRIVATE_STANDALONE = "true"; 
// Opt-out sending telemetry to Vercel
process.env.NEXT_TELEMETRY_DISABLED = "1"; 

build(cwd);

const { distDir } = await loadConfig(cwd);
const manifest = await readRoutesManifest(join(cwd, distDir));

const appHostingOutputDirectory = join(cwd, ".apphosting");
const appHostingStaticDirectory = join(appHostingOutputDirectory, ".next", "static");
const appHostingPublicDirectory = join(appHostingOutputDirectory, "public");
const outputBundlePath = join(appHostingOutputDirectory, "bundle.yaml");
const serverFilePath = join(appHostingOutputDirectory, "server.js");

const standaloneDirectory = join(cwd, distDir, "standalone");
const staticDirectory = join(cwd, distDir, "static");
const publicDirectory = join(cwd, "public");

// Run build command
function build(cwd: string) {
    spawnSync("npm", ["run", "build"], {cwd, shell: true, stdio: "inherit"}); 
}

// move public directory to apphosting output public directory
const movePublicDirectory = async () => {
    const publicDirectoryExists = await exists(publicDirectory);
    if (!publicDirectoryExists) return;
    await move(publicDirectory, appHostingPublicDirectory, { overwrite: true });
};
  
// generate bundle.yaml
const generateBundleYaml = async () => {
    const headers = manifest.headers.map(it => ({...it, regex: undefined}));
    const redirects = manifest.redirects.filter(it => !it.internal).map(it => ({...it, regex: undefined}));
    const beforeFileRewrites = Array.isArray(manifest.rewrites) ? manifest.rewrites : manifest.rewrites?.beforeFiles || [];
    const rewrites = beforeFileRewrites.map(it => ({...it, regex: undefined}));
    const outputBundleDirectory = dirname(outputBundlePath);
    await writeFile(outputBundlePath, yamlStringify({
        headers, 
        redirects, 
        rewrites,
        runCommand: `node ${normalize(relative(outputBundleDirectory, serverFilePath))}`,
        neededDirs: [normalize(relative(outputBundleDirectory, appHostingOutputDirectory))],
        staticAssets: [normalize(relative(outputBundleDirectory, appHostingPublicDirectory))],
    }));
}

// move the standalone directory, the static directory and the public directory to apphosting output directory
// as well as generating bundle.yaml
await move(standaloneDirectory, appHostingOutputDirectory, { overwrite: true });
await Promise.all([
    move(staticDirectory, appHostingStaticDirectory, { overwrite: true }),
    movePublicDirectory(),
    generateBundleYaml(),
]);
