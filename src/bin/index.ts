#!/usr/bin/env node

import { existsSync } from 'fs';
import { resolve } from 'path';
import { generateService } from '../index';

function toUpperFirstLetter(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function toLowerFirstLetter(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function customFunctionName(arg) {
  const { path, method, operationId } = arg;

  if (!path) {
    return operationId;
  }

  const tmp = [...path.replace(/[{}]/g, '').split('/'), method]
    .map((v) => {
      return toUpperFirstLetter(v);
    })
    .join('');

  return toLowerFirstLetter(tmp);
}

const configPath = resolve(process.cwd(), process.argv[2]);
const isExist = existsSync(configPath);

if (!isExist) {
  throw new Error(`${configPath} not exists`);
}

const list = require(configPath).map((item) => {
  const { serversPath } = item;

  if (!item.hook) {
    item.hook = { customFunctionName };
  } else if (!item.hook.customFunctionName && item.hook.customFunctionName !== false) {
    item.hook.customFunctionName = customFunctionName;
  }

  return {
    ...item,
    serversPath: resolve(configPath, '../', serversPath),
  };
});

console.log('==================', { isExist, list });

list.forEach((config) => {
  generateService(config);
});
