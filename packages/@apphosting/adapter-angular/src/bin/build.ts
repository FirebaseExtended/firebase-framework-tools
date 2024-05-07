#! /usr/bin/env node
import {
  build,
  generateOutputDirectory,
  DEFAULT_COMMAND,
  checkStandaloneBuildConditions,
  checkMonorepoBuildConditions,
  validateOutputDirectory,
} from "../utils.js";

const root = process.cwd();

// Determine which build runner to use
let cmd = process.env.MONOREPO_COMMAND || DEFAULT_COMMAND;

// Read environment variable (only relevant for monorepos with multiple targets)
let target = process.env.MONOREPO_PROJECT || "";

// Determine root of project to build.
let projectRoot = root;
// N.B. We don't want to change directories for monorepo builds, so that the build process can
// locate necessary files outside the project directory (e.g. at the root).
if (process.env.FIREBASE_APP_DIRECTORY && !target) {
  projectRoot = projectRoot.concat("/", process.env.FIREBASE_APP_DIRECTORY);
}

// Check build conditions, which vary depending on your project structure (standalone or monorepo)
if (target) {
  checkMonorepoBuildConditions(cmd, target);
} else {
  await checkStandaloneBuildConditions(projectRoot);
}

const outputBundleOptions = await build(projectRoot, cmd, target);
await generateOutputDirectory(root, outputBundleOptions);

await validateOutputDirectory(outputBundleOptions);
