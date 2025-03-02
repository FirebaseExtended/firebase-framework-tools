// Use a known image with specific dimensions
const originalImageUrl = "https://image-optimization-test.vercel.app/frog.jpg";
const nextImageUrl = `http://localhost:3000/_next/image?url=${encodeURIComponent(
  originalImageUrl,
)}&w=128&q=75`;

const originalResponse = await fetch(originalImageUrl);
const nextImageResponse = await fetch(nextImageUrl);

// Both should have the same content type
const originalContentType = originalResponse.headers.get("content-type");
const nextImageContentType = nextImageResponse.headers.get("content-type");

console.log(`originalContentType: ${originalContentType}`);
console.log(`nextImageContentType: ${nextImageContentType}`);

// Both should have the same content length, proving no optimization occurred
const originalContentLength = originalResponse.headers.get("content-length");
const nextImageContentLength = nextImageResponse.headers.get("content-length");

console.log(`originalContentLength: ${originalContentLength}`);
console.log(`nextImageContentLength: ${nextImageContentLength}`);
