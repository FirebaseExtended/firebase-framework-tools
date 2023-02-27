import { parse } from 'url';
import http from "http";
import { default as next } from "next";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import LRU from "lru-cache";
import { NextServer } from "next/dist/server/next.js";
import { default as nextServerConfig } from "next/dist/server/config.js";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const nextAppsLRU = new LRU<string, NextServer>({
  // TODO tune this
  max: 3,
  allowStale: true,
  updateAgeOnGet: true,
  dispose: (server) => {
    server.close();
  },
});

export const handle = async (req: Request, res: Response) => {
  const { hostname, protocol, url } = req;
  const port = protocol === "https" ? 443 : 80;
  const key = [hostname, port].join(":");
  // I wish there was a better way to do this, but it seems like this is the
  // way to go. Should investigate more if we can get hostname/port to be
  // dynamic for middleware.
  let nextApp = nextAppsLRU.get(key);
  const isDevMode = process.env.FRAMEWORKS_DEV_MODE === "true";
  const listenPort = isDevMode ? 3008 : undefined;
  if (!nextApp) {
    // TODO use dynamic directory name (set an environment variable with folder name?)
    const dir = isDevMode ? "../../../hosting" : process.cwd();
    // @ts-ignore
    const loadConfig = nextServerConfig.default;
    const config = await loadConfig(PHASE_DEVELOPMENT_SERVER, dir, null);
    nextApp = next({
      dev: isDevMode,
      dir,
      hostname,
      port,
      conf: {
        ...config,
        assetPrefix: isDevMode ? `http://localhost:${listenPort}` : undefined,
      },
    });
    nextAppsLRU.set(key, nextApp);
  }

  await nextApp.prepare();

  if (isDevMode) {
    http
      .createServer((req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        return nextApp?.getRequestHandler()(req, res, parsedUrl);
      })
      .listen(listenPort, "localhost");
  }

  const parsedUrl = parse(url, true);
  nextApp.getRequestHandler()(req, res, parsedUrl);
};
