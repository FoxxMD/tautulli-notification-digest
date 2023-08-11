import pathUtil from "path";
import {accessSync, constants, promises} from "fs";
import {ErrorWithCause} from "pony-cause";
import { finished } from 'stream/promises';
import fs from 'fs';
import ReadableStream = NodeJS.ReadableStream;

export const fileOrDirectoryIsWriteable = (location: string) => {
    const pathInfo = pathUtil.parse(location);
    const isDir = pathInfo.ext === '';
    try {
        accessSync(location, constants.R_OK | constants.W_OK);
        return true;
    } catch (err: any) {
        const {code} = err;
        if (code === 'ENOENT') {
            // file doesn't exist, see if we can write to directory in which case we are good
            try {
                accessSync(pathInfo.dir, constants.R_OK | constants.W_OK)
                // we can write to dir
                return true;
            } catch (accessError: any) {
                if (accessError.code === 'EACCES') {
                    // also can't access directory :(
                    throw new Error(`No ${isDir ? 'directory' : 'file'} exists at ${location} and application does not have permission to write to the parent directory`);
                } else {
                    throw new ErrorWithCause(`No ${isDir ? 'directory' : 'file'} exists at ${location} and application is unable to access the parent directory due to a system error`, {cause: accessError});
                }
            }
        } else if (code === 'EACCES') {
            throw new Error(`${isDir ? 'Directory' : 'File'} exists at ${location} but application does not have permission to write to it.`);
        } else {
            throw new ErrorWithCause(`${isDir ? 'Directory' : 'File'} exists at ${location} but application is unable to access it due to a system error`, {cause: err});
        }
    }
}

export async function readFile(this: any, path: any, {throwOnNotFound = true} = {}): Promise<string | undefined> {
    try {
        await promises.access(path, constants.R_OK);
        const data = await promises.readFile(path);
        return data.toString() as unknown as string;
    } catch (e) {
        const {code} = e;
        if (code === 'ENOENT') {
            if (throwOnNotFound) {
                throw new ErrorWithCause(`No file found at given path: ${path}`, {cause: e});
            } else {
                return;
            }
        }
        throw new ErrorWithCause(`Encountered error while parsing file: ${path}`, {cause: e})
    }
}
