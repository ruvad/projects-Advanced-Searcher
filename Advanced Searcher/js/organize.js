// organize.js: mode 2, "AI finds & organizes".
// Tavily finds real pages; Gemini only picks and sorts them, by number. Because Gemini
// never writes the addresses itself, every link on the results page is a real search hit.
import { askGemini } from "./ai.js";
import { searchWeb } from "./tavily.js";
import { TYPE_VALUES, describeConstraints, labelFor } from "./filters.js";

export const MAX_SHOWN = 10; // "about 10" results
const MAX_SEARCHED = 15; // a few extra, so ~10 remain after Gemini drops the poor matches

// Words added to the web search for each filter, so Tavily already leans the right way.
const TYPE_WORDS = {
  articles: "article", images: "images", websites: "website", podcasts: "podcast",
  documents: "pdf", presentations: "presentation slides", apps: "app", videos: "video",
  courses: "course", books: "book", tools: "tool",
};

/**
 * "anime editing" + { price: "free", type: "tools" } → "anime editing free tool". Pure.
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 */
export function buildWebQuery(text, filters) {
  const words = [text.trim()];
  if (filters.price === "free") words.push("free");
  if (TYPE_WORDS[filters.type]) words.push(TYPE_WORDS[filters.type]);
  return words.join(" ");
}

/** The JSON shape Gemini must answer in. */
export const SORT_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array", // no maxItems: it's a reported cause of Gemini server errors; groupResults() limits instead
      items: {
        type: "object",
        properties: {
          index: { type: "integer", description: "The number of the search result." },
          type: { type: "string", enum: TYPE_VALUES },
          price: { type: "string", enum: ["free", "paid", "unknown"] },
          reason: { type: "string", description: "One sentence: why this result fits the request." },
        },
        required: ["index", "type", "price", "reason"],
      },
    },
  },
  required: ["results"],
};

/**
 * The instructions for Gemini, with the numbered search results. Pure.
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 * @param {import("./tavily.js").WebResult[]} webResults
 */
export function buildSortPrompt(text, filters, webResults) {
  const rules = describeConstraints(filters);
  const list = webResults
    .map((result, index) => `[${index}] ${result.title}\n${result.url}\n${result.content.slice(0, 300)}`)
    .join("\n\n");
  return [
    "You organize web search results for a student.",
    `Pick up to ${MAX_SHOWN} results that best match the user's request${rules.length ? " and these rules: " + rules.join(" ") : "."}`,
    "Leave out results that don't fit. Use only the numbered results below; refer to each by its number.",
    "For each pick give: its type (" + TYPE_VALUES.join(", ") + "),",
    "its price (free if it can be used at no cost, paid if it requires payment, unknown if you can't tell),",
    "and one short English sentence saying why it fits.",
    "User request: " + text,
    "Search results:",
    list,
  ].join("\n");
}

/**
 * @typedef {{ title: string, url: string, site: string, price: string, reason: string }} ResultCard
 * @typedef {{ type: string, items: ResultCard[] }} ResultGroup
 */

/**
 * Joins Gemini's picks with the real search results and groups them by type,
 * in TYPE_VALUES order. Bad or repeated numbers from Gemini are skipped. Pure.
 * @param {any} sorted Gemini's answer
 * @param {import("./tavily.js").WebResult[]} webResults
 * @returns {ResultGroup[]}
 */
export function groupResults(sorted, webResults) {
  const used = new Set();
  /** @type {Record<string, ResultCard[]>} */
  const byType = {};

  for (const pick of Array.isArray(sorted?.results) ? sorted.results : []) {
    if (used.size >= MAX_SHOWN) break; // at most 10 results in total
    const result = webResults[pick.index];
    if (!result || used.has(pick.index) || !TYPE_VALUES.includes(pick.type)) continue;
    used.add(pick.index);
    (byType[pick.type] ??= []).push({
      title: result.title,
      url: result.url,
      site: siteOf(result.url),
      price: ["free", "paid"].includes(pick.price) ? pick.price : "unknown",
      reason: typeof pick.reason === "string" ? pick.reason.trim() : "",
    });
  }
  return TYPE_VALUES.filter((type) => byType[type]).map((type) => ({ type, items: byType[type] }));
}

/** "https://www.youtube.com/watch?v=1" → "youtube.com". Pure. @param {string} url */
export function siteOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Mode 2, start to finish (without the page).
 * @param {{ gemini: string, tavily: string }} keys
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 * @returns {Promise<ResultGroup[]>}
 */
export async function findAndOrganize(keys, text, filters) {
  const webResults = await searchWeb(keys.tavily, buildWebQuery(text, filters), MAX_SEARCHED);
  if (webResults.length === 0) return [];
  const sorted = await askGemini(keys.gemini, buildSortPrompt(text, filters, webResults), SORT_SCHEMA);
  return groupResults(sorted, webResults);
}

/**
 * Draws the results inside `container`, replacing what was there (the sample cards).
 * Uses the teammate's existing classes, so no new CSS is needed.
 * @param {HTMLElement} container
 * @param {string} text what the user searched for
 * @param {ResultGroup[]} groups
 */
export function renderResults(container, text, groups) {
  const heading = document.createElement("h2");
  heading.className = "section-heading";
  heading.id = "results-heading";
  heading.textContent = groups.length ? "Results for “" + text + "”" : "Nothing found for “" + text + "”";
  container.replaceChildren(heading);

  for (const group of groups) {
    const groupHeading = document.createElement("h3");
    groupHeading.className = "section-heading";
    groupHeading.textContent = labelFor("type", group.type);

    const grid = document.createElement("div");
    grid.className = "resources";
    for (const item of group.items) grid.append(makeCard(item, group.type));
    container.append(groupHeading, grid);
  }
}

/**
 * One result card. All text goes in with textContent, so nothing from the web can run as code.
 * @param {ResultCard} item
 * @param {string} type
 */
function makeCard(item, type) {
  const label = document.createElement("div");
  label.className = "resource-type";
  label.textContent = labelFor("type", type).toUpperCase();

  const link = document.createElement("a");
  link.className = "result-link";
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = item.title;
  const title = document.createElement("h3");
  title.append(link);

  const reason = document.createElement("p");
  reason.textContent = item.reason;
  const site = document.createElement("p");
  site.className = "result-site";
  site.textContent = item.site;

  const card = document.createElement("article");
  card.className = "resource-card";
  card.append(label, title, reason, site);

  if (item.price !== "unknown") {
    const badge = document.createElement("span");
    badge.className = "badge " + item.price; // the teammate's .free / .paid styles
    badge.textContent = labelFor("price", item.price);
    card.append(badge);
  }
  return card;
}
