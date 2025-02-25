import { AdapterMetadata, MiddlewareManifest } from "./interfaces.js";
import { loadRouteManifest, writeRouteManifest, loadMiddlewareManifest } from "./utils.js";

/**
 * Adds the route overrides to the route manifest.
 * @param appPath The path to the app directory.
 * @param distDir The path to the dist directory.
 * @param adapterMetadata The adapter metadata.
 */
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
