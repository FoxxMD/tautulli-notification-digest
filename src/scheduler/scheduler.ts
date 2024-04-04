import { childLogger, Logger } from "@foxxmd/logging";
import dayjs from "dayjs";
import {CronJob, SimpleIntervalJob, ToadScheduler} from "toad-scheduler";
import {createHeartbeatTask} from "./tasks/heartbeatTask.js";
import {OperatorConfig} from "../common/infrastructure/OperatorConfig.js";
import {createProcessPendingDigestsTask} from "./tasks/createProcessPendingDigestsTask.js";
import {Cron} from 'croner';

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
            try {
                const nextCron = Cron(cron).nextRun();
                scheduler.addCronJob(new CronJob({
                        cronExpression: cron,
                    },
                    createProcessPendingDigestsTask(`${digest.name !== undefined ? `${digest.name} ` : ''}${cron}`, digest, parentLogger, cron)));
                logger.info(`Digest ${digest.slug} started with CRON ${cron.padEnd(16, ' ')} -> Next run at ${dayjs(nextCron).format()}`);
            } catch (e) {
                logger.error(new Error(`Failed to create digest for cron ${cron}`, {cause: e}))
            }
        }
    }

    logger.info('Scheduler started.');
}
