const importUtils = import("@apphosting/adapter-nextjs/dist/utils.js");
import assert from "assert";
import fs from "fs";
import yaml from "yaml";
import path from "path";
import os from "os";
import { OutputBundleOptions, AdapterMetadata } from "../interfaces.js";

describe("build commands", () => {
  let tmpDir: string;
  let outputBundleOptions: OutputBundleOptions;
  let defaultNextVersion: string;
  let adapterMetadata: AdapterMetadata;

  beforeEach(() => {
    tmpDir = generateTmpDir();
    outputBundleOptions = {
      bundleYamlPath: path.join(tmpDir, ".apphosting", "bundle.yaml"),
      outputDirectoryBasePath: path.join(tmpDir, ".apphosting"),
      outputDirectoryAppPath: path.join(tmpDir, ".next", "standalone"),
      outputPublicDirectoryPath: path.join(tmpDir, ".next", "standalone", "public"),
      outputStaticDirectoryPath: path.join(tmpDir, ".next", "standalone", ".next", "static"),
      serverFilePath: path.join(tmpDir, ".next", "standalone", "server.js"),
    };
    defaultNextVersion = "14.0.3";
    adapterMetadata = {
      adapterPackageName: "@apphosting/adapter-nextjs",
      adapterVersion: "14.0.1",
    };
  });

  it("expects all output bundle files to be generated", async () => {
    const { generateBuildOutput, validateOutputDirectory } = await importUtils;
    const files = {
      ".next/standalone/server.js": "",
      ".next/static/staticfile": "",
      ".next/routes-manifest.json": `{
        "headers":[],
        "rewrites":[],
        "redirects":[]
      }`,
    };
    generateTestFiles(tmpDir, files);
    await generateBuildOutput(
      tmpDir,
      tmpDir,
      outputBundleOptions,
      path.join(tmpDir, ".next"),
      defaultNextVersion,
      adapterMetadata,
    );
    await validateOutputDirectory(outputBundleOptions, path.join(tmpDir, ".next"));

    const expectedFiles = {
      ".next/standalone/.next/static/staticfile": "",
      ".next/standalone/server.js": "",
      ".apphosting/bundle.yaml": `version: v1
runConfig:
  runCommand: node .next/standalone/server.js
metadata:
  adapterPackageName: "@apphosting/adapter-nextjs"
  adapterVersion: ${adapterMetadata.adapterVersion}
  framework: nextjs
  frameworkVersion: ${defaultNextVersion}
`,
    };
    validateTestFiles(tmpDir, expectedFiles);
  });

  it("moves files into correct location in a monorepo setup", async () => {
    const { generateBuildOutput } = await importUtils;
    const files = {
      ".next/standalone/apps/next-app/standalonefile": "",
      ".next/static/staticfile": "",
      "public/publicfile": "",
    };
    generateTestFiles(tmpDir, files);
    await generateBuildOutput(
      tmpDir,
      "apps/next-app",
      {
        bundleYamlPath: path.join(tmpDir, ".apphosting", "bundle.yaml"),
        outputDirectoryBasePath: path.join(tmpDir, ".apphosting"),
        outputDirectoryAppPath: path.join(tmpDir, ".next", "standalone", "apps", "next-app"),
        outputPublicDirectoryPath: path.join(
          tmpDir,
          ".next",
          "standalone",
          "apps",
          "next-app",
          "public",
        ),
        outputStaticDirectoryPath: path.join(
          tmpDir,
          ".next",
          "standalone",
          "apps",
          "next-app",
          ".next",
          "static",
        ),
        serverFilePath: path.join(tmpDir, ".next", "standalone", "apps", "next-app", "server.js"),
      },
      path.join(tmpDir, ".next"),
      defaultNextVersion,
      adapterMetadata,
    );

    const expectedFiles = {
      ".next/standalone/apps/next-app/.next/static/staticfile": "",
      ".next/standalone/apps/next-app/standalonefile": "",
    };
    const expectedPartialYaml = {
      version: "v1",
      runConfig: { runCommand: "node .next/standalone/apps/next-app/server.js" },
    };
    validateTestFiles(tmpDir, expectedFiles);
    validatePartialYamlContents(tmpDir, ".apphosting/bundle.yaml", expectedPartialYaml);
  });

  it("test failed validateOutputDirectory", async () => {
    const { generateBuildOutput, validateOutputDirectory } = await importUtils;
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
    await generateBuildOutput(
      tmpDir,
      tmpDir,
      outputBundleOptions,
      path.join(tmpDir, ".next"),
      defaultNextVersion,
      {
        adapterPackageName: "@apphosting/adapter-nextjs",
        adapterVersion: "14.0.1",
      },
    );
    assert.rejects(
      async () => await validateOutputDirectory(outputBundleOptions, path.join(tmpDir, ".next")),
    );
  });
  it("expects directories and other files to be copied over", async () => {
    const { generateBuildOutput, validateOutputDirectory } = await importUtils;
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
    await generateBuildOutput(
      tmpDir,
      tmpDir,
      outputBundleOptions,
      path.join(tmpDir, ".next"),
      defaultNextVersion,
      {
        adapterPackageName: "@apphosting/adapter-nextjs",
        adapterVersion: "14.0.1",
      },
    );
    await validateOutputDirectory(outputBundleOptions, path.join(tmpDir, ".next"));

    const expectedFiles = {
      ".next/standalone/.next/static/staticfile": "",
      ".next/standalone/server.js": "",
      ".next/standalone/public/publicfile": "",
      ".next/standalone/extrafile": "",
    };
    validateTestFiles(tmpDir, expectedFiles);
  });
  it("test populate output bundle options", async () => {
    const { populateOutputBundleOptions } = await importUtils;
    const expectedOutputBundleOptions = {
      bundleYamlPath: "test/.apphosting/bundle.yaml",
      outputDirectoryBasePath: "test/.apphosting",
      outputDirectoryAppPath: "test/.next/standalone",
      outputPublicDirectoryPath: "test/.next/standalone/public",
      outputStaticDirectoryPath: "test/.next/standalone/.next/static",
      serverFilePath: "test/.next/standalone/server.js",
    };
    assert.deepEqual(
      populateOutputBundleOptions("test", "test", "test/.next"),
      expectedOutputBundleOptions,
    );
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
