import {LoggingOptions} from "./Logging.js";
import YamlConfigDocument from "../config/YamlConfigDocument.js";

export class YamlOperatorConfigDocument extends YamlConfigDocument<OperatorConfig> {

}

export interface OperatorFileConfig {
    document: YamlOperatorConfigDocument
    isWriteable?: boolean
}

export interface OperatorConfigWithFileContext extends OperatorConfig {
    fileConfig: OperatorFileConfig
}

export interface OperatorConfig extends OperatorJsonConfig {
}

export interface OperatorJsonConfig {
    /**
     * Settings to configure global logging defaults
     * */
    logging?: LoggingOptions,
}
