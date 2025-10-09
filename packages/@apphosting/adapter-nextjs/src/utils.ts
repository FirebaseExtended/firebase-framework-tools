import fsExtra from "fs-extra";
import { join, dirname, relative, normalize } from "path";
import { stringify as yamlStringify } from "yaml";

import {
  OutputBundleOptions,
  AdapterMetadata,
} from "./interfaces.js";
import { OutputBundleConfig, updateOrCreateGitignore } from "@apphosting/common";
import { fileURLToPath } from "url";

// fs-extra is CJS, readJson can't be imported using shorthand
export const { copy, exists, writeFile, readJson, readdir, readFileSync, existsSync, ensureDir } =
  fsExtra;

export const isMain = (meta: ImportMeta): boolean => {
  if (!meta) return false;
  if (!process.argv[1]) return false;
  return process.argv[1] === fileURLToPath(meta.url);
};

/**
 * Provides the paths in the output bundle for the built artifacts.
 * @param rootDir The root directory of the uploaded source code.
 * @param appDir The path to the application source code, relative to the root.
 * @return The output bundle paths.
 */
export function populateOutputBundleOptions(
  rootDir: string,
  appDir: string,
  nextBuildDirectory: string,
): OutputBundleOptions {
  const outputBundleDir = join(rootDir, ".apphosting");
  const standaloneDirectory = join(nextBuildDirectory, "standalone");
  // In monorepo setups, the standalone directory structure will mirror the structure of the monorepo.
  // We find the relative path from the root to the app directory to correctly locate server.js.
  const standaloneAppPath = join(
    standaloneDirectory,
    process.env.MONOREPO_COMMAND ? relative(rootDir, appDir) : "",
  );
  return {
    bundleYamlPath: join(outputBundleDir, "bundle.yaml"),
    outputDirectoryBasePath: outputBundleDir,
    outputDirectoryAppPath: standaloneAppPath,
    serverFilePath: join(standaloneAppPath, "server.js"),
    outputPublicDirectoryPath: join(standaloneAppPath, "public"),
    outputStaticDirectoryPath: join(standaloneAppPath, ".next", "static"),
  };
}

/**
 * Copy static assets and other resources into the standlone directory, also generates the bundle.yaml
 * @param rootDir The root directory of the uploaded source code.
 * @param outputBundleOptions The target location of built artifacts in the output bundle.
 * @param nextBuildDirectory The location of the .next directory.
 */
export async function generateBuildOutput(
  rootDir: string,
  appDir: string,
  opts: OutputBundleOptions,
  nextBuildDirectory: string,
  nextVersion: string,
  adapterMetadata: AdapterMetadata,
): Promise<void> {
  const staticDirectory = join(nextBuildDirectory, "static");
  await Promise.all([
    copy(staticDirectory, opts.outputStaticDirectoryPath, { overwrite: true }),
    copyResources(appDir, opts.outputDirectoryAppPath, opts.bundleYamlPath),
    generateBundleYaml(opts, rootDir, nextVersion, adapterMetadata),
  ]);
  // generateBundleYaml creates the output directory (if it does not already exist).
  // We need to make sure it is gitignored.
  const normalizedBundleDir = normalize(relative(rootDir, opts.outputDirectoryBasePath));
  updateOrCreateGitignore(rootDir, [`/${normalizedBundleDir}/`]);
  return;
}

// Copy all files and directories to apphosting output directory.
// Files are skipped if there is already a file with the same name in the output directory
async function copyResources(
  appDir: string,
  outputBundleAppDir: string,
  bundleYamlPath: string,
): Promise<void> {
  const appDirExists = await exists(appDir);
  if (!appDirExists) return;
  const pathsToCopy = await readdir(appDir);
  for (const path of pathsToCopy) {
    const isbundleYamlDir = join(appDir, path) === dirname(bundleYamlPath);
    const existsInOutputBundle = await exists(join(outputBundleAppDir, path));
    // Keep apphosting.yaml files in the root directory still, as later steps expect them to be there
    const isApphostingYaml = path === "apphosting_preprocessed" || path === "apphosting.yaml";
    if (!isbundleYamlDir && !existsInOutputBundle && !isApphostingYaml) {
      await copy(join(appDir, path), join(outputBundleAppDir, path));
    }
  }
  return;
}

export function getAdapterMetadata(): AdapterMetadata {
  const packageJsonPath = `${__dirname}/../package.json`;
  if (!existsSync(packageJsonPath)) {
    throw new Error(`Next.js adapter package.json file does not exist at ${packageJsonPath}`);
  }
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

  return {
    adapterPackageName: packageJson.name,
    adapterVersion: packageJson.version,
  };
}

// generate bundle.yaml
async function generateBundleYaml(
  opts: OutputBundleOptions,
  cwd: string,
  nextVersion: string,
  adapterMetadata: AdapterMetadata,
): Promise<void> {
  await ensureDir(opts.outputDirectoryBasePath);
  const outputBundle: OutputBundleConfig = {
    version: "v1",
    runConfig: {
      runCommand: `node ${normalize(relative(cwd, opts.serverFilePath))}`,
    },
    metadata: {
      ...adapterMetadata,
      framework: "nextjs",
      frameworkVersion: nextVersion,
    },
  };
  // TODO (b/432285470) See if there is a way to also delete files for apps using Nx monorepos
  if (!process.env.MONOREPO_COMMAND) {
    outputBundle.outputFiles = {
      serverApp: {
        include: [normalize(relative(cwd, opts.outputDirectoryAppPath))],
      },
    };
  }

  await writeFile(opts.bundleYamlPath, yamlStringify(outputBundle));
  return;
}

// Validate output directory includes all necessary parts
export async function validateOutputDirectory(
  opts: OutputBundleOptions,
  nextBuildDirectory: string,
): Promise<void> {
  const standaloneDirectory = join(nextBuildDirectory, "standalone");
  if (
    !(await fsExtra.exists(nextBuildDirectory)) ||
    !(await fsExtra.exists(standaloneDirectory)) ||
    !(await fsExtra.exists(opts.bundleYamlPath))
  ) {
    throw new Error("Output directory is not of expected structure");
  }
}
