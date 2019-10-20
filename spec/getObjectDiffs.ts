import { getObjectDiffs } from "../getObjectDiffs";

describe("Generic objects diffs", () => {
	it("Should return empty object if nothing if available", () => {
		// @ts-ignore
		expect(getObjectDiffs()).toEqual({});
		expect(getObjectDiffs({}, {})).toEqual({});
	});
});

describe("should return an object of chains if one of two params is not available", () => {
	describe("No origin - new object", () => {
		let version: any;
		beforeAll(() => {
			version = {
				a: 1,
				b: 2,
				c: 3,
				d: {
					e: 5,
					f: 6,
					g: {
						h: 8
					}
				}
			};
		});

		it("Origin is empty object",() => {
			const chain = getObjectDiffs({}, version);

			expect(chain!.a).toBe(1);
			expect(chain!.d).toEqual({ e: 5, f: 6, g: { h: 8 }});
			expect(chain!["d.e"]).toBe(5);
			expect(chain!["d.g.h"]).toBe(8);
		});

		it("Origin null", () => {
			const chain = getObjectDiffs(null, version);

			expect(chain!.a).toBe(1);
			expect(chain!.d).toEqual({ e: 5, f: 6, g: { h: 8 }});
			expect(chain!["d.e"]).toBe(5);
			expect(chain!["d.g.h"]).toBe(8);
		});

		it("Origin is undefined",() => {
			const chain = getObjectDiffs(undefined, version);

			expect(chain!.a).toBe(1);
			expect(chain!.d).toEqual({ e: 5, f: 6, g: { h: 8 }});
			expect(chain!["d.e"]).toBe(5);
			expect(chain!["d.g.h"]).toBe(8);
		});
	});

	describe("No version - old object", () => {
		let origin: any;
		beforeAll(() => {
			origin = {
				a: 1,
				b: 2,
				c: 3,
				d: {
					e: 5,
					f: 6,
					g: {
						h: 8
					}
				}
			};
		});

		it("Version is empty object",() => {
			const chain = getObjectDiffs(origin, {});

			expect(chain!.a).toBe(undefined);
			expect(chain!.d).toBe(undefined);
			expect(chain!["d.e"]).toBe(undefined);
			expect(chain!["d.g.h"]).toBe(undefined);
		});

		it("Version null", () => {
			const chain = getObjectDiffs(origin, null);

			expect(chain!.a).toBe(undefined);
			expect(chain!.d).toBe(undefined);
			expect(chain!["d.e"]).toBe(undefined);
			expect(chain!["d.g.h"]).toBe(undefined);
		});

		it("Version is undefined",() => {
			const chain = getObjectDiffs(origin, undefined);

			expect(chain!.a).toBe(undefined);
			expect(chain!.d).toBe(undefined);
			expect(chain!["d.e"]).toBe(undefined);
			expect(chain!["d.g.h"]).toBe(undefined);
		});
	});
});

describe("Both are available", () => {
	it("Should return an empty chain if the objects are equals", () => {
		const origin = {
			a: 1,
			b: 2,
			c: 3,
			d: {
				e: 5,
				f: 6,
				g: {
					h: 8
				}
			}
		};

		expect(getObjectDiffs(origin, origin)).toEqual({});
	});

	describe("Should return a chains if any property changed", () => {
		// value -> object
		// object -> value
		// value -> value
		// object -> object

		it("A simple value becomes an object", () => {
			const origin = {
				a: 5
			};

			const version = {
				a: {
					b: 6,
					c: 7
				}
			};

			const diffs = getObjectDiffs(origin, version);

			expect(diffs).toEqual({
				"a": { b: 6, c: 7 },
				"a.b": 6,
				"a.c": 7,
			});
		});

		it("An object becomes a value", () => {
			const origin = {
				a: {
					b: 6,
					c: 7
				}
			};

			const version = {
				a: 5,
				g: 6,
			};

			const diffs = getObjectDiffs(origin, version);

			expect(diffs).toEqual({
				"a": 5,
				"a.b": undefined,
				"a.c": undefined,
				"g": 6,
			});
		});

		it("An object got changes to its inner properties", () => {
			const origin = {
				a: {
					b: 1,
					c: 2,
					d: {
						e: 4,
						f: 5,
						g: 6,
						h: {
							l: 3,
							j: 42
						}
					}
				}
			};

			const version = {
				a: {
					b: 5,
					c: 2,
					d: {
						e: 6,
						f: [1, 2, 3, 4],
						g: 6,
					}
				}
			};

			const diff = getObjectDiffs(origin, version);

			expect(diff).toEqual({
				"a": {
					b: 5,
					c: 2,
					d: {
						e: 6,
						f: [1, 2, 3, 4],
						g: 6,
					},
				},
				"a.b": 5,
				"a.d": {
					e: 6,
					f: [1, 2, 3, 4],
					g: 6,
				},
				"a.d.e": 6,
				"a.d.f": [1, 2, 3, 4],
				"a.d.f.0": 1,
				"a.d.f.1": 2,
				"a.d.f.2": 3,
				"a.d.f.3": 4,
				"a.d.h": undefined,
				"a.d.h.l": undefined,
				"a.d.h.j": undefined,
			});
		});

		it("should return a chain element for each element in an array if that array gets removed", () => {
			const origin = {
				a: 42,
				b: [43, 44, 45, 46, 47, 48]
			};

			const version = {
				a: 43
			};

			expect(getObjectDiffs(origin, version)).toEqual({
				"a": 43,
				"b": undefined,
				"b.0": undefined,
				"b.1": undefined,
				"b.2": undefined,
				"b.3": undefined,
				"b.4": undefined,
				"b.5": undefined,
			});
		});
	});
});
