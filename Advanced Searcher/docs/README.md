# VELM Searcher

A search start page with two AI search modes, chosen with a switch:

1. **AI advanced search:** Gemini reads your request (however messy), fills in the fields of Google's Advanced Search (all these words, exact phrase, none of these words, site, file type, last update, language, region), shows what it filled, and opens Google in a new tab.
2. **AI finds & organizes:** Tavily searches the web, Gemini sorts the best pages under type headings (Articles, Videos, Courses, Tools…) with Free/Paid badges, and the results appear right under the search bar.

Both modes follow the **Price** and **Type** buttons. The page also has bookmarks with icons and hover previews, a link preview (Link tab), and Recent views. Everything is saved only in the browser.

## Run it

1. Open `HTML.html` with **Live Preview** (right-click → Show Preview), then open the address it shows **in Chrome**. Double-clicking the file won't work, because the JS files are modules.
2. In the AI section, paste a **Gemini key** ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) and, for mode 2, a **Tavily key** ([app.tavily.com](https://app.tavily.com/)) and press **Save**. Both are free. Keys stay in that browser only and are never in the code.
3. Pick a mode and search.

After an update, reload with **Ctrl + Shift + R**, or the browser may keep running the old JS.

## Demo mode, for presentations

Add `?demo` to the address (`…/HTML.html?demo`). Two switches appear in the AI section:

| Switch | What it does |
| --- | --- |
| Use demo answers if Gemini fails (on) | Tries the real AI first; a failure shows a demo answer instead of an error |
| Skip Gemini completely | Never contacts Gemini; demo answers only |

Demo answers wait 1–3.5 s like a real search and are always labelled as not live AI. Where they come from: a saved real answer for the same search (saved automatically while `?demo` is on) → keyword rules (mode 1) / prepared examples for "free anime editing software" and "learn JavaScript for beginners" (mode 2) → real Tavily results sorted by simple rules.

## Files

| File | What it does | Made by |
| --- | --- | --- |
| `HTML.html` | The page: structure and every hook the JS uses | Front end (GitHub: Yana20091011), hooks added by the JS side |
| `resource-search.css` | All styling | Front end (GitHub: Yana20091011) |
| `animations.css` | Motion: entrance, hovers, pop on select, dialog fade | GitHub: misty |
| `js/app.js` | Entry point: connects the page to the modules | JS side (ruvad + Claude) |
| `js/filters.js` · `mode.js` · `keys.js` | Price/Type buttons · the mode switch · the key fields | JS side |
| `js/ai.js` · `search.js` | Gemini requests · mode 1 (Google Advanced Search fields) | JS side |
| `js/tavily.js` · `organize.js` | Web search · mode 2 (sorting and result cards) | JS side |
| `js/demo.js` | Demo mode | JS side |
| `js/recent.js` · `bookmarks.js` · `preview.js` · `storage.js` | Recent views · bookmarks · link previews · saving in the browser | JS side |
| `tests.html` | 49 automated checks; open it like the page and look for "0 failed" | JS side |

## For front-end work: hooks the JavaScript needs

Restyle and rearrange freely, but keep these `id`s and attributes, or tell the JS side.

| Hook in `HTML.html` | Used by |
| --- | --- |
| `text-form`, `text-search`, `type-text`, `search-status`, `ai-filled` | app.js (search) |
| `data-filter="price"` / `data-filter="type"` on the option groups, `data-value="…"` on each button, `selection-summary` | filters.js, app.js (labels can change; `data-value`s can't) |
| `mode-options` (buttons with `data-value="advanced"` / `"organize"`), `mode-help` | mode.js |
| `key-form`, `gemini-key`, `tavily-key`, `key-remove`, `key-status` | keys.js |
| `ai-group` | demo.js (adds the demo switches) |
| `results` | organize.js (replaces its contents with result cards) |
| `link-form`, `link-search`, `link-preview` | app.js, preview.js |
| `bookmark-list`, `bookmark-empty`, `add-bookmark`, `bookmark-dialog`, `bookmark-form`, `bookmark-name`, `bookmark-url`, `bookmark-error`, `bookmark-cancel`, `preview-card` | bookmarks.js, app.js |
| `recent-list`, `recent-empty` | recent.js |

Classes the JS adds, yours to style: `selected` (chosen button), `resource-card`, `resource-type`, `resources`, `section-heading`, `badge free` / `badge paid`, `result-link` and `result-site` (result cards; not styled yet), `bookmark`, `remove-button`, `preview-actions`, `ai-toggle`, `input-help`.

## Daily loop

1. **Sync** first (pull the latest changes).
2. Work in your own file.
3. **Commit** with a short message, then **Sync** again to push.

Never commit an API key. See `GIT-GUIDE.md` for details and `WEB-GUIDE.md` for how all of this works.
