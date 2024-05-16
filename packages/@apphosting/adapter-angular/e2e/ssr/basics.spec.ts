import assert from "assert";
import { posix } from "path";

const host = process.env.HOST;

if (!host) {
  throw new Error("HOST environment variable expected");
}

if (process.env.SSR) {
  describe("server-side", () => {
    it("/ssr", async () => {
      const response = await fetch(posix.join(host, "ssr"));
      assert.ok(response.ok);
      assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
      assert.equal(response.headers.get("cache-control"), null);
    });
  });
}
