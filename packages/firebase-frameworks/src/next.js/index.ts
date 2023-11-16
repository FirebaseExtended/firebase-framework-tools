import { parse } from "url";
import next from "next";
import LRU from "lru-cache";
import { Readable } from "stream";

import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import type { NextServer } from "next/dist/server/next.js";

const createServer = next.default;

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
    nextApp = createServer({
      dev: false,
      dir: process.cwd(),
      hostname: "0.0.0.0",
      port,
    });
    nextAppsLRU.set(key, nextApp!);
  }
  await nextApp!.prepare();
  const parsedUrl = parse(url, true);
  // Next.js needs to consume the body from the readable stream of the
  // incoming request. However, this is not possible in Cloud Functions
  // because the request was already read and the payload stored in the
  // `body` property. As a workaround we can proxy all the relevant Readable
  // methods to a Readable instance of the rawBody instead.
  if (req.rawBody instanceof Buffer) {
    const rawBodyReadable = Readable.from(req.rawBody);
    const reqProxy = new Proxy(req, {
        get(target, prop) {
          if (
            prop === "read" ||
            prop === "write" ||
            prop === "pipe" ||
            prop === "on" ||
            prop === "closed" ||
            prop === "setHeader" ||
            prop === "writable" ||
            prop === "req" ||
            prop === "destroy" ||
            prop === "destroyed" ||
            prop === "push" ||
            prop === "emit" ||
            prop === "domain" ||
            prop === "writableErrored" ||
            prop === "readableErrored" ||
            prop === "_read" ||
            prop === "_events" ||
            prop === "_eventsCount" ||
            prop === "_readableState" ||
            prop === "_readableState" ||
            prop === "_writableState" ||
            prop === "_destroy" ||
            prop === Symbol.asyncIterator ||
            prop === Symbol.asyncDispose ||
            (typeof prop === "symbol" &&
              prop.toString() === "Symbol(nodejs.stream.writable)")
          ) {
            return Reflect.get(rawBodyReadable, prop);
          } else {
            return Reflect.get(target, prop);
          }
        },
    });
    nextApp!.getRequestHandler()(reqProxy, res, parsedUrl);
  } else {
    nextApp!.getRequestHandler()(req, res, parsedUrl);
  }
};
