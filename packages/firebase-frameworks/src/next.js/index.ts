import LRU from "lru-cache";

import { ChildProcessWithoutNullStreams, spawn } from "child_process";

import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import { simpleProxy } from "./utils.js";

type LRUCache = {
  host: string;
  nextStart: ChildProcessWithoutNullStreams;
};

const nextAppsLRU = new LRU<string, LRUCache>({
  // TODO tune this
  max: 3,
  allowStale: true,
  updateAgeOnGet: true,
  dispose: ({ nextStart }) => {
    nextStart.kill();
  },
});

const INITIAL_PORT = 3000;

export const handle = async (req: Request, res: Response): Promise<void> => {
  const { hostname } = req;

  // I wish there was a better way to do this, but it seems like this is the
  // way to go. Should investigate more if we can get hostname/port to be
  // dynamic for middleware.
  let nextApp = nextAppsLRU.get(hostname);

  if (!nextApp) {
    // use a new port if there's already a server running in this instance
    const port = INITIAL_PORT + nextAppsLRU.size;

    const nextStartReady = new Promise<LRUCache>((resolve, reject) => {
      const nextStart = spawn("npx", ["next", "start", "--port", String(port)], {
        cwd: process.cwd(),
      });

      nextStart.stdout.on("data", (data: string | Uint8Array) => {
        process.stdout.write(data);
        const match = /(http:\/\/.+:\d+)/.exec(data.toString());

        if (match) {
          resolve({
            host: match[1],
            nextStart,
          });
        }
      });

      nextStart.stderr.on("data", (data: string | Uint8Array) => {
        process.stderr.write("err");
        process.stderr.write(data);
      });

      nextStart.on("exit", reject);
    });

    const hostAndStartProcess = await nextStartReady;

    nextAppsLRU.set(hostname, hostAndStartProcess);

    nextApp = hostAndStartProcess;
  }

  void simpleProxy(nextApp.host)(req, res, req.next!);
};
