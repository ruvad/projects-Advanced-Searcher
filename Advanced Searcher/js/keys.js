// keys.js: the Gemini and Tavily keys, typed in by the user.
// They're saved only in this browser's localStorage, never in the code or on GitHub.
// Anyone with access to this browser could read them, so use free keys only.
import { load, save } from "./storage.js";

const STORAGE_NAMES = { gemini: "geminiKey", tavily: "tavilyKey" };

/**
 * @param {"gemini" | "tavily"} name
 * @returns {string} the saved key, or "" if there is none
 */
export function getKey(name) {
  return load(STORAGE_NAMES[name], "");
}

/** "Gemini key: saved · Tavily key: not saved yet" */
export function describeKeys() {
  const state = (name) => (getKey(name) ? "saved" : "not saved yet");
  return "Gemini key: " + state("gemini") + " · Tavily key (mode 2): " + state("tavily");
}

/**
 * Connects the key form. Save stores whatever was typed (empty fields keep the old key);
 * Remove deletes both keys. The fields are cleared afterwards, so a key is never left on screen.
 * @param {HTMLFormElement} form
 * @param {HTMLInputElement} geminiInput
 * @param {HTMLInputElement} tavilyInput
 * @param {HTMLElement} removeButton
 * @param {HTMLElement} status
 */
export function setupKeyForm(form, geminiInput, tavilyInput, removeButton, status) {
  status.textContent = describeKeys();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (geminiInput.value.trim()) save(STORAGE_NAMES.gemini, geminiInput.value.trim());
    if (tavilyInput.value.trim()) save(STORAGE_NAMES.tavily, tavilyInput.value.trim());
    form.reset();
    status.textContent = describeKeys();
  });

  removeButton.addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_NAMES.gemini);
      localStorage.removeItem(STORAGE_NAMES.tavily);
    } catch {
      // Storage blocked (private window): there was nothing saved to remove.
    }
    form.reset();
    status.textContent = describeKeys();
  });
}
