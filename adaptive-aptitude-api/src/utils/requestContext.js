const { AsyncLocalStorage } = require('node:async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Executes a callback within an AsyncLocalStorage context.
 * @param {{ correlationId: string, method: string, normalizedRoute: string }} context
 * @param {Function} callback
 * @returns {*}
 */
const run = (context, callback) => {
  return asyncLocalStorage.run(context, callback);
};

/**
 * Returns the current request context store, or undefined outside request scope.
 * @returns {{ correlationId: string, method: string, normalizedRoute: string } | undefined}
 */
const getStore = () => {
  return asyncLocalStorage.getStore();
};

/**
 * Updates the normalizedRoute property of the current store if in request scope.
 * @param {string} route
 */
const setNormalizedRoute = (route) => {
  const store = asyncLocalStorage.getStore();
  if (store && typeof route === 'string') {
    store.normalizedRoute = route;
  }
};

module.exports = {
  run,
  getStore,
  setNormalizedRoute
};
