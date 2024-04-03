import { childLogger, Logger } from "@foxxmd/logging";
import {AsyncTask} from "toad-scheduler";
import {PromisePool} from "@supercharge/promise-pool";
import {DigestData} from "../../common/infrastructure/OperatorConfig.js";
import {processPendingDigests} from "../../common/funcs/processPendingDigests.js";

export const createProcessPendingDigestsTask = (id: string, digest: DigestData, parentLogger: Logger) => {
    const digestLogger = childLogger(parentLogger, `Digest ${id}`);
    return new AsyncTask(
        `Digest - ${id}`,
        (): Promise<any> => {
            return PromisePool
                .withConcurrency(1)
                .for([digest])
                .process(async (digest: DigestData) => {
                    await processPendingDigests(digest, parentLogger, id);
                }).then(({results, errors}) => {
                    if (errors.length > 0) {
                        digestLogger.error(`Encountered errors!`);
                        for (const err of errors) {
                            digestLogger.error(err);
                        }
                    } else {
                        //digestLogger.info(`TOTAL: Sent ${results.reduce((acc, curr) => acc += curr.sentEmbeds, 0)} embeds in ${results.reduce((acc, curr) => acc += curr.sentMessages, 0)} messages`);
                    }
                });
        },
        (err: Error) => {
            digestLogger.error(err);
        }
    );
}
