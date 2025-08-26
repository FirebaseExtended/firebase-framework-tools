const importUtils = import("@apphosting/adapter-angular/dist/utils.js");
import assert from "assert";
import fs from "fs";
import { resolve } from "path";
import path from "path";
import { stringify as yamlStringify } from "yaml";
import os from "os";

const { metaFrameworkOutputBundleExists } = await importUtils;

function generateTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "test-files"));
}

describe("metaFrameworkOutputBundleExists", () => {
  let bundlePath: string;
  const originalCwd = process.cwd.bind(process);

  beforeEach(() => {
    const tmpDir = generateTmpDir();
    process.cwd = () => tmpDir;
    fs.mkdirSync(resolve(tmpDir, ".apphosting"));
    bundlePath = resolve(tmpDir, ".apphosting", "bundle.yaml");
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  it("unrecogznied bundle", async () => {
    const content = "chicken: bok bok";
    fs.writeFileSync(bundlePath, yamlStringify(content));
    assert(!metaFrameworkOutputBundleExists());
  });

  it("no bundle exists", async () => {
    assert(!metaFrameworkOutputBundleExists());
  });

  it("meta-framework bundle exists", async () => {
    const outputBundle: OutputBundleConfig = {
      version: "v1",
      runConfig: {
        runCommand: `does not matter`,
      },
      metadata: {
        framework: "nitro",
      },
    };
    fs.writeFileSync(bundlePath, yamlStringify(outputBundle));
    assert(metaFrameworkOutputBundleExists());
  });

  it("angular bundle exists", async () => {
    const outputBundle: OutputBundleConfig = {
      version: "v1",

      runConfig: {
        runCommand: `does not matter`,
      },
      metadata: {
        framework: "angular",
      },
    };
    fs.writeFileSync(bundlePath, yamlStringify(outputBundle));
    assert(!metaFrameworkOutputBundleExists());
  });
});
