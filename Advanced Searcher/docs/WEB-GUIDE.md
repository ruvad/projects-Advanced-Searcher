# Web Guide: Everything You Need to Plan Advanced Searcher

Written for the team leader (strong in Java, new to websites). Every code example here was **tested in Chrome on Oct 9, 2026**, and the results are quoted. Examples are *teaching pieces*, not the finished site: each one shows one idea in as few lines as possible.

Contents:

0. How a website works
1. HTML: the structure
2. CSS: the look
3. JavaScript: the behaviour
4. APIs: talking to other servers
5. Your four features, concept by concept
6. Decisions only you can make
7. Data contracts: agree on these before splitting work
8. First steps for the team
9. Glossary and where to look things up

---

## 0. How a website works

A website is **three languages in three kinds of files**, all read by the browser:

| Language | Job | Java/Swing equivalent |
| --- | --- | --- |
| **HTML** (`index.html`) | *What* is on the page: a search box, buttons, a grid of tiles | Creating `JPanel`, `JButton`, `JTextField` and adding them to each other |
| **CSS** (`styles.css`) | *How it looks*: colours, sizes, spacing, layout, animations | Your `Theme.java` in CipherTranslate, plus layout managers |
| **JavaScript** (`js/*.js`) | *What it does*: react to clicks, save data, fetch from the internet | `ActionListener`s and all your logic classes |

How they connect (already set up in your `index.html`):

```html
<link rel="stylesheet" href="styles.css">            <!-- pulls in the CSS -->
<script type="module" src="js/main.js"></script>     <!-- pulls in the JS -->
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
| `<form>` + `<input>` + `<button type="submit">` | A form: pressing **Enter** or clicking the button "submits" it | The search bar, the "add shortcut" form |
| `<input type="checkbox">` inside `<label>` | A toggle. Wrapping it in `<label>` makes the text clickable too | AI filters on/off |
| `<a href="...">` | A link | Shortcut tiles, result links |
| `<img src="..." alt="...">` | An image. `alt` is the text read aloud if the image can't be seen; use `alt=""` for decoration | Shortcut icons |
| `<dialog>` | A built-in popup window, opened from JS with `.showModal()` and closed with `.close()` | "Add shortcut" popup, preview popup |
| `<ul>` / `<li>` | A list and its items | Result lists |
| `<details>` / `<summary>` | A click-to-expand box, no JS needed | Your Prompt X-ray panel already uses it |
| `<template>` | Invisible HTML you can copy from JS. Optional, for repeated cards | Tiles, result cards |

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
- `box-sizing: border-box` (already in your `styles.css`) makes `width` include padding and border. Without it, the sizes don't add up the way you'd expect.

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

// main.js
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

Allowed with `*` (meaning anyone), tested Oct 6–9: **AniList, CheapShark, FreeToGame, GamerPower, Microlink**. These can be called straight from your JS.

### 4.4 Rate limits

Free APIs cap how often you can call them (AniList: 30 requests a minute right now). Going over gives status **429**. Protect yourself:

- Don't call an API on every keystroke. Call it on submit, or after the user stops typing.
- **Cache**: keep results you already fetched in an object (or `localStorage`), and reuse them.

### 4.5 API keys and why they can't go in your JS

AI APIs (Groq, Gemini) need a **secret key**. **Anything in your JS files is public:** anyone can press F12 and read it, and bots scan GitHub for keys within minutes. So:

```
browser (your JS) ──► your Cloudflare Worker (holds the key) ──► Groq / Gemini
```

A **Worker** is a tiny JS program that runs on Cloudflare's servers (free: 100,000 requests a day). Your page sends the request to the Worker's URL **without** a key. The Worker adds the key (stored as a Cloudflare "secret") and forwards the request to the AI. To your page, the Worker is just another API.

### 4.6 Getting structured answers from an AI

If you ask an AI a question normally, you get a paragraph back. Your board needs **data**, so the request includes a **JSON schema**: a description of the exact shape you want, such as "an array of objects, each with `title`, `url`, `category` (one of Free / Freemium / Paid) and `reason`". Groq's "strict" structured outputs (on the gpt-oss models) guarantee the reply matches. Your JS then does `JSON.parse` and renders it like any other API data.

That schema and the prompt are what your **Prompt X-ray** shows.

---

## 5. Your four features, concept by concept

### 5.1 The search bar: three levels, and you choose how far to go

**Fact to plan around:** Google's own search API is **closed to new customers** (Google announced it is moving away from it and shutting it down for existing users on Jan 1, 2027, per [Brave's summary](https://brave.com/learn/google-api-shutdown/)). Google and YouTube result pages also **cannot be shown inside your page**, because they forbid it (tested, see 5.4).

| Level | What happens on "Search" | Needs | Effort |
| --- | --- | --- | --- |
| **1. Plain redirect** | Build a search URL and open it (DuckDuckGo or Google) | Nothing: no key, no API | Tiny |
| **2. AI query builder** | AI turns the request + enabled filters into a sharper query with search operators, then redirects | Worker + AI key | Medium |
| **3. In-page results** | A search API (Tavily: 1,000 free searches a month) returns results, AI sorts them into categories, your board shows them | Worker + search key + AI key | Big |

Level 1, tested:

```js
const filters = [
  { id: "free",     label: "Free only",   enabled: true,  addToQuery: '"free"' },
  { id: "noReddit", label: "Hide Reddit", enabled: false, addToQuery: "-site:reddit.com" },
];

