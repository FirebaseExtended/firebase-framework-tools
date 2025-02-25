#! /usr/bin/env node
import { spawn } from "child_process";

import { isMain } from "../utils.js";

export const CREATE_NEXT_APP_VERSION = "~14.1.0";

const main = isMain(import.meta);

// TODO can we write a test to see if we're capturing all options from --help?
const enum Options {
  typescript = "--typescript",
  javascript = "--javascript",
  tailwind = "--tailwind",
  eslint = "--eslint",
  app = "--app",
  srcDir = "--src-dir",
  importAlias = "--import-alias",
  example = "--example",
  examplePath = "--example-path",
  useNpm = "--use-npm",
  useYarn = "--use-yarn",
  useBun = "--use-bin",
  usePnpm = "--use-pnpm",
}

export async function create(projectDirectory = process.argv[2], cwd = process.cwd()) {
  return await new Promise<void>((resolve, reject) => {
    const typescript = true;
    const packageManager = "npm";
    const tailwind = false;
    const eslint = false;
    const app = false;
    const srcDir = false;
    const importAlias = undefined;
    const example = "hello-world";
    const examplePath = undefined;
    // TODO create-next-app doesn't like an existing directory, that includes a firebase-debug.log use tmpdir & move
    const args = [
      "-y",
      "-p",
      `create-next-app@${CREATE_NEXT_APP_VERSION}`,
      "create-next-app",
      projectDirectory,
      `--use-${packageManager}`,
      typescript ? Options.typescript : Options.javascript,
    ];
    if (tailwind) args.push(Options.tailwind);
    if (eslint) args.push(Options.eslint);
    if (app) args.push(Options.app);
    if (srcDir) args.push(Options.srcDir);
    if (importAlias) args.push(Options.importAlias, importAlias);
    if (example) args.push(Options.example, example);
    if (examplePath) args.push(Options.examplePath, examplePath);
    const process = spawn("npx", args, { cwd, shell: true, stdio: "inherit" });
    process.on("exit", (code) => {
      if (code === 0) return resolve();
      reject();
    });
  });
}

if (main) {
  await create().catch(() => process.exit(1));
}
