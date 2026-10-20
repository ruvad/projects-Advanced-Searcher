// demo.js: the hidden demo mode for presentations. Open the page with ?demo in the address.
// When Gemini is out (or "Skip Gemini" is ticked), both modes still answer, after a short
// pretend loading time, and every demo answer is labelled so nobody mistakes it for live AI.
//
// Where demo answers come from, best first:
//   Mode 1: a saved live answer for the same search → simple keyword rules.
//   Mode 2: a saved live result → prepared examples for the demo topics →
//           live Tavily results sorted by simple rules (if a Tavily key works) → nothing.
import { load, save } from "./storage.js";
import { TYPE_VALUES } from "./filters.js";
import { siteOf, MAX_SHOWN } from "./organize.js";

export const IS_DEMO = new URLSearchParams(location.search).has("demo");

const FIELDS_KEY = "demoSearches"; // saved mode 1 answers
const RESULTS_KEY = "demoResults"; // saved mode 2 answers
const BACKUP_KEY = "demoReplay"; // "use demo answers if Gemini fails" (name kept from v1)
const SKIP_KEY = "demoSkipAi"; // "skip Gemini entirely"

/**
 * The same search always gets the same name: "free anime editing|free|all". Pure.
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 */
export function demoKey(text, filters) {
  return text.trim().toLowerCase().replace(/\s+/g, " ") + "|" + filters.price + "|" + filters.type;
}

/** In demo mode, with "Skip Gemini" ticked: don't even try the live AI. */
export function skipLiveAi() {
  return IS_DEMO && load(SKIP_KEY, false);
}

/** In demo mode, with the backup box ticked: a failed live search falls back to a demo answer. */
export function useDemoBackup() {
  return IS_DEMO && load(BACKUP_KEY, true);
}

/**
 * Pretend loading time, so a demo answer doesn't appear suspiciously instantly.
 * @param {number} min milliseconds
 * @param {number} max milliseconds
 */
export function fakeDelay(min, max) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

// ---------- capturing live answers (only in demo mode) ----------

/** @param {string} text @param {{ price: string, type: string }} filters @param {import("./search.js").Fields} fields */
export function saveDemoFields(text, filters, fields) {
  if (!IS_DEMO) return;
  const saved = load(FIELDS_KEY, {});
  saved[demoKey(text, filters)] = fields;
  save(FIELDS_KEY, saved);
}

/** @param {string} text @param {{ price: string, type: string }} filters @param {import("./organize.js").ResultGroup[]} groups */
export function saveDemoResults(text, filters, groups) {
  if (!IS_DEMO || groups.length === 0) return;
  const saved = load(RESULTS_KEY, {});
  saved[demoKey(text, filters)] = groups;
  save(RESULTS_KEY, saved);
}

// ---------- mode 1 demo answer ----------

const STOP_WORDS = new Set(("a an the and or for of to in on at by with from about some any find me show give " +
  "i want need looking please good best free no not without except latest recent new newest today this week " +
  "month year pdf slides presentation powerpoint spreadsheet excel doc word document youtube github wikipedia " +
  "canada usa uk russia").split(" "));
const SITES = { youtube: "youtube.com", github: "github.com", wikipedia: "wikipedia.org", reddit: "reddit.com" };
const FILES = { pdf: "pdf", slides: "ppt", presentation: "ppt", powerpoint: "ppt", spreadsheet: "xls", excel: "xls", doc: "doc" };
const COUNTRIES = { canada: "CA", usa: "US", uk: "GB", russia: "RU" };
const TYPE_FILES = { documents: "pdf", presentations: "ppt" };

/**
 * Fills Google's fields with simple keyword rules: no AI, so it's only a demo stand-in. Pure.
 * "free anime editing software, no reddit, latest" →
 *   allWords "anime editing software", exactPhrase "free", noneOfWords "reddit", lastUpdate "y", language "en"
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 * @returns {import("./search.js").Fields}
 */
