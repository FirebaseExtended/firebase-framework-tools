import { parse } from 'url';
import { default as next } from 'next';
import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';

const nextApp = next({
    dev: false,
    dir: process.cwd(),
});
const nextAppPrepare = nextApp.prepare();

export const handle = async (req: Request, res: Response) => {
    const parsedUrl = parse(req.url, true);
    await nextAppPrepare;
    nextApp.getRequestHandler()(req, res, parsedUrl);
};
