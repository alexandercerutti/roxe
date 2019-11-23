import { createProxyChain } from "../createProxyChain";
import { AnyKindOfObject } from "..";

describe("Objects", () => {
	it("should return a Proxy from an Array", () => {
		const arrayProxy = createProxyChain([9,8,7,6,5], {});

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

		const proxy = createProxyChain(obj, {});

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

		const proxy = createProxyChain(obj, {});

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

		const proxy = createProxyChain(obj, {});
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

describe("Circular Reference", () => {
	it("A proxy reference should be created before if a proxy is still not available", () => {
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

		const proxy = createProxyChain(obj, {});

		expect(proxy.a1).toEqual(proxy.a1.b2.c4);
	});
});
