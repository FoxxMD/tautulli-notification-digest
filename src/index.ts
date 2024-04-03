import { loggerDebug } from "@foxxmd/logging";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import duration from 'dayjs/plugin/duration.js';

import dotenv from 'dotenv';
import { appLogger } from "./common/logging.js";
import {parseConfigFromSources} from "./common/config/ConfigBuilder.js";
import {dataDir} from "./common/index.js";
import {initDB} from "./common/db/index.js";
import {initServer} from "./api/server.js";
import {initScheduler} from "./scheduler/scheduler.js";

dayjs.extend(utc)
dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(duration);

dotenv.config();

let logger = loggerDebug;
logger.debug(`Data Dir ENV: ${process.env.DATA_DIR} -> Resolved: ${dataDir}`);

(async function () {
    try {

        const config = await parseConfigFromSources();
        const {
            logging = {},
        } = config;



        const appLog = await appLogger(logging)
        const db = await initDB(config, appLog);
        logger = appLog;

        initServer(config, logger);
        initScheduler(config, logger);

    } catch (e) {
        logger.error('Exited with uncaught error');
        logger.error(e);
        process.kill(process.pid, 'SIGTERM');
    }
})();
