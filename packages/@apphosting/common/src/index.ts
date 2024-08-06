import { spawn } from "child_process";

// Options to configure the build of a framework application
export interface BuildOptions {
  // command to run build script (e.g. "npm", "nx", etc.)
  buildCommand: string;
  // list of arguments to pass to the build command
  // (e.g. ["--project=my-app", "--configuration=production"])
  buildArgs: string[];
  // path to the project targeted by the build command
  projectDirectory: string;
  // the name of the project to build
  projectName?: string;
}

export interface BuildResult {
  stdout?: string;
  stderr?: string;
}

export const DEFAULT_COMMAND = "npm";

// Run the build command in a spawned child process.
// By default, "npm run build" will be used, or in monorepo cases,
// the monorepo build command (e.g. "nx build").
export async function runBuild(opts: BuildOptions = getBuildOptions()): Promise<BuildResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(opts.buildCommand, [...opts.buildArgs], {
      cwd: process.cwd(),
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    // Re-connect the child process's stdout and stderr to the console so that
    // build messages and errors are still logged in Cloud Build.
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Build process exited with error code ${code}.`));
      }
      resolve({ stdout: stdout, stderr: stderr });
    });
  });
}

// Get a set of default options, derived from the environment variable API
// passed down to the adapter from the buildpacks environment.
export function getBuildOptions(): BuildOptions {
  if (process.env.MONOREPO_COMMAND) {
    return {
      buildCommand: process.env.MONOREPO_COMMAND,
      buildArgs: ["run", "build"].concat(process.env.MONOREPO_BUILD_ARGS?.split(".") || []),
      projectDirectory: process.env.GOOGLE_BUILDABLE || "",
      projectName: process.env.MONOREPO_PROJECT,
    };
  }
  return {
    buildCommand: DEFAULT_COMMAND,
    buildArgs: ["run", "build"],
    projectDirectory: process.cwd(),
  };
}
