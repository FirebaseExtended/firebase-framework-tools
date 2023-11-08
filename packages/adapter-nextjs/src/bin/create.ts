#! /usr/bin/env node
import { spawnSync } from 'child_process';

const [,, projectDirectory] = process.argv;
const cwd = process.cwd();
spawnSync('create-next-app', ['--example', 'hello-world', '--ts', '--use-npm', projectDirectory], { cwd, stdio: "inherit" });
