import { pathToFileURL } from "url";
import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';

const express = import(`${pathToFileURL(process.cwd())}/bootstrap.js`);

export const handle = async (req: Request, res: Response) => {
    const { handle } = await express;
    handle(req, res);
};
