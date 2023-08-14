import {DigestData} from "../infrastructure/OperatorConfig.js";
import {AppLogger} from "../logging.js";
import {mergeArr, sleep} from "../../utils/index.js";
import {WebhookClient} from "discord.js";
import {TautulliRequest} from "../db/models/TautulliRequest.js";
import {buildMessages} from "../../discord/builder.js";
import {ErrorWithCause} from "pony-cause";

export const processPendingDigests = async (digest: DigestData, parentLogger: AppLogger, id?: string) => {
    const digestLogger = parentLogger.child({labels: [`Digest ${id ?? digest.slug}`]}, mergeArr);

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
            sentMessages++;
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
}
