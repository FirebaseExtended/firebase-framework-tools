import fsExtra from "fs-extra";
import YarnLockfile from "@yarnpkg/lockfile";
import { parse as parseYaml } from "yaml";
import * as toml from "toml";
import { relative } from "node:path";

export const PLATFORMS = [
  // [id, files[], defaultPackageManger, packageManagers[], frameworks[]]
  [
    "dart",
    ["pubspec.yaml"],
    "pub",
    [
      // [id, lockfiles[]]
      ["pub", ["pubspec.lock"]],
    ],
    // [id, deps[], files[], bundles[], isStatic?]
    [["flutter", ["flutter"], [], [], () => true]]
  ],
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
      // [id, deps[], files[], bundles[], isStatic?]
      ["nextjs", ["next"], [], ["react"], () => false],
      ["angular", ["@angular/core"], ["angular.json"], ["vite"], () => false],
      [
        "astro",
        ["astro"],
        ["astro.config.js", "astro.config.mjs", "astro.config.cjs", "astro.config.ts"],
        ["lit", "react", "preact", "svelte", "vue", "vite"],
        () => false
      ],
      ["nuxt", ["nuxt"], ["nuxt.config.js"], ["vue"], () => false],
      ["lit", ["lit", "lit-element"], [], [], () => true],
      ["vue", ["vue"], [], [], () => true],
      ["vite", ["vite"], [], ["vue", "react", "preact", "lit", "svelte"], () => true],
      ["preact", ["preact"], [], [], () => true],
      ["react", ["react", "react-dom"], [], [], () => true],
      ["svelte", ["svelte"], [], [], () => true],
      ["sveltekit", ["@sveltejs/kit"], [], ["svelte", "vite"], () => false],
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
      // [id, deps[], files[], bundles[], isStatic?]
      ["flask", ["flask"], [], [], () => false],
      ["django", ["django"], [], [], () => false],
    ],
  ],
] as const;

type Commands = Array<[string, string[]]>;

type FRAMEWORK_ID = (typeof PLATFORMS)[number][4][number][0];
type PACKAGE_MANAGER_ID = (typeof PLATFORMS)[number][3][number][0];
type PLATFORM_ID = (typeof PLATFORMS)[number][0];

type DiscoveredFramework = {
  root_directory: string;
  id: FRAMEWORK_ID;
  version?: string;
  single_page_app: boolean;
  dist_directory: string;
  packageManager: {
    id: PACKAGE_MANAGER_ID;
    version?: string;
    metadata: Record<string, any>;
  }
  monorepo_tooling?: Record<string, any>;
  platform: {
    id: PLATFORM_ID;
    version: string;
  }
  bundledWith?: Array<FRAMEWORK_ID>;
  commands: {
    install: Commands;
    build: Commands;
    dev: Commands;
    serve?: Commands;
  }
  known_adapters?: Partial<Record<TARGET_PLATFORM, {
    id: string;
    channel: "community" | "experimental" | "official";
  }>>;
};

type TARGET_PLATFORM = "firebase";

