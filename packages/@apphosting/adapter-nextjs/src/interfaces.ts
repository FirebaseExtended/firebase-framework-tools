import type { RouteHas } from "next/dist/lib/load-custom-routes.js";

export interface RoutesManifestRewriteObject {
  beforeFiles?: RoutesManifestRewrite[];
  afterFiles?: RoutesManifestRewrite[];
  fallback?: RoutesManifestRewrite[];
}

export interface RoutesManifestRedirect {
  source: string;
  destination: string;
  locale?: false;
  internal?: boolean;
  statusCode: number;
  regex: string;
  has?: RouteHas[];
  missing?: RouteHas[];
}

export interface RoutesManifestRewrite {
  source: string;
  destination: string;
  has?: RouteHas[];
  missing?: RouteHas[];
  regex: string;
}

export interface RoutesManifestHeader {
  source: string;
  headers: { key: string; value: string }[];
  has?: RouteHas[];
  missing?: RouteHas[];
  regex: string;
}

// Next.js's exposed interface is incomplete here
export interface RoutesManifest {
  version: number;
  pages404: boolean;
  basePath: string;
  redirects: Array<RoutesManifestRedirect>;
  rewrites?: Array<RoutesManifestRewrite> | RoutesManifestRewriteObject;
  headers: Array<RoutesManifestHeader>;
  staticRoutes: Array<{
    page: string;
    regex: string;
    namedRegex?: string;
    routeKeys?: { [key: string]: string };
  }>;
  dynamicRoutes: Array<{
    page: string;
    regex: string;
    namedRegex?: string;
    routeKeys?: { [key: string]: string };
  }>;
  dataRoutes: Array<{
    page: string;
    routeKeys?: { [key: string]: string };
    dataRouteRegex: string;
    namedDataRouteRegex?: string;
  }>;
  i18n?: {
    domains?: Array<{
      http?: true;
      domain: string;
      locales?: string[];
      defaultLocale: string;
    }>;
    locales: string[];
    defaultLocale: string;
    localeDetection?: false;
  };
}

// The output bundle options are specified here
export interface OutputBundleOptions {
  /**
   * Path to the generated bundle.yaml file
   */
  bundleYamlPath: string;
  /**
   *  Path to where the base output directory (.apphosting) is generated
   */
  outputDirectoryBasePath: string;
  /**
   * Path to where the App's code sits in the output directory.
   * This will only be different from outputDirectoryPath in Monorepo scenerios.
   * For example if the monorepo app sits under the apps/next-app directory, this value will be .apphosting/apps/next-app
   */
  outputDirectoryAppPath: string;
  /**
   * Path to the generated server.js file generated relative to the output directory
   */
  serverFilePath: string;
  /**
   * Path to where the public directory is generated relative to the output directory
   */
  outputPublicDirectoryPath: string;
  /**
   * Path to where the static assets directory is generated relative to the output directory
   */
  outputStaticDirectoryPath: string;
}

// Metadata schema for bundle.yaml outputted by next.js adapter
export interface Metadata {
  adapterPackageName: string;
  adapterVersion: string;
  framework: string;
  frameworkVersion: string;
}
