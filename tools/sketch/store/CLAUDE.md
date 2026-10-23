# tools/sketch/store

The browser's store of plots (ST-040, T-040.1): the plots a browser is given and the sketches kept
on them, held in the browser's IndexedDB, and the two ways a plot comes in — **a plot's folder**
(Chrome and Edge give one) and **a plot's file** (every browser). A held plot is its file's text,
and every page reads that text with `read` of `../plot-file.js` anew: nothing else parses it
(the story's Rule 3). The stored format is `docs/STORAGE_FORMAT.md`, "The browser's store —
version 1"; the decisions are the proposed ADR `docs/adr/ADR-0164-the-pad-without-a-server.md`.

Three ES modules, which a page loads by `import()` and no page names in a `<script>` tag. A page
asks the store for its plot from T-040.2 on (`../boot.js`); T-040.3 to T-040.5 use the rest.

## Public API

`rules.js` — no browser, no Node, no clock: what the store is, and every rule of it that can be
wrong. It imports `folderOf` and `freeOf` of `../new-plot/request.js`, and `areaOf` of
`../plot-file.js`.

- `EXAMPLE = 'example'` and `OWN = 'home'`, the pad's own two ids; `SPACE =
  'blockplot/sketch/space'`, the key of before (moved here from `../routes.js` by T-040.5,
  with the rest of this list)
- `KEPT_ENDING = '.json'`; `KEPT_NAME_MAX = 80`; `keptName(name)` — whether a kept sketch can
  have that name: letters of the English alphabet, figures, blanks, dots, `-` and `_`, 80 at
  most, no dot at its start and no blank at either end; `../kept-ways.js` states it a second
  time for the page, and `../kept.check.js` holds the two the same. `plotName(name)` — the very
  rule, of a plot's folder

- `BASE = 'blockplot'`, the database; `BASE_VERSION = 1`; `PLOTS = 'plots'`, `KEPT = 'kept'`,
  and `STORES` — `plots` by the key path `id`, `kept` by `['plot', 'name']` with an index `plot`
- `TAB = 'blockplot/plot/tab'`, in `sessionStorage` — the plot this tab shows; `LAST =
  'blockplot/plot/last'`, in `localStorage` — the plot this browser showed last. The note of
  before, `blockplot/sketch/last`, holds the server's ids and is read by nothing
- `WAYS = { folder, file, example }` — how a plot came; `REFUSED = { name, file }` — the two
  sentences that the pad's server said when it read plots: `Its folder has a name that the pad
  does not take.` and `It holds no plot.json.`
- `keyOf(id)` — the `localStorage` key of a plot's sketch: `blockplot/sketch/space` (`SPACE`)
  for `home`, `blockplot/sketch/plot/<id>/space` for every other id, **the example's too**
- `shownOf(tab, last)` — the id to show: the tab's note, else the last, else `null`; a note that
  is no text, or empty, is none
- `folderId(name)` — `{ id }`, the name itself, where `plotName` takes it and it is not
  `example` in any letters; else `{ refused: REFUSED.name }`
- `fileId(text, name, held)` — the id of a plot given as its file: a held plot of this very text
  is that plot (so the folder wins); else `freeOf(folderOf(name), held ids)`, never `home` or
  `example`. `held` is `[{ id, text }]`
- `recordOf({ id, site, text, way, folder, day })` — a held plot, `{ id, name, areaM2, text, way,
  folder, opened }` in that order, `folder` `null` where none
- `heldOrder(records)` — the newest `opened` first, then by `id`; `keptOrder(list)` — the newest
  `at` first, and of one moment the later name (as the pad's server listed them). Neither changes
  what it is handed
- `sketchesOf(files)` — of a folder's file names, `{ names, other }`: the kept sketches by name,
  and how many end in `.json` under a name `keptName` refuses; `fileOf(name)` — `<name>.json`
- `dayOf(moment)` — `YYYY-MM-DD` in local time: the one rule of a day, which `../serve.js`, `../map/make.js`
  and `../open-plot-ways.js` import

`held.js` — the store over `indexedDB`, and nothing else of the page. One connection a page.
`../boot.js` imports it and `../plot-file.js`, from where it lies, for the plot a page shows
(`plot`); `../open-plot.js` lists what the browser holds (`held`); `../open-plot-ways.js` holds
a plot's folder or file (`held`, `plot`, `hold`); `../map/make.js` holds a plot made by New
plot (`held`, `hold`); `../kept.js` hands it to `../kept-ways.js` for Keep and Open kept
(`plot`, `keep`, `kept`, `keptText`, `persist`).

- `held()` — every held plot without its `text`, in `heldOrder`; `plot(id)` — one whole, or
  `null`; `hold(record)` — put, in the place of one of that id (a plot opened again is given
  again: its text, its folder, its day)
- `keep(plot, name, text)` — `{ kept: true }`, or `{ taken: true }` where that plot has a sketch
  of that name: an `add`, whose `ConstraintError` is the name taken. The record is `{ plot,
  name, text, at }`, `at` the milliseconds it was kept
- `kept(plot)` — `[{ name, at }]` in `keptOrder`; `keptText(plot, name)` — the text, or `null`
- `persist()` — `navigator.storage.persist()`, asked once a page: its answer
- A store that cannot be opened rejects with the browser's own error

`ways.js` — the two ways in, over the File System Access API, and nothing else of the page —
and a new plot's folder, made by New plot (ST-041, T-041.3).

- `takesFolders()` — `'showDirectoryPicker' in globalThis`
- `pickFolder()` — `showDirectoryPicker({ id: 'blockplot-plot', mode: 'readwrite' })`, or
  `null` where the picker was shut (`AbortError`)
- `fromFolder(handle)` — `{ id, text }` of its `plot.json`, or `{ refused }`: `REFUSED.name`, or
  `REFUSED.file` where there is no `plot.json`
- `mayWrite(handle)` — `true` where `queryPermission({ mode: 'readwrite' })` is `granted`, or is
  `prompt` and `requestPermission` then is — which wants a click, Keep's or Open kept's; asked without one
  (`SecurityError`), `false`
- `keptIn(handle)` — `{ kept: [{ name, at }], other }` of `sketches/*.json`, `at` the file's
  `lastModified`, in `keptOrder`; none where there is no `sketches/`
- `keepIn(handle, name, text)` — `sketches/` made where there is none; `{ taken: true }` where a
  file of that name lies there, else the file written whole and `{ kept: true }`
- `keptTextIn(handle, name)` — its text, or `null`
- `namesIn(handle)` — the names of what lies in a folder, files and folders alike
- `makeIn(parent, id, text)` — in a folder that the person picked, a new folder `id` with
  `plot.json`, the text written whole (beside it, and in its place as it is closed, as `keepIn`
  writes), and an empty `sketches/`: `{ folder }`, its handle; or `{ taken: true }` where
  anything of that name lies in `parent` — or the folder there after all holds a `plot.json` —
  with nothing made. Where a step fails it rejects, after taking away what it made itself and
  nothing else: the `plot.json` it began, then the folder it made, each by `removeEntry` of its
  one name, never `recursive`; where that taking away fails too, with the browser's error of it,
  marked `left: true`. `../map/make.js` picks the folder (`takesFolders`, `pickFolder`) at the
  press, before the ground is asked, and hands `namesIn` and `makeIn` the folder picked
- `../kept.js` hands `mayWrite`, `keepIn`, `keptIn` and `keptTextIn` to `../kept-ways.js`
- A picked `File` is read with `file.text()` by whoever has it: nothing here for it

## Invariants

1. **No machine is asked** (the story's Rule 1): no module here names a way to send a request.
2. **Nothing is taken away** (directive 33): `held.js` puts and adds, and never removes; Keep
   never writes over a sketch, in the store or in a folder.
3. **One reader**: a held plot is its file's text, read by `read` of `../plot-file.js` each time;
   `../plot-file.js` and the four modules it loads, `../squares.js` among them, import nothing
   of Node.
4. **The page writes a plot's file only into a folder that it made itself, for New plot, and
   never over one** (T-041.3, `makeIn`): of a plot's folder that was opened, `sketches/` alone
   is written.

## Test

`rules.check.js`, which `pnpm sketch:check` finds: every name and value of `rules.js` by hand;
`keyOf` of `home`, `example`, `terrace` and `My plot`; `shownOf` over the nine pairs of none, an
empty text and an id, and notes that are no text; `folderId` of `home`, `Terrace`, `My plot`,
`a (1)`, `example`, `Example`, the empty name and names of 80 and 81 letters; `fileId` of a held
text under another name, new texts whose names give held ids (`-2`, `-3`), `home` and `example`
(never those), letters with signs and nothing; `recordOf` field by field and in order, with an
area stated and one enclosed; `heldOrder` and `keptOrder` over ties, the lists handed left as
they were; `sketchesOf`; `dayOf` just before and after local midnight and at a year's turn. And
of the text: no module here says `fetch`, even without its bracket — the four other words of a
request no file of the pad says, which `../swisstopo/named.check.js` holds over this folder too —
`held.js` names no way to take a record away, and each rule is shown to find what it is for;
`../plot-file.js`, `squares.js`, `new-plot/frame.js`, `new-plot/request.js`, `routes.js` and this folder's
modules import what the check lists, nothing of Node. Last, `write`'s equality of its own holds
what `isDeepStrictEqual` held: keys in any order write the same; a site of another `node:vm`
context, a date for a text, a symbol key and an object of no prototype do not read back.

And the names moved in from `../routes.js` (T-040.5) by hand: `EXAMPLE`, `OWN`, `SPACE`,
`KEPT_ENDING`, `KEPT_NAME_MAX`, and `keptName` and `plotName` at the edges of their rule.

`held.js` and `ways.js` are wiring over the browser, with no check of their own (directive 14):
the browser tests of T-040.2 to T-040.5 run them, and may mend them — and `makeIn`, the folder
way of New plot, T-041.5's. `makeIn` was tried by hand once (T-041.3), on the origin's private
file system: made, its folder held `plot.json` with the text and an empty `sketches/`; made
again of that name, and of a file's name, `{ taken: true }`; a write that failed left nothing.

## Gotchas

The trial of T-040.0, in Playwright 1.63 (Chromium 153.0.8010.12), on made-up content:

- **The real folder picker cannot be answered.** Playwright intercepts `showDirectoryPicker()`
  and rejects it with `AbortError: … Intercepted by Page.setInterceptFileChooserDialog()`; no
  `filechooser` event comes. No test hands the pad a folder of the disk.
- **A stand-in picker works**: an init script hands over a folder of the origin's private file
  system — a real `FileSystemDirectoryHandle`, read, written, held in IndexedDB across a reload
  and a second page, a taken name found taken. The test reads back through
  `navigator.storage.getDirectory()`:

  ```js
  await context.addInitScript(() => {
    globalThis.showDirectoryPicker = async () =>
      (await navigator.storage.getDirectory()).getDirectoryHandle('terrace', { create: true });
  });
  ```
- **Only in a profile of its own**: `chromium.launchPersistentContext(<a folder of the system's
  temporary files>)`. In Playwright's usual context, which keeps nothing, putting a folder's
  handle into IndexedDB **crashes the whole browser** — the headless shell and Chromium 153 alike;
  Google Chrome 155 does not. A plot of the file way holds no handle, and needs no such profile.
- **The permission withdrawn**: an init script sets `FileSystemHandle.prototype.queryPermission`
  to answer `prompt` and `requestPermission` `denied`.
- **A browser that takes no folder**: `page.addInitScript(() => { delete
  globalThis.showDirectoryPicker; })`; `<input type="file">` is there as before.
- `navigator.storage.persist()` answers `false` in a test's browser, in either kind of profile.
- **A folder's handle is a thing only a browser holds**: a record of the folder way is no file,
  and is never exported.
- **`keepIn` makes the file before it writes it**: `getFileHandle(…, { create: true })` leaves
  an empty `<name>.json` where the writing then fails (a full disk), which a later Keep finds
  taken. `createWritable` writes beside the file and takes its place as it is closed, so a file
  is never half written.
