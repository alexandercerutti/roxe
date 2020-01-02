import { Subscription, Observable } from "rxjs";

declare class _ObservableObject<T> {
    constructor(from?: T, optHandlers?: ProxyHandler<any>);
    /**
     * Registers a custom property to be observed.
     *
     * @param {string} prop - The property or object
     * 		property to subscribe to (e.g. `epsilon`
     * 		or `time.current`)
     */
    observe<A = any>(prop: string): Observable<A>;

    /**
     * Returns the current image of a key of the main
     * object or a nested key.
     *
     * @param {string} path - dotted-notation path ("a.b.c")
     * @returns {any | undefined} - the whole observed object or part of it.
     * 	Undefined if the path is not matched;
     */
    snapshot(path?: string): any;
}

export declare type ObservableObject<T> = _ObservableObject<T> & T;
interface ObservableConstructor {
    new <T>(from: T, optHandlers?: ProxyHandler<any>): ObservableObject<T>;
}

export declare const ObservableObject: ObservableConstructor;
