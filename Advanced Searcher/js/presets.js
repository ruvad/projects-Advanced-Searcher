// presets.js: the preset cards and the prompt compiler.
// Owner: ________

/**
 * One preset = one kind of search.
 * @typedef {{ id: string, name: string, categories: string[] }} Preset
 */

/** @type {Preset[]} */
export const PRESETS = [
  {
    id: "watch",
    name: "Where can I watch it?",
    categories: ["Free", "Free with ads", "Subscription", "Rent or buy"],
  },
  // TODO: "Games like X under $Y", "Free tools for fan art"
];

/**
 * Turns the user's clicks and text into one prompt for the AI.
 * @param {Preset} preset
 * @param {string} query
 * @returns {string}
 */
export function buildPrompt(preset, query) {
  // TODO: add region, budget and output format (JSON schema)
  return `Sort these results for "${query}" into: ${preset.categories.join(", ")}.`;
}
