import AbstractConfigDocument from "./AbstractConfigDocument";
import {Document, parseDocument} from 'yaml';
import {ConfigFormat} from "../infrastructure/Atomic.js";

class YamlConfigDocument<DocType extends object> extends AbstractConfigDocument<Document> {

    public parsed: Document;
    public format: ConfigFormat;

    public constructor(raw: string, location?: string) {
        super(raw, location);
        this.parsed = parseDocument(raw);
        this.format = 'yaml';
    }
    public toJS(): DocType {
        return this.parsed.toJS() as DocType;
    }

    public toString(): string {
        return this.parsed.toString();
    }
}

export default YamlConfigDocument;
