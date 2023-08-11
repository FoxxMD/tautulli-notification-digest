import {chunk, mergeArr, sleep} from "../../utils/index.js";
import {AsyncTask} from "toad-scheduler";
import {PromisePool} from "@supercharge/promise-pool";
import {DigestData, OperatorConfig} from "../../common/infrastructure/OperatorConfig.js";
import {AppLogger} from "../../common/logging.js";
import {APIEmbed, AttachmentBuilder, WebhookClient} from "discord.js";
import {TautulliRequest} from "../../common/db/models/TautulliRequest.js";
import {ErrorWithCause} from "pony-cause";

export const processPendingDigests = (digest: DigestData, parentLogger: AppLogger) => {
    const digestLogger = parentLogger.child({labels: ['Digest']}, mergeArr);
    return new AsyncTask(
        'Digest',
        (): Promise<any> => {
            let activeCount = 0;
            return PromisePool
                .withConcurrency(1)
                .for([digest])
                .process(async (digest: DigestData) => {

                    const {
                        slug,
                        discord: {
                            webhook,
                            options: {
                                defaultImageFormat = 'image',
                                collapseToThumbnail = 2,
                                eventsPerMessage = 5
                            } = {}
                        }
                    } = digest;

                    const logger = digestLogger.child({labels: slug}, mergeArr);

                    let sentEmbeds = 0;
                    let sentMessages = 0;

                    const client = new WebhookClient({url: webhook});

                    const pending = await TautulliRequest.findAll({where: {slug, status: 'pending'}, include: 'files'});
                    logger.info(`Found ${pending.length} tautulli requests`);
                    if (pending.length === 0) {
                        return {
                            sentEmbeds,
                            sentMessages
                        }
                    }
                    const allImages = (await Promise.all(pending.map(async (r) => await r.getFiles()))).flat(1);

                    const transaction = await TautulliRequest.sequelize.transaction();

                    let currEmbeds: (APIEmbed)[] = [];
                    let currImages: [Buffer, string][] = [];
                    let messageSent = false;
                    for (const req of pending) {
                        if (messageSent) {
                            // don't spam discord!
                            await sleep(5000);
                        }
                        const requestEmbeds = req.content.embeds as APIEmbed[];
                        for (const embed of requestEmbeds) {
                            currEmbeds.push(embed);
                            if (embed.image !== undefined) {
                                const imageData = allImages.filter(x => x.tautulliRequestId === req.id && embed.image.url.includes(x.filename));
                                for (const i of imageData) {
                                    if (!currImages.some(([b, n]) => n === i.filename)) {
                                        currImages.push([i.content, i.filename]);
                                    }
                                }
                            }
                            if (embed.thumbnail !== undefined) {
                                const imageData = allImages.filter(x => x.tautulliRequestId === req.id && embed.thumbnail.url.includes(x.filename));
                                for (const i of imageData) {
                                    if (!currImages.some(([b, n]) => n === i.filename)) {
                                        currImages.push([i.content, i.filename]);
                                    }
                                }
                            }

                            if (currEmbeds.length === eventsPerMessage) {
                                const shouldCollapse = currEmbeds.length >= collapseToThumbnail;
                                const useThumbnail = defaultImageFormat === 'thumbnail' || shouldCollapse;

                                try {
                                    const {
                                        sentEmbeds: se
                                    } = await sendMessage(currEmbeds, currImages, useThumbnail, client, logger);
                                    sentMessages ++;
                                    sentEmbeds += se
                                } catch (e) {
                                    logger.error(new ErrorWithCause('Failed to send Plex embed', {cause: e}));
                                } finally {
                                    messageSent = true;
                                    currEmbeds = [];
                                }
                            }
                        }
                        req.status = 'processed';
                        await req.save({transaction});
                    }

                    if (currEmbeds.length > 0) {
                        const shouldCollapse = currEmbeds.length >= collapseToThumbnail;
                        const useThumbnail = defaultImageFormat === 'thumbnail' || shouldCollapse;
                        try {
                            const {
                                sentEmbeds: se
                            } = await sendMessage(currEmbeds, currImages, useThumbnail, client, logger);
                            sentMessages ++;
                            sentEmbeds += se
                        } catch (e) {
                            logger.error(new ErrorWithCause('Failed to send Plex embed', {cause: e}));
                        }
                    }

                    logger.info(`Sent ${sentEmbeds} embeds in ${sentMessages} messages`);

                    try {
                        await transaction.commit();
                    } catch (e) {
                        logger.error('Failed to save request processed statuses!', {cause: e});
                        await transaction.rollback();
                    }

                    return {
                        sentEmbeds,
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

const sendMessage = async (currEmbeds: (APIEmbed)[], currImages: [Buffer, string][], useThumbnail: boolean, client: WebhookClient, logger: AppLogger) => {
    let sentEmbeds = 0;
    for (const curEmb of currEmbeds) {
        if (useThumbnail) {
            if (curEmb.image !== undefined) {
                if (curEmb.thumbnail === undefined) {
                    curEmb.thumbnail = curEmb.image;
                }
                delete curEmb.image;
            }
        }
    }

    const attachments: AttachmentBuilder[] = [];
    for (const f of currImages) {
        const file = new AttachmentBuilder(f[0], {name: f[1]});
        attachments.push(file);
    }

    try {
        await client.send({
            content: `${currEmbeds.length} Items added to Plex`,
            embeds: currEmbeds,
            files: attachments
        });
        sentEmbeds += currEmbeds.length;
    } catch (e) {
        throw e;
    }
    return {
        sentEmbeds
    }
}
