// recent.js: the "Recent views" sidebar, newest first.
// An item is either a link ({ label, url }) or a mode 2 search ({ label, query }).
// Mode 2 results themselves are never stored; clicking runs the search again, live.
import { load, save } from "./storage.js";

const STORAGE_KEY = "recent";
const MAX_ITEMS = 8;
/** @type {{ label: string, url?: string, query?: string }[]} */
let recent = load(STORAGE_KEY, []);
/** @type {(query: string) => void} */
let rerun = () => {};

/**
 * @param {string} label what the user sees, e.g. "Search: frieren"
 * @param {string} url
 */
export function addRecent(label, url) {
  remember({ label, url }, (item) => item.url === url);
}

/**
 * @param {string} label e.g. "AI: free anime editing software"
 * @param {string} query the search words, run again on click
 */
export function addRecentSearch(label, query) {
  remember({ label, query }, (item) => item.query === query);
}

/** @param {(query: string) => void} handler what a click on a saved search does */
export function setRerunHandler(handler) {
  rerun = handler;
}

function remember(newItem, isSame) {
  recent = recent.filter((item) => !isSame(item)); // no duplicates
  recent.unshift(newItem);
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
    link.textContent = item.label;
    if (item.url) {
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener";
    } else {
      link.href = "#";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        rerun(item.query);
      });
    }
    const row = document.createElement("li");
    row.append(link);
    list.append(row);
  }
  empty.hidden = recent.length > 0;
}
