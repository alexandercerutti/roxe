import { createChainFromObject } from "./createChainsFromObject";
import { composeParentsChains } from "./composeParentsChain";
import { AnyKindOfObject } from "./model";

/**
 * Creates a new object with the differences among
 * two objects and their props.
 * The object is formatted as { a.b.c: <value> }
 *
 * @param origin
 * @param version
 * @param parents
 */

export function getObjectDiffs(origin: any, version: any, parents: string[] = []) {
	if (!(origin || version) || origin === version) {
		return {};
	}

	if (!version) {
		/**
		 * Value has been removed. We create a chain
		 * with all props of origin to undefined
		 */
		return createChainFromObject(origin, parents, true) || {};
	}

	if (!origin) {
		/**
		 * Value has been created. We create a chain
		 * with all props of version and their version
		 */
		return createChainFromObject(version, parents, false) || {};
	}

	/**
	 * Both origin and version exist. We have to calculate
	 * the difference. We are going to check their types,
	 * their props, their props types and so on.
	 */

	const chains: AnyKindOfObject = {};

	const targetObjectKeys = Array.from(
		new Set([
			...Object.keys(Object.getOwnPropertyDescriptors(origin)),
			...Object.keys(Object.getOwnPropertyDescriptors(version))
		])
	);

	for (let i = targetObjectKeys.length, prop: string; prop = targetObjectKeys[--i];) {
		const parentChains = composeParentsChains(prop, parents);

		if (!origin[prop]) {
			/**
			 * Current prop exists only in version (new prop).
			 * We create a new props chain starting from prop in version.
			 * version[prop] might not be an object
			 */
			if (typeof version[prop] === "object") {
				Object.assign(chains, createChainFromObject(version[prop], parentChains, false) || {});
			}

			parentChains.forEach(c => chains[c] = version[prop]);
		} else if (!version[prop]) {
			/**
			 * Current prop has been removed in version (old prop).
			 * We create a chain of old props in this object to undefined.
			 */
			if (typeof origin[prop] === "object") {
				Object.assign(chains, createChainFromObject(origin[prop], parentChains, true) || {});
			}

			parentChains.forEach(c => chains[c] = undefined);
		} else {
			/**
			 * Prop exists in both.
			 * Oh sh*t.
			 */
			if (typeof origin[prop] === typeof version[prop] && typeof origin[prop] === "object") {
				const diffs = getObjectDiffs(origin[prop], version[prop], parentChains);

				/**
				 * If diffs is an empty object, no diff were
				 * found. Therefore we don't have to do anything.
				 * We register the diffs in the current chain, otherwise.
				 */

				if (diffs && Object.keys(diffs).length) {
					Object.assign(chains, diffs);
					parentChains.forEach(c => chains[c] = version[prop]);
				}
			} else if (typeof origin[prop] === "object") {
				/**
				 * Prop(s) in Origin and version have different types.
				 * Here origin is an object and version is not.
				 * We create an old prop to undefined chain from origin[prop]
				 */
				Object.assign(chains, createChainFromObject(origin[prop], parentChains, true) || {});
				parentChains.forEach(c => chains[c] = version[prop]);
			} else if (typeof version[prop] === "object") {
				/**
				 * Prop(s) in Origin and version have different types.
				 * Here version is an object and origin is not.
				 * We create a new prop chain from version[prop]
				 */
				Object.assign(chains, createChainFromObject(version[prop], parentChains, false) || {});
				parentChains.forEach(c => chains[c] = version[prop]);
			} else if (version[prop] !== origin[prop]) {
				/**
				 * They have both type and value different.
				 * None is an object.
				 */
				parentChains.forEach(c => chains[c] = version[prop]);
			}
		}
	}

	return chains;
}
