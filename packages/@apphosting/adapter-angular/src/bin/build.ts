#! /usr/bin/env node
import {
  build,
  generateOutputDirectory,
  checkStandaloneBuildConditions,
  checkMonorepoBuildConditions,
  validateOutputDirectory,
} from "../utils.js";
import { getBuildOptions } from "@apphosting/common";

const root = process.cwd();
const opts = getBuildOptions();

// Check build conditions, which vary depending on your project structure (standalone or monorepo)
if (opts.monorepoProject) {
  checkMonorepoBuildConditions(opts.buildCommand, opts.monorepoProject);
} else {
  await checkStandaloneBuildConditions(root);
}

const outputBundleOptions = await build(root, opts);
await generateOutputDirectory(root, outputBundleOptions);

await validateOutputDirectory(outputBundleOptions);
