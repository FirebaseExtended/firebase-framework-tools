#! /usr/bin/env node
const { execSync } = require("child_process");
const { basename } = require("path");

const [, packageFromRef, versionFromRef, , prerelease] =
  /^refs\/tags\/(.+)-v(\d\d*\.\d\d*(\.\d\d*)?(-.+)?)$/.exec(process.env.GITHUB_REF ?? "") ?? [];

const since = process.env.GITHUB_ACTION ?
  `--since ${process.env.GITHUB_BASE_REF || "HEAD^1"}` :
  "";

const lernaList = JSON.parse(
  execSync(`lerna list --json ${packageFromRef ? "" : since}`, {
    stdio: ["ignore", "pipe", "ignore"],
  }).toString(),
);

const ref = process.env.GITHUB_SHA ?? "HEAD";
const shortSHA = execSync(`git rev-parse --short ${ref}`).toString().trim();

const filteredLernaList = lernaList.filter((lerna) => {
  if (lerna.private) return false;
  if (packageFromRef && packageFromRef !== basename(lerna.location)) return false;
  return true;
});

if (packageFromRef && filteredLernaList.length === 0) {
  throw new Error(`Lerna didn't find ${packageFromRef} in this workspace`);
}

const lernaScopeArgs = filteredLernaList.map(({ name }) => ["--scope", name]).flat();

module.exports = {
  packageFromRef,
  versionFromRef,
  prerelease: !packageFromRef || !!prerelease,
  filteredLernaList,
  shortSHA,
  lernaScopeArgs,
};
