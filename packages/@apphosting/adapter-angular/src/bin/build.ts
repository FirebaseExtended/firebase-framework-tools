#! /usr/bin/env node
import { checkStandaloneBuildConditions, build, generateOutputDirectory } from "../utils.js";

// Check if monorepo is being used
const monorepoProject = process.env.MONOREPO_PROJECT;
const monorepoCmd = process.env.MONOREPO_CMD;

const cwd = process.cwd();

let project = cwd;
if (monorepoProject) {
  project = project + "/" + monorepoProject;
} else {
  await checkStandaloneBuildConditions(project);
}

let cmd = "npm";
if (monorepoCmd) {
  cmd = monorepoCmd;
}

console.log("CWD:", cwd);
console.log("PROJECT:", project);
console.log("COMMAND:", cmd);

try {
  const outputBundleOptions = await build(project, cmd);
  console.log("OUTPUT BUNDLE OPTS", outputBundleOptions);
  await generateOutputDirectory(cwd, outputBundleOptions);
} catch (error) {
  console.error(`Build failed with error: ${error}`);
  process.exit(1);
}
