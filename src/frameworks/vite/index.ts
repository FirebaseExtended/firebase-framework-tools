import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { copy } from 'fs-extra';
import { DeployConfig, PathFactory } from '../../utils.js';
import { pathToFileURL } from 'url';

// Used by the build process, don't shake
const _pathToFileUrl = pathToFileURL;

export const build = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {
  const { build: viteBuild, resolveConfig } = await import('vite/dist/node/index.js');
  const pkgPath = getProjectPath('package.json');
  const packageJsonBuffer = await readFile(pkgPath);
  const packageJson = JSON.parse(packageJsonBuffer.toString());
  const root = getProjectPath();
  const configFile = getProjectPath('vite.config.js');
  // TODO: Figure out dot-env
  const viteConfig = await resolveConfig({ configFile }, 'build');
  const viteOutDir = viteConfig.build.outDir;
  const viteDistPath = resolve(root, getProjectPath(viteOutDir));

  const deployPath = (...args: string[]) => config.dist ? join(config.dist, ...args) : getProjectPath('.deploy', ...args);
  const getHostingPath = (...args: string[]) => deployPath('hosting', ...args);
  const hostingPath = resolve(root, getHostingPath());

  await viteBuild({
    root,
    configFile,
  });

  await copy(viteDistPath, hostingPath);

  return {
    usingCloudFunctions: false, 
    framework: 'vite', 
    rewrites: [], 
    redirects: [], 
    headers: [], 
    packageJson, 
    bootstrapScript: null,
  };
}
