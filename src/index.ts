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

/**
 * Error returned when the server answers with a status outside 200-299.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly response: Response;
  /** Response body (parsed as JSON when possible, otherwise text). */
  readonly body: unknown;

  constructor(response: Response, body: unknown) {
    super(`HTTP ${response.status} ${response.statusText}`.trim());
    this.name = "HttpError";
    this.status = response.status;
    this.statusText = response.statusText;
    this.response = response;
    this.body = body;
  }
}

/**
 * Error returned when the request is aborted because `timeout` expired.
 */
export class TimeoutError extends Error {
  readonly timeout: number;

  constructor(timeout: number) {
    super(`Request timed out after ${timeout} ms`);
    this.name = "TimeoutError";
    this.timeout = timeout;
  }
}

function toError(value: unknown): Error {
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

async function readBody(response: Response, parseAs: ParseAs): Promise<unknown> {
  switch (parseAs) {
    case "response":
      return response;
    case "text":
      return response.text();
    case "blob":
      return response.blob();
    case "arrayBuffer":
      return response.arrayBuffer();
    case "formData":
      return response.formData();
    case "json": {
      // Empty bodies (204, 205, HEAD...) resolve to `null` instead of failing.
      const text = await response.text();
      return text.trim() === "" ? null : JSON.parse(text);
    }
    default:
      throw new TypeError(`Unsupported parseAs value: ${String(parseAs)}`);
  }
}

async function readErrorBody(response: Response): Promise<unknown> {
  const [, text] = await to<string>(response.text());
  if (text === undefined || text === "") return undefined;
  const [parseError, json] = tryCatch(JSON.parse, text);
  return parseError ? text : json;
}

/**
 * Makes an HTTP request with `fetch` and never throws: it returns `[error, data]`.
 *
 * `error` is set when there is a network error, a timeout or abort, an HTTP
 * status outside 200-299 (`HttpError`), or the body cannot be parsed.
 *
 * @template T - Expected type of the parsed body.
 * @example
 * const [error, post] = await useFetchError<Post>("/api/posts/1");
 * if (error) return console.error(error);
 * console.log(post.title);
 */
export async function useFetchError<T = unknown>(
  input: RequestInfo | URL,
  options: UseFetchErrorOptions = {}
): Promise<Result<T, Error>> {
  const { parseAs = "json", timeout, ...init } = options;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  let onAbort: (() => void) | undefined;

  if (timeout !== undefined) {
    const controller = new AbortController();
    const userSignal = init.signal;
    if (userSignal) {
      if (userSignal.aborted) controller.abort(userSignal.reason);
      onAbort = () => controller.abort(userSignal.reason);
      userSignal.addEventListener("abort", onAbort, { once: true });
    }
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);
    init.signal = controller.signal;
  }

  try {
    const [fetchError, response] = await to(fetch(input, init));
    if (fetchError || !response) {
      return [timedOut ? new TimeoutError(timeout as number) : toError(fetchError), undefined];
    }

    if (!response.ok) {
      return [new HttpError(response, await readErrorBody(response)), undefined];
    }

    const [parseError, data] = await to(readBody(response, parseAs));
    if (parseError) {
      return [timedOut ? new TimeoutError(timeout as number) : toError(parseError), undefined];
    }

    return [null, data as T];
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (onAbort) options.signal?.removeEventListener("abort", onAbort);
  }
}
