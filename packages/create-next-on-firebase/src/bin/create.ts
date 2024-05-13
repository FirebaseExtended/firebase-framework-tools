#! /usr/bin/env node
import { program } from "commander";
import spawn from "@npmcli/promise-spawn";
import { input } from "@inquirer/prompts";

const contextIsNpmCreate = process.env.npm_command === "init";

// npm/10.1.0 node/v20.9.0 darwin x64 workspaces/false
// pnpm/9.1.0 npm/? node/v20.9.0 darwin x64
// yarn/1.7.0 npm/? node/v8.9.4 darwin x64
const npmUserAgent = process.env.npm_config_user_agent
  ? Object.fromEntries(process.env.npm_config_user_agent.split(" ").map((s) => s.split("/")))
  : {};

program
  .argument("[directory]", "path to the project's root directory")
  .action(async (directory) => {
    directory ||= await input({
      message: "What directory should we bootstrap the application in?",
      default: ".",
    });
    let packageManager: string | undefined = undefined;
    if (contextIsNpmCreate) {
      packageManager = "npm";
    } else if (npmUserAgent.pnpm) {
      packageManager = `pnpm@${npmUserAgent.pnpm}`;
    } else if (npmUserAgent.yarn) {
      packageManager = `yarn@${npmUserAgent.yarn}`;
    }
    console.log(packageManager, ["create", "@apphosting", "--framework=nextjs", directory]);
    if (packageManager) {
      await spawn(packageManager, ["create", "@apphosting", "--framework=nextjs", directory], {
        shell: true,
        stdio: "inherit",
      });
    } else {
      await spawn("npx", ["@apphosting/create", "--framework=nextjs", directory], {
        shell: true,
        stdio: "inherit",
      });
    }
  });

program.parse();
