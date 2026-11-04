# Use-fetch-error

## A library for error handling with [error, result] tuples using a `useFetchError()` function.

Works with **JavaScript and TypeScript**, as ES modules (`import`) or CommonJS (`require`). It does not modify any built-in prototype and has no dependencies.

### Installation

```bash
npm install use-fetch-error
```

### Example usage (JavaScript)

```javascript
import { useFetchError } from "use-fetch-error";
// or: const { useFetchError } = require("use-fetch-error");

const [error, data] = await useFetchError("https://jsonplaceholder.typicode.com/posts/1");

if (error) {
  console.error("An error occurred:", error);
} else {
  console.log("Data received:", data);
}
```

### Example usage (TypeScript)

```typescript
import { useFetchError, HttpError } from "use-fetch-error";

interface Post {
  id: number;
  title: string;
}

const [error, post] = await useFetchError<Post>("https://jsonplaceholder.typicode.com/posts/1");

if (error) {
  if (error instanceof HttpError) {
    console.error(error.status, error.body);
  }
} else {
  console.log(post.title); // `post` is `Post` here, not `Post | undefined`
}
```

### When is `error` set?

| Case | `error` |
| --- | --- |
| Network failure / aborted request | the `fetch` error |
| `timeout` expired | `TimeoutError` (`error.timeout`) |
| Status outside 200-299 | `HttpError` (`error.status`, `error.statusText`, `error.body`, `error.response`) |
| Body cannot be parsed | the parse error (e.g. `SyntaxError`) |

An empty body (e.g. `204 No Content`) returns `[null, null]`.

### Options

`useFetchError(input, options)` accepts every `fetch` option plus:

- `parseAs`: `"json"` (default), `"text"`, `"blob"`, `"arrayBuffer"`, `"formData"` or `"response"` (returns the `Response` untouched).
- `timeout`: milliseconds before the request is aborted.

```javascript
const [error, html] = await useFetchError("/page", { parseAs: "text", timeout: 5000 });
```

### Other helpers

```javascript
import { to, tryCatch } from "use-fetch-error";

const [error, user] = await to(getUser(id)); // any promise
const [parseError, config] = tryCatch(JSON.parse, text); // any sync function
```

### Development

```bash
npm install
npm test
```

`npm test` type-checks, builds `dist/esm` and `dist/cjs` (with `.d.ts` files) and runs the tests against both builds.
