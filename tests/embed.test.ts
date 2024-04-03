import {describe, it} from 'mocha';
import {assert} from 'chai';
import {DigestData, OperatorConfig} from "../src/common/infrastructure/OperatorConfig";
import dotenv from 'dotenv';
import {
    EventAwareBaseMessageOptions,
    TautulliRequestData,
    TautulliRequestFileData
} from "../src/common/infrastructure/Tautulli.js";
import {defaultTestDigest, getDummyEvent, getDummyRequest} from "./testFactory";
import {buildMessages} from "../src/discord/builder";
import {parseBool, sleep, uniqueRandomNumber} from "../src/utils";
import {projectDir} from "../src/common/index.js";
import path from "path";
import {APIEmbed, BaseMessageOptions, EmbedBuilder, WebhookClient} from "discord.js";
import {ErrorWithCause} from "pony-cause";

const sendMessages = async (digest: DigestData, messages: EventAwareBaseMessageOptions[]) => {
    if (parseBool(process.env.SEND_TEST_EVENTS)) {
        const client = new WebhookClient({url: digest.discord.webhook});
        let index = 0;
        for (const message of messages) {
            try {
                if(index > 0) {
                    await sleep(2500);
                }
                const {includedEvents, ...rest} = message;
                await client.send(rest);
            } catch (e) {
                throw new ErrorWithCause('Failed to send Plex embed', {cause: e});
            } finally {
                index++;
            }
        }
    }
}

describe('Basic Message Building', function () {

    before(async () => {
        dotenv.config({path: path.join(projectDir, '.env')});
    });

    it('Generates embed with image url', async function () {
        const rand = uniqueRandomNumber();
        const [event, image] = await getDummyRequest({id: rand()});
        const images = image !== undefined ? [image] : [];

        const [messages, eventCount] = buildMessages(defaultTestDigest(), [event], images);
        assert.isTrue(true, 'is true');
        await sendMessages(defaultTestDigest(), messages);
        return;
    });

    it('Generates embed with image file', async function () {
        const rand = uniqueRandomNumber();
        const [event, image] = await getDummyRequest({id: rand(), image: 'file'});
        const images = image !== undefined ? [image] : [];

        const [messages, eventCount] = buildMessages(defaultTestDigest(), [event], images);
        assert.isTrue(true, 'is true');
        await sendMessages(defaultTestDigest(), messages);
        return;
    });
});

