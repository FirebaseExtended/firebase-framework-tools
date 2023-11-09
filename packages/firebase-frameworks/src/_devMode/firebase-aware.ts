import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

export const handle = (_: Request, res: Response) => {
  res.sendStatus(404);
};
