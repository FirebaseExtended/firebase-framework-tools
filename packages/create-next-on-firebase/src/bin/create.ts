#! /usr/bin/env node
import { spawn } from "node:child_process";
import { program } from "commander";

program.argument("<directory>", "path to the project's root directory").action((directory) => {
  console.log(`Shelling out to @apphosting/create:`);

  const createProcess = spawn("npx", ["@apphosting/create", "--framework=nextjs", directory], {
    shell: true,
    stdio: "inherit",
  });

  // print out the shell command that spawn created
  console.log(createProcess.spawnargs.at(-1));

  createProcess.stdout?.on("data", (data) => {
    console.log(`i: ${data}`);
  });

  createProcess.stderr?.on("data", (data) => {
    console.error(`error: ${data}`);
  });

  createProcess.on("close", (code) => {
    if (code === 0) {
      console.log("Success!");
    } else {
      console.log(`There was a problem, exited with code ${code}`);
    }
  });
});

program.parse();
