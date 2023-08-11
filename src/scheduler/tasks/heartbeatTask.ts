import {mergeArr} from "../../utils/index.js";
import {AsyncTask} from "toad-scheduler";
import {PromisePool} from "@supercharge/promise-pool";

export const createHeartbeatTask = (bot: any) => {
    const logger = bot.logger.child({labels: 'Heartbeat'}, mergeArr);
    return new AsyncTask(
        'Heartbeat',
        (): Promise<any> => {
            let activeCount = 0;
            return PromisePool
                .withConcurrency(2)
                .for(['fsdf'])
                .process(async () => {
                    return 'ads'
                }).then(({results, errors}) => {
                    if (errors.length > 0) {
                        logger.error(`Encountered errors!`);
                        for(const err of errors) {
                            logger.error(err);
                        }
                    } else {
                        //logger.info(`Found ${results.reduce((acc, curr) => acc + curr,0)} active submissions across ${bot.guilds.length} guilds`);
                    }
                });
        },
        (err: Error) => {
            bot.logger.error(err);
        }
    );
}
