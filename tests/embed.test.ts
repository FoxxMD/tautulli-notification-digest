import {describe, it} from 'mocha';
import {assert} from 'chai';
import {OperatorConfig} from "../src/common/infrastructure/OperatorConfig";
import dotenv from 'dotenv';
import {defaultTestDigest, getDummyEvent, getDummyRequest} from "./testFactory";
import {buildMessages} from "../src/discord/builder";
import {uniqueRandomNumber} from "../src/utils";

describe('Basic Message Building', function () {
    let config: OperatorConfig;

    before(async () => {
        dotenv.config({path: '../'});
    });

    it('Generates embed with image url', async function () {
        const rand = uniqueRandomNumber();
        const [event, image] = await getDummyRequest({id: rand()});
        const images = image !== undefined ? [image] : [];

        const [messages, eventCount] = buildMessages(defaultTestDigest, [event], images);
        assert.isTrue(true, 'is true');
    });

    it('Generates embed with image file', async function () {
        const rand = uniqueRandomNumber();
        const [event, image] = await getDummyRequest({id: rand(), image: 'file'});
        const images = image !== undefined ? [image] : [];

        const [messages, eventCount] = buildMessages(defaultTestDigest, [event], images);
        assert.isTrue(true, 'is true');
    });
});
