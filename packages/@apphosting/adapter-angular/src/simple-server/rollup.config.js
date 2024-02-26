import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "rollup-plugin-commonjs";
import path from "path";

import { execSync } from "child_process";

const NPM_ROOT = execSync("npm root").toString().trim();
export default {
  input: "server.mjs",
  output: {
    file: "bundled_server.mjs",
    format: "es",
  },
  plugins: [
    resolve({ preferBuiltins: true }),
    json(),
    commonjs({
      include: path.join(NPM_ROOT, "**"),
    }),
  ],
};
