# Web Guide: How VELM Searcher Works

The concepts behind the site (sections 0–4) and how the finished site uses them (sections 5–8). Code examples marked **tested** were run in Chrome; sections 0–4 date from Oct 9, sections 5–8 describe the code as of Oct 20, 2026.

Contents:

0. How a website works
1. HTML: the structure
2. CSS: the look
3. JavaScript: the behaviour
4. APIs: talking to other servers
5. The features, and where each concept lives
6. Decisions made, and why
7. Data contracts: the shapes that cross between files
8. Working on the project now
9. Glossary and where to look things up

---

## 0. How a website works

A website is **three languages in three kinds of files**, all read by the browser:

| Language | Job | Java/Swing equivalent |
| --- | --- | --- |
| **HTML** (`HTML.html`) | *What* is on the page: a search box, buttons, a grid of tiles | Creating `JPanel`, `JButton`, `JTextField` and adding them to each other |
| **CSS** (`resource-search.css`, `animations.css`) | *How it looks*: colours, sizes, spacing, layout, animations | Your `Theme.java` in CipherTranslate, plus layout managers |
| **JavaScript** (`js/*.js`) | *What it does*: react to clicks, save data, fetch from the internet | `ActionListener`s and all your logic classes |

How they connect (in `HTML.html`):

```html
<link rel="stylesheet" href="resource-search.css">   <!-- pulls in the styles -->
<link rel="stylesheet" href="animations.css">        <!-- and the motion -->
<script type="module" src="js/app.js"></script>     <!-- pulls in the JS (it imports the rest) -->
```

What happens when you open the page:

1. The browser reads the HTML top to bottom and builds a **tree of elements** called the **DOM** (Document Object Model). It is exactly like a Swing component tree: a `<main>` contains a `<form>`, which contains an `<input>`.
2. It applies the CSS rules to every element in that tree.
3. It runs the JavaScript, which can **read and change the DOM at any time**. Adding a tile, hiding a panel and changing text all happen by changing the DOM.

**There is no compile step.** You save, and Live Preview reloads. Errors show up only when that line runs, so you will live in **DevTools** (press **F12** in the browser):

- **Elements** tab: the live DOM tree. Click an element to see which CSS rules apply. You can edit CSS there to experiment, but those edits vanish on reload.
- **Console** tab: errors appear here in red, and `console.log(x)` prints here (it is the `System.out.println` of the web). You can also type JS directly into it to test things.
- **Network** tab: every file and API request the page made, with status codes. This is where you debug APIs.

---

## 1. HTML: the structure

### 1.1 Elements, tags, attributes

```html
<a href="https://anilist.co" class="tile">AniList</a>
```

- `<a>` … `</a>`: an **element** with opening and closing **tags**. `a` means link.
- `href="..."` and `class="..."`: **attributes**, the element's settings.
- `AniList`: the **content** between the tags.

Some elements have no content and no closing tag: `<img src="icon.png" alt="">` and `<input type="text">`.

Elements **nest**, and nesting *is* the structure. Indent to show it:

```html
<main>
  <form id="search-form">
    <input id="query" type="text">
    <button type="submit">Search</button>
  </form>
</main>
```

### 1.2 `id` vs `class`

| | `id="query"` | `class="tile"` |
| --- | --- | --- |
| How many | **One** element per page | **Many** elements can share it |
| Used for | JS grabbing *one specific* element | CSS styling *a kind* of element |
| Selector | `#query` | `.tile` |

Java analogy: an `id` is a variable name for one object, and a `class` is like a type that many objects share.

### 1.3 The elements your project needs

