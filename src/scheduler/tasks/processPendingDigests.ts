import {mergeArr, sleep} from "../../utils/index.js";
import {AsyncTask} from "toad-scheduler";
import {PromisePool} from "@supercharge/promise-pool";
import {DigestData, OperatorConfig} from "../../common/infrastructure/OperatorConfig.js";
import {AppLogger} from "../../common/logging.js";
import {APIEmbed, AttachmentBuilder, WebhookClient} from "discord.js";
import {TautulliRequest} from "../../common/db/models/TautulliRequest.js";
import {ErrorWithCause} from "pony-cause";
import {buildMessages} from "../../discord/builder.js";

export const processPendingDigests = (digest: DigestData, parentLogger: AppLogger) => {
    const digestLogger = parentLogger.child({labels: ['Digest']}, mergeArr);
    return new AsyncTask(
        'Digest',
        (): Promise<any> => {
            return PromisePool
                .withConcurrency(1)
                .for([digest])
                .process(async (digest: DigestData) => {

                    const {
                        slug,
                        discord: {
                            webhook
                        }
                    } = digest;

                    const logger = digestLogger.child({labels: slug}, mergeArr);

                    let sentEvents = 0;
                    let sentMessages = 0;

                    const client = new WebhookClient({url: webhook});

                    const pending = await TautulliRequest.findAll({where: {slug, status: 'pending'}, include: 'files'});
                    logger.info(`Found ${pending.length} tautulli requests`);
                    if (pending.length === 0) {
                        return {
                            sentEmbeds: sentEvents,
                            sentMessages
                        }
                    }
                    const allImages = (await Promise.all(pending.map(async (r) => await r.getFiles()))).flat(1);

                    const [messages, events] = buildMessages(digest, pending, allImages);

                    for (const message of messages) {
                        try {
                            await client.send(message);
                            sentEvents += message.includedEvents;
                        } catch (e) {
                            logger.error(new ErrorWithCause('Failed to send Plex embed', {cause: e}));
                        } finally {
                            await sleep(4000);
                        }
                    }

                    logger.info(`Sent ${sentEvents} embeds in ${sentMessages} messages`);

                    const transaction = await TautulliRequest.sequelize.transaction();

                    for (const req of pending) {
                        req.status = 'processed';
                        await req.save({transaction});
                    }

                    try {
                        await transaction.commit();
                    } catch (e) {
                        logger.error('Failed to save request processed statuses!', {cause: e});
                        await transaction.rollback();
                    }

                    return {
                        sentEmbeds: sentEvents,
                        sentMessages
                    }
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
