import { _ObservableObject } from "./src/ObservableObject";

export type ObservableObject<T> = _ObservableObject<T> & T;

interface ObservableConstructor {
	new <T>(from: T, optHandlers?: ProxyHandler<any>): ObservableObject<T>;
}

// Workaround to allow us to recognize T's props as part of ObservableObject
// https://stackoverflow.com/a/54737176/2929433
export const ObservableObject: ObservableConstructor = _ObservableObject as any;
