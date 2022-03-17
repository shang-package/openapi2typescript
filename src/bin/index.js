#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const index_1 = require("../index");
const configPath = (0, path_1.resolve)(process.cwd(), process.argv[2]);
const isExist = (0, fs_1.existsSync)(configPath);
if (!isExist) {
    throw new Error(`${configPath} not exists`);
}
console.log(configPath);
const openapiConfig = require(configPath);
(0, index_1.generate)(configPath, openapiConfig).catch(console.error);
