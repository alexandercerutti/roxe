import { Subject, Subscription } from "rxjs";
import { observedObjects } from "./observedObjectsSymbol";
export declare type ObservableObjectType<T> = _ObservableObject<T> & T;
interface ObservableConstructor {
    new <T>(from: T, optHandlers?: ProxyHandler<any>): ObservableObjectType<T>;
}
declare class _ObservableObject<T> {
    private [observedObjects];
    constructor(from?: T, optHandlers?: ProxyHandler<any>);
    /**
     * Registers a custom property to be observed.
     *
     * @param {string} prop - The property or object
     * 		property to subscribe to (e.g. `epsilon`
     * 		or `time.current`)
     */
    observe<A = any>(prop: string): Subject<A>;
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
     * @returns {any} - the whole observed object or part of it
     * @throws if the current path does not reflect to an available object
     */
    snapshot(path?: string): any;
}
export declare const ObservableObject: ObservableConstructor;
export {};
