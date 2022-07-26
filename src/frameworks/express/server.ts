import { pathToFileURL } from "url";

const express = import(`${pathToFileURL(process.cwd())}/bootstrap.js`);

export const handle = async (req: Request, res: Response) => {
    const { handle } = await express;
    handle(req, res);
};
