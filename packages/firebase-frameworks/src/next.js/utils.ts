import { request as httpRequest, Agent } from "http";
import { IncomingMessage, ServerResponse } from "http";

/**
 * This is a simplified version of the CLI implementation:
 * https://github.com/firebase/firebase-tools/blob/master/src/frameworks/utils.ts#L160C17-L160C28
 *
 * The only difference is that this only handles the host, not a request handler.
 */
export function simpleProxy(
  nextServerHost: string,
): (req: IncomingMessage, res: ServerResponse, next: () => void) => void {
  const agent = new Agent({ keepAlive: true });
  // If the path is a the auth token sync URL pass through to Cloud Functions
  const firebaseDefaultsJSON = process.env.__FIREBASE_DEFAULTS__;
  const authTokenSyncURL: string | undefined =
    firebaseDefaultsJSON && JSON.parse(firebaseDefaultsJSON)._authTokenSyncURL;

  return (originalReq: IncomingMessage, originalRes: ServerResponse, next: () => void): void => {
    const { method, headers, url: path } = originalReq;
    if (!method || !path) {
      originalRes.end();
      return;
    }
    if (path === authTokenSyncURL) {
      return next();
    }

    const { hostname, port, protocol, username, password } = new URL(nextServerHost);
    const host = `${hostname}:${port}`;
    const auth = username || password ? `${username}:${password}` : undefined;
    const opts = {
      agent,
      auth,
      protocol,
      hostname,
      port,
      path,
      method,
      headers: {
        ...headers,
        host,
        "X-Forwarded-Host": headers.host,

        // TODO: find out real ip
        // "X-Real-IP": headers.?,
      },
    };

    const req = httpRequest(opts, (response) => {
      const { statusCode, statusMessage, headers } = response;
      if (statusCode === 404) {
        next();
      } else {
        originalRes.writeHead(statusCode!, statusMessage, headers);
        response.pipe(originalRes);
      }
    });

    originalReq.pipe(req);

    req.on("error", (err) => {
      console.log("Error encountered while proxying request:", method, path, err);
      originalRes.end();
    });
  };
}