function buildSearchUrl(text) {
  const extras = filters.filter((f) => f.enabled).map((f) => f.addToQuery);
  const fullQuery = [text, ...extras].join(" ");
  return "https://duckduckgo.com/?q=" + encodeURIComponent(fullQuery);
}
// tested: "anime editor" with Free only on      → https://duckduckgo.com/?q=anime%20editor%20%22free%22
//         after ticking Hide Reddit as well     → ...%22free%22%20-site%3Areddit.com
```

`[text, ...extras]` means "a new array: `text`, then every item of `extras`". To open the URL: `window.open(url, "_blank")` (new tab) or `location.href = url` (same tab).

Search operators worth knowing (they work in Google and DuckDuckGo): `"exact phrase"`, `-word` (exclude), `site:anilist.co` (only this site), `-site:reddit.com` (exclude a site), `filetype:pdf`.

### 5.2 AI filters that can be turned off

A filter is **data**, so one object describes each filter:

```js
{ id: "free", label: "Free only", enabled: true, addToQuery: '"free"', aiRule: "Only include tools with a free plan" }
```

- The checkbox's `"change"` event sets `enabled` (tested: ticking the box updated the next search URL).
- `addToQuery` is used at **level 1**; `aiRule` is the sentence added to the AI prompt at **levels 2–3**.
- **"All AI off"** is a master switch: when it's off, skip the AI call entirely and fall back to level 1. That also gives you a working site if the AI is down during the presentation.
- Save the filter states in `localStorage`, so the user's choices survive a reload.

### 5.3 Shortcuts the user can add

Data: an array of `{ name, url }` in `localStorage` (3.6). The flow:

1. A **"+" tile** opens a `<dialog>` holding a `<form>` with two inputs: name and address.
2. On submit: `preventDefault`, `normalizeUrl` inside `try/catch` (show "That doesn't look like a web address" on error), `push` onto the array, `saveShortcuts`, `renderShortcuts`, `dialog.close()`.
3. **Icons** come free from a favicon service, which is just an image URL, so no `fetch` and no CORS issue:
   - `https://www.google.com/s2/favicons?domain=anilist.co&sz=64` (tested: works)
   - `https://icons.duckduckgo.com/ip3/anilist.co.ico` (tested: works; a backup)
4. **Delete**: a small × button on each tile that removes that item from the array, saves, and re-renders. Clicking × must not also open the link, so call `event.preventDefault()` in its click handler.
5. Nice extras, if time allows: edit, drag to reorder, a few default shortcuts on first visit.

### 5.4 Previews: why the obvious way fails

The obvious idea is to show the real site in a mini window with an `<iframe>` (a page inside your page). **Most big sites forbid it.** Tested Oct 9:

| Site | Can be shown in an iframe? |
| --- | --- |
| Google, YouTube, AniList | No (`X-Frame-Options: SAMEORIGIN`) |
| Steam, GitHub | No (`DENY` / `frame-ancestors 'none'`) |
| Wikipedia, Crunchyroll | Yes |

A blocked iframe just shows an empty grey box. So a reliable preview is a **preview card**: title, description and image from a **link-preview API**. Microlink (3.8) worked from the browser (CORS open). Its free tier is small (the response header showed a limit of 25 requests), so:

- Fetch a preview **once, when the shortcut is added**, and store it in the shortcut object. Don't fetch it on every hover.
- Show the card on hover (`mouseenter`) or in a `<dialog>`.
- If the API fails, the tile simply has no preview. The site must not break.

---

## 6. Decisions only you can make

These shape the plan. Decide them before giving out tasks.

