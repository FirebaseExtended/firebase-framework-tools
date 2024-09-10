import * as assert from "assert";
import { posix } from "path";

export const host = process.env.HOST;

if (!host) {
  throw new Error("HOST environment variable expected");
}

describe("app", () => {
  it("/", async () => {
    console.log("host", host);
    const response = await fetch(host).catch((e) => {
      console.log("error", e);
      return null;
    });
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(
      response.headers.get("cache-control"),
      "s-maxage=31536000, stale-while-revalidate",
    );
  });

  it("/ssg", async () => {
    const response = await fetch(posix.join(host, "ssg"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(
      response.headers.get("cache-control"),
      "s-maxage=31536000, stale-while-revalidate",
    );
    const text = await response.text();
    assert.ok(text.includes("SSG"));
    assert.ok(text.includes("Generated"));
    assert.ok(text.includes("UUID"));
  });

  it("/ssr", async () => {
    const response = await fetch(posix.join(host, "ssr"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(
      response.headers.get("cache-control"),
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
    const text = await response.text();
    assert.ok(text.includes("A server generated page!"));
    assert.ok(text.includes("Generated"));
    assert.ok(text.includes("UUID"));
  });

  it("/ssr/streaming", async () => {
    const response = await fetch(posix.join(host, "ssr", "streaming"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(
      response.headers.get("cache-control"),
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
    const text = await response.text();
    assert.ok(text.includes("A server generated page!"));
    assert.ok(text.includes("Streaming!"));
    assert.ok(text.includes("Generated"));
    assert.ok(text.includes("UUID"));
  }).timeout(3000); // Increased timeout to 3000ms to allow for the 2000ms component timeout

  it("/isr/time", async () => {
    const response = await fetch(posix.join(host, "isr", "time"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.ok(
      response.headers.get("cache-control")?.includes("s-maxage=10"),
      "Cache-Control header should include s-maxage=10",
    );
    const text = await response.text();
    assert.ok(text.includes("A cached page"));
    assert.ok(text.includes("(should be regenerated every 10 seconds)"));
    assert.ok(text.includes("Generated"));
    assert.ok(text.includes("UUID"));
  });

  it("/isr/demand", async () => {
    const response = await fetch(posix.join(host, "isr", "demand"));
    assert.ok(response.ok);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(
      response.headers.get("cache-control"),
      "s-maxage=31536000, stale-while-revalidate",
    );
    const text = await response.text();
    assert.ok(text.includes("A cached page"));
    assert.ok(text.includes("Generated"));
    assert.ok(text.includes("UUID"));
    assert.ok(text.includes("Regenerate page"));
  });

  it(`404`, async () => {
    const response = await fetch(posix.join(host, Math.random().toString()));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("content-type")?.toLowerCase(), "text/html; charset=utf-8");
    assert.equal(
      response.headers.get("cache-control"),
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
  });
});
