import { LogOptions } from "@foxxmd/logging";

export type DiscordLogLevel = "error" | "warn" | "safety" | "info" | "verbose" | "debug";

export interface LoggingOptions extends LogOptions {
    db?: boolean

    discord?: DiscordLogLevel
}
