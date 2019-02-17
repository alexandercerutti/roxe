import { Subject, PartialObserver, Subscription } from "rxjs";

const ref = Symbol("ref");
const count = Symbol("count");

interface ObservableConstructor {
	new<T>(from: T): _ObservableObject<T> & T;
}

interface Observed {
	[key: string]: {
		[count]: number,
		[ref]: Subject<any>
	}
}

interface SubjectLike {
	subscribe(observer: PartialObserver<any>): void;
	unsubscribe(): void;
}

class _ObservableObject<T> {
	@nonEnumerable
	private _observedObjects: Observed = {};

	constructor(from: T) {
		const handlers = {
			// Note for future: leave receiver as parameter even if not used
			// To keep args as the last and not include receiver in this one
			set: (obj: any, prop: string, value: any, receiver?: any, ...args: any[]): boolean => {
				let propPath = prop;
				if (typeof value === "object" && !Array.isArray(value)) {
					// We when we set a property which will be an object
					// we set it as a Proxy and pass it
					// an edited SETTER with binded trailing keys to reach this property

					// E.g. if we have and object structure like x.y.z.w
					// x, x.y and x.y.z will be Proxies; each property will receive
					// a setter with the parent key.
					// w property will receive as args ["x", "y", "z"];

					obj[prop] = new Proxy(value, {
						set: bindLast(handlers.set, [...args, prop])
					});
				} else {
					// We create the path of the keys passed in the above condition
					// to reach “object endpoint” (like "w" for the prev. example)
					// The path keys composition, let us subscribe to observables
					// with dot notation like x.y.z.w

					if (obj[prop] === value) {
						// If the value is the same, this cannot be considered as a fail
						// trap to return a false value - we'd get a TypeError if in strict-mode
						return true;
					}

					obj[prop] = value;

					// "x.y.z" as string if we have some
					propPath = args.length ? [...args, prop].join(".") : prop;
				}

				// We want both single properties an complex objects to be notified when edited
				if (this._observedObjects[propPath]) {
					this._observedObjects[propPath][ref].next(value);
				}

				return true;
			}
		};

		// return Object.assign(this, buildInitialProxyChain(from, handlers));
		return new Proxy(Object.assign(this, buildInitialProxyChain(from, handlers)), handlers);
	}

	/**
	 * Registers a custom property to be observed.
	 * Creates a Rx-like interface to subscribe and
	 * unsubscribe to the Subject, but by keeping an
	 * ARC to delete the property once all the subscribers
	 * have unsubscribed.
	 *
	 * @param {string} prop - The property or object
	 * 		property to subscribe to (e.g. `epsilon`
	 * 		or `time.current`)
	 */

	observe(prop: string): SubjectLike {
		if (!this._observedObjects[prop]) {
			this._observedObjects[prop] = Object.create(null, {
				[ref]: {
					value: new Subject(),
				},
				[count]: {
					value: 0,
					writable: true
				}
			});
		}

		return {
			subscribe: (observer: PartialObserver<any>): Subscription => {
				this._observedObjects[prop][count]++;
				return this._observedObjects[prop][ref].subscribe(observer);
			},
			unsubscribe: (): void => {
				this._observedObjects[prop][ref].unsubscribe();

				if (--this._observedObjects[prop][count] === 0) {
					delete this._observedObjects[prop];
				}
			}
		}
	}

	unsubscribeAll(): void {
		for (const prop in this._observedObjects) {
			this._observedObjects[prop][ref].unsubscribe();
			delete this._observedObjects[prop];
		}
	}
}

// Workaround to allow us to recognize T's props as part of ObservableObject
// https://stackoverflow.com/a/54737176/2929433
export const ObservableObject: ObservableConstructor = _ObservableObject as any;

interface AnyKindOfObject {
	[key: string]: any;
}

/**
 * Builds the initial object-proxy composed of proxies objects
 * @param sourceObject
 * @param handlers
 */

function buildInitialProxyChain(sourceObject: AnyKindOfObject, handlers: ProxyHandler<any>, ...args: string[]): ProxyConstructor {
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
