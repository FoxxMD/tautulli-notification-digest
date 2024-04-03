import { BaseMessageOptions } from "discord.js";
import { FileData } from "./Atomic.js";

export interface TautulliRequestData {
    id: number,
    content: BaseMessageOptions
}

export interface TautulliRequestFileData extends FileData {
    tautulliRequestId: number
    content: Buffer
    filename: string
}

export interface EventAwareBaseMessageOptions extends BaseMessageOptions {
    includedEvents: number
}
