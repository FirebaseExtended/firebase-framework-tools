#! /usr/bin/env node
const { execSync } = require("child_process");
const { writeFileSync, readFileSync } = require("fs");
const { join } = require("path");
const { filteredLernaList, lernaList, versionFromRef, shortSHA, prerelease } = require("./github.js");

const wombatDressingRoomTokens = new Map([
  // ['firebase-frameworks', process.env.FIREBASE_FRAMEWORKS_NPM_TOKEN],
  ["@apphosting/adapter-nextjs", process.env.ADAPTER_NEXTJS_NPM_TOKEN],
  ["@apphosting/adapter-angular", process.env.ADAPTER_ANGULAR_NPM_TOKEN],
  ["@apphosting/common", process.env.ADAPTER_COMMON_NPM_TOKEN],
]);

wombatDressingRoomTokens.forEach((token, pkg) => {
  writeFileSync(".npmrc", `//wombat-dressing-room.appspot.com/${pkg}/:_authToken=${token}\n`, {
    flag: "a+",
  });
});

const packagesToPublish = filteredLernaList.map((lerna) => {
  if (versionFromRef && versionFromRef.split("-")[0] !== lerna.version) {
    throw new Error(
      `Cowardly refusing to publish ${lerna.name}@${versionFromRef} from ${lerna.version}, version needs to be bumped in source.`,
    );
  }
  const version = versionFromRef || `${lerna.version}-canary.${shortSHA}`;
  const cwd = lerna.location;
  const tag = versionFromRef ? (prerelease ? "next" : "latest") : "canary";
  const packageJsonPath = join(lerna.location, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath).toString());
  packageJson.version = version;
  return packageJson;
});

for (packageJson of packagesToPublish) {
  for (const dependency in packageJson.dependencies) {
    const lernaPackage = lernaList.find(it => it.name === dependency);
    if (lernaPackage) {
      const changedPackage = packagesToPublish.find(it => it.name === dependency);
      packageJson.dependencies[dependency] = changedPackage?.version || lernaPackage.version;
    }
  }
  const lerna = lernaList.find(it => it.name === packageJson.name);
  if (!lerna) { throw packageJson.name }
  const packageJsonPath = join(lerna.location, "package.json");
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 2));
  const registry = wombatDressingRoomTokens.get(lerna.name)
    ? `https://wombat-dressing-room.appspot.com/${lerna.name}/_ns`
    : "https://registry.npmjs.org";
  const cwd = lerna.location;
  const tag = versionFromRef ? (prerelease ? "next" : "latest") : "canary";
  execSync(`npm publish --registry ${registry} --access public --tag ${tag} --provenance`, { cwd });
}
