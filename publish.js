#! /usr/bin/env node
const { execSync } = require("child_process");
const { writeFileSync, readFileSync } = require("fs");
const { join } = require("path");

const [, packageFromRef, versionFromRef] = /^refs\/tags\/(.+)\@([^\@]+)$/.exec(process.env.GITHUB_REF ?? "") ?? [];
const ref = process.env.GITHUB_SHA ?? "HEAD";
const shortSHA = execSync(`git rev-parse --short ${ref}`).toString().trim();

const lernaList= JSON.parse(execSync(`lerna list --json ${packageFromRef ? '' : '--since'}`).toString());
if (packageFromRef && !lernaList.find(it => it.name === packageFromRef)) throw `Lerna didn't find ${packageFromRef} in this workspace`;

for (const lerna of lernaList) {
    if (lerna.private) continue;
    if (packageFromRef && packageFromRef !== lerna.name) continue;
    if (versionFromRef && versionFromRef.split('-')[0] !== lerna.version) throw `Cowardly refusing to publish ${lerna.name}@${versionFromRef} from ${lerna.version}, version needs to be bumped in source.`;
    const version = versionFromRef || `${lerna.version}-canary.${shortSHA}`;
    const cwd = lerna.location;
    const tag = packageFromRef ? (version.includes('-') ? 'next' : 'latest') : 'canary';
    const packageJsonPath = join(lerna.location, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath).toString());
    packageJson.version = version;
    packageJson.publishConfig.tag = tag;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 2));
    execSync(`npm publish`, { cwd });
}
