#! /usr/bin/env node
const { spawn } = require("child_process");
const { lernaScopes } = require("./github.js");

const testProcess = spawn("lerna", ["run", "test", "--verbose", "--no-bail", ...lernaScopes], {
  stdio: "inherit",
});
testProcess.on("close", (code) => {
  process.exit(code);
});
