import { adapterBuild } from "./adapter-builds.js";


export async function localApphostingBuild(projectRoot: string, framework: string): Promise<string> {
  return await adapterBuild(projectRoot, framework);
};
