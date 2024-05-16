import { readFile, writeFile } from "fs/promises";
import promiseSpawn from "@npmcli/promise-spawn";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";
import { spawn } from "child_process";

const cwd = "../../../starters/angular/basic";

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildScript = join(__dirname, "../dist/bin/build.js");

for (const SSR of [false, true]) {
  const angularJSON = JSON.parse((await readFile(join(cwd, "angular.json"))).toString());
  angularJSON.projects["firebase-app-hosting-angular"].architect.build.ssr = SSR && {
    entry: "server.ts",
  };
  await writeFile(join(cwd, "angular.json"), JSON.stringify(angularJSON, null, 2));

  await promiseSpawn("node", [buildScript], { cwd, stdio: "inherit", shell: true });

  const bundleYaml = parseYaml((await readFile(join(cwd, ".apphosting/bundle.yaml"))).toString());

  const runCommand = bundleYaml.runCommand;

  if (typeof runCommand !== "string") {
    throw new Error("runCommand must be a string");
  }

  console.log(`> ${runCommand}`);

  const [runScript, ...runArgs] = runCommand.split(" ");

  await new Promise((resolve, reject) => {
    const port = 8080 + Math.floor(Math.random() * 1000);
    const run = spawn(runScript, runArgs, {
      cwd,
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
          promiseSpawn("ts-mocha", ["-p", "tsconfig.json", "e2e/**/*.spec.ts"], {
            shell: true,
            stdio: "inherit",
            env: {
              ...process.env,
              SSR: SSR ? "1" : undefined,
              HOST: `http://localhost:${port}`,
            },
          }).finally(() => {
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
}
