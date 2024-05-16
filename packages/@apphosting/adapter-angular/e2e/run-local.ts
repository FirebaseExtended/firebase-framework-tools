import { cp, readFile, writeFile } from "fs/promises";
import tmp from "tmp";
import promiseSpawn from "@npmcli/promise-spawn";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";
import { spawn } from "child_process";

tmp.setGracefulCleanup();

const { name: tmpDir } = tmp.dirSync();

const __dirname = dirname(fileURLToPath(import.meta.url));

const buildScript = join(__dirname, "../dist/bin/build.js");

await cp("../../../starters/angular/basic", tmpDir, { recursive: true });

await promiseSpawn("npm", ["i"], { cwd: tmpDir, stdio: "inherit", shell: true });

if (!process.env.SSR) {
  const angularJSON = JSON.parse((await readFile(join(tmpDir, "angular.json"))).toString());
  angularJSON.projects["firebase-app-hosting-angular"].architect.build.ssr = false;
  await writeFile(join(tmpDir, "angular.json"), JSON.stringify(angularJSON, null, 2));
}

await promiseSpawn("node", [buildScript], { cwd: tmpDir, stdio: "inherit", shell: true });

const bundleYaml = parseYaml((await readFile(join(tmpDir, ".apphosting/bundle.yaml"))).toString());

const runCommand = bundleYaml.runCommand;

if (typeof runCommand !== "string") {
  throw new Error("runCommand must be a string");
}

const [runScript, ...runArgs] = runCommand.split(" ");

await new Promise((resolve, reject) => {
  const port = 8080 + Math.floor(Math.random() * 1000);
  const run = spawn(runScript, runArgs, {
    cwd: tmpDir,
    shell: true,
    env: {
      NODE_ENV: "production",
      LOCAL: "1",
      PORT: port.toString(),
    },
  });
  run.stderr.on("data", (data) => console.error(data.toString()));
  run.stdout.on("data", (data) => {
    console.log(data.toString());
    if (data.toString() === `Node Express server listening on http://localhost:${port}\n`) {
      resolve(
        promiseSpawn(
          "ts-mocha",
          [
            "-p",
            "tsconfig.json",
            "e2e/csr/*.spec.ts",
            process.env.SSR ? "e2e/ssr/*.spec.ts" : "",
          ].filter((it) => it),
          {
            shell: true,
            stdio: "inherit",
            env: {
              ...process.env,
              HOST: `http://localhost:${port}`,
            },
          },
        ).finally(() => {
          run.stdin.end();
          run.kill("SIGKILL");
        }),
      );
    } else {
      run.stdin.end();
      run.kill("SIGKILL");
    }
  });
  run.on("close", (code) => {
    if (code) {
      reject();
    }
  });
});
