#! /usr/bin/env node
const { execSync } = require("child_process");
const { writeFileSync, readFileSync } = require("fs");
const { join } = require("path");
const { filteredLernaList, versionFromRef, shortSHA, prerelease } = require("./github.js");

const wombatDressingRoomTokens = new Map([
  // Disabling this until I can get wombat access to this org
  // ['firebase-frameworks', process.env.FIREBASE_FRAMEWORKS_NPM_TOKEN],
  // ['@apphosting/adapter-nextjs', process.env.ADAPTER_NEXTJS_NPM_TOKEN],
]);

wombatDressingRoomTokens.forEach((token, pkg) => {
  writeFileSync(".npmrc", `//wombat-dressing-room.appspot.com/${pkg}/:_authToken=${token}\n`, {
    flag: "a+",
  });
});

for (const lerna of filteredLernaList) {
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
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 2));
  const registry = wombatDressingRoomTokens.get(lerna.name)
    ? `https://wombat-dressing-room.appspot.com/${lerna.name}/_ns`
    : "https://registry.npmjs.org";
  execSync(`npm publish --registry ${registry} --access public --tag ${tag} --provenance`, { cwd });
}
