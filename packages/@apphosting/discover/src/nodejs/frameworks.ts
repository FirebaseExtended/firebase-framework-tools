import { join } from "node:path";
import { Adapter, DiscoveredFramework, TARGET_PLATFORM } from "../index.js";
import { DiscoveryContext } from "../interfaces.js";
import { relativeRequire } from "./utils.js";

// Type definitions moved from index.ts
type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type FrameworkDefinition = {
    id: string;
    requiredPackages: readonly string[];
    requiredFiles: readonly string[];
    bundledWith: readonly string[];
    getDiscoveryProps?: (ctx: DiscoveryContext) => Promise<DeepPartial<DiscoveredFramework>>;
};

export const knownAdapters: Partial<Record<FRAMEWORK_ID, Record<TARGET_PLATFORM, Adapter>>> = {
    "nextjs": { "firebase": { id: "@apphosting/adapter-nextjs", channel: "official" }},
    "angular": { "firebase": { id: "@apphosting/adapter-angular", channel: "official" }},
    "astro": { "firebase": { id: "@apphosting/adapter-astro", channel: "experimental" }},
};

async function getNextjsDiscoveryProps(ctx: DiscoveryContext): Promise<DeepPartial<DiscoveredFramework>> {
    // TODO clean up the error handling here
    const [{ default: loadConfig }, { PHASE_PRODUCTION_BUILD }] = await Promise.all([
      relativeRequire(ctx.root, "next/dist/server/config").catch(() => ({ default: null })),
      relativeRequire(ctx.root, "next/constants").catch(() => ({ PHASE_PRODUCTION_BUILD: null })),
    ]);
    if (!loadConfig || !PHASE_PRODUCTION_BUILD) return {
      single_page_app: false,
      dist_directory: ".next",
      discoveryComplete: false,
      stepsNeededForDiscovery: ["install"],
    };
    const nextConfig = await loadConfig(PHASE_PRODUCTION_BUILD, ctx.root);
    const isExport = nextConfig.output === "export";
    const isStandalone = nextConfig.output === "standalone";
    return {
      single_page_app: isExport,
      dist_directory: isExport ? "out" : (isStandalone ? join(nextConfig.distDir, "standalone") : nextConfig.distDir),
      ...(isStandalone ? {
        commands: {
            serve: ["node", ["./server.mjs"]]
        }
      } : {})
    };
}

