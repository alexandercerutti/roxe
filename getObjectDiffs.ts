import { createChainFromObject } from "./createChainsFromObject";
import { AnyKindOfObject } from ".";

export function getObjectDiffs(origin: any, version: any, parents?: string[]) {
	if (!(origin || version) || origin === version) {
		return {};
	}

	if (!version) {
		return createChainFromObject(origin, parents, true);
	}

	if (!origin) {
		return createChainFromObject(version, parents, false);
	}

	const chain: AnyKindOfObject = {};

	const targetObjectKeys = Array.from(
		new Set([
			...Object.keys(Object.getOwnPropertyDescriptors(origin)),
			...Object.keys(Object.getOwnPropertyDescriptors(version))
		])
	);

	for (let i = targetObjectKeys.length, prop; prop = targetObjectKeys[--i];) {
		const parentedProp = [ ...(parents || []), prop ];
		const propChain = parentedProp.join(".");

		if (!origin[prop]) {
			Object.assign(chain, createChainFromObject(version[prop], parentedProp, false));
			chain[propChain] = version[prop];
		} else if (!version[prop]) {
			Object.assign(chain, createChainFromObject(origin[prop], parentedProp, true));
			chain[propChain] = undefined;
		} else {
			if (typeof origin[prop] === typeof version[prop] && typeof origin[prop] === "object") {
				const diffs = getObjectDiffs(origin[prop], version[prop], parentedProp);

				if (diffs && Object.keys(diffs).length) {
					// If diffs is an empty object,
					// no diff were found. Therefore
					// we don't have to do anything
					Object.assign(chain, diffs);
					chain[propChain] = version[prop];
				}
			} else if (typeof origin[prop] === "object") {
				// Origin and version are different
				Object.assign(chain, createChainFromObject(origin[prop], parentedProp, true));
				chain[propChain] = version[prop];
			} else if (typeof version[prop] === "object") {
				// Origin and version are different
				Object.assign(chain, createChainFromObject(version[prop], parentedProp, false));
				chain[propChain] = version[prop];
			} else if (version[prop] !== origin[prop]) {
				// Origin and version might be equal
				chain[propChain] = version[prop];
			}
		}
	}

	return chain;
}
