import { Subject } from "rxjs";

declare module "rexursive-observer" {
	const ObservableObject: ObservableConstructor;
	type O2Type<T> = _ObservableObject<T> & T;

	type ObservableConstructor = {
		new<T>(from: T, optHandlers?: ProxyHandler<any>): _ObservableObject<T> & T;
	}
}

declare class _ObservableObject<T> {
	new (from: T): T & _ObservableObject<T>;
	observe<A = any>(): Subject<A>;
	unsubscribeAll(): void;
	snapshot(): T;
}
