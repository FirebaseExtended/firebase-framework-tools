import { spawn } from "child_process";
import { program } from "commander";
import { yellow, bgRed, bold } from "colorette";

export async function adapterBuild(framework: string, projectRoot: string) {
  // TODO(#382): We are using the latest framework adapter versions, but in the future
  // we should parse the framework version and use the matching adapter version.
  const adapterName = `@apphosting/adapter-${framework}`;
  const packumentResponse = await fetch(`https://registry.npmjs.org/${adapterName}`);
  if (!packumentResponse.ok) throw new Error(`Something went wrong fetching ${adapterName}`);
  const packument = await packumentResponse.json();
  const adapterVersion = packument?.["dist-tags"]?.["latest"];
  if (!adapterVersion) {
    throw new Error(`Could not find 'latest' dist-tag for ${adapterName}`);
  }
  // TODO(#382): should check for existence of adapter in app's package.json and use that version instead.

  console.log(" 🔥", bgRed(` ${adapterName}@${yellow(bold(adapterVersion))} `), "\n");

  const buildCommand = `apphosting-adapter-${framework}-build`;
  await new Promise<void>((resolve, reject) => {
    const child = spawn("npx", ["-y", "-p", `${adapterName}@${adapterVersion}`, buildCommand], {
      cwd: projectRoot,
      shell: true,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`framework adapter build failed with error code ${code}.`));
      }
      resolve();
    });
  });
}
