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
        scheduler.addCronJob(new CronJob({
                cronExpression: digest.cron,
            },
            processPendingDigests(digest, parentLogger)));
        logger.info(`Added Digest ${digest.slug} to run ${digest.cron}`);
    }

    logger.info('Scheduler started.');
}
