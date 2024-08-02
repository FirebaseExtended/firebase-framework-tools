import assert from "assert";
import { posix } from "path";

const host = process.env.HOST;

if (!host) {
  throw new Error("HOST environment variable expected");
}

describe("server-side rendering", () => {
  before(function () {
    if (!process.env.SSR) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }
  });

  it("/ssr", async () => {
    const response = await fetch(posix.join(host, "ssr"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), null);
  });

  it(`404`, async () => {
    const response = await fetch(posix.join(host, Math.random().toString()));
    const body = await response.text();
    assert(body.includes("Page not found</h1>"));
  });
});
