#! /usr/bin/env node
import {
  loadConfig,
  build,
  populateOutputBundleOptions,
  generateOutputDirectory,
  DEFAULT_COMMAND,
  validateOutputDirectory,
} from "../utils.js";
import { join } from "path";

const root = process.cwd();

let projectRoot = root;
if (process.env.FIREBASE_APP_DIRECTORY) {
  projectRoot = join(root, process.env.FIREBASE_APP_DIRECTORY);
}

// Parse args to pass to the build command
let cmdArgs: string[] = [];
if (process.env.MONOREPO_BUILD_ARGS) {
  cmdArgs = process.env.MONOREPO_BUILD_ARGS.split(",");
}

// Determine which command to run the build
const cmd = process.env.MONOREPO_COMMAND || DEFAULT_COMMAND;

// Run build command from the subdirectory if specified.
// N.B. We run the build command from the root for monorepo builds, so that the build process can
// locate necessary files outside the project directory.
build(process.env.MONOREPO_CMD ? root : projectRoot, cmd, ...cmdArgs);

const outputBundleOptions = populateOutputBundleOptions(root, projectRoot);
const { distDir } = await loadConfig(root, projectRoot);
const nextBuildDirectory = join(projectRoot, distDir);

await generateOutputDirectory(root, projectRoot, outputBundleOptions, nextBuildDirectory);
await validateOutputDirectory(outputBundleOptions);
