#! /usr/bin/env node
import { SupportedFrameworks } from "@apphosting/common";
import { adapterBuild } from "../adapter-builds.js";
import { program } from "commander";

program
  .argument("<projectRoot>", "path to the project's root directory")
  .option("--framework <framework>")
  .action(async (projectRoot, opts) => {
    // TODO(#382): support other apphosting.*.yaml files.

    // TODO(#382): parse apphosting.yaml for environment variables / secrets needed during build time.
    if (opts.framework && SupportedFrameworks.includes(opts.framework)) {
      // TODO(#382): Skip this if there's a custom build command in apphosting.yaml.
      await adapterBuild(projectRoot, opts.framework);
    }

    // TODO(#382): Parse apphosting.yaml to set custom run command in bundle.yaml
    // TODO(#382): parse apphosting.yaml for environment variables / secrets needed during runtime to include in the bunde.yaml
    // TODO(#382): parse apphosting.yaml for runConfig to include in bundle.yaml
  });

program.parse();
