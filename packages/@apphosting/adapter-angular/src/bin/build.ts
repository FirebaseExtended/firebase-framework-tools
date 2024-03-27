#! /usr/bin/env node
import {
  build,
  generateOutputDirectory,
  DEFAULT_COMMAND,
  checkStandaloneBuildConditions,
  checkMonorepoBuildConditions,
} from "../utils.js";

const root = process.cwd();

// Determine root of project to build
let projectRoot = root;
if (process.env.MONOREPO_PROJECT && process.env.FIREBASE_APP_DIRECTORY) {
  projectRoot = projectRoot.concat("/", process.env.FIREBASE_APP_DIRECTORY);
  const builder = process.env.MONOREPO_BUILDER || "";
  checkMonorepoBuildConditions(builder);
} else {
  await checkStandaloneBuildConditions(projectRoot);
}

// Determine which build runner to use
let cmd = DEFAULT_COMMAND;
if (process.env.MONOREPO_COMMAND) {
  cmd = process.env.MONOREPO_COMMAND;
}

const outputBundleOptions = await build(projectRoot, cmd);
await generateOutputDirectory(root, outputBundleOptions);
