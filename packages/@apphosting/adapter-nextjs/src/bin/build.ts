#! /usr/bin/env node
import {
  loadConfig,
  build,
  populateOutputBundleOptions,
  generateOutputDirectory,
  validateOutputDirectory,
} from "../utils.js";

import { join } from "path";

const cwd = process.cwd();

build(cwd);

const outputBundleOptions = populateOutputBundleOptions(cwd);
const { distDir } = await loadConfig(cwd);
const nextBuildDirectory = join(cwd, distDir);

await generateOutputDirectory(cwd, outputBundleOptions, nextBuildDirectory);

await validateOutputDirectory(outputBundleOptions);
