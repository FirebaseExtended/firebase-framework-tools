const fs = require('fs');
const path = require('path');

const TARGET_DIR = './src/protos';

// This regex finds lines with relative imports.
// It captures three groups:
// 1. The part before the path (e.g., `from '`)
// 2. The relative path itself (e.g., `./some/file`)
// 3. The closing quote (e.g., `'`)
const IMPORT_REGEX = /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g;

/**
 * Recursively walks a directory and applies a file processing function.
 * @param {string} directory The directory to walk.
 * @param {(filePath: string) => void} processFile The function to apply to each file.
 */
function walkDirectory(directory, processFile) {
  const items = fs.readdirSync(directory);
  for (const item of items) {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDirectory(fullPath, processFile);
    } else if (fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

/**
 * Reads a TypeScript file, adds '.js' extensions to relative imports,
 * and writes the changes back to the file.
 * @param {string} filePath The path to the TypeScript file.
 */
function addJsExtensions(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = false;

  const newContent = content.replace(IMPORT_REGEX, (match, pre, importPath, post) => {
    // Check if the path already has an extension.
    // path.extname() returns the extension (e.g., '.js') or an empty string.
    if (path.extname(importPath)) {
      return match; // No change needed
    }

    changesMade = true;
    const newImportPath = `${importPath}.js`;
    return `${pre}${newImportPath}${post}`;
  });

  if (changesMade) {
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
}

try {
  walkDirectory(TARGET_DIR, addJsExtensions);
} catch (error) {
  console.error(`Error processing files: ${error.message}`);
  process.exit(1);
}
