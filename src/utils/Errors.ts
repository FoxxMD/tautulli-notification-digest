import ExtendableError from "es6-error";

export interface ISeriousError {
    isSerious: boolean;
}

export class SimpleError extends ExtendableError implements ISeriousError {
    code?: string | number;
    isSerious: boolean = true;

    constructor(message: string, options: {code?: string | number, isSerious?: boolean} = {}) {
        super(message);
        const {code, isSerious = true} = options;
        this.code = code;
        this.isSerious = isSerious;
    }
}
