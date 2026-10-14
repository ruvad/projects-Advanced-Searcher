// tavily.js: finds real web pages for mode 2 (Tavily search API, 1,000 free searches a month).
import { networkMessage } from "./ai.js";

const ENDPOINT = "https://api.tavily.com/search";

/**
 * @typedef {{ title: string, url: string, content: string }} WebResult
 */

/**
 * @param {string} apiKey
 * @param {string} query
 * @param {number} maxResults Tavily allows up to 20
 * @returns {Promise<WebResult[]>}
 */
export async function searchWeb(apiKey, query, maxResults) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({ query, max_results: maxResults, search_depth: "basic" }), // basic = 1 credit
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    throw new Error(networkMessage("Tavily", error));
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(tavilyErrorMessage(response.status));

  const results = Array.isArray(body?.results) ? body.results : [];
  return results
    .filter((result) => typeof result.url === "string" && /^https?:\/\//.test(result.url))
    .map((result) => ({
      title: String(result.title ?? "").trim() || result.url,
      url: result.url,
      content: String(result.content ?? "").trim(),
    }));
}

/**
 * A readable message for Tavily's error codes (from Tavily's API reference). Pure.
 * @param {number} status
 */
export function tavilyErrorMessage(status) {
  if (status === 401) return "Your Tavily key isn't valid. Check it in the AI section.";
  if (status === 429) return "Too many searches at once. Wait a moment and try again.";
  if (status === 432 || status === 433) return "Your Tavily search limit is used up for this month.";
  if (status >= 500) return "Tavily is having trouble right now. Try again in a moment.";
  return "Tavily rejected the search (error " + status + ").";
}
