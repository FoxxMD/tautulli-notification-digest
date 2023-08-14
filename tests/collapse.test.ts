import {describe, it} from 'mocha';
import {assert} from 'chai';
import {OperatorConfig} from "../src/common/infrastructure/OperatorConfig.js";
import dotenv from 'dotenv';

describe('Pics correct default', function () {
    let config: OperatorConfig;

    before(async () => {
        dotenv.config({path: '../'});
    });

    describe('Test', function () {
        it('Should match name literal', function () {
            assert.isTrue(true, 'is true');
        });
    });
});
