import { Subject } from "rxjs";

export type WKP = WeakMap<AnyKindOfObject, Set<string>>;

export interface Observed {
	[key: string]: Subject<any>
}

export interface AnyKindOfObject {
	[key: string]: any;
}
