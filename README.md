# Use-fetch-error

## A library for error handling with [error, result] tuples using a `useFetchError()` function.

### Example usage:

```javascript
(async () => {
  const validURL = "https://jsonplaceholder.typicode.com/posts/1";
  const invalidURL = "https://url-invalid.com";

  const [error, data] = await useFetchError(invalidURL);

  if (error) {
    console.error("An error occurred:", error);
  } else {
    console.log("Data received:", data);
  }
})();
```
