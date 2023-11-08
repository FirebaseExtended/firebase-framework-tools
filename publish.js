#! /usr/bin/env node
const { execSync } = require("child_process");

const [, packageFromRef, versionFromRef] = /^refs\/tags\/(.+)\@([^\@]+)$/.exec(process.env.GITHUB_REF ?? "") ?? [];
const ref = process.env.GITHUB_SHA ?? "HEAD";
const shortSHA = execSync(`git rev-parse --short ${ref}`).toString().trim();

const lernaList= JSON.parse(execSync(`lerna list --json ${packageFromRef ? '' : '--since'}`).toString());
if (packageFromRef && !lernaList.find(it => it.name === packageFromRef)) throw `Lerna didn't find ${packageFromRef} in this workspace`;

const npmTokens = new Map([
    ['firebase-frameworks', process.env.FIREBASE_FRAMEWORKS_NPM_TOKEN],
    ['@apphosting/adapter-nextjs', process.env.ADAPTER_NEXTJS_NPM_TOKEN],
]);

for (const lerna of lernaList) {
    if (lerna.private) continue;
    if (packageFromRef && packageFromRef !== lerna.name) continue;
    if (versionFromRef && versionFromRef.split('-')[0] !== lerna.version) throw `Cowardly refusing to publish ${lerna.name}@${versionFromRef} from ${lerna.version}, version needs to be bumped in source.`;
    const version = versionFromRef || `${lerna.version}-canary.${shortSHA}`;
    const cwd = lerna.location;
    execSync(`npm --no-git-tag-version --allow-same-version -f version ${version}`, { cwd });
    const tag = packageFromRef ? (version.includes('-') ? 'next' : 'latest') : 'canary';
    const NPM_TOKEN = npmTokens.get(lerna.name);
    if (!NPM_TOKEN) throw `Could not find NPM token for ${lerna.name}`;
    execSync(`npm publish --registry https://wombat-dressing-room.appspot.com --tag ${tag}`, { cwd, env: { ...process.env, NPM_TOKEN } });
}
