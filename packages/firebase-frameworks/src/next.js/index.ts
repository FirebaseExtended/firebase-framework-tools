import { parse } from "url";
import createNextServer from "next";

import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import type { NextServer } from "next/dist/server/next.js";
import { incomingMessageFromExpress } from "../utils.js";

// @ts-expect-error - Next.js doesn't export the custom server function with proper types
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const nextApp: NextServer = createNextServer({
  dev: false,
  dir: process.cwd(),
  hostname: "0.0.0.0",
  port: 8080,
});

export const handle = async (req: Request, res: Response): Promise<void> => {
  await nextApp.prepare();
  const parsedUrl = parse(req.url, true);
  const incomingMessage = incomingMessageFromExpress(req);

  // The following modifications are required to prevent an ECONNRESET error
  // when proxying external requests in the Firebase environment.

  // 1. Disable keep-alive connections. In a serverless environment,
  //    connection reuse is unreliable and can lead to errors.
  incomingMessage.headers.connection = "close";

  // 2. Remove the original host header. `http-proxy` automatically forwards this
  //    as `x-forwarded-host`, which can cause a security rejection when a
  //    request from a Google IP contains a `localhost` host. This mirrors the
  //    behavior of the working proxy in `firebase-tools`.
  delete incomingMessage.headers["host"];

  await nextApp.getRequestHandler()(incomingMessage, res, parsedUrl);
};
