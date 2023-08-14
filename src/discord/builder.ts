import {AppLogger} from "../common/logging.js";
import {DigestData, DiscordOptions} from "../common/infrastructure/OperatorConfig.js";
import {FileData, TautulliRequestData, TautulliRequestFileData} from "../common/infrastructure/Atomic.js";
import {mergeArr} from "../utils/index.js";
import {APIEmbed, AttachmentBuilder, BaseMessageOptions} from "discord.js";
import {ErrorWithCause} from "pony-cause";

export const buildMessages = (digest: DigestData, pending: TautulliRequestData[], allImages: TautulliRequestFileData[]) => {

    const messages: BaseMessageOptions[] = [];
    let events: number = 0;

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

    let currEmbeds: (APIEmbed)[] = [];
    let currImages: FileData[] = [];

    for (const req of pending) {
        const requestEmbeds = req.content.embeds as APIEmbed[];

        for (const embed of requestEmbeds) {
            currEmbeds.push(embed);
            if (embed.image !== undefined) {
                const imageData = allImages.filter(x => x.tautulliRequestId === req.id && embed.image.url.includes(x.filename));
                for (const i of imageData) {
                    if (!currImages.some((ci) => ci.filename === i.filename)) {
                        currImages.push(i);
                    }
                }
            }
            if (embed.thumbnail !== undefined) {
                const imageData = allImages.filter(x => x.tautulliRequestId === req.id && embed.thumbnail.url.includes(x.filename));
                for (const i of imageData) {
                    if (!currImages.some((ci) => ci.filename === i.filename)) {
                        currImages.push(i);
                    }
                }
            }

            if (currEmbeds.length === eventsPerMessage) {
                events += currEmbeds.length;
                messages.push(buildMessage(digest.discord.options, currEmbeds, currImages));
                currEmbeds = [];
                currImages = [];
            }
        }
    }

    if (currEmbeds.length !== 0) {
        events += currEmbeds.length;
        messages.push(buildMessage(digest.discord.options, currEmbeds, currImages));
        currEmbeds = [];
        currImages = [];
    }

    return [messages, events];
}

export const buildMessage = (options: DiscordOptions = {}, currEmbeds: (APIEmbed)[], currImages: FileData[]): BaseMessageOptions => {

    const {
        defaultImageFormat = 'image',
        collapseToThumbnail = 2,
        eventsPerMessage = 5
    } = options;

    const shouldCollapse = currEmbeds.length >= collapseToThumbnail;
    const useThumbnail = defaultImageFormat === 'thumbnail' || shouldCollapse;

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

    // remove duplicate images
    const dedupedImages = currImages.reduce((acc: FileData[], curr) => {
        if (!acc.some(x => x.filename === curr.filename)) {
            return acc.concat(curr);
        }
    }, []);
    const attachments: AttachmentBuilder[] = [];
    for (const f of dedupedImages) {
        const file = new AttachmentBuilder(f.content, {name: f.filename});
        attachments.push(file);
    }

    return {
        content: `${currEmbeds.length} Items added to Plex`,
        embeds: currEmbeds,
        files: attachments
    }
}
