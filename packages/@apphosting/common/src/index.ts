import { exec } from "child_process";

// Options to configure the build of a framework application
export interface BuildOptions {
  // command to run build script (e.g. "npm", "nx", etc.)
  buildCommand: string;
  // list of arguments to pass to the build command
  // (e.g. ["--project=my-app", "--configuration=production"])
  buildArgs: string[];
  // path to the project targeted by the build command
  projectDirectory: string;
  // the name of the project to build, as specified in package.json
  projectName?: string;
}

export interface BuildResult {
  stdout?: string;
  stderr?: string;
}

export const DEFAULT_COMMAND = "npm";

export async function runBuild(opts: BuildOptions = getBuildOptions()): Promise<BuildResult> {
  const cmd = [opts.buildCommand, "run", "build", ...opts.buildArgs].join(" ");
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

// Get a set of default options, derived from the environment variable API
// passed down to the adapter from the buildpacks environment.
export function getBuildOptions(): BuildOptions {
  if (process.env.MONOREPO_COMMAND) {
    return {
      buildCommand: process.env.MONOREPO_COMMAND,
      buildArgs: process.env.MONOREPO_BUILD_ARGS?.split(".") || [],
      projectDirectory: process.env.GOOGLE_BUILDABLE || ".",
      projectName: process.env.MONOREPO_PROJECT,
    };
  }
  return {
    buildCommand: DEFAULT_COMMAND,
    buildArgs: [],
    projectDirectory: process.cwd(),
  };
}
