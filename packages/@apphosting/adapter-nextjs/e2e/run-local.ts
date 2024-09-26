import { cp } from "fs/promises";
import promiseSpawn from "@npmcli/promise-spawn";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";
import { spawn } from "child_process";
import fsExtra from "fs-extra";

const { readFileSync, mkdirp, rmdir } = fsExtra;

const __dirname = dirname(fileURLToPath(import.meta.url));

const starterTemplateDir = "../../../starters/nextjs/basic";

const errors: any[] = [];

await rmdir(join(__dirname, "runs"), { recursive: true }).catch(() => undefined);

console.log("\nBuilding and starting test project...");

const runId = Math.random().toString().split(".")[1];
const cwd = join(__dirname, "runs", runId);
await mkdirp(cwd);

console.log(`[${runId}] Copying ${starterTemplateDir} to working directory`);
await cp(starterTemplateDir, cwd, { recursive: true });

console.log(`[${runId}] > npm ci --silent --no-progress`);
await promiseSpawn("npm", ["ci", "--silent", "--no-progress"], {
  cwd,
  stdio: "inherit",
  shell: true,
});

const buildScript = relative(cwd, join(__dirname, "../dist/bin/build.js"));
console.log(`[${runId}] > node ${buildScript}`);

const packageJson = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8"));
const frameworkVersion = packageJson.dependencies.next.replace("^", "");
await promiseSpawn("node", [buildScript], {
  cwd,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    FRAMEWORK_VERSION: frameworkVersion,
  },
});

const bundleYaml = parseYaml(readFileSync(join(cwd, ".apphosting/bundle.yaml")).toString());

const runCommand = bundleYaml.serverConfig.runCommand;

if (typeof runCommand !== "string") {
  throw new Error("runCommand must be a string");
}

const [runScript, ...runArgs] = runCommand.split(" ");
let resolveHostname: (it: string) => void;
let rejectHostname: () => void;
const hostnamePromise = new Promise<string>((resolve, reject) => {
  resolveHostname = resolve;
  rejectHostname = reject;
});
const port = 8080 + Math.floor(Math.random() * 1000);
console.log(`[${runId}] > PORT=${port} ${runCommand}`);
const run = spawn(runScript, runArgs, {
  cwd,
  shell: true,
  env: {
    NODE_ENV: "production",
    PORT: port.toString(),
  },
});
run.stderr.on("data", (data) => console.error(data.toString()));
run.stdout.on("data", (data) => {
  console.log(data.toString());
  // Check for the "Ready in" message to determine when the server is fully started
  if (data.toString().includes(`Ready in`)) {
    // We use 0.0.0.0 instead of localhost to avoid issues when ipv6 is not available (Node 18)
    resolveHostname(`http://0.0.0.0:${port}`);
  }
});
run.on("close", (code) => {
  if (code) {
    rejectHostname();
  }
});
const host = await hostnamePromise;

console.log("\n\n");

try {
  console.log(`> HOST=${host} ts-mocha -p tsconfig.json e2e/*.spec.ts`);
  await promiseSpawn("ts-mocha", ["-p", "tsconfig.json", "e2e/*.spec.ts"], {
    shell: true,
    stdio: "inherit",
    env: {
      ...process.env,
      HOST: host,
    },
  }).finally(() => {
    run.stdin.end();
    run.kill("SIGKILL");
  });
} catch (e) {
  errors.push(e);
}

if (errors.length) {
  console.error(errors);
  process.exit(1);
}

process.exit(0);
