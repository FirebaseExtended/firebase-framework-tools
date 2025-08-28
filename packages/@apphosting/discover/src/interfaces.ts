export interface DiscoveryContext {
  root: string;
  fs: MockFileSystem;
  path: typeof import("node:path");
};

export type MockFileSystem = {
    readFile: (path: string) => Promise<Buffer>;
    pathExists: (path: string) => Promise<boolean>;
    readJson: (path: string) => Promise<any>;
};
