#! /usr/bin/env node
import { program } from "commander";
import spawn from "@npmcli/promise-spawn";

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
    let packageManager: string | undefined = undefined;
    let packageManagerVersion = "*";
    if (contextIsNpmCreate) {
      packageManager = "npm";
    } else if (npmUserAgent.pnpm) {
      packageManager = "pnpm";
      packageManagerVersion = npmUserAgent.pnpm;
    } else if (npmUserAgent.yarn) {
      packageManager = "yarn";
      packageManagerVersion = npmUserAgent.yarn;
    }
    const args = ["--yes", "@apphosting/create@latest", "--framework=nextjs"];
    if (packageManager) {
      args.push(`--package-manager=${packageManager}@${packageManagerVersion}`);
    }
    if (directory) {
      args.push(directory);
    }
    await spawn("npx", args, {
      shell: true,
      stdio: "inherit",
    });
  });

program.parse();
