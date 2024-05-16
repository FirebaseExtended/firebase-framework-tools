import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "rollup-plugin-commonjs";

export default {
  input: "./dist/simple-server/server.js",
  output: {
    file: "./dist/simple-server/bundled_server.mjs",
    format: "es",
  },
  plugins: [resolve({ preferBuiltins: true }), json(), commonjs()],
};
