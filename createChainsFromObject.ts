import { AnyKindOfObject } from ".";

/**
 * Returns a notification object with
 * all origin object content set to
 * `undefined` (nested object included);
 *
 * @param obj
 * @param parents Optional parents
 */

export function createChainFromObject(obj: AnyKindOfObject, parents?: string[], isUndefined: boolean = false) {
	if (!obj) {
		return undefined;
	}

	const chains: AnyKindOfObject = {};
	const objKeys = Object.keys(obj);

	if (!objKeys.length) {
		return undefined;
	}

	for (let i = objKeys.length, prop; prop = objKeys[--i];) {
		const currentChain = [ ...(parents || []), prop ];
		const propChain = currentChain.join(".");

		if (typeof obj[prop] === "object") {
			Object.assign(
				chains,
				createChainFromObject(obj[prop], currentChain, isUndefined)
			);
		}

		chains[propChain] = isUndefined ? undefined : obj[prop];
	}

	return chains;
}
