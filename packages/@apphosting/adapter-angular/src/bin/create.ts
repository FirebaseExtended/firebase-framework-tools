#! /usr/bin/env node
import { spawn } from "child_process";

import { isMain } from "../utils.js";

export const ANGULAR_CLI_VERSION = "~17.2.0";

const main = isMain(import.meta);

// TODO can we write a test to see if we're capturing all options from --help?
const enum Options {
  help = "--help",
  interactive = "--interactive",
  dryRun = "--dry-run",
  defaults = "--defaults",
  force = "--force",
  collection = "--collection",
  commit = "--commit",
  createApplication = "--create-application",
  directory = "--directory",
  inlineStyle = "--inline-style",
  inlineTemplate = "--inline-template",
  minimal = "--minimal",
  newProjecRoot = "--new-project-root",
  packageManager = "--package-manager",
  prefix = "--prefix",
  routing = "--routing",
  skipGit = "--skip-git",
  skipInstall = "--skip-install",
  skipTests = "--skip-tests",
  ssr = "--ssr",
  standalone = "--standalone",
  strict = "--strict",
  style = "--style",
  viewEncapsulation = "--view-encapsulation",
}

export async function create(projectDirectory = process.argv[2], cwd = process.cwd()) {
  return await new Promise<void>((resolve, reject) => {
    const args = [
      "-y",
      "-p",
      `@angular/cli@${ANGULAR_CLI_VERSION}`,
      "ng",
      "new",
      "hello-world",
      Options.directory,
      projectDirectory,
      Options.skipGit,
    ];
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
