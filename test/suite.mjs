// Shared tests, run against the ESM build and the CommonJS build.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

export function runSuite(name, lib) {
  const { useFetchError, to, tryCatch, HttpError, TimeoutError } = lib;
  let server;
  let base;

  before(async () => {
    server = createServer((req, res) => {
      switch (req.url) {
        case "/json":
          res.setHeader("content-type", "application/json");
          return res.end(JSON.stringify({ id: 1 }));
        case "/text":
          return res.end("hello");
        case "/empty":
          res.statusCode = 204;
          return res.end();
        case "/bad-json":
          return res.end("{not json");
        case "/not-found":
          res.statusCode = 404;
          res.setHeader("content-type", "application/json");
          return res.end(JSON.stringify({ message: "missing" }));
        case "/slow":
          return setTimeout(() => res.end("{}"), 500);
        case "/echo":
          return res.end(JSON.stringify({ method: req.method }));
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    server.closeAllConnections();
    server.close();
  });

  test(`${name}: returns parsed JSON`, async () => {
    assert.deepEqual(await useFetchError(`${base}/json`), [null, { id: 1 }]);
  });

  test(`${name}: passes fetch options and accepts URL objects`, async () => {
    const [error, data] = await useFetchError(new URL("/echo", base), { method: "POST" });
    assert.equal(error, null);
    assert.deepEqual(data, { method: "POST" });
  });

  test(`${name}: reads text with parseAs`, async () => {
    assert.deepEqual(await useFetchError(`${base}/text`, { parseAs: "text" }), [null, "hello"]);
  });

  test(`${name}: returns the Response with parseAs "response"`, async () => {
    const [error, response] = await useFetchError(`${base}/text`, { parseAs: "response" });
    assert.equal(error, null);
    assert.equal(await response.text(), "hello");
  });

  test(`${name}: empty body resolves to null`, async () => {
    assert.deepEqual(await useFetchError(`${base}/empty`), [null, null]);
  });

  test(`${name}: HTTP errors return HttpError with status and body`, async () => {
    const [error, data] = await useFetchError(`${base}/not-found`);
    assert.ok(error instanceof HttpError);
    assert.equal(error.status, 404);
    assert.deepEqual(error.body, { message: "missing" });
    assert.equal(data, undefined);
  });

  test(`${name}: invalid JSON returns a SyntaxError`, async () => {
    const [error, data] = await useFetchError(`${base}/bad-json`);
    assert.ok(error instanceof SyntaxError);
    assert.equal(data, undefined);
  });

  test(`${name}: network errors are returned, not thrown`, async () => {
    const [error, data] = await useFetchError("http://127.0.0.1:1/");
    assert.ok(error instanceof Error);
    assert.equal(data, undefined);
  });

  test(`${name}: timeout returns TimeoutError`, async () => {
    const [error] = await useFetchError(`${base}/slow`, { timeout: 50 });
    assert.ok(error instanceof TimeoutError);
    assert.equal(error.timeout, 50);
  });

  test(`${name}: user signal still aborts when timeout is set`, async () => {
    const controller = new AbortController();
    const pending = useFetchError(`${base}/slow`, { timeout: 5000, signal: controller.signal });
    controller.abort();
    const [error] = await pending;
    assert.ok(error instanceof Error);
    assert.ok(!(error instanceof TimeoutError));
  });

  test(`${name}: to() wraps promises`, async () => {
    assert.deepEqual(await to(Promise.resolve(1)), [null, 1]);
    const boom = new Error("boom");
    assert.deepEqual(await to(Promise.reject(boom)), [boom, undefined]);
  });

  test(`${name}: tryCatch() wraps sync functions`, () => {
    assert.deepEqual(tryCatch(JSON.parse, '{"a":1}'), [null, { a: 1 }]);
    const [error] = tryCatch(JSON.parse, "{");
    assert.ok(error instanceof SyntaxError);
  });

  test(`${name}: does not modify built-in prototypes`, () => {
    const own = [Function.prototype, Promise.prototype].flatMap((proto) =>
      Object.getOwnPropertySymbols(proto).map(String)
    );
    assert.ok(!own.includes("Symbol(result)"));
  });
}
