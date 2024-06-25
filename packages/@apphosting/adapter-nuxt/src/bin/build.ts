#! /usr/bin/env node

import { join } from "node:path";
import {
  build,
  populateOutputBundleOptions,
  getConfig,
  validateOutputDirectory,
  generateOutputDirectory,
} from "../utils.js";

const cwd = process.cwd();

await build(cwd);

const { ssr: wantsBackend } = await getConfig(cwd);

const outputBundleOptions = populateOutputBundleOptions(cwd, wantsBackend);

await generateOutputDirectory(cwd, outputBundleOptions, join(cwd, ".output"));
await validateOutputDirectory(outputBundleOptions);
