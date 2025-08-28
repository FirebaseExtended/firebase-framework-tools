import { readFile, readJson, pathExists } from "fs-extra";
import { discoverNodeJSFrameworks } from "./nodejs/index.js";
import { discoverPythonFrameworks } from "./python/index.js";
import { discoverDartFrameworks } from "./dart/index.js";
import { MockFileSystem } from "./interfaces.js";

/**
 * Deterministically discover frameworks!
 * @public
 */
export async function discover(directory: string, options: { githubRepo?: string, githubToken?: string } = {}) {
  if (options.githubRepo && !options.githubToken) throw new Error("needs token");

  const path = await (options.githubRepo ? import("node:path") : import("node:path/posix"));

  const root = options.githubRepo ? directory : path.resolve(directory);

  const fs: MockFileSystem = options.githubRepo
    ? {
        readFile: async function (path: string) {
          const response = await fetch(
            `https://api.github.com/repos/${options.githubRepo}/contents/${path}`,
            {
              headers: {
                authorization: `Bearer ${options.githubToken}`,
                accept: "application/vnd.github.raw",
              },
            },
          );
          if (!response.ok) throw new Error("fail.");
          return Buffer.from(await response.text());
        },
        pathExists: async function (path: string) {
          const response = await fetch(
            `https://api.github.com/repos/${options.githubRepo}/contents/${path}`,
            {
              method: "HEAD",
              headers: {
                authorization: `Bearer ${options.githubToken}`,
                accept: "application/vnd.github.raw",
              },
            },
          );
          return response.ok;
        },
        readJson: async function (path: string) {
          const response = await fetch(
            `https://api.github.com/repos/${options.githubRepo}/contents/${path}`,
            {
              headers: {
                authorization: `Bearer ${options.githubToken}`,
                accept: "application/vnd.github.raw",
              },
            },
          );
          if (!response.ok) throw new Error("fail.");
          return await response.json();
        },
      }
    : {
      readFile, pathExists, readJson
    };

  return (await Promise.all([
    discoverNodeJSFrameworks(root, fs, path),
    discoverPythonFrameworks(),
    discoverDartFrameworks(),
  ])).flat();

}

/**
 * @public
 */
export type Command = [string, string[]];

/**
 * @public
 */
export interface DiscoveredFramework {
  root_directory: string;
  id: string;
  version?: string;
  single_page_app: boolean;
  dist_directory: string;
  packageManager: {
    id: string;
    version?: string;
    metadata: Record<string, any>;
  }
  monorepo_tooling?: Record<string, any>;
  platform: {
    id: RUNTIME;
    version: string;
  }
  commands: {
    install: Command[];
    build: Command[];
    dev: Command;
    serve?: Command;
  }
  known_adapters?: Partial<Record<TARGET_PLATFORM, Adapter>>;
  discoveryComplete: boolean;
  stepsNeededForDiscovery?: Array<"install" | "build">;
};

/**
 * @public
 */
export interface Adapter {
    id: string;
    channel: "community" | "experimental" | "official";
};

/**
 * @public
 */
export type RUNTIME = "nodejs" | "python" | "dart";

/**
 * @public
 */
export type TARGET_PLATFORM = "firebase";
