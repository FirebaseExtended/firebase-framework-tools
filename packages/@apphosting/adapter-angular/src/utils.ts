import fsExtra from "fs-extra";
import logger from "firebase-functions/logger";

import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { resolve, normalize, relative } from "path";
import { stringify as yamlStringify } from "yaml";
import { OutputPathOptions, OutputPaths, buildManifestSchema, ValidManifest } from "./interface.js";

// fs-extra is CJS, readJson can't be imported using shorthand
export const { writeFile, move, readJson } = fsExtra;

/*
 Check if build conditions are satisfied for the workspace:
 The workspace cannot contain multiple angular projects.
 The angular project must be using application builder.
*/
export async function checkBuildConditions(cwd: string): Promise<void> {
  // dynamically load Angular so this can be used in an NPX context
  const { NodeJsAsyncHost }: typeof import("@angular-devkit/core/node") = await import(
    `${cwd}/node_modules/@angular-devkit/core/node/index.js`
  );
  const { workspaces }: typeof import("@angular-devkit/core") = await import(
    `${cwd}/node_modules/@angular-devkit/core/src/index.js`
  );

  const host = workspaces.createWorkspaceHost(new NodeJsAsyncHost());
  const { workspace } = await workspaces.readWorkspace(cwd, host);

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

  const { builder } = workspaceProject.targets.get(target)!;
  if (builder !== "@angular-devkit/build-angular:application") {
    throw new Error("Only the Angular application builder is supported.");
  }
}

// Populate file or directory paths we need for generating output directory
export function populateOutputBundleOptions(outputPaths: OutputPaths): OutputPathOptions {
  const outputBundleDir = resolve(".apphosting");

  const baseDirectory = fileURLToPath(outputPaths["root"]);
  const browserRelativePath = relative(baseDirectory, fileURLToPath(outputPaths["browser"]));
  let serverRelativePath = "server";
  if (outputPaths["server"]) {
    serverRelativePath = relative(baseDirectory, fileURLToPath(outputPaths["server"]));
  }

  return {
    bundleYamlPath: resolve(outputBundleDir, "bundle.yaml"),
    outputDirectory: outputBundleDir,
    baseDirectory,
    outputBaseDirectory: resolve(outputBundleDir, "dist"),
    serverFilePath: resolve(outputBundleDir, "dist", serverRelativePath, "server.mjs"),
    browserDirectory: resolve(outputBundleDir, "dist", browserRelativePath),
  };
}

// Run build command
export const build = (cwd = process.cwd()) =>
  new Promise<OutputPathOptions>((resolve, reject) => {
    // enable JSON build logs for application builder
    process.env.NG_BUILD_LOGS_JSON = "1";
    const childProcess = spawn("npm", ["run", "build"], {
      cwd,
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let outputPathOptions = {} as OutputPathOptions;
    let manifest = {} as ValidManifest;

    if (childProcess.stdout) {
      childProcess.stdout.on("data", (data) => {
        try {
          if (data.toString().includes("outputPaths")) {
            const parsedManifest = JSON.parse(data);
            // validate if the manifest is of the expected form
            manifest = buildManifestSchema.parse(parsedManifest);
            if (manifest["errors"].length > 0) {
              // errors when extracting manifest
              manifest.errors.forEach((error) => {
                logger.error(error);
              });
            }
            if (manifest["warnings"].length > 0) {
              // warnings when extracting manifest
              manifest.warnings.forEach((warning) => {
                logger.info(warning);
              });
            }
            outputPathOptions = populateOutputBundleOptions(manifest["outputPaths"]);
          }
        } catch (error) {
          throw new Error("Build manifest is not of expected structure: " + error);
        }
      });
    } else {
      throw new Error("Unable to locate build manifest with output paths.");
    }

    childProcess.on("exit", (code) => {
      if (code === 0) return resolve(outputPathOptions);
      reject();
    });
  });

/* 
Move the base output directory, which contains the server and browser bundle directory, and prerendered routes
as well as generating bundle.yaml.
 */
export async function generateOutputDirectory(
  cwd: string,
  outputPathOptions: OutputPathOptions,
): Promise<void> {
  await move(outputPathOptions.baseDirectory, outputPathOptions.outputBaseDirectory, {
    overwrite: true,
  });
  await generateBundleYaml(outputPathOptions, cwd);
}

// Generate bundle.yaml
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
