const importUtils = import("@apphosting/adapter-nuxt/dist/utils.js");
import assert from "assert";
import { dirname, join } from "path";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";

import os from "os";
import { stringify as yamlStringify } from "yaml";
import { OutputBundleOptions } from "../interfaces.js";

describe("build", () => {
  // outputBundleOptions options is almost identical with or without a backend, run it only once
  it("should have expected output bundle options", async () => {
    const { populateOutputBundleOptions } = await importUtils;

    const outputDirectory = join("test", ".apphosting");

    const expectedOutputBundleOptions = {
      outputDirectory,
      bundleYamlPath: join(outputDirectory, "bundle.yaml"),
      clientDirectory: join(outputDirectory, "public"),
      serverDirectory: join(outputDirectory, "server"),
      serverFilePath: join(outputDirectory, "server", "index.mjs"),
      wantsBackend: true,
    };

    assert.deepEqual(populateOutputBundleOptions("test", true), expectedOutputBundleOptions);

    expectedOutputBundleOptions.wantsBackend = false;
    assert.deepEqual(populateOutputBundleOptions("test", false), expectedOutputBundleOptions);
  });

  describe("with backend", () => {
    let tmpDir: string;
    let outputBundleOptions: OutputBundleOptions;
    const wantsBackend = true;

    beforeEach(async () => {
      tmpDir = generateTmpDir();

      const { populateOutputBundleOptions } = await importUtils;
      outputBundleOptions = populateOutputBundleOptions(tmpDir, wantsBackend);
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it("should generate expected output directory", async () => {
      const { generateOutputDirectory } = await importUtils;
      const files = {
        "dist/public/index.html": "",
        "dist/server/index.mjs": "",
      };
      generateTestFiles(tmpDir, files);

      await generateOutputDirectory(tmpDir, outputBundleOptions, join(tmpDir, "dist"));

      const expectedFiles = {
        ".apphosting/public/index.html": "",
        ".apphosting/server/index.mjs": "",
        ".apphosting/bundle.yaml": yamlStringify({
          staticAssets: [".apphosting/public"],
          serverDirectory: ".apphosting/server",
          serverFilePath: ".apphosting/server/index.mjs",
          rewrites: [
            {
              source: "/**",
              destination: "/200.html",
            },
          ],
        }),
      };

      validateTestFiles(tmpDir, expectedFiles);

      const { validateOutputDirectory } = await importUtils;
      await validateOutputDirectory(outputBundleOptions);
    });

    it("should get expected error from validateOutputDirectory with invalid output ", async () => {
      const { generateOutputDirectory, validateOutputDirectory } = await importUtils;

      const files = {
        "dist/test/browser/browserfile": "",
      };
      generateTestFiles(tmpDir, files);

      await generateOutputDirectory(tmpDir, outputBundleOptions, join(tmpDir, "dist"));

      await assert.rejects(
        validateOutputDirectory(outputBundleOptions),
        Error("Output directory is not of expected structure"),
      );
    });

    it("should have expected output bundle options", async () => {
      const { populateOutputBundleOptions } = await importUtils;

      const outputDirectory = join("test", ".apphosting");

      const expectedOutputBundleOptions = {
        outputDirectory,
        bundleYamlPath: join(outputDirectory, "bundle.yaml"),
        clientDirectory: join(outputDirectory, "public"),
        serverDirectory: join(outputDirectory, "server"),
        serverFilePath: join(outputDirectory, "server", "index.mjs"),
        wantsBackend,
      };

      assert.deepEqual(
        populateOutputBundleOptions("test", wantsBackend),
        expectedOutputBundleOptions,
      );
    });
  });

  describe("without backend", () => {
    let tmpDir: string;
    let outputBundleOptions: OutputBundleOptions;
    const wantsBackend = false;

    beforeEach(async () => {
      tmpDir = generateTmpDir();

      const { populateOutputBundleOptions } = await importUtils;
      outputBundleOptions = populateOutputBundleOptions(tmpDir, wantsBackend);
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it("should generate expected output directory", async () => {
      const { generateOutputDirectory } = await importUtils;
      const files = {
        "dist/public/index.html": "",
      };
      generateTestFiles(tmpDir, files);

      await generateOutputDirectory(tmpDir, outputBundleOptions, join(tmpDir, "dist"));

      const expectedFiles = {
        ".apphosting/public/index.html": "",
        ".apphosting/bundle.yaml": yamlStringify({
          staticAssets: [".apphosting/public"],
          serverDirectory: null,
          serverFilePath: null,
          rewrites: [],
        }),
      };

      validateTestFiles(tmpDir, expectedFiles);

      const { validateOutputDirectory } = await importUtils;
      await validateOutputDirectory(outputBundleOptions);
    });

    it("should get expected error from validateOutputDirectory with invalid output ", async () => {
      const { generateOutputDirectory, validateOutputDirectory } = await importUtils;

      const files = {
        "dist/test/file": "",
      };
      generateTestFiles(tmpDir, files);

      await generateOutputDirectory(tmpDir, outputBundleOptions, join(tmpDir, "dist"));

      await assert.rejects(
        validateOutputDirectory(outputBundleOptions),
        Error("Output directory is not of expected structure"),
      );
    });
  });
});

function generateTmpDir(): string {
  return mkdtempSync(join(os.tmpdir(), "test-files"));
}

function generateTestFiles(baseDir: string, filesToGenerate: Record<string, string>): void {
  Object.entries(filesToGenerate).forEach(([fileName, contents]) => {
    const fileToGenerate = join(baseDir, fileName);
    mkdirSync(dirname(fileToGenerate), { recursive: true });
    writeFileSync(fileToGenerate, contents);
  });
}

function validateTestFiles(baseDir: string, expectedFiles: Record<string, string>): void {
  Object.entries(expectedFiles).forEach(([fileName, expectedContents]) => {
    const fileToRead = join(baseDir, fileName);
    const contents = readFileSync(fileToRead).toString();

    assert.deepEqual(contents, expectedContents);
  });
}
