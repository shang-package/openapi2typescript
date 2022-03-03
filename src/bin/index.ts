#!/usr/bin/env node

import { existsSync } from 'fs';
import { resolve } from 'path';
import { generate } from '../index';

const configPath = resolve(process.cwd(), process.argv[2]);
const isExist = existsSync(configPath);

if (!isExist) {
  throw new Error(`${configPath} not exists`);
}

console.log(configPath);

const openapiConfig = require(configPath);

generate(configPath, openapiConfig).catch(console.error);
