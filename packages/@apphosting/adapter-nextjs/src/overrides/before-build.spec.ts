import fs from "fs/promises";
import assert from "assert";
import path from "path";
import os from "os";
const importOverrides = import("@apphosting/adapter-nextjs/dist/overrides/before-build.js");

describe("before-build", () => {
  let tmpDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "next-config-tests-"));
  });

  afterEach(async () => {
    // Clean up the temporary directory after tests
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("setImagesUnoptimizedInConfigs", () => {
    it("should throw an error when no config file is found", async () => {
      const { setImagesUnoptimizedInConfigs } = await importOverrides;
      await assert.rejects(setImagesUnoptimizedInConfigs(tmpDir), (err) => {
        return (
          err instanceof Error && err.message.includes(`No Next.js config file found in ${tmpDir}`)
        );
      });
    });

    it("should throw an error when multiple config files are found", async () => {
      const { setImagesUnoptimizedInConfigs } = await importOverrides;
      // Create multiple config files
      await fs.writeFile(path.join(tmpDir, "next.config.js"), "module.exports = {}");
      await fs.writeFile(path.join(tmpDir, "next.config.ts"), "export default {}");

      await assert.rejects(setImagesUnoptimizedInConfigs(tmpDir), {
        message: /Multiple Next.js config files found:/,
      });
    });

    it("should skip modification if unoptimized is already defined", async () => {
      const { setImagesUnoptimizedInConfigs } = await importOverrides;
      // Create config with unoptimized already defined
      await fs.writeFile(
        path.join(tmpDir, "next.config.js"),
        "module.exports = { images: { unoptimized: false } }",
      );

      await setImagesUnoptimizedInConfigs(tmpDir);

      // Read the file to verify it wasn't changed
      const content = await fs.readFile(path.join(tmpDir, "next.config.js"), "utf8");
      assert.strictEqual(content, "module.exports = { images: { unoptimized: false } }");
    });

    describe("CommonJS format", () => {
      it("should add images.unoptimized to existing object literal export", async () => {
        const { setImagesUnoptimizedInConfigs } = await importOverrides;
        await fs.writeFile(path.join(tmpDir, "next.config.js"), 'module.exports = { foo: "bar" }');

        await setImagesUnoptimizedInConfigs(tmpDir);

        const content = await fs.readFile(path.join(tmpDir, "next.config.js"), "utf8");
        assert.strictEqual(content.includes("images: {"), true);
        assert.strictEqual(content.includes("unoptimized: true"), true);
        assert.strictEqual(content.includes('foo: "bar"'), true);
      });

      it("should add unoptimized to existing images config", async () => {
        const { setImagesUnoptimizedInConfigs } = await importOverrides;
        await fs.writeFile(
          path.join(tmpDir, "next.config.js"),
          'module.exports = { images: { domains: ["example.com"] } }',
        );

        await setImagesUnoptimizedInConfigs(tmpDir);

        const content = await fs.readFile(path.join(tmpDir, "next.config.js"), "utf8");
        assert.strictEqual(content.includes("unoptimized: true"), true);
        assert.strictEqual(content.includes('domains: ["example.com"]'), true);
      });

      it("should handle non-object exports in CommonJS", async () => {
        const { setImagesUnoptimizedInConfigs } = await importOverrides;
        await fs.writeFile(
          path.join(tmpDir, "next.config.js"),
          'module.exports = withPlugin({ foo: "bar" })',
        );

        await setImagesUnoptimizedInConfigs(tmpDir);

        const content = await fs.readFile(path.join(tmpDir, "next.config.js"), "utf8");
        assert.strictEqual(content.includes("const originalConfig = withPlugin"), true);
        assert.strictEqual(content.includes("module.exports = {"), true);
        assert.strictEqual(content.includes("...originalConfig"), true);
        assert.strictEqual(content.includes("images: {"), true);
        assert.strictEqual(content.includes("unoptimized: true"), true);
      });
    });

    describe("ECMAScript Module format", () => {
      it("should add images.unoptimized to existing object literal export", async () => {
        const { setImagesUnoptimizedInConfigs } = await importOverrides;
        await fs.writeFile(
          path.join(tmpDir, "next.config.mjs"),
          `// @ts-check
 
          /**
           * @type {import('next').NextConfig}
           */
          const nextConfig = {
            /* config options here */
          }
          
          export default nextConfig`,
        );

        await setImagesUnoptimizedInConfigs(tmpDir);

        const content = await fs.readFile(path.join(tmpDir, "next.config.mjs"), "utf8");
        const normalizedContent = normalizeString(content);

        // Create expected content with the same normalization
        const expectedPattern = `// @ts-check
 
                                /**
                                 * @type {import('next').NextConfig}
                                 */
                                const nextConfig = {
                                  /* config options here */
                                }
                                
                                const originalConfig = nextConfig
                                
                                export default {
                                  ...originalConfig,
                                  images: {
                                    unoptimized: true
                                  }
                                };`;

        const normalizedExpected = normalizeString(expectedPattern);
        assert.strictEqual(normalizedContent, normalizedExpected);
      });

      it("should handle config as a function", async () => {
        const { setImagesUnoptimizedInConfigs } = await importOverrides;
        await fs.writeFile(
          path.join(tmpDir, "next.config.mjs"),
          `// @ts-check
 
          export default (phase, { defaultConfig }) => {
            /**
             * @type {import('next').NextConfig}
             */
            const nextConfig = {
              /* config options here */
            }
            return nextConfig
          }`,
        );

        await setImagesUnoptimizedInConfigs(tmpDir);

        const content = await fs.readFile(path.join(tmpDir, "next.config.mjs"), "utf8");
        assert.strictEqual(content, "");
      });
    });

    describe("TypeScript format", () => {
      it("should handle TypeScript config files", async () => {
        const { setImagesUnoptimizedInConfigs } = await importOverrides;
        await fs.writeFile(path.join(tmpDir, "next.config.ts"), 'export default { foo: "bar" }');

        await setImagesUnoptimizedInConfigs(tmpDir);

        const content = await fs.readFile(path.join(tmpDir, "next.config.ts"), "utf8");
        assert.strictEqual(content.includes("export default {"), true);
        assert.strictEqual(content.includes("images: {"), true);
        assert.strictEqual(content.includes("unoptimized: true"), true);
        assert.strictEqual(content.includes('foo: "bar"'), true);
      });
    });

    describe("Fallback case", () => {
      it("should append config when no recognized pattern is found", async () => {
        const { setImagesUnoptimizedInConfigs } = await importOverrides;
        await fs.writeFile(
          path.join(tmpDir, "next.config.js"),
          "// Just some comments\n// No exports",
        );

        await setImagesUnoptimizedInConfigs(tmpDir);

        const content = await fs.readFile(path.join(tmpDir, "next.config.js"), "utf8");
        assert.strictEqual(content.includes("// Just some comments"), true);
        assert.strictEqual(content.includes("// No exports"), true);
        assert.strictEqual(content.includes("module.exports = {"), true);
        assert.strictEqual(content.includes("images: {"), true);
        assert.strictEqual(content.includes("unoptimized: true"), true);
      });
    });

    it("should handle errors during file processing", async () => {
      const { setImagesUnoptimizedInConfigs } = await importOverrides;
      // Create a directory with the same name as the config file to cause a read error
      const configPath = path.join(tmpDir, "next.config.js");
      await fs.mkdir(configPath);

      await assert.rejects(setImagesUnoptimizedInConfigs(tmpDir), (err) => {
        return (
          err instanceof Error &&
          err.message.startsWith("Error updating overriding Next.js config files:")
        );
      });
    });
  });
});

function normalizeString(str: string) {
  return str
    .replace(/\s+/g, " ")
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*,\s*/g, ",")
    .trim();
}
