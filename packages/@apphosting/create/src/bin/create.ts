#! /usr/bin/env node
import { spawnSync, spawn } from "child_process";
import { program } from "commander";
import { downloadTemplate } from "giget";
import { select } from "@inquirer/prompts";

program
  .option("--framework <string>")
  .argument("<directory>", "path to the project's root directory")
  .action(async (dir, { framework }: { framework?: string }) => {
    // TODO validate the framework
    if (!framework) {
      framework = await select({
        message: "Select a framework",
        choices: [
          { name: "Angular", value: "angular" },
          { name: "Next.js", value: "nextjs" },
        ],
      });
    }
    // TODO allow different templates
    await downloadTemplate(
      `gh:FirebaseExtended/firebase-framework-tools/starters/${framework}/basic`,
      { dir, force: true },
    );
    const packageManager = await select({
      message: "Select a package manager",
      default: "npm",
      choices: [
        { name: "npm", value: "npm" },
        { name: "yarn", value: "yarn" },
        { name: "pnpm", value: "pnpm" },
      ],
    });
    if (packageManager !== "npm") {
      spawnSync("corepack", ["enable"]);
      spawnSync("corepack", ["use", `${packageManager}@*`], {
        shell: true,
        stdio: "inherit",
        cwd: dir,
      });
    }
    spawn(packageManager, ["install"], {
      shell: true,
      stdio: "inherit",
      cwd: dir,
    });
  });

program.parse();
