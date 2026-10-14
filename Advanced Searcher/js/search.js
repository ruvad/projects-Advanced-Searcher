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

/** The JSON shape Gemini must answer in. "" means "leave this field empty". */
export const FIELDS_SCHEMA = {
  type: "object",
  properties: {
    allWords: { type: "string", description: "All these words. Main search words." },
    exactPhrase: { type: "string", description: "This exact word or phrase, or empty." },
    noneOfWords: { type: "string", description: "None of these words (space-separated), or empty." },
    site: { type: "string", description: "Site or domain such as youtube.com or .edu, or empty." },
    fileType: { type: "string", enum: ["", ...FILE_TYPES] },
    lastUpdate: { type: "string", enum: ["", ...Object.keys(TIME_RANGES)] },
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
    "Fields: allWords (all these words), exactPhrase (this exact word or phrase), noneOfWords (none of these words),",
    "site (site or domain), fileType (" + FILE_TYPES.join(", ") + "),",
    "lastUpdate (h = past hour, d = past 24 hours, w = past week, m = past month, y = past year),",
    "language (a language code) and region (a two-letter country code).",
    "Use an empty string for every field the request doesn't need. Always fill allWords.",
    "Keep the search words in the language the user wrote in.",
    rules.length ? "The results must also follow these rules: " + rules.join(" ") : "",
    "User request: " + text,
  ].filter(Boolean).join("\n");
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
 * For the "AI filled: ..." line under the search box. Pure.
 * @param {Fields} fields
 */
export function describeFields(fields) {
  const parts = [];
  if (fields.allWords) parts.push("all these words: " + fields.allWords);
  if (fields.exactPhrase) parts.push("exact phrase: “" + fields.exactPhrase + "”");
  if (fields.noneOfWords) parts.push("none of these words: " + fields.noneOfWords);
  if (fields.site) parts.push("site: " + fields.site);
  if (fields.fileType) parts.push("file type: " + fields.fileType);
  if (fields.lastUpdate) parts.push("last update: " + TIME_RANGES[fields.lastUpdate]);
  if (fields.language) parts.push("language: " + fields.language);
  if (fields.region) parts.push("region: " + fields.region);
  return parts.join(" · ");
}

/**
 * Mode 1, start to finish (without the page): ask Gemini, clean its answer.
 * @param {string} apiKey
 * @param {string} text
 * @param {{ price: string, type: string }} filters
 * @returns {Promise<Fields>}
 */
export async function fillAdvancedFields(apiKey, text, filters) {
  const fields = cleanFields(await askGemini(apiKey, buildFieldsPrompt(text, filters), FIELDS_SCHEMA));
  if (!fields.allWords && !fields.exactPhrase) {
    throw new Error("Gemini didn't fill in any search words. Try rephrasing your request.");
  }
  return fields;
}
