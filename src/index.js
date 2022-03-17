"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.generateService = exports.getSchema = void 0;
const tslib_1 = require("tslib");
/* eslint-disable global-require */
const node_fetch_1 = (0, tslib_1.__importDefault)(require("node-fetch"));
const path_1 = require("path");
const swagger2openapi_1 = (0, tslib_1.__importDefault)(require("swagger2openapi"));
const log_1 = (0, tslib_1.__importDefault)(require("./log"));
const mockGenerator_1 = require("./mockGenerator");
const serviceGenerator_1 = require("./serviceGenerator");
const getImportStatement = (requestLibPath) => {
    if (requestLibPath && requestLibPath.startsWith('import')) {
        return requestLibPath;
    }
    if (requestLibPath) {
        return `import request from '${requestLibPath}'`;
    }
    return `import { request } from "umi"`;
};
const converterSwaggerToOpenApi = (swagger) => {
    if (!swagger.swagger) {
        return swagger;
    }
    return new Promise((rs, rj) => {
        swagger2openapi_1.default.convertObj(swagger, {}, (err, options) => {
            (0, log_1.default)(['💺 将 Swagger 转化为 openAPI']);
            if (err) {
                rj(err);
                return;
            }
            rs(options.openapi);
        });
    });
};
const getSchema = (schemaPath) => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    if (schemaPath.startsWith('http')) {
        try {
            const json = yield (0, node_fetch_1.default)(schemaPath).then((rest) => rest.json());
            return json;
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.log('fetch openapi error:', error);
        }
        return null;
    }
    const schema = require(schemaPath);
    return schema;
});
exports.getSchema = getSchema;
const getOpenAPIConfig = (schemaPath) => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    const schema = yield (0, exports.getSchema)(schemaPath);
    if (!schema) {
        return null;
    }
    const openAPI = yield converterSwaggerToOpenApi(schema);
    return openAPI;
});
// 从 appName 生成 service 数据
const generateService = (_a) => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    var { requestLibPath, schemaPath, mockFolder, customGenerateList, mockPathPrefix = '', onlyMock } = _a, rest = (0, tslib_1.__rest)(_a, ["requestLibPath", "schemaPath", "mockFolder", "customGenerateList", "mockPathPrefix", "onlyMock"]);
    const openAPI = yield getOpenAPIConfig(schemaPath);
    if (onlyMock !== true) {
        const requestImportStatement = getImportStatement(requestLibPath);
        const serviceGenerator = new serviceGenerator_1.ServiceGenerator(Object.assign({ namespace: 'API', requestImportStatement }, rest), openAPI);
        serviceGenerator.genFile();
    }
    if (mockFolder) {
        yield (0, mockGenerator_1.mockGenerator)({
            openAPI,
            mockFolder: mockFolder || './mocks/',
            customGenerateList,
            mockPathPrefix,
        });
    }
});
exports.generateService = generateService;
function toUpperFirstLetter(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
function toLowerFirstLetter(text) {
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
function generate(configPath, openapiConfig) {
    const list = openapiConfig.map((item) => {
        let { serversPath, mockFolder } = item;
        if (!item.hook) {
            item.hook = { customFunctionName };
        }
        else if (!item.hook.customFunctionName && item.hook.customFunctionName !== false) {
            item.hook.customFunctionName = customFunctionName;
        }
        serversPath = (0, path_1.resolve)(configPath, '../', serversPath);
        if (mockFolder) {
            mockFolder = (0, path_1.resolve)(configPath, '../', mockFolder);
        }
        if (item.mock === false) {
            mockFolder = undefined;
        }
        return Object.assign(Object.assign({}, item), { serversPath,
            mockFolder, onlyMock: item.onlyMock });
    });
    return Promise.all(list.map((config) => {
        return (0, exports.generateService)(config);
    }));
}
exports.generate = generate;
