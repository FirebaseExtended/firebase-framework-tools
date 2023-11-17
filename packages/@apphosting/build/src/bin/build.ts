#! /usr/bin/env node
import { spawn } from "child_process";
import { program } from "commander";
import { parse as semverParse } from "semver";
import { yellow, bgRed, bold } from "colorette";
// @ts-expect-error TODO add interface
import pickManifest from "npm-pick-manifest";
import Arborist from "@npmcli/arborist";

// If a framework's NPM module can be named something different, put it in the map
const frameworkPackageNames = new Map([
    ["nextjs", ["next"]],
    ["angular", ["@angular/core"]],
]);

program
  .option('--framework <string>')
  .option('--permit-prerelease')
  .argument('<directory>', "path to the project's root directory")
  .action(async (cwd, options: { framework?: string, permitPrerelease?: boolean }) => {
    const { framework } = options;
    if (!framework) throw new Error("Discovery not implemented. Must provide an option to --framework <string>");

    // Find the matching NPM package version
    const possiblePackageNames = frameworkPackageNames.get(framework) || [framework];
    const aboristTree = await new Arborist({ path: cwd }).loadActual();
    const packageName = possiblePackageNames.find(pkg => aboristTree.children.has(pkg));
    if (!packageName) throw new Error(`Couldn't find ${framework}`);
    // TODO use NPM semver, then we don't have to worry about null
    const packgeVersion = semverParse(aboristTree.children.get(packageName)!.pkgid.split(`${packageName}@`)[1]);
    if (!packgeVersion) throw new Error(`Couldn't find ${framework}.`);

    // Look up a matching @apphosting/adapter-*
    const permitPrerelease = packgeVersion.prerelease.length > 0 || options.permitPrerelease;
    const adapterName = `@apphosting/adapter-${framework}`;
    const packumentResponse = await fetch(`https://registry.npmjs.org/${adapterName}`);
    if (!packumentResponse.ok) throw new Error(`Something went wrong fetching ${adapterName}`);
    const packument = await packumentResponse.json();
    // TODO find tune this
    const pickOrder = [
        `~${packgeVersion.major}.${packgeVersion.minor}.0`,
        permitPrerelease && `~${packgeVersion.major}.${packgeVersion.minor}.0-next.0`,
        `^${packgeVersion.major}.0.0`,
        permitPrerelease && `^${packgeVersion.major}.0.0-next.0`,
        ">0",
    ];
    const { version: adapterVersion } = pickManifest(packument, pickOrder.filter(it => !!it).join(' || '));
    
    console.log(' 🔥', bgRed(` ${adapterName}@${yellow(bold(adapterVersion))} `), "\n");

    // Call it via NPX
    const buildCommand = `apphosting-adapter-${framework}-build`;
    spawn('npx', ['-y', '-p', `${adapterName}@${adapterVersion}`, buildCommand], { cwd, shell: true, stdio: 'inherit' });
  });

program.parse();
