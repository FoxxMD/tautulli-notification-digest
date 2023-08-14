import {OperatorConfig} from "../src/common/infrastructure/OperatorConfig.js";

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
