import { generateBundleYaml, getAdapterMetadata, populateOutputBundleOptions } from "./utils.js";
import type { NextAdapter } from "next";
import { addRouteOverrides } from "./overrides.js";
import { PHASE_PRODUCTION_BUILD } from "./constants.js";

const adapter: NextAdapter = {
    name: '@apphosting/adapter-nextjs',
    // FEEDBACK: we need to be able to override user-defined config, before defaults injected
    //           it would be nice if this where a separate phase or callback
    async modifyConfig(config, { phase }) {
        if (phase === PHASE_PRODUCTION_BUILD) {
            return {
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
            }
        }
        // TODO override config for production build
        return config;
    },
    // This fires before standalone is bundled, so we need to pick things back up after build in bin/build.ts
    // FEEDBACK: can we get a hook after bundle?
    async onBuildComplete(context) {

        const nextBuildDirectory = context.distDir;
        
        if (context.outputs.middleware?.config?.matchers) {
            await addRouteOverrides(nextBuildDirectory, context.outputs.middleware.config.matchers);
        }

        const outputBundleOptions = populateOutputBundleOptions(
            context.repoRoot,
            context.projectDir,
            nextBuildDirectory,
        );

        console.log(context.outputs.prerenders.filter(it => !!it.pprChain && it.config.renderingMode === "PARTIALLY_STATIC").map(it => it.pathname));
        console.log(context.outputs);

        const adapterMetadata = getAdapterMetadata();

        const root = process.cwd();
        
        const nextjsVersion = process.env.FRAMEWORK_VERSION || context.nextVersion || "unspecified";

        await generateBundleYaml(outputBundleOptions, root, nextjsVersion, adapterMetadata);

    },
};

module.exports = adapter;
