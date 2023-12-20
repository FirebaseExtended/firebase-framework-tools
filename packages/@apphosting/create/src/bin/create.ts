#! /usr/bin/env node
import { spawn } from "child_process";
import { program } from "commander";

program
  .option("--framework <string>")
  .argument("<directory>", "path to the project's root directory")
  .action((directory, { framework }: { framework?: string }) => {
    if (!framework) {
      throw new Error(
        "Framework selecter not implemented. Must provide an option to --framework <string>",
      );
    }
    const adapterName = `@apphosting/adapter-${framework}`;
    const buildCommand = `apphosting-adapter-${framework}-create`;
    spawn("npx", ["-y", "-p", adapterName, buildCommand, directory], {
      shell: true,
      stdio: "inherit",
    });
  });

program.parse();