| Element | What it is | Where you'll use it |
| --- | --- | --- |
| `<header>`, `<main>`, `<section>`, `<footer>` | Big page regions (they mean something to screen readers, unlike a plain `<div>`) | Page layout |
| `<div>` | A generic box with no meaning; use it only when nothing else fits | Wrappers for layout |
| `<form>` + `<input>` + `<button type="submit">` | A form: pressing **Enter** or clicking the button "submits" it | The search bars, the key fields, the bookmark form |
| `<input type="checkbox">` inside `<label>` | A toggle. Wrapping it in `<label>` makes the text clickable too | The demo switches (`?demo`) |
| `<a href="...">` | A link | Bookmarks, result links |
| `<img src="..." alt="...">` | An image. `alt` is the text read aloud if the image can't be seen; use `alt=""` for decoration | Bookmark icons, preview images |
| `<dialog>` | A built-in popup window, opened from JS with `.showModal()` and closed with `.close()` | The "Add bookmark" popup |
| `<ul>` / `<li>` | A list and its items | Bookmarks, Recent |
| `<details>` / `<summary>` | A click-to-expand box, no JS needed | Not used in VELM Searcher yet |
| `<template>` | Invisible HTML you can copy from JS. Optional, for repeated cards | Not used; the JS builds cards with `createElement` |

### 1.4 Forms in one paragraph

A `<form>` "submits" when the user presses Enter in a field or clicks a `type="submit"` button. By default the browser then **reloads the page**. Your JS stops that with `event.preventDefault()` (section 3.5) and does its own thing. `required` on an input makes the browser refuse to submit while it is empty. `type="url"` makes it check that the text looks like a web address.

---

## 2. CSS: the look

### 2.1 A rule

```css
.tile {                       /* selector: which elements */
  background: var(--panel);   /* property: value; */
  border-radius: 12px;
}
```

The selectors you need:

| Selector | Matches |
| --- | --- |
| `button` | every `<button>` |
| `.tile` | every element with `class="tile"` |
| `#query` | the one element with `id="query"` |
| `.tile img` | every `<img>` *inside* a `.tile` |
| `.tile:hover` | a tile while the mouse is over it |
| `input:focus` | the field the cursor is in |

**When two rules disagree:** `#id` beats `.class`, which beats the element name. Between equal ones, the rule written **later** wins. If a style "doesn't work", the Elements tab shows it crossed out and tells you which rule beat it.

### 2.2 The box model

Every element is a box made of four layers, from the inside out: **content → padding → border → margin**.

- `padding`: space *inside* the border (between the text and the edge).
- `margin`: space *outside* the border (between this box and its neighbours).
- `box-sizing: border-box` (already in `resource-search.css`) makes `width` include padding and border. Without it, the sizes don't add up the way you'd expect.

### 2.3 Layout: Flexbox and Grid (the two you need)

**Flexbox** puts things in **one row or one column**. Think `BoxLayout` or `FlowLayout`. Use it for the search bar and the row of filter chips:

```css
.filters { display: flex; gap: 8px; flex-wrap: wrap; }
```

**Grid** puts things in **rows and columns**. Think `GridLayout`, but smarter. Use it for the shortcut tiles and the results columns:

```css
#shortcuts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 12px;
}
```

That one line, `repeat(auto-fill, minmax(96px, 1fr))`, means "fit as many columns of at least 96px as the screen allows, and share the leftover space evenly". The grid then works on phones and wide screens with no extra code.

Centring something: on its parent, `display: flex; align-items: center; justify-content: center;`.

### 2.4 Variables, states and motion

```css
:root { --bg: #14161c; --panel: #1e2129; --text: #e8e8ec; --accent: #7c9cff; }
body  { background: var(--bg); color: var(--text); }

.tile { transition: transform 0.15s; }
.tile:hover { transform: translateY(-3px); outline: 2px solid var(--accent); }
```

- `--name` variables live in `:root`, and `var(--name)` uses them. Change the theme in one place.
- `:hover` plus `transition` gives the "tile lifts when you point at it" effect. **Tested:** this exact CSS produced the lifted, outlined tiles.

### 2.5 Units and screen sizes

