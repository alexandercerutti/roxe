import { ObservableObject, ObservableObjectType } from "..";
import { observedObjects } from "../observedObjectsSymbol";

interface DeepObject {
	a?: number;
	b: {
		c?: number;
		d?: {
			e?: number;
			f: {
				g?: number;
				h: {
					i?: number;
				};
			};
		};
	};
	aka?: any;
	[key: string]: any;
}

describe("Creating a new observable object", () => {
	let oo: ObservableObjectType<DeepObject>;

	describe("Registration and observing for changes", () => {
		beforeEach(() => {
			// I think there is no way someone could do something like this.

			oo = new ObservableObject<DeepObject>({
				a: 1,
				b: {
					c: 2,
					d: {
						e: 3,
						f: {
							g: 4,
							h: {
								i: 5,
							}
						}
					}
				}
			});
		});

		it("Should register an observer to a specific key of the object", () => {
			const observed = oo.observe("b.d.e");
			// @ts-ignore - only because its the only way to check if it went fine
			expect(Object.keys(oo[observedObjects]).includes("b.d.e")).toBeTruthy();
		});

		it("Should notify all the changes", () => {
			const observed = oo.observe("b.d.e");

			observed.subscribe({
				next: (newValue: any) => {
					expect(newValue).toBe(5);
					expect(oo.b.d!.e).toBe(5);
				}
			});

			oo.b.d!.e = 5;
		});

		it("Unsubscribed object should not show any update", () => {
			const observed = oo.observe("b.d.e");

			let subscription = observed.subscribe({
				next: (newValue: any) => {
					// this won't be executed since unsubscribed
					expect(newValue).toBe(42);
				}
			});

			subscription.unsubscribe();

			oo.b.d!.e = 42;
		});
	});

	describe("Proxy handler", () => {
		let oo: ObservableObjectType<DeepObject>;

		it("Should attach custom handlers to the original one", () => {
			oo = new ObservableObject<DeepObject>({
				a: 1,
				b: {
					c: 2,
					d: {
						e: 3,
						f: {
							g: 4,
							h: {
								i: 5,
							}
						}
					}
				}
			}, {
				get(target: DeepObject, prop: string, receiver: any) {
					// this trap will be executed always, when getting values
					// from the observed objects

					if (typeof target[prop] === "number") {
						return target[prop] ** 2;
					}

					return target[prop];
				}
			});

			expect(oo.b.c).toBe(4);
		});
	});
});
