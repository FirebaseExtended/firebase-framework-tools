import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import { incomingMessageFromExpress } from "../utils.js";
import { express } from "../express/index.js";

export const handle = async (req: Request, res: Response) => {
  const { handle } = await express;
  const incomingMessage = incomingMessageFromExpress(req);

  handle(incomingMessage, res);
};
