#! /usr/bin/env node
import { spawn } from "child_process";
import { program } from "commander";
import { parse as semverParse } from "semver";
import { yellow, bgRed, bold } from "colorette";
// @ts-expect-error TODO add interface
import pickManifest from "npm-pick-manifest";

import type { SpawnOptionsWithoutStdio } from "child_process";

const spawnPromise = (command: string, args: readonly string[], options?: SpawnOptionsWithoutStdio) => new Promise<Buffer>((resolve, reject) => {
  const process = spawn(command, args, options);
  const buffers: Buffer[] = [];
  process.stdout.on('data', (it: Buffer) => buffers.push(it));
  process.stderr.on('data', (it: Buffer) => console.error(it.toString().trim()));
  process.on("exit", code => {
      if (code === 0) return resolve(Buffer.concat(buffers));
      reject();
  });
});

program
  .option('--framework <string>')
  .argument('<directory>', "path to the project's root directory")
  .action(async (cwd, options: { framework?: string, permitPrerelease?: boolean }) => {
    const { framework: expectedFramework } = options;

    // TODO look at sharing code with the discovery module, rather than npx
    const discoveryReturnValue = await spawnPromise(
      "npx",
      ["-y", "-p", "@apphosting/discover", "discover", cwd],
      { shell: true },
    );
    // TODO type
    const discoveryResults = JSON.parse(discoveryReturnValue.toString());
    const nonBundledFrameworks = discoveryResults.discovered.filter((it: any) => !it.bundledWith);
    if (nonBundledFrameworks.length === 0) throw new Error("Did not discover any frameworks.");
    if (nonBundledFrameworks.length > 1) throw new Error("Found conflicting frameworks.");
    if (expectedFramework && nonBundledFrameworks[0].framework !== expectedFramework) {
      throw new Error("Discovery did not match expected framework.");
    }
    const { framework, version } = nonBundledFrameworks[0];

    const parsedVersion = semverParse(version);
    if (!parsedVersion) throw new Error("Could not parse framework version");

    const adapterName = `@apphosting/adapter-${framework}`;
    const packumentResponse = await fetch(`https://registry.npmjs.org/${adapterName}`);
    if (!packumentResponse.ok) throw new Error(`Something went wrong fetching ${adapterName}`);
    // TODO types
    const packument = await packumentResponse.json();
    // TODO figure out a pattern for prereleases
    const range = [
      `>=${parsedVersion.major}.0.0 <${parsedVersion.major}.${parsedVersion.minor + 1}.0`,
      `^${parsedVersion.major}.${parsedVersion.minor}.0`,
    ].join(" || ");
    let adapterVersion: string | undefined;
    try {
      adapterVersion = pickManifest(packument, range).version;
    } catch (e) {
      adapterVersion = packument["dist-tags"]["latest"];
    }
    if (!adapterVersion) throw new Error("No matching adapter found.");

    console.log(" 🔥", bgRed(` ${adapterName}@${yellow(bold(adapterVersion))} `), "\n");

    // Call it via NPX
    const buildCommand = `apphosting-adapter-${framework}-build`;
    spawn("npx", ["-y", "-p", `${adapterName}@${adapterVersion}`, buildCommand], {
      cwd,
      shell: true,
      stdio: "inherit",
    });
  });

program.parse();
