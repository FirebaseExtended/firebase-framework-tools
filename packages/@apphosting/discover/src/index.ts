import fsExtra from "fs-extra";
import YarnLockfile from "@yarnpkg/lockfile";
import { parse as parseYaml } from "yaml";
import * as toml from "toml";

export const PLATFORMS = [
  // [id, files[], defaultPackageManger, packageManagers[], frameworks[]]
  [
    "nodejs",
    ["package.json"],
    "npm",
    [
      // [id, lockfiles[]]
      ["npm", ["npm-shrinkwrap.json", "package-lock.json"]],
      ["yarn", ["yarn.lock"]],
      ["pnpm", ["pnpm-lock.yaml"]],
    ],
    [
      // [id, deps[], files[], bundles[]]
      ["nextjs", ["next"], [], ["react"]],
      ["angular", ["@angular/core"], ["angular.json"], ["vite"]],
      [
        "astro",
        ["astro"],
        ["astro.config.js", "astro.config.mjs", "astro.config.cjs", "astro.config.ts"],
        ["lit", "react", "preact", "svelte", "vue", "vite"],
      ],
      ["nuxt", ["nuxt"], ["nuxt.config.js"], ["vue"]],
      ["lit", ["lit", "lit-element"], [], []],
      ["vue", ["vue"], [], []],
      ["vite", ["vite"], [], ["vue", "react", "preact", "lit", "svelte"]],
      ["preact", ["preact"], [], []],
      ["react", ["react", "react-dom"], [], []],
      ["svelte", ["svelte"], [], []],
      ["sveltekit", ["@sveltejs/kit"], [], ["svelte", "vite"]],
    ],
  ],
  [
    "python",
    [],
    "pip",
    [
      // [id, lockfiles[]]
      ["pip", []],
      ["pipenv", ["Pipfile.lock"]],
      ["poetry", ["poetry.lock"]],
    ],
    [
      // [id, deps[], files[], bundles[]]
      ["flask", ["flask"], [], []],
      ["django", ["django"], [], []],
    ],
  ],
] as const;

type DiscoveredFramework = {
  framework: (typeof PLATFORMS)[number][4][number][0];
  version: string;
  packageManager: (typeof PLATFORMS)[number][3][number][0];
  platform: (typeof PLATFORMS)[number][0];
  bundledWith?: Array<(typeof PLATFORMS)[number][4][number][0]>;
};