1. **Search level:** stop at 1, go to 2, or attempt 3? With 5 days, a solid level 1 + 2 with level 3 as a stretch goal is the safe choice, but it's your call.
2. **Which search engine** level 1 opens (DuckDuckGo, Google, or a user setting).
3. **The filter list:** which filters, what each one adds to the query and to the prompt.
4. **Preview style:** hover card, click-to-open dialog, or none.
5. **Who owns the Worker and the AI key** (only one person should hold the key).
6. **The "done" line for each day**, so you can tell on day 4 whether to cut a feature.
7. **The new file split.** The starter files (`presets.js`, `fetchers.js`, `board.js`) came from the earlier idea. Rename or add files to match the features, e.g. `search.js`, `filters.js`, `shortcuts.js`, `preview.js`, `ai.js`.

---

## 7. Data contracts: agree on these before splitting work

When four people build separate files, the bugs happen **where the files meet**. Write down, on day one, the exact shape of every object that crosses between files. For example:

```js
// A shortcut (shortcuts.js stores it, preview.js fills in `preview`)
{ name: "AniList", url: "https://anilist.co/", preview: { title: "...", description: "...", image: "..." } }

// A filter (filters.js owns it, search.js and ai.js read it)
{ id: "free", label: "Free only", enabled: true, addToQuery: '"free"', aiRule: "..." }

// A result item (ai.js produces it, board.js draws it)
{ title: "...", url: "...", category: "Free", reason: "..." }

// Function names other files may call
renderShortcuts(list) · getPreview(url) · buildSearchUrl(text) · askAI(text, filters)
```

With these fixed, each person can test their file with **fake data** of that shape, without waiting for the others. Put them in the README so the contractor sees them too.

---

## 8. First steps for the team (today)

Only first steps; the rest of the plan is yours.

**Everyone (30 min):**
- Clone the repo, open it in VS Code, accept the recommended extensions, and run the page with **Live Preview**.
- Do one practice commit: add your name to your row in `README.md`, Commit, then Sync. This proves Git works for everyone before it matters.
- Open DevTools (F12) on the page and find the Console and Elements tabs.

**Layout and style (Eric, `index.html` + `styles.css`):**
- Sketch the page on paper: search bar, filter toggles, shortcut grid, results or preview area.
- Build it in HTML + CSS with **fake, hard-coded content** (three fake tiles, two fake filters). No JS needed yet. Sections 1–2 cover all of it.

**Shortcuts (owner of `shortcuts.js`):**
- Make `renderShortcuts` draw a hard-coded array of three shortcuts with favicons (3.5).
- Then save and load that array with `localStorage` (3.6), and confirm in the Application tab that it's stored.

**Search and filters (owner of `search.js` / `filters.js`):**
- Make the search form open a DuckDuckGo or Google tab (5.1, level 1).
- Then add two filter checkboxes that change the query (5.2).

**AI and Worker (you, or whoever you trust with the key):**
- Create free Groq and Cloudflare accounts. Make a "hello world" Worker that returns some JSON, and `fetch` it from the page.
- Write the result-item JSON schema from section 7.

**Contractor (a self-contained piece with a clear input and output):**
- `preview.js`: `getPreview(url)` returns `{ title, description, image }` or `null` on failure, and caches its results. Give them the shape from section 7, section 5.4, and a due date **before** your feature freeze, so a late delivery can't block the demo.

---

## 9. Glossary and where to look things up

| Word | Meaning |
| --- | --- |
| DOM | The live tree of elements the browser builds from your HTML; JS changes it |
| Element / tag / attribute | `<a href="x">text</a>`: the element, its tags, its `href` attribute |
| Selector | The "which elements" part of a CSS rule, also used by `querySelector` |
| Event / listener | Something happening (a click) / the function that reacts to it |
| State / render | The data / the function that draws the page from the data |
| JSON | Text format for data; looks like a JS object |
| API / endpoint | A URL that returns data / one specific URL of an API |
| Promise / async / await | A value that arrives later / a function that can wait / the waiting |
| CORS | The browser rule that an API must allow your site to read it |
| Rate limit / 429 | Maximum calls allowed / the error you get when you go over |
| Worker / proxy | A tiny server program that sits between your page and an API; it holds the key |
| XSS | Attack where user text is run as code; prevented by `textContent` |
| localStorage | Small, permanent, per-browser storage for text |

**Where to look things up:** [MDN Web Docs](https://developer.mozilla.org/) is the reference for everything in HTML, CSS and JS; search "mdn" + the thing, e.g. "mdn flexbox" or "mdn fetch". MDN's [Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development) course is the best free beginner path. For layout ideas, CSS-Tricks' guides to [Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) and [Grid](https://css-tricks.com/snippets/css/complete-guide-grid/) are classics.