const KNOWN_ADAPTERS: Partial<Record<PLATFORM_ID, undefined | Partial<Record<FRAMEWORK_ID, Partial<Record<TARGET_PLATFORM, { id: string; channel: "community" | "experimental" | "official" }>>>>>> = {
  "nodejs": {
    "nextjs": { "firebase": { id: "@apphosting/adapter-nextjs", channel: "official" }},
    "angular": { "firebase": { id: "@apphosting/adapter-angular", channel: "official" }},
    "astro": { "firebase": { id: "@apphosting/adapter-astro", channel: "experimental" }},
  },
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
            } else if (platform === "dart") {
              if (lockfile === "pubspec.lock") {
                const pubspec = await readFile(path.join(directory, lockfile));
                const pubspecContent = parseYaml(pubspec.toString());
                packages = new Map(
                  Object.entries(pubspecContent.sdks || {}).map(([name, version]) => [
                    name,
                    version as string,
                  ]),
                );
              } else {

              }
            }

            for (const [framework, requiredPackages, requiredFiles, _, getIsStatic] of frameworkDefinitions) {
              const requiredPackagePresent = requiredPackages.some((it) => packages.has(it));
              if (!requiredPackagePresent) continue;
              const requiredFileExist =
                requiredFiles.length === 0 ||
                (
                  await Promise.all(requiredFiles.map((it) => pathExists(path.join(directory, it))))
                ).some((it) => it);
              if (!requiredFileExist) continue;
              const [packageName] = requiredPackages;
              if (packageName) {
                let root_directory = ".";
                let monorepoTooling = undefined;
                const known_adapters = KNOWN_ADAPTERS[platform]?.[framework] || undefined
                if (framework === "angular") {
                  const angularJSONPath = path.join(directory, "angular.json");
                  const angularJSONExists = await pathExists(angularJSONPath);
                  if (angularJSONExists) {
                    const angularJSON = await readJson(angularJSONPath);
                    for (const target of Object.keys(angularJSON.projects)) {
                      const project = angularJSON.projects[target];
                      if (project.projectType !== "application") continue;
                      if (!project.architect?.build) continue;
                      const root_directory = project.root || ".";
                      monorepoTooling = {
                        id: "angular/cli",
                        target: target,
                        version: packages.get(packageName),
                        root_directory: ".", // TODO: detect root directory of monorepo
                      };
                      // TODO should we look at outputMode?
                      const isStatic = !project.architect?.build?.options?.ssr;
                      const dist_directory = `${project.architect.build.options?.outputPath || `dist/${target}`}${isStatic && project.architect.build.builder.endsWith(":application") ? "/browser" : ""}`;
                      discoveredFrameworks.push({
                        root_directory,
                        id: framework,
                        version: packages.get(packageName),
                        single_page_app: isStatic,
                        dist_directory,
                        monorepo_tooling: monorepoTooling,
                        packageManager: {
                          id: packageManager,
                          version: "0.0.0", // TODO: get version of package manager
                          metadata: {
                            lockfile,
                            corepack: false, // TODO: detect if corepack is used
                            workspace: false, // TODO: detect if this is a workspace
                            root_directory: undefined, // TODO: add workspace root if this is a workspace
                          },
                        },
                        platform: {
                          id: platform,
                          version: "0.0.0", // TODO: get version of platform
                        },
                        commands: {
                          install: [["npm", ["ci", "--include=dev"]]],
                          build: [["npm", ["run", "build"]]],
                          dev: [["npm", ["start"]]],
                          serve: isStatic ? undefined : [["node", ["./server/server.mjs"]]],
                        },
                        known_adapters,
                      });
                    }
                  }
                } else {
                  const isStatic = await Promise.resolve(getIsStatic());
                  discoveredFrameworks.push({
                    root_directory: ".",
                    id: framework,
                    version: packages.get(packageName),
                    single_page_app: isStatic,
                    dist_directory: "dist", // TODO: detect dist directory
                    monorepo_tooling: monorepoTooling,
                    packageManager: {
                      id: packageManager,
                      version: "0.0.0", // TODO: get version of package manager
                      metadata: {
                        lockfile,
                        corepack: false, // TODO: detect if corepack is used
                        workspace: false, // TODO: detect if this is a workspace
                        root_directory: undefined, // TODO: add workspace root if this is a workspace
                      },
                    },
                    platform: {
                      id: platform,
                      version: "0.0.0", // TODO: get version of platform
                    },
                    commands: {
                      install: [["npm", ["ci", "--include=dev"]]],
                      build: [["npm", ["run", "build"]]],
                      dev: [["npm", ["run", "dev"]]],
                      serve: [["npm", ["start"]]],
                    },
                    known_adapters,
                  });
                }
              }
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

  for (const framework of discoveredFrameworks) {
    const [, , , , defitions] = PLATFORMS.find(([id]) => id === framework.platform.id)!;
    const [, , , bundles] = defitions.find(([id]) => id === framework.id)!;
    for (const bundle of bundles) {
      const discovery = discoveredFrameworks.find(framework => framework.id === bundle);
      if (discovery) {
        discovery.bundledWith ||= [];
        discovery.bundledWith.push(framework.id);
      }
    }
  }

  return discoveredFrameworks;
}
