// preview.js: title, description and image of a web page, from the Microlink API.
// Most big sites refuse to be shown inside an <iframe>, so we show a card instead.
// Microlink's free tier is small, so every answer is cached in localStorage.
import { load, save } from "./storage.js";

const STORAGE_KEY = "previews";
const cache = load(STORAGE_KEY, {}); // url → { title, description, image } or null

/**
 * @param {string} url
 * @returns {Promise<{ title: string, description: string, image: string } | null>}
 */
export async function getPreview(url) {
  if (url in cache) return cache[url];

  try {
    const response = await fetch("https://api.microlink.io/?url=" + encodeURIComponent(url), {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null; // e.g. 429 rate limit: not cached, so we retry later

    const json = await response.json();
    const data = json.status === "success" ? json.data : null;
    const preview = data && {
      title: data.title ?? "",
      description: data.description ?? "",
      image: data.image?.url ?? "",
    };
    cache[url] = preview; // a page that can't be previewed is remembered as null
    save(STORAGE_KEY, cache);
    return preview;
  } catch {
    return null;
  }
}

/**
 * Fills a container with a preview card. Text goes in with textContent (never innerHTML),
 * so a page title can't inject code into our page.
 * @param {HTMLElement} container
 * @param {{ title: string, description: string, image: string } | null} preview
 * @param {string} url
 */
export function fillPreviewCard(container, preview, url) {
  const host = new URL(url).hostname;
  const title = document.createElement("strong");
  title.textContent = preview?.title || host;
  const text = document.createElement("p");
  text.textContent = preview ? preview.description : "No preview available for this site.";
  container.replaceChildren(title, text);

  if (preview?.image?.startsWith("https://")) {
    const image = document.createElement("img");
    image.src = preview.image;
    image.alt = "";
    container.prepend(image);
  }
}
