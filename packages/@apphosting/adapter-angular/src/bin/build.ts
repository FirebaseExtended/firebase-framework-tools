#! /usr/bin/env node
import { spawn } from "child_process";
import { loadConfig } from "../utils.js";

const build = (cwd = process.cwd()) =>
  new Promise<void>((resolve, reject) => {
    // TODO warn if the build script contains anything other than `ng build`
    const process = spawn("npm", ["run", "build"], { cwd, shell: true, stdio: "pipe" });
    process.stdout.on("data", (it: Buffer) => console.log(it.toString().trim()));
    process.stderr.on("data", (it: Buffer) => console.error(it.toString().trim()));
    process.on("exit", (code) => {
      if (code === 0) return resolve();
      reject();
    });
  });

const config = await loadConfig(process.cwd());

await build().catch(() => process.exit(1));

// TODO do all the things
console.log({ config });
