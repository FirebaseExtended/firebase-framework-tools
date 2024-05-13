#! /usr/bin/env node
import { program } from "commander";
import spawn from "@npmcli/promise-spawn";

program
  .argument("<directory>", "path to the project's root directory")
  .action(async (directory) => {
    await spawn("npx", ["@apphosting/create", "--framework=nextjs", directory], {
      shell: true,
      stdio: "inherit",
    });
  });

program.parse();
