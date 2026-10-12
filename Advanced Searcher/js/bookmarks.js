// bookmarks.js: the user's saved sites (our "shortcuts"), with icons and hover previews.
import { load, save } from "./storage.js";
import { getPreview, fillPreviewCard } from "./preview.js";
import { addRecent } from "./recent.js";

/**
 * @typedef {{ title: string, description: string, image: string }} Preview
 * @typedef {{ name: string, url: string, preview?: Preview }} Bookmark
 */

const STORAGE_KEY = "bookmarks";
/** @type {Bookmark[]} */
let bookmarks = load(STORAGE_KEY, []);

/**
 * "anilist.co" → "https://anilist.co/". Throws on text that isn't a web address.
 * @param {string} typed
 */
export function normalizeUrl(typed) {
  const text = typed.trim();
  const withScheme = /^https?:\/\//i.test(text) ? text : "https://" + text;
  const url = new URL(withScheme); // throws TypeError on nonsense
  // Chrome accepts "my site.com" as "my%20site.com", so check the domain ourselves:
  // only letters, digits, dots and hyphens, with at least one dot.
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname)) {
    throw new TypeError("Not a web address: " + typed);
  }
  return url.href;
}

/** @param {string} siteUrl */
export function faviconUrl(siteUrl) {
  return "https://www.google.com/s2/favicons?sz=64&domain=" + new URL(siteUrl).hostname;
}

/**
 * @param {string} name may be empty: the site's address is used instead
 * @param {string} typedUrl
 * @returns {string} an error message, or "" when the bookmark was added
 */
export function addBookmark(name, typedUrl) {
  let url;
  try {
    url = normalizeUrl(typedUrl);
  } catch {
    return "That doesn't look like a web address.";
  }
  if (bookmarks.some((bookmark) => bookmark.url === url)) {
    return "This site is already in your bookmarks.";
  }

  /** @type {Bookmark} */
  const bookmark = { name: name.trim() || new URL(url).hostname, url };
  bookmarks.push(bookmark);
  save(STORAGE_KEY, bookmarks);
  renderBookmarks();

  // Fetch the preview once, in the background, and keep it with the bookmark.
  getPreview(url).then((preview) => {
    if (!preview) return; // try again on hover later
    bookmark.preview = preview;
    save(STORAGE_KEY, bookmarks);
  });
  return "";
}

/** @param {string} url */
export function removeBookmark(url) {
  bookmarks = bookmarks.filter((bookmark) => bookmark.url !== url);
  save(STORAGE_KEY, bookmarks);
  renderBookmarks();
}

export function renderBookmarks() {
  const list = document.getElementById("bookmark-list");
  const empty = document.getElementById("bookmark-empty");
  list.replaceChildren();

  for (const bookmark of bookmarks) {
    const icon = document.createElement("img");
    icon.src = faviconUrl(bookmark.url);
    icon.alt = "";
    const name = document.createElement("span");
    name.textContent = bookmark.name;

    const link = document.createElement("a");
    link.className = "bookmark";
    link.href = bookmark.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.append(icon, name);
    link.addEventListener("click", () => addRecent(bookmark.name, bookmark.url));
    link.addEventListener("mouseenter", () => showHoverPreview(link, bookmark));
    link.addEventListener("mouseleave", hideHoverPreview);

    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Remove " + bookmark.name);
    remove.addEventListener("click", () => removeBookmark(bookmark.url));

    const row = document.createElement("li");
    row.append(link, remove);
    list.append(row);
  }
  empty.hidden = bookmarks.length > 0;
}

/**
 * @param {HTMLElement} anchor the bookmark link under the mouse
 * @param {Bookmark} bookmark
 */
async function showHoverPreview(anchor, bookmark) {
  const card = document.getElementById("preview-card");
  const box = anchor.getBoundingClientRect();
  card.style.top = box.top + "px";
  card.style.left = Math.max(8, box.left - 296) + "px"; // to the left of the sidebar
  card.dataset.url = bookmark.url;

  let preview = bookmark.preview;
  if (!preview) {
    fillPreviewCard(card, { title: "Loading preview…", description: "", image: "" }, bookmark.url);
    card.hidden = false;
    preview = await getPreview(bookmark.url);
    if (preview) {
      bookmark.preview = preview;
      save(STORAGE_KEY, bookmarks);
    }
  }
  // The mouse may have moved to another bookmark (or away) while we waited.
  if (card.dataset.url !== bookmark.url) return;
  fillPreviewCard(card, preview, bookmark.url);
  card.hidden = false;
}

function hideHoverPreview() {
  const card = document.getElementById("preview-card");
  card.hidden = true;
  card.dataset.url = "";
}
