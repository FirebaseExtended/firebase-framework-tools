#! /usr/bin/env node
import { program } from "commander";
import { performance } from "node:perf_hooks";
import { discover } from "../index.js";

program
  .option("--github-token <string>")
  .option("--github-repo <string>")
  .argument("<directory>", "path to the project's root directory")
  .action(
    async (path, { githubRepo, githubToken }: { githubRepo?: string; githubToken?: string }) => {
      const discoveredFrameworks = await discover(path, githubRepo, githubToken);
      process.stdout.write(JSON.stringify({ discovered: discoveredFrameworks }, undefined, 2));
      process.stderr.write(`\nDone in ${performance.now()}ms`);
    },
  );

program.parse();
