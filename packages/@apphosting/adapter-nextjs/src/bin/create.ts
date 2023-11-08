#! /usr/bin/env node
import { spawn } from "child_process";

const [, , projectDirectory] = process.argv;
const cwd = process.cwd();

export const CREATE_NEXT_APP_VERSION = "~14.0.0";

spawn('npx', ['-y', '-p', `create-next-app@${CREATE_NEXT_APP_VERSION}`, 'create-next-app', '--example', 'hello-world', '--ts', '--use-npm', projectDirectory], {
  cwd,
  shell: true,
  stdio: "inherit",
});
