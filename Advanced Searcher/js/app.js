// app.js: the entry point for HTML.html. It connects the page to the other modules.
import { filterState, setupFilters, describeFilters } from "./filters.js";
import { getMode, setMode, setupModeSwitch } from "./mode.js";
import { getKey, setupKeyForm } from "./keys.js";
import { fillAdvancedFields, buildGoogleUrl, describeFields } from "./search.js";
import { findAndOrganize, renderResults } from "./organize.js";
import { IS_DEMO, saveDemoFields, savedDemoFields, setupDemoSwitch } from "./demo.js";
import { addBookmark, normalizeUrl, renderBookmarks } from "./bookmarks.js";
import { getPreview, fillPreviewCard } from "./preview.js";
import { addRecent, addRecentSearch, renderRecent, setRerunHandler } from "./recent.js";

// Page elements, looked up once. The /** @type */ notes tell VS Code what kind of
// element each one is, so it can autocomplete `.value`, `.checked`, `.showModal()`.
const status = document.getElementById("search-status");
const aiFilled = document.getElementById("ai-filled");
const summary = document.getElementById("selection-summary");
const results = document.getElementById("results");
const textForm = /** @type {HTMLFormElement} */ (document.getElementById("text-form"));
const textInput = /** @type {HTMLInputElement} */ (document.getElementById("text-search"));
const textButton = /** @type {HTMLButtonElement} */ (textForm.querySelector("button[type=submit]"));
const textTab = /** @type {HTMLInputElement} */ (document.getElementById("type-text"));
const linkInput = /** @type {HTMLInputElement} */ (document.getElementById("link-search"));
const linkPreview = document.getElementById("link-preview");
const dialog = /** @type {HTMLDialogElement} */ (document.getElementById("bookmark-dialog"));
const bookmarkForm = /** @type {HTMLFormElement} */ (document.getElementById("bookmark-form"));
const bookmarkName = /** @type {HTMLInputElement} */ (document.getElementById("bookmark-name"));
const bookmarkUrl = /** @type {HTMLInputElement} */ (document.getElementById("bookmark-url"));
const bookmarkError = document.getElementById("bookmark-error");

// ----- Filters, mode switch, keys, demo switch -----
function updateSummary() {
  summary.textContent = "Selected: " + describeFilters();
}
setupFilters(updateSummary);
updateSummary();

setupModeSwitch(document.getElementById("mode-options"), document.getElementById("mode-help"));
setupKeyForm(
  /** @type {HTMLFormElement} */ (document.getElementById("key-form")),
  /** @type {HTMLInputElement} */ (document.getElementById("gemini-key")),
  /** @type {HTMLInputElement} */ (document.getElementById("tavily-key")),
  document.getElementById("key-remove"),
  document.getElementById("key-status"),
);
setupDemoSwitch(document.getElementById("ai-group"));

// ----- Text search: one form, two modes -----
textForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the browser from reloading the page
  const text = textInput.value.trim();
  if (!text || textButton.disabled) return; // empty, or a search is already running

  status.textContent = "";
  aiFilled.hidden = true;
  textButton.disabled = true; // no double searches while we wait
  try {
    if (getMode() === "advanced") await runAdvancedSearch(text);
    else await runOrganizedSearch(text);
  } finally {
    textButton.disabled = false;
  }
});

/**
 * Mode 1: Gemini fills in Google's Advanced Search; Google opens in a new tab.
 * @param {string} text
 */
async function runAdvancedSearch(text) {
  // Open the tab NOW, while the click still counts: browsers block tabs opened
  // several seconds after a click, and Gemini can take that long to answer.
  const tab = window.open("", "_blank");
  if (!tab) {
    status.textContent = "Your browser blocked the new tab. Allow pop-ups for this site and try again.";
    return;
  }
  tab.opener = null; // the new tab can't control this page (safety)
  try {
    tab.document.title = "Searching…";
    tab.document.body.textContent = "Gemini is filling in Google's Advanced Search…";
  } catch {
    // Some browsers don't allow writing into the new tab; it just stays blank.
  }
  status.textContent = "Asking Gemini…";

  let fields;
  let fromDemo = false;
  try {
    const key = getKey("gemini");
    if (!key) throw new Error("Add your Gemini key in the AI section first.");
    fields = await fillAdvancedFields(key, text, filterState);
    if (IS_DEMO) saveDemoFields(text, filterState, fields);
  } catch (error) {
    fields = savedDemoFields(text, filterState); // null unless ?demo and this search was saved
    if (!fields) {
      tab.close();
      status.textContent = error.message;
      return;
    }
    fromDemo = true;
  }

  const url = buildGoogleUrl(fields);
  if (tab.closed) {
    status.textContent = "The new tab was closed before Google could open.";
    return;
  }
  tab.location.href = url;
  status.textContent = "";
  aiFilled.textContent = (fromDemo ? "Saved demo answer. " : "") + "AI filled: " + describeFields(fields);
  aiFilled.hidden = false;
  addRecent("Search: " + text, url);
}

/**
 * Mode 2: Tavily finds websites, Gemini sorts them, the results replace the sample cards.
 * @param {string} text
 */
async function runOrganizedSearch(text) {
  const keys = { gemini: getKey("gemini"), tavily: getKey("tavily") };
  const missing = [!keys.gemini && "Gemini", !keys.tavily && "Tavily"].filter(Boolean);
  if (missing.length) {
    status.textContent = "Add your " + missing.join(" and ") + " key in the AI section first.";
    return;
  }

  status.textContent = "Searching the web and sorting the results…";
  try {
    const groups = await findAndOrganize(keys, text, filterState);
    renderResults(results, text, groups);
    status.textContent = "";
    addRecentSearch("AI: " + text, text);
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    status.textContent = error.message;
  }
}

// A saved mode 2 search in "Recent views" runs again, live.
setRerunHandler((query) => {
  textTab.checked = true; // show the Text tab
  textInput.value = query;
  setMode("organize");
  textForm.requestSubmit();
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
/** @type {any} */ (window).searcher = { filterState, getMode, buildGoogleUrl, describeFields, normalizeUrl, getPreview };
