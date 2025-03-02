import fs from "fs/promises";
import path from "path";
import { glob } from "glob";

async function findNextConfigFile(directory: string): Promise<string> {
  const configPattern = path.join(directory, "next.config.{js,ts,mjs}");

  const files = await glob(configPattern);
  if (files.length > 1) {
    throw new Error(
      `Multiple Next.js config files found: ${files.join(
        ", ",
      )}. Only one config file is allowed per repository.`,
    );
  }

  if (files.length === 0) {
    throw new Error(`No Next.js config file found in ${directory}`);
  }

  return files[0];
}

/**
 * Sets images.unoptimized to true in Next.js config files if it doesn't exist
 */
async function setImagesUnoptimized(filePath: string): Promise<void> {
  const content = await fs.readFile(filePath, "utf8");

  // Check if images config already exists
  const hasImagesConfig = /images\s*:\s*{/.test(content);
  const hasUnoptimizedConfig = /unoptimized\s*:\s*(true|false)/.test(content);

  // If unoptimized already exists in any form, leave the file alone
  if (hasUnoptimizedConfig) {
    console.log(`  Skipping: 'unoptimized' already defined in ${filePath}`);
    return;
  }

  let updated = content;

  if (hasImagesConfig) {
    // Add unoptimized setting to existing images config
    updated = content.replace(/images\s*:\s*{/g, "images: {\n    unoptimized: true,");
  } else {
    // Handle different module export patterns
    if (content.includes("module.exports = {")) {
      // CommonJS object literal
      updated = content.replace(
        /module\.exports\s*=\s*{/,
        "module.exports = {\n  images: {\n    unoptimized: true\n  },",
      );
    } else if (content.includes("module.exports =")) {
      // CommonJS with other expression
      updated = content.replace(/module\.exports\s*=/, "const originalConfig =");
      updated += `\n\nmodule.exports = {\n  ...originalConfig,\n  images: {\n    unoptimized: true\n  }\n};\n`;
    } else if (content.includes("export default {")) {
      // ES Module object literal
      updated = content.replace(
        /export default\s*{/,
        "export default {\n  images: {\n    unoptimized: true\n  },",
      );
    } else if (content.includes("export default")) {
      // ES Module with other expression
      updated = content.replace(/export default/, "const originalConfig =");
      updated += `\n\nexport default {\n  ...originalConfig,\n  images: {\n    unoptimized: true\n  }\n};\n`;
    } else {
      // Fallback: append new config at the end
      updated += `\n\nmodule.exports = {\n  images: {\n    unoptimized: true\n  }\n};\n`;
    }
  }

  await fs.writeFile(filePath, updated, "utf8");
}

/**
 * Main function to update Next.js config files
 */
export async function setImagesUnoptimizedInConfigs(directory: string): Promise<void> {
  try {
    // Find all Next.js config files
    const configFile = await findNextConfigFile(directory);
    console.log(`Found Next.js config file: ${configFile}`);

    // Process each config file
    await setImagesUnoptimized(configFile);
    console.log(`Updated: ${configFile}`);
  } catch (error) {
    throw new Error(`Error updating overriding Next.js config files: ${(error as Error).message}`);
  }
}
