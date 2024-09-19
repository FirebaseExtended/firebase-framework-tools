import assert from "assert";
import { posix } from "path";

const host = process.env.HOST;

if (!host) {
  throw new Error("HOST environment variable expected");
}

describe("static-site generation", () => {
  before(function () {
    if (!process.env.SSG && !process.env.SSR) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }
  });

  it("/", async () => {
    const response = await fetch(host);
    const body = await response.text();
    assert(body.includes("Angular on Firebase App Hosting</h1>"));
  });

  it("/ssg", async () => {
    const response = await fetch(posix.join(host, "ssg"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), null);
    const body = await response.text();
    assert(body.includes("SSG</h1>"));
  });

  it("/deferrable-views", async () => {
    const response = await fetch(posix.join(host, "deferrable-views"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(response.headers.get("cache-control"), null);
    const body = await response.text();
    assert(body.includes("Deferrable Views</h1>"));
  }).timeout(10_000);

  it(`404`, async function () {
    if (process.env.SSR) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      return this.skip();
    }
    const response = await fetch(posix.join(host, Math.random().toString()));
    const body = await response.text();
    assert(body.includes("Angular on Firebase App Hosting</h1>"));
  });
});
