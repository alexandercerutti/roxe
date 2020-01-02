import { composeParentsChains } from "../src/composeParentsChain";

it("Returns an array with one prop if none is passed as parents", () => {
	const result = composeParentsChains('a', []);

	return expect(result).toEqual(['a']);
});

it("Returns an array of chains with prop attached if parents are passed", () => {
	const result = composeParentsChains('c', ["a.b", "x.y"]);

	return expect(result).toEqual(["a.b.c", "x.y.c"]);
});

it("Returns an array of chains with a number prop attached if parents are passed", () => {
	const result = composeParentsChains(2, ["a.b", "x.y"]);

	return expect(result).toEqual(["a.b.2", "x.y.2"]);
});

it("Returns an array of chains with a symbol prop attached if parents are passed", () => {
	const testSymbol = Symbol.for("test");

	// @ts-ignore
	const result = composeParentsChains(testSymbol, ["a.b", "x.y"]);

	return expect(result).toEqual([`a.b.${testSymbol.toString()}`, `x.y.${testSymbol.toString()}`]);
});
