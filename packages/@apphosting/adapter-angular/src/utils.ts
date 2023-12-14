import fsExtra from "fs-extra";
import { fileURLToPath } from "url";

// fs-extra is CJS, readJson can't be imported using shorthand
export const { readJson } = fsExtra;

export async function loadConfig(cwd: string) {
  // dynamically load NextJS so this can be used in an NPX context
  const { NodeJsAsyncHost }: typeof import("@angular-devkit/core/node") = await import(
    `${cwd}/node_modules/@angular-devkit/core/node/index.js`
  );
  const { workspaces }: typeof import("@angular-devkit/core") = await import(
    `${cwd}/node_modules/@angular-devkit/core/src/index.js`
  );
  const { WorkspaceNodeModulesArchitectHost }: typeof import("@angular-devkit/architect/node") =
    await import(`${cwd}/node_modules/@angular-devkit/architect/node/index.js`);

  const host = workspaces.createWorkspaceHost(new NodeJsAsyncHost());
  const { workspace } = await workspaces.readWorkspace(cwd, host);
  const architectHost = new WorkspaceNodeModulesArchitectHost(workspace, cwd);

  const apps: string[] = [];
  workspace.projects.forEach((value, key) => {
    if (value.extensions.projectType === "application") apps.push(key);
  });
  const project = apps[0];
  if (apps.length > 1 || !project) throw new Error("Unable to determine the application to deploy");

  const workspaceProject = workspace.projects.get(project);
  if (!workspaceProject) throw new Error(`No project ${project} found.`);

  const target = "build";
  if (!workspaceProject.targets.has(target)) throw new Error("Could not find build target.");

  const { builder, defaultConfiguration: configuration = "production" } =
    workspaceProject.targets.get(target)!;
  if (builder !== "@angular-devkit/build-angular:application") {
    throw new Error("Only the Angular application builder is supported.");
  }

  const buildTarget = {
    project,
    target,
    configuration,
  };

  const options = await architectHost.getOptionsForTarget(buildTarget);
  if (!options) throw new Error("Not able to find options for build target.");
  return options;
}

export const isMain = (meta: ImportMeta) => {
  if (!meta) return false;
  if (!process.argv[1]) return false;
  return process.argv[1] === fileURLToPath(meta.url);
};
