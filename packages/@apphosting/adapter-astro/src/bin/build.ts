#!/usr/bin/env node
import {
  loadConfig,
  build,
  populateOutputBundleOptions,
  generateOutputDirectory,
} from "../utils.js";

const cwd = process.cwd();
const { output, adapter, outDir } = await loadConfig(cwd);

const wantsBackend = output !== "static";

if (wantsBackend && adapter?.name !== "@astrojs/node") {
  throw Error(
    "Deploying an Astro application with SSR on Firebase Hosting requires the @astrojs/node adapter in middleware mode. https://docs.astro.build/en/guides/integrations-guide/node/",
  );
}

build(cwd);

const bundleOptions = populateOutputBundleOptions(cwd, wantsBackend);

await generateOutputDirectory(cwd, bundleOptions, outDir);