- `px` for borders and small fixed things; `rem` for text (1rem = the browser's base font size); `%` and `fr` for "a share of the space".
- To change the layout on small screens:

```css
@media (max-width: 600px) {
  .results { grid-template-columns: 1fr; }   /* one column on phones */
}
```

---

## 3. JavaScript: the behaviour

### 3.1 Java → JavaScript cheat sheet

| Java | JavaScript | Note |
| --- | --- | --- |
| `int x = 5; String s = "hi";` | `let x = 5; const s = "hi";` | No types. Use `const` unless you will reassign; `let` if you will |
| `final` | `const` | |
| `ArrayList<String>` | `[]` (array) | `list.push(x)`, `list.length`, `list[0]` |
| `HashMap` / a small class | `{ name: "AniList", url: "..." }` (object) | Read with `obj.name` |
| `public static int add(int a, int b)` | `function add(a, b) { ... }` | |
| lambda `(a) -> a * 2` | arrow `(a) => a * 2` | |
| `for (String s : list)` | `for (const s of list)` | |
| `"Hi " + name` | `` `Hi ${name}` `` | Backtick strings can hold `${expressions}` |
| `==` / `.equals` | `===` | **Always use `===`**, never `==` (it converts types in surprising ways) |
| `null` | `null` **and** `undefined` | `undefined` = "never set" |
| `System.out.println` | `console.log` | Shows in DevTools → Console |
| `try/catch` | `try/catch` | Same idea |
| `import` | `import { x } from "./file.js"` | Only works for things marked `export` (section 3.9) |

Array methods you'll use constantly (like Java streams):

```js
filters.filter((f) => f.enabled)      // keep only matching items
       .map((f) => f.addToQuery);     // turn each item into something else
```

### 3.2 Getting elements: the DOM

```js
const form  = document.querySelector("#search-form");   // first match of a CSS selector
const tiles = document.querySelectorAll(".tile");        // all matches
```

`querySelector` takes the **same selectors as CSS**. Once you have an element, you can change it:

| Code | Effect |
| --- | --- |
| `el.textContent = "Hello"` | Replace its text |
| `el.classList.add("hidden")` / `.remove()` / `.toggle()` | Add or remove a CSS class, which is how JS changes looks |
| `el.hidden = true` | Hide it |
| `input.value` | What the user typed |
| `checkbox.checked` | `true` or `false` |
| `document.createElement("a")` | Make a new element (not on the page yet) |
| `parent.append(child)` | Put it on the page |
| `parent.replaceChildren()` | Remove everything inside the parent |

### 3.3 Safety rule: `textContent`, not `innerHTML`

`innerHTML` treats text as **HTML code**. If a user names a shortcut `<img src=x onerror=...>`, `innerHTML` would *run* it. That is a real attack called **XSS**. `textContent` always shows text as plain text.

**Tested:** a shortcut named `<b>Steam</b>` displayed as the literal text `<b>Steam</b>` (no bold tag was created), because the example uses `textContent`. **Rule for the team: any text that came from a user or an API goes in with `textContent`.**

### 3.4 Events: the ActionListener of the web

```js
const form = document.querySelector("#search-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();                 // stop the page reload
  const text = document.querySelector("#query").value;
  console.log("User searched for:", text);
});
```

Events you'll need: `"submit"` (forms), `"click"` (buttons), `"change"` (checkboxes), `"input"` (every keystroke in a field), `"mouseenter"` / `"mouseleave"` (hover, for previews), `"keydown"` (keyboard shortcuts).

### 3.5 The most important pattern: state → render

Don't edit the page piece by piece. Keep the **data** in an array, write **one function that draws the page from the data**, and call it again after every change. It's the same idea as model/view in Swing.

```
user clicks "Add"  →  change the array  →  save it  →  render(array)
```

The tested shortcut renderer:

```js
function faviconUrl(siteUrl) {
  const domain = new URL(siteUrl).hostname;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function renderShortcuts(list) {
  const grid = document.querySelector("#shortcuts");
  grid.replaceChildren();                    // wipe the old tiles
  for (const s of list) {
    const link = document.createElement("a");
    link.href = s.url;
    link.className = "tile";
    const icon = document.createElement("img");
    icon.src = faviconUrl(s.url);
    icon.alt = "";
    const name = document.createElement("span");
    name.textContent = s.name;               // safe (3.3)
    link.append(icon, name);
    grid.append(link);
  }
}
```

**Tested:** for AniList and Steam, both icons loaded at 64×64 px.

### 3.6 Remembering things: `localStorage`

`localStorage` is a small key → text store **inside the user's browser**. It survives reloads and restarts, but it lives on **that one browser on that one computer**: shortcuts added on your laptop won't appear on a teammate's. It stores **text only**, so convert arrays with JSON:

```js
function saveShortcuts(list) {
  localStorage.setItem("shortcuts", JSON.stringify(list));   // array → text
}
function loadShortcuts() {
  const saved = localStorage.getItem("shortcuts");
  return saved ? JSON.parse(saved) : [];                     // text → array, or empty
}
```

**Tested:** saving two shortcuts and loading them back returned the same two objects. To see or clear the stored data: DevTools → **Application** tab → **Local Storage**.

### 3.7 Working with URLs

```js
new URL("https://anilist.co").hostname     // "anilist.co"
new URL("anilist.co")                      // ERROR, tested: "TypeError: Failed to construct 'URL': Invalid URL"
```

Users will type `anilist.co` without `https://`, so add it yourself:

```js
function normalizeUrl(typed) {
  const withScheme = typed.startsWith("http") ? typed : "https://" + typed;
  return new URL(withScheme).href;          // still throws if it's garbage → catch it, show an error
}
// tested: normalizeUrl("anilist.co") → "https://anilist.co/"
```

To put user text **inside** a URL, always use `encodeURIComponent`. Spaces, quotes, `&` and `:` would otherwise break the URL.

### 3.8 Waiting for the internet: `async` / `await`

Network requests take time. JS doesn't freeze while it waits: `fetch` returns a **Promise** (a "result that arrives later"), and `await` pauses *only that function* until the result arrives. Any function that uses `await` must be marked `async`. Java comparison: like a `SwingWorker`, but with much less ceremony.

```js
async function getPreview(siteUrl) {
  const response = await fetch("https://api.microlink.io/?url=" + encodeURIComponent(siteUrl));
  if (!response.ok) throw new Error("Preview failed: " + response.status);
  const json = await response.json();       // text → JS object
  return { title: json.data.title, description: json.data.description, image: json.data.image?.url };
}
```

`?.` means "if `image` is missing, give `undefined` instead of crashing".

**Tested** for `https://anilist.co`, it returned: title "AniList: Track, Discover, Share Anime & Manga", the site's description, and a 512 px logo image.

Every network call needs **three states** in the UI: *loading* (a spinner or "Searching…"), *success* (show the data), *error* (a friendly message, wrapped in `try/catch`). Plan all three for each feature.

### 3.9 Modules: one file per person

Your project uses `type="module"`. Each file shares only what it `export`s:

```js
// shortcuts.js
export function renderShortcuts(list) { ... }

// app.js
import { renderShortcuts } from "./shortcuts.js";
```

This is why people can work on separate files at the same time. Two catches:

- Module pages **must run through a server** (Live Preview or GitHub Pages), not a double-clicked file.
- Inside a module, nothing is global. To test a function from the Console, temporarily write `window.myFn = myFn;`.

---

## 4. APIs: talking to other servers

### 4.1 What an API is

An **API** is a web address that returns **data (usually JSON) instead of a page**. Your JS sends an **HTTP request** and gets back a **response**.

| Part | Meaning | Example |
| --- | --- | --- |
| URL | Where to send it | `https://graphql.anilist.co` |
| Method | `GET` = read (default), `POST` = send data with the request | |
| Headers | Labels on the request | `Content-Type: application/json` |
| Body | The data you send (`POST` only) | A JSON object |
| Status code | Did it work? | `200` OK · `400` you sent something wrong · `401/403` key missing or not allowed · `404` not found · `429` **too many requests** · `500` their server broke |

**JSON** is plain text that looks like a JS object: `{"title": "Frieren", "tags": ["fantasy"]}`. `JSON.stringify` turns an object into that text, and `response.json()` / `JSON.parse` turn it back.

### 4.2 A POST request (tested)

```js
async function searchAniList(title) {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "query ($t: String) { Media(search: $t, type: ANIME) { title { english } } }",
      variables: { t: title },
    }),
  });
  const json = await response.json();
  return json.data.Media.title.english;
}
// tested: searchAniList("Frieren") → "Frieren: Beyond Journey's End"
```

Every API call you write has this shape. Only the URL, method and body change.

### 4.3 CORS: why some APIs "don't work" from the browser

Browsers block a page from reading responses from another website **unless that website allows it**, with a header called `Access-Control-Allow-Origin`. If it doesn't, the Console shows a red **CORS error**. That isn't a bug in your code; it's that API's policy.

Allowed with `*` (meaning anyone), tested Oct 6–9: **AniList, CheapShark, FreeToGame, GamerPower, Microlink**. These can be called straight from your JS. Gemini and Tavily also allow it, which is why VELM Searcher needs no server.

### 4.4 Rate limits

Free APIs cap how often you can call them (AniList: 30 requests a minute right now). Going over gives status **429**. Protect yourself:

- Don't call an API on every keystroke. Call it on submit, or after the user stops typing.
- **Cache**: keep results you already fetched in an object (or `localStorage`), and reuse them.

### 4.5 API keys and why they can't go in your JS

AI and search APIs (Gemini, Tavily) need a **secret key**. **Anything in your JS files is public:** anyone can press F12 and read it, and bots scan GitHub for keys within minutes. There are two safe ways:

| Way | How | Trade-off |
| --- | --- | --- |
| **Key typed into the page** (what VELM Searcher does) | Each person pastes their own free key; JS saves it in `localStorage` and sends it with each request | No server needed. But everyone needs their own key, and anyone at that browser could read it in DevTools, so use free keys and press Remove on shared computers |
| **A proxy server** (e.g. a Cloudflare Worker) | Your page calls your tiny server, which adds the key and forwards the request | Visitors need nothing, but it's one more thing to build and run |

In `js/keys.js`, the key fields are `type="password"` and are cleared after Save, so a key never stays on screen. The key travels in a request **header** (`x-goog-api-key`, `Authorization: Bearer …`), never in the address.

### 4.6 Getting structured answers from an AI

If you ask an AI a question normally, you get a paragraph back. The site needs **data**, so each request includes a **JSON schema**: a description of the exact shape wanted. Gemini's Interactions API takes it as `response_format`:

```js
body: JSON.stringify({
  model: "gemini-3.8-flash",
  input: prompt,
  store: false,                       // don't keep our searches on Google's servers
  response_format: { type: "text", mime_type: "application/json", schema },
}),
```

The reply is JSON text inside `steps[].content[].text`; `js/ai.js` reads it with `readOutputText`, then `JSON.parse`. **Never trust it blindly:** an AI's answer is outside input, like user input, so `cleanFields` and `groupResults` check every value before use.

---

## 5. The features, and where each concept lives

### 5.1 The search switch: two AI modes

The **AI search mode** buttons (`js/mode.js`) pick how the Text tab searches. There's no plain, non-AI search: without a working key, a search shows an error (unless demo mode is on, 5.5).

**Mode 1, AI advanced search** (`js/search.js`):
1. `buildFieldsPrompt` gives Gemini one rule per Google Advanced Search field, with examples, plus your Price/Type rules.
2. Gemini answers with 8 fields: `allWords`, `exactPhrase`, `noneOfWords`, `site`, `fileType`, `lastUpdate`, `language`, `region`.
3. `cleanFields` keeps only values Google's form accepts (codes read from google.com/advanced_search). `isCopyPaste` catches an answer that just repeated your sentence, and Gemini is asked once more.
4. `buildGoogleUrl` builds the same address Google's form would open (`as_q`, `as_epq`, `as_eq`, `as_sitesearch`, `as_filetype`, `as_qdr`, `lr`, `cr`), and the new tab goes there.
5. The "AI filled" line under the search box (`describeFields`) lists all 8 fields, so you can see every choice.

Two things learned by testing: **Google's own search box shows only 5 of the fields** (as operators like `"free" -reddit site:github.com filetype:pdf`; language and time sit under Tools, and region isn't shown anywhere). And **filling all 8 at once found nothing**, so Gemini fills only what the request supports.

