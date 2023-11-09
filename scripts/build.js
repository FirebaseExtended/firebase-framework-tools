#! /usr/bin/env node
const { spawn } = require("child_process");
const { lernaScopeArgs } = require("./github.js");

spawn("lerna", ["run", "build", ...lernaScopeArgs], { stdio: "inherit" });
