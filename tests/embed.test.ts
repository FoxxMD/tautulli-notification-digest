import {describe, it} from 'mocha';
import {assert} from 'chai';
import {DigestData, OperatorConfig} from "../src/common/infrastructure/OperatorConfig";
import dotenv from 'dotenv';
import {defaultTestDigest, getDummyEvent, getDummyRequest} from "./testFactory";
import {buildMessages} from "../src/discord/builder";
import {parseBool, sleep, uniqueRandomNumber} from "../src/utils";
import {projectDir} from "../src/common/index.js";
import path from "path";
import {BaseMessageOptions, WebhookClient} from "discord.js";
import {ErrorWithCause} from "pony-cause";

const sendMessages = async (digest: DigestData, messages: BaseMessageOptions[]) => {
    if (parseBool(process.env.SEND_TEST_EVENTS)) {
        const client = new WebhookClient({url: digest.discord.webhook});
        for (const message of messages) {
            try {
                await client.send(message);
                await sleep(4000);
            } catch (e) {
                throw new ErrorWithCause('Failed to send Plex embed', {cause: e});
            }
        }
    }
}

describe('Basic Message Building', function () {
    let config: OperatorConfig;

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
    });

    it('Generates embed with image file', async function () {
        const rand = uniqueRandomNumber();
        const [event, image] = await getDummyRequest({id: rand(), image: 'file'});
        const images = image !== undefined ? [image] : [];

        const [messages, eventCount] = buildMessages(defaultTestDigest(), [event], images);
        assert.isTrue(true, 'is true');
        await sendMessages(defaultTestDigest(), messages);
    });
});
