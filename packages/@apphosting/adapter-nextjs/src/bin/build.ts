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
import { addRouteOverrides, overrideNextConfig, validateNextConfigOverride } from "../overrides.js";

const root = process.cwd();
const opts = getBuildOptions();

// Set standalone mode
process.env.NEXT_PRIVATE_STANDALONE = "true";
// Opt-out sending telemetry to Vercel
process.env.NEXT_TELEMETRY_DISABLED = "1";
if (!process.env.FRAMEWORK_VERSION) {
  throw new Error("Could not find the nextjs version of the application");
}

const originalConfig = await loadConfig(root, opts.projectDirectory);

/**
 * Override user's Next Config to optimize the app for Firebase App Hosting
 * and validate that the override resulted in a valid config that Next.js can
 * load.
 *
 * If the app does not have a next.config.[js|mjs|ts] file in the first place,
 * then can skip config override.
 *
 * Note: loadConfig always returns a fileName (default: next.config.js) even if
 * one does not exist in the app's root: https://github.com/vercel/next.js/blob/23681508ca34b66a6ef55965c5eac57de20eb67f/packages/next/src/server/config.ts#L1115
 */
await overrideNextConfig(root, originalConfig.configFileName);
await validateNextConfigOverride(root, opts.projectDirectory, originalConfig.configFileName);

await runBuild();

const adapterMetadata = getAdapterMetadata();
const nextBuildDirectory = join(opts.projectDirectory, originalConfig.distDir);
const outputBundleOptions = populateOutputBundleOptions(
  root,
  opts.projectDirectory,
  nextBuildDirectory,
);

await addRouteOverrides(
  outputBundleOptions.outputDirectoryAppPath,
  originalConfig.distDir,
  adapterMetadata,
);

await generateBuildOutput(
  root,
  opts.projectDirectory,
  outputBundleOptions,
  nextBuildDirectory,
  process.env.FRAMEWORK_VERSION,
  adapterMetadata,
);
await validateOutputDirectory(outputBundleOptions, nextBuildDirectory);
