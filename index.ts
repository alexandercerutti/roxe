import { Subject, Subscription } from "rxjs";

export type ObservableObjectType<T> = _ObservableObject<T> & T;
interface ObservableConstructor {
	new<T>(from: T, optHandlers?: ProxyHandler<any>): ObservableObjectType<T>;
}

interface Observed {
	[key: string]: Subject<any>
}

interface AnyKindOfObject {
	[key: string]: any;
}

/**
 * A Subject that will only memorize its subscribers
 * And remove them on unsubscribe.
 * Unsubscription will not close or stop the Subject itself.
 */

class ReusableSubject<T> extends Subject<T> {
	unsubscribe() {
		this.observers = [];
	}
}

class _ObservableObject<T> {
	@nonEnumerable
	private _observedObjects: Observed = {};

	constructor(from: T = <T>{}, optHandlers: ProxyHandler<any> = {}) {
		let afterSet: (obj: any, prop: string, value: any, receiver?: any) => boolean;

		if (optHandlers && optHandlers.set) {
			afterSet = optHandlers.set;
			delete optHandlers.set;
		}

		const handlers = Object.assign(optHandlers, {
			// Note for future: leave receiver as parameter even if not used
			// to keep args as the last and not include receiver in this one
			set: (obj: any, prop: string, value: any, receiver?: any, ...args: any[]): boolean => {
				let notificationChain: AnyKindOfObject;
				if (typeof value === "object" && !Array.isArray(value)) {
					// Creating the chain of properties that will be notified
					notificationChain = Object.assign({
						[prop]: value,
					}, buildNotificationChain(value, prop));

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
					 */
					obj[prop] = new Proxy(value, {
						set: bindLast(handlers.set, [...args, prop])
					});
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

					obj[prop] = value;

					const elementKey = args.length && args[0].length ? [...args[0], prop].join(".") : prop;
					notificationChain = {
						[elementKey] : value
					};
				}

				if (afterSet) {
					let afterSetResult = afterSet(obj, prop, value, receiver);

					if (afterSetResult === false) {
						return afterSetResult;
					}
				}

				Object.keys(notificationChain).forEach((keyPath) => {
					const value = notificationChain[keyPath];
					// We want both single properties an complex objects to be notified when edited
					if (this._observedObjects[keyPath]) {
						this._observedObjects[keyPath].next(value);
					}
				});

				return true;
			}
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

	observe<A = any>(prop: string): Subject<A> {
		if (!this._observedObjects[prop] || this._observedObjects[prop].isStopped || this._observedObjects[prop].closed) {
			this._observedObjects[prop] = new ReusableSubject<A>();
		}

		return this._observedObjects[prop];
	}

	unsubscribeAll(subscriptions: Subscription[]): void {
		subscriptions.forEach(sub => sub.unsubscribe());
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
	for (const prop in sourceObject) {
		if (typeof sourceObject[prop] === "object" && !Array.isArray(sourceObject[prop])) {
			chain[prop] = buildInitialProxyChain(sourceObject[prop], {
				set: bindLast(handlers.set!, [...args, prop])
			}, ...args, prop);
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

function buildNotificationChain(source: AnyKindOfObject, ...args: string[]): AnyKindOfObject {
	let chain: AnyKindOfObject = {};
	for (const prop in source) {
		chain[[...args, prop].join(".")] = source[prop];

		if (typeof source[prop] === "object" && !Array.isArray(source[prop])) {
			Object.assign(chain, buildNotificationChain(source[prop], ...args, prop))
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


/**
 * @enumerable Decorator to initialize a property to be writable but not enumerable
 * @param {boolean} value - new value
 */

function nonEnumerable(target: any, propertyKey: string) {
	Object.defineProperty(target, propertyKey, {
		writable: true,
		enumerable: false
	});
}
