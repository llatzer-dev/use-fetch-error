const symbolResult = Symbol("result");

Function.prototype[symbolResult] = function (...args) {
  try {
    const result = this.apply(this, args);
    return [null, result];
  } catch (error) {
    return [error, undefined];
  }
};

Promise.prototype[symbolResult] = async function () {
  try {
    const result = await this;
    return [null, result];
  } catch (error) {
    return [error, undefined];
  }
};

async function useFetch(url, options = {}) {
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
