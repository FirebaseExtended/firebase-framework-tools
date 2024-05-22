export interface AstroConfig {
  outDir: string;
  output: string;
  adapter: any;
}

// options to help generate output directory
export interface OutputBundleOptions {
  bundleYamlPath: string;
  outputDirectory: string;
  serverFilePath: string;
  wantsBackend: boolean;
  clientDir: string;
}
