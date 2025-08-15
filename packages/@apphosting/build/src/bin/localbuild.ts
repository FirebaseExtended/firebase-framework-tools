#! /usr/bin/env node
import { spawn } from "child_process";
import { program } from "commander";
import { yellow, bgRed, bold } from "colorette";
import { SupportedFrameworks } from "@apphosting/common";
import { adapterBuild } from "../adapter-builds.js";

// TODO(#382): parse apphosting.yaml for environment variables / secrets needed during build time.
// TODO(#382): Support custom build and run commands (parse and pass run command to build schema).

// TODO(#382): parse apphosting.yaml for environment variables / secrets needed during runtime to include in the bunde.yaml
// TODO(#382): parse apphosting.yaml for runConfig to include in bundle.yaml

program
  .argument("<projectRoot>", "path to the project's root directory")
  .argument("<framework>", "the framework to build for")
  .action(async (projectRoot: string, framework: string) => {

    if (SupportedFrameworks.includes(framework)) {
      adapterBuild(framework, projectRoot)
    }
  });

program.parse();
