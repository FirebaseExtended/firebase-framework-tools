// Options to configure the build of a framework application
export interface BuildOptions {
  // command to run build script (e.g. "npm", "nx", etc.)
  buildCommand: string;
  // list of arguments to pass to the build command
  // (e.g. ["--project=my-app", "--configuration=production"])
  buildArgs: string[];
  // path to the project targeted by the build command
  projectDirectory: string;
  // the name of the project to build in a monorepo
  monorepoProject?: string;
}

export const DEFAULT_COMMAND = "npm";

// Get a set of default options, derived from the environment variable API
// passed down to the adapter from the buildpacks environment.
export function getBuildOptions(): BuildOptions {
  return {
    buildCommand: process.env.MONOREPO_COMMAND || DEFAULT_COMMAND,
    buildArgs: process.env.MONOREPO_BUILD_ARGS?.split(",") || [],
    projectDirectory: process.env.GOOGLE_BUILDABLE || process.cwd(),
    monorepoProject: process.env.MONOREPO_PROJECT,
  };
}
