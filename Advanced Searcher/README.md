# Advanced Searcher

An AI-powered search categorizer: pick a preset, type a request, and see results sorted into categories like Free / Subscription.

## Who owns which file

| File | Owner |
| --- | --- |
| `index.html`, `styles.css` | ________ |
| `js/presets.js` (presets + prompt) | ________ |
| `js/fetchers.js` (free APIs) | ________ |
| `js/board.js` (results board) | ________ |

## Run it

Right-click `index.html` → **Show Preview** (Live Preview extension). Opening the file by double-click won't work, because the JS files are modules.

## Daily loop

1. **Sync** first (pull the latest changes).
2. Work in your own file.
3. **Commit** with a short message, then **Sync** again to push.

Never commit an API key.
