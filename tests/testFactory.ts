import {OperatorConfig} from "../src/common/infrastructure/OperatorConfig.js";
import dayjs, {Dayjs} from "dayjs";
import {LoremIpsum} from "lorem-ipsum";
import {promises} from "fs";
import path from 'path';
import {pickRandom, readFile} from "../src/utils/io.js";
import {APIEmbedImage, BaseMessageOptions} from "discord.js";
import crypto from 'crypto';
import {FileData} from "../src/common/infrastructure/Atomic.js";

let posterFiles: string[] = [];

const posterColors = [
    '#06b23c',
    '#d2acc1',
    '#edf23d',
    '#a6a66d',
    '#ef908c',
    '#d3624d',
    '#514efe',
    '#d307c2',
    '#e71212',
    '#33b3f8'
]

const dummyTitle = new LoremIpsum({wordsPerSentence: {min: 2, max: 7}});
const dummyDescription = new LoremIpsum({
    sentencesPerParagraph: {
        max: 8,
        min: 1
    },
    wordsPerSentence: {
        max: 16,
        min: 4
    }
});

const memoryConfig: OperatorConfig = {
    digests: [
        {
            slug: 'test',
            // every day at 12:00 pm
            cron: '0 12 * * *',
            discord: {
                webhook: process.env.DISCORD_WEBHOOK ?? 'MY_WEBHOOK',
            }
        }
    ]
}

export interface DummyEventOptions {
    timestamp?: Dayjs
    image?: 'url' | 'file'
    thumbnail?: 'url' | 'file'
    title?: string
    content?: string
}

export const getDummyEvent = async (opts: DummyEventOptions = {}): Promise<[BaseMessageOptions, FileData?]> => {
    const {
        timestamp = dayjs(),
        title = dummyTitle.generateSentences(1),
        content = `${title} was just added to Plex`,
        image = 'url'
    } = opts;

    let embedImage: APIEmbedImage;
    let fileImage: FileData | undefined;

    if (image === 'url') {
        embedImage = {
            url: getRandomPosterUrl(title)
        }
    } else {
        const buff = await getRandomPosterFile();
        fileImage = {
            content: buff,
            filename: `${crypto.createHash('md5').update(title).digest('hex')}.jpg`
        }
        embedImage = {
            url: `attachment://${fileImage.filename}`
        }
    }

    return [
        {
            content,
            embeds: [
                {
                    title: title,
                    timestamp: timestamp.toISOString(),
                    image: embedImage,
                    description: dummyDescription.generateParagraphs(1),
                    url: "https://thetvdb.com",
                    fields: [
                        {
                            "name": "View Details",
                            "value": "[TheTVDB](https://thetvdb.com)",
                            "inline": true
                        },
                        {
                            "name": "View Details",
                            "value": "[Plex Web](https://example.com)",
                            "inline": true
                        }
                    ]
                }
            ]
        },
        fileImage
    ]
}

const getRandomPosterFile = async () => {
    if (posterFiles.length === 0) {
        posterFiles = await promises.readdir(path.join('../assets'));
    }
    return await readFile(pickRandom(posterFiles));
}

export const getRandomPosterUrl = (text: string = dummyTitle.generateWords(2)) => {
    return `https://dummyimage.com/250x1:1.5/${getRandomColor()}/ffffff.jpg?text=${text.replace(' ', '+')}`;
}

const getRandomColor = (): string => {
    const hex = pickRandom(posterColors);
    return hex.replace('#', '');
}
