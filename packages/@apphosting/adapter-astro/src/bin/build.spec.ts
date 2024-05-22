const importUtils = import("@apphosting/adapter-astro/dist/utils.js");
import assert from "assert";
import { resolve, join } from "path";
import fs from "fs";
import path from "path";
import os from "os";
import { OutputBundleOptions } from "../interface.js";

describe("build commands", () => {
  let tmpDir: string;
  let outputBundleOptions: OutputBundleOptions;
  beforeEach(() => {
    tmpDir = generateTmpDir();
    outputBundleOptions = {
      bundleYamlPath: resolve(tmpDir, ".apphosting", "bundle.yaml"),
      outputDirectory: resolve(tmpDir, ".apphosting"),
      serverFilePath: resolve(tmpDir, ".apphosting", "server", "entry.mjs"),
      clientDir: resolve(tmpDir, ".apphosting", "client"),
      wantsBackend: false,
    };
  });

  it("handles no backend case", async () => {
    const { generateOutputDirectory } = await importUtils;
    const files = {
      "dist/index.html": "",
    };
    generateTestFiles(tmpDir, files);
    await generateOutputDirectory(tmpDir, outputBundleOptions, join(tmpDir, "dist"));
    const expectedFiles = {
      ".apphosting/client/index.html": "",
      ".apphosting/bundle.yaml": `staticAssets:
  - .apphosting/client
serverDirectory: null
`,
    };
    validateTestFiles(tmpDir, expectedFiles);
  });
  it("handles backend case", async () => {
    const { generateOutputDirectory } = await importUtils;
    const files = {
      "dist/client/favicon": "",
      "dist/server/entry.mjs": "",
      node_modules: "",
    };
    generateTestFiles(tmpDir, files);
    outputBundleOptions = {
      bundleYamlPath: resolve(tmpDir, ".apphosting", "bundle.yaml"),
      outputDirectory: resolve(tmpDir, ".apphosting"),
      serverFilePath: resolve(tmpDir, ".apphosting", "server", "entry.mjs"),
      clientDir: resolve(tmpDir, ".apphosting", "client"),
      wantsBackend: true,
    };
    await generateOutputDirectory(tmpDir, outputBundleOptions, join(tmpDir, "dist"));

    const expectedFiles = {
      ".apphosting/client/favicon": "",
      ".apphosting/server/entry.mjs": "",
      ".apphosting/node_modules": "",
      ".apphosting/bundle.yaml": `staticAssets:
  - .apphosting/client
serverDirectory: .apphosting/server
`,
    };
    validateTestFiles(tmpDir, expectedFiles);
  });

  it("test populate output bundle options", async () => {
    const { populateOutputBundleOptions } = await importUtils;
    const expectedOutputBundleOptions = {
      bundleYamlPath: join("test", ".apphosting", "bundle.yaml"),
      outputDirectory: join("test", ".apphosting"),
      serverFilePath: join("test", ".apphosting", "server", "entry.mjs"),
      clientDir: join("test", ".apphosting", "client"),
      wantsBackend: true,
    };
    assert.deepEqual(populateOutputBundleOptions("test", true), expectedOutputBundleOptions);
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
function generateTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "test-files"));
}

function generateTestFiles(baseDir: string, filesToGenerate: Object): void {
  Object.entries(filesToGenerate).forEach((file) => {
    const fileName = file[0];
    const contents = file[1];
    const fileToGenerate = path.join(baseDir, fileName);
    fs.mkdirSync(path.dirname(fileToGenerate), { recursive: true });
    fs.writeFileSync(fileToGenerate, contents);
  });
}

function validateTestFiles(baseDir: string, expectedFiles: Object): void {
  Object.entries(expectedFiles).forEach((file) => {
    const fileName = file[0];
    const expectedContents = file[1];
    const fileToRead = path.join(baseDir, fileName);
    const contents = fs.readFileSync(fileToRead).toString();
    assert.deepEqual(contents, expectedContents);
  });
}
