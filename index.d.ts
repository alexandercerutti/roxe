import { PartialObserver, Subject } from "rxjs";

declare module "proxy-observer" {
	class ObservableObject<T> {
		private _observedObjects: Observed;
		new (from: T): T & ObservableObject<T>;
		observe?(): SubjectLike;
		unsubscribeAll?(): void;
	}

	interface SubjectLike {
		subscribe(observer: PartialObserver<any>): void;
		unsubscribe(): void;
	}

	interface Observed {
		[key: string]: {
			count: number,
			ref: Subject<any>
		}
	}
}
