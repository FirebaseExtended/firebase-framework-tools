import { spawnSync } from "child_process";
import { yellow, bgRed, bold } from "colorette";

export async function adapterBuild(projectRoot: string, framework: string): Promise<string> {
  // TODO(#382): We are using the latest framework adapter versions, but in the future
  // we should parse the framework version and use the matching adapter version.
  const adapterName = `@apphosting/adapter-${framework}`;
  const packumentResponse = await fetch(`https://registry.npmjs.org/${adapterName}`);
  if (!packumentResponse.ok)
    throw new Error(
      `Failed to fetch ${adapterName}: ${packumentResponse.status} ${packumentResponse.statusText}`,
    );
  let packument;
  try {
    packument = await packumentResponse.json();
  } catch (e) {
    throw new Error(`Failed to parse response from NPM registry for ${adapterName}.`);
  }
  const adapterVersion = packument?.["dist-tags"]?.["latest"];
  if (!adapterVersion) {
    throw new Error(`Could not find 'latest' dist-tag for ${adapterName}`);
  }
  // TODO(#382): should check for existence of adapter in app's package.json and use that version instead.

  console.log(" 🔥", bgRed(` ${adapterName}@${yellow(bold(adapterVersion))} `), "\n");

  const buildCommand = `apphosting-adapter-${framework}-build`;
  const build = spawnSync(
    "npx", ["-y", "-p", `${adapterName}@${adapterVersion}`, buildCommand], {
      cwd: projectRoot, stdio: "inherit" });
  if (build.status !== 0) {
    throw new Error("Unable to build your app");
  }
  // TODO: angular's dist/ may be ~= .next/standalone
  return ".next/standalone"
}
