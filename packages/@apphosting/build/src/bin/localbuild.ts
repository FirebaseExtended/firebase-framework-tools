#! /usr/bin/env node
import { spawn } from "child_process";
import { program } from "commander";
import { yellow, bgRed, bold } from "colorette";

program
  // TODO: add framework option later. For now we support nextjs only.
  .argument("<directory>", "path to the project's root directory")
  .action(async () => {
    const projectRoot = program.args[0];
    const framework = "nextjs";
    // TODO: We are using the latest framework adapter versions, but in the future
    // we should parse the framework version and use the matching adapter version.
    const adapterName = `@apphosting/adapter-nextjs`;
    const packumentResponse = await fetch(`https://registry.npmjs.org/${adapterName}`);
    if (!packumentResponse.ok) throw new Error(`Something went wrong fetching ${adapterName}`);
    const packument = await packumentResponse.json();
    const adapterVersion = packument["dist-tags"]["canary"];
    // TODO: should check for existence of adapter in app's package.json and use that version instead.

    console.log(" 🔥", bgRed(` ${adapterName}@${yellow(bold(adapterVersion))} `), "\n");

    // Call it via NPX
    const buildCommand = `apphosting-adapter-${framework}-build`;
    spawn("npx", ["-y", "-p", `${adapterName}@${adapterVersion}`, buildCommand], {
      cwd: projectRoot,
      shell: true,
      stdio: "inherit",
    });
  });

program.parse();
