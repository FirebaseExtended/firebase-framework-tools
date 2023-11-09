#! /usr/bin/env node
import { spawnSync } from "child_process";
import { loadConfig, readRoutesManifest } from "../utils.js";

const cwd = process.cwd();

spawnSync("next", ["build"], { cwd, stdio: "inherit", env: { ...process.env, NEXT_PRIVATE_STANDALONE: 'true' } });

const config = await loadConfig(cwd);
const routeManifest = await readRoutesManifest(config.distDir);

// TODO do all the things
console.log({ config, routeManifest });
