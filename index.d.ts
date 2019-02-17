import { PartialObserver } from "rxjs";

declare module "proxy-observer" {
	class ObservableObject<T> {
		new (from: T): ObservableObject<T> & ProxyConstructor;
		observe(): SubjectLike;
		unsubscribeAll(): void;
	}

	interface SubjectLike {
		subscribe(observer: PartialObserver<any>): void;
		unsubscribe(): void;
	}
}
