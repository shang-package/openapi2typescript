import type { OperationObject } from 'openapi3-ts';
export declare type GenerateServiceProps = {
    requestLibPath?: string;
    requestImportStatement?: string;
    /**
     * api 的前缀
     */
    apiPrefix?: string | ((params: {
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
    onlyMock?: boolean;
};
export declare const getSchema: (schemaPath: string) => Promise<any>;
export declare const generateService: ({ requestLibPath, schemaPath, mockFolder, customGenerateList, mockPathPrefix, onlyMock, ...rest }: GenerateServiceProps) => Promise<void>;
declare function generate(configPath: string, openapiConfig: any[]): Promise<void[]>;
export { generate };