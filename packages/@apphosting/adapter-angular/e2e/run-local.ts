import { cp, readFile, writeFile } from "fs/promises";
import tmp from "tmp";
import promiseSpawn from "@npmcli/promise-spawn";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";
import { spawn } from "child_process";
import fsExtra from "fs-extra";

const { readFileSync } = fsExtra;

const starterTemplateDir = "../../../starters/angular/basic";

tmp.setGracefulCleanup();

const errors: any[] = [];

const tests = await Promise.all(
  [
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ].map(async ([enableSSR, enableSSG]) => {
    const { name: cwd } = tmp.dirSync();
    console.log(`Copying ${starterTemplateDir} to ${cwd}`);
    await cp(starterTemplateDir, cwd, { recursive: true });
    console.log("> npm i");
    await promiseSpawn("npm", ["i"], { cwd, stdio: "inherit", shell: true });

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const buildScript = join(__dirname, "../dist/bin/build.js");
    const angularJSON = JSON.parse((await readFile(join(cwd, "angular.json"))).toString());

    if (!enableSSR) {
      angularJSON.projects["firebase-app-hosting-angular"].architect.build.options.ssr = false;
    }
    if (!enableSSG) {
      angularJSON.projects["firebase-app-hosting-angular"].architect.build.options.prerender =
        false;
    }
    await writeFile(join(cwd, "angular.json"), JSON.stringify(angularJSON, null, 2));

    await promiseSpawn("node", [buildScript], { cwd, stdio: "inherit", shell: true });
    return [cwd, enableSSR, enableSSG] as const;
  }),
);

for (const [cwd, enableSSR, enableSSG] of tests) {
  try {
    const bundleYaml = parseYaml(readFileSync(join(cwd, ".apphosting/bundle.yaml")).toString());

    const runCommand = bundleYaml.runCommand;

    if (typeof runCommand !== "string") {
      throw new Error("runCommand must be a string");
    }

    console.log(`> ${runCommand}`);

    const [runScript, ...runArgs] = runCommand.split(" ");
    let resolveHostname: (it: string) => void;
    let rejectHostname: () => void;
    const hostnamePromise = new Promise<string>((resolve, reject) => {
      resolveHostname = resolve;
      rejectHostname = reject;
    });
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
        resolveHostname(`http://localhost:${port}`);
      } else {
        run.stdin.end();
        run.kill("SIGKILL");
      }
    });
    run.on("close", (code) => {
      if (code) {
        rejectHostname();
      }
    });
    const HOST = await hostnamePromise;
    console.log("> ts-mocha -p tsconfig.json e2e/**/*.spec.ts");
    await promiseSpawn("ts-mocha", ["-p", "tsconfig.json", "e2e/**/*.spec.ts"], {
      shell: true,
      stdio: "inherit",
      env: {
        ...process.env,
        SSR: enableSSR ? "1" : undefined,
        SSG: enableSSG ? "1" : undefined,
        SAUCE: cwd,
        HOST,
      },
    }).finally(() => {
      run.stdin.end();
      run.kill("SIGKILL");
    });
  } catch (e) {
    errors.push(e);
  }
}

if (errors.length) {
  console.error(errors);
  process.exit(1);
}

process.exit(0);
