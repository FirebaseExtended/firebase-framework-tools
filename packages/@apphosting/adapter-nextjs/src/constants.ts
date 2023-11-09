import type {
    PHASE_PRODUCTION_BUILD as NEXT_PHASE_PRODUCTION_BUILD,
    ROUTES_MANIFEST as NEXT_ROUTES_MANIFEST,
} from "next/constants.js";

// export next/constants ourselves so we don't have to dynamically import them
// also this gives us a better heads up if the NextJS API changes
export const PHASE_PRODUCTION_BUILD: typeof NEXT_PHASE_PRODUCTION_BUILD = "phase-production-build";
export const ROUTES_MANIFEST: typeof NEXT_ROUTES_MANIFEST = "routes-manifest.json";
