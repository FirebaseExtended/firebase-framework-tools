#! /usr/bin/env node
import { program } from "commander";
import fsExtra from "fs-extra";
import YarnLockfile from '@yarnpkg/lockfile';
import { parse as parseYaml } from "yaml";
import { performance } from "node:perf_hooks";

const PLATFORMS = [
  ['nodejs', [
    // TODO support npm-shrinkwrap.json
    ['npm', ['package-lock.json']],
    ['yarn', ['yarn.lock']],
    ['pnpm', ['pnpm-lock.yaml']],
  ], [
    ["nextjs", { requiredPackages: ["next"], requiredFiles: [], bundles: ["react"] }],
    ["angular", { requiredPackages: ["@angular/core"], requiredFiles: ["angular.json"], bundles: ["vite"] }],
    // TODO support the other file extensions
    ["astro", { requiredPackages: ["astro"], requiredFiles: ["astro.config.js", "astro.config.mjs"], bundles: ["lit", "react", "preact", "svelte", "vue", "vite"] }],
    ["nuxt", { requiredPackages: ["nuxt"], requiredFiles: ["nuxt.config.js"], bundles: ["vue"] }],
    ["lit", { requiredPackages: ["lit", "lit-element"], requiredFiles: [], bundles: []}],
    ["vue",  { requiredPackages: ["vue"], requiredFiles: [], bundles: [] }],
    ["vite", { requiredPackages: ["vite"], requiredFiles: [], bundles: ["vue", "react", "preact", "lit", "svelte"] }],
    ["preact", { requiredPackages: ["preact"], requiredFiles: [], bundles: [] }],
    ["react", { requiredPackages: ["react", "react-dom"], requiredFiles: [], bundles: []}],
    ["svelte", { requiredPackages: ["svelte"], requiredFiles: [], bundles: [] }],
    ["sveltekit", { requiredPackages: ["@sveltejs/kit"], requiredFiles: [], bundles: ["svelte", "vite"] }]
  ]]
] as const;

program
  .option('--github-token <string>')
  .option('--github-repo <string>')
  .argument('<directory>', "path to the project's root directory")
  .action(async (path, { githubRepo, githubToken }: { githubRepo?: string, githubToken?: string }) => {
    if (githubRepo && !githubToken) throw new Error('needs token');

    const { join } = await (githubRepo ? import('node:path') : import('node:path/posix'));

    const { readFile, pathExists, readJson } = githubRepo ? {
      readFile: async function(path: string) {
        const response = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${path}`, {
          headers: { authorization: `Bearer ${githubToken}`, accept: "application/vnd.github.raw" },
        });
        if (!response.ok) throw new Error('fail.');
        return Buffer.from(await response.text());
      },
      pathExists: async function(path: string) {
        const response = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${path}`, {
          method: "HEAD",
          headers: { authorization: `Bearer ${githubToken}`, accept: "application/vnd.github.raw" },
        });
        return response.ok;
      },
      readJson: async function(path: string) {
        const response = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${path}`, {
          headers: { authorization: `Bearer ${githubToken}`, accept: "application/vnd.github.raw" },
        });
        if (!response.ok) throw new Error('fail.');
        return await response.json();
      },
    } : fsExtra;

    const discoveredFrameworks: Array<{ framework: string, version: string, packageManager: string, platform: string, bundledWith?: string[] }> = [];

    await Promise.all(PLATFORMS.map(async ([platform, packageManagerLockfiles, frameworkDefinitions]) => {
      await Promise.all(packageManagerLockfiles.map(async ([packageManager, possibleLockfiles]) => {
        const possibleLockfilesExist = await Promise.all(possibleLockfiles.map(it => pathExists(join(path, it))));
        const [lockfile] = possibleLockfilesExist.map((exists, index) => exists ? possibleLockfiles[index] : undefined).filter(it => !!it);
        if (!lockfile) return;
        let packages = new Map<string,string>();
        if (lockfile === "package-lock.json") {
          const packageJSON = await readJson(join(path, lockfile));
          packages = new Map(Object.keys(packageJSON.packages).map(pkg => {
            const name = pkg.replace(/^node_modules\//, "");
            const version: string = packageJSON.packages[pkg].version;
            return [name, version];
          }));
        } else if (lockfile === "yarn.lock") {
          const file = await readFile(join(path, lockfile));
          const yarnLock = YarnLockfile.parse(file.toString());
          if (yarnLock.type !== "success") throw new Error(`unable to read ${lockfile}`);
          packages = new Map(Object.keys(yarnLock.object).map(pkg => {
            const parts = pkg.split("@");
            const version = parts.pop()!;
            return [parts.join("@"), version];
          }));
        } else if (lockfile === "pnpm-lock.yaml") {
          const file = await readFile(join(path, lockfile));
          const pnpmLock = parseYaml(file.toString());
          packages = new Map(Object.keys(pnpmLock.packages).map(pkg => {
            const parts = pkg.replace(/^\//, "").split("(")[0].split("@");
            const version = parts.pop()!;
            return [parts.join("@"), version];
          }));
        }
  
        for (const [framework, { requiredPackages, requiredFiles=[] }] of frameworkDefinitions) {
          const requiredPackagePresent = requiredPackages.some(it => packages.has(it));
          if (!requiredPackagePresent) continue;
          const requiredFileExist = requiredFiles.length === 0 || (await Promise.all(requiredFiles.map(it => pathExists(join(path, it))))).some(it => it);
          if (!requiredFileExist) continue;
          const [packageName] = requiredPackages;
          if (packageName) discoveredFrameworks.push({framework, version: packages.get(packageName)!, packageManager, platform });
        };
      }));
    }));

    for (const { framework, platform } of discoveredFrameworks) {
      const definition = PLATFORMS.find(([id]) => id === platform)![2].find(([id]) => id === framework)![1];
      for (const frameworkToBundle of definition.bundles) {
        const discovery = discoveredFrameworks.find(({framework}) => framework === frameworkToBundle);
        if (discovery) {
          discovery.bundledWith ||= [];
          discovery.bundledWith.push(framework);
        }
      }
    }

    process.stdout.write(Buffer.from(JSON.stringify({ discovered: discoveredFrameworks }, undefined, 2)));
    console.log(`\nDone in ${performance.now()}ms`);
  });

program.parse();
