import { childLogger, Logger } from "@foxxmd/logging";
import {CronJob, SimpleIntervalJob, ToadScheduler} from "toad-scheduler";
import {createHeartbeatTask} from "./tasks/heartbeatTask.js";
import {OperatorConfig} from "../common/infrastructure/OperatorConfig.js";
import {createProcessPendingDigestsTask} from "./tasks/createProcessPendingDigestsTask.js";
import {mergeArr} from "../utils/index.js";

export const initScheduler = (config: OperatorConfig, parentLogger: Logger) => {
    const scheduler = new ToadScheduler()
    const logger = childLogger(parentLogger, 'Scheduler');

    scheduler.addSimpleIntervalJob(new SimpleIntervalJob({
        minutes: 30,
        runImmediately: true,
    }, createHeartbeatTask(config, parentLogger)));

    for (const digest of config.digests) {
        const crons = Array.isArray(digest.cron) ? digest.cron : [digest.cron];
        for(const cron of crons) {
            scheduler.addCronJob(new CronJob({
                    cronExpression: cron,
                },
                createProcessPendingDigestsTask(`${digest.name !== undefined ? `${digest.name} ` : ''}${cron}`, digest, parentLogger)));
            logger.info(`Added Digest ${digest.slug} to run ${digest.cron}`);
        }
    }

    logger.info('Scheduler started.');
}
