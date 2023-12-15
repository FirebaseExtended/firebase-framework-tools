const importUtils = import("@apphosting/adapter-nextjs/dist/utils.js");
import assert from "assert";
import fs from "fs";
import path from "path";
import os from "os";

describe("build commands", async () => {
  let tmpDir: string;
  let outputBundleOptions: Object;
  beforeEach(async () => {
    tmpDir = generateTmpDir();
    outputBundleOptions = {
      bundleYamlPath: path.join(tmpDir, ".apphosting/bundle.yaml"),
      outputDirectory: path.join(tmpDir, ".apphosting"),
      outputPublicDirectory: path.join(tmpDir, ".apphosting/public"),
      outputStaticDirectory: path.join(tmpDir, ".apphosting/.next/static"),
      serverFilePath: path.join(tmpDir, ".apphosting/server.js"),
    };
  });

  it("expectes all output bundle files to be generated", async () => {
    const { generateOutputBundle } = await importUtils;

    const files = {
      ".next/standalone/standalonefile": "",
      ".next/static/staticfile": "",
      ".next/routes-manifest.json": `{
        "headers":[], 
        "rewrites":[], 
        "redirects":[]
      }`,
    };
    generateTestFiles(tmpDir, files);
    await generateOutputBundle(tmpDir, outputBundleOptions, path.join(tmpDir, ".next"));

    const expectedFiles = {
      ".apphosting/.next/static/staticfile": "",
      ".apphosting/standalonefile": "",
      ".apphosting/bundle.yaml": `headers: []
redirects: []
rewrites: []
runCommand: node .apphosting/server.js
neededDirs:
  - .apphosting
staticAssets:
  - .apphosting/public
`,
    };
    validateTestFiles(tmpDir, expectedFiles);
  });

  it("expects public directory to be copied over", async () => {
    const { generateOutputBundle } = await importUtils;

    const files = {
      ".next/standalone/standalonefile": "",
      ".next/static/staticfile": "",
      "public/publicfile": "",
      ".next/routes-manifest.json": `{
        "headers":[], 
        "rewrites":[], 
        "redirects":[]
      }`,
    };
    generateTestFiles(tmpDir, files);
    await generateOutputBundle(tmpDir, outputBundleOptions, path.join(tmpDir, ".next"));

    const expectedFiles = {
      ".apphosting/.next/static/staticfile": "",
      ".apphosting/standalonefile": "",
      ".apphosting/public/publicfile": "",
      ".apphosting/bundle.yaml": `headers: []
redirects: []
rewrites: []
runCommand: node .apphosting/server.js
neededDirs:
  - .apphosting
staticAssets:
  - .apphosting/public
`,
    };
    validateTestFiles(tmpDir, expectedFiles);
  });

  it("expects bundle.yaml headers/rewrites/redirects to be generated", async () => {
    const { generateOutputBundle } = await importUtils;

    const files = {
      ".next/standalone/standalonefile": "",
      ".next/static/staticfile": "",
      ".next/routes-manifest.json": `{
        "headers":[{"source":"source", "headers":["header1"]}], 
        "rewrites":[{"source":"source", "destination":"destination"}], 
        "redirects":[{"source":"source", "destination":"destination"}]
      }`,
    };
    generateTestFiles(tmpDir, files);
    await generateOutputBundle(tmpDir, outputBundleOptions, path.join(tmpDir, ".next"));

    const expectedFiles = {
      ".apphosting/.next/static/staticfile": "",
      ".apphosting/standalonefile": "",
      ".apphosting/bundle.yaml": `headers:
  - source: source
    headers:
      - header1
redirects:
  - source: source
    destination: destination
rewrites:
  - source: source
    destination: destination
runCommand: node .apphosting/server.js
neededDirs:
  - .apphosting
staticAssets:
  - .apphosting/public
`,
    };
    validateTestFiles(tmpDir, expectedFiles);
  });

  it("test populate output bundle options", async () => {
    const { populateOutputBundleOptions } = await importUtils;
    const expectedOutputBundleOptions = {
      bundleYamlPath: "test/.apphosting/bundle.yaml",
      outputDirectory: "test/.apphosting",
      outputPublicDirectory: "test/.apphosting/public",
      outputStaticDirectory: "test/.apphosting/.next/static",
      serverFilePath: "test/.apphosting/server.js",
    };
    assert.deepEqual(populateOutputBundleOptions("test"), expectedOutputBundleOptions);
  });
  afterEach(async () => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
function generateTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "test-files"));
}

function generateTestFiles(baseDir: string, filesToGenerate: Object) {
  Object.entries(filesToGenerate).forEach((file) => {
    const fileName = file[0];
    const contents = file[1];
    const fileToGenerate = path.join(baseDir, fileName);
    fs.mkdirSync(path.dirname(fileToGenerate), { recursive: true });
    fs.writeFileSync(fileToGenerate, contents);
  });
}

function validateTestFiles(baseDir: string, expectedFiles: Object) {
  Object.entries(expectedFiles).forEach((file) => {
    const fileName = file[0];
    const expectedContents = file[1];
    const fileToRead = path.join(baseDir, fileName);
    const contents = fs.readFileSync(fileToRead).toString();
    assert.deepEqual(contents, expectedContents);
  });
}
