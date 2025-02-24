import { loadRouteManifest, writeRouteManifest } from "./utils.js";

interface Header {
  key: string;
  value: string;
}

const GLOBAL_APPHOSTING_HEADERS: Header[] = [
  {
    key: "x-fah-adapter",
    value: "nextjs",
  },
];

export async function addRouteOverrides(appPath: string, distDir: string) {
  const routeManifest = await loadRouteManifest(appPath, distDir);
  routeManifest.headers.push({
    source: "/:path*",
    headers: GLOBAL_APPHOSTING_HEADERS,
    regex: "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$",
  });

  await writeRouteManifest(appPath, distDir, routeManifest);
}
