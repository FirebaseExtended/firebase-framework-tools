import { AdapterMetadata } from "@apphosting/common/dist/index.js";
import { loadRouteManifest, writeRouteManifest } from "./utils.js";

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
    ],
    regex: "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$",
  });

  await writeRouteManifest(appPath, distDir, routeManifest);
}
