import { build } from "esbuild";
import { spawn } from "child_process";
import { join, dirname } from "path"; // Ensure dirname is imported
import fs from "fs-extra";
import { fileURLToPath } from "url";  // Import this

// 1. SHIM __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function main() {
  const root = process.cwd();
  console.log(`🏗️  Starting Adapter Build in ${root}...`);

  // 1. Run Next.js Build
  const nextBuild = spawn("npx", ["next", "build"], { 
    stdio: "inherit", 
    cwd: root,
    shell: true,
    env: { ...process.env, NODE_ENV: "production" }
  });

  await new Promise<void>((resolve, reject) => {
    nextBuild.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Next.js build failed with code ${code}`));
    });
  });

  // 2. Move Standalone Output to .apphosting
  // The standalone build creates a folder structure that mirrors your hard drive
  // e.g., .next/standalone/Users/name/project/...
  // We need to find the actual project root inside standalone.
  const standaloneDir = join(root, ".next", "standalone");
  const outputDir = join(root, ".apphosting");
  
  // Clean previous build
  await fs.remove(outputDir);
  await fs.ensureDir(outputDir);

  console.log("📦 Copying standalone server to .apphosting...");
  
  // Copy the standalone directory content to .apphosting
  // Note: This includes a 'server.js' and 'node_modules'
  await fs.copy(standaloneDir, outputDir);

  // Copy the 'public' folder and '.next/static' (Standalone doesn't include these by default!)
  await fs.copy(join(root, "public"), join(outputDir, "public"), { dereference: true }).catch(() => {});
  await fs.copy(join(root, ".next", "static"), join(outputDir, ".next", "static"), { dereference: true });
  const configSource = join(root, ".next", "firebase-next-config.json");
  const configDest = join(outputDir, "firebase-next-config.json");
  
  if (await fs.pathExists(configSource)) {
    console.log("📦 Copying serialized config...");
    await fs.copy(configSource, configDest);
  } else {
    console.warn("⚠️ Could not find firebase-next-config.json. Server may fail to start.");
  }
  // 3. Bundle OUR Runtime Server
  // We put our serve.js *next to* the Next.js server.js
  console.log("📦 Bundling runtime server...");
  await build({
    entryPoints: [join(__dirname, "../../src/bin/serve.ts")], 
    bundle: true,
    platform: "node",
    format: "cjs", 
    outfile: join(outputDir, "adapter-server.js"),
    external: ["next", "react", "react-dom"], 
  });

  console.log("✅ Build complete. Artifacts in .apphosting/");
  
}


if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}