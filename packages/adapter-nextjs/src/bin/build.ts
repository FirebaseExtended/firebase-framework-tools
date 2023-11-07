#! /usr/bin/env node
import { spawnSync } from "child_process";

const cwd = process.cwd();
spawnSync('next', ['build'], { cwd, stdio: "inherit" });
