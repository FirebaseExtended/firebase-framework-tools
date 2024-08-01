import assert from "assert";
import { readFileSync } from "fs-extra";
import { posix, join } from "path";

const host = process.env.HOST;
const enabledSSR = !!process.env.SSR;
const enabledSSG = !!process.env.SSG;
const sourceDir = process.env.SAUCE;

if (!host) {
  throw new Error("HOST environment variable expected");
}

if (!sourceDir) {
  throw new Error("SAUCE environment variable expected");
}

const readDistFile = (...parts: string[]) =>
  readFileSync(join(sourceDir, ".apphosting", "dist", ...parts));
const indexBody = readDistFile("browser", "index.html");

describe(`client-side (SSR ${enabledSSR ? "enabled" : "disabled"}) (SSG ${
  enabledSSG ? "enabled" : "disabled"
})`, () => {
  it("/", async () => {
    const response = await fetch(host);
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), null);
    const body = await response.text();
    if (enabledSSR && !enabledSSG) {
      assert(body.includes("Angular on Firebase App Hosting</h1>"));
    } else {
      assert.equal(body, indexBody);
    }
  });

  it("/ssg", async () => {
    const response = await fetch(posix.join(host, "ssg"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), null);
    const body = await response.text();
    if (!enabledSSR && !enabledSSG) {
      assert.equal(body, indexBody);
    } else {
      assert(body.includes("SSG</h1>"));
    }
  });

  it("/favicon.ico", async () => {
    const response = await fetch(posix.join(host, "favicon.ico"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type"), "image/x-icon");
    assert.equal(response.headers.get("cache-control"), "public, max-age=31536000");
    const body = await response.text();
    assert.equal(body, readDistFile("browser", "favicon.ico"));
  });

  it("/deferrable-views", async () => {
    const response = await fetch(posix.join(host, "deferrable-views"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), null);
    const body = await response.text();
    if (!enabledSSR && !enabledSSG) {
      assert.equal(body, indexBody);
    } else {
      assert(body.includes("Deferrable Views</h1>"));
    }
  }).timeout(10_000);

  it(`404`, async () => {
    const response = await fetch(posix.join(host, Math.random().toString()));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), null);
    const body = await response.text();
    if (!enabledSSR) {
      assert.equal(body, indexBody);
    } else {
      assert(body.includes("Page not found</h1>"));
    }
  });
});
