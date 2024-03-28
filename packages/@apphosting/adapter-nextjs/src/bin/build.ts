#! /usr/bin/env node
import {
  loadConfig,
  build,
  populateOutputBundleOptions,
  generateOutputDirectory,
  DEFAULT_COMMAND,
} from "../utils.js";
import { join } from "path";

const root = process.cwd();

let projectRoot = root;
if (process.env.MONOREPO_PROJECT && process.env.FIREBASE_APP_DIRECTORY) {
  projectRoot = projectRoot.concat("/", process.env.FIREBASE_APP_DIRECTORY);
}

// Determine which build runner to use
let cmd = DEFAULT_COMMAND;
if (process.env.MONOREPO_COMMAND) {
  cmd = process.env.MONOREPO_COMMAND;
}

build(projectRoot, cmd);

const outputBundleOptions = populateOutputBundleOptions(root, projectRoot);
console.log("OUTPUT BUNDLE: ", outputBundleOptions);
const { distDir } = await loadConfig(root);
const nextBuildDirectory = join(projectRoot, distDir);
console.log("NEXT BUILD DIR:", nextBuildDirectory);

await generateOutputDirectory(root, projectRoot, outputBundleOptions, nextBuildDirectory);
