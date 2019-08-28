import { Subject, Subscription, Observable } from "rxjs";
import * as debug from "debug";

const roxeDebug = debug("roxe");
const customTraps = Symbol("_customTraps");
const observedObjects = Symbol("_observedObjects");

export type ObservableObject<T> = _ObservableObject<T> & T;
interface ObservableConstructor {
	new<T>(from: T, optHandlers?: ProxyHandler<any>): ObservableObject<T>;
}

interface Observed {
	[key: string]: Subject<any>
}

interface AnyKindOfObject {
	[key: string]: any;
}

class _ObservableObject<T> {
	private [observedObjects]: Observed = {};
	private [customTraps]: ProxyHandler<Object> = {};

	constructor(from: T = <T>{}, optHandlers: ProxyHandler<any> = {}) {
		if (optHandlers && optHandlers.set) {
			this[customTraps].set = optHandlers.set;
			delete optHandlers.set;
		}

		if (optHandlers && optHandlers.get) {
			this[customTraps].get = optHandlers.get;
		}

		const handlers = Object.assign(optHandlers, {
			// Note for future: leave receiver as parameter even if not used
			// to keep args as the last and not include receiver in this one
			set: (obj: any, prop: string, value: any, receiver?: any, ...args: any[]): boolean => {
				// Creating the chain of properties that will be notified
				const shouldBuildNotificationChain = (
					(obj[prop] && typeof obj[prop] === "object" && !value) ||
					(value && typeof value === "object")
				);

				const notificationChain = Object.assign(
					{ [[...(args || []), prop].join(".")]: value },
					(!shouldBuildNotificationChain && {} ||
					buildNotificationChain(obj[prop], value, ...args, prop))
				);

				if (typeof value === "object") {
					if (this[customTraps].set && this[customTraps].set!(obj, prop, value, receiver) === false) {
						return false;
					}

					/*
					 * We when we set a property which will be an object
					 * we set it as a Proxy and pass it
					 * an edited SETTER with binded trailing keys to reach
					 * this property.
					 * E.g. if we have an object structure like x.y.z.w
					 * x, x.y and x.y.z will be Proxies; each property
					 * will receive a setter with the parent keys.
					 * w property, will receive below (in else),
					 * ["x", "y", "z"] as args.
					 *
					 * We have to copy handlers to a new object to keep
					 * the original `handlers.set` clean from any external argument
					 */
					obj[prop] = new Proxy(value, Object.assign({}, handlers, {
						set: bindLast(handlers.set, ...args, prop),
					}));
				} else {
					/*
					 * We finalize the path of the keys passed in the above condition
					 * to reach “object endpoint” (like "w" for the prev. example)
					 * The path keys composition, let us subscribe to observables
					 * with dot notation like x.y.z.w
					 */

					if (obj[prop] === value) {
						/*
						 * If the value is the same, we return true.
						 * This cannot be considered as a fail. Also, failing would bring
						 * a strict-mode script to throw a TypeError.
						 */
						return true;
					}

					if (this[customTraps].set && this[customTraps].set!(obj, prop, value, receiver) === false) {
						return false;
					}

					obj[prop] = value;
				}

				Object.keys(notificationChain).forEach((keyPath) => {
					const value = notificationChain[keyPath];
					// We want both single properties an complex objects to be notified when edited
					if (this[observedObjects][keyPath]) {
						this[observedObjects][keyPath].next(value);
					}
				});

				return true;
			},
			get: bindLast((target: any, prop: string | number | symbol, receiver: any, customGetter?: ProxyHandler<Object>["get"]) => {
				if (!customGetter || prop in _ObservableObject.prototype) {
					return Reflect.get(target, prop, receiver);
				}

				return customGetter(target, prop, receiver);
			}, this[customTraps].get)
		});

		return new Proxy(Object.assign(this, buildInitialProxyChain(from, handlers)), handlers);
	}

	/**
	 * Registers a custom property to be observed.
	 *
	 * @param {string} prop - The property or object
	 * 		property to subscribe to (e.g. `epsilon`
	 * 		or `time.current`)
	 */

	observe<A = any>(prop: string): Observable<A> {
		if (!this[observedObjects][prop]) {
			this[observedObjects][prop] = new Subject<A>();
		}

		return this[observedObjects][prop].asObservable();
	}

