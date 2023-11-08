#! /usr/bin/env node
import { rmdir } from "fs/promises";
import { existsSync } from "fs";
import { execSync } from "child_process";
import { readFile } from "fs/promises";
import { join } from "path";
import { parse } from "semver";

const packageJson = JSON.parse((await readFile("package.json")).toString());

// TODO compare against latest & tags
const version = parse(packageJson.version);
if (!version) throw "couldn't parse package.json version";

const createNextAppVersionRange = packageJson.dependencies["create-next-app"];
const nextVersionRange = packageJson.peerDependencies["next"];

const expectedRange = `~${version.major}.${version.minor}.0`;
if (expectedRange !== createNextAppVersionRange)
  throw `expected create-next-app version requirement to equal ${expectedRange}`;
if (expectedRange !== nextVersionRange)
  throw `expected next version requirement to equal ${expectedRange}`;

const cwd = process.cwd();
const projectDir = join(cwd, "e2e");

await rmdir(projectDir, { recursive: true }).catch(() => {});

execSync(`npx -y -p . apphosting-adapter-nextjs-create ${projectDir}`, { cwd, stdio: "inherit" });
execSync("npx -y -p .. apphosting-adapter-nextjs-build", { cwd: projectDir, stdio: "inherit" });
if (!existsSync(join(projectDir, ".next"))) throw `next app wasn't build`;
