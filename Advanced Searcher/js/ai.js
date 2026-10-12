// ai.js: the optional AI step that rewrites the query before searching.
// NOT CONNECTED YET: AI_ENDPOINT stays empty until our Cloudflare Worker exists.
// The AI key must live in the Worker, never in this file: anyone can read JS files.
import { load, save } from "./storage.js";

export const AI_ENDPOINT = ""; // e.g. "https://advanced-searcher.<name>.workers.dev"

const STORAGE_KEY = "aiEnabled";
let aiEnabled = load(STORAGE_KEY, false);

export function isAiConnected() {
  return AI_ENDPOINT !== "";
}

export function isAiEnabled() {
  return aiEnabled;
}

/**
 * @param {HTMLInputElement} checkbox
 * @param {HTMLElement} help text under the checkbox
 */
export function setupAiToggle(checkbox, help) {
  checkbox.checked = aiEnabled;
  help.textContent = isAiConnected()
    ? "When on, AI rewrites your search before it runs."
    : "AI is not connected yet, so searches run without it.";

  checkbox.addEventListener("change", () => {
    aiEnabled = checkbox.checked;
    save(STORAGE_KEY, aiEnabled);
  });
}

/**
 * Contract with the Worker:
 *   sends    { text, price, type }
 *   expects  { query: "a better search query" }
 * Returns null whenever AI can't help, so the caller simply searches without it.
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 * @returns {Promise<string | null>}
 */
export async function refineQuery(text, filters) {
  if (!isAiConnected()) return null;
  try {
    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, price: filters.price, type: filters.type }),
      // Short on purpose: browsers block window.open if the click was too long ago.
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.query === "string" && data.query.trim() ? data.query.trim() : null;
  } catch {
    return null; // network error or timeout
  }
}
