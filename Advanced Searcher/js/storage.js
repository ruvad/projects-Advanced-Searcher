// storage.js: remember data in this browser (localStorage).
// localStorage only stores text, so every value goes through JSON.

/**
 * @param {string} key
 * @param {any} fallback returned when nothing is saved yet (or storage is blocked)
 */
export function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

/**
 * @param {string} key
 * @param {any} value
 */
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private window): the app still works, it just forgets.
  }
}
