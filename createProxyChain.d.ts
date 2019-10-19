import { AnyKindOfObject } from ".";
/**
 * Creates a proxy-object chain starting from a raw object
 * using handlers that will be "propagated" through all the
 * proxy chain
 *
 * @param sourceObject raw object
 * @param handlers Proxy Handlers
 * @param parent The parent that has
 */
export declare function createProxyChain<T extends AnyKindOfObject>(sourceObject: T, handlers: ProxyHandler<any>, parents?: string[]): T;
