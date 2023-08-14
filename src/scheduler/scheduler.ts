import {CronJob, SimpleIntervalJob, ToadScheduler} from "toad-scheduler";
import {createHeartbeatTask} from "./tasks/heartbeatTask.js";
import {OperatorConfig} from "../common/infrastructure/OperatorConfig.js";
import {AppLogger} from "../common/logging.js";
import {processPendingDigests} from "./tasks/processPendingDigests.js";
import {mergeArr} from "../utils/index.js";

export const initScheduler = (config: OperatorConfig, parentLogger: AppLogger) => {
    const scheduler = new ToadScheduler()
    const logger = parentLogger.child({labels: ['Scheduler']}, mergeArr)

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
                processPendingDigests(`${digest.name !== undefined ? `${digest.name} ` : ''}${cron}`, digest, parentLogger)));
            logger.info(`Added Digest ${digest.slug} to run ${digest.cron}`);
        }
    }

    logger.info('Scheduler started.');
}
