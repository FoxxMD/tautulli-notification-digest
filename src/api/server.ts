import {addAsync, Router} from '@awaitjs/express';
import { childLogger, Logger } from "@foxxmd/logging";
import express from 'express';
import {OperatorConfig} from "../common/infrastructure/OperatorConfig.js";
import {mergeArr} from "../utils/index.js";
import {tautulliFormMiddleware} from "./tautulliFormMiddleware.js";
import {IncomingFileData} from "../common/infrastructure/Atomic.js";
import {TautulliRequest} from "../common/db/models/TautulliRequest.js";
import {ErrorWithCause} from "pony-cause";
import {APIEmbed} from "discord.js";
import dayjs from "dayjs";
import {processPendingDigests} from "../common/funcs/processPendingDigests.js";
import IP from 'ip';

const app = addAsync(express());
const router = Router();

let envPort = process.env.PORT ?? 8078;

app.use(router);

export const initServer = async (config: OperatorConfig, parentLogger: Logger) => {

    const apiLogger = childLogger(parentLogger, 'API');
    const ingressLogger = childLogger(parentLogger, 'Tautulli Request');
    try {
        const {
            port = envPort
        } = config;
        const server = await app.listen(port);

        app.postAsync('/api/:slug', async function (req, res, next) {
            const digest = config.digests.find(x => x.slug.toLocaleLowerCase() === req.params.slug.toLocaleLowerCase());
            if (digest === undefined) {
                res.status(404).send(`No digest config exists for slug '${req.params.slug}'`);
                return;
            }
            apiLogger.info(`Processing pending requests for slug ${digest.slug}`);
            const results = await processPendingDigests(digest, apiLogger);
            res.status(200).json(results);
        });

        const tMiddle = tautulliFormMiddleware(apiLogger);
        app.postAsync(/^(?!api).+/, tMiddle, async function (req, res, next) {

            try {
                const splitPath = req.path.split('/');
                const slug = splitPath[splitPath.length - 1];
                // @ts-ignore
                const payload = req.payload as BaseMessageOptions;
                // @ts-ignore
                const images = req.imageFiles as IncomingFileData[];

                ingressLogger.verbose(`Received valid payload with ${images.length} images`);

                const digest = config.digests.find(x => x.slug.toLocaleLowerCase() === slug.toLocaleLowerCase());
                let dedupBehavior = 'never';
                if (digest !== undefined) {
                    const {
                        dedup = 'session'
                    } = digest;
                    dedupBehavior = dedup;
                }

                let incomingStatus = 'pending';
                let title = `Event Added at ${dayjs().format()}`;

                if (payload.embeds.length > 0) {
                    // assuming only sending one embed...since this is how tautulli works
                    const embed = payload.embeds[0] as APIEmbed;
                    title = embed.title;
                    if (dedupBehavior === 'session') {
                        const origSessionRequest = await TautulliRequest.findOne({
                            where: {
                                title: embed.title,
                                slug,
                                status: 'pending'
                            }
                        });
                        if (origSessionRequest !== null && origSessionRequest !== undefined) {
                            // drop this one in favor of the newer one (newer probably has updated metadata)
                            ingressLogger.info(`Incoming payload has same title as existing pending Request ${origSessionRequest.id} -- ${embed.title} -- Digest config specifies dedup behavior as 'session' so will drop exiting in favor of newer payload.`);
                            origSessionRequest.status = 'dedupe';
                            await origSessionRequest.save();
                        }
                    } else if (dedupBehavior === 'all') {
                        const origSessionRequest = await TautulliRequest.findOne({
                            where: {
                                title: embed.title,
                                slug,
                            }
                        });
                        if (origSessionRequest !== null && origSessionRequest !== undefined) {
                            ingressLogger.info(`Incoming payload has same title as existing Request ${origSessionRequest.id} -- ${embed.title} -- Digest config specifies dedup behavior as 'all' so will not add incoming request as pending.`);
                            incomingStatus = 'dedup';
                        }
                    }
                }


                const treq = await TautulliRequest.create({
                    slug,
                    status: incomingStatus,
                    content: payload,
                    title,
                });

                for (const image of images) {
                    await treq.createFile({
                        content: image.buffer,
                        filename: image.name,
                        mimeType: image.mimetype
                    });
                }

                ingressLogger.verbose(`Saved new Request ${treq.id} for '${title}' with ${images.length} images`);

                res.send('OK');


            } catch (e) {
                new ErrorWithCause('Failed to save tautulli request', {cause: e});
            }
        });

        apiLogger.info(`API listening on port ${port}`);


        try {
            const ipAddress = IP.address();
            for (const digest of config.digests) {
                apiLogger.info(`HINT: Listening for Tautulli Webook URL to: http://${ipAddress}/${digest.slug}`);
            }
        } catch (e) {
            apiLogger.warn(new ErrorWithCause('Could not determine IP for logging hint!', {cause: e}));
        }

    } catch (e) {
        apiLogger.error('Server stopped with uncaught error');
        apiLogger.error(e);
        throw e;
    }


}
