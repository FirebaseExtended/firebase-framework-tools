import { existsSync } from 'fs';
import { rm } from 'fs/promises';

import { DeployConfig, PathFactory } from '../utils';

const dynamicImport = (getProjectPath: PathFactory) => {
    const exists = (...files: string[]) => files.some(file => existsSync(getProjectPath(file)));
    if (exists('next.config.js')) return import('./next.js/index.js');
    if (exists('nuxt.config.js', 'nuxt.config.ts')) return import('./nuxt/index.js');
    if (exists('angular.json')) return import('./angular/index.js');
    return import('./express/index.js');
};

export const build = async (config: DeployConfig | Required<DeployConfig>, getProjectPath: PathFactory) => {
    const command = await dynamicImport(getProjectPath);
    await rm(config.dist, { recursive: true, force: true });
    return command.build(config, getProjectPath);
};