export async function discover(directory: string, githubRepo?: string, githubToken?: string) {
  if (githubRepo && !githubToken) throw new Error("needs token");

  const path = await (githubRepo ? import("node:path") : import("node:path/posix"));

  const { readFile, pathExists, readJson } = githubRepo
    ? {
        readFile: async function (path: string) {
          const response = await fetch(
            `https://api.github.com/repos/${githubRepo}/contents/${path}`,
            {
              headers: {
                authorization: `Bearer ${githubToken}`,
                accept: "application/vnd.github.raw",
              },
            },
          );
          if (!response.ok) throw new Error("fail.");
          return Buffer.from(await response.text());
        },
        pathExists: async function (path: string) {
          const response = await fetch(
            `https://api.github.com/repos/${githubRepo}/contents/${path}`,
            {
              method: "HEAD",
              headers: {
                authorization: `Bearer ${githubToken}`,
                accept: "application/vnd.github.raw",
              },
            },
          );
          return response.ok;
        },
        readJson: async function (path: string) {
          const response = await fetch(
            `https://api.github.com/repos/${githubRepo}/contents/${path}`,
            {
              headers: {
                authorization: `Bearer ${githubToken}`,
                accept: "application/vnd.github.raw",
              },
            },
          );
          if (!response.ok) throw new Error("fail.");
          return await response.json();
        },
      }
    : fsExtra;

  const discoveredFrameworks: Array<DiscoveredFramework> = [];

  await Promise.all(
    PLATFORMS.map(
      async ([platform, files, defaultPackageManager, packageManagers, frameworkDefinitions]) => {
        const filesExist = await Promise.all(
          files.map((it) => pathExists(path.join(directory, it))),
        );
        if (files.length && !filesExist.some((it) => it)) return;
        const discoverFrameworks = (fallback = false) => {
          return async ([packageManager, possibleLockfiles]: (typeof packageManagers)[number]) => {
            const possibleLockfilesExist = await Promise.all(
              possibleLockfiles.map((it) => pathExists(path.join(directory, it))),
            );
            const [lockfile] = possibleLockfilesExist
              .map((exists, index) => (exists ? possibleLockfiles[index] : undefined))
              .filter((it) => !!it);
            if (!lockfile && !fallback) return false;

            let packages = new Map<string, string>();
            if (platform === "nodejs") {
              // TODO handle workspaces
              if (lockfile === "package-lock.json" || lockfile === "npm-shrinkwrap.json") {
                const packageJSON = await readJson(path.join(directory, lockfile));
                packages = new Map(
                  Object.keys(packageJSON.packages).map((pkg) => {
                    const name = pkg.replace(/^node_modules\//, "");
                    const version: string = packageJSON.packages[pkg].version;
                    return [name, version];
                  }),
                );
              } else if (lockfile === "yarn.lock") {
                const file = await readFile(path.join(directory, lockfile));
                const yarnLock = YarnLockfile.parse(file.toString());
                if (yarnLock.type !== "success") throw new Error(`unable to read ${lockfile}`);
                packages = new Map(
                  Object.keys(yarnLock.object).map((pkg) => {
                    const parts = pkg.split("@");
                    const version = parts.pop()!;
                    return [parts.join("@"), version];
                  }),
                );
              } else if (lockfile === "pnpm-lock.yaml") {
                const file = await readFile(path.join(directory, lockfile));
                const pnpmLock = parseYaml(file.toString());
                packages = new Map(
                  Object.keys(pnpmLock.packages).map((pkg) => {
                    const parts = pkg.replace(/^\//, "").split("(")[0].split("@");
                    const version = parts.pop()!;
                    return [parts.join("@"), version];
                  }),
                );
              }
            } else if (platform === "python") {
              if (packageManager === "pip") {
                const requirementsFile = "requirements.txt";
                const requirementsFileExists = await pathExists(
                  path.join(directory, requirementsFile),
                );
                if (!requirementsFileExists) return false;
                const file = await readFile(path.join(directory, requirementsFile));
                packages = new Map(
                  file
                    .toString()
                    .split("\n")
                    .map((it) => {
                      return [it.trim().replace("-", "_").toLowerCase(), "*"];
                    }),
                );
              } else if (lockfile === "Pipfile.lock") {
                const pipfileLock = await readJson(path.join(directory, lockfile));
                // TODO include develop too?
                packages = new Map(
                  Object.keys(pipfileLock.default).map((name) => {
                    // TODO convert to Node semver?
                    const version = pipfileLock.default[name].version.split("==")[1];
                    return [name, version];
                  }),
                );
              } else if (lockfile === "poetry.lock") {
                const poetryLock = await readFile(path.join(directory, lockfile));
                packages = new Map(
                  toml
                    .parse(poetryLock.toString())
                    .package?.map((it: { name: string; version: string }) => [it.name, it.version]),
                );
              }
            }

            for (const [framework, requiredPackages, requiredFiles = []] of frameworkDefinitions) {
              const requiredPackagePresent = requiredPackages.some((it) => packages.has(it));
              if (!requiredPackagePresent) continue;
              const requiredFileExist =
                requiredFiles.length === 0 ||
                (
                  await Promise.all(requiredFiles.map((it) => pathExists(path.join(directory, it))))
                ).some((it) => it);
              if (!requiredFileExist) continue;
              const [packageName] = requiredPackages;
              if (packageName)
                discoveredFrameworks.push({
                  framework,
                  version: packages.get(packageName)!,
                  packageManager,
                  platform,
                });
            }

            return !!lockfile;
          };
        };
        const packageManagerResults = await Promise.all(
          packageManagers.map(discoverFrameworks(false)),
        );
        if (!packageManagerResults.some((it) => it)) {
          const fallback = packageManagers.find(([id]) => id === defaultPackageManager);
          if (fallback) await discoverFrameworks(true)(fallback);
        }
      },
    ),
  );

  for (const { framework, platform } of discoveredFrameworks) {
    const [, , , , defitions] = PLATFORMS.find(([id]) => id === platform)!;
    const [, , , bundles] = defitions.find(([id]) => id === framework)!;
    for (const bundle of bundles) {
      const discovery = discoveredFrameworks.find(({ framework }) => framework === bundle);
      if (discovery) {
        discovery.bundledWith ||= [];
        discovery.bundledWith.push(framework);
      }
    }
  }

  return discoveredFrameworks;
}