export function ruleFields(text, filters) {
  const lower = text.toLowerCase();
  const quoted = lower.match(/"([^"]+)"/);
  /** @type {string[]} */
  const words = lower.replace(/"[^"]*"/g, " ").match(/[\p{L}\p{N}.+#-]+/gu) ?? [];

  /** @type {string[]} */
  const none = [];
  words.forEach((word, i) => {
    if (["no", "not", "without", "except"].includes(words[i - 1]) && !STOP_WORDS.has(word)) none.push(word);
  });

  /** @param {Record<string, string>} table */
  const find = (table) => Object.keys(table).find((key) => words.includes(key) && !none.includes(key));
  /** @param {...string} keys */
  const has = (...keys) => keys.some((key) => lower.includes(key));
  const fileWord = find(FILES);
  const siteWord = find(SITES);
  const countryWord = find(COUNTRIES);

  const keep = words.filter((word) => !STOP_WORDS.has(word) && !none.includes(word) && !(word in SITES));
  let lastUpdate = "";
  if (has("today")) lastUpdate = "d";
  else if (has("this week")) lastUpdate = "w";
  else if (has("this month")) lastUpdate = "m";
  else if (has("latest", "recent", "newest", "this year")) lastUpdate = "y";

  return {
    allWords: keep.join(" "),
    exactPhrase: quoted ? quoted[1].trim() : (words.includes("free") || filters.price === "free" ? "free" : ""),
    noneOfWords: none.join(" "),
    site: siteWord ? SITES[siteWord] : (filters.type === "videos" ? "youtube.com" : ""),
    fileType: fileWord ? FILES[fileWord] : (TYPE_FILES[filters.type] ?? ""),
    lastUpdate,
    language: /\p{Script=Cyrillic}/u.test(text) ? "ru" : "en",
    region: countryWord ? COUNTRIES[countryWord] : "",
  };
}

/**
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 * @returns {{ fields: import("./search.js").Fields, note: string }}
 */
export function demoFields(text, filters) {
  const saved = load(FIELDS_KEY, {})[demoKey(text, filters)];
  if (saved) return { fields: saved, note: "Demo answer (saved from an earlier live AI search)." };
  return { fields: ruleFields(text, filters), note: "Demo answer (filled by simple rules, not AI)." };
}

// ---------- mode 2 demo answer ----------

/**
 * Prepared examples for the two demo topics. Every address was checked on Oct 20, 2026.
 * A topic matches when all its words appear in the request.
 */
