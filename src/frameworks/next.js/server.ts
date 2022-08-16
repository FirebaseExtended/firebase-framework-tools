import { parse } from 'url';
import { default as next } from 'next';
import type { Request } from '../../server/index.js';
import type { Response } from 'express';

const nextApp = next({
    dev: false,
    dir: process.cwd(),
    minimalMode: true,
});
const nextAppPrepare = nextApp.prepare();

export const handle = async (req: Request, res: Response) => {
    const fauxHost = 'http://firebase-frameworks';
    const url = new URL(`${fauxHost}${req.url}`);
    url.searchParams.delete('__firebaseAppName');
    if (req.firebaseApp) url.searchParams.set('__firebaseAppName', req.firebaseApp.name);
    const parsedUrl = parse(url.toString().slice(fauxHost.length), true);
    await nextAppPrepare;
    nextApp.getRequestHandler()(req, res, parsedUrl);
};
