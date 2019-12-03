import { createProxyChain } from "../createProxyChain";
import { AnyKindOfObject } from "..";

describe("Objects", () => {
	it("should return a Proxy from an Array", () => {
		const all = new WeakMap();
		const arrayProxy = createProxyChain([9,8,7,6,5], {}, { all });

		expect(arrayProxy!.hasOwnProperty("length")).toBeTruthy();
        expect(arrayProxy!.length).toBe(5);
		expect(Object.getPrototypeOf(arrayProxy)).toEqual(Array.prototype);
	});

	it("should keep the prototype of elements in nested objects", () => {
		const obj = {
			a: 1,
			b: [0.1, 0.2, 0.3],
			c: {
				d: 4,
				f: 5,
				g: 6, // Like a G6
				h: [1.1,1.2,1.3],
			}
		};

		const all = new WeakMap();
		const proxy = createProxyChain(obj, {}, { all });

		expect(Object.getPrototypeOf(proxy!.b)).toEqual(Array.prototype);
		expect(Object.getPrototypeOf(proxy!.c.h)).toEqual(Array.prototype);
		expect(Object.getPrototypeOf(proxy!.c)).toEqual(Object.prototype);
	});

	it("should keep the same elements descriptors", () => {
		let obj: { a?: number, b?: any } = {};

		Object.defineProperties(obj, {
			'a': {
				value: 42,
				writable: false,
				configurable: true,
				enumerable: false,
			},
			'b': {
				value: {},
			}
		});

		// @ts-ignore
		Object.defineProperty(obj.b, 'c', {
			value: 43,
			writable: false,
			configurable: false,
			enumerable: false,
		});

		const all = new WeakMap();
		const proxy = createProxyChain(obj, {}, { all });

		expect(Object.getOwnPropertyDescriptor(proxy, 'a')).toEqual({
			value: 42,
			writable: false,
			configurable: true,
			enumerable: false
		});

		expect(Object.getOwnPropertyDescriptor(proxy!.b, 'c')).toEqual({
			value: 43,
			writable: false,
			configurable: false,
			enumerable: false
		});
	});

	it("Accepts also Symbols as properties", () => {
		const obj = {
			[Symbol.for("sym")]: 3,
			[Symbol.for("symObj")]: {
				a: 5,
				b: 6,
				c: 7,
			}
		};

		const all = new WeakMap();
		const proxy = createProxyChain(obj, {}, { all });
		// @ts-ignore
		expect(proxy[Symbol.for("sym")]).toBe(3);
		// @ts-ignore
		expect(proxy[Symbol.for("symObj")]).toEqual({
			a: 5,
			b: 6,
			c: 7
		})
	});
});

describe("Object Tree References", () => {
	it("should assign an already existing proxy if a circular reference is met, instead of creating a new one", () => {
		const obj: AnyKindOfObject = {
			a1: {
				b1: {
					c1: 5,
					c2: 6,
					c3: 7,
				},
			}
		};

		obj.a1.b2 = {
			c4: obj.a1,
		};

		// when obj.a1.b2.c4 will be consumed,
		// a1 will be in the seen map but its proxy
		// won't be still available

		const all = new WeakMap();
		const proxy = createProxyChain(obj, {}, { all });

		expect(proxy.a1).toEqual(proxy.a1.b2.c4);
	});

	it("should assign an already existing proxy if a prop points to another object seen in a different branch from the same root tree", () => {
		const obj: AnyKindOfObject = {
			a1: {
				b1: {
					c1: 5,
					c2: 6,
					c3: 7,
				},
			},
			a2: {
				b2: {
					d1: 8,
					d2: 9,
					d3: 10
				}
			}
		};

		obj.a2.b2.d4 = obj.a1.b1;

		const all = new WeakMap();
		const proxy = createProxyChain(obj, {}, { all });

		expect(proxy.a2.b2.d4).toEqual(proxy.a1.b1)
	});
});
