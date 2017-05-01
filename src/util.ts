export {}

declare global {
    export interface String {
        in: (...args: string[]) => boolean;
        contains: (...args: string[]) => boolean;
    }

    export interface Array<T> {
        any: (callback: (val: T) => boolean) => boolean;
        all: (callback: (val: T) => boolean) => boolean;
        firstIndexWhere: (callback: (val: T) => boolean) => number;
    }
}

/**
 * Checks if the current string matches any of the values in the given list.
 */
String.prototype.in = function(...args: string[]): boolean {
    let inList: boolean = false;
    let str = this;
    args.forEach(function(val) { 
        if (str === val) { inList = true; } 
    });
    return inList;
}

/**
 * Checks if the current string contains any of the values in the given list.
 */
String.prototype.contains = function(...args: string[]): boolean {
    let contains: boolean = false;
    let str = this;
    args.forEach(function(val: string) {
        if (str.indexOf(val) >= 0) { contains = true; }
    });
    return contains;
}

/** 
 * Checks if any of the array values meet the criteria provided in the callback.
 */
Array.prototype.any = function(callback: (val: any) => boolean): boolean {
    let val: boolean = false;
    this.forEach(function(prop: any) {
        if (callback(prop)) { val = true; }
    });
    return val;
}

/** 
 * Checks if all of the array values meet the criteria provided in the callback.
 */
Array.prototype.all = function(callback: (val: any) => boolean): boolean {
    let val: boolean = this.length > 0;
    this.forEach(function(prop: any) {
        if (!callback(prop)) { val = false; }
    });
    return val;
}

Array.prototype.firstIndexWhere = function(callback: (val: any) => boolean): number {
    let index: number = -1;
    for (let i = 0; i < this.length && index < 0; i++) {
        if (callback(this[i])) {
            index = i;
        }
    }
    return index;
}
