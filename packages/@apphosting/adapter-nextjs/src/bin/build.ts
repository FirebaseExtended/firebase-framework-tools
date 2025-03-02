#! /usr/bin/env node
import {
  loadConfig,
  populateOutputBundleOptions,
  generateBuildOutput,
  validateOutputDirectory,
  getAdapterMetadata,
} from "../utils.js";
import { join } from "path";
import { getBuildOptions, runBuild } from "@apphosting/common";
import { addRouteOverrides } from "../overrides/after-build.js";
import { setImagesUnoptimizedInConfigs } from "../overrides/before-build.js";

const root = process.cwd();
const opts = getBuildOptions();

// Set standalone mode
process.env.NEXT_PRIVATE_STANDALONE = "true";
// Opt-out sending telemetry to Vercel
process.env.NEXT_TELEMETRY_DISABLED = "1";
if (!process.env.FRAMEWORK_VERSION) {
  throw new Error("Could not find the nextjs version of the application");
}

await setImagesUnoptimizedInConfigs(root);
await runBuild();

const adapterMetadata = getAdapterMetadata();

const { distDir } = await loadConfig(root, opts.projectDirectory);
const nextBuildDirectory = join(opts.projectDirectory, distDir);
const outputBundleOptions = populateOutputBundleOptions(
  root,
  opts.projectDirectory,
  nextBuildDirectory,
);

await addRouteOverrides(outputBundleOptions.outputDirectoryAppPath, distDir, adapterMetadata);

await generateBuildOutput(
  root,
  opts.projectDirectory,
  outputBundleOptions,
  nextBuildDirectory,
  process.env.FRAMEWORK_VERSION,
  adapterMetadata,
);
await validateOutputDirectory(outputBundleOptions, nextBuildDirectory);
