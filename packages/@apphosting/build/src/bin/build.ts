#! /usr/bin/env node
import { spawnSync, spawn } from "child_process";
import { program } from "commander";
import { parse as semverParse } from "semver";

const frameworkAliases = new Map([
    ["nextjs", ["next"]],
]);

program
  .option('--framework <string>')
  .argument('<string>', 'path')
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
        // TODO error and try latest
        throw new Error(`Couldn't find ${framework}.`);
    }
    // TODO detirmine the appropriate fallback pattern
    const versionStackRank = [
        `~${version.major}.${version.minor}.0`,   // major.minor production match
        `~${version.major}.${version.minor}.0-0`, // major.minor rc match
        `^${version.major}.${version.minor}.0 <= ${version.major}.${version.minor + 1}.0`, // older production match
        `^${version.major}.${version.minor}.0`,   // newer production match
    ].join(" || ");
    const adapterName = `@apphosting/adapter-${framework}`;
    let npmInfo = JSON.parse(spawnSync("npm", ["info", `${adapterName}@"${versionStackRank}"`, "--json"]).stdout.toString());
    if (npmInfo.error) npmInfo = JSON.parse(spawnSync("npm", ["info", adapterName, "--json"]).stdout.toString());
    if (npmInfo.error) {
        throw new Error(npmInfo.error.detail)
    }
    const adapterVersion = semverParse(npmInfo.version);
    if (!adapterVersion) throw new Error(`Unable to parse ${adapterVersion}`);
    // TODO colors
    if (adapterVersion.prerelease) {
        console.error(`Using pre-release platform adapter ${npmInfo.name}@${npmInfo.version}`);
    } else if (adapterVersion.major !== version.major) {
        console.error(`Using a potentially incompatible adapter ${npmInfo.name}@${npmInfo.version}`);
    } else if (adapterVersion.minor !== version.minor) {
        console.warn(`Using a potentially incompatible adapter ${npmInfo.name}@${npmInfo.version}`);
    }
    const buildCommand = `apphosting-adapter-${framework}-build`;
    spawn(`npx -y -p ${adapterName}@${adapterVersion.raw} ${buildCommand}`, { cwd, shell: true, stdio: 'inherit' });
  });

program.parse();
