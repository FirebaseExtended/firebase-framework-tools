import * as assert from "assert";
import { posix } from "path";
import fsExtra from "fs-extra";

const host = process.env.HOST;
if (!host) {
  throw new Error("HOST environment variable expected");
}

const scenario = process.env.SCENARIO;
if (!scenario) {
  throw new Error("SCENARIO environment variable expected");
}

const runId = process.env.RUN_ID;
if (!runId) {
  throw new Error("RUN_ID environment variable expected");
}

const compiledFilesPath = posix.join(
  process.cwd(),
  "e2e",
  "runs",
  runId,
  ".next",
  "standalone",
  ".next",
);

describe("next.config override", () => {
  it("should have images optimization disabled", async function () {
    if (scenario.includes("with-empty-config")) {
      this.skip();
    }

    const serverFiles = await fsExtra.readJson(`${compiledFilesPath}/required-server-files.json`);
    const config = serverFiles.config;

    // Verify that images.unoptimized is set to true
    assert.ok(config.images, "Config should have images property");
    assert.strictEqual(
      config.images.unoptimized,
      true,
      "Images should have unoptimized set to true",
    );
  });

  it("should preserve other user set next configs", async function () {
    if (scenario.includes("with-empty-config")) {
      this.skip();
    }

    // This test checks if the user's original config settings are preserved
    // We'll check for the custom header that was set in the next.config
    const response = await fetch(posix.join(host, "/"));

    assert.ok(response.ok);

    // Check for the custom header that was set in the next.config
    const customHeader = response.headers.get("x-custom-header") ?? "";
    const validValues = ["js-config-value", "ts-config-value", "mjs-config-value"];
    assert.ok(
      validValues.includes(customHeader),
      `Expected header to be one of ${validValues.join(", ")} but got "${customHeader}"`,
    );
  });

  it("should handle function-style config correctly", async function () {
    // Only run this test for scenarios with function-style config
    if (!scenario.includes("function-style")) {
      this.skip();
    }

    // Check for the custom header that indicates function-style config was processed correctly
    const response = await fetch(posix.join(host, "/"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("x-config-type") ?? "", "function");
  });

  it("should handle object-style config correctly", async function () {
    // Only run this test for scenarios with object-style config
    if (!scenario.includes("object-style") && !scenario.includes("with-empty-config")) {
      this.skip();
    }

    // Check for the custom header that indicates object-style config was processed correctly
    const response = await fetch(posix.join(host, "/"));
    assert.ok(response.ok);

    // Empty config doesn't set this header
    if (!scenario.includes("with-empty-config")) {
      assert.equal(response.headers.get("x-config-type") ?? "", "object");
    }
  });
});
