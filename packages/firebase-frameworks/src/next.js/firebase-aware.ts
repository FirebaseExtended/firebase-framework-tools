import { handle as originalHandle } from "./index.js";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

export const handle = async (req: Request, res: Response) => {
  const fauxHost = "http://firebase-frameworks";
  const url = new URL(`${fauxHost}${req.url}`);
  url.searchParams.delete("__firebaseAppName");
  if (res.locals.firebaseApp)
    url.searchParams.set("__firebaseAppName", res.locals.firebaseApp.name);
  req.url = url.toString().slice(fauxHost.length);
  await originalHandle(req, res);
};
