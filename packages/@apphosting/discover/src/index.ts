import fsExtra from "fs-extra";
import { MockFileSystem } from "./interfaces.js";
import { discoverNodeJSFrameworks } from "./nodejs/index.js";
import { discoverPythonFrameworks } from "./python/index.js";
import { discoverDartFrameworks } from "./dart/index.js";

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
    : fsExtra;

  return (await Promise.all([
    discoverNodeJSFrameworks(root, fs, path),
    discoverPythonFrameworks(),
    discoverDartFrameworks(),
  ])).flat();

}
