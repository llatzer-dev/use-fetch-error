const symbol = Symbol("result");

/**
 * Interface that extends the native `Function` prototype
 * to include a method that handles errors and returns a tuple
 * containing the error and result.
 */
interface FunctionWithSymbol extends Function {
  /**
   * Executes the function and returns a tuple `[error, result]`.
   * @param {...any[]} args - Arguments to pass to the function.
   * @returns {[any, any]} A tuple containing `null` and the result if successful, or the error and `undefined` if it throws.
   */
  [symbol](...args: any[]): [any, any];
}

Function.prototype[symbol] = function (
  this: FunctionWithSymbol,
  ...args: any[]
): [any, any] {
  try {
    const result = this.apply(this, args);
    return [null, result];
  } catch (error) {
    return [error, undefined];
  }
};

/**
 * Interface that extends the native `Promise` prototype
 * to include a method that handles promise rejections and
 * resolves to a tuple `[error, result]`.
 *
 * @template T - The type of the resolved value of the promise.
 */
interface PromiseWithSymbol<T> extends Promise<T> {
  /**
   * Resolves the promise and returns a tuple `[error, result]`.
   * @returns {Promise<[any, T | undefined]>} A promise that resolves with a tuple containing `null` and the result if successful, or the error and `undefined` if rejected.
   */
  [symbol](): Promise<[any, T | undefined]>;
}

Promise.prototype[symbol] = async function <T>(
  this: PromiseWithSymbol<T>
): Promise<[any, T | undefined]> {
  try {
    const result = await this;
    return [null, result];
  } catch (error) {
    return [error, undefined];
  }
};

/**
 * Fetches a URL and handles both network errors and JSON parsing errors.
 *
 * @template T - The expected data type of the parsed JSON response.
 * @param {string} url - The URL to fetch.
 * @param {RequestInit} [options={}] - Optional configuration for the fetch request.
 * @returns {Promise<[any, T | undefined]>} A promise that resolves with a tuple containing either the error and `undefined` if something went wrong, or `null` and the parsed JSON data if successful.
 */
export async function useFetchError<T>(
  url: string,
  options: RequestInit = {}
): Promise<[any, T | undefined]> {
  const [error, response] = await fetch(url, options)[symbol]();

  if (error) {
    return [error, undefined]; // Retorna el error si ocurrió
  }

  const [parseError, data] = await (response as Response).json()[symbol]();

  if (parseError) {
    return [parseError, undefined]; // Retorna el error al parsear el JSON
  }

  return [null, data]; // Retorna el resultado si todo fue bien
}
