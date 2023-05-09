import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';

import { handle as expressHandle } from '../express/index.js';
import { basename, join, normalize, relative } from 'path';
import { createReadStream } from 'fs';
import { mediaTypes } from '@hapi/accept';

const LOCALE_FORMATS = [/^ALL_[a-z]+$/, /^[a-z]+_ALL$/, /^[a-z]+(_[a-z]+)?$/];

export const handle = async (req: Request, res: Response) => {
    if (basename(req.path) === '__image__') {
        const src = req.query.src;
        if (typeof src !== "string") return res.sendStatus(404);
        const locale = req.query.locale || "";
        if (typeof locale !== "string") return res.sendStatus(404);
        if (!LOCALE_FORMATS.some(it => locale.match(it))) return res.sendStatus(404);
        const serveFrom = `./${process.env.__NG_BROWSER_OUTPUT_PATH__}`;
        const normalizedPath = normalize(join(serveFrom, locale, src));
        if (relative(serveFrom, normalizedPath).startsWith("..")) return res.sendStatus(404);
        const { default: sharp} = await import("sharp");
        const width = typeof req.query.width === "string" ? parseInt(req.query.width) : undefined;
        const accepts = mediaTypes(req.headers.accept);
        const format = accepts.includes('image/webp') ? 'webp' : undefined;
        let pipeline = sharp().resize({ width });
        if (format) pipeline[format]();
        // TODO allow override
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        res.setHeader('Vary', 'Accept, Accept-Encoding');
        createReadStream(normalizedPath).pipe(pipeline).pipe(res);
    } else {
        await expressHandle(req, res);
    }
};
