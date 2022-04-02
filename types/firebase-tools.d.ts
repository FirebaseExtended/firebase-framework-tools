// Copyright 2022 Google LLC
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

declare module 'firebase-tools/lib/hosting/normalizedHostingConfigs' {
  export const normalizedHostingConfigs = any;
}

declare module 'firebase-tools' {

  export interface DeployOptions {
    project: string;
  }

  export interface FirebaseProject {
    projectId: string;
    projectNumber: string;
    displayName: string;
    name: string;
    resources: { [key: string]: string };
    state: string;
  }

  export interface FirebaseFunction {
    platform: 'gcfv2' | 'gcfv1',
    id: string,
    project: string,
    region: string,
    eventTrigger: Record<string, any>,
    entryPoint: string,
    runtime: string,
    uri: string,
    serviceAccountEmail: string,
    ingressSettings: string,
    environmentVariables: Record<string, any>,
    availableMemoryMb: number,
    timeout: string,
    maxInstances: number,
    labels: Record<string, string>,
  }

  export interface FirebaseDeployConfig {
    cwd: string;
    only?: string;
    token?: string;
    [key: string]: any;
  }

  export interface FirebaseApp {
    name: string;
    displayName: string;
    platform: string;
    appId: string;
    namespace: string;
  }

  export interface FirebaseHostingSite {
    name: string;
    defaultUrl: string;
    type: string;
    appId: string|undefined;
  }

  export interface FirebaseSDKConfig {
    fileName: string;
    fileContents: string;
    sdkConfig: {
      [key: string]: string
    };
  }


  export default Firebase;

  export namespace Firebase {
    const projects: {
      list(options: any): Promise<FirebaseProject[]>;
      create(projectId: string|undefined, options: any): Promise<FirebaseProject>;
    };

    const apps: {
      list(platform: string|undefined, options: any): Promise<FirebaseApp[]>;
      create(platform: string, displayName: string|undefined, options: any): Promise<FirebaseApp>;
      sdkconfig(type: string, projectId: string, options: any): Promise<FirebaseSDKConfig>;
    };

    const hosting: {
      sites: {
        list(options: any): Promise<{ sites: FirebaseHostingSite[]}>;
        create(siteId: string, options: any): Promise<FirebaseHostingSite>;
      }
    };

    const functions: {
      list(options: any): Promise<FirebaseFunction[]>;
    }

   const logger: {
      logger: {
        add: (...args: any[]) => any;
      }
    };

    const cli: {
      version(): string;
    };

    const login: {
      list(): Promise<{user: Record<string, any>}[]>;
      add(): Promise<Record<string, any>>;
      use(email: string, options?: {}): Promise<string>;
    } & ((options?: {}) => Promise<Record<string, any>>);

    const deploy: (config: FirebaseDeployConfig) => Promise<any>;

    const serve: (options: any) => Promise<any>;

    const use: (options: any, lol: any) => Promise<any>;
  }

}
