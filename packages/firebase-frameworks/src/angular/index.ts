import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

import { basename, join, normalize, relative } from "path";
import { createReadStream, existsSync } from "fs";
import { mediaTypes } from "@hapi/accept";
import { pathToFileURL } from "url";
import { incomingMessageFromExpress } from "../utils.js";
import { request as httpRequest } from "http";

const LOCALE_FORMATS = [/^ALL_[a-z]+$/, /^[a-z]+_ALL$/, /^[a-z]+(_[a-z]+)?$/];
const NG_BROWSER_OUTPUT_PATH = process.env.__NG_BROWSER_OUTPUT_PATH__;

const expressHandle = new Promise<[(typeof import("../express/index.js"))["handle"]?, string?]>(
  (resolve) => {
    setTimeout(() => {
      // We could just change the PORT to something else, but it seems you can't fire up two
      // Angular Express servers listening to the same port for whatever reason... maybe we can
      // find the root cause.
      // In the meantime use a socket.
      const port = process.env.PORT;
      const socket = `express.sock`;
      process.env.PORT = socket;
      // can't import from express, it's too lazy. alt we could export/import app from bootstrap
      import(
        `${pathToFileURL(process.cwd())}/dist/firebase-app-hosting-angular/server/server.mjs`
      ).then(({ app }) => {
        setTimeout(() => {
          if (existsSync(socket)) {
            resolve([undefined, socket]);
          }
          resolve([app()]);
        }, 10); // don't like the arbitrary wait here, is there a better way?
        process.env.PORT = port;
      });
    }, 0);
  },
);

export const handle = async (req: Request, res: Response) => {
  if (basename(req.path) === "__image__") {
    const { src, locale = "" } = req.query;
    if (
      typeof src !== "string" ||
      typeof locale !== "string" ||
      (!!locale && !LOCALE_FORMATS.some((it) => locale.match(it))) ||
      !NG_BROWSER_OUTPUT_PATH
    )
      return res.sendStatus(404);
    const normalizedPath = normalize(join(NG_BROWSER_OUTPUT_PATH, locale, src));
    if (relative(NG_BROWSER_OUTPUT_PATH, normalizedPath).startsWith(".."))
      return res.sendStatus(404);
    const { default: sharp } = await import("sharp");
    const width = typeof req.query.width === "string" ? parseInt(req.query.width) : undefined;
    const accepts = mediaTypes(req.headers.accept);
    const format = accepts.includes("image/webp") ? "webp" : undefined;
    const pipeline = sharp().resize({ width });
    if (format) pipeline[format]();
    // TODO allow override
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
    res.setHeader("Vary", "Accept, Accept-Encoding");
    createReadStream(normalizedPath).pipe(pipeline).pipe(res);
  } else {
    const [handle, socketPath] = await expressHandle;
    if (socketPath) {
      const incomingMessage = incomingMessageFromExpress(req);
      const proxyRequest = httpRequest({ ...incomingMessage, socketPath }, (response) => {
        const { statusCode, statusMessage, headers } = response;
        if (!statusCode) {
          console.error("No status code.");
          res.end(500);
        }
        res.writeHead(statusCode!, statusMessage, headers);
        response.pipe(res);
      });
      req.pipe(proxyRequest);
      proxyRequest.on("error", (err) => {
        console.error(err);
        res.end(500);
      });
    } else {
      // TODO fix the types
      handle!(req, res);
    }
  }
};
