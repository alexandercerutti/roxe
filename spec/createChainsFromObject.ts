import { createChainFromObject } from "../createChainsFromObject";

describe("Falsy object", () => {
	it("should return undefined", () => {
		// @ts-ignore
		expect(createChainFromObject(undefined)).toBeUndefined();
		// @ts-ignore
		expect(createChainFromObject(null)).toBeUndefined();
	});
});

describe("isUndefined to true", () => {
	it("should return chains of undefined with one-level-deep object and no parents", () => {
		const testObject = {
			"a": 5,
			"b": 6,
			"c": 7,
			"d": 8
		};

		const expectedObjectResult = {
			"a": undefined,
			"b": undefined,
			"c": undefined,
			"d": undefined,
		};

		expect(createChainFromObject(testObject, [], true)).toEqual(expectedObjectResult);
	});

	it("should return chains of undefined composed with parents", () => {
		const testObject = {
			"a": 5,
			"b": 6,
			"c": 7,
			"d": 8
		};

		const expectedObjectResult = {
			"x.y.z.a": undefined,
			"x.y.z.b": undefined,
			"x.y.z.c": undefined,
			"x.y.z.d": undefined,
		};

		expect(createChainFromObject(testObject, ["x", "y", "z"], true)).toEqual(expectedObjectResult);
	});

	it("should return chains of undefined composed with parents, from a with two-levels-deep object", () => {
		const testObject = {
			"a": 5,
			"b": 6,
			"c": {
				"o": 4,
				"p": 3,
				"q": 9,
			},
			"d": 8
		};

		const expectedObjectResult = {
			"x.y.z.a": undefined,
			"x.y.z.b": undefined,
			"x.y.z.c": undefined,
			"x.y.z.c.o": undefined,
			"x.y.z.c.p": undefined,
			"x.y.z.c.q": undefined,
			"x.y.z.d": undefined,
		};

		expect(createChainFromObject(testObject, ["x", "y", "z"], true)).toEqual(expectedObjectResult);
	});
});

describe("isUndefined to false or missing", () => {
	it("should return a chain with object values, from a one-level-deep object and no parents", () => {
		const testObject = {
			"a": 5,
			"b": 6,
			"c": 7,
			"d": 8
		};

		const expectedObjectResult = {
			"a": 5,
			"b": 6,
			"c": 7,
			"d": 8,
		};

		expect(createChainFromObject(testObject)).toEqual(expectedObjectResult);
	});

	it("should return a chain with object values, from a one-level-deep object and parents", () => {
		const testObject = {
			"a": 5,
			"b": 6,
			"c": 7,
			"d": 8
		};

		const expectedObjectResult = {
			"x.y.z.a": 5,
			"x.y.z.b": 6,
			"x.y.z.c": 7,
			"x.y.z.d": 8,
		};

		expect(createChainFromObject(testObject, ["x", "y", "z"])).toEqual(expectedObjectResult);
	});

	it("should return a chain with object values from a two-level-deep object and parents", () => {
		const testObject = {
			"a": 5,
			"b": 6,
			"c": {
				"o": 4,
				"p": 3,
				"q": 9,
			},
			"d": 8
		};

		const expectedObjectResult = {
			"x.y.z.a": 5,
			"x.y.z.b": 6,
			"x.y.z.c": { "o": 4, "p": 3, "q": 9 },
			"x.y.z.c.o": 4,
			"x.y.z.c.p": 3,
			"x.y.z.c.q": 9,
			"x.y.z.d": 8,
		};

		expect(createChainFromObject(testObject, ["x", "y", "z"])).toEqual(expectedObjectResult);
	});
});
