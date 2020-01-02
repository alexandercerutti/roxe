/**
 * Creates an array of parents with currentProp as last element
 * (if some parents are available) or uses the currentProp to
 * create a new array
 * @param currentProp
 * @param parents
 */

export function composeParentsChains(currentProp: string | number, parents: string[] = []) {
	const prop = String(currentProp);
	return !parents.length && [prop] || parents.map(c => `${c}.${prop}`);
}
