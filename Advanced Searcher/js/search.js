// search.js: turns the user's text + filters into a search engine address.
// Both functions are "pure" (no page access), which makes them easy to test in tests.html.
import { PRICE_RULES, TYPE_RULES } from "./filters.js";

const ENGINE_URL = "https://duckduckgo.com/?q=";
const VERTICALS = {
  images: "&ia=images&iax=images",
  videos: "&ia=videos&iax=videos",
};

/**
 * "frieren" + { price: "free", type: "documents" } → 'frieren "free" filetype:pdf'
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 */
export function buildQuery(text, filters) {
  const parts = [text.trim(), PRICE_RULES[filters.price], TYPE_RULES[filters.type]?.query];
  return parts.filter((part) => part).join(" ");
}

/**
 * @param {string} query the finished query (from buildQuery or from the AI)
 * @param {{ price: string, type: string }} filters
 */
export function buildSearchUrl(query, filters) {
  const vertical = TYPE_RULES[filters.type]?.vertical;
  return ENGINE_URL + encodeURIComponent(query) + (vertical ? VERTICALS[vertical] : "");
}
