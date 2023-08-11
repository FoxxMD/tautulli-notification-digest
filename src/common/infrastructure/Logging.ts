import {LogLevel} from "./Atomic.js";

export interface LoggingOptions {
    /**
     *  Specify the minimum log level for all log outputs without their own level specified.
     *
     *  Defaults to env `LOG_LEVEL` or `info` if not specified.
     *
     *  @default 'info'
     * */
    level?: LogLevel
    /**
     * Specify the minimum log level to output to rotating files. If `false` no log files will be created.
     * */
    file?: LogLevel | false
    /**
     * Specify the minimum log level streamed to the UI
     * */
    stream?: LogLevel
    /**
     * Specify the minimum log level streamed to the console (or docker container)
     * */
    console?: LogLevel

    db?: boolean

    discord?: LogLevel
}
