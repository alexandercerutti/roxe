import { Subscription, Observable } from "rxjs";
declare const customTraps: unique symbol;
declare const observedObjects: unique symbol;
export declare type ObservableObject<T> = _ObservableObject<T> & T;
interface ObservableConstructor {
    new <T>(from: T, optHandlers?: ProxyHandler<any>): ObservableObject<T>;
}
declare class _ObservableObject<T> {
    private [observedObjects];
    private [customTraps];
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
     * Unsubscribes from all the subscriptions in a specific pool
     * @param subscriptions
     */
    unsubscribeAll(subscriptions: Subscription[]): void;
    /**
     * Returns the current image of a key of the main
     * object or a nested key.
     *
     * @param {string} path - dotted-notation path ("a.b.c")
     * @returns {any | undefined} - the whole observed object or part of it.
     * 	Undefined if the path is not matched;
     */
    snapshot(path?: string): any;
    /**
     * Calls next on RxJS Subject
     * with the current value
     * for each element in the chain
     * @param notificationChain
     * @private
     */
    private __fireNotifications;
}
export declare const ObservableObject: ObservableConstructor;
export {};
