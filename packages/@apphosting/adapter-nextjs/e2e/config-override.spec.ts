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

describe("next.config override", () => {
  it("should have images optimization disabled", async () => {
    const serverFiles = await fsExtra.readJson(
      `${process.cwd()}/e2e/runs/${runId}/.next/standalone/.next/required-server-files.json`,
    );
    console.log(`serverFiles: ${JSON.stringify(serverFiles)}`);
    const config = serverFiles.config;

    // Verify that images.unoptimized is set to true
    assert.ok(config.images, "Config should have images property");
    assert.strictEqual(
      config.images.unoptimized,
      true,
      "Images should have unoptimized set to true",
    );
  });

  // it("should preserve user config settings", async () => {
  //   // This test checks if the user's original config settings are preserved
  //   // We'll check for the custom header that was set in the next.config
  //   const response = await fetch(posix.join(host, "/"));
  //   assert.ok(response.ok);

  //   // Check for the custom header that was set in the next.config
  //   if (scenario.includes("with-js-config")) {
  //     assert.equal(response.headers.get("x-custom-header") ?? "", "js-config-value");
  //   } else if (scenario.includes("with-ts-config")) {
  //     assert.equal(response.headers.get("x-custom-header") ?? "", "ts-config-value");
  //   } else if (scenario.includes("with-mjs-config")) {
  //     assert.equal(response.headers.get("x-custom-header") ?? "", "mjs-config-value");
  //   } else if (scenario.includes("with-complex-config")) {
  //     assert.equal(response.headers.get("x-custom-header") ?? "", "complex-config-value");
  //   }
  // });

  // it("should handle function-style config correctly", async () => {
  //   // Only run this test for scenarios with function-style config
  //   if (!scenario.includes("function-style")) {
  //     this.skip();
  //     return;
  //   }

  //   // Check for the custom header that indicates function-style config was processed correctly
  //   const response = await fetch(posix.join(host, "/"));
  //   assert.ok(response.ok);
  //   assert.equal(response.headers.get("x-config-type") ?? "", "function");
  // });

  // it("should handle object-style config correctly", async () => {
  //   // Only run this test for scenarios with object-style config
  //   if (
  //     !scenario.includes("object-style") &&
  //     !scenario.includes("with-complex-config") &&
  //     !scenario.includes("with-empty-config")
  //   ) {
  //     this.skip();
  //     return;
  //   }

  //   // Check for the custom header that indicates object-style config was processed correctly
  //   const response = await fetch(posix.join(host, "/"));
  //   assert.ok(response.ok);

  //   // Empty config doesn't set this header
  //   if (!scenario.includes("with-empty-config")) {
  //     assert.equal(response.headers.get("x-config-type") ?? "", "object");
  //   }
  // });

  // it("should handle empty config correctly", async () => {
  //   // Only run this test for the empty config scenario
  //   if (!scenario.includes("with-empty-config")) {
  //     this.skip();
  //     return;
  //   }

  //   // Just check that the page loads successfully
  //   const response = await fetch(posix.join(host, "/"));
  //   assert.ok(response.ok);
  // });

  // it("should verify original config file was preserved", async () => {
  //   // This test verifies that the original config file was preserved
  //   // We'll check the file system to make sure the original config file exists
  //   let originalConfigExists = false;

  //   if (scenario.includes("with-js-config")) {
  //     originalConfigExists = await fsExtra.pathExists("next.config.original.js");
  //   } else if (scenario.includes("with-ts-config")) {
  //     originalConfigExists = await fsExtra.pathExists("next.config.original.ts");
  //   } else if (scenario.includes("with-mjs-config")) {
  //     originalConfigExists = await fsExtra.pathExists("next.config.original.mjs");
  //   } else if (
  //     scenario.includes("with-empty-config") ||
  //     scenario.includes("with-complex-config") ||
  //     scenario.includes("with-error-handling")
  //   ) {
  //     originalConfigExists = await fsExtra.pathExists("next.config.original.js");
  //   }

  //   assert.ok(originalConfigExists, "Original config file should be preserved");
  // });

  // it("should handle error gracefully when config file has syntax errors", async () => {
  //   // Only run this test for the error handling scenario
  //   if (!scenario.includes("with-error-handling")) {
  //     this.skip();
  //     return;
  //   }

  //   // The build should have succeeded despite the invalid config file
  //   // because we started with a valid config
  //   const response = await fetch(posix.join(host, "/"));
  //   assert.ok(response.ok);

  //   // Check if the invalid config file exists
  //   const invalidConfigExists = await fsExtra.pathExists("next.config.invalid.js");
  //   assert.ok(invalidConfigExists, "Invalid config file should exist");
  // });

  // it("should verify the generated config file has the correct format", async () => {
  //   // Skip for error handling scenario
  //   if (scenario.includes("with-error-handling")) {
  //     this.skip();
  //     return;
  //   }

  //   let configPath = "";

  //   if (scenario.includes("with-js-config")) {
  //     configPath = "next.config.js";
  //   } else if (scenario.includes("with-ts-config")) {
  //     configPath = "next.config.ts";
  //   } else if (scenario.includes("with-mjs-config")) {
  //     configPath = "next.config.mjs";
  //   } else if (scenario.includes("with-empty-config") || scenario.includes("with-complex-config")) {
  //     configPath = "next.config.js";
  //   }

  //   // Check if the generated config file exists
  //   const configExists = await fsExtra.pathExists(configPath);
  //   assert.ok(configExists, "Generated config file should exist");

  //   // Read the config file content
  //   const configContent = await fsExtra.readFile(configPath, "utf-8");

  //   // Verify that the config file contains the unoptimized: true setting
  //   assert.ok(configContent.includes("unoptimized: true"), "Config should have unoptimized: true");

  //   // Verify that the config file imports the original config
  //   if (
  //     scenario.includes("with-js-config") ||
  //     scenario.includes("with-empty-config") ||
  //     scenario.includes("with-complex-config")
  //   ) {
  //     assert.ok(
  //       configContent.includes("require('./next.config.original.js')"),
  //       "Config should import the original JS config",
  //     );
  //   } else if (scenario.includes("with-ts-config")) {
  //     assert.ok(
  //       configContent.includes("import originalConfig from './next.config.original'"),
  //       "Config should import the original TS config",
  //     );
  //   } else if (scenario.includes("with-mjs-config")) {
  //     assert.ok(
  //       configContent.includes("import originalConfig from './next.config.original.mjs'"),
  //       "Config should import the original MJS config",
  //     );
  //   }
  // });
});
