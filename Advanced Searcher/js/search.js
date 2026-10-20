// search.js: mode 1, "AI advanced search".
// Gemini fills the 8 fields of Google's Advanced Search form (google.com/advanced_search),
// and we build the same address that form would open. Codes below were read from
// Google's form on Oct 14, 2026.
import { askGemini } from "./ai.js";
import { describeConstraints } from "./filters.js";

export const FILE_TYPES = ["pdf", "ps", "dwf", "kml", "kmz", "xls", "ppt", "doc", "rtf", "swf"];

/** h = past hour, d = past 24 hours, w = past week, m = past month, y = past year */
export const TIME_RANGES = { h: "past hour", d: "past 24 hours", w: "past week", m: "past month", y: "past year" };

export const LANGUAGES = (
  "af ar hy be bg ca zh-CN zh-TW hr cs da nl en eo et tl fi fr de el iw hi hu is id it ja ko " +
  "lv lt no fa pl pt ro ru sr sk sl es sw sv th tr uk vi"
).split(" ");

export const REGIONS = (
  "AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BV BR IO " +
  "VG BN BG BF BI KH CM CA CV KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CY CZ DK DJ DM DO " +
  "EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GN GW GY " +
  "HT HM HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO " +
  "MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF " +
  "KP MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW WS SM ST SA SN RS SC SL SG " +
  "SK SI SB SO ZA GS KR ES LK SH KN LC PM VC SD SR SJ SE CH SY TW TJ TZ TH TG TK TO TT TN TR TM " +
  "TC TV UM VI UG UA AE GB US UY UZ VU VA VE VN WF EH YE ZM ZW"
).split(" ");

/**
 * The 8 fields, in our own readable names.
 * @typedef {{ allWords: string, exactPhrase: string, noneOfWords: string, site: string,
 *             fileType: string, lastUpdate: string, language: string, region: string }} Fields
 */

/** The JSON shape Gemini must answer in. "" means "leave this field empty". Kept simple on purpose. */
export const FIELDS_SCHEMA = {
  type: "object",
  properties: {
    allWords: { type: "string", description: "All these words. Main search words." },
    exactPhrase: { type: "string", description: "This exact word or phrase, or empty." },
    noneOfWords: { type: "string", description: "None of these words (space-separated), or empty." },
    site: { type: "string", description: "Site or domain such as youtube.com or .edu, or empty." },
    // No "enum" lists here: an empty string inside an enum is a suspected cause of
    // Gemini server errors. cleanFields() checks these values instead.
    fileType: { type: "string", description: "One of " + FILE_TYPES.join(", ") + ", or empty." },
    lastUpdate: { type: "string", description: "One of h, d, w, m, y, or empty." },
    language: { type: "string", description: "Language code such as en, fr, zh-CN, or empty." },
    region: { type: "string", description: "Two-letter country code such as CA or US, or empty." },
  },
  required: ["allWords", "exactPhrase", "noneOfWords", "site", "fileType", "lastUpdate", "language", "region"],
};

/**
 * The instructions for Gemini. Pure.
 * @param {string} text what the user typed
 * @param {{ price: string, type: string }} filters
 */
export function buildFieldsPrompt(text, filters) {
  const rules = describeConstraints(filters);
  return [
    "You fill in Google's Advanced Search form so that it finds what the user asks for.",
    "Do NOT copy the request into allWords. Take the request apart and decide every field, one by one:",
    "- allWords: only the 2-6 essential topic keywords. Drop filler words (find, I want, please, some, good)",
    "  and drop every word you moved into another field.",
    "- exactPhrase: a name, title or phrase whose words must appear together, or a word the results",
    "  must contain (for example free, when the user wants free things). Otherwise empty.",
    "- noneOfWords: everything the user wants to avoid (after no, not, without, except), space-separated.",
    "- site: a website or kind of site the request names: YouTube -> youtube.com, GitHub -> github.com,",
    "  universities -> .edu, government -> .gov. Otherwise empty.",
    "- fileType: one of " + FILE_TYPES.join(", ") + " when the request wants that kind of file",
    "  (PDF -> pdf, slides -> ppt, spreadsheet -> xls, Word document -> doc). Otherwise empty.",
    "- lastUpdate: h, d, w, m or y when the request wants recent things",
    "  (today -> d, this week -> w, this month -> m, latest, recent or this year -> y). Otherwise empty.",
    "- language: the language code of the language the request is written in (en, ru, fr...),",
    "  unless the user asks for another language. Always fill it.",
    "- region: a two-letter country code only when the request names a country or place. Otherwise empty.",
    "Fill a field whenever the request supports it, but never add restrictions the user didn't ask for:",
    "too many restrictions make Google find nothing.",
    "Example: \"free anime editing software, no reddit, latest\" ->",
    "  allWords \"anime editing software\", exactPhrase \"free\", noneOfWords \"reddit\", lastUpdate \"y\", language \"en\".",
    "Example: \"beginner guitar lessons on YouTube from this month\" ->",
    "  allWords \"beginner guitar lessons\", site \"youtube.com\", lastUpdate \"m\", language \"en\".",
    "Example: \"Python cheat sheet PDF, Canada\" ->",
    "  allWords \"python cheat sheet\", fileType \"pdf\", region \"CA\", language \"en\".",
    "Keep the search words in the language the user wrote in.",
    rules.length ? "The results must also follow these rules: " + rules.join(" ") : "",
    "User request: " + text,
  ].filter(Boolean).join("\n");
}

