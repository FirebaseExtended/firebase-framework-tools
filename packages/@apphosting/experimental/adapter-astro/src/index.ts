import * as fs from "node:fs/promises";
import { stringify as yamlStringify } from "yaml";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fsExtra from "fs-extra";
import { exec } from "child_process"
import { createRequire } from 'module';
import path from 'path';
import type { AstroAdapter, AstroIntegration } from 'astro';
import { AstroError } from 'astro/errors';
import type { Options, UserOptions } from './types.js';
import { OutputBundleConfig, Availability } from "@apphosting/common";
export const { move, exists, writeFile, readJson, readdir, readFileSync, existsSync, mkdir } =
fsExtra;

export function getAdapter(options: Options): AstroAdapter {
  const require = createRequire(import.meta.url);
  const serverEntrypoint = path.join(require.resolve('@astrojs/node'), '../server.js');
  const previewEntrypoint = path.join(require.resolve('@astrojs/node'), '../preview.js');
	return {
    name: "@apphosting/astro-adapter",
    serverEntrypoint: serverEntrypoint,
    previewEntrypoint: previewEntrypoint,
		exports: ['handler', 'startServer', 'options'],
		args: options,
		adapterFeatures: {
			buildOutput: 'server',
			edgeMiddleware: false,
		},
		supportedAstroFeatures: {
			hybridOutput: 'stable',
			staticOutput: 'stable',
			serverOutput: 'stable',
			sharpImageService: 'stable',
			i18nDomains: 'experimental',
			envGetSecret: 'stable',
		},
	};
}

export default function createIntegration(userOptions: UserOptions): AstroIntegration {
	if (!userOptions?.mode) {
		throw new AstroError(`Setting the 'mode' option is required.`);
	}

	let _options: Options;
	return {
		name: '@apphosting/astro-adapter',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config }) => {
				updateConfig({
					image: {
						endpoint: config.image.endpoint ?? 'astro/assets/endpoint/node',
					},
					vite: {
						ssr: {
							noExternal: ['@apphosting/astro-adapter'],
						},
					},
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				_options = {
					...userOptions,
					client: config.build.client?.toString(),
					server: config.build.server?.toString(),
					host: config.server.host,
					port: config.server.port,
					assets: config.build.assets,
				};
				setAdapter(getAdapter(_options));
			},
			'astro:build:done': async (config) => {
				await fs.mkdir("./.apphosting")
				const directoryName = dirname(fileURLToPath(import.meta.url));
				const packageJsonPath = `${directoryName}/../package.json`;
				if (!existsSync(packageJsonPath)) {
				throw new Error(`Astro adapter package.json file does not exist at ${packageJsonPath}`);
				}
				const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
				const packageName = "astro";
				const packageVersion = await getPackageVersion(packageName);
				const outputBundle: OutputBundleConfig = {
				version: "v1",
				runConfig: {
					runCommand: `node dist/server/entry.mjs`,
					environmentVariables: [{variable:"HOST", value:"0.0.0.0", availability:[Availability.Runtime]}]
				},
				metadata: {
					adapterPackageName: packageJson.name,
					adapterVersion: packageJson.version,
					framework: packageName,
					frameworkVersion: packageVersion
				},
				};
				await fs.writeFile(
				`./.apphosting/bundle.yaml`,
				yamlStringify(outputBundle)
				);
			},
		},
	};
}

function getPackageVersion(packageName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`npm view ${packageName} version`, (error, stdout, stderr) => {
      if (error) {
        reject(error); 
        return;
      }
      const version = stdout.trim();
      resolve(version); 
    });
  });
}