export const knownFrameworks: readonly FrameworkDefinition[] = [
      { id: "nextjs", requiredPackages: ["next"], requiredFiles: [], bundledWith: ["react"], getDiscoveryProps: getNextjsDiscoveryProps },
      { id: "angular", requiredPackages: ["@angular/core"], requiredFiles: ["angular.json"], bundledWith: ["vite", "scully"], getDiscoveryProps: () => Promise.resolve({ single_page_app: false }) },
      { id: "scully", requiredPackages: ["@scullyio/scully"], requiredFiles: ["scully.config.js"], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app: true }) }, // TODO bundle angular correctly
      { id: "astro", requiredPackages: ["astro"], requiredFiles: ["astro.config.js", "astro.config.mjs", "astro.config.cjs", "astro.config.ts"], bundledWith: ["lit", "react", "preact", "svelte", "vue", "vite"], getDiscoveryProps: () => Promise.resolve({ single_page_app: false }) }, // TODO handle static detection
      { id: "nuxt", requiredPackages: ["nuxt"], requiredFiles: ["nuxt.config.js"], bundledWith: ["vue"], getDiscoveryProps: () => Promise.resolve({ single_page_app: false }) },
      { id: "lit", requiredPackages: ["lit", "lit-element"], requiredFiles: [], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app:  true }) },
      { id: "vue", requiredPackages: ["vue"], requiredFiles: [], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app:  true }) },
      { id: "nuxtjs", requiredPackages: ["nuxt"], requiredFiles: ["nuxt.config.js"], bundledWith: ["vue"], getDiscoveryProps: () => Promise.resolve({ single_page_app: false }) },
      { id: "vuepress", requiredPackages: ["vuepress"], requiredFiles: [], bundledWith: ["vue"], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "docs/.vuepress/dist" }) },
      { id: "vite", requiredPackages: ["vite"], requiredFiles: [], bundledWith: ["vue", "react", "preact", "lit", "svelte", "solid"], getDiscoveryProps: () => Promise.resolve({ single_page_app: true }) },
      { id: "vitepress", requiredPackages: ["vitepress"], requiredFiles: [], bundledWith: ["vue"], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "docs/.vitepress/dist" }) },
      { id: "preact", requiredPackages: ["preact"], requiredFiles: [], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "build" }) },
      { id: "react", requiredPackages: ["react", "react-dom"], requiredFiles: [], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "build" }) },
      { id: "gatsby", requiredPackages: ["gatsby"], requiredFiles: ["gatsby-config.js"], bundledWith: ["react"], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "public" }) },
      { id: "docusaurus", requiredPackages: ["@docusaurus/core"], requiredFiles: ["docusaurus.config.js"], bundledWith: ["react"], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "build" }) },
      { id: "svelte", requiredPackages: ["svelte"], requiredFiles: [], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app: true }) },
      { id: "sapper", requiredPackages: ["sapper"], requiredFiles: [], bundledWith: ["svelte"], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "__sapper__/export" }) },
      { id: "sveltekit", requiredPackages: ["@sveltejs/kit"], requiredFiles: [], bundledWith: ["svelte", "vite"], getDiscoveryProps: () => Promise.resolve({ single_page_app: false }) },
      { id: "stencil", requiredPackages: ["@stencil/core"], requiredFiles: ["stencil.config.ts"], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "www" }) },
      { id: "aurelia", requiredPackages: ["aurelia"], requiredFiles: [], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app: true }) },
      { id: "ember", requiredPackages: ["ember-cli", "ember-load-initializers", "ember-resolver"], requiredFiles: [], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app: true }) }, // TODO handle fastboot
      { id: "riot", requiredPackages: ["riot"], requiredFiles: [], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app: true }) },
      { id: "polymer", requiredPackages: ["@polymer/polymer"], requiredFiles: ["polymer.json"], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "build/es6-bundled" }) },
      { id: "eleventy", requiredPackages: ["@11ty/eleventy"], requiredFiles: [], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "_site" }) },
      { id: "solidjs", requiredPackages: ["solid-js", "solid-app-router"], requiredFiles: [], bundledWith: [], getDiscoveryProps: () => Promise.resolve({ single_page_app: true }) },
      { id: "solid-start", requiredPackages: ["solid-start"], requiredFiles: [], bundledWith: ["solid-js"], getDiscoveryProps: () => Promise.resolve({ single_page_app: false  }) },
      { id: "remix", requiredPackages: ["remix"], requiredFiles: [], bundledWith: ["react"], getDiscoveryProps: () => Promise.resolve({ single_page_app: false, dist_directory: "public" }) },
      { id: "redwood", requiredPackages: ["@redwoodjs/core"], requiredFiles: [], bundledWith: ["react"], getDiscoveryProps: () => Promise.resolve({ single_page_app: false, dist_directory: "web/dist" }) },
      { id: "quasar", requiredPackages: ["quasar"], requiredFiles: [], bundledWith: ["vue"], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "dist/spa" }) },
      { id: "ionic", requiredPackages: ["@ionic/react", "@ionic/angular"], requiredFiles: [], bundledWith: ["react", "angular"], getDiscoveryProps: () => Promise.resolve({ single_page_app: true, dist_directory: "www"  }) },
      { id: "react-static", requiredPackages: ["react-static"], requiredFiles: [], bundledWith: ["react"], getDiscoveryProps: () => Promise.resolve({ single_page_app: true }) },
];

export type FRAMEWORK_ID = (typeof knownFrameworks)[number]['id'];