/**
 * True when Gemini just copied the request into allWords and left every other field empty
 * (language aside, which is always filled). Pure.
 * @param {Fields} fields
 * @param {string} text the user's request
 */
export function isCopyPaste(fields, text) {
  const simple = (value) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const othersEmpty = !fields.exactPhrase && !fields.noneOfWords && !fields.site &&
    !fields.fileType && !fields.lastUpdate && !fields.region;
  return othersEmpty && simple(fields.allWords) === simple(text) && simple(text).split(" ").length > 2;
}

/**
 * Keeps only valid values from Gemini's answer; anything unknown becomes "". Pure.
 * @param {any} raw
 * @returns {Fields}
 */
export function cleanFields(raw) {
  const text = (value) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "");
  const site = text(raw?.site).replace(/^site:/i, "").replace(/^https?:\/\//i, "").replace(/\/.*$/, "");

  return {
    allWords: text(raw?.allWords),
    exactPhrase: text(raw?.exactPhrase).replace(/^"|"$/g, ""),
    noneOfWords: text(raw?.noneOfWords),
    site: /^[a-z0-9.-]+$/i.test(site) ? site.toLowerCase() : "",
    fileType: FILE_TYPES.includes(text(raw?.fileType)) ? text(raw?.fileType) : "",
    lastUpdate: text(raw?.lastUpdate) in TIME_RANGES ? text(raw?.lastUpdate) : "",
    language: LANGUAGES.includes(text(raw?.language)) ? text(raw?.language) : "",
    region: REGIONS.includes(text(raw?.region).toUpperCase()) ? text(raw?.region).toUpperCase() : "",
  };
}

/**
 * The same address Google's Advanced Search form opens. Pure.
 * @param {Fields} fields
 */
export function buildGoogleUrl(fields) {
  const params = new URLSearchParams();
  const add = (name, value) => { if (value) params.set(name, value); };
  add("as_q", fields.allWords);
  add("as_epq", fields.exactPhrase);
  add("as_eq", fields.noneOfWords);
  add("as_sitesearch", fields.site);
  add("as_filetype", fields.fileType);
  add("as_qdr", fields.lastUpdate);
  add("lr", fields.language && "lang_" + fields.language);
  add("cr", fields.region && "country" + fields.region);
  return "https://www.google.com/search?" + params.toString();
}

/**
 * All 8 fields for the "AI filled" line, empty ones shown as "—", in the order of
 * Google's Advanced Search form. Pure. Google itself can't show them all again
 * (its Advanced Search page drops most of them; checked Oct 19), so this line is the full record.
 * @param {Fields} fields
 */
export function describeFields(fields) {
  const show = (value) => value || "—";
  return [
    "all these words: " + show(fields.allWords),
    "exact phrase: " + (fields.exactPhrase ? "“" + fields.exactPhrase + "”" : "—"),
    "none of these words: " + show(fields.noneOfWords),
    "site: " + show(fields.site),
    "file type: " + show(fields.fileType),
    "last update: " + show(TIME_RANGES[fields.lastUpdate]),
    "language: " + show(fields.language),
    "region: " + show(fields.region),
  ].join(" · ");
}

/**
 * Mode 1, start to finish (without the page): ask Gemini, clean its answer.
 * @param {string} apiKey
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 * @returns {Promise<Fields>}
 */
export async function fillAdvancedFields(apiKey, text, filters) {
  const prompt = buildFieldsPrompt(text, filters);
  let fields = cleanFields(await askGemini(apiKey, prompt, FIELDS_SCHEMA));

  // Copy-paste check: if Gemini just repeated the request, ask once more, saying what was wrong.
  if (isCopyPaste(fields, text)) {
    const retry = prompt + "\n\nYour previous answer only copied the request into allWords. " +
      "Split it into the separate fields as described above.";
    fields = cleanFields(await askGemini(apiKey, retry, FIELDS_SCHEMA));
  }

  if (!fields.allWords && !fields.exactPhrase) {
    throw new Error("Gemini didn't fill in any search words. Try rephrasing your request.");
  }
  return fields;
}
