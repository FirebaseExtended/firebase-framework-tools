#! /usr/bin/env node
import {
  generateBuildOutput,
  checkBuildConditions,
  validateOutputDirectory,
  parseOutputBundleOptions,
  outputBundleExists
} from "../utils.js";
import { getBuildOptions, runBuild } from "@apphosting/common";

const opts = getBuildOptions();

// Check build conditions, which vary depending on your project structure (standalone or monorepo)
await checkBuildConditions(opts);
if (!process.env.FRAMEWORK_VERSION) {
  throw new Error("Could not find the angular version of the application");
}

// enable JSON build logs for application builder
process.env.NG_BUILD_LOGS_JSON = "1";
const { stdout: output } = await runBuild();
if (!output) {
  throw new Error("No output from Angular build command, expecting a build manifest file.");
}
const outputBundleOptions = parseOutputBundleOptions(output);
if (!outputBundleExists(outputBundleOptions)){
  const root = process.cwd();
  await generateBuildOutput(root, outputBundleOptions, process.env.FRAMEWORK_VERSION);
  
  await validateOutputDirectory(outputBundleOptions);
}
