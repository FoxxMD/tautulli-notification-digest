import {LoggingOptions} from "./Logging.js";
import YamlConfigDocument from "../config/YamlConfigDocument.js";
import {Options} from "sequelize/types/sequelize.js";

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
    database?: DatabaseConfig,
    digests: DigestData[]
    defaults?: DefaultOptions
    port?: number
}

export interface EventFormatOptions {
    enabled?: boolean
    threshold: number
    truncateDescription?: number
    includeLinks?: boolean
}

export interface EventFormats {
    poster?: false | number | EventFormatOptions
    thumbnail?: false | number | EventFormatOptions
    text?: false | number | EventFormatOptions
    list?: false | number
}

export interface DiscordOptions extends EventFormats {
    eventsPerMessage?: number
    overflowTruncate?: number
}

export const discordOptionsDef: DiscordOptions = {
    eventsPerMessage: 1000,
    overflowTruncate: 20,
    poster: 0,
    thumbnail: 2,
    text: false,
    list: false,
};
export const discordOptionDefObj = (): Required<DiscordOptions> => ({
    eventsPerMessage: 1000,
    overflowTruncate: 20,
    poster: 0,
    thumbnail: 2,
    text: false,
    list: false,
});

export interface DiscordData {
    webhook: string
    options?: DiscordOptions
}

export type DedupBehavior = 'all' | 'session' | 'never';

export interface DigestData {
    name?: string
    slug: string
    cron: string | string[]
    discord: DiscordData
    dedup?: DedupBehavior
}

export interface DatabaseConfig extends Pick<Options, 'username' | 'password' | 'host' | 'port' | 'database'> {
    dialect: 'sqlite' | 'mariadb' | 'mysql'
}

export interface DefaultOptions {
    dedup?: DedupBehavior
    webhook?: string
    discordOptions?: DiscordOptions
}
