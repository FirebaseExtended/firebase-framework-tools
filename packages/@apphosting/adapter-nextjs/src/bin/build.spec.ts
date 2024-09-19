const importUtils = import("@apphosting/adapter-nextjs/dist/utils.js");
import assert from "assert";
import fs from "fs";
import yaml from "yaml";
import path from "path";
import os from "os";
import { OutputBundleOptions } from "../interfaces.js";
describe("build commands", () => {
  let tmpDir: string;
  let outputBundleOptions: OutputBundleOptions;
  let defaultNextVersion: string;
  beforeEach(() => {
    tmpDir = generateTmpDir();
    outputBundleOptions = {
      bundleYamlPath: path.join(tmpDir, ".apphosting/bundle.yaml"),
      outputDirectoryBasePath: path.join(tmpDir, ".apphosting"),
      outputDirectoryAppPath: path.join(tmpDir, ".apphosting"),
      outputPublicDirectoryPath: path.join(tmpDir, ".apphosting/public"),
      outputStaticDirectoryPath: path.join(tmpDir, ".apphosting/.next/static"),
      serverFilePath: path.join(tmpDir, ".apphosting/server.js"),
    };
    defaultNextVersion = "14.0.3";
  });

  it("expects all output bundle files to be generated", async () => {
    const { generateOutputDirectory, validateOutputDirectory, createMetadata } = await importUtils;
    const files = {
      ".next/standalone/server.js": "",
      ".next/static/staticfile": "",
      ".next/routes-manifest.json": `{
        "headers":[], 
        "rewrites":[], 
        "redirects":[]
      }`,
    };
    const packageVersion = createMetadata(defaultNextVersion).adapterVersion;
    generateTestFiles(tmpDir, files);
    await generateOutputDirectory(
      tmpDir,
      tmpDir,
      outputBundleOptions,
      path.join(tmpDir, ".next"),
      defaultNextVersion,
    );
    await validateOutputDirectory(outputBundleOptions);

    const expectedFiles = {
      ".apphosting/.next/static/staticfile": "",
      ".apphosting/server.js": "",
      ".apphosting/bundle.yaml": `headers: []
redirects: []
rewrites: []
runCommand: node .apphosting/server.js
neededDirs:
  - .apphosting
staticAssets:
  - .apphosting/public
env: []
metadata:
  adapterPackageName: "@apphosting/adapter-nextjs"
  adapterVersion: ${packageVersion}
  framework: nextjs
  frameworkVersion: ${defaultNextVersion}
`,
    };
    validateTestFiles(tmpDir, expectedFiles);
  });

  it("moves files into correct location in a monorepo setup", async () => {
    const { generateOutputDirectory } = await importUtils;
    const files = {
      ".next/standalone/apps/next-app/standalonefile": "",
      ".next/static/staticfile": "",
      "public/publicfile": "",
      ".next/routes-manifest.json": `{
        "headers":[], 
        "rewrites":[], 
        "redirects":[]
      }`,
    };
    generateTestFiles(tmpDir, files);
    await generateOutputDirectory(
      tmpDir,
      "apps/next-app",
      {
        bundleYamlPath: path.join(tmpDir, ".apphosting/bundle.yaml"),
        outputDirectoryBasePath: path.join(tmpDir, ".apphosting"),
        outputDirectoryAppPath: path.join(tmpDir, ".apphosting/apps/next-app"),
        outputPublicDirectoryPath: path.join(tmpDir, ".apphosting/apps/next-app/public"),
        outputStaticDirectoryPath: path.join(tmpDir, ".apphosting/apps/next-app/.next/static"),
        serverFilePath: path.join(tmpDir, ".apphosting/apps/next-app/server.js"),
      },
      path.join(tmpDir, ".next"),
      defaultNextVersion,
    );

    const expectedFiles = {
      ".apphosting/apps/next-app/.next/static/staticfile": "",
      ".apphosting/apps/next-app/standalonefile": "",
    };
    const expectedPartialYaml = {
      headers: [],
      rewrites: [],
      redirects: [],
      runCommand: "node .apphosting/apps/next-app/server.js",
      neededDirs: [".apphosting"],
      staticAssets: [".apphosting/apps/next-app/public"],
    };
    validateTestFiles(tmpDir, expectedFiles);
    validatePartialYamlContents(tmpDir, ".apphosting/bundle.yaml", expectedPartialYaml);
  });

  it("expects directories and other files to be copied over", async () => {
    const { generateOutputDirectory, validateOutputDirectory } = await importUtils;
    const files = {
      ".next/standalone/server.js": "",
      ".next/static/staticfile": "",
      "public/publicfile": "",
      extrafile: "",
      ".next/routes-manifest.json": `{
        "headers":[], 
        "rewrites":[], 
        "redirects":[]
      }`,
    };
    generateTestFiles(tmpDir, files);
    await generateOutputDirectory(
      tmpDir,
      tmpDir,
      outputBundleOptions,
      path.join(tmpDir, ".next"),
      defaultNextVersion,
    );
    await validateOutputDirectory(outputBundleOptions);

    const expectedFiles = {
      ".apphosting/.next/static/staticfile": "",
      ".apphosting/server.js": "",
      ".apphosting/public/publicfile": "",
      ".apphosting/extrafile": "",
    };
    const expectedPartialYaml = {
      headers: [],
      rewrites: [],
      redirects: [],
      runCommand: "node .apphosting/server.js",
      neededDirs: [".apphosting"],
      staticAssets: [".apphosting/public"],
    };
    validateTestFiles(tmpDir, expectedFiles);
    validatePartialYamlContents(tmpDir, ".apphosting/bundle.yaml", expectedPartialYaml);
  });

  it("expects bundle.yaml headers/rewrites/redirects to be generated", async () => {
    const { generateOutputDirectory, validateOutputDirectory } = await importUtils;
    const files = {
      ".next/standalone/server.js": "",
      ".next/static/staticfile": "",
      ".next/routes-manifest.json": `{
        "headers":[{"source":"source", "headers":["header1"]}], 
        "rewrites":[{"source":"source", "destination":"destination"}], 
        "redirects":[{"source":"source", "destination":"destination"}]
      }`,
    };
    generateTestFiles(tmpDir, files);
    await generateOutputDirectory(
      tmpDir,
      tmpDir,
      outputBundleOptions,
      path.join(tmpDir, ".next"),
      defaultNextVersion,
    );
    await validateOutputDirectory(outputBundleOptions);

    const expectedFiles = {
      ".apphosting/.next/static/staticfile": "",
      ".apphosting/server.js": "",
    };
    const expectedPartialYaml = {
      headers: [{ source: "source", headers: ["header1"] }],
      rewrites: [{ source: "source", destination: "destination" }],
      redirects: [{ source: "source", destination: "destination" }],
    };
    validateTestFiles(tmpDir, expectedFiles);
    validatePartialYamlContents(tmpDir, ".apphosting/bundle.yaml", expectedPartialYaml);
  });
  it("test failed validateOutputDirectory", async () => {
    const { generateOutputDirectory, validateOutputDirectory } = await importUtils;
    const files = {
      ".next/standalone/notserver.js": "",
      ".next/static/staticfile": "",
      ".next/routes-manifest.json": `{
        "headers":[{"source":"source", "headers":["header1"]}], 
        "rewrites":[{"source":"source", "destination":"destination"}], 
        "redirects":[{"source":"source", "destination":"destination"}]
      }`,
    };
    generateTestFiles(tmpDir, files);
    await generateOutputDirectory(
      tmpDir,
      tmpDir,
      outputBundleOptions,
      path.join(tmpDir, ".next"),
      defaultNextVersion,
    );
    assert.rejects(async () => await validateOutputDirectory(outputBundleOptions));
  });
  it("test populate output bundle options", async () => {
    const { populateOutputBundleOptions } = await importUtils;
    const expectedOutputBundleOptions = {
      bundleYamlPath: "test/.apphosting/bundle.yaml",
      outputDirectoryBasePath: "test/.apphosting",
      outputDirectoryAppPath: "test/.apphosting",
      outputPublicDirectoryPath: "test/.apphosting/public",
      outputStaticDirectoryPath: "test/.apphosting/.next/static",
      serverFilePath: "test/.apphosting/server.js",
    };
    assert.deepEqual(populateOutputBundleOptions("test", "test"), expectedOutputBundleOptions);
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
function validatePartialYamlContents(
  baseDir: string,
  yamlFileName: string,
  expectedPartialYaml: any,
): void {
  const yamlFilePath = path.join(baseDir, yamlFileName);
  const yamlContents = fs.readFileSync(yamlFilePath, "utf8");
  const parsedYaml = yaml.parse(yamlContents) as { [key: string]: any };
  Object.keys(expectedPartialYaml).forEach((key) => {
    assert.deepEqual(parsedYaml[key], expectedPartialYaml[key]);
  });
}