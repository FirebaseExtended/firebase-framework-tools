import assert from "assert";
import { posix } from "path";

export const host = process.env.HOST;

if (!host) {
  throw new Error("HOST environment variable expected");
}

const isLocalhost = new URL(host).hostname === "localhost";

describe("common", () => {
  it("/", async () => {
    const response = await fetch(host);
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), null);
  });

  it("/favicon.ico", async () => {
    const response = await fetch(posix.join(host, "favicon.ico"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type"), "image/x-icon");
    assert.equal(
      response.headers.get("cache-control"),
      isLocalhost ? "public, max-age=31536000" : "public,max-age=60",
    );
  });

  it(`404`, async () => {
    const response = await fetch(posix.join(host, Math.random().toString()));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), null);
  });
});
