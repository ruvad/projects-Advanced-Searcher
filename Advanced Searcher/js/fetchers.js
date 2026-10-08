// fetchers.js: gets real items from free APIs (no key needed).
// AniList, CheapShark, FreeToGame, GamerPower all allow calls from the browser.
// Owner: ________

/**
 * @param {import("./presets.js").Preset} preset
 * @param {string} query
 * @returns {Promise<object[]>}
 */
export async function fetchItems(preset, query) {
  // TODO: call AniList for the "watch" preset (https://docs.anilist.co/)
  return [];
}
