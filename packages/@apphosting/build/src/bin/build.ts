#! /usr/bin/env node
import { spawnSync, spawn } from "child_process";
import { program } from "commander";
import { parse as semverParse } from "semver";
import { red, yellow, bold } from "colorette";

const frameworkAliases = new Map([
    ["nextjs", ["next"]],
]);

program
  .option('--framework <string>')
  .argument('<directory>', "path to the project's root directory")
  .action(async (cwd, { framework }: { framework?: string }) => {
    if (!framework) {
        throw new Error("Discovery not implemented. Must provide an option to --framework <string>");
    }
    const npmModules = frameworkAliases.get(framework) || [framework];
    // TODO sanitize the framework name pull the npm dep parser from firebase-tools
    const result = JSON.parse(spawnSync("npm", ["ls", ...npmModules, "--json"], { cwd }).stdout.toString());
    const packageName = npmModules.find(pkg => result.dependencies?.[pkg]);
    const version = packageName && semverParse(result.dependencies[packageName].version);
    if (!version) {
        throw new Error(`Couldn't find ${framework}.`);
    }
    // TODO detirmine the appropriate fallback pattern
    const versionStackRank = [
        `~${version.major}.${version.minor}.0`,   // major.minor production match
        `~${version.major}.${version.minor}.0-0`, // major.minor rc match
        `^${version.major}.0.0 <${version.major}.${version.minor}.0`, // older production match
        `^${version.major}.${version.minor + 1}.0`,   // newer production match
    ].join(" || ");
    const adapterName = `@apphosting/adapter-${framework}`;
    let npmInfo = JSON.parse(spawnSync("npm", ["info", `${adapterName}@"${versionStackRank}"`, "--json"]).stdout.toString());
    if (npmInfo.error) npmInfo = JSON.parse(spawnSync("npm", ["info", adapterName, "--json"]).stdout.toString());
    if (npmInfo.error) {
        throw new Error(npmInfo.error.detail)
    }
    const adapterVersion = semverParse(npmInfo.version);
    if (!adapterVersion) throw new Error(`Unable to parse ${adapterVersion}`);
    // TODO actually write a reasonable error message here & use a generator function
    if (adapterVersion.major !== version.major) {
        console.error(red(bold(' !')), red('Warning:'), `Using a potentially incompatible adapter ${npmInfo.name}@${npmInfo.version}\n            This is intended to be used with ${packageName} v${adapterVersion.major} but found v${version.major}. You're likely to encounter issues.\n`);
    } else if (adapterVersion.prerelease) {
        if (adapterVersion.minor === version.minor) {
            console.error(red(bold(' !')), red('Warning:'), `Using pre-release platform adapter ${npmInfo.name}@${npmInfo.version}\n            You're likely to encounter issues.\n`);
        } else {
            console.error(red(bold(' !')), red('Warning:'), `Using pre-release platform adapter ${npmInfo.name}@${npmInfo.version}\n            This is intended to be used with ${packageName} v${adapterVersion.major}.${adapterVersion.minor} but found v${version.major}.${version.minor}. You're likely to encounter issues.\n`);
        }
    } else if (adapterVersion.minor !== version.minor) {
        console.warn(yellow(bold(' !')), yellow('Warning:'), `Using a potentially incompatible adapter ${npmInfo.name}@${npmInfo.version}\n            This is intended to be used with ${packageName} v${adapterVersion.major}.${adapterVersion.minor} but found v${version.major}.${version.minor}. You may encounter issues.\n`);
    }
    const buildCommand = `apphosting-adapter-${framework}-build`;
    spawn('npx', ['-y', '-p', `${adapterName}@${adapterVersion.raw}`, buildCommand], { cwd, shell: true, stdio: 'inherit' });
  });

program.parse();
