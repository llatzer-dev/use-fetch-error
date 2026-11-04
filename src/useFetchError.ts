import { HttpError, TimeoutError } from "./errors.js";
import { to, toError, tryCatch } from "./helpers.js";
import type { ParseAs, Result, UseFetchErrorOptions } from "./types.js";

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
