#! /usr/bin/env node
import {
  loadConfig,
  build,
  populateOutputBundleOptions,
  generateOutputDirectory,
} from "../utils.js";

import { join } from "path";

const cwd = process.cwd();

await build(cwd);

const outputBundleOptions = populateOutputBundleOptions(cwd);
const { distDir } = await loadConfig(cwd);
const nextBuildDirectory = join(cwd, distDir);

await generateOutputDirectory(cwd, outputBundleOptions, nextBuildDirectory);
