import type { CustomGenerateItem } from './openAPIParserMock/index';
export declare type genMockDataServerConfig = {
    openAPI: any;
    mockFolder: string;
    customGenerateList?: CustomGenerateItem[];
    mockPathPrefix?: string;
};
declare const mockGenerator: ({ openAPI, mockFolder, customGenerateList, mockPathPrefix, }: genMockDataServerConfig) => Promise<void>;
export { mockGenerator };
