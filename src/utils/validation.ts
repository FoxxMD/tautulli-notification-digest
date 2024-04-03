import { Logger } from "@foxxmd/logging";
import Ajv from "ajv";

export const createAjvFactory = (logger: Logger): Ajv => {
    const validator =  new Ajv({logger, verbose: true, strict: "log", allowUnionTypes: true});
    // https://ajv.js.org/strict-mode.html#unknown-keywords
    validator.addKeyword('deprecationMessage');
    return validator;
}
