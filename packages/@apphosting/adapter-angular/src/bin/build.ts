#! /usr/bin/env node
import { spawn } from "child_process";
import { loadConfig, ApplicationBuilderOptions, move, writeFile } from "../utils.js";
import { resolve, normalize, relative } from "path";
import { stringify as yamlStringify } from "yaml";

interface OutputBundleOptions {
  bundleYamlPath: string;
  outputDirectory: string;
  outputBaseDirectory: string;
  serverFilePath: string;
  browserDirectory: string;
}

const cwd = process.cwd()

// read Application Builder config
const config: ApplicationBuilderOptions = await loadConfig(cwd);
const outputPath = config.outputPath;
// normalized output path structure
const normalizedOutputPath = { 
  browser: 'browser',
  server: 'server',
  media: 'media',
  ...(typeof outputPath === 'string' ? undefined : outputPath),
  base: normalize(
    resolve(typeof outputPath === 'string' ? outputPath : outputPath.base),
  ),
};

// populate file/directory paths we need inside app hosting output directory
function populateOutputBundleOptions(): OutputBundleOptions {
  const outputBundleDir = resolve(".apphosting");
  return {
    bundleYamlPath: resolve(outputBundleDir, "bundle.yaml"),
    outputDirectory: outputBundleDir,
    outputBaseDirectory: resolve(outputBundleDir, "dist"),
    serverFilePath: resolve(outputBundleDir, "dist", normalizedOutputPath.server, "server.mjs"),
    browserDirectory: resolve(outputBundleDir, "dist", normalizedOutputPath.browser),
  };
}

// Run build command
async function build(cwd: string): Promise<void> {
  await spawn("npm", ["run", "build"], { cwd, shell: true, stdio: "inherit" });
}

// move the base output directory, which contains the server and browser bundle directory, and prerendered routes
// as well as generating bundle.yaml
async function generateOutputDirectory(
  cwd: string,
  outputBundleOptions: OutputBundleOptions,
): Promise<void> {
  const baseDirectory = resolve(normalizedOutputPath.base);

  await Promise.all([
    move(baseDirectory, outputBundleOptions.outputBaseDirectory, { overwrite: true }), 
    generateBundleYaml(outputBundleOptions, cwd),
  ]);
  return;
}

// generate bundle.yaml
async function generateBundleYaml(
  outputBundleOptions: OutputBundleOptions,
  cwd : string,
): Promise<void> {
  await writeFile(
    outputBundleOptions.bundleYamlPath,
    yamlStringify({
      headers: [],
      redirects: [],
      rewrites: [],
      runCommand: `node ${normalize(relative(cwd, outputBundleOptions.serverFilePath))}`,
      neededDirs: [normalize(relative(cwd, outputBundleOptions.outputDirectory))],
      staticAssets: [normalize(relative(cwd, outputBundleOptions.browserDirectory))],
    }),
  );
  return;
}

const outputBundleOptions = populateOutputBundleOptions();
await build(cwd);
await generateOutputDirectory(cwd, outputBundleOptions);