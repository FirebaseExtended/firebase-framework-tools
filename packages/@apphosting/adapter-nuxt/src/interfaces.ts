/**
 * Options to help generate output directory
 */
export interface OutputBundleOptions {
  bundleYamlPath: string;
  outputDirectory: string;
  wantsBackend: boolean;
  clientDirectory: string;
  serverDirectory: string;

  // TODO: review, could not find yet
  // serverFilePath: string;
}
