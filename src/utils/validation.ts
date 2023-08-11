import Ajv from "ajv";
import {Logger} from "@foxxmd/winston";
import {AppLogger} from "../common/logging.js";

export const createAjvFactory = (logger: AppLogger): Ajv => {
    const validator =  new Ajv({logger, verbose: true, strict: "log", allowUnionTypes: true});
    // https://ajv.js.org/strict-mode.html#unknown-keywords
    validator.addKeyword('deprecationMessage');
    return validator;
}
