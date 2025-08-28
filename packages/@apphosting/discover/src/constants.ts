import { DiscoveredFramework, DiscoveryContext, FRAMEWORK_ID, PLATFORM_ID, TARGET_PLATFORM } from "./interfaces.js";
import { relativeRequire } from "./nodejs/index.js";

export const PLATFORMS = [
  // [id, files[], defaultPackageManger, packageManagers[], frameworks[]]
  [
    "dart",
    ["pubspec.yaml"],
    "pub",
    [
      // [id, lockfiles[]]
      ["pub", ["pubspec.lock"]],
    ],
    // [id, deps[], files[], bundles[], isStatic?]
    [["flutter", ["flutter"], [], [], () => ({ single_page_app: true })]]
  ],
  [
    "nodejs",
    ["package.json"],
    "npm",
    [
      // [id, lockfiles[]]
      ["npm", ["npm-shrinkwrap.json", "package-lock.json"]],
      ["yarn", ["yarn.lock"]],
      ["pnpm", ["pnpm-lock.yaml"]],
    ],
    [
      // [id, deps[], files[], bundles[], isStatic?]
      ["nextjs", ["next"], [], ["react"], async (ctx: DiscoveryContext): Promise<Partial<DiscoveredFramework>> => {
        // TODO clean up the error handling here
        const [{ default: loadConfig }, { PHASE_PRODUCTION_BUILD }] = await Promise.all([
          relativeRequire(ctx.root, "next/dist/server/config").catch(() => ({ default: null })),
          relativeRequire(ctx.root, "next/constants").catch(() => ({ PHASE_PRODUCTION_BUILD: null })),
        ]);
        if (!loadConfig || !PHASE_PRODUCTION_BUILD) return {
          discoveryComplete: false,
          stepsNeededForDiscovery: ["install"],
        };
        const nextConfig = await loadConfig(PHASE_PRODUCTION_BUILD, ctx.root);
        return {
          single_page_app: nextConfig.output === "export",
          dist_directory: nextConfig.output === "export" ? "out" : nextConfig.distDir,
          // handle standalone and output.export serve command
        };
      }],
      ["angular", ["@angular/core"], ["angular.json"], ["vite", "scully"], () => ({ single_page_app: false })],
      ["scully", ["@scullyio/scully"], ["scully.config.js"], [], () => ({ single_page_app: true })], // TODO bundle angular correctly
      [
        "astro",
        ["astro"],
        ["astro.config.js", "astro.config.mjs", "astro.config.cjs", "astro.config.ts"],
        ["lit", "react", "preact", "svelte", "vue", "vite"],
        () => ({ single_page_app: false }) // TODO handle static detection
      ],
      ["nuxt", ["nuxt"], ["nuxt.config.js"], ["vue"], () => ({ single_page_app: false })],
      ["lit", ["lit", "lit-element"], [], [], () => ({ single_page_app:  true })],
      ["vue", ["vue"], [], [], () => ({ single_page_app:  true })],
      ["nuxtjs", ["nuxt"], ["nuxt.config.js"], ["vue"], () => ({ single_page_app: false })],
      ["vuepress", ["vuepress"], [], ["vue"], () => ({ single_page_app: true, dist_directory: "docs/.vuepress/dist" })],
      ["vite", ["vite"], [], ["vue", "react", "preact", "lit", "svelte", "solid"], () => ({ single_page_app: true })],
      ["vitepress", ["vitepress"], [], ["vue"], () => ({ single_page_app: true, dist_directory: "docs/.vitepress/dist" })],
      ["preact", ["preact"], [], [], () => ({ single_page_app: true, dist_directory: "build" })],
      ["react", ["react", "react-dom"], [], [], () => ({ single_page_app: true, dist: () => "build" })],
      ["gatsby", ["gatsby"], ["gatsby-config.js"], ["react"], () => ({ single_page_app: true, dist_directory: "public" })],
      ["docusaurus", ["@docusaurus/core"], ["docusaurus.config.js"], ["react"], () => ({ single_page_app: true, dist_directory: "build" })],
      ["svelte", ["svelte"], [], [], () => ({ single_page_app: true })],
      ["sapper", ["sapper"], [], ["svelte"], () => ({ single_page_app: true, dist_directory: "__sapper__/export" })],
      ["sveltekit", ["@sveltejs/kit"], [], ["svelte", "vite"], () => ({ single_page_app: false })],
      ["stencil", ["@stencil/core"], ["stencil.config.ts"], [], () => ({ single_page_app: true, dist_directory: "www" })],
      ["aurelia", ["aurelia"], [], [], () => ({ single_page_app: true })],
      ["ember", ["ember-cli", "ember-load-initializers", "ember-resolver"], [], [], () => ({ single_page_app: true })], // TODO handle fastboot
      ["riot", ["riot"], [], [], () => ({ single_page_app: true })],
      ["polymer", ["@polymer/polymer"], ["polymer.json"], [], () => ({ single_page_app: true, dist_directory: "build/es6-bundled" })],
      ["eleventy", ["@11ty/eleventy"], [], [], () => ({ single_page_app: true, dist_directory: "_site" })],
      ["solidjs", ["solid-js", "solid-app-router"], [], [], () => ({ single_page_app: true })],
      ["solid-start", ["solid-start"], [], ["solid-js"], () => ({ single_page_app: false  })],
      ["remix", ["remix"], [], ["react"], () => ({ single_page_app: false, dist_directory: "public" })],
      ["redwood", ["@redwoodjs/core"], [], ["react"], () => ({ single_page_app: false, dist_directory: "web/dist" })],
      ["quasar", ["quasar"], [], ["vue"], () => ({ single_page_app: true, dist_directory: "dist/spa" })],
      ["ionic", ["@ionic/react", "@ionic/angular"], [], ["react", "angular"], () => ({ single_page_app: true, dist_directory: "www"  })],
      ["react-static", ["react-static"], [], ["react"], () => ({ single_page_app: true })],
    ],
  ],
  [
    "python",
    [],
    "pip",
    [
      // [id, lockfiles[]]
      ["pip", []],
      ["pipenv", ["Pipfile.lock"]],
      ["poetry", ["poetry.lock"]],
    ],
    [
      // [id, deps[], files[], bundles[], isStatic?]
      ["flask", ["flask"], [], [], () => ({ single_page_app: false })],
      ["django", ["django"], [], [], () => ({ single_page_app: false })],
    ],
  ],
] as const;

export const KNOWN_ADAPTERS: Partial<Record<PLATFORM_ID, undefined | Partial<Record<FRAMEWORK_ID, Partial<Record<TARGET_PLATFORM, { id: string; channel: "community" | "experimental" | "official" }>>>>>> = {
  "nodejs": {
    "nextjs": { "firebase": { id: "@apphosting/adapter-nextjs", channel: "official" }},
    "angular": { "firebase": { id: "@apphosting/adapter-angular", channel: "official" }},
    "astro": { "firebase": { id: "@apphosting/adapter-astro", channel: "experimental" }},
  },
} as const;
