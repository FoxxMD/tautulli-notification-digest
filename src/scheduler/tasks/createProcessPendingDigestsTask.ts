import {mergeArr, sleep} from "../../utils/index.js";
import {AsyncTask} from "toad-scheduler";
import {PromisePool} from "@supercharge/promise-pool";
import {DigestData, OperatorConfig} from "../../common/infrastructure/OperatorConfig.js";
import {AppLogger} from "../../common/logging.js";
import {APIEmbed, AttachmentBuilder, WebhookClient} from "discord.js";
import {TautulliRequest} from "../../common/db/models/TautulliRequest.js";
import {ErrorWithCause} from "pony-cause";
import {buildMessages} from "../../discord/builder.js";
import {processPendingDigests} from "../../common/funcs/processPendingDigests.js";

export const createProcessPendingDigestsTask = (id: string, digest: DigestData, parentLogger: AppLogger) => {
    const digestLogger = parentLogger.child({labels: [`Digest ${id}`]}, mergeArr);
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
