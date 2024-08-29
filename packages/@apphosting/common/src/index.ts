import { spawn } from "child_process";

// Output bundle metadata specifications to be written to bundle.yaml
export interface OutputBundleConfigs{
  version: "v1";
  serverConfig: ServerConfig;
  metadata: Metadata;
}

// Fields needed to configure the App Hosting server
interface ServerConfig {
  // Command to start the server (e.g. ["node", "dist/index.js"]). Assume this command is run from the root dir of the workspace
  runCommand: string[];
  // Environment variables set when the app is run
  environmentVariables?: EnvVarConfig[];
  // The maximum number of concurrent requests that each server instance can receive.
  // Defaults to 80.
  concurrency?: number;
  // The number of CPUs used in a single server instance.
  // Defaults to 1.
  cpu?: "fractional" | 1 | 2 | 4 | 6 | 8;
  // The amount of memory available for a server instance.
  // Commonly one of: "256" | "512" | "1024" | "2048" | "4096" | "8192" | "16384"
  // Defaults to 512MiB.
  memoryMiB?: string;
  // The limit on the minimum number of function instances that may coexist at a given time.
  // Defaults to 0.
  minInstances?: number;
  // The limit on the maximum number of function instances that may coexist at a given time.
  // Defaults to 100.
  maxInstances?: number;
}

// Additonal fields needed for identifying the framework and adapter being used
interface Metadata {
  // Name of the adapter (this should be the official package name)
  adapterPackageName: string;
  // Version of the adapter 
  adapterVersion?: string;
  // Name of the framework that is being supported, e.g. "angular"
  framework: string;
  // Version of the framework that is being supported, e.g. "18.0.1"
  frameworkVersion?: string;
}

// Represents a single environment variable.
interface EnvVarConfig {
  // Name of the variable
  variable: string;
  // Value associated with the variable
  value: string;
  // Where the variable will be available, for now only RUNTIME is supported
  availability: Availabilities.Runtime[];
}

// Represents where environment variables are available from
enum Availabilities {
  Runtime,
}

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
