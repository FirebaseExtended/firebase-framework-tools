import * as assert from "assert";
import { posix } from "path";

export const host = process.env.HOST;
if (!host) {
  throw new Error("HOST environment variable expected");
}

before(() => {});

describe("image optimization", () => {
  it("should bypass Next.js image optimization by rewriting _next/image requests", async () => {
    // Use a known image with specific dimensions
    const originalImageUrl = "https://image-optimization-test.vercel.app/frog.jpg";
    const nextImageUrl = posix.join(
      host,
      `_next/image?url=${encodeURIComponent(originalImageUrl)}&w=128&q=75`,
    );

    console.log(`nextImageUrl: ${nextImageUrl}`);

    const originalResponse = await fetch(originalImageUrl);
    const nextImageResponse = await fetch(nextImageUrl);

    assert.ok(originalResponse.ok, "Original image request should succeed");
    assert.ok(nextImageResponse.ok, "Next.js image request should succeed");

    // Both should have the same content type
    const originalContentType = originalResponse.headers.get("content-type");
    const nextImageContentType = nextImageResponse.headers.get("content-type");
    assert.equal(nextImageContentType, originalContentType, "Content types should match");

    // Both should have the same content length, proving no optimization occurred
    const originalContentLength = originalResponse.headers.get("content-length");
    const nextImageContentLength = nextImageResponse.headers.get("content-length");
    assert.equal(
      nextImageContentLength,
      originalContentLength,
      "Content lengths should match, indicating no optimization occurred",
    );

    // Compare the actual image data to be absolutely certain
    const [originalBuffer, nextImageBuffer] = await Promise.all([
      originalResponse.arrayBuffer(),
      nextImageResponse.arrayBuffer(),
    ]);

    assert.equal(
      Buffer.from(originalBuffer).toString("base64"),
      Buffer.from(nextImageBuffer).toString("base64"),
      "Image data should be identical, confirming bypass of Next.js image optimization",
    );
  });
});
