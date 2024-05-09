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

// TODO(blidd-google): Refactor monorepo logic into separate module

// Determine which project in a monorepo to build. The environment variable will only exist when
// a monorepo has been detected in the parent buildpacks, so it can also be used to determine
// whether the project we are building is in a monorepo setup.
const project = process.env.MONOREPO_PROJECT || "";

// Determine root of project to build.
let projectRoot = root;
// N.B. We don't want to change directories for monorepo builds, so that the build process can
// locate necessary files outside the project directory (e.g. at the root).
if (process.env.FIREBASE_APP_DIRECTORY && !project) {
  projectRoot = projectRoot.concat("/", process.env.FIREBASE_APP_DIRECTORY);
}

// Determine which command to run the build
const cmd = process.env.MONOREPO_COMMAND || DEFAULT_COMMAND;

// Parse args to pass to the build command
let cmdArgs: string[] = [];
if (process.env.MONOREPO_BUILD_ARGS) {
  cmdArgs = process.env.MONOREPO_BUILD_ARGS.split(",");
}

// Check build conditions, which vary depending on your project structure (standalone or monorepo)
if (project) {
  checkMonorepoBuildConditions(cmd, project);
} else {
  await checkStandaloneBuildConditions(projectRoot);
}

const outputBundleOptions = await build(projectRoot, cmd, ...cmdArgs);
await generateOutputDirectory(root, outputBundleOptions);

await validateOutputDirectory(outputBundleOptions);
