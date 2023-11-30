import { Request } from "firebase-functions/v2/https";
import { IncomingMessage } from "node:http";
import { Socket } from "node:net";

export async function isUsingFirebaseJsSdk() {
  if (!process.env.__FIREBASE_DEFAULTS__) return false;
  try {
    await import("firebase/app");
    return true;
  } catch (e) {
    return false;
  }
}

export function getProxyRequest(req: Request): IncomingMessage {
  const proxyRequest = new IncomingMessage(new Socket());

  proxyRequest.push(req.rawBody);
  proxyRequest.push(null);

  proxyRequest.headers = req.headers;
  proxyRequest.headersDistinct = req.headersDistinct;
  proxyRequest.httpVersion = req.httpVersion;
  proxyRequest.httpVersionMajor = req.httpVersionMajor;
  proxyRequest.httpVersionMinor = req.httpVersionMinor;
  proxyRequest.method = req.method;
  proxyRequest.rawHeaders = req.rawHeaders;
  proxyRequest.rawTrailers = req.rawTrailers;
  proxyRequest.trailers = req.trailers;
  proxyRequest.trailersDistinct = req.trailersDistinct;
  proxyRequest.url = req.url;

  return proxyRequest;
}
