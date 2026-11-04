/**
 * Tuple `[error, data]`. When `error` is `null`, `data` holds the value;
 * otherwise `data` is `undefined`. Checking `error` narrows the type of `data`.
 */
export type Result<T, E = unknown> =
  | [error: null, data: T]
  | [error: E, data: undefined];

/** How the response body is read when the request succeeds. */
export type ParseAs =
  | "json"
  | "text"
  | "blob"
  | "arrayBuffer"
  | "formData"
  | "response";

export interface UseFetchErrorOptions extends RequestInit {
  /** How to read the response body. Defaults to `"json"`. */
  parseAs?: ParseAs;
  /** Aborts the request after this many milliseconds. */
  timeout?: number;
}
