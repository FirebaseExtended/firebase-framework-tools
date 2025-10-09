import { generateBuildOutput, getAdapterMetadata, populateOutputBundleOptions } from "./utils.js";
import { getBuildOptions } from "@apphosting/common/dist/index.js";

// TODO can we override from the default config?
const fahOptimizedConfig = (config: any) => ({
    ...config,
    images: {
      ...(config.images || {}),
      ...(config.images?.unoptimized === undefined && config.images?.loader === undefined
          ? { unoptimized: true }
          : {}),
    },
    headers: async () => {
        const originalHeaders = config.headers && await config.headers() || [];
        const adapterMetadata = getAdapterMetadata();
        // TODO add our middleware header OR not... :P
        return [
            ...originalHeaders,
            {
                source: "/(.*)",
                headers: [{
                    key: "x-fah-adapter",
                    value: `nextjs-${adapterMetadata.adapterVersion}`,
                }],
            },
        ]
    },
    experimental: {
        ...(config.experimental || {}),
        nodeMiddleware: true,
    },
    output: 'standalone',
  });

// TODO import the type from next
interface NextAdapter {
    name: string;
    modifyConfig?: (config: any, context: { phase: string }) => Promise<any> | any;
    onBuildComplete?: (context: any) => Promise<void> | void;
}
const adapter: NextAdapter = {
    name: '@apphosting/adapter-nextjs',
    // FEEDBACK: we need to be able to override user-defined config, before defaults injected
    //           it would be nice if this where a seperate phase or callback
    async modifyConfig(config, { phase }) {
        if (phase === 'phase-production-build') {
            return fahOptimizedConfig(config);
        }
        // TODO override config for production build
        return config;
    },
    async onBuildComplete(context) {
        const nextBuildDirectory = context.distDir;
        const outputBundleOptions = populateOutputBundleOptions(
            context.repoRoot,
            context.projectDir,
            nextBuildDirectory,
        );

        const adapterMetadata = getAdapterMetadata();

        const root = process.cwd();
        const opts = getBuildOptions();
        
        const nextjsVersion = process.env.FRAMEWORK_VERSION || context.nextVersion || "unspecified";
        await generateBuildOutput(
            root,
            opts.projectDirectory,
            outputBundleOptions,
            nextBuildDirectory,
            nextjsVersion,
            adapterMetadata,
        );
    },
};

module.exports = adapter;
