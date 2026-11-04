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
