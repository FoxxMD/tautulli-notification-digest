import {Document as YamlDocument} from "yaml";
import YamlConfigDocument from "./YamlConfigDocument";
import {ConfigDocumentInterface} from "./AbstractConfigDocument";
import {ConfigToObjectOptions} from "./ConfigToObjectOptions";
import {ConfigFormat} from "../infrastructure/Atomic.js";
import {SimpleError} from "../../utils/Errors.js";

export const parseFromYamlToObject = (content: string, options?: ConfigToObjectOptions): [ConfigFormat, ConfigDocumentInterface<YamlDocument | object>?, Error?] => {
    let obj;
    let configFormat: ConfigFormat = 'yaml';
    let jsonErr,
        yamlErr;

    const {
        location,
        yamlDocFunc = (content: string, location?: string) => new YamlConfigDocument(content, location),
        allowArrays = false,
    } = options || {};

    try {
        const yamlObj = yamlDocFunc(content, location)
        const output = yamlObj.toJS();
        const oType = output === null ? 'null' : typeof output;
        if (oType !== 'object') {
            yamlErr = new SimpleError(`Parsing as yaml produced data of type '${oType}' (expected 'object')`);
            obj = undefined;
        } else if (obj === undefined) {
            configFormat = 'yaml';
            if (yamlObj.parsed.errors.length !== 0) {
                yamlErr = new Error(yamlObj.parsed.errors.join('\n'))
            } else {
                obj = yamlObj;
            }
        }
    } catch (err: any) {
        yamlErr = err;
    }

    return [configFormat, obj, yamlErr];
}
