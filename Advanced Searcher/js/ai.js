// ai.js: one function that asks Gemini a question and gets JSON back.
// Uses Google's Interactions API (POST /v1beta/interactions), the format Google's own
// docs show for gemini-3.8-flash. The key travels in a header, never in the address.

export const GEMINI_MODEL = "gemini-3.8-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

/**
 * Sends a prompt and a JSON schema; returns Gemini's answer as a JS object.
 * Throws an Error whose message can be shown to the user as is.
 * @param {string} apiKey
 * @param {string} prompt
 * @param {object} schema the JSON shape Gemini must answer in
 */
export async function askGemini(apiKey, prompt, schema) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        input: prompt,
        store: false, // don't keep our searches on Google's servers
        response_format: { type: "text", mime_type: "application/json", schema },
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    throw new Error(networkMessage("Gemini", error));
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(geminiErrorMessage(response.status, body));

  if (body?.status === "incomplete") throw new Error("Gemini's answer was cut off. Try a shorter request.");
  if (body?.status && body.status !== "completed") throw new Error("Gemini couldn't finish (status: " + body.status + ").");

  const text = readOutputText(body);
  if (!text) throw new Error("Gemini sent an empty answer. Try again.");
  return parseJsonAnswer(text);
}

/**
 * Collects the text of every "model_output" step. Thought steps are skipped.
 * Pure: tests.html checks it with an example from Google's docs.
 * @param {any} body the parsed reply
 */
export function readOutputText(body) {
  const parts = [];
  for (const step of body?.steps ?? []) {
    if (step.type !== "model_output") continue;
    for (const item of step.content ?? []) {
      if (item.type === "text" && typeof item.text === "string") parts.push(item.text);
    }
  }
  return parts.join("").trim();
}

/**
 * Turns Gemini's text into an object. Also accepts ```json fences, just in case.
 * @param {string} text
 */
export function parseJsonAnswer(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini's answer wasn't in the expected format. Try again.");
  }
}

/**
 * A readable message for a failed reply. Pure.
 * Tested on Oct 14: this endpoint wraps its error in a list ([{ error: ... }]).
 * @param {number} status HTTP status code
 * @param {any} body the parsed reply, or null
 */
export function geminiErrorMessage(status, body) {
  const error = (Array.isArray(body) ? body[0]?.error : body?.error) ?? {};
  const reason = (error.details ?? []).map((detail) => detail.reason).find(Boolean);

  if (reason === "API_KEY_INVALID") return "Your Gemini key isn't valid. Check it in the AI section.";
  if (status === 403) return "Gemini refused this key. Check that it's a Gemini API key from Google AI Studio.";
  if (status === 429) return "Gemini's free limit is used up for now. Wait a minute and try again.";
  if (status === 404) return "Gemini model " + GEMINI_MODEL + " isn't available for this key.";
  if (status >= 500) return "Gemini is having trouble right now. Try again in a moment.";
  return "Gemini rejected the request" + (error.message ? ": " + error.message : ".");
}

/**
 * @param {string} service "Gemini" or "Tavily"
 * @param {any} error what fetch threw
 */
export function networkMessage(service, error) {
  if (error?.name === "TimeoutError") return service + " took too long to answer. Try again.";
  if (!navigator.onLine) return "No internet connection.";
  return "Couldn't reach " + service + ". Check your internet connection.";
}
