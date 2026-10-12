// recent.js: the "Recent views" sidebar, newest first.
import { load, save } from "./storage.js";

const STORAGE_KEY = "recent";
const MAX_ITEMS = 8;
/** @type {{ label: string, url: string }[]} */
let recent = load(STORAGE_KEY, []);

/**
 * @param {string} label what the user sees, e.g. "Search: frieren"
 * @param {string} url
 */
export function addRecent(label, url) {
  recent = recent.filter((item) => item.url !== url); // no duplicates
  recent.unshift({ label, url });
  recent = recent.slice(0, MAX_ITEMS);
  save(STORAGE_KEY, recent);
  renderRecent();
}

export function renderRecent() {
  const list = document.getElementById("recent-list");
  const empty = document.getElementById("recent-empty");
  list.replaceChildren();

  for (const item of recent) {
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = item.label;
    const row = document.createElement("li");
    row.append(link);
    list.append(row);
  }
  empty.hidden = recent.length > 0;
}
