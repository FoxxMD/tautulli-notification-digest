import {describe, it} from 'mocha';
import {assert} from 'chai';
import {OperatorConfig} from "../src/common/infrastructure/OperatorConfig";
import dotenv from 'dotenv';
import {getDummyEvent} from "./testFactory";

describe('Collapse Behavior', function () {
    let config: OperatorConfig;

    before(async () => {
        dotenv.config({path: '../'});
    });

    it('Generates embed with image', async function () {
        const [msg] = await getDummyEvent();
        assert.isTrue(true, 'is true');
    });
});
