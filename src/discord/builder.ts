import {
    DigestData,
    discordOptionsDef,
    discordOptionDefObj,
    DiscordOptions, EventFormatOptions
} from "../common/infrastructure/OperatorConfig.js";
import {
    EventAwareBaseMessageOptions,
    FileData,
    TautulliRequestData,
    TautulliRequestFileData
} from "../common/infrastructure/Atomic.js";
import {markdownTag, mergeArr, truncateStringToLength} from "../utils/index.js";
import {APIEmbed, AttachmentBuilder, BaseMessageOptions, EmbedBuilder} from "discord.js";

export const buildMessages = (digest: DigestData, pending: TautulliRequestData[], allImages: TautulliRequestFileData[]): [EventAwareBaseMessageOptions[], number] => {

    const messages: EventAwareBaseMessageOptions[] = [];
    let events: number = 0;

    const {
        discord: {
            options: {
                eventsPerMessage = discordOptionsDef.eventsPerMessage
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
    }

    return [messages, events];
}

export const buildMessage = (options: DiscordOptions = {}, currEmbeds: (APIEmbed)[], currImages: FileData[]): EventAwareBaseMessageOptions => {

    const embeds = convertEventsToEmbeds(currEmbeds, options);
    const relevantImages: FileData[] = [];

    for (const embed of embeds) {
        if (embed.data.image !== undefined) {
            const foundImage = currImages.find(x => embed.data.image.url.includes(x.filename));
            if (foundImage !== undefined) {
                relevantImages.push(foundImage);
            }
        }
        if (embed.data.thumbnail !== undefined) {
            const foundImage = currImages.find(x => embed.data.thumbnail.url.includes(x.filename));
            if (foundImage !== undefined) {
                relevantImages.push(foundImage);
            }
        }
    }

    // remove duplicate images
    const dedupedImages = relevantImages.reduce((acc: FileData[], curr) => {
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
        embeds: embeds,
        files: attachments,
        includedEvents: currEmbeds.length
    }
}

export const asEventFormatOptions = (val: any): val is EventFormatOptions => {
    return val !== null && typeof val === 'object' && ('threshold' in val || 'truncateDescription' in val || 'includeLinks' in val);
}

export const convertEventValueToOptions = (val: false | number | EventFormatOptions): EventFormatOptions => {
    if (val === false) {
        return {
            enabled: false,
            threshold: 100
        }
    }
    if (typeof val === 'number') {
        return {
            enabled: true,
            threshold: val
        }
    }
    if (asEventFormatOptions(val)) {
        return val;
    }
    throw new Error(`Value was not well defined EventFormatOptions data: ${JSON.stringify(val)}`);
}

export const convertEventsToEmbeds = (currEvents: (APIEmbed)[], options: DiscordOptions = {}) => {
    const {
        poster,
        thumbnail,
        text,
        list,
        overflowTruncate
    } = {...discordOptionDefObj(), ...options};

    let embedType: 'poster' | 'thumbnail' | 'text' | 'list';
    let embedTypeOptions: EventFormatOptions;
    const listOptions = convertEventValueToOptions(list);
    const thumbnailOptions = convertEventValueToOptions(thumbnail);
    const textOptions = convertEventValueToOptions(text);
    const posterOptions = convertEventValueToOptions(poster);
    if (listOptions.enabled && listOptions.threshold <= currEvents.length) {
        embedType = 'list';
        embedTypeOptions = listOptions;
    } else if (textOptions.enabled && textOptions.threshold <= currEvents.length) {
        embedType = 'text';
        embedTypeOptions = textOptions;
    } else if (thumbnailOptions.enabled && thumbnailOptions.threshold <= currEvents.length) {
        embedType = 'thumbnail';
        embedTypeOptions = thumbnailOptions;
    } else {
        embedType = 'poster';
        embedTypeOptions = posterOptions;
    }


    const embeds: EmbedBuilder[] = [];

    let currEmbedList: string[] = [];
    let currEmbedCharCount: number = 0;

    const overflowList: string[] = [];
    let overflowTruncatedCount: number = 0;

    for (const origEvent of currEvents) {
        // deep clone
        const {timestamp, ...cleanEvent} = origEvent;
        const event = new EmbedBuilder(cleanEvent); // JSON.parse(JSON.stringify(origEvent)) as APIEmbed;

        if (embeds.length === 9) {
            if (overflowList.length === overflowTruncate) {
                overflowTruncatedCount++;
            } else {
                overflowList.push(event.data.title)
            }
        } else {
            switch (embedType) {
                case 'list':
                    if (currEmbedCharCount + event.data.title.length > 900) {
                        // only 1014(?) characters allowed in embed description and need to account for formatting and newlines
                        // push current events list to an embed and start a new one
                        embeds.push(new EmbedBuilder({description: markdownTag`${currEmbedList}`}));
                        currEmbedCharCount = 0;
                        currEmbedList = [];
                    } else {
                        currEmbedList.push(event.data.title);
                        currEmbedCharCount += event.data.title.length;
                    }
                    break;
                case 'text':
                    if (event.data.thumbnail !== undefined) {
                        event.setThumbnail(null);
                        //delete event.data.thumbnail;
                    }
                    if (event.data.image !== undefined) {
                        event.setImage(null);
                        //delete event.image;
                    }
                    break;
                case 'thumbnail':
                    if (event.data.image !== undefined) {
                        if (event.data.thumbnail === undefined) {
                            event.setThumbnail(event.data.image.url);
                            //event.thumbnail = event.image;
                        }
                        event.setImage(null);
                        //delete event.image;
                    }
                    break;
            }
            if (embedType !== 'list') {
                if (embedTypeOptions.truncateDescription !== undefined) {
                    event.setDescription(truncateStringToLength(embedTypeOptions.truncateDescription)(event.data.description));
                }
                if (embedTypeOptions.includeLinks === false) {
                    event.setFields(event.data.fields.filter(x => x.name.toLocaleLowerCase() !== 'view details'))
                    //event.fields = event.fields.filter(x => x.name.toLocaleLowerCase() !== 'view details');
                }
                embeds.push(event);
            }
        }
    }

    if (currEmbedList.length > 0) {
        embeds.push(new EmbedBuilder({description: markdownTag`${currEmbedList}`}));
    }
    if (overflowList.length > 0) {
        const overflowTruncatedStr = overflowTruncatedCount === 0 ? '' : `\n* and ${overflowTruncatedCount} more.`;
        embeds.push(new EmbedBuilder({
            description: markdownTag`${overflowList}${overflowTruncatedStr}`
        }));
    }

    return embeds;
}
