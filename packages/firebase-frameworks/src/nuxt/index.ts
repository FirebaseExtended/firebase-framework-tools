import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

// @ts-expect-error having trouble with nuxt types
import { loadNuxt } from "nuxt";

const nuxt = loadNuxt("start");

export const handle = async (req: Request, res: Response) => {
  const { render } = await nuxt;
  render(req, res);
};
