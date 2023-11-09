#! /usr/bin/env node
import { existsSync } from "fs";
import { execSync } from "child_process";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { parse } from "semver";
import { dir as tempDir } from "tmp";
import { fileURLToPath } from "url";
import { CREATE_NEXT_APP_VERSION } from "./src/bin/create.js";

const packageJson = JSON.parse((await readFile("package.json")).toString());

const version = parse(packageJson.version);
if (!version) throw "couldn't parse package.json version";

const nextVersionRange = packageJson.peerDependencies["next"];

const expectedRange = `~${version.major}.${version.minor}.0`;
if (expectedRange !== CREATE_NEXT_APP_VERSION)
  throw new Error(`expected create-next-app version requirement to equal ${expectedRange}`);
if (expectedRange !== nextVersionRange)
  throw new Error(`expected next version requirement to equal ${expectedRange}`);

if (parseInt(process.versions.node) >= 18) {

  tempDir((err, cwd, cleanup) => {
    if (err) throw err;
    const projectDir = join(cwd, "e2e");
    const root = dirname(fileURLToPath(import.meta.url));
    execSync(`npx -y -p ${root} apphosting-adapter-nextjs-create ${projectDir}`, {
      cwd,
      stdio: "inherit",
    });
    execSync(`npx -y -p ${root} apphosting-adapter-nextjs-build`, {
      cwd: projectDir,
      stdio: "inherit",
    });
    if (!existsSync(join(projectDir, ".next"))) throw new Error(`next app wasn't build`);
    if (!process.env.GITHUB_ACTION) {
      execSync(`rm -rf e2e`, { cwd });
      cleanup();
    }
  });

}
