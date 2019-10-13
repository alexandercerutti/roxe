import { AnyKindOfObject } from ".";
/**
 * Returns a notification object with
 * all origin object content set to
 * `undefined` (nested object included);
 *
 * @param obj
 * @param parents Optional parents
 */
export declare function createChainFromObject(obj: AnyKindOfObject, parents?: string[], isUndefined?: boolean): AnyKindOfObject | undefined;
