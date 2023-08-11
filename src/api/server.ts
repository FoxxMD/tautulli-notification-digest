import {addAsync, Router} from '@awaitjs/express';
import express from 'express';
import {OperatorConfig} from "../common/infrastructure/OperatorConfig.js";
import {AppLogger} from "../common/logging.js";
import {mergeArr} from "../utils/index.js";
import {tautulliFormMiddleware} from "./tautulliFormMiddleware.js";
import {IncomingFileData} from "../common/infrastructure/Atomic.js";
import {TautulliRequest} from "../common/db/models/TautulliRequest.js";
import {ErrorWithCause} from "pony-cause";

const app = addAsync(express());
const router = Router();

let envPort = process.env.PORT ?? 8078;

app.use(router);

export const initServer = async (config: OperatorConfig, parentLogger: AppLogger) => {

    const apiLogger = parentLogger.child({labels: ['API']}, mergeArr);
    const ingressLogger = parentLogger.child({labels: ['Tautulli Request']}, mergeArr);
    try {
        const {
            port = envPort
        } = config;
        const server = await app.listen(port);

        const tMiddle = tautulliFormMiddleware(apiLogger);
        app.postAsync(/.+/, tMiddle, async function (req, res, next) {

            try {
                const splitPath = req.path.split('/');
                const slug = splitPath[splitPath.length - 1];
                // @ts-ignore
                const payload = req.payload as BaseMessageOptions;
                // @ts-ignore
                const images = req.imageFiles as IncomingFileData[];

                ingressLogger.verbose(`Received valid payload with ${images.length} images`);

                const treq = await TautulliRequest.create({
                    slug,
                    status: 'pending',
                    content: payload
                });

                for (const image of images) {
                    await treq.createFile({
                        content: image.buffer,
                        filename: image.name,
                        mimeType: image.mimetype
                    });
                }

                ingressLogger.verbose(`Saved new Request ${treq.id} with ${images.length} images`);

                res.send('OK');


            } catch (e) {
                new ErrorWithCause('Failed to save tautulli request', {cause: e});
            }
        });

        apiLogger.info(`API listening on port ${port}`);

    } catch (e) {
        apiLogger.error('Server stopped with uncaught error');
        apiLogger.error(e);
        throw e;
    }


}
