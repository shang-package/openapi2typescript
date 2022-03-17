"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/* eslint-disable no-continue */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const memoizee_1 = (0, tslib_1.__importDefault)(require("memoizee"));
const utils = (0, tslib_1.__importStar)(require("./utils"));
const primitives_1 = (0, tslib_1.__importDefault)(require("./primitives"));
const getDateByName = (name, parentsKey) => {
    if (!name || name.length < 1) {
        return 'string';
    }
    if (Array.isArray(name)) {
        return getDateByName([...name].pop(), name);
    }
    if (['nickname', 'name'].includes(name)) {
        return 'cname';
    }
    if (['owner', 'firstName', 'lastName', 'username'].includes(name)) {
        return 'name';
    }
    if (['avatar'].includes(name)) {
        return 'avatar';
    }
    if (['group'].includes(name)) {
        return 'group';
    }
    if (name.toLocaleLowerCase().endsWith('id')) {
        return 'uuid';
    }
    if (name.toLocaleLowerCase().endsWith('type') ||
        name.toLocaleLowerCase().endsWith('key') ||
        ['key'].includes(name)) {
        return 'id';
    }
    if (name.toLocaleLowerCase().endsWith('label') || ['label'].includes(name)) {
        const newParents = [...parentsKey];
        newParents.pop();
        const newType = getDateByName(newParents);
        if (newType !== 'string' && newType !== 'csentence') {
            return newType;
        }
        return 'label';
    }
    if (['email'].includes(name)) {
        return 'email';
    }
    if (['password'].includes(name)) {
        return 'string(16)';
    }
    if (['phone'].includes(name)) {
        return 'phone';
    }
    if (['province'].includes(name)) {
        return 'province';
    }
    if (['city'].includes(name)) {
        return 'city';
    }
    if (['addr', 'address'].includes(name)) {
        return 'county';
    }
    if (['country'].includes(name)) {
        return 'country';
    }
    if (['url', 'imageUrl', 'href'].includes(name) ||
        name.toLocaleLowerCase().endsWith('url') ||
        name.toLocaleLowerCase().endsWith('urls') ||
        name.toLocaleLowerCase().endsWith('image') ||
        name.toLocaleLowerCase().endsWith('link')) {
        return 'href';
    }
    if (name.toLocaleLowerCase().endsWith('errorcode')) {
        return 'errorCode';
    }
    if (['type', 'status'].includes(name) ||
        name.toLocaleLowerCase().endsWith('status') ||
        name.toLocaleLowerCase().endsWith('type')) {
        return 'status';
    }
    if (name.toLocaleLowerCase().endsWith('authority')) {
        return 'authority';
    }
    return 'csentence';
};
function primitive(schemaParams, propsName) {
    const schema = utils.objectify(schemaParams);
    const { type, format } = schema;
    const value = primitives_1.default[`${type}_${format || getDateByName(propsName)}`] || primitives_1.default[type];
    if (typeof schema.example === 'undefined') {
        return value || `Unknown Type: ${schema.type}`;
    }
    return schema.example;
}
class OpenAPIGeneratorMockJs {
    constructor(openAPI, cgl) {
        this.customGenerateList = [];
        this.sampleFromSchema = (schema, propsName) => {
            const localSchema = schema.$ref
                ? utils.get(this.openAPI, schema.$ref.replace('#/', '').split('/'))
                : utils.objectify(schema);
            let { type } = localSchema;
            const { properties, additionalProperties, items } = localSchema;
            if (!type) {
                if (properties) {
                    type = 'object';
                }
                else if (items) {
                    type = 'array';
                }
                else {
                    return null;
                }
            }
            if (type === 'object') {
                const props = utils.objectify(properties);
                const obj = {};
                for (const name in props) {
                    obj[name] = this.sampleFromSchema(props[name], [...(propsName || []), name]);
                }
                this.customGenerateList.forEach(({ check, type: t, transform }) => {
                    if (t !== type) {
                        return;
                    }
                    let checkFn;
                    if (typeof check === 'string') {
                        checkFn = () => {
                            return schema.$ref === check;
                        };
                    }
                    else {
                        checkFn = check;
                    }
                    if (!(checkFn === true || (typeof checkFn === 'function' && checkFn(schema, props, obj)))) {
                        return;
                    }
                    let transformFn;
                    if (typeof transform === 'function') {
                        transformFn = transform;
                    }
                    else {
                        transformFn = () => {
                            Object.entries(transform).forEach(([key, value]) => {
                                if (props[key]) {
                                    obj[key] = value;
                                }
                            });
                        };
                    }
                    transformFn(schema, props, obj);
                });
                if (additionalProperties === true) {
                    obj.additionalProp1 = {};
                    return obj;
                }
                if (additionalProperties) {
                    const additionalProps = utils.objectify(additionalProperties);
                    const additionalPropVal = this.sampleFromSchema(additionalProps, propsName);
                    for (let i = 1; i < 4; i += 1) {
                        obj[`additionalProp${i}`] = additionalPropVal;
                    }
                }
                return obj;
            }
            if (type === 'array') {
                const item = this.sampleFromSchema(items, propsName);
                return new Array(parseInt((Math.random() * 20).toFixed(0), 10)).fill(item);
            }
            if (localSchema.enum) {
                if (localSchema.default)
                    return localSchema.default;
                return utils.normalizeArray(localSchema.enum)[0];
            }
            if (type === 'file') {
                return null;
            }
            return primitive(localSchema, propsName);
        };
        this.parser = () => {
            const openAPI = Object.assign({}, this.openAPI);
            for (const path in openAPI.paths) {
                for (const method in openAPI.paths[path]) {
                    const api = openAPI.paths[path][method];
                    for (const code in api.responses) {
                        const response = api.responses[code];
                        const schema = response.content &&
                            response.content['*/*'] &&
                            utils.inferSchema(response.content['*/*']);
                        if (schema) {
                            response.example = schema ? this.sampleFromSchema(schema) : null;
                        }
                    }
                    if (!api.parameters)
                        continue;
                    for (const parameter of api.parameters) {
                        const schema = utils.inferSchema(parameter);
                        parameter.example = schema ? this.sampleFromSchema(schema) : null;
                    }
                }
            }
            return openAPI;
        };
        this.openAPI = openAPI;
        this.sampleFromSchema = (0, memoizee_1.default)(this.sampleFromSchema);
        if (cgl === null || cgl === void 0 ? void 0 : cgl.length) {
            this.customGenerateList = cgl;
        }
    }
    addCustomGenerateItem(v, position) {
        this.customGenerateList[position](v);
    }
    delCustomGenerateItem(v) {
        const index = this.customGenerateList.findIndex((item) => {
            return item === v;
        });
        if (index >= 0) {
            this.customGenerateList.splice(index, 1);
        }
    }
}
exports.default = OpenAPIGeneratorMockJs;