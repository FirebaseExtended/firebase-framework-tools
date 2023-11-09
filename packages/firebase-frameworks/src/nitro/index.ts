import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

const nuxt = import("nitro-output/index.mjs" as any);

export const handle = async (req: Request, res: Response) => {
  const { handler } = await nuxt;
  handler(req, res);
};
