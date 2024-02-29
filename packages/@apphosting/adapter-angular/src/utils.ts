import fsExtra from "fs-extra";
import logger from "firebase-functions/logger";

import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { resolve, normalize, relative, dirname, join } from "path";
import { stringify as yamlStringify } from "yaml";
import {
  OutputBundleOptions,
  OutputPaths,
  buildManifestSchema,
  ValidManifest,
} from "./interface.js";

// fs-extra is CJS, readJson can't be imported using shorthand
export const { writeFile, move, readJson, mkdir, copyFile } = fsExtra;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SIMPLE_SERVER_FILE_PATH = join(__dirname, "simple-server", "bundled_server.mjs");

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
export function populateOutputBundleOptions(outputPaths: OutputPaths): OutputBundleOptions {
  const outputBundleDir = resolve(".apphosting");

  const baseDirectory = fileURLToPath(outputPaths["root"]);
  const browserRelativePath = relative(baseDirectory, fileURLToPath(outputPaths["browser"]));
  let serverRelativePath = "server";
  let needsServerGenerated = true;
  if (outputPaths["server"]) {
    serverRelativePath = relative(baseDirectory, fileURLToPath(outputPaths["server"]));
    needsServerGenerated = false;
  }

  return {
    bundleYamlPath: resolve(outputBundleDir, "bundle.yaml"),
    outputDirectory: outputBundleDir,
    baseDirectory,
    outputBaseDirectory: resolve(outputBundleDir, "dist"),
    serverFilePath: resolve(outputBundleDir, "dist", serverRelativePath, "server.mjs"),
    browserDirectory: resolve(outputBundleDir, "dist", browserRelativePath),
    needsServerGenerated,
  };
}

// Run build command
export const build = (cwd = process.cwd()) =>
  new Promise<OutputBundleOptions>((resolve, reject) => {
    // enable JSON build logs for application builder
    process.env.NG_BUILD_LOGS_JSON = "1";
    const childProcess = spawn("npm", ["run", "build"], {
      cwd,
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let outputBundleOptions = {} as OutputBundleOptions;
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
            outputBundleOptions = populateOutputBundleOptions(manifest["outputPaths"]);
          }
        } catch (error) {
          throw new Error("Build manifest is not of expected structure: " + error);
        }
      });
    } else {
      throw new Error("Unable to locate build manifest with output paths.");
    }

    childProcess.on("exit", (code) => {
      if (code === 0) return resolve(outputBundleOptions);
      reject();
    });
  });

/* 
Move the base output directory, which contains the server and browser bundle directory, and prerendered routes
as well as generating bundle.yaml.
 */
export async function generateOutputDirectory(
  cwd: string,
  outputBundleOptions: OutputBundleOptions,
): Promise<void> {
  await move(outputBundleOptions.baseDirectory, outputBundleOptions.outputBaseDirectory, {
    overwrite: true,
  });
  if (outputBundleOptions.needsServerGenerated) {
    await generateServer(outputBundleOptions);
  }
  await generateBundleYaml(outputBundleOptions, cwd);
}

// Generate bundle.yaml
async function generateBundleYaml(
  outputBundleOptions: OutputBundleOptions,
  cwd: string,
): Promise<void> {
  await writeFile(
    outputBundleOptions.bundleYamlPath,
    yamlStringify({
      headers: [],
      redirects: [],
      rewrites: [],
      runCommand: `node ${normalize(relative(cwd, outputBundleOptions.serverFilePath))}`,
      neededDirs: [normalize(relative(cwd, outputBundleOptions.outputDirectory))],
      staticAssets: [normalize(relative(cwd, outputBundleOptions.browserDirectory))],
    }),
  );
}

// Generate server file for CSR apps
async function generateServer(outputBundleOptions: OutputBundleOptions): Promise<void> {
  await mkdir(dirname(outputBundleOptions.serverFilePath));
  await copyFile(SIMPLE_SERVER_FILE_PATH, outputBundleOptions.serverFilePath);
}

// Validate output directory includes all necessary parts
export async function validateOutputDirectory(
  outputBundleOptions: OutputBundleOptions,
): Promise<void> {
  if (
    !(await fsExtra.exists(outputBundleOptions.outputDirectory)) ||
    !(await fsExtra.exists(outputBundleOptions.browserDirectory)) ||
    !(await fsExtra.exists(outputBundleOptions.serverFilePath))
  ) {
    throw new Error("Output directory is not of expected structure");
  }
}

export const isMain = (meta: ImportMeta) => {
  if (!meta) return false;
  if (!process.argv[1]) return false;
  return process.argv[1] === fileURLToPath(meta.url);
};
