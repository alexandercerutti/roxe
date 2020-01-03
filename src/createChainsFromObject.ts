import { composeParentsChains } from "./composeParentsChain";
import { AnyKindOfObject } from "./model";

/**
 * Returns a notification object with
 * all origin object content set to
 * `undefined` (nested object included);
 *
 * @param obj
 * @param parents Optional parents
 */

export function createChainFromObject(obj: AnyKindOfObject, parents: string[] = [], isUndefined: boolean = false) {
	if (!obj) {
		return undefined;
	}

	const chains: AnyKindOfObject = {};
	const objKeys = Object.keys(Object.getOwnPropertyDescriptors(obj));

	if (!objKeys.length) {
		return undefined;
	}

	for (let i = objKeys.length, prop: string; prop = objKeys[--i];) {
		const parentChains = composeParentsChains(prop, parents);

		if (typeof obj[prop] === "object") {
			Object.assign(
				chains,
				createChainFromObject(obj[prop], parentChains, isUndefined)
			);
		}

		const newValue = isUndefined ? undefined : obj[prop];
		parentChains.forEach(c => chains[c] = newValue);
	}

	return chains;
}