	/**
	 * Unsubscribes from all the subscriptions in a specific pool
	 * @param subscriptions
	 */

	unsubscribeAll(subscriptions: Subscription[]): void {
		subscriptions.forEach(sub => sub.unsubscribe());
	}

	/**
	 * Returns the current image of a key of the main
	 * object or a nested key.
	 *
	 * @param {string} path - dotted-notation path ("a.b.c")
	 * @returns {any | undefined} - the whole observed object or part of it.
	 * 	Undefined if the path is not matched;
	 */

	snapshot(path?: string): any {
		let firstUnavailableKey: string = "";

		if (!(path && typeof path === "string")) {
			const snapshot = Object.assign({} as T, this);
			// In the snapshot, we don't need the symbol that collects
			// All the observers
			delete snapshot[observedObjects];
			delete snapshot[customTraps];
			return snapshot;
		}

		const snapshot = path.split(".").reduce((acc: AnyKindOfObject, current: string) => {
			if (!(acc && typeof acc === "object" && !Array.isArray(acc) && current && (acc as Object).hasOwnProperty(current))) {
				// if the previous iteration returns undefined,
				// we'll forward this until the end of the loop.
				// We keep the first unavailable key for debug.
				firstUnavailableKey = firstUnavailableKey || current;
				return undefined;
			}

			return acc[current];
		}, this);

		if (snapshot === undefined) {
			roxeDebug(`Cannot access to path "${path}". "${firstUnavailableKey}" is not reachable`);
			return snapshot;
		}

		if (typeof snapshot === "object") {
			return Object.assign({}, snapshot);
		}

		return snapshot;
	}
}

// Workaround to allow us to recognize T's props as part of ObservableObject
// https://stackoverflow.com/a/54737176/2929433
export const ObservableObject: ObservableConstructor = _ObservableObject as any;

/**
 * Builds the initial object-proxy composed of proxies objects
 * @param sourceObject
 * @param handlers
 */

function buildInitialProxyChain(sourceObject: AnyKindOfObject, handlers: ProxyHandler<any>, ...args: any[]): ProxyConstructor {
	let chain: AnyKindOfObject = {};
	const targetObjectKeys = Object.keys(sourceObject);
	for (let i = targetObjectKeys.length, prop; prop = targetObjectKeys[--i];) {
		if (typeof sourceObject[prop] === "object" && !Array.isArray(sourceObject[prop])) {
			chain[prop] = buildInitialProxyChain(sourceObject[prop], Object.assign({}, handlers, {
				set: bindLast(handlers.set!, ...args, prop)
			}), ...args, prop);
		} else {
			chain[prop] = sourceObject[prop];
		}
	}

	return new Proxy(chain, handlers);
}

/**
 * Builds the chain of properties that will be notified.
 * This is used when a property that is or will be
 * an object, is assigned.
 * The function will compose an object { "x.y.z": value }
 * for each key of each nested object.
 * @param source - Current object
 * @param args
 */

function buildNotificationChain(current: AnyKindOfObject, source?: AnyKindOfObject, ...args: string[]): AnyKindOfObject {
	// If our source was valorized and now will be null or undefined
	let chain: AnyKindOfObject = {};
	const targetObject = (
		(source && Object.keys(source).length && source) ||
		(current && Object.keys(current).length && current) ||
		{}
	);
	const targetObjectKeys = Object.keys(targetObject);

	for (let i = targetObjectKeys.length, prop; prop = targetObjectKeys[--i];) {
		const realSource = source && source[prop] || undefined;
		chain[[...args, prop].join(".")] = realSource;

		if (targetObject && targetObject[prop] && typeof targetObject[prop] === "object" && !Array.isArray(targetObject[prop])) {
			Object.assign(chain, buildNotificationChain(current[prop], realSource, ...args, prop))
		}
	}

	return chain;
}

/**
 * Creates a function that accepts default arguments
 * with some other trailing arbitrary dev-defined arguments
 *
 * E.g. Setter receives the following arguments: obj, prop, value, receiver.
 * We wrap the original function in another one that adds the arguments;
 *
 * @param {Function} fn - the original function
 * @param {any[]} boundArgs - the arbitrary arguments
 */

function bindLast(fn: Function, ...boundArgs: any[]) {
	return (...args: [Object, string, any, any?]) => fn(...args, ...boundArgs);
}
