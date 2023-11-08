type Server =
  | typeof import("./angular/index.js")
  | typeof import("./express/index.js")
  | typeof import("./next.js/index.js")
  | typeof import("./nuxt/index.js")
  | typeof import("./nuxt3/index.js")
  | typeof import("./sveltekit/index.js")
  | typeof import("./_devMode/index.js")
  | typeof import("./angular/firebase-aware.js")
  | typeof import("./express/firebase-aware.js")
  | typeof import("./next.js/firebase-aware.js")
  | typeof import("./nuxt/firebase-aware.js")
  | typeof import("./nuxt3/firebase-aware.js")
  | typeof import("./_devMode/firebase-aware.js");

import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

import { isUsingFirebaseJsSdk } from "./utils.js";

const dirname = process.env.__FIREBASE_FRAMEWORKS_ENTRY__;
const usingFirebaseJsSdk = await isUsingFirebaseJsSdk();
const basename = usingFirebaseJsSdk ? "firebase-aware" : "index";

// .env isn't parsed for Cloud Functions discovery during deploy, handle undefined
const { handle: frameworkHandle } = dirname
  ? ((await import(`./${dirname}/${basename}.js`)) as Server)
  : { handle: undefined };

// TODO move to middleware
const firebaseAware = usingFirebaseJsSdk ? await import("./firebase-aware.js") : undefined;

export const handle = frameworkHandle
  ? firebaseAware?.handleFactory(frameworkHandle) || frameworkHandle
  : (req: Request, res: Response) => {
      // TODO log some sort of error here
      res.end();
    };
