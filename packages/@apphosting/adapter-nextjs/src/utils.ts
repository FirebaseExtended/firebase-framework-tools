import fsExtra from "fs-extra";
import { PHASE_PRODUCTION_BUILD } from "./constants.js";
import { ROUTES_MANIFEST } from "./constants.js";
import { fileURLToPath } from "url";
import { OutputBundleOptions } from "./interfaces.js";
import { stringify as yamlStringify } from "yaml";
import { spawnSync } from "child_process";

import { join, relative, normalize } from "path";

import type { RoutesManifest } from "./interfaces.js";
// fs-extra is CJS, readJson can't be imported using shorthand
export const { move, exists, writeFile, readJSON } = fsExtra;

export async function loadConfig(cwd: string) {
  // dynamically load NextJS so this can be used in an NPX context
  const { default: nextServerConfig }: { default: typeof import("next/dist/server/config.js") } =
    await import(`${cwd}/node_modules/next/dist/server/config.js`);
  const loadConfig = nextServerConfig.default;
  return await loadConfig(PHASE_PRODUCTION_BUILD, cwd);
}

export async function readRoutesManifest(distDir: string): Promise<RoutesManifest> {
  return await readJSON(join(distDir, ROUTES_MANIFEST));
}

export const isMain = (meta: ImportMeta) => {
  if (!meta) return false;
  if (!process.argv[1]) return false;
  return process.argv[1] === fileURLToPath(meta.url);
};

export function populateOutputBundleOptions(cwd: string): OutputBundleOptions {
  const outputBundleDir = join(cwd, ".apphosting");
  return {
    bundleYamlPath: join(outputBundleDir, "bundle.yaml"),
    outputDirectory: outputBundleDir,
    serverFilePath: join(outputBundleDir, "server.js"),
    outputPublicDirectory: join(outputBundleDir, "public"),
    outputStaticDirectory: join(outputBundleDir, ".next", "static"),
  };
}

// Run build command
export function build(cwd: string): void {
  // Set standalone mode
  process.env.NEXT_PRIVATE_STANDALONE = "true";
  // Opt-out sending telemetry to Vercel
  process.env.NEXT_TELEMETRY_DISABLED = "1";
  spawnSync("npm", ["run", "build"], { cwd, shell: true, stdio: "inherit" });
}

// move the standalone directory, the static directory and the public directory to apphosting output directory
// as well as generating bundle.yaml
export async function generateOutputBundle(
  cwd: string,
  outputBundleOptions: OutputBundleOptions,
  nextBuildDirectory: string,
): Promise<void> {
  const standaloneDirectory = join(nextBuildDirectory, "standalone");
  await move(standaloneDirectory, outputBundleOptions.outputDirectory, { overwrite: true });

  const staticDirectory = join(nextBuildDirectory, "static");
  const publicDirectory = join(cwd, "public");
  await Promise.all([
    move(staticDirectory, outputBundleOptions.outputStaticDirectory, { overwrite: true }),
    movePublicDirectory(publicDirectory, outputBundleOptions.outputPublicDirectory),
    generateBundleYaml(outputBundleOptions, nextBuildDirectory, cwd),
  ]);
  return;
}

// move public directory to apphosting output public directory
async function movePublicDirectory(
  publicDirectory: string,
  appHostingPublicDirectory: string,
): Promise<void> {
  const publicDirectoryExists = await exists(publicDirectory);
  if (!publicDirectoryExists) return;
  await move(publicDirectory, appHostingPublicDirectory, { overwrite: true });
  return;
}

// generate bundle.yaml
async function generateBundleYaml(
  outputBundleOptions: OutputBundleOptions,
  nextBuildDirectory: string,
  cwd: string,
): Promise<void> {
  const manifest = await readRoutesManifest(nextBuildDirectory);
  const headers = manifest.headers.map((it) => ({ ...it, regex: undefined }));
  const redirects = manifest.redirects
    .filter((it) => !it.internal)
    .map((it) => ({ ...it, regex: undefined }));
  const beforeFileRewrites = Array.isArray(manifest.rewrites)
    ? manifest.rewrites
    : manifest.rewrites?.beforeFiles || [];
  const rewrites = beforeFileRewrites.map((it) => ({ ...it, regex: undefined }));
  await writeFile(
    outputBundleOptions.bundleYamlPath,
    yamlStringify({
      headers,
      redirects,
      rewrites,
      runCommand: `node ${normalize(relative(cwd, outputBundleOptions.serverFilePath))}`,
      neededDirs: [normalize(relative(cwd, outputBundleOptions.outputDirectory))],
      staticAssets: [normalize(relative(cwd, outputBundleOptions.outputPublicDirectory))],
    }),
  );
  return;
}
