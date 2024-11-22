import { z } from "zod";
import { URL } from "node:url";

// options to help generate output directory
export interface OutputBundleOptions {
  bundleYamlPath: string;
  serverFilePath: string;
  browserDirectory: string;
  needsServerGenerated: boolean;
}

// Environment variable schema for bundle.yaml outputted by angular adapter
export interface EnvironmentVariable {
  variable: string;
  value: string;
  availability: Availability.Runtime; // currently support RUNTIME only
}

// defines whether the environment variable is buildtime, runtime or both
export enum Availability {
  Buildtime = "BUILD",
  Runtime = "RUNTIME",
}

// Metadata schema for bundle.yaml outputted by angular adapter
export interface Metadata {
  adapterPackageName: string;
  adapterVersion: string;
  framework: string;
  frameworkVersion: string;
}

// valid manifest schema
export interface ValidManifest {
  errors: string[];
  warnings: string[];
  outputPaths: OutputPaths;
  prerenderedRoutes?: string[] | undefined;
}

// valid output paths schema
export interface OutputPaths {
  root: URL;
  server?: URL;
  browser: URL;
}

// custom ZodType to verify if input is an URL
const url = z.custom<URL>((data: any) => {
  try {
    return Boolean(new URL(data));
  } catch (e) {
    return false;
  }
});

// use zod to verify the build manifest schema
export const buildManifestSchema = z.object({
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  outputPaths: z.object({
    root: url,
    server: z.optional(url),
    browser: url,
  }),
  // angular v18 has an array type and v19 has an object type
  // We should uncomment this when we need to use prerenderedRoutes
  // prerenderedRoutes: z.optional(z.union([z.string().array(), z.object({})])),
});
