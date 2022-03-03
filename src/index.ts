/* eslint-disable global-require */
import fetch from 'node-fetch';
import type { OperationObject } from 'openapi3-ts';
import { resolve } from 'path';
import converter from 'swagger2openapi';
import Log from './log';
import { mockGenerator } from './mockGenerator';
import { ServiceGenerator } from './serviceGenerator';

const getImportStatement = (requestLibPath: string) => {
  if (requestLibPath && requestLibPath.startsWith('import')) {
    return requestLibPath;
  }
  if (requestLibPath) {
    return `import request from '${requestLibPath}'`;
  }
  return `import { request } from "umi"`;
};

export type GenerateServiceProps = {
  requestLibPath?: string;
  requestImportStatement?: string;
  /**
   * api 的前缀
   */
  apiPrefix?:
    | string
    | ((params: {
        path: string;
        method: string;
        namespace: string;
        functionName: string;
        autoExclude?: boolean;
      }) => string);
  /**
   * 生成的文件夹的路径
   */
  serversPath?: string;
  /**
   * openAPI 3.0 的地址
   */
  schemaPath?: string;
  /**
   * 项目名称
   */
  projectName?: string;

  hook?: {
    /** 自定义函数名称 */
    customFunctionName?: (data: OperationObject) => string;
    /** 自定义类名 */
    customClassName?: (tagName: string) => string;
  };
  namespace?: string;

  mockFolder?: string;
  /**
   * 模板文件的文件路径
   */
  templatesFolder?: string;

  customGenerateList?: any[];
  mockPathPrefix?: string;
};

const converterSwaggerToOpenApi = (swagger: any) => {
  if (!swagger.swagger) {
    return swagger;
  }
  return new Promise((rs, rj) => {
    converter.convertObj(swagger, {}, (err, options) => {
      Log(['💺 将 Swagger 转化为 openAPI']);
      if (err) {
        rj(err);
        return;
      }
      rs(options.openapi);
    });
  });
};

export const getSchema = async (schemaPath: string) => {
  if (schemaPath.startsWith('http')) {
    try {
      const json = await fetch(schemaPath).then((rest) => rest.json());
      return json;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('fetch openapi error:', error);
    }
    return null;
  }
  const schema = require(schemaPath);
  return schema;
};

const getOpenAPIConfig = async (schemaPath: string) => {
  const schema = await getSchema(schemaPath);
  if (!schema) {
    return null;
  }
  const openAPI = await converterSwaggerToOpenApi(schema);
  return openAPI;
};

// 从 appName 生成 service 数据
export const generateService = async ({
  requestLibPath,
  schemaPath,
  mockFolder,
  customGenerateList,
  mockPathPrefix = '',
  ...rest
}: GenerateServiceProps) => {
  const openAPI = await getOpenAPIConfig(schemaPath);
  const requestImportStatement = getImportStatement(requestLibPath);
  const serviceGenerator = new ServiceGenerator(
    {
      namespace: 'API',
      requestImportStatement,
      ...rest,
    },
    openAPI,
  );
  serviceGenerator.genFile();

  if (mockFolder) {
    await mockGenerator({
      openAPI,
      mockFolder: mockFolder || './mocks/',
      customGenerateList,
      mockPathPrefix,
    });
  }
};

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

function generate(configPath: string, openapiConfig: any[]) {
  const list = openapiConfig.map((item) => {
    let { serversPath, mockFolder } = item;

    if (!item.hook) {
      item.hook = { customFunctionName };
    } else if (!item.hook.customFunctionName && item.hook.customFunctionName !== false) {
      item.hook.customFunctionName = customFunctionName;
    }

    serversPath = resolve(configPath, '../', serversPath);

    if (mockFolder) {
      mockFolder = resolve(configPath, '../', mockFolder);
    }

    if (item.mock === false) {
      mockFolder = undefined;
    }

    return {
      ...item,
      serversPath,
      mockFolder,
    };
  });

  return Promise.all(
    list.map((config) => {
      return generateService(config);
    }),
  );
}

export { generate };
