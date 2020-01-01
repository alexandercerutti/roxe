import { ObservableObject } from "..";
import { Subject } from "rxjs";

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

let oo: ObservableObject<DeepObject>;

describe("Registration and changes observation:", () => {
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
		oo.observe("b.d.e");
		const obsSymbols = Object.getOwnPropertySymbols(oo);
		const observedObjects: any = obsSymbols.find((sym: any) => oo[sym]["b.d.e"] && oo[sym]["b.d.e"] instanceof Subject);
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
	}, 5000);

	it("Unsubscribed object should not receive any update", () => {
		const observed = oo.observe("b.d.e");

		let subscription = observed.subscribe({
			next: (newValue: any) => {
				// this won't be executed since unsubscribed
				expect(newValue).toBe(42);
			}
		});

		subscription.unsubscribe();

		oo.b.d!.e = 42;
	}, 5000);

	it("Deleting a property should create notifications", () => {
		oo.observe("b.d.f.g").subscribe({
			next: (newValue: any) => {
				expect(newValue).toBeUndefined();
				expect(oo.b.d!.f.g).toBeUndefined();
				expect(oo.b.d!.f).toBeUndefined();
			}
		});

		delete oo.b.d!.f;
	}, 5000);
});

describe("Custom Proxy handler:", () => {
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

describe("Snapshot:", () => {
	let oo: ObservableObject<DeepObject>;
	beforeEach(() => {
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

	it("Should return a full snapshot of the structure", () => {
		const expectedResult = {
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
		};

		expect(oo.snapshot()).toEqual(expectedResult);
	});

	it("Should take a partial snapshot (object) of the main object", () => {

		const expectedResult = {
			g: 4,
			h: {
				i: 5,
			}
		};

		expect(oo.snapshot("b.d.f")).toEqual(expectedResult);
	});

	it("Should take a partial snapshot (value) of the main object", () => {
		expect(oo.snapshot("b.d.e")).toBe(3);
	});

	it("Should return undefined if the key does not exist", () => {
		expect(oo.snapshot("b.d.h")).toBe(undefined);
	});
});
