#! /usr/bin/env node
import {
  loadConfig,
  build,
  populateOutputBundleOptions,
  generateOutputDirectory,
  validateOutputDirectory,
} from "../utils.js";
import { join } from "path";
import { getBuildOptions } from "@apphosting/common";

const root = process.cwd();
const opts = getBuildOptions();

// Run build command from the subdirectory if specified.
// N.B. We run the build command from the root for monorepo builds, so that the build process can
// locate necessary files outside the project directory.
build(root, opts);

const outputBundleOptions = populateOutputBundleOptions(root, opts.projectDirectory);
const { distDir } = await loadConfig(root, opts.projectDirectory);
const nextBuildDirectory = join(opts.projectDirectory, distDir);

await generateOutputDirectory(root, opts.projectDirectory, outputBundleOptions, nextBuildDirectory);
await validateOutputDirectory(outputBundleOptions);
