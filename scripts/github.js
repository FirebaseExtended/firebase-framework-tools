#! /usr/bin/env node
const { execSync } = require("child_process");

const [, packagePatternFromRef, versionFromRef, , prereleaseFromRef] =
  /^refs\/tags\/(.+)-v(\d\d*\.\d\d*(\.\d\d*)?(-.+)?)$/.exec(process.env.GITHUB_REF ?? "") ?? [];

const since = process.env.GITHUB_ACTION
  ? `--since ${
      (process.env.GITHUB_BASE_REF && `origin/${process.env.GITHUB_BASE_REF}`) || "HEAD^1"
    }`
  : "";

const lernaList = JSON.parse(execSync("lerna list --json --loglevel silent"));

const ref = process.env.GITHUB_SHA ?? "HEAD";
const shortSHA = execSync(`git rev-parse --short ${ref}`).toString().trim();

const scopedLernaList = JSON.parse(
  execSync(
    `lerna list --json --no-private --toposort --loglevel silent --include-dependents ${
      packagePatternFromRef ? `--scope='{,*/}${packagePatternFromRef}'` : since
    }`,
  ),
);

const packagesFromRef =
  packagePatternFromRef &&
  JSON.parse(
    execSync(
      `lerna list --json --no-private --loglevel silent --scope='{,*/}${packagePatternFromRef}'`,
    ),
  );
if (packagePatternFromRef && packagesFromRef.length !== 1) {
  throw new Error(`Tag pattern matched more than one package...`);
}
const packageFromRef = packagesFromRef?.[0].name;

const lernaScopes = scopedLernaList.map(({ name }) => ["--scope", name]).flat();

module.exports = {
  taggedRelease: packageFromRef && {
    name: packageFromRef,
    version: versionFromRef,
    tag: prereleaseFromRef ? "next" : "latest",
  },
  lernaList,
  scopedLernaList,
  shortSHA,
  lernaScopes,
};
