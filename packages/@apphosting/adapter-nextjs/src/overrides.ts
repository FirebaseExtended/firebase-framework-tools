import { MiddlewareManifest } from "next/dist/build/webpack/plugins/middleware-plugin.js";
import { AdapterMetadata } from "./interfaces.js";
import { loadRouteManifest, writeRouteManifest, loadMiddlewareManifest } from "./utils.js";

export async function addRouteOverrides(
  appPath: string,
  distDir: string,
  adapterMetadata: AdapterMetadata,
) {
  const middlewareManifest = loadMiddlewareManifest(appPath, distDir);
  const routeManifest = loadRouteManifest(appPath, distDir);
  routeManifest.headers.push({
    source: "/:path*",
    headers: [
      {
        key: "x-fah-adapter",
        value: `nextjs-${adapterMetadata.adapterVersion}`,
      },
      ...(middlewareExists(middlewareManifest)
        ? [
            {
              key: "x-fah-middleware",
              value: "true",
            },
          ]
        : []),
    ],
    regex: "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$",
  });

  await writeRouteManifest(appPath, distDir, routeManifest);
}

function middlewareExists(middlewareManifest: MiddlewareManifest) {
  return Object.keys(middlewareManifest.middleware).length > 0;
}
