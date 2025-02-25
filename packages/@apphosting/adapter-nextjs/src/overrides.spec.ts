import assert from "assert";
import fs from "fs";
import path from "path";
import os from "os";
import { RoutesManifest, MiddlewareManifest } from "./interfaces.js";
const importOverrides = import("@apphosting/adapter-nextjs/dist/overrides.js");

describe("route overrides", () => {
  let tmpDir: string;
  let routesManifestPath: string;
  let middlewareManifestPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-manifests-"));
    routesManifestPath = path.join(tmpDir, ".next", "routes-manifest.json");
    middlewareManifestPath = path.join(tmpDir, ".next", "server", "middleware-manifest.json");

    fs.mkdirSync(path.dirname(routesManifestPath), { recursive: true });
    fs.mkdirSync(path.dirname(middlewareManifestPath), { recursive: true });
  });

  it("should add default fah headers to routes manifest", async () => {
    const { addRouteOverrides } = await importOverrides;
    const initialManifest: RoutesManifest = {
      version: 3,
      basePath: "",
      pages404: true,
      staticRoutes: [],
      dynamicRoutes: [],
      dataRoutes: [],
      headers: [
        {
          source: "/existing",
          headers: [{ key: "X-Custom", value: "test" }],
          regex: "^/existing$",
        },
      ],
      rewrites: [],
      redirects: [],
    };

    fs.writeFileSync(routesManifestPath, JSON.stringify(initialManifest));
    fs.writeFileSync(
      middlewareManifestPath,
      JSON.stringify({ version: 1, sortedMiddleware: [], middleware: {}, functions: {} }),
    );

    await addRouteOverrides(tmpDir, ".next", {
      adapterPackageName: "@apphosting/adapter-nextjs",
      adapterVersion: "1.0.0",
    });

    const updatedManifest = JSON.parse(
      fs.readFileSync(routesManifestPath, "utf-8"),
    ) as RoutesManifest;

    assert.strictEqual(updatedManifest.headers.length, 2);
    assert.deepStrictEqual(updatedManifest.headers[0], initialManifest.headers[0]);

    const firebaseHeaders = updatedManifest.headers[1];
    assert.strictEqual(firebaseHeaders.source, "/:path*");
    assert.strictEqual(firebaseHeaders.headers.length, 1);
    assert.strictEqual(firebaseHeaders.headers[0].key, "x-fah-adapter");
    assert.strictEqual(firebaseHeaders.headers[0].value, "nextjs-1.0.0");
  });

  it("should add middleware header when middleware exists", async () => {
    const { addRouteOverrides } = await importOverrides;
    const initialManifest: RoutesManifest = {
      version: 3,
      basePath: "",
      pages404: true,
      staticRoutes: [],
      dynamicRoutes: [],
      dataRoutes: [],
      headers: [],
      rewrites: [],
      redirects: [],
    };

    const middlewareManifest: MiddlewareManifest = {
      version: 1,
      sortedMiddleware: ["/"],
      middleware: {
        "/": {
          files: ["middleware.ts"],
          name: "middleware",
          page: "/",
          matchers: [
            {
              regexp: "^/.*$",
              originalSource: "/:path*",
            },
          ],
        },
      },
      functions: {},
    };

    fs.writeFileSync(routesManifestPath, JSON.stringify(initialManifest));
    fs.writeFileSync(middlewareManifestPath, JSON.stringify(middlewareManifest));

    await addRouteOverrides(tmpDir, ".next", {
      adapterPackageName: "@apphosting/adapter-nextjs",
      adapterVersion: "1.0.0",
    });

    const updatedManifest = JSON.parse(
      fs.readFileSync(routesManifestPath, "utf-8"),
    ) as RoutesManifest;

    assert.strictEqual(updatedManifest.headers.length, 1);

    const headers = updatedManifest.headers[0];
    assert.strictEqual(headers.source, "/:path*");
    assert.strictEqual(headers.headers.length, 2);
    assert.strictEqual(headers.headers[0].key, "x-fah-adapter");
    assert.strictEqual(headers.headers[0].value, "nextjs-1.0.0");
    assert.strictEqual(headers.headers[1].key, "x-fah-middleware");
    assert.strictEqual(headers.headers[1].value, "true");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
