import fsExtra from "fs-extra";
import { fileURLToPath } from "url";
import type { ApplicationBuilderOptions } from "@angular-devkit/build-angular";
import { spawn } from "child_process";
import { resolve, normalize, relative } from "path";
import { stringify as yamlStringify } from "yaml";
import { OutputPathOptions } from "./interface.js";

// fs-extra is CJS, readJson can't be imported using shorthand
export const { writeFile, move, readJson } = fsExtra;

export type { ApplicationBuilderOptions };

export async function loadConfig(cwd: string): Promise<ApplicationBuilderOptions> {
  // dynamically load NextJS so this can be used in an NPX context
  const { NodeJsAsyncHost }: typeof import("@angular-devkit/core/node") = await import(
    `${cwd}/node_modules/@angular-devkit/core/node/index.js`
  );
  const { workspaces }: typeof import("@angular-devkit/core") = await import(
    `${cwd}/node_modules/@angular-devkit/core/src/index.js`
  );
  const { WorkspaceNodeModulesArchitectHost }: typeof import("@angular-devkit/architect/node") =
    await import(`${cwd}/node_modules/@angular-devkit/architect/node/index.js`);

  const host = workspaces.createWorkspaceHost(new NodeJsAsyncHost());
  const { workspace } = await workspaces.readWorkspace(cwd, host);
  const architectHost = new WorkspaceNodeModulesArchitectHost(workspace, cwd);

  const apps: string[] = [];
  workspace.projects.forEach((value, key) => {
    if (value.extensions.projectType === "application") apps.push(key);
  });
  const project = apps[0];
  if (apps.length > 1 || !project) throw new Error("Unable to determine the application to deploy");

  const workspaceProject = workspace.projects.get(project);
  if (!workspaceProject) throw new Error(`No project ${project} found.`);

  const target = "build";
  if (!workspaceProject.targets.has(target)) throw new Error("Could not find build target.");

  const { builder, defaultConfiguration: configuration = "production" } =
    workspaceProject.targets.get(target)!;
  if (builder !== "@angular-devkit/build-angular:application") {
    throw new Error("Only the Angular application builder is supported.");
  }

  const buildTarget = {
    project,
    target,
    configuration,
  };

  const options = await architectHost.getOptionsForTarget(buildTarget);
  if (!options) throw new Error("Not able to find options for build target.");

  // options has to be of type ApplicationBuilderOptions when the builder is an application builder
  const applicationBuilderOptions: ApplicationBuilderOptions = Object.assign(
    {} as ApplicationBuilderOptions,
    options,
  );

  return applicationBuilderOptions;
}

// populate file/directory paths we need inside app hosting output directory
export function populateOutputBundleOptions(config: ApplicationBuilderOptions): OutputPathOptions {
  const outputPath = config.outputPath;
  // normalized output path structure
  const normalizedOutputPath = {
    browser: "browser",
    server: "server",
    media: "media",
    ...(typeof outputPath === "string" ? undefined : outputPath),
    base: normalize(resolve(typeof outputPath === "string" ? outputPath : outputPath.base)),
  };
  const outputBundleDir = resolve(".apphosting");

  return {
    bundleYamlPath: resolve(outputBundleDir, "bundle.yaml"),
    outputDirectory: outputBundleDir,
    baseDirectory: resolve(normalizedOutputPath.base),
    outputBaseDirectory: resolve(outputBundleDir, "dist"),
    serverFilePath: resolve(outputBundleDir, "dist", normalizedOutputPath.server, "server.mjs"),
    browserDirectory: resolve(outputBundleDir, "dist", normalizedOutputPath.browser),
  };
}

// Run build command
export const build = (cwd = process.cwd()) =>
  new Promise<void>((resolve, reject) => {
    const process = spawn("npm", ["run", "build"], { cwd, shell: true, stdio: "inherit" });
    process.on("exit", (code) => {
      if (code === 0) return resolve();
      reject();
    });
  });

// move the base output directory, which contains the server and browser bundle directory, and prerendered routes
// as well as generating bundle.yaml
export async function generateOutputDirectory(
  cwd: string,
  outputPathOptions: OutputPathOptions,
): Promise<void> {
  await Promise.all([
    move(outputPathOptions.baseDirectory, outputPathOptions.outputBaseDirectory, {
      overwrite: true,
    }),
    generateBundleYaml(outputPathOptions, cwd),
  ]);
}

// generate bundle.yaml
export async function generateBundleYaml(
  outputPathOptions: OutputPathOptions,
  cwd: string,
): Promise<void> {
  await writeFile(
    outputPathOptions.bundleYamlPath,
    yamlStringify({
      headers: [],
      redirects: [],
      rewrites: [],
      runCommand: `node ${normalize(relative(cwd, outputPathOptions.serverFilePath))}`,
      neededDirs: [normalize(relative(cwd, outputPathOptions.outputDirectory))],
      staticAssets: [normalize(relative(cwd, outputPathOptions.browserDirectory))],
    }),
  );
}

export const isMain = (meta: ImportMeta) => {
  if (!meta) return false;
  if (!process.argv[1]) return false;
  return process.argv[1] === fileURLToPath(meta.url);
};
