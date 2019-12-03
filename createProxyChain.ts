import { AnyKindOfObject } from ".";

interface ChainMaps<T extends Object = any> {
	seen?: WeakMap<T, SourceDetails>;
	all?: WeakMap<T, Set<string>>;
}

interface SourceDetails {
	proxy: AnyKindOfObject | undefined;
	aliases: ProxyAlias[];
}

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

export function createProxyChain<T extends AnyKindOfObject>(sourceObject: T, handlers: ProxyHandler<any>, maps: ChainMaps, parents?: string[]) {
	if (!maps) {
		maps = {};
	}

	if (!maps.seen) {
		maps.seen = new WeakMap<T, SourceDetails>();
	}

	const { seen, all } = maps;

	/**
	 * List of { sourceObject, prop }
	 * of props that link to a previous
	 * point of the current chain (circular references);
	 * These are still raw objects (without proxies).
	 */

	const circularReferences: AwaitingCircularReference[] = [];

	/**
	 * If the current sourceObject has a value in the map,
	 * we are facing a circular reference. We have to create directly
	 * the Proxy and return it.
	 */

	seen.set(sourceObject, { proxy: undefined, aliases: [] });

	const descriptors = Object.getOwnPropertyDescriptors(sourceObject);
	const targetObjectKeys = Object.keys(descriptors);

	for (let i = targetObjectKeys.length, prop; prop = targetObjectKeys[--i];) {
		if (sourceObject[prop] && typeof sourceObject[prop] === "object") {
			const parentChain = [...(parents || []), prop];

			if (seen.has(sourceObject[prop])) {
				const { proxy } = seen.get(sourceObject[prop]) || {} as Partial<SourceDetails>;

				if (proxy) {
					/** Current object has reference in another part of the object chain that has been already created. */
					descriptors[prop].value = proxy;
				} else {
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
				}
			} else {
				/** The current object has no circular reference - All okay! */
				const proxyChain = createProxyChain<T>(sourceObject[prop], handlers, maps, parentChain);
				descriptors[prop].value = proxyChain;
			}
		}
	}

	const chain = Object.create(
		Object.getPrototypeOf(sourceObject) || {},
		descriptors
	) as T;

	const proxiedChain = new Proxy<T>(chain, handlers);

	/**
	 * Consuming circular references and assigning in the map,
	 * in the list at parent[prop], a new object with prop, and
	 * the new created proxy chain
	 */

	for (let i=circularReferences.length, cr; cr=circularReferences[--i];) {
		const { prop, parent } = cr;
		const { proxy, aliases } = seen.get(parent[prop]) || {} as Partial<SourceDetails>;

		seen.set(parent[prop], {
			proxy,
			aliases: [
				...(aliases || []),
				{ parent: proxiedChain, aliasName: prop },
			]
		});
	}

	/**
	 * Assigning current sourceObject's proxy to aliases
	 */

	const { aliases } = seen.get(sourceObject) || {} as Partial<SourceDetails>;

	if (aliases && aliases.length) {
		for (let i=aliases.length, alias; alias=aliases[--i];) {
			const { parent, aliasName } = alias;
			parent[aliasName] = proxiedChain;
		}
	}

	seen.set(sourceObject, {
		...(seen.get(sourceObject) || {} as SourceDetails),
		proxy: proxiedChain
	});

	return proxiedChain;
}
