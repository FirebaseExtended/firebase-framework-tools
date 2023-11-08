#! /usr/bin/env node
const { execSync } = require("child_process");

const [,packageToPublish,versionToPublish] = /^refs\/tags\/(.+)\@([^\@]+)$/.exec(process.env.GITHUB_REF ?? "") ?? [];
const ref = process.env.GITHUB_SHA ?? "HEAD";
const shortSHA = execSync(`git rev-parse --short ${ref}`).toString().trim();

const lernaList= JSON.parse(execSync(`lerna list --json ${packageToPublish ? '' : '--since'}`).toString());
if (packageToPublish && !lernaList.find(it => it.name === packageToPublish)) throw `Lerna didn't find ${packageToPublish} in this workspace`;

for (const lerna of lernaList) {
    if (lerna.private) continue;
    if (packageToPublish && packageToPublish !== lerna.name) continue;
    if (versionToPublish && versionToPublish.split('-')[0] !== lerna.version) throw `Cowardly refusing to publish ${lerna.name}@${versionToPublish} from ${lerna.version}, version needs to be bumped in source.`;
    const version = versionToPublish || `${lerna.version}-canary.${shortSHA}`;
    execSync(`npm --prefix ${lerna.location} --no-git-tag-version --allow-same-version -f version ${version}`);
    const tag = packageToPublish ? (version.includes('-') ? 'next' : 'latest') : 'canary';
    console.log(`npm publish ${lerna.location} --tag ${tag}`);
    execSync(`npm --prefix ${lerna.location} --no-git-tag-version --allow-same-version -f version ${lerna.version}`);
}
