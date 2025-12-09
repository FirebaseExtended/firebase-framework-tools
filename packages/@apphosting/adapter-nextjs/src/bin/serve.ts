import { createServer } from "http";
import { parse } from "url";
import path from "path";
import fs from "fs";

// 1. SET ENV VARS
// @ts-ignore
process.env['NODE_ENV'] = "production";
process.env['NEXT_PRIVATE_MINIMAL_MODE'] = "1";

console.log("🚀 Starting Native Adapter...");

async function start() {
  const currentDir = process.cwd();

  try {
    // 2. Load the Serialized Config
    // This file was created by adapter.ts and copied by build.ts
    const configPath = path.join(currentDir, "firebase-next-config.json");
    
    console.log(`📥 Loading config from ${configPath}`);
    const rawConfig = fs.readFileSync(configPath, 'utf-8');
    const buildContext = JSON.parse(rawConfig);

    // 3. Resolve Next.js Server
    const nextPath = require.resolve("next/dist/server/next-server", { paths: [currentDir] });
    const NextServer = require(nextPath).default;
    // 4. Initialize Server with the loaded config
    const server = new NextServer({
      dir: currentDir,
      hostname: '0.0.0.0',
      port: parseInt(process.env.PORT || "8080"),
      conf: buildContext.config // <--- Pass the simple JSON object
    });

    console.log("⏳ Preparing server...");
    const requestHandler = server.getRequestHandler();
    await server.prepare();

    // 5. Start HTTP Listener
    createServer(async (req: any, res: any) => {
      try {
        const parsedUrl = parse(req.url, true);

        // FAKE PROXY HEADER (For local testing only)
        if (!req.headers['x-matched-path']) {
          req.headers['x-matched-path'] = parsedUrl.pathname;
        }

        await requestHandler(req, res, parsedUrl);
      } catch (err) {
        console.error("Request Error:", err);
        res.statusCode = 500;
        res.end("Internal Error");
      }
    }).listen(parseInt(process.env.PORT || "8080"), () => {
      console.log(`> Ready on http://localhost:${process.env.PORT || 8080}`);
    });

  } catch (e) {
    console.error("❌ Critical Error:", e);
    process.exit(1);
  }
}

start();