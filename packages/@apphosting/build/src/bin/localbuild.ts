#! /usr/bin/env node
import { spawn } from "child_process";
import { program } from "commander";
import { yellow, bgRed, bold } from "colorette";

// TODO(#382): add framework option later or incorporate micro-discovery.
// TODO(#382): parse apphosting.yaml for environment variables / secrets.
// TODO(#382): parse apphosting.yaml for runConfig and include in buildSchema
// TODO(#382): Support custom build and run commands (parse and pass run command to build schema).
program
  .argument("<projectRoot>", "path to the project's root directory")
  .action(async (projectRoot: string) => {
    const framework = "nextjs";
    // TODO(#382): We are using the latest framework adapter versions, but in the future
    // we should parse the framework version and use the matching adapter version.
    const adapterName = `@apphosting/adapter-nextjs`;
    const packumentResponse = await fetch(`https://registry.npmjs.org/${adapterName}`);
    if (!packumentResponse.ok) throw new Error(`Something went wrong fetching ${adapterName}`);
    const packument = await packumentResponse.json();
    const adapterVersion = packument?.["dist-tags"]?.["latest"];
    if (!adapterVersion) {
      throw new Error(`Could not find 'latest' dist-tag for ${adapterName}`);
    }
    // TODO(#382): should check for existence of adapter in app's package.json and use that version instead.

    console.log(" 🔥", bgRed(` ${adapterName}@${yellow(bold(adapterVersion))} `), "\n");

    const buildCommand = `apphosting-adapter-${framework}-build`;
    await new Promise<void>((resolve, reject) => {
      const child = spawn("npx", ["-y", "-p", `${adapterName}@${adapterVersion}`, buildCommand], {
        cwd: projectRoot,
        shell: true,
        stdio: "inherit",
      });

      child.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`framework adapter build failed with error code ${code}.`));
        }
        resolve();
      });
    });
    //  TODO(#382): parse bundle.yaml and apphosting.yaml and output a buildschema somewhere.
  });

program.parse();
