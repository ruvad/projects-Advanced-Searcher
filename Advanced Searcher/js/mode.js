// mode.js: the switch between the two AI search modes.
import { load, save } from "./storage.js";
import { markSelected } from "./filters.js";

/** @typedef {"advanced" | "organize"} Mode */

export const MODE_HELP = {
  advanced: "Mode 1: Gemini fills in Google's Advanced Search for you, and Google opens in a new tab.",
  organize: "Mode 2: Tavily finds websites, Gemini sorts them by type and price, and they appear below.",
};

const STORAGE_KEY = "searchMode";
/** @type {Mode} */
let mode = load(STORAGE_KEY, "advanced") === "organize" ? "organize" : "advanced";
let group = null;
let help = null;

/** @returns {Mode} */
export function getMode() {
  return mode;
}

/**
 * @param {Element} switchGroup the element holding the two data-value buttons
 * @param {HTMLElement} helpText the line explaining the selected mode
 */
export function setupModeSwitch(switchGroup, helpText) {
  group = switchGroup;
  help = helpText;
  setMode(mode);

  group.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("[data-value]");
    if (button) setMode(/** @type {Mode} */ (button.getAttribute("data-value")));
  });
}

/** @param {Mode} newMode */
export function setMode(newMode) {
  mode = newMode === "organize" ? "organize" : "advanced";
  save(STORAGE_KEY, mode);
  if (group) markSelected(group, mode);
  if (help) help.textContent = MODE_HELP[mode];
}
