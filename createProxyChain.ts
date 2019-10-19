import { AnyKindOfObject } from ".";

/**
 * Creates a proxy-object chain starting from a raw object
 * using handlers that will be "propagated" through all the
 * proxy chain
 *
 * @param sourceObject raw object
 * @param handlers Proxy Handlers
 * @param parent The parent that has
 */

export function createProxyChain<T extends AnyKindOfObject>(sourceObject: T, handlers: ProxyHandler<any>, parents?: string[]) {
	const descriptors = Object.getOwnPropertyDescriptors(sourceObject);
	const targetObjectKeys = Object.keys(descriptors);

	for (let i = targetObjectKeys.length, prop; prop = targetObjectKeys[--i];) {
		if (sourceObject[prop] && typeof sourceObject[prop] === "object") {
			const parentChain = [...(parents || []), prop];
			descriptors[prop].value = createProxyChain<T>(sourceObject[prop], handlers, parentChain);
		}
	}

	const chain = Object.create(
		Object.getPrototypeOf(sourceObject) || {},
		descriptors
	) as T;

	return new Proxy<T>(chain, handlers);
}
