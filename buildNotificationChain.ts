import { AnyKindOfObject } from ".";
import { getObjectDiffs } from "./getObjectDiffs";

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
	let diffs: AnyKindOfObject = {};

	if (typeof newValue === "object" || typeof newValue !== "object" && typeof currentValue === "object") {
		/**
		 * What changed in the new object
		 * since current one?
		 */
		diffs = getObjectDiffs(currentValue, newValue);
	}

	/**
	 * If diff is empty object, there's nothing
	 * to iterate into. The only
	 * notification to be fired is the one
	 * of the single prop (for each access point)
	 */

	const diffKeys = Object.keys(diffs);
	const prefixedDiffs = diffKeys.reduce((acc, current) => {
		return Object.assign(
			acc,
			...chains.map(chain => ({
				[`${chain}.${current}`]: diffs[current],
			})),
		)
	}, {} as { [key: string]: any });

	chains.forEach(c => prefixedDiffs[c] = newValue);

	return prefixedDiffs;
}
