import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import { loadConfig } from "../utils.js";
import { NextConfig } from "next/dist/server/config-shared.js";

/**
 * Finds the Next.js config file in the given directory
 */
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
 * Updates the Next.js config file to set images.unoptimized to true
 */
async function setImagesUnoptimized(configFilePath: string, projectRoot: string): Promise<void> {
  // Get the directory containing the config file
  const configDir = path.dirname(configFilePath);

  // Load the config using Next.js's built-in config loader
  const config = await loadConfig(configDir, projectRoot);

  // Check if images.unoptimized is already set to true
  if (config.images?.unoptimized === true) {
    console.log(`  Skipping: 'images.unoptimized' already set to true in ${configFilePath}`);
    return;
  }

  // Create updated config with images.unoptimized set to true
  const updatedConfig = {
    ...config,
    images: {
      ...(config.images || {}),
      unoptimized: true,
    },
  } as NextConfig;

  // Get the file extension to determine which template to use
  const fileExtension = path.extname(configFilePath);

  // Generate new config file content based on the file extension
  let updatedContent: string;

  // Convert the config to a formatted string (excluding the images property which we'll handle separately)
  const { images, ...restConfig } = updatedConfig;
  const configStr =
    Object.keys(restConfig).length > 0
      ? JSON.stringify(restConfig, null, 2).replace(/^{/, "").replace(/}$/, "").trim()
      : "";

  // Format the images config separately to ensure unoptimized is set to true
  const imagesConfig = images
    ? JSON.stringify({ ...images, unoptimized: true }, null, 2)
        .replace(/^{/, "")
        .replace(/}$/, "")
        .trim()
    : "  unoptimized: true";

  switch (fileExtension) {
    case ".mjs":
      // Template for .mjs files
      updatedContent = `
      // @ts-check
      // This file was modified by Firebase App Hosting

      /**
       * @type {import('next').NextConfig}
       */
      const nextConfig = {${configStr ? `${configStr},` : ""}
        images: {
          ${imagesConfig}
        }
      }

      export default nextConfig
      `;
      break;

    case ".ts":
      // Template for .ts files
      updatedContent = `
      // This file was modified by Firebase App Hosting
      import type { NextConfig } from 'next'

      const nextConfig: NextConfig = {${configStr ? `${configStr},` : ""}
        images: {
          ${imagesConfig}
        }
      }

      export default nextConfig
      `;
      break;

    case ".js":
    default:
      // Template for .js files (default)
      updatedContent = `
      // @ts-check
      // This file was modified by Firebase App Hosting

      /** @type {import('next').NextConfig} */
      const nextConfig = {${configStr ? `${configStr},` : ""}
        images: {
          ${imagesConfig}
        }
      }

      module.exports = nextConfig
      `;
      break;
  }

  // Write the updated config back to the file
  await fs.writeFile(configFilePath, updatedContent, "utf8");
  console.log(`  Updated: Set 'images.unoptimized' to true in ${configFilePath}`);
}

/**
 * Main function to update Next.js config files
 */
export async function setImagesUnoptimizedInConfigs(directory: string): Promise<void> {
  try {
    // Find Next.js config file
    const configFile = await findNextConfigFile(directory);
    console.log(`Found Next.js config file: ${configFile}`);

    // Process the config file
    await setImagesUnoptimized(configFile, directory);
  } catch (error) {
    throw new Error(`Error updating Next.js config file: ${(error as Error).message}`);
  }
}
