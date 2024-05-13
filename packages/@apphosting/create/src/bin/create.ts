#! /usr/bin/env node
import { program } from "commander";
import { downloadTemplate } from "giget";
import { select } from "@inquirer/prompts";
import spawn from "@npmcli/promise-spawn";
import ora from "ora";

console.log(process);

program
  .option("--framework <string>")
  .option("--package-manager <string>")
  .option("--skip-install")
  .argument("<directory>", "path to the project's root directory")
  .action(
    async (
      dir,
      {
        framework,
        packageManager,
        skipInstall,
      }: { framework?: string; packageManager?: string; skipInstall?: true },
    ) => {
      // TODO DRY up the validation and error handling, move to commander parse
      if (framework) {
        if (!["angular", "nextjs"].includes(framework)) {
          console.error(`Invalid framework: ${framework}, valid choices are angular and nextjs`);
          process.exit(1);
        }
      } else {
        framework = await select({
          message: "Select a framework",
          choices: [
            { name: "Angular", value: "angular" },
            { name: "Next.js", value: "nextjs" },
          ],
        });
      }
      const cloneSpinner = ora("Cloning template...").start();
      // TODO allow different templates
      await downloadTemplate(
        `gh:FirebaseExtended/firebase-framework-tools/starters/${framework}/basic`,
        { dir, force: true },
      );
      cloneSpinner.succeed();
      // TODO DRY up validation and error message, move to commander parse
      if (packageManager) {
        if (!["npm", "yarn", "pnpm"].includes(packageManager)) {
          console.error(
            `Invalid package manager: ${packageManager}, valid choices are npm, yarn, and pnpm`,
          );
          process.exit(1);
        }
      } else {
        packageManager = await select({
          message: "Select a package manager",
          default: "npm",
          choices: [
            { name: "npm", value: "npm" },
            { name: "yarn", value: "yarn" },
            { name: "pnpm", value: "pnpm" },
          ],
        });
      }
      if (packageManager !== "npm") {
        await spawn("corepack", ["enable"], {
          shell: true,
          stdio: "inherit",
          cwd: dir,
        });
        await spawn("corepack", ["use", `${packageManager}@*`], {
          shell: true,
          stdio: "inherit",
          cwd: dir,
        });
      }
      if (!skipInstall) {
        const installSpinner = ora("Installing dependencies...").start();
        await spawn(packageManager, ["install"], {
          shell: true,
          stdio: "inherit",
          cwd: dir,
        });
        installSpinner.succeed();
      }
    });

program.parse();
