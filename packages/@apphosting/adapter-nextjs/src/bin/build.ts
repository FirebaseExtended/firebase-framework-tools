#! /usr/bin/env node
import {
  loadConfig,
  populateOutputBundleOptions,
  validateOutputDirectory,
} from "../utils.js";
import { join } from "path";
import { getBuildOptions, runBuild } from "@apphosting/common";

const root = process.cwd();
const opts = getBuildOptions();

// Set standalone mode
process.env.NEXT_PRIVATE_STANDALONE = "true";
// Opt-out sending telemetry to Vercel
process.env.NEXT_TELEMETRY_DISABLED = "1";

const nextConfig = await loadConfig(root, opts.projectDirectory);

await runBuild();
const nextBuildDirectory = join(opts.projectDirectory, nextConfig.distDir);
const outputBundleOptions = populateOutputBundleOptions(
  root,
  opts.projectDirectory,
  nextBuildDirectory,
);
await validateOutputDirectory(outputBundleOptions, nextBuildDirectory);
