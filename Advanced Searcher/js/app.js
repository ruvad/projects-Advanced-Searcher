// app.js: the entry point for HTML.html. It connects the page to the other modules.
import { filterState, setupFilters, describeFilters } from "./filters.js";
import { buildQuery, buildSearchUrl } from "./search.js";
import { isAiEnabled, isAiConnected, setupAiToggle, refineQuery } from "./ai.js";
import { addBookmark, normalizeUrl, renderBookmarks } from "./bookmarks.js";
import { getPreview, fillPreviewCard } from "./preview.js";
import { addRecent, renderRecent } from "./recent.js";

// Page elements, looked up once. The /** @type */ notes tell VS Code what kind of
// element each one is, so it can autocomplete `.value`, `.checked`, `.showModal()`.
const status = document.getElementById("search-status");
const summary = document.getElementById("selection-summary");
const textInput = /** @type {HTMLInputElement} */ (document.getElementById("text-search"));
const linkInput = /** @type {HTMLInputElement} */ (document.getElementById("link-search"));
const linkPreview = document.getElementById("link-preview");
const aiToggle = /** @type {HTMLInputElement} */ (document.getElementById("ai-toggle"));
const dialog = /** @type {HTMLDialogElement} */ (document.getElementById("bookmark-dialog"));
const bookmarkForm = /** @type {HTMLFormElement} */ (document.getElementById("bookmark-form"));
const bookmarkName = /** @type {HTMLInputElement} */ (document.getElementById("bookmark-name"));
const bookmarkUrl = /** @type {HTMLInputElement} */ (document.getElementById("bookmark-url"));
const bookmarkError = document.getElementById("bookmark-error");

// ----- Filters -----
function updateSummary() {
  summary.textContent = "Selected: " + describeFilters();
}
setupFilters(updateSummary);
updateSummary();
setupAiToggle(aiToggle, document.getElementById("ai-help"));

// ----- Text search -----
document.getElementById("text-form").addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the browser from reloading the page
  const text = textInput.value.trim();
  if (!text) return;

  let query = buildQuery(text, filterState);
  status.textContent = "";

  if (isAiEnabled()) {
    const refined = await refineQuery(text, filterState);
    if (refined) {
      query = refined;
    } else {
      status.textContent = isAiConnected()
        ? "AI didn't answer in time, so this search ran without it."
        : "AI is not connected yet, so this search ran without it.";
    }
  }

  const url = buildSearchUrl(query, filterState);
  addRecent("Search: " + text, url);
  window.open(url, "_blank", "noopener");
});

// ----- Link search: show a preview card, offer to bookmark the site -----
document.getElementById("link-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  let url;
  try {
    url = normalizeUrl(linkInput.value);
  } catch {
    status.textContent = "That doesn't look like a web address.";
    linkPreview.hidden = true;
    return;
  }
  status.textContent = "";
  addRecent("Link: " + new URL(url).hostname, url);

  fillPreviewCard(linkPreview, { title: "Loading preview…", description: "", image: "" }, url);
  linkPreview.hidden = false;
  const preview = await getPreview(url);
  fillPreviewCard(linkPreview, preview, url);

  const open = document.createElement("a");
  open.href = url;
  open.target = "_blank";
  open.rel = "noopener";
  open.textContent = "Open site";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "option";
  saveButton.textContent = "Save to bookmarks";
  saveButton.addEventListener("click", () => {
    status.textContent = addBookmark(preview?.title ?? "", url) || "Saved to bookmarks.";
  });

  const actions = document.createElement("div");
  actions.className = "preview-actions";
  actions.append(open, saveButton);
  linkPreview.append(actions);
});

// ----- Bookmarks: the "+ Add bookmark" dialog -----
document.getElementById("add-bookmark").addEventListener("click", () => {
  bookmarkError.textContent = "";
  dialog.showModal();
});
document.getElementById("bookmark-cancel").addEventListener("click", () => dialog.close());

bookmarkForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const error = addBookmark(bookmarkName.value, bookmarkUrl.value);
  if (error) {
    bookmarkError.textContent = error;
    return;
  }
  bookmarkForm.reset();
  dialog.close();
});

renderBookmarks();
renderRecent();

// For learning: lets you call these from the DevTools Console. Safe to delete.
/** @type {any} */ (window).searcher = { filterState, buildQuery, buildSearchUrl, normalizeUrl, getPreview };
