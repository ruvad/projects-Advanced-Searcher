// filters.js: the Price and Type option groups.
// The buttons carry data-value="..." in the HTML. This file only reads those values,
// so the visible labels can be renamed or translated without breaking anything.
import { load, save } from "./storage.js";

// What each choice adds to the search query. Tune these freely.
export const PRICE_RULES = {
  all: "",
  free: '"free"',
  paid: '"price"',
};

// `query` is added to the search text; `vertical` switches the search engine's tab.
export const TYPE_RULES = {
  all: { query: "" },
  articles: { query: "article" },
  images: { query: "", vertical: "images" },
  websites: { query: "" },
  podcasts: { query: "podcast" },
  documents: { query: "filetype:pdf" },
  presentations: { query: "filetype:pptx" },
  apps: { query: "app" },
  videos: { query: "", vertical: "videos" },
  courses: { query: "course" },
  books: { query: "book" },
  tools: { query: "tool" },
};

const STORAGE_KEY = "filters";

/** The current choices, e.g. { price: "free", type: "videos" }. */
export const filterState = load(STORAGE_KEY, { price: "all", type: "all" });

/**
 * Connects every element with data-filter="..." to filterState.
 * @param {() => void} onChange called after the user picks an option
 */
export function setupFilters(onChange) {
  for (const group of document.querySelectorAll("[data-filter]")) {
    const name = group.getAttribute("data-filter"); // "price" or "type"

    // A saved choice whose button no longer exists falls back to "all".
    if (!group.querySelector(`[data-value="${filterState[name]}"]`)) {
      filterState[name] = "all";
    }
    markSelected(group, filterState[name]);

    group.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("[data-value]"); // the button, even if a child was clicked
      if (!button) return;

      filterState[name] = button.getAttribute("data-value");
      markSelected(group, filterState[name]);
      save(STORAGE_KEY, filterState);
      onChange();
    });
  }
}

/**
 * @param {Element} group
 * @param {string} value
 */
function markSelected(group, value) {
  for (const button of group.querySelectorAll("[data-value]")) {
    const isSelected = button.getAttribute("data-value") === value;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  }
}

/** "All prices · Videos": the visible labels of the selected buttons. */
export function describeFilters() {
  const labels = [];
  for (const group of document.querySelectorAll("[data-filter]")) {
    const selected = group.querySelector(".selected");
    if (selected) labels.push(selected.textContent.trim());
  }
  return labels.join(" · ");
}
