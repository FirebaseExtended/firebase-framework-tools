import { spawnSync } from "child_process";
import fsExtra from "fs-extra";
import { createRequire } from "node:module";
import { join, relative, normalize } from "path";
import { fileURLToPath } from "url";
import { stringify as yamlStringify } from "yaml";

import { PHASE_PRODUCTION_BUILD } from "./constants.js";
import { ROUTES_MANIFEST } from "./constants.js";
import { OutputBundleOptions, RoutesManifest } from "./interfaces.js";
import { NextConfigComplete } from "next/dist/server/config-shared.js";

// fs-extra is CJS, readJson can't be imported using shorthand
export const { move, exists, writeFile, readJson } = fsExtra;

// The default fallback command prefix to run a build.
export const DEFAULT_COMMAND = "npm";

// Loads the user's next.config.js file.
export async function loadConfig(root: string, projectRoot: string): Promise<NextConfigComplete> {
  // createRequire() gives us access to require.resolve() in ESM. We want to use the require.resolve
  // resolution algorithm to get the path to the next config module, which may reside in the node_modules
  // folder at a higher level in the directory structure (e.g. for monorepo projects). We then dynamically
  // load the module using the returned path.
  // https://nodejs.org/api/module.html#modulecreaterequirefilename
  const require = createRequire(import.meta.url);
  const configPath = require.resolve("next/dist/server/config.js", { paths: [projectRoot] });
  // dynamically load NextJS so this can be used in an NPX context
  const { default: nextServerConfig }: { default: typeof import("next/dist/server/config.js") } =
    await import(configPath);

  const loadConfig = nextServerConfig.default;
  return await loadConfig(PHASE_PRODUCTION_BUILD, root);
}

export async function readRoutesManifest(distDir: string): Promise<RoutesManifest> {
  return await readJson(join(distDir, ROUTES_MANIFEST));
}

export const isMain = (meta: ImportMeta) => {
  if (!meta) return false;
  if (!process.argv[1]) return false;
  return process.argv[1] === fileURLToPath(meta.url);
};

/**
 * Provides the paths in the output bundle for the built artifacts.
 * @param rootDir The root directory of the uploaded source code.
 * @param appDir The path to the application source code, relative to the root.
 * @return The output bundle paths.
 */
export function populateOutputBundleOptions(rootDir: string, appDir: string): OutputBundleOptions {
  const outputBundleDir = join(rootDir, ".apphosting");
  // In monorepo setups, the standalone directory structure will mirror the structure of the monorepo.
  // We find the relative path from the root to the app directory to correctly locate server.js.
  const outputBundleAppDir = join(
    outputBundleDir,
    process.env.MONOREPO_COMMAND ? relative(rootDir, appDir) : "",
  );

  return {
    bundleYamlPath: join(outputBundleDir, "bundle.yaml"),
    outputDirectory: outputBundleDir,
    serverFilePath: join(outputBundleAppDir, "server.js"),
    outputPublicDirectory: join(outputBundleAppDir, "public"),
    outputStaticDirectory: join(outputBundleAppDir, ".next", "static"),
  };
}

// Run build command
export function build(cwd: string, cmd = DEFAULT_COMMAND): void {
  // Set standalone mode
  process.env.NEXT_PRIVATE_STANDALONE = "true";
  // Opt-out sending telemetry to Vercel
  process.env.NEXT_TELEMETRY_DISABLED = "1";
  spawnSync(cmd, ["run", "build"], { cwd, shell: true, stdio: "inherit" });
}

/**
 * Moves the standalone directory, the static directory and the public directory to apphosting output directory.
 * Also generates the bundle.yaml file.
 * @param rootDir The root directory of the uploaded source code.
 * @param appDir The path to the application source code, relative to the root.
 * @param outputBundleOptions The target location of built artifacts in the output bundle.
 * @param nextBuildDirectory The location of the .next directory.
 */
export async function generateOutputDirectory(
  rootDir: string,
  appDir: string,
  outputBundleOptions: OutputBundleOptions,
  nextBuildDirectory: string,
): Promise<void> {
  const standaloneDirectory = join(nextBuildDirectory, "standalone");
  await move(standaloneDirectory, outputBundleOptions.outputDirectory, { overwrite: true });

  const staticDirectory = join(nextBuildDirectory, "static");
  const publicDirectory = join(appDir, "public");
  await Promise.all([
    move(staticDirectory, outputBundleOptions.outputStaticDirectory, { overwrite: true }),
    movePublicDirectory(publicDirectory, outputBundleOptions.outputPublicDirectory),
    generateBundleYaml(outputBundleOptions, nextBuildDirectory, rootDir),
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
