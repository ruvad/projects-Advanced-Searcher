// filters.js: the Price and Type option groups.
// The buttons carry data-value="..." in the HTML. This file only reads those values,
// so the visible labels can be renamed or translated without breaking anything.
// In both AI modes the choices become rules ("constraints") the AI must follow.
import { load, save } from "./storage.js";

/** The resource types, in the order mode 2 shows its result groups. */
export const TYPE_VALUES = [
  "articles", "images", "websites", "podcasts", "documents", "presentations",
  "apps", "videos", "courses", "books", "tools",
];

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
 * Highlights the button whose data-value matches. Also used by the mode switch.
 * @param {Element} group
 * @param {string} value
 */
export function markSelected(group, value) {
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

/**
 * The visible label of one button, e.g. ("type", "videos") → "Videos".
 * @param {string} filter "price" or "type"
 * @param {string} value
 */
export function labelFor(filter, value) {
  const button = document.querySelector(`[data-filter="${filter}"] [data-value="${value}"]`);
  return button ? button.textContent.trim() : value;
}

/**
 * The filters as rules for the AI. Pure: no page access, so tests.html can check it.
 * { price: "free", type: "videos" } → ["Only free resources.", "Only resources of type: videos."]
 * @param {{ price: string, type: string }} filters
 * @returns {string[]}
 */
export function describeConstraints(filters) {
  const rules = [];
  if (filters.price === "free") rules.push("Only free resources.");
  if (filters.price === "paid") rules.push("Only paid resources.");
  if (TYPE_VALUES.includes(filters.type)) rules.push("Only resources of type: " + filters.type + ".");
  return rules;
}
