import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

import { handle as expressHandle } from "../express/index.js";
import { basename, join, normalize, relative } from "path";
import { createReadStream } from "fs";
import { mediaTypes } from "@hapi/accept";

const LOCALE_FORMATS = [/^ALL_[a-z]+$/, /^[a-z]+_ALL$/, /^[a-z]+(_[a-z]+)?$/];
const NG_BROWSER_OUTPUT_PATH = process.env.__NG_BROWSER_OUTPUT_PATH__;

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
    await expressHandle(req, res);
  }
};
