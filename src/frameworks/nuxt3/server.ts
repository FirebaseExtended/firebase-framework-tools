import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';
import { pathToFileURL } from 'url';

const nuxt = import(`${pathToFileURL(process.cwd())}/index.mjs`);

export const handle = async (req: Request, res: Response) => {
    const { handle } = await nuxt;
    handle(req, res);
};