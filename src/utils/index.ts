import { Logger } from "@foxxmd/logging";
import dayjs, {Dayjs} from "dayjs";
import {
    replaceResultTransformer,
    stripIndentTransformer,
    TemplateTag,
    TemplateTransformer,
    trimResultTransformer
} from 'common-tags'

export const overwriteMerge = (destinationArray: any[], sourceArray: any[], options: any): any[] => sourceArray;

export const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export const mergeArr = (objValue: [], srcValue: []): (any[] | undefined) => {
    if (Array.isArray(objValue)) {
        return objValue.concat(srcValue);
    }
}

export const valToString = (val: any): string => {
    const t = typeof val;
    if (t === 'boolean') {
        return val === true ? '1' : '0';
    }
    return val.toString();
}

export const intersect = (a: Array<any>, b: Array<any>) => {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    return Array.from(intersection);
}

/**
 * @see https://stackoverflow.com/a/64245521/1469797
 * */
function* setMinus(A: Array<any>, B: Array<any>) {
    const setA = new Set(A);
    const setB = new Set(B);

    for (const v of setB.values()) {
        if (!setA.delete(v)) {
            yield v;
        }
    }

    for (const v of setA.values()) {
        yield v;
    }
}

/**
 * Returns elements that both arrays do not have in common
 */
export const symmetricalDifference = (a: Array<any>, b: Array<any>) => {
    return Array.from(setMinus(a, b));
}

/**
 * Returns a Set of elements from valA not in valB
 * */
export function difference<T = any>(valA: Set<T> | Array<T>, valB: Set<T> | Array<T>) {
    const setA = valA instanceof Set ? valA : new Set(valA);
    const setB = valB instanceof Set ? valB : new Set(valB);
    const _difference = new Set(setA);
    for (const elem of setB) {
        _difference.delete(elem);
    }
    return _difference;
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export interface ReplyOptions {
    defer?: boolean,
    edit?: boolean
}

export class RateLimitFunc {
    public lastExecute?: Dayjs;
    public msBetween: number;
    protected shouldWait: boolean;
    protected logger?: Logger

    constructor(msBetween: number, shouldWait: boolean, logger?: Logger) {
        this.msBetween = msBetween;
        this.lastExecute = dayjs().subtract(msBetween + 1, 'ms');
        this.logger = logger;
        this.shouldWait = shouldWait;
    }

    async exec(func: Function, shouldCheck?: boolean) {
        if (shouldCheck ?? true) {
            const since = dayjs().diff(this.lastExecute, 'milliseconds');
            const shouldExec = since > this.msBetween;
            if (!shouldExec && this.shouldWait) {
                const willWait = this.msBetween - since;
                if (this.logger !== undefined) {
                    this.logger.debug(`Will wait ${willWait}ms`);
                }
                await sleep(willWait);
            }
            if (shouldExec || (!shouldExec && this.shouldWait)) {
                // its past time OR we waited
                await func();
                this.lastExecute = dayjs();
            }
        }
    }
}

export const chunk = <T>(arr: T[], size: number): T[][] =>
    Array.from({length: Math.ceil(arr.length / size)}, (v, i) =>
        arr.slice(i * size, i * size + size)
    );

export const randomNumber = (max: number = 100) => {
    return Math.floor(Math.random() * max);
}

export const uniqueRandomNumber = (max: number = 100) => {
    const existing: number[] = [];
    return () => {
        const num = randomNumber(max);
        if (!existing.includes(num)) {
            existing.push(num);
            return num;
        }
    }
}

export function parseBool(value: any, prev: any = false): boolean {
    let usedVal = value;
    if (value === undefined || value === '') {
        usedVal = prev;
    }
    if(usedVal === undefined || usedVal === '') {
        return false;
    }
    if (typeof usedVal === 'string') {
        return ['1','true','yes'].includes(usedVal.toLocaleLowerCase().trim());
    } else if (typeof usedVal === 'boolean') {
        return usedVal;
    }
    throw new Error(`'${value.toString()}' is not a boolean value.`);
}

const markdownListTransformer: TemplateTransformer = {
    onSubstitution(substitution, resultSoFar, context) {
        if (Array.isArray(substitution)) {
            return substitution.map(x => `* ${x}`).join('\n');
        }
        return substitution;
    }
}

export const markdownTag = new TemplateTag(
    markdownListTransformer,
    stripIndentTransformer('all'),
    trimResultTransformer()
);

export const truncateStringToLength = (length: any, truncStr = '...') => (val: any = '') =>  {
    if(val === null) {
        return '';
    }
    const str = typeof val !== 'string' ? val.toString() : val;
    return str.length > length ? `${str.slice(0, length)}${truncStr}` : str;
}
