import {BaseMessageOptions} from "discord.js";

export type DiscordLogLevel = "error" | "warn" | "safety" | "info" | "verbose" | "debug";

export type ConfigFormat = 'yaml';

export interface NamedGroup {
    [name: string]: any
}

export interface RegExResult {
    match: string,
    groups: string[],
    index: number
    named: NamedGroup
}
export interface numberFormatOptions {
    toFixed: number,
    defaultVal?: any,
    prefix?: string,
    suffix?: string,
    round?: {
        type?: string,
        enable: boolean,
        indicate?: boolean,
    }
}

/**
 * A shorthand value for a DayJS duration consisting of a number value and time unit
 *
 * * EX `9 days`
 * * EX `3 months`
 * @pattern ^\s*(?<time>\d+)\s*(?<unit>days?|weeks?|months?|years?|hours?|minutes?|seconds?|milliseconds?)\s*$
 * */
export type DayJSShorthand = string;
/**
 * An ISO 8601 Duration
 * @pattern ^(-?)P(?=\d|T\d)(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)([DW]))?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$
 * */
export type ISO8601 = string;
export type DurationString = DayJSShorthand | ISO8601;

export interface PopularityThresholdLevel {
    count: number
    level: number
}

export interface IncomingFileData {
    buffer: Buffer
    name: string
    mimetype: string
    fieldName?: string
    size: number
}

export interface TautulliRequestData {
    id: number,
    content: BaseMessageOptions
}

export interface TautulliRequestFileData extends FileData {
    tautulliRequestId: number
    content: Buffer
    filename: string
}

export interface FileData {
    content: Buffer
    filename: string
}

export interface EventAwareBaseMessageOptions extends BaseMessageOptions {
    includedEvents: number
}
