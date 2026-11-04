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

### Other helpers: `to()` and `tryCatch()`

`useFetchError` is built on two small helpers, and they are exported so you can use the same `[error, data]` style for anything that is not an HTTP request (database queries, file reads, `JSON.parse`...). You don't need them to use `useFetchError`.

Both catch the error instead of letting it be thrown, and return a tuple:

- `[null, data]` if everything went well.
- `[error, undefined]` if something failed.

#### `to(promise)`: for async code

Takes any promise (or anything you would `await`) and waits for it.

```javascript
import { to } from "use-fetch-error";

const [error, user] = await to(db.users.findById(id));

if (error) {
  console.error("Could not load the user:", error);
} else {
  console.log(user.name);
}
```

It is the same as writing:

```javascript
let error = null;
let user;
try {
  user = await db.users.findById(id);
} catch (e) {
  error = e;
}
```

More examples:

```javascript
// Read a file (Node.js)
import { readFile } from "node:fs/promises";
const [readError, content] = await to(readFile("config.json", "utf8"));

// Several requests at once: fails if any of them fails
const [error, [posts, users] = []] = await to(Promise.all([getPosts(), getUsers()]));
```

#### `tryCatch(fn, ...args)`: for sync code

Calls `fn(...args)` for you and catches anything it throws.

```javascript
import { tryCatch } from "use-fetch-error";

tryCatch(JSON.parse, '{"port": 3000}'); // → [null, { port: 3000 }]
tryCatch(JSON.parse, "{ not json");     // → [SyntaxError, undefined]
```

Pass the function and its arguments **separately**: `tryCatch(JSON.parse, text)`, not `tryCatch(JSON.parse(text))`. In the second form `JSON.parse(text)` runs, and throws, before `tryCatch` can catch anything.

When you need more than a single call, pass an arrow function with no arguments:

```javascript
const [error, url] = tryCatch(() => new URL(input, "https://example.com"));
```

#### With TypeScript

Types are inferred, and checking the error narrows the data:

```typescript
import { to, tryCatch } from "use-fetch-error";

const [error, user] = await to(getUser(id)); // user: User | undefined
if (error) throw error;
user.name; // user: User

// The error is typed as `Error`; you can be more specific
const [parseError, data] = tryCatch<[string], Config, SyntaxError>(JSON.parse, text);
```

The error is always an `Error`: if the code throws something else (for example `throw "oops"`), it is wrapped in `new Error("oops")`.

### Development

```bash
npm install
npm test
```

`npm test` type-checks, builds `dist/esm` and `dist/cjs` (with `.d.ts` files) and runs the tests against both builds.
