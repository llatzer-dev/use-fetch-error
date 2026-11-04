import type { Result } from "./types.js";

/** Returns `value` if it is an `Error`, otherwise wraps it in one. */
export function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/**
 * Awaits a promise and returns a tuple `[error, data]` instead of throwing.
 *
 * @example
 * const [error, user] = await to(getUser(id));
 */
export async function to<T, E = unknown>(
  promise: PromiseLike<T>
): Promise<Result<T, E>> {
  try {
    return [null, await promise];
  } catch (error) {
    return [error as E, undefined];
  }
}

/**
 * Runs a synchronous function and returns a tuple `[error, data]` instead of throwing.
 *
 * @example
 * const [error, config] = tryCatch(JSON.parse, text);
 */
export function tryCatch<A extends unknown[], R, E = unknown>(
  fn: (...args: A) => R,
  ...args: A
): Result<R, E> {
  try {
    return [null, fn(...args)];
  } catch (error) {
    return [error as E, undefined];
  }
}
