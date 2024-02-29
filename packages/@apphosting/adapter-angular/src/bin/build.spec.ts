const importUtils = import("@apphosting/adapter-angular/dist/utils.js");
import assert from "assert";
import { resolve } from "path";
import fs from "fs";
import path from "path";
import os from "os";
import { OutputPathOptions } from "../interface.js";

describe("build commands", () => {
  let tmpDir: string;
  let outputPathOptions: OutputPathOptions;
  beforeEach(() => {
    tmpDir = generateTmpDir();
    outputPathOptions = {
      baseDirectory: resolve(tmpDir, "dist", "test"),
      browserDirectory: resolve(tmpDir, ".apphosting", "dist", "browser"),
      bundleYamlPath: resolve(tmpDir, ".apphosting", "bundle.yaml"),
      outputBaseDirectory: resolve(tmpDir, ".apphosting", "dist"),
      outputDirectory: resolve(tmpDir, ".apphosting"),
      serverFilePath: resolve(tmpDir, ".apphosting", "dist", "server", "server.mjs"),
      needsServerGenerated: false,
    };
  });

  it("expects all output bundle files to be generated", async () => {
    const { generateOutputDirectory } = await importUtils;
    const files = {
      "dist/test/browser/browserfile": "",
      "dist/test/server/server.mjs": "",
    };
    generateTestFiles(tmpDir, files);
    await generateOutputDirectory(tmpDir, outputPathOptions);

    const expectedFiles = {
      ".apphosting/dist/browser/browserfile": "",
      ".apphosting/dist/server/server.mjs": "",
      ".apphosting/bundle.yaml": `headers: []
redirects: []
rewrites: []
runCommand: node .apphosting/dist/server/server.mjs
neededDirs:
  - .apphosting
staticAssets:
  - .apphosting/dist/break
`,
    };
    validateTestFiles(tmpDir, expectedFiles);
  });

  it("test populate output bundle options", async () => {
    const { populateOutputBundleOptions } = await importUtils;
    const expectedOutputBundleOptions = {
      baseDirectory: "/test",
      browserDirectory: resolve(".apphosting", "browser"),
      bundleYamlPath: resolve(".apphosting", "bundle.yaml"),
      outputBaseDirectory: resolve(".apphosting", "dist"),
      outputDirectory: resolve("", ".apphosting"),
      serverFilePath: resolve(".apphosting", "server", "server.mjs"),
    };
    const outputPaths = {
      root: new URL("file:///test"),
      server: new URL("file:///server"),
      browser: new URL("file:///browser"),
    };
    assert.deepEqual(populateOutputBundleOptions(outputPaths), expectedOutputBundleOptions);
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
