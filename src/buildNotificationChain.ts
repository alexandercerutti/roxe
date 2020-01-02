import { getObjectDiffs } from "./getObjectDiffs";
import { AnyKindOfObject } from "./model";

/**
 * Builds the chain of properties that will be notified.
 * This is used when a property that is or will be
 * an object, is assigned.
 * The function will compose an object { "x.y.z": value }
 * for each key of each nested object.
 * @param newValue - Current object
 * @param chains
 */

export function buildNotificationChain(currentValue: any, newValue: any, ...chains: string[]): AnyKindOfObject | typeof newValue {
	const diffs: AnyKindOfObject = Object.assign({}, ...chains.map(c => ({ [c]: newValue })));

	if (typeof newValue === "object" || typeof newValue !== "object" && typeof currentValue === "object") {
		/**
		 * What changed in the new object
		 * since current one?
		 */
		Object.assign(diffs, withParent(getObjectDiffs(currentValue, newValue), chains));
	}

	return diffs;
}

/**
 * Iterates through diffs object keys and creates
 * a new object with every key with parent prefix
 *
 * @param diffs
 * @param parents
 */

function withParent(diffs: AnyKindOfObject, parents: string[]) {
	const diffKeys = Object.keys(diffs);

	return diffKeys.reduce((acc, current) => {
		return Object.assign(
			acc,
			...parents.map(chain => ({
				[`${chain}.${current}`]: diffs[current]
			})),
		);
	}, {} as AnyKindOfObject);
}
