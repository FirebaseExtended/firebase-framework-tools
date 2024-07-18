import fsExtra from "fs-extra";
import logger from "firebase-functions/logger";

import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { resolve, normalize, relative, dirname, join } from "path";
import { stringify as yamlStringify } from "yaml";
import {
  EnvironmentVariable,
  OutputBundleOptions,
  OutputPaths,
  buildManifestSchema,
  ValidManifest,
} from "./interface.js";
import { createRequire } from "node:module";
import stripAnsi from "strip-ansi";
import { BuildOptions } from "@apphosting/common";

// fs-extra is CJS, readJson can't be imported using shorthand
export const { writeFile, move, readJson, mkdir, copyFile } = fsExtra;

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SIMPLE_SERVER_FILE_PATH = join(__dirname, "simple-server", "bundled_server.mjs");

export const REQUIRED_BUILDER = "@angular-devkit/build-angular:application";

/**
 * Check if the following build conditions are satisfied for the workspace:
 * - The workspace does not contain multiple angular projects.
 * - The angular project must be using the application builder.
 */
export async function checkBuildConditions(opts: BuildOptions): Promise<void> {
  // Nx uses a project.json file in lieu of an angular.json file, so if the app is in an Nx workspace,
  // we check if Nx's project.json configures the build to use the Angular application builder.
  if (opts.buildCommand === "nx") {
    const output = execSync(`npx nx show project ${opts.projectName}`);
    const projectJson = JSON.parse(output.toString());
    const builder = projectJson.targets.build.executor;
    if (builder !== REQUIRED_BUILDER) {
      throw new Error(
        "Only the Angular application builder is supported. Please refer to https://angular.dev/tools/cli/build-system-migration#for-existing-applications guide to upgrade your builder to the Angular application builder. ",
      );
    }
    return;
  }

  // dynamically load Angular so this can be used in an NPX context
  const angularCorePath = require.resolve("@angular/core", { paths: [process.cwd()] });
  const { NodeJsAsyncHost }: typeof import("@angular-devkit/core/node") = await import(
    require.resolve("@angular-devkit/core/node", {
      paths: [process.cwd(), angularCorePath],
    })
  );
  const { workspaces }: typeof import("@angular-devkit/core") = await import(
    require.resolve("@angular-devkit/core", {
      paths: [process.cwd(), angularCorePath],
    })
  );
  const host = workspaces.createWorkspaceHost(new NodeJsAsyncHost());
  const { workspace } = await workspaces.readWorkspace(opts.projectDirectory, host);

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
  if (builder !== REQUIRED_BUILDER) {
    throw new Error(
      "Only the Angular application builder is supported. Please refer to https://angular.dev/tools/cli/build-system-migration#for-existing-applications guide to upgrade your builder to the Angular application builder. ",
    );
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

export function parseOutputBundleOptions(buildOutput: string): OutputBundleOptions {
  const strippedManifest = extractManifestOutput(buildOutput);
  const parsedManifest = JSON.parse(strippedManifest) as string;
  const manifest = buildManifestSchema.parse(parsedManifest);
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
  return populateOutputBundleOptions(manifest["outputPaths"]);
}

/**
 * Extracts the build manifest from the build command's console output.
 * N.B. Unfortunately, there is currently no consistent way to suppress extraneous default output from the task
 * runners of monorepo tools such as Nx (i.e. using the --silent flag for npm scripts). As a result, we must
 * temporarily resort to "cleaning" the output of executing the Angular application builder in a monorepo's tooling
 * context, in order to extract the build manifest. This method is a potentially flaky stopgap until we can find a
 * more consistent and resilient strategy for reading the output.
 */
function extractManifestOutput(output: string): string {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end === -1 || start > end) {
    throw new Error(`Failed to find valid JSON object from build output: ${output}`);
  }
  return stripAnsi(output.substring(start, end + 1));
}

/**
 * Move the base output directory, which contains the server and browser bundle directory, and prerendered routes
 * as well as generating bundle.yaml.
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


// add environment variable to bundle.yaml if needed for specific versions
function addBundleYamlEnvVar(): EnvironmentVariable[] {
  const runtimeEnvVars: EnvironmentVariable[] = [];
  const ssrPortEnvVar: EnvironmentVariable = {
    variable: "SSR_PORT",
    value: "8080",
    availability: ["RUNTIME"],
  };

  if (process.env.ANGULAR_VERSION === "17.3.2") {
    runtimeEnvVars.push(ssrPortEnvVar);
  }
  return runtimeEnvVars;
}

// Generate bundle.yaml
async function generateBundleYaml(
  outputBundleOptions: OutputBundleOptions,
  cwd: string,
): Promise<void> {
  let runtimeEnvVars = addBundleYamlEnvVar();
  await writeFile(
    outputBundleOptions.bundleYamlPath,
    yamlStringify({
      runCommand: `node ${normalize(relative(cwd, outputBundleOptions.serverFilePath))}`,
      neededDirs: [normalize(relative(cwd, outputBundleOptions.outputDirectory))],
      staticAssets: [normalize(relative(cwd, outputBundleOptions.browserDirectory))],
      env: runtimeEnvVars,
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
    !(await fsExtra.exists(outputBundleOptions.serverFilePath)) ||
    !(await fsExtra.exists(outputBundleOptions.bundleYamlPath))
  ) {
    throw new Error("Output directory is not of expected structure");
  }
}

export const isMain = (meta: ImportMeta) => {
  if (!meta) return false;
  if (!process.argv[1]) return false;
  return process.argv[1] === fileURLToPath(meta.url);
};
