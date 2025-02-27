#! /usr/bin/env node
import {
  loadConfig,
  populateOutputBundleOptions,
  generateBuildOutput,
  validateOutputDirectory,
  getAdapterMetadata,
  getFrameworkMetadata,
} from "../utils.js";
import { join } from "path";
import { getBuildOptions, runBuild } from "@apphosting/common";
import { addRouteOverrides } from "../overrides.js";

const root = process.cwd();
const opts = getBuildOptions();

// Set standalone mode
process.env.NEXT_PRIVATE_STANDALONE = "true";
// Opt-out sending telemetry to Vercel
process.env.NEXT_TELEMETRY_DISABLED = "1";
if (!process.env.FRAMEWORK_VERSION) {
  throw new Error("Could not find the nextjs version of the application");
}
await runBuild();

const { distDir } = await loadConfig(root, opts.projectDirectory);
const nextBuildDirectory = join(opts.projectDirectory, distDir);
const outputBundleOptions = populateOutputBundleOptions(
  root,
  opts.projectDirectory,
  nextBuildDirectory,
);

const adapterMetadata = getAdapterMetadata();
const frameworkMetadata = getFrameworkMetadata(outputBundleOptions.outputDirectoryAppPath, distDir);

await addRouteOverrides(
  outputBundleOptions.outputDirectoryAppPath,
  distDir,
  adapterMetadata,
  frameworkMetadata,
);

await generateBuildOutput(
  root,
  opts.projectDirectory,
  outputBundleOptions,
  nextBuildDirectory,
  frameworkMetadata,
  adapterMetadata,
);
await validateOutputDirectory(outputBundleOptions, nextBuildDirectory);
