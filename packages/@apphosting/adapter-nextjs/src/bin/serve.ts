import { createServer } from "http";
import { parse } from "url";
import path from "path";
import fs from "fs";

// 1. SET ENV VARS
// @ts-ignore
process.env['NODE_ENV'] = "production";
process.env['NEXT_PRIVATE_MINIMAL_MODE'] = "1";

async function start() {
  // @ts-ignore
  const serverDir = __dirname;

  // 2. IMPORT NEXT.JS INTERNALS (REQUIRED FOR PPR)
  // We need this symbol to attach the postponed state
  const nextMetaPath = require.resolve("next/dist/server/request-meta", { paths: [serverDir] });
  const { NEXT_REQUEST_META } = require(nextMetaPath);

  // 3. LOAD CONFIG
  const configPath = path.join(serverDir, "firebase-next-config.json");
  const rawConfig = fs.readFileSync(configPath, 'utf-8');
  const buildContext = JSON.parse(rawConfig);

  // Helper to find the postponed state for a path
  const getPostponedState = (path: string) => {
    // 1. Try exact match
    let prerender = buildContext.outputs.prerenders.find((it: any) => it.pathname === path);
    
    // 2. Try dynamic match
    if (!prerender) {
      const dynamicMatch = buildContext.routes.dynamicRoutes.find((it: any) => 
        path.match(new RegExp(it.sourceRegex))
      )?.source;
      prerender = buildContext.outputs.prerenders.find((it: any) => it.pathname === dynamicMatch);
    }

    return prerender?.fallback?.postponedState;
  };

  // 4. SETUP SERVER
  const nextPath = require.resolve("next/dist/server/next-server", { paths: [serverDir] });
  const NextServer = require(nextPath).default;
  
  const server = new NextServer({
    dir: serverDir,
    hostname: '0.0.0.0',
    port: parseInt(process.env.PORT || "8080"),
    conf: buildContext.config,
  });

  await server.prepare();
  const requestHandler = server.getRequestHandler();

  createServer(async (req: any, res: any) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      if (req.headers['next-resume'] === '1' && pathname) {
        const postponed = getPostponedState(pathname);
        if (postponed) {
          console.log(`⚡️ Injecting Postponed State for ${pathname}`);
          
          req[NEXT_REQUEST_META] = { 
            postponed: postponed 
          };
        }
      }

      if (!req.headers['x-matched-path']) {
        req.headers['x-matched-path'] = pathname;
      }

      await requestHandler(req, res, parsedUrl);
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end("Internal Error");
    }
  }).listen(parseInt(process.env.PORT || "8080"));
}

start();