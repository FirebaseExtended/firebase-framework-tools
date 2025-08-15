#! /usr/bin/env node
import { spawn } from "child_process";
import { program } from "commander";
import { yellow, bgRed, bold } from "colorette";
import { SupportedFrameworks, ApphostingConfig } from "@apphosting/common";
import { adapterBuild } from "../adapter-builds.js";
import { parse as parseYaml } from "yaml";
import fsExtra from "fs-extra";
import { join } from "path";

export const { readFileSync } = fsExtra;

program
    .argument("<projectRoot>", "path to the project's root directory")
    .option("<framework>", "the framework to build for")
    .action(async (projectRoot: string, opts: any) => {
      // TODO(#382): support other apphosting.*.yaml files.
      const apphostingYaml = parseYaml(readFileSync(join(projectRoot, "apphosting.yaml")).toString()) as ApphostingConfig;

      // TODO(#382): parse apphosting.yaml for environment variables / secrets needed during build time.

      if (opts.framwork && SupportedFrameworks.includes(opts.framework)) {
	// TODO(#382): Skip this if there's a custom build command in apphosting.yaml.
	adapterBuild(projectRoot, opts.framework)
      }

      // TODO(#382): Parse apphosting.yaml to set custom run command in bundle.yaml
      // TODO(#382): parse apphosting.yaml for environment variables / secrets needed during runtime to include in the bunde.yaml
      // TODO(#382): parse apphosting.yaml for runConfig to include in bundle.yaml
    });

program.parse();
