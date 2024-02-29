#! /usr/bin/env node
const { spawn } = require("child_process");
const { lernaScopeArgs } = require("./github.js");

const testProcess = spawn("lerna", ["run", "test", "--verbose", "--no-bail", ...lernaScopeArgs], {
  stdio: "inherit",
});
testProcess.on("close", (code) => {
  process.exit(code);
});
