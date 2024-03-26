import fsExtra from "fs-extra";
import logger from "firebase-functions/logger";

import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { resolve, normalize, relative } from "path";
import { stringify as yamlStringify } from "yaml";
import { OutputPathOptions, OutputPaths, buildManifestSchema, ValidManifest } from "./interface.js";
import stripAnsi from "strip-ansi";

// fs-extra is CJS, readJson can't be imported using shorthand
export const { writeFile, move, readJson } = fsExtra;

export const DEFAULT_COMMAND = "npm";
export const REQUIRED_BUILDER = "@angular-devkit/build-angular:application";

/**
 * Check if the following build conditions are satisfied for the workspace:
 * - The workspace does not contain multiple angular projects.
 * - The angular project must be using the application builder.
 */
export async function checkStandaloneBuildConditions(cwd: string): Promise<void> {
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
  if (builder !== REQUIRED_BUILDER) {
    throw new Error("Only the Angular application builder is supported.");
  }
}

/**
 * Check if the monorepo build system is using the Angular application builder.
 */
export function checkMonorepoBuildConditions(builder: string): void {
  if (builder !== REQUIRED_BUILDER) {
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
export const build = (
  projectRoot = process.cwd(),
  cmd = DEFAULT_COMMAND,
): Promise<OutputPathOptions> =>
  new Promise((resolve, reject) => {
    // enable JSON build logs for application builder
    process.env.NG_BUILD_LOGS_JSON = "1";
    const childProcess = spawn(cmd, ["run", "build"], {
      cwd: projectRoot,
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let buildOutput = "";
    let manifest = {} as ValidManifest;

    childProcess.stdout.on("data", (data: Buffer) => {
      buildOutput += data.toString();
    });

    childProcess.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with error code ${code}. Output: ${buildOutput}`));
      }
      if (!buildOutput) {
        reject(new Error("Unable to locate build manifest with output paths."));
      }
      try {
        const strippedManifest = extractManifestOutput(buildOutput);
        const parsedManifest = JSON.parse(strippedManifest) as string;
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
        resolve(populateOutputBundleOptions(manifest["outputPaths"]));
      } catch (error) {
        reject(new Error("Build manifest is not of expected structure: " + error));
      }
    });
  });

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
