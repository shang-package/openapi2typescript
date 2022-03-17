interface CustomGenerateItem {
    check: (schema: any) => boolean | string;
    type: 'object';
    transform: (result: Record<string, any>, props: Record<string, any>) => Record<string, any> | Record<string, any>;
}
declare class OpenAPIGeneratorMockJs {
    protected openAPI: any;
    private customGenerateList;
    constructor(openAPI: any, cgl?: CustomGenerateItem[]);
    addCustomGenerateItem(v: CustomGenerateItem, position: 'push' | 'unshift'): void;
    delCustomGenerateItem(v: CustomGenerateItem): void;
    sampleFromSchema: (schema: any, propsName?: string[]) => any;
    parser: () => any;
}
export type { CustomGenerateItem };
export default OpenAPIGeneratorMockJs;
