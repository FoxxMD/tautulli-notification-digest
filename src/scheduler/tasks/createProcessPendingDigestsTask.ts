import { childLogger, Logger } from "@foxxmd/logging";
import dayjs from "dayjs";
import {AsyncTask} from "toad-scheduler";
import {PromisePool} from "@supercharge/promise-pool";
import {Cron} from 'croner';
import {DigestData} from "../../common/infrastructure/OperatorConfig.js";
import {processPendingDigests} from "../../common/funcs/processPendingDigests.js";

export const createProcessPendingDigestsTask = (id: string, digest: DigestData, parentLogger: Logger, cron?: string) => {
    const digestLogger = childLogger(parentLogger, `Cron ${id}`);
    return new AsyncTask(
        `Digest - ${id} ${digest.slug}`,
        (): Promise<any> => {
            return PromisePool
                .withConcurrency(1)
                .for([digest])
                .process(async (digest: DigestData) => {
                    await processPendingDigests(digest, digestLogger);
                }).then(({results, errors}) => {
                    if (errors.length > 0) {
                        digestLogger.error(`Encountered errors!`);
                        for (const err of errors) {
                            digestLogger.error(err);
                        }
                    }
                    if(cron !== undefined) {
                        digestLogger.info(`Next Run at ${dayjs(Cron(cron).nextRun()).format()}`);
                    }
                });
        },
        (err: Error) => {
            digestLogger.error(err);
        }
    );
}
