# VELM Searcher

An AI-powered search categorizer: pick a preset, type a request, and see results sorted into categories like Free / Subscription.

## Who owns which file

| File | Owner |
| --- | --- |
| `index.html`, `styles.css` | Eric |
| `js/presets.js` (presets + prompt) | ________ | - ask in Instagramm
| `js/fetchers.js` (free APIs) | ________ | - ask in Instagramm
| `js/board.js` (results board) | ________ | - ask in Instagramm

## Run it

The current site is **`HTML.html`**. Right-click it → **Show Preview** (Live Preview extension). Opening the file by double-click won't work, because the JS files are modules.

`tests.html` runs the automated checks for the search and address functions: open it the same way and look for "0 failed".

(`index.html`, `styles.css`, `js/main.js`, `presets.js`, `fetchers.js` and `board.js` are the old starter and are not used by `HTML.html`.)

## For front-end work: hooks the JavaScript needs

Restyle and rearrange freely, but keep these, or tell whoever owns the JS:

| Hook in `HTML.html` | Used by |
| --- | --- |
| `id`s: `text-form`, `text-search`, `link-form`, `link-search`, `link-preview`, `search-status` | `js/app.js` (searching) |
| `data-filter="price"` / `data-filter="type"` on the option groups, `data-value="..."` on each button | `js/filters.js` (button *labels* can change; `data-value`s can't) |
| `id`s: `ai-toggle`, `ai-help`, `selection-summary` | `js/app.js`, `js/ai.js` |
| `id`s: `bookmark-list`, `bookmark-empty`, `add-bookmark`, `bookmark-dialog`, `bookmark-form`, `bookmark-name`, `bookmark-url`, `bookmark-error`, `bookmark-cancel`, `preview-card` | `js/bookmarks.js`, `js/app.js` |
| `id`s: `recent-list`, `recent-empty` | `js/recent.js` |
| Class `selected` on option buttons | Added and removed by JS; style it however you like |

The JS creates these classes, so they're yours to style: `.bookmark`, `.remove-button`, `.preview-actions`, and the contents of `.link-preview` / `.preview-card` (an `img`, a `strong` title, a `p` description).

## Daily loop

1. **Sync** first (pull the latest changes).
2. Work in your own file.
3. **Commit** with a short message, then **Sync** again to push.

Never commit an API key.
