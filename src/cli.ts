#!/usr/bin/env node

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

import { exit } from 'process';

const options = process.argv.slice(3);
const command = process.argv[2];

import { build } from './commands/build';
import { init } from './commands/init';
import { serve } from './commands/serve';
import { deploy } from './commands/deploy';

const commands = { build, init, serve, deploy };

// @ts-ignore
commands[command](...options).then(() => exit(0)).catch((e: any) => {
    console.error(e.message ?? e);
    exit(1);
});
