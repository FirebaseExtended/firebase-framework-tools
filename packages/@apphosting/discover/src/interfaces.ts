import { PLATFORMS } from "./constants.js";

export type Command = [string, string[]];

export type FRAMEWORK_ID = (typeof PLATFORMS)[number][4][number][0];
export type PACKAGE_MANAGER_ID = (typeof PLATFORMS)[number][3][number][0];
export type PLATFORM_ID = (typeof PLATFORMS)[number][0];

export interface DiscoveryContext {
  root: string;
  fs: MockFileSystem;
  path: typeof import("node:path");
};

export type DiscoveredFramework = {
  root_directory: string;
  id: FRAMEWORK_ID;
  version?: string;
  single_page_app: boolean;
  dist_directory: string;
  packageManager: {
    id: PACKAGE_MANAGER_ID;
    version?: string;
    metadata: Record<string, any>;
  }
  monorepo_tooling?: Record<string, any>;
  platform: {
    id: PLATFORM_ID;
    version: string;
  }
  bundledWith?: Array<FRAMEWORK_ID>;
  commands: {
    install: Command[];
    build: Command[];
    dev: Command;
    serve?: Command;
  }
  known_adapters?: Partial<Record<TARGET_PLATFORM, {
    id: string;
    channel: "community" | "experimental" | "official";
  }>>;
  discoveryComplete: boolean;
  stepsNeededForDiscovery?: Array<"install" | "build">;
};

export type TARGET_PLATFORM = "firebase";

export type MockFileSystem = {
    readFile: (path: string) => Promise<Buffer>;
    pathExists: (path: string) => Promise<boolean>;
    readJson: (path: string) => Promise<any>;
};
