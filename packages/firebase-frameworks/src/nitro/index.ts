import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

// @ts-expect-error should add types for this
const nuxt = import("nitro-output/index.mjs");

export const handle = async (req: Request, res: Response) => {
  const { handler } = await nuxt;
  handler(req, res);
};
