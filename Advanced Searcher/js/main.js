// main.js: connects the pieces. Each other file has one owner.
import { PRESETS, buildPrompt } from "./presets.js";
import { fetchItems } from "./fetchers.js";
import { renderBoard } from "./board.js";

// Proof that JavaScript runs. Delete once the real UI works.
document.getElementById("status").textContent =
  `JavaScript connected. ${PRESETS.length} presets loaded.`;

document.getElementById("search-form").addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the page from reloading
  const query = document.getElementById("query").value;

  // TODO: use the preset the user picked, not always the first one
  const preset = PRESETS[0];

  const prompt = buildPrompt(preset, query);
  document.getElementById("xray-text").textContent = prompt;

  const items = await fetchItems(preset, query);
  renderBoard(items);
});