export const PREPARED = [
  {
    words: ["anime", "edit"],
    results: [
      { title: "DaVinci Resolve", url: "https://www.blackmagicdesign.com/products/davinciresolve", type: "tools", price: "free", reason: "Professional video editor with a free version; widely used for anime edits." },
      { title: "Blender", url: "https://www.blender.org/", type: "tools", price: "free", reason: "Free, open-source 3D and video editing software." },
      { title: "Shotcut", url: "https://shotcut.org/", type: "tools", price: "free", reason: "Free, open-source video editor that is easy for beginners." },
      { title: "Kdenlive", url: "https://kdenlive.org/", type: "tools", price: "free", reason: "Free, open-source video editor with effects and transitions." },
      { title: "Krita", url: "https://krita.org/en/", type: "tools", price: "free", reason: "Free painting program for drawing anime-style artwork." },
      { title: "Adobe After Effects", url: "https://www.adobe.com/products/aftereffects.html", type: "tools", price: "paid", reason: "Industry-standard effects software, by subscription." },
    ],
  },
  {
    words: ["javascript"],
    results: [
      { title: "JavaScript Guide - MDN", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", type: "articles", price: "free", reason: "Mozilla's step-by-step guide to the language." },
      { title: "The Modern JavaScript Tutorial", url: "https://javascript.info/", type: "articles", price: "free", reason: "A complete free tutorial from the basics up." },
      { title: "W3Schools JavaScript Tutorial", url: "https://www.w3schools.com/js/", type: "articles", price: "free", reason: "Short lessons with examples you can edit in the browser." },
      { title: "freeCodeCamp", url: "https://www.freecodecamp.org/learn", type: "courses", price: "free", reason: "Free interactive course with a JavaScript certification." },
      { title: "The Odin Project", url: "https://www.theodinproject.com/", type: "courses", price: "free", reason: "Free full web-development path that includes JavaScript." },
      { title: "Codecademy: Learn JavaScript", url: "https://www.codecademy.com/learn/introduction-to-javascript", type: "courses", price: "unknown", reason: "Interactive beginner course in the browser." },
      { title: "Eloquent JavaScript", url: "https://eloquentjavascript.net/", type: "books", price: "free", reason: "A well-known JavaScript book, free to read online." },
    ],
  },
];

/**
 * Groups demo cards the same way organize.js does, applying the Price and Type filters. Pure.
 * @param {{ title: string, url: string, type: string, price: string, reason: string }[]} items
 * @param {{ price: string, type: string }} filters
 * @returns {import("./organize.js").ResultGroup[]}
 */
export function groupDemoItems(items, filters) {
  const kept = items
    .filter((item) => filters.price === "all" || item.price === filters.price)
    .filter((item) => filters.type === "all" || item.type === filters.type)
    .slice(0, MAX_SHOWN);
  return TYPE_VALUES
    .map((type) => ({
      type,
      items: kept.filter((item) => item.type === type).map((item) => ({
        title: item.title, url: item.url, site: siteOf(item.url), price: item.price, reason: item.reason,
      })),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * The prepared topic a request matches, or null. Pure.
 * @param {string} text
 */
export function preparedFor(text) {
  const lower = text.toLowerCase();
  return PREPARED.find((topic) => topic.words.every((word) => lower.includes(word))) ?? null;
}

/**
 * Guesses a result's type from its address and title: no AI, just patterns. Pure.
 * @param {string} url
 * @param {string} title
 */
export function guessType(url, title) {
  const both = (url + " " + title).toLowerCase();
  /** @type {[string, string[]][]} each rule: a type, then patterns that suggest it */
  const rules = [
    ["videos", ["youtube.com", "youtu.be", "vimeo.com", "twitch.tv", "video"]],
    ["documents", [".pdf"]],
    ["presentations", ["slideshare", ".ppt", "slides"]],
    ["courses", ["coursera", "udemy", "edx.org", "codecademy", "khanacademy", "course"]],
    ["podcasts", ["podcast"]],
    ["apps", ["apps.apple.com", "play.google.com", " app"]],
    ["books", ["goodreads", "book"]],
    ["images", ["unsplash", "pinterest", "flickr", "images"]],
    ["tools", ["github.com", "download", "software", "tool", "editor"]],
    ["articles", ["wikipedia", "medium.com", "dev.to", "blog", "guide", "tutorial", "article"]],
  ];
  const match = rules.find(([, patterns]) => patterns.some((pattern) => both.includes(pattern)));
  return match ? match[0] : "websites";
}

/**
 * Demo results for mode 2, or null when there is nothing to show.
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 * @param {() => Promise<import("./tavily.js").WebResult[]>} searchLive Tavily search (may throw)
 * @returns {Promise<{ groups: import("./organize.js").ResultGroup[], note: string } | null>}
 */
export async function demoGroups(text, filters, searchLive) {
  const saved = load(RESULTS_KEY, {})[demoKey(text, filters)];
  if (saved) return { groups: saved, note: "Demo results (saved from an earlier live AI search)." };

  const topic = preparedFor(text);
  if (topic) return { groups: groupDemoItems(topic.results, filters), note: "Demo results (prepared examples, not live AI)." };

  try {
    const web = await searchLive();
    const items = web.map((result) => ({
      title: result.title,
      url: result.url,
      type: guessType(result.url, result.title),
      price: /\bfree\b/i.test(result.title) ? "free" : "unknown",
      reason: result.content.slice(0, 140),
    }));
    return { groups: groupDemoItems(items, filters), note: "Demo results (real web search, sorted by simple rules, not AI)." };
  } catch {
    return null;
  }
}

// ---------- the demo switches ----------

/**
 * Adds the demo switches to the page. Does nothing without ?demo, so normal visitors never see it.
 * @param {HTMLElement} container where the switches go
 */
export function setupDemoSwitch(container) {
  if (!IS_DEMO) return;

  /** @param {string} id @param {string} key @param {boolean} fallback @param {string} words */
  const makeBox = (id, key, fallback, words) => {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.id = id;
    box.checked = load(key, fallback);
    box.addEventListener("change", () => save(key, box.checked));
    const label = document.createElement("label");
    label.className = "ai-toggle";
    label.append(box, " " + words);
    return label;
  };

  const info = document.createElement("p");
  info.className = "input-help";
  const savedCount = Object.keys(load(FIELDS_KEY, {})).length + Object.keys(load(RESULTS_KEY, {})).length;
  info.textContent = "Demo mode. " + savedCount + " live answers saved in this browser. Prepared mode 2 topics: " +
    "“free anime editing software”, “learn JavaScript for beginners”.";

  container.append(
    makeBox("demo-replay", BACKUP_KEY, true, "Use demo answers if Gemini fails"),
    document.createElement("br"),
    makeBox("demo-skip", SKIP_KEY, false, "Skip Gemini completely (demo answers only)"),
    info,
  );
}
