#! /usr/bin/env node
import {
  loadConfig,
  build,
  populateOutputBundleOptions,
  generateOutputDirectory,
} from "../utils.js";

const cwd = process.cwd();

// read Application Builder config
const config = await loadConfig(cwd);

const outputBundleOptions = populateOutputBundleOptions(config);
await build().catch(() => process.exit(1));
await generateOutputDirectory(cwd, outputBundleOptions);
