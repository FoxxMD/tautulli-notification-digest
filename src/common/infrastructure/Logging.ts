import { LogOptions } from "@foxxmd/logging";
import { DiscordLogLevel } from "./Atomic.js";

export interface LoggingOptions extends LogOptions {
    db?: boolean

    discord?: DiscordLogLevel
}
