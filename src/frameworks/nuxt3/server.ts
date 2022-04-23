import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';

const nuxt = import(`${process.cwd()}/index.mjs`);

export const handle = async (req: Request, res: Response) => {
    const { handle } = await nuxt;
    handle(req, res);
};