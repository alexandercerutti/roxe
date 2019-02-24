import { PartialObserver, Subject, OperatorFunction, Subscription } from "rxjs";

declare module "rexursive-observer" {
	class ObservableObject<T> {
		new (from: T): T & ObservableObject<T>;
		observe<A = any>(): SubscriptionFunnel<A>;
		unsubscribeAll(): void;
		dispose(prop: string): void;
		removeSubscriptions(prop: string): void;
	}

	interface SubscriptionFunnel<T> {
		subscribe(observer: PartialObserver<any>, ...operators: OperatorFunction<any, any>[]): void;
	}
}