**Mode 2, AI finds & organizes** (`js/tavily.js`, `js/organize.js`):
1. `buildWebQuery` adds filter words to your text, and `searchWeb` asks Tavily for 15 real pages.
2. `buildSortPrompt` numbers them `[0]`…`[14]`. Gemini answers with `{ index, type, price, reason }` for each page worth showing. It answers with **numbers, never addresses**, so every link shown is a real search hit.
3. `groupResults` joins the picks to the real pages, skips bad numbers and repeats, keeps at most 10, and groups them in your Type order.
4. `renderResults` replaces the sample cards in `#results` with headings and cards (the front end's existing CSS classes), with a Free or Paid badge only when the price is known.

### 5.2 The Price and Type buttons as AI rules

`js/filters.js` keeps the choice in `filterState` (saved in `localStorage`). `describeConstraints` turns it into sentences such as "Only free resources." that go into both prompts. The buttons carry `data-value`, so their visible labels can change freely.

### 5.3 Bookmarks (the shortcuts)

`js/bookmarks.js` is the state → save → render pattern from 3.5: an array of `{ name, url, preview? }`, saved, then redrawn. Icons come from Google's favicon service (just an image address, no API call). `normalizeUrl` adds `https://` and rejects things that aren't web addresses; the browser accepts `my site.com` as an address, so a regular expression checks the domain too.

### 5.4 Previews

Most big sites refuse to be shown inside an iframe (tested, see the table), so previews are **cards**: title, description and image from the Microlink API (`js/preview.js`). Each is fetched once and cached; temporary failures (like 429) aren't cached. The Link tab shows a preview with "Save to bookmarks"; bookmarks show theirs on hover.

| Site | Can be shown in an iframe? (tested Oct 9) |
| --- | --- |
| Google, YouTube, AniList | No (`X-Frame-Options: SAMEORIGIN`) |
| Steam, GitHub | No (`DENY` / `frame-ancestors 'none'`) |
| Wikipedia, Crunchyroll | Yes |

### 5.5 Demo mode

`js/demo.js` is active only with `?demo` in the address. When Gemini fails (or "Skip Gemini completely" is ticked), each mode still answers after a pretend wait of 1–3.5 s (`fakeDelay`), always labelled as not live AI:
- **Mode 1:** a saved real answer for the same search, else `ruleFields` (keyword rules: "no reddit" → none of these words, "pdf" → file type, "latest" → past year…).
- **Mode 2:** a saved real result, else prepared examples for "free anime editing software" and "learn JavaScript for beginners" (real sites, checked Oct 20), else real Tavily results sorted by `guessType`, else a message saying so.

### 5.6 When things go wrong

Every network call has three states: loading (the status line), success, and a specific error. `geminiErrorMessage` and `tavilyErrorMessage` turn status codes into sentences (wrong key, daily limit used up, server trouble). On a Gemini server error (5xx), `askGemini` waits 1.5 s and retries once without the strict schema, because some of those errors are caused by the schema itself.

---

## 6. Decisions made, and why

| Decision | Why |
| --- | --- |
| Gemini **3.8 Flash**, not 2.5 | Google limits 2.5 to accounts that used it before; new keys can't |
| **Tavily** finds the pages in mode 2 | Gemini's built-in Google Search isn't available on the free tier for Gemini 3 |
| Keys typed into the page | No server to build and run; keys are never in the code |
| Mode 1 opens the tab *before* asking Gemini | Browsers block new tabs opened seconds after a click; the tab loads Google once the answer arrives |
| No non-AI fallback | The team's choice; demo mode covers presentations |
| Gemini answers mode 2 with numbers | So it can never invent a link |
| No `maxItems` or empty lists in schemas | Reported causes of Gemini server errors; the JS limits counts instead |
| Demo answers are labelled | Nobody should mistake a demo for live AI |

---

## 7. Data contracts: the shapes that cross between files

```js
// search.js → Google's fields ("" = left empty)
{ allWords, exactPhrase, noneOfWords, site, fileType, lastUpdate, language, region }

// tavily.js → one web page
{ title, url, content }

// Gemini's mode 2 answer (organize.js)
{ results: [ { index, type, price, reason } ] }         // price: "free" | "paid" | "unknown"

// organize.js → what renderResults draws
[ { type: "videos", items: [ { title, url, site, price, reason } ] } ]

// filters.js
filterState = { price: "all" | "free" | "paid", type: "all" | "articles" | … }

// bookmarks.js and recent.js
{ name, url, preview?: { title, description, image } }
{ label, url }   or   { label, query }                  // query = a mode 2 search to run again
```

Functions other files call: `askGemini(apiKey, prompt, schema)`, `fillAdvancedFields(apiKey, text, filters)`, `buildGoogleUrl(fields)`, `searchWeb(apiKey, query, maxResults)`, `findAndOrganize(keys, text, filters)`, `renderResults(container, text, groups)`, `getPreview(url)`, `addBookmark(name, url)`, `addRecent(label, url)`, `addRecentSearch(label, query)`.

Saved in `localStorage`: `filters`, `searchMode`, `geminiKey`, `tavilyKey`, `bookmarks`, `previews`, `recent`, and with `?demo` also `demoSearches`, `demoResults`, `demoReplay`, `demoSkipAi`. See them in DevTools → Application → Local Storage.

---

## 8. Working on the project now

- **Run:** `HTML.html` with Live Preview, opened in Chrome; Ctrl + Shift + R after updates.
- **Test:** open `tests.html` the same way; it should say **49 passed, 0 failed**. Run it again after changing a pure function (`buildGoogleUrl`, `cleanFields`, `groupResults`, `ruleFields`…).
- **Change the look:** edit `resource-search.css` or `animations.css`, keeping the hooks listed in `README.md`.
- **Change what the AI does:** the prompts are `buildFieldsPrompt` (search.js) and `buildSortPrompt` (organize.js).
- **Debug:** DevTools → Console shows errors, including Gemini's full error reply; Network shows each request to `interactions` and `api.tavily.com`. Never copy or share request headers: they contain your key.
- **Explore:** `app.js` puts a few functions on `searcher` for the Console. Predict, then run `searcher.buildGoogleUrl({ allWords: "cats", exactPhrase: "", noneOfWords: "", site: "", fileType: "pdf", lastUpdate: "", language: "", region: "" })`.
- **Present without a key, or as a backup:** add `?demo` (5.5).

---

## 9. Glossary and where to look things up

| Word | Meaning |
| --- | --- |
| DOM | The live tree of elements the browser builds from your HTML; JS changes it |
| Element / attribute | `<a href="x">text</a>` is an element; `href` is one of its attributes |
| Selector | The "which elements" part of a CSS rule, also used by `querySelector` |
| Event / listener | Something happening (a click) / the function that reacts to it |
| State / render | The data / the function that draws the page from the data |
| JSON / JSON schema | A text format for data / a description of the exact JSON shape you want back |
| API / endpoint | A service your code talks to through URLs / one specific URL of it |
| Promise / async / await | A value that arrives later / a function that can wait / the waiting |
| CORS | The browser rule that an API must allow your site to read its answers |
| 429 / 5xx | "Too many requests" / "the server broke" |
| Hook | An `id` or `data-` attribute in the HTML that the JS depends on |
| Pure function | Takes values, returns values, doesn't touch the page, so it's easy to test |
| XSS | An attack where outside text gets run as code; prevented by using `textContent` |
| localStorage | Small, permanent, per-browser storage for text |

**Where to look things up:** [MDN Web Docs](https://developer.mozilla.org/) covers everything in HTML, CSS and JS; search "mdn" plus the thing, e.g. "mdn flexbox" or "mdn fetch". MDN's [Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development) course is the best free beginner path. For the APIs: [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output) and [Tavily search](https://docs.tavily.com/documentation/api-reference/endpoint/search).

