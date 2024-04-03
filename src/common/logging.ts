import { Logger, loggerAppRolling, LogOptions } from '@foxxmd/logging';
import {dataDir} from "./index.js";

export const appLogger = async (config: LogOptions = {}): Promise<Logger> => {
    const logger = await loggerAppRolling(config, {
        logBaseDir: dataDir,
        logDefaultPath: './logs/app.log'
    });
    return logger;
}
