#! /usr/bin/env node
const { spawn } = require("child_process");

const buildProcess = spawn("lerna", ["run", "build"], { stdio: "inherit" });

buildProcess.on("close", (code) => {
  process.exit(code);
});
