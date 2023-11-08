#! /usr/bin/env node
const { execSync } = require("child_process");
const { writeFileSync, readFileSync } = require("fs");
const { join } = require("path");

const [, packageFromRef, versionFromRef] = /^refs\/tags\/(.+)\@([^\@]+)$/.exec(process.env.GITHUB_REF ?? "") ?? [];
const ref = process.env.GITHUB_SHA ?? "HEAD";
const shortSHA = execSync(`git rev-parse --short ${ref}`).toString().trim();

const lernaList= JSON.parse(execSync(`lerna list --json ${packageFromRef ? '' : '--since'}`).toString());
if (packageFromRef && !lernaList.find(it => it.name === packageFromRef)) throw `Lerna didn't find ${packageFromRef} in this workspace`;


const authTokens = new Map([
    ['firebase-frameworks', process.env.FIREBASE_FRAMEWORKS_NPM_TOKEN],
    ['@apphosting/adapter-nextjs', process.env.ADAPTER_NEXTJS_NPM_TOKEN],
]);

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
    const npmRcPath = join(lerna.location, '.npmrc');
    const authToken = authTokens.get(lerna.name);
    if (!authToken) throw `Unable to find NPM token for ${lerna.name}`;
    writeFileSync(npmRcPath, `//wombat-dressing-room.appspot.com/:_authToken=${authToken}`)
    execSync(`npm publish`, { cwd });
}
