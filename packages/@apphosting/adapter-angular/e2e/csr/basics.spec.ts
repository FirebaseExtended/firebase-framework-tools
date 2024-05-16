import assert from "assert";
import { posix } from "path";

const host = process.env.HOST;
const enabledSSR = !!process.env.SSR;

if (!host) {
  throw new Error("HOST environment variable expected");
}

describe(`client-side (SSR ${enabledSSR ? "enabled" : "disabled"})`, () => {
  it("/", async () => {
    const response = await fetch(host);
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), enabledSSR ? null : "public, max-age=0");
  });

  it("/ssg", async () => {
    const response = await fetch(posix.join(host, "ssg"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), enabledSSR ? null : "public, max-age=0");
  });

  it("/favicon.ico", async () => {
    const response = await fetch(posix.join(host, "favicon.ico"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type"), "image/x-icon");
    assert.equal(response.headers.get("cache-control"), "public, max-age=31536000");
  });

  it("/deferrable-views", async () => {
    const response = await fetch(posix.join(host, "deferrable-views"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), enabledSSR ? null : "public, max-age=0");
  });

  it(`404`, async () => {
    const response = await fetch(posix.join(host, Math.random().toString()));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), enabledSSR ? null : "public, max-age=0");
  });
});
