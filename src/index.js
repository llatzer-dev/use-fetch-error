const symbolResult = Symbol("result");

/**
 * Extends the `Function` prototype to include a method
 * that handles errors and returns a tuple `[error, result]`.
 *
 * @param {...any[]} args - The arguments to be passed to the function.
 * @returns {[any, any]} A tuple with `null` and the result if the function executes successfully,
 * or the error and `undefined` if an exception occurs.
 */
Function.prototype[symbolResult] = function (...args) {
  try {
    const result = this.apply(this, args);
    return [null, result];
  } catch (error) {
    return [error, undefined];
  }
};

/**
 * Extends the `Promise` prototype to include a method
 * that handles promise errors and returns a tuple `[error, result]`.
 *
 * @returns {Promise<[any, any]>} A promise that resolves with a tuple containing `null` and the result
 * if the promise resolves successfully, or the error and `undefined` if it is rejected.
 */
Promise.prototype[symbolResult] = async function () {
  try {
    const result = await this;
    return [null, result];
  } catch (error) {
    return [error, undefined];
  }
};

/**
 * Makes an HTTP request using `fetch` and handles both network errors and JSON parsing errors.
 *
 * @param {string} url - The URL to which the request will be made.
 * @param {RequestInit} [options={}] - Optional options to configure the `fetch` request.
 * @returns {Promise<[any, any]>} A promise that resolves with a tuple containing the error and `undefined` if an error occurs,
 * or `null` and the parsed data if the request and JSON parsing are successful.
 */
async function useFetchError(url, options = {}) {
  const [error, response] = await fetch(url, options)[symbolResult]();

  if (error) {
    return [error, undefined]; // Returns the error if one occurred
  }

  const [parseError, data] = await response.json()[symbolResult]();

  if (parseError) {
    return [parseError, undefined]; // Returns the error when parsing JSON
  }

  return [null, data]; // Returns the result if everything went well
}