describe('Embed Collapsing', function () {

    before(async () => {
        dotenv.config({path: path.join(projectDir, '.env')});
    });

    it('Use poster for default config when only one notification', async function () {
        const rand = uniqueRandomNumber();
        const [event, image] = await getDummyRequest({id: rand()});
        const images = image !== undefined ? [image] : [];

        const [messages, eventCount] = buildMessages(defaultTestDigest(), [event], images);

        assert.exists((messages[0].embeds[0] as EmbedBuilder).data.image);
        assert.notExists((messages[0].embeds[0] as EmbedBuilder).data.thumbnail);
        await sendMessages(defaultTestDigest(), messages);
        return;
    });

    it('Collapses to poster', async function () {
        const rand = uniqueRandomNumber();
        const events: TautulliRequestData[] = [];
        const images: TautulliRequestFileData[] = [];
        for(let i = 0; i < 3; i++) {
            const [event, image] = await getDummyRequest({id: rand()});
            events.push(event);
            if(image !== undefined) {
                images.push(image);
            }
        }

        const digest = defaultTestDigest();
        digest.discord.options = {
            poster: 0,
            thumbnail: false,
            text: false,
            list: false
        }

        const [messages, eventCount] = buildMessages(digest, events, images);

        assert.exists((messages[0].embeds[0] as EmbedBuilder).data.image);
        await sendMessages(defaultTestDigest(), messages);
        return;
    });

    it('Collapses to thumbnail', async function () {
        const rand = uniqueRandomNumber();
        const events: TautulliRequestData[] = [];
        const images: TautulliRequestFileData[] = [];
        for(let i = 0; i < 3; i++) {
            const [event, image] = await getDummyRequest({id: rand()});
            events.push(event);
            if(image !== undefined) {
                images.push(image);
            }
        }

        const [messages, eventCount] = buildMessages(defaultTestDigest(), events, images);

        assert.exists((messages[0].embeds[0] as EmbedBuilder).data.thumbnail);
        assert.notExists((messages[0].embeds[0] as EmbedBuilder).data.image);
        await sendMessages(defaultTestDigest(), messages);
        return;
    });

    it('Collapses to text', async function () {
        const rand = uniqueRandomNumber();
        const events: TautulliRequestData[] = [];
        const images: TautulliRequestFileData[] = [];
        for(let i = 0; i < 4; i++) {
            const [event, image] = await getDummyRequest({id: rand()});
            events.push(event);
            if(image !== undefined) {
                images.push(image);
            }
        }

        const digest = defaultTestDigest();
        digest.discord.options = {
            poster: 0,
            thumbnail: 2,
            text: 3
        }

        const [messages, eventCount] = buildMessages(digest, events, images);

        assert.notExists((messages[0].embeds[0] as EmbedBuilder).data.thumbnail);
        assert.notExists((messages[0].embeds[0] as EmbedBuilder).data.image);
        await sendMessages(defaultTestDigest(), messages);
        return;
    });

    it('Collapses to list', async function () {
        const rand = uniqueRandomNumber();
        const events: TautulliRequestData[] = [];
        const images: TautulliRequestFileData[] = [];
        for(let i = 0; i < 6; i++) {
            const [event, image] = await getDummyRequest({id: rand()});
            events.push(event);
            if(image !== undefined) {
                images.push(image);
            }
        }

        const digest = defaultTestDigest();
        digest.discord.options = {
            poster: 0,
            thumbnail: 2,
            text: 3,
            list: 4
        }

        const [messages, eventCount] = buildMessages(digest, events, images);

        assert.notExists((messages[0].embeds[0] as EmbedBuilder).data.thumbnail);
        assert.notExists((messages[0].embeds[0] as EmbedBuilder).data.image);
        assert.equal(messages[0].embeds.length, 1);
        await sendMessages(defaultTestDigest(), messages);
        return;
    });

    it('Collapses to list with multiple embeds on character limit', async function () {
        const rand = uniqueRandomNumber();
        const events: TautulliRequestData[] = [];
        const images: TautulliRequestFileData[] = [];
        for(let i = 0; i < 100; i++) {
            const [event, image] = await getDummyRequest({id: rand()});
            events.push(event);
            if(image !== undefined) {
                images.push(image);
            }
        }
        const charCount = events.reduce((acc, curr) => {
            return acc + (curr.content.embeds[0] as APIEmbed).title.length;
        }, 0);
        const calculatedEmbedCount = Math.ceil(charCount / 900);

        const digest = defaultTestDigest();
        digest.discord.options = {
            poster: 0,
            thumbnail: 2,
            text: 3,
            list: 4
        }

        const [messages, eventCount] = buildMessages(digest, events, images);

        assert.equal(messages[0].embeds.length, calculatedEmbedCount);
        await sendMessages(defaultTestDigest(), messages);
        return;
    });

    it('Uses overflow', async function () {
        const rand = uniqueRandomNumber();
        const events: TautulliRequestData[] = [];
        const images: TautulliRequestFileData[] = [];
        for(let i = 0; i < 12; i++) {
            const [event, image] = await getDummyRequest({id: rand()});
            events.push(event);
            if(image !== undefined) {
                images.push(image);
            }
        }

        const [messages, eventCount] = buildMessages(defaultTestDigest(), events, images);

        assert.equal(messages[0].embeds.length, 10);
        assert.notExists((messages[0].embeds[9] as APIEmbed).thumbnail);
        assert.notExists((messages[0].embeds[9] as APIEmbed).image);
        await sendMessages(defaultTestDigest(), messages);
        return;
    });

    it('Uses overflow with truncated count', async function () {
        const rand = uniqueRandomNumber();
        const events: TautulliRequestData[] = [];
        const images: TautulliRequestFileData[] = [];
        for(let i = 0; i < 50; i++) {
            const [event, image] = await getDummyRequest({id: rand()});
            events.push(event);
            if(image !== undefined) {
                images.push(image);
            }
        }

        const [messages, eventCount] = buildMessages(defaultTestDigest(), events, images);

        assert.equal(messages[0].embeds.length, 10);
        assert.notExists((messages[0].embeds[9] as EmbedBuilder).data.thumbnail);
        assert.notExists((messages[0].embeds[9] as EmbedBuilder).data.image);
        assert.isTrue((messages[0].embeds[9] as EmbedBuilder).data.description.includes('and 21 more'));
        await sendMessages(defaultTestDigest(), messages);
        return;
    });
});
