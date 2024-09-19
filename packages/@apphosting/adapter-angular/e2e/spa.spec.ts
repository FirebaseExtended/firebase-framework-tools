import assert from "assert";
import { posix } from "path";

const host = process.env.HOST;

if (!host) {
  throw new Error("HOST environment variable expected");
}

describe("single-page app", () => {
  before(function () {
    if (process.env.SSR || process.env.SSG) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.skip();
    }
  });

  // eslint-disable-next-line prefer-arrow-callback
  it("/", async () => {
    const response = await fetch(host);
    const body = await response.text();
    assert(body.includes("<app-root></app-root>"));
  });

  it(`404`, async () => {
    const response = await fetch(posix.join(host, Math.random().toString()));
    const body = await response.text();
    assert(body.includes("<app-root></app-root>"));
  });
});
