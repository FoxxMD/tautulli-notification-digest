import {AppLogger} from "../common/logging.js";
import {mergeArr} from "../utils/index.js";
import formidable, {File, Files, VolatileFile} from "formidable";
import concatStream from 'concat-stream';
import {IncomingFileData} from "../common/infrastructure/Atomic.js";

const fileIdentifier = (name: string, file: any) => {
    let identifier = name;
    if(file !== undefined) {
        if('originalFilename' in file && file.originalFilename !== undefined && file.originalFilename !== null) {
            identifier = `${identifier} - ${file.originalFilename}`;
        }
        if('mimetype' in file && file.mimetype !== undefined && file.mimetype !== null) {
            identifier = `${identifier} (${file.mimetype})`;
        }
    }
    return identifier;
}

export const tautulliFormMiddleware = (parentLogger: AppLogger) => {
    const logger = parentLogger.child({labels: ['Form']}, mergeArr);

    return async (req: any, res: any, next: any) => {

        const form = formidable({
            allowEmptyFiles: true,
            multiples: true,
            // issue with typings https://github.com/node-formidable/formidable/issues/821
            // @ts-ignore
            fileWriteStreamHandler: (file: any) => {
                return concatStream((data: any) => {
                    file.buffer = data;
                });
            }
        });
        form.on('progress', (received: any, expected: any) => {
            logger.debug(`Received ${received} bytes of expected ${expected}`);
        });
        form.on('error', (err: any) => {
            logger.error(err);
        })
        form.on('aborted', () => {
            logger.warn('Request aborted')
        })
        form.on('end', () => {
            logger.debug('Received end of form data');
        });
        form.on('fileBegin', (formname: any, file: any) => {
            logger.debug(`File Begin: ${fileIdentifier(formname, file)}`);
        });
        form.on('file', (formname: any, file: any) => {
            logger.debug(`File Received: ${fileIdentifier(formname, file)}`);
        });


        logger.debug('Receiving request from Tautulli...');

        return new Promise((resolve, reject) => {
            form.parse(req, (err: any, fields: any, files: Files) => {
                if (err) {
                    logger.error('Error occurred while parsing formdata');
                    logger.error(err);
                    next(err);
                    reject(err);
                    return;
                }

                let jsonFile: File | null = null;
                const imageFiles: IncomingFileData[] = [];
                for (const [fieldName, namedFileVal] of Object.entries(files)) {
                    const namedFile = namedFileVal as File;
                    if (namedFile.mimetype.includes('json')) {
                        jsonFile = namedFile as File;
                        break;
                    } else if(namedFile.mimetype.includes('image')) {
                        imageFiles.push({
                            // @ts-ignore
                            buffer: namedFile.buffer as Buffer,
                            name: namedFile.originalFilename,
                            mimetype: namedFile.mimetype,
                            fieldName,
                            size: namedFile.size
                        });
                    }
                }
                if (jsonFile === null) {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    const err = new Error(`No files parsed from formdata had a mimetype that included 'json'. Found files:\n ${Object.entries(files).map(([k, v]) => `${k}: ${v.mimetype}`).join('\n')}`);
                    logger.error(err);
                    next(err);
                    reject(err);
                    return;
                }

                // @ts-ignore
                const payloadRaw = jsonFile.buffer.toString();
                let payload = null;
                try {
                    payload = JSON.parse(payloadRaw);
                    req.payload = payload;
                    req.imageFiles = imageFiles;
                    next();
                    // @ts-expect-error TS(2794): Expected 1 arguments, but got 0. Did you forget to... Remove this comment to see the full error message
                    resolve();
                } catch (e) {
                    logger.error(`Error occurred while trying to parse Tautulli file payload to json. Raw text:\n${payloadRaw}`);
                    logger.error(e);
                    next(e);
                    reject(e);
                }
            });
        });
    };
}
