import {mergeArr} from "../../utils/index.js";
import {AsyncTask} from "toad-scheduler";
import {PromisePool} from "@supercharge/promise-pool";
import {DigestData, OperatorConfig} from "../../common/infrastructure/OperatorConfig.js";
import {AppLogger} from "../../common/logging.js";
import {TautulliRequest} from "../../common/db/models/TautulliRequest.js";

export const createHeartbeatTask = (config: OperatorConfig, parentLogger: AppLogger) => {
    const logger = parentLogger.child({labels: ['Heartbeat']}, mergeArr);
    return new AsyncTask(
        'Heartbeat',
        (): Promise<any> => {
            let activeCount = 0;
            return PromisePool
                .withConcurrency(1)
                .for(config.digests)
                .process(async (digest: DigestData) => {
                    const pending = await TautulliRequest.findAll({where: {slug: digest.slug, status: 'pending'}});
                    logger.info(`Digest ${digest.slug} has ${pending.length} pending events`);
                    return pending.length;
                }).then(({results, errors}) => {
                    if (errors.length > 0) {
                        logger.error(`Encountered errors!`);
                        for (const err of errors) {
                            logger.error(err);
                        }
                    } else {
                        logger.info(`Monitoring ${results.length} digests with ${results.reduce((acc, curr) => acc += curr,0)} pending events`);
                    }
                });
        },
        (err: Error) => {
            logger.error(err);
        }
    );
}
