import { parse } from "url";
import createNextServer from "next";
import LRU from "lru-cache";

import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import type { NextServer } from "next/dist/server/next.js";

const nextAppsLRU = new LRU<string, NextServer>({
  // TODO tune this
  max: 3,
  allowStale: true,
  updateAgeOnGet: true,
  dispose: (server) => {
    server.close();
  },
});

export const handle = async (req: Request, res: Response) => {
  const { hostname, protocol, url } = req;
  const port = protocol === "https" ? 443 : 80;
  const key = [hostname, port].join(":");
  // I wish there was a better way to do this, but it seems like this is the
  // way to go. Should investigate more if we can get hostname/port to be
  // dynamic for middleware.
  let nextApp = nextAppsLRU.get(key);
  if (!nextApp) {
    // @ts-expect-error - Next.js doesn't export the custom server function with proper types
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    nextApp = createNextServer({
      dev: false,
      dir: process.cwd(),
      hostname: "0.0.0.0",
      port,
    });
    nextAppsLRU.set(key, nextApp!);
  }
  await nextApp!.prepare();
  const parsedUrl = parse(url, true);
  nextApp!.getRequestHandler()(req, res, parsedUrl);
};
