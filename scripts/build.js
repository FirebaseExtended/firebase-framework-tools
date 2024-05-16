#! /usr/bin/env node
const { spawn } = require("child_process");
const { lernaScopeArgs } = require("./github.js");

const buildProcess = spawn("lerna", ["run", "build", ...lernaScopeArgs], { stdio: "inherit" });

buildProcess.on("close", (code) => {
  process.exit(code);
});
