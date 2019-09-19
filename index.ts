import { Subject, Subscription, Observable } from "rxjs";
import * as debug from "debug";

const roxeDebug = debug("roxe");
const customTraps = Symbol("_customTraps");
const observedObjects = Symbol("_observedObjects");
const parent = Symbol("__parent");

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
	private [observedObjects]: Observed;
	private [customTraps]: ProxyHandler<Object>;

	constructor(from: T = <T>{}, optHandlers: ProxyHandler<any> = {}) {
		Object.defineProperties(this, {
			[observedObjects]: {
				value: {},
				writable: false,
				configurable: false,
				enumerable: false
			},
			[customTraps]: {
				value: {},
				writable: false,
				configurable: false,
				enumerable: false,
			}
		});

		if (optHandlers) {
			if (optHandlers.set) {
				this[customTraps].set = optHandlers.set;
				delete optHandlers.set;
			}

			if (optHandlers.deleteProperty) {
				this[customTraps].deleteProperty = optHandlers.deleteProperty;
				delete optHandlers.deleteProperty;
			}
		}

		const handlers = Object.assign(optHandlers, {
			set: (obj: AnyKindOfObject, prop: string, value: any, receiver?: any): boolean => {
				// Notification will have the current property
				// along with the below keys (if the one that have been changed
				// is an object)

				// @ts-ignore - symbols can be used as index in js.
				const propsChain = [...(obj[parent] || []), prop];

				const notificationChain = buildNotificationChain(obj[prop], value, ...propsChain);

				if (typeof value === "object") {
					if (this[customTraps].set && this[customTraps].set!(obj, prop, value, receiver) === false) {
						return false;
					}

					/*
					 * We when we set a property which will be an object
					 * we set it as a Proxy. Each new proxy will have a
					 * Symbol-property "parent" that will include all the
					 * parents names to reach that specific object.
					 *
					 * E.g. if we have an object structure like x.y.z.w
					 * x, x.y and x.y.z will be Proxies; each property
					 * will receive a setter with the parent keys.
					 * w property, will receive below (in else),
					 * ["x", "y", "z"] as args.
					 *
					 * We have to copy handlers to a new object to keep
					 * the original `handlers.set` clean from any external argument
					 */

					obj[prop] = createProxyChain(
						value,
						handlers,
						propsChain
					);
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

				this.__fireNotifications(notificationChain);
				return true;
			},
			deleteProperty: (target: any, prop: string | number | symbol): boolean => {
				const propsChain = [...(target[parent] || []), prop];
				const notificationChain = buildNotificationChain(target[prop], undefined, ...propsChain);

				/**
				 * First we delete the property,
				 * then we fire the notifications
				 * (only if deletion went successfully).
				 * If there's a custom deleteProperty, it
				 * will handle deletion and its result
				 * will determine if notifications should
				 * be fired or not.
				 */

				let deleted: boolean;

				if (this[customTraps].deleteProperty) {
					deleted = this[customTraps].deleteProperty!(target, prop);
				} else {
					deleted = Reflect.deleteProperty(target, prop);
				}

				if (deleted) {
					this.__fireNotifications(notificationChain);
				}

				return deleted;
			}
		});

		return new Proxy(Object.assign(this, createProxyChain(from, handlers)), handlers);
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

	/**
	 * Calls next on RxJS Subject
	 * with the current value
	 * for each element in the chain
	 * @param notificationChain
	 * @private
	 */

	private __fireNotifications(notificationChain: AnyKindOfObject): void {
		const keys = Object.keys(notificationChain);
		for (let i = keys.length; i > 0;) {
			const key = keys[--i];
			const value = notificationChain[key];

			if (this[observedObjects][key]) {
				this[observedObjects][key].next(value);
			}
		}
	}
}

// Workaround to allow us to recognize T's props as part of ObservableObject
// https://stackoverflow.com/a/54737176/2929433
export const ObservableObject: ObservableConstructor = _ObservableObject as any;

/**
 * Creates a proxy-object chain starting from a raw object
 * using handlers that will be "propagated" through all the
 * proxy chain
 *
 * @param sourceObject raw object
 * @param handlers Proxy Handlers
 * @param parent The parent that has
 */

function createProxyChain(sourceObject: AnyKindOfObject, handlers: ProxyHandler<any>, parent?: string[]) {
	const descriptors = Object.getOwnPropertyDescriptors(sourceObject);
	const targetObjectKeys = Object.keys(descriptors);

	for (let i = targetObjectKeys.length, prop; prop = targetObjectKeys[--i];) {
		if (typeof sourceObject[prop] === "object") {
			const parentChain: string[] = [...(parent || []), prop];
			descriptors[prop].value = createProxyChain(sourceObject[prop], handlers, parentChain);
        }
    }

	const parented = Object.assign({
		[Symbol.for("__parent")]: {
			value: parent,
			enumerable: false,
			writable: false,
			configurable: false
}
	}, descriptors);

	const chain = Object.create(
		Object.getPrototypeOf(sourceObject) || {},
		parented
	);

	return new Proxy(chain, handlers);
}

/**
 * Builds the chain of properties that will be notified.
 * This is used when a property that is or will be
 * an object, is assigned.
 * The function will compose an object { "x.y.z": value }
 * for each key of each nested object.
 * @param newValue - Current object
 * @param args
 */

function buildNotificationChain(currentValue: any, newValue?: any, ...args: string[]): AnyKindOfObject | typeof newValue {
	const parentsChain = args.join(".");

	if (typeof newValue === "object") {
		/**
		 * What changed in the new object
		 * since current one?
		 */
		return getDiff(currentValue, newValue, parentsChain);
	} else if (typeof newValue !== "object" && typeof currentValue === "object") {
		/**
		 * Opposite difference.
		 * The result will be all the
		 * currentValue's value keys set to undefined.
		 */
		return getDiff(currentValue, undefined, parentsChain);
	} else {
		/**
		 * Nothing to iterate into. The only
		 * notification to be fired is the one
		 * of the single prop
		 */
		return { [parentsChain]: newValue };
	}
}

/**
 * Obtains the keys/value difference in dot-notation
 * between two object
 *
 * @param source
 * @param different
 * @param parent
 */

function getDiff(original: any, version: any, parents: string) {
	const chain: AnyKindOfObject = {};

	if (!original && !version) {
		return chain;
	}

	if (!original || !version) {
		return getValuedOrUndefinedDiffChain(original, version, parents);
	}

	const keysUnion = Array.from(
		new Set([
			...Object.keys(original|| {}),
			...Object.keys(version || {})
		])
	);

	for (let i = keysUnion.length, key; key = keysUnion[--i];) {
		const keyWithParents = parents ? `${parents}.${key}` : key;
		const isCurrentVersionKeyObject = typeof version === "object" && typeof version[key] === "object";
		const isCurrentOriginalKeyObject = typeof original === "object" && typeof original[key] === "object";

		if (original[key] && version[key]) {
			if (typeof original[key] === typeof version[key]) {
				if (isCurrentOriginalKeyObject) {
					// If we get here, both oldValue and newValue are objects
					Object.assign(chain, getDiff(original[key], version[key], keyWithParents));
				}
			} else {
				if (isCurrentOriginalKeyObject) {
					Object.assign(chain, objectToDiffChain(original[key], keyWithParents, true));
				} else if (isCurrentVersionKeyObject) {
					Object.assign(chain, objectToDiffChain(version[key], keyWithParents, false));
				}
			}

			chain[keyWithParents] = version[key];
		} else {
			// If one is missing...
			Object.assign(chain, getValuedOrUndefinedDiffChain(original[key], version[key], keyWithParents));
		}
	}

	return chain;
}

/**
 * We select an object and iterate through it
 * to get all its properties (and nested ones)
 * in chain format a.b.c.
 *
 * If "allUndefined" is true, undefined is used
 * as value to all the keys. Otherwise their values are used.
 *
 * @param original
 * @param parents
 * @param allUndefined
 */

function objectToDiffChain(original: AnyKindOfObject, parents: string, allUndefined: boolean = false) {
	const chain: AnyKindOfObject = {};

	const keys = Object.keys(original);
	for (let i = keys.length, value; value = keys[--i];) {
		const keyWithParents = parents ? `${parents}.${value}` : value;

		if (typeof original[value] === "object" && !(original[value] instanceof Array)) {
			Object.assign(chain, objectToDiffChain(original[value], keyWithParents, allUndefined));
		}

		chain[keyWithParents] = !allUndefined ? original[value] : undefined;
	}

	return chain;
}

/**
 * If one of the two objects is missing,
 * we use the other one to create a diff
 * chain with the new value or undefined
 *
 * @param original
 * @param version
 * @param parents
 */

function getValuedOrUndefinedDiffChain(original: any, version: any, parents: string) {
	const chain: AnyKindOfObject = {};

	chain[parents] = (!original && version) || undefined;

	if (original && !version) {
		if (typeof original === "object") {
			Object.assign(chain, objectToDiffChain(original, parents, true));
		}
	} else {
		if (typeof version === "object") {
			Object.assign(chain, objectToDiffChain(version, parents, false));
		}
	}

	return chain;
}
