#! /usr/bin/env node
const { spawn } = require("child_process");
const { lernaScopeArgs } = require("./github.js");

const scopeArgs = [
  "--scope",
  "@apphosting/adapter-angular",
  "--scope",
  "@apphosting/adapter-nextjs",
  "--scope",
  "@apphosting/build",
  "--scope",
  "@apphosting/create",
  "--scope",
  "@apphosting/discover",
  "--scope",
  "create-next-on-firebase",
  "--scope",
  "firebase-frameworks",
];
const buildProcess = spawn("lerna", ["run", "build", ...scopeArgs], { stdio: "inherit" });

buildProcess.on("close", (code) => {
  process.exit(code);
});
