import { AnyKindOfObject } from ".";

interface ProxyAlias {
	parent: AnyKindOfObject;
	aliasName: string;
}

interface AwaitingCircularReference {
	prop: string;
	parent: AnyKindOfObject;
}

/**
 * Creates a proxy-object chain starting from a raw object
 * using handlers that will be "propagated" through all the
 * proxy chain
 *
 * @param sourceObject raw object
 * @param handlers Proxy Handlers
 * @param parent The parent that has
 */

export function createProxyChain<T extends AnyKindOfObject>(sourceObject: T, handlers: ProxyHandler<any>, seenMap?: WeakMap<T, ProxyAlias[]>, parents?: string[]) {
	if (!seenMap) {
		seenMap = new WeakMap<T, ProxyAlias[]>();
	}

	/**
	 * Aliases of sourceObject
	 * that will link to its proxy
	 */

	const circularReferences: AwaitingCircularReference[] = [];

	/**
	 * If the current sourceObject has a value in the map,
	 * we are facing a circular reference. We have to create directly
	 * the Proxy and return it.
	 */

	seenMap.set(sourceObject, []);

	const descriptors = Object.getOwnPropertyDescriptors(sourceObject);
	const targetObjectKeys = Object.keys(descriptors);

	for (let i = targetObjectKeys.length, prop; prop = targetObjectKeys[--i];) {
		if (sourceObject[prop] && typeof sourceObject[prop] === "object") {
			const parentChain = [...(parents || []), prop];

			if (seenMap.has(sourceObject[prop])) {
				/**
				 * Current object has circular reference but the proxy have not been created yet.
				 * The idea is to save a list of current prop and their parent object (sourceObject)
				 * in the SeenMap, so we can iterate them at the end of every map object and
				 * assign to its aliases (sourceObject[prop]) the newly created proxy.
				 *
				 * So, a single list object might be composed as `{ sourceObject, prop }`, but at
				 * the very end of the for-loop, we don't have to assign the newly created proxy to
				 * `sourceObject[prop]`, but to prop in sourceObject's
				 * new proxy (holy sheeet, THIS is a mind loop!).
				 *
				 * Therefore we delete first the current prop from descriptors and then save
				 * in another list (circularReferences), this list object `{ sourceObject, prop }`.
				 * At the end of the current "session", we'll use them to set in
				 * SeenMap @ sourceObject[prop] a list of { proxy, prop } that will be used
				 * for the above-described goal.
				 */

				delete descriptors[prop];

				circularReferences.push({
					prop,
					parent: sourceObject
				});
			} else {
				/** The current object has no circular reference - All okay! */
				const proxyChain = createProxyChain<T>(sourceObject[prop], handlers, seenMap, parentChain);
				descriptors[prop].value = proxyChain;
			}
		}
	}

	const chain = Object.create(
		Object.getPrototypeOf(sourceObject) || {},
		descriptors
	) as T;

	const proxiedChain = new Proxy<T>(chain, handlers);

	for (let i=circularReferences.length, cr; cr=circularReferences[--i];) {
		const { prop, parent } = cr;
		seenMap.set(parent[prop], [
			...(seenMap.get(parent[prop]) || []),
			{ parent: proxiedChain, aliasName: prop },
		]);
	}

	const currentObjectAliases = seenMap.get(sourceObject) || [];

	for (let i=currentObjectAliases.length, alias; alias=currentObjectAliases[--i];) {
		const { parent, aliasName } = alias;
		parent[aliasName] = proxiedChain;
	}

	return proxiedChain;
}
