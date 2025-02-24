import { AdapterMetadata } from "./interfaces.js";
import { loadRouteManifest, writeRouteManifest, middlewareExists } from "./utils.js";

export async function addRouteOverrides(
  appPath: string,
  distDir: string,
  adapterMetadata: AdapterMetadata,
) {
  const routeManifest = await loadRouteManifest(appPath, distDir);
  routeManifest.headers.push({
    source: "/:path*",
    headers: [
      {
        key: "x-fah-adapter",
        value: `nextjs-${adapterMetadata.adapterVersion}`,
      },
      ...(middlewareExists(appPath, distDir)
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
