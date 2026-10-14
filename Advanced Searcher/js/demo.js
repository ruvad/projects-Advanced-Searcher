// demo.js: the hidden demo mode for the presentation. Open the page with ?demo in the address.
// In demo mode, every successful mode 1 answer is saved in this browser. If Gemini fails
// later (no Wi-Fi, limit reached), the saved fields for the same search are used instead.
// Only mode 1 is saved: Gemini's form-filling isn't a Google search result, so keeping it is allowed.
import { load, save } from "./storage.js";

export const IS_DEMO = new URLSearchParams(location.search).has("demo");

const STORAGE_KEY = "demoSearches";
const REPLAY_KEY = "demoReplay";

/**
 * The same search always gets the same name: "free anime editing|free|all". Pure.
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 */
export function demoKey(text, filters) {
  return text.trim().toLowerCase().replace(/\s+/g, " ") + "|" + filters.price + "|" + filters.type;
}

/**
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 * @param {import("./search.js").Fields} fields
 */
export function saveDemoFields(text, filters, fields) {
  const saved = load(STORAGE_KEY, {});
  saved[demoKey(text, filters)] = fields;
  save(STORAGE_KEY, saved);
}

/**
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 * @returns {import("./search.js").Fields | null}
 */
export function savedDemoFields(text, filters) {
  if (!IS_DEMO || !load(REPLAY_KEY, true)) return null;
  return load(STORAGE_KEY, {})[demoKey(text, filters)] ?? null;
}

/**
 * Adds the demo switch to the page. Does nothing without ?demo, so normal visitors never see it.
 * @param {HTMLElement} container where the switch goes
 */
export function setupDemoSwitch(container) {
  if (!IS_DEMO) return;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "demo-replay";
  checkbox.checked = load(REPLAY_KEY, true);
  checkbox.addEventListener("change", () => save(REPLAY_KEY, checkbox.checked));

  const label = document.createElement("label");
  label.className = "ai-toggle";
  label.append(checkbox, " Demo mode: reuse saved mode 1 answers if Gemini fails");

  const count = document.createElement("p");
  count.className = "input-help";
  count.textContent = Object.keys(load(STORAGE_KEY, {})).length + " searches saved in this browser.";

  container.append(label, count);
}
