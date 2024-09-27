const symbolResult = Symbol("result");

/**
 * Extiende el prototipo de `Function` para incluir un método
 * que maneja errores y devuelve una tupla `[error, result]`.
 *
 * @param {...any[]} args - Los argumentos que se pasarán a la función.
 * @returns {[any, any]} Una tupla con `null` y el resultado si la función se ejecuta correctamente,
 * o el error y `undefined` si ocurre una excepción.
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
 * Extiende el prototipo de `Promise` para incluir un método
 * que maneja errores de promesas y devuelve una tupla `[error, result]`.
 *
 * @returns {Promise<[any, any]>} Una promesa que se resuelve con una tupla que contiene `null` y el resultado
 * si la promesa se resuelve correctamente, o el error y `undefined` si es rechazada.
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
 * Realiza una solicitud HTTP utilizando `fetch` y maneja tanto los errores de red como los de parseo JSON.
 *
 * @param {string} url - La URL a la que se hará la solicitud.
 * @param {RequestInit} [options={}] - Opciones opcionales para configurar la solicitud `fetch`.
 * @returns {Promise<[any, any]>} Una promesa que se resuelve con una tupla que contiene el error y `undefined` si ocurre un error,
 * o `null` y los datos parseados si la solicitud y el parseo del JSON son exitosos.
 */
async function useFetchError(url, options = {}) {
  const [error, response] = await fetch(url, options)[symbolResult]();

  if (error) {
    return [error, undefined]; // Retorna el error si ocurrió
  }

  const [parseError, data] = await response.json()[symbolResult]();

  if (parseError) {
    return [parseError, undefined]; // Retorna el error al parsear el JSON
  }

  return [null, data]; // Retorna el resultado si todo fue bien
}
