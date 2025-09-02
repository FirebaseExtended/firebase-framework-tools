import { dirname, extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { readJSON } from "fs-extra";

// If being compiled with webpack, use non webpack require for these calls.
// (VSCode plugin uses webpack which by default replaces require calls
// with its own require, which doesn't work on files)
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const requireFunc =
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore prevent VSCE webpack from erroring on non_webpack_require
  // eslint-disable-next-line camelcase
  typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;

function dynamicImport(mod: string) {
    if (mod.startsWith("file://")) return import(mod);
    if (mod.startsWith("/")) return import(pathToFileURL(mod).toString());
    try {
        const path = requireFunc.resolve(mod);
        return import(pathToFileURL(path).toString());
    } catch(e) {
        return Promise.reject(e);
    }
}

// Only the fields being used are defined here
export interface PackageJson {
  main: string;
  type?: "commonjs" | "module";
}

export async function relativeRequire(dir: string, mod: string) {
    // If being compiled with webpack, use non webpack require for these calls.
    // (VSCode plugin uses webpack which by default replaces require calls
    // with its own require, which doesn't work on files)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const requireFunc: typeof require =
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore prevent VSCE webpack from erroring on non_webpack_require
      // eslint-disable-next-line camelcase
      typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore prevent VSCE webpack from erroring on non_webpack_require
    const path = requireFunc.resolve(mod, { paths: [dir] });

    let packageJson: PackageJson | undefined;
    let isEsm = extname(path) === ".mjs";
    if (!isEsm) {
      packageJson = await readJSON(
        join(dirname(path), "package.json"),
      ).catch(() => undefined);

      isEsm = packageJson?.type === "module";
    }

    if (isEsm) {
      // in case path resolves to a cjs file, use main from package.json
      if (extname(path) === ".cjs" && packageJson?.main) {
        return dynamicImport(join(dirname(path), packageJson.main));
      }

      return dynamicImport(pathToFileURL(path).toString());
    } else {
      return requireFunc(path);
    }
}
