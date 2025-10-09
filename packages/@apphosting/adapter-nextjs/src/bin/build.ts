#! /usr/bin/env node
import { runBuild } from "@apphosting/common";

// Opt-out sending telemetry to Vercel
process.env.NEXT_TELEMETRY_DISABLED = "1";

await runBuild();
