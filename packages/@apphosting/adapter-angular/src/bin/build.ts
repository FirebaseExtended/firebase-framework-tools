#! /usr/bin/env node
import { checkBuildConditions, build, generateOutputDirectory } from "../utils.js";

const cwd = process.cwd();

await checkBuildConditions(cwd);

const outputBundleOptions = await build().catch(() => process.exit(1));
await generateOutputDirectory(cwd, outputBundleOptions);
