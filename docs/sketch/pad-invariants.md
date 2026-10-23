## Invariants

1. No build, and one dependency: three.js, for the 3D page alone, in the pad's own
   `tools/sketch/package.json` at the one exact version of the ledger (ADR-0003). It reaches the page from
   where the page lies and from nowhere else: the import map of `tools/sketch/3d.html` names `three` and
   `three/addons/` under `./three/`, beside the page (T-040.4), and there `pnpm sketch` gives the
   scripts of three.js's `build/` and `examples/jsm/`, out of `tools/sketch/node_modules/three`,
   where pnpm links it; a plain web server is given that folder beside the pages, as
   `tools/sketch/published.js` writes the pad into a folder outside the repository (T-044.2). No file of
   three.js is copied into the repository, and no address but this machine's is named anywhere
   in the pad — but the three hosts of `tools/sketch/swisstopo/hosts.js`, below, and two names
   of a kind of file, which nobody asks — SVG's and KML's. All else is plain scripts,
   and a server of Node's own modules. The pad's own three pages ask
   nothing of another machine (directive 34) — and the third, the Info page, asks nobody at
   all, its own server neither: its policy is `connect-src 'none'`, and it reads the sketch
   that the browser keeps (T-032.5). The 3D page asks nothing of anyone: its
   Content-Security-Policy is `connect-src 'none'` — to save the house as a file neither: what
   writes that file is three.js's own exporter, two more of its addons from `/three/`, and the
   file goes to the browser out of the page's memory — nor to save a picture of its stage
   (T-029.5): the stage's own canvas writes that, into the page's memory too. The pad's own
   page asks one address, its
   own — the server it was loaded from, for whether it has the page of a new plot: its policy is
   `connect-src 'self'`, which names no other. **It has one script that asks, and no second**
   (T-030.4, T-040.5): `tools/sketch/open-plot.js`, one `GET map/index.html` from where the page
   is, as the page opens, for New plot's entry — 200 on `pnpm sketch` and on any plain file
   server, 204 with no body on the made-up pad (T-041.4) — and nowhere else (T-040.3): the plots it lists are the
   browser's, and its ways in, `tools/sketch/open-plot-ways.js`, ask nobody; nor does Keep,
   `tools/sketch/kept.js`, which keeps in a plot's folder or in the browser (T-040.5). The 3D page has
   neither, and its File no "Open plot": a plot is opened on the pad's own page.
   And nothing of the look comes from elsewhere, or as a file of its own (T-029.6): no font,
   no set of icons and no picture. A control's small drawing is a shape written out in
   `tools/sketch/icons.css`, and the browser asks nobody for it.
   **One page more may ask two hosts** (ST-031, the exception that directive 34 has): the page
   of a new plot, `tools/sketch/map/index.html`, asks swisstopo's map service, its search — for a
   place, and for a parcel by its words, its EGRID or a click (ST-043, T-043.5) — and its
   downloads, for the ground of a plot (ST-041, T-041.3) — by the rules of
   `tools/sketch/swisstopo/hosts.js`, where the three hosts are named, and in no other file; under a policy
   that the page brings in its own head, which names those three and no other (T-041.2); and
   only where its address has no word `asks` — which no check and no test opens: they name a
   stand-in, `?asks=<its port>`. The made-up pad has no such page: a 204 in its place
   (T-041.4). The pad's own two pages ask as they did. The map's page asks the downloads through
   the pad's one door, `tools/sketch/swisstopo/door.js` — and every check and every test sees the
   stand-in. **Of the pad's own server the map's page asks nothing but its files** (T-041.4):
   the plot is made in the page, never an order sent. File's "New plot", the entry that leads
   to that page, is made where `GET map/index.html` answers 200, and asks nothing more.
   `tools/sketch/look.js` alone drives a browser — Playwright's, which the end-to-end tests already have.
2. The server is for this machine's own page: it listens on 127.0.0.1 alone, and answers to that
   name alone (directive 18).
   **It is a plain file server** (ST-040, T-040.4, T-040.5, T-041.4): it gives no plot — a page
   gets its plot from the browser's store, or shows the example, which is its own — no address
   names a plot, it makes none — the map's page does (T-041.3) — and it keeps no sketch: Keep
   writes into a plot's folder through the browser, or into the browser's store (invariant 3).
   It reads no setting but `PORT` and nothing of `design/`, and a plain file server that holds
   the pad's folder and `three/` serves the same pages — but for the made-up pad's one answer of
   its own: `GET /map/index.html`, 204 with no body.
   What it gives is said once, in `tools/sketch/routes.js`: the pad's own `.html`, `.js` and `.css` files —
   a page, a script, a stylesheet (ST-029) — in this folder and in its folders one deep,
   three.js under `/three/`, scripts and no stylesheet, and nothing else — no other
   type, nothing of `node_modules` by its own name, no name that begins with a dot, **and no
   file named `site.js`, under whatever case**: no file has that name, and a plot is never a
   file of this folder (ST-030). A path is
   taken as it is written: plain names with nothing decoded and no dots worked out, so that
   what is asked for in any other way gets no file. Under `/plots/` it gives no page, no script
   and no list — 404, and nothing sent on — and under `/kept/` and `/plots/<id>/kept/`, where
   it kept sketches until T-040.5, nothing: 404 by GET, 403 by every other method, as for any
   path, and nothing written.
   **No request writes anything** (T-041.4): `/new-plot/`, where the server made plots from
   T-031.6 to T-041.4, is a path as any other, of no file. Nothing that lay in `design/plots/` is
   ever removed by the pad (directive 33). What the server keeps out is another site's page — a
   process of this machine that says what a browser would say is let in, as the checks are. On
   either pad nothing of `design/` is read or written, and nothing is written at all.
3. The sketch is the design, and no view holds design data of its own (directive 30, ADR-0058):
   what a view shows beyond what was drawn, it derives by a rule. The sketch lives in the
   browser's storage, for the address it was drawn at and under the key of its plot
   (invariant 9), in the files the owner saves, and — kept by Keep (T-040.5) — in the
   `sketches/` of a plot that came as its folder, `design/plots/<id>/sketches/` for the owner's,
   written through the browser and never over a file, or else in the browser's store: one file
   format, which does not say its plot, written down in `docs/STORAGE_FORMAT.md`, the same bytes
   from "Save file" and from Keep, wherever they are kept, and one reader, `sketch.adopt` — which
   reads a sketch that the pad's server kept in a folder before as it was, whatever version
   wrote it. A change to it is a change of a stored format (directive 27). Since version
   3 it also holds the figures of the house, `figures`, and on a box what its block counts as,
   `is`; since version 4, on a box, a top that slopes, `slope`; since version 5 `is` may say
   `ground`, the fourth thing a block counts as (ST-027); since version 6 a box may say
   `category`, the category that was picked for its block, and `is` may say `cut`, the fifth
   (ST-028); since version 7 a box may say `section`, the number of the section that its block
   is in, and the sketch holds `sections`, the list of them, and `rates`, the rates of a rough
   cost (ST-032; `tools/sketch/sections/CLAUDE.md`, `tools/sketch/info/CLAUDE.md`). Each is left out where nothing
   is said: a door and a window are as high as the figures, a top is level, and a block is
   read from its name — its category by the words of the pad's one list, and by that what it
   counts as: ground where the name holds "ground fill", a cut where it holds "ground cut". A
   category that a name gives is read, and never written (directive 33). What a block is has
   one reading, `of` of `tools/sketch/categories.js`, and one writer, `sketch.categorise` of `tools/sketch/labels.js`.
   What a block counts as has one
   reading, `countsAs` of `tools/sketch/blocks.js`, and one writer, `sketch.count` of `tools/sketch/labels.js` — and
   picking a category takes what that wrote away. A slope
   has one
   reading, `slopeOf`, `topOf` and `highOf` of `tools/sketch/blocks.js`: no other script reads the field.
   Two things write it, each a slope of its own and never one changed in place — the pieces of
   a box that was cut hold one and the same: the pull of `tools/sketch/slopes.js`, and `carried` of
   `tools/sketch/blocks.js` where a box is moved. And every view shows it from `topOn`, which asks `topOf`.
4. **A plot of the owner's is the real plot, as `site.js` was**, and like `data/site/`
   (ST-030): `design/plots/<id>/plot.json` holds the place and the ground of a family home,
   and no test, fixture, check or CI artifact copies one, reads one or holds one. **No file
   of this folder holds anything of it**: the pad's folder has one plot, the made-up
   example, and nothing here is written by the pad.
   The page checks the plot it is given on opening — the outline's area against the land
   register's to a square metre, where the plot states one: what a plot does not say, the
   pad does not check — and a height at every grid point — and says so in red where that
   fails. Tests, CI and
   whatever is shown beyond this machine see made-up plots alone (directive 34): the made-up
   pad, `--demo`, whose server reads nothing of `design/`, whatever the environment names, and
   whose page shows the example, `tools/sketch/demo-site.js`, where its browser holds no other;
   or a pad told its port alone, which reads nothing of `design/` either (T-041.4), and whose
   map's page is opened with a stand-in's `asks`. **No pad is started by hand without
   `--demo`**; a check or a browser test may start one without it, on a port that the system
   picks. `tools/sketch/demo-site.js` and
   the made-up sketches of `tests/__fixtures__/sketch/` hold nothing of the real plot or of the
   owner's sketch, and stay so — and neither do the plot's files that a check reads (ST-030):
   the example, `tools/sketch/example/plot.json`, which is `tools/sketch/demo-site.js` as a file, and the made-up plots
   of `tests/__fixtures__/plots/`. A kept sketch is the real plans too: no test, fixture, check or
   CI artifact holds one, reads one or writes into `design/plots/` — a check may ask whether
   anything there changed, and prints nothing of it. And so is a house saved as a 3D file: a `.glb`
   of the owner's sketch lies where the browser saved it, and none is ever committed — a test
   saves the made-up house, into the folder its browser has for that run. And so is a picture
   of it, saved from the 3D page (T-029.5): a `house-<day>.png` of the owner's sketch stays
   on this machine, and no picture is committed — a test saves one of the made-up house, the
   same way, and a look's lies outside the repository.
5. Every file stays under 300 lines and passes `pnpm lint`, which reads this folder. The
   linter counts the lines of a script and of no other file: the three pages, `tools/sketch/index.html`,
   `tools/sketch/3d.html` and `tools/sketch/info.html`, and the five stylesheets, `tools/sketch/frame.css`, `tools/sketch/pad.css`, `tools/sketch/icons.css`,
   `tools/sketch/info/info.css` and `tools/sketch/view3d/side.css`, are
   counted by hand, `wc -l`, each under 300 — the formatter reads them, and no gate counts them.
6. **One space, five views of three planes.** A box has three extents in whole cells: along the
   plot (`x`), across it (`y`), and up (`z`). The plane `top` shows the first two; `side`, a
   slice along the plot, shows `x` and `z`; `end`, a slice across it, shows `y` and `z`. A change
   made in one view is the same change in all: no view keeps things of its own. A block is a
   box, or the boxes that have one `group`: cutting and merging leave no two of them in each
   other, and they are moved, copied, named and taken away together. A box lies wherever it is
   put, in whole cells: the plot's paper is where the ground is measured, and no edge of it holds
   a box, a block or a line's corner (ST-042).
7. A slice is seen from either side: `side` and `far` show the plane `side`, `front` and `back`
   the plane `end`, and the front is the downhill end. The second of each pair is the first one's
   paper seen from behind. Nothing but `paper.shown`, the pointer in `tools/sketch/pointer.js`, the
   window in `tools/sketch/zoom.js` and the place kept in `tools/sketch/page.js`, the canvas in
   `tools/sketch/draw.js` and the captions in `tools/sketch/land.js` knows of the flip: every stroke, rect and note is in
   cells of the plane's paper.
8. A layer is a cut through the space, never a list of its own: a level of the top view has what
   stands on it and what rises through it, of what shows; a slice has what it runs through, of
   what shows, and nothing else — `side` along a row of the top view, `end` along a column.
   Levels are read off what stands where, hidden or not. `sideM` of a plot stays as it is: a
   box's height is a row of the standing papers. **What a hidden section holds does not show**
   (T-032.3): `sketch.shows(thing)` says no of it by `sections.hides`, asked where a page loads
   `tools/sketch/sections/model.js` — the pad's page does; the 3D page loads it too (ST-033), for
   its switches, and asks no `sketch.shows`: there a hidden section shows; and where none is loaded
   everything shows — so it lies on no layer, and no click, no box of Select, Merge or Erase
   and no object set down in a slice reaches it, while `sketch.lies`, the geometry alone,
   answers as it did; and the levels' three buttons — lift, lower, Delete — take all that
   stands on a level, hidden or not, and the ground stays one: a hidden block of ground shapes
   it, a hidden cut takes it away and a hidden block of the house holds it back.
9. Nothing a person drew is dropped without being asked. The sketches of before — one for each
   view, of sheets of blocks or of coloured cells — are read once, and stay in the browser. And
   a text under the pad's key that the pad cannot read — no JSON, another `space`, a kind it
   does not know — is never written over. `sketch.keep` is the one place that writes the pad's
   key: a stroke, an undo, a file or a kept sketch opened and a slice moved all go through it.
   Before it writes over such a text, it sets it aside, byte for byte, under a key of its own
   in the same store: `blockplot/sketch/space/unread/<number>`, the next number from 1 on. A
   key that holds a text is never written again and never taken away, and a text that is set
   aside already gets no second key. Where the store takes no more, nothing is written at all:
   the text stays under the pad's key, and the alarm says that the sketch is not kept, and why.
   `tools/sketch/3d.html` keeps one thing, a figure of the house set in its Settings, through
   `sketch.change` as any stroke is kept — but never over such a text: while the pad's key
   holds one, its Settings are locked and say so, and the page writes nothing and sets nothing
   aside. And a sketch that is kept in a plot's folder is never written over and never taken
   away by the pad: keeping again makes another file (invariant 3); nor is one kept in the
   browser's store, which the pad only adds to.
   **Which key is whose** (ST-030). "The pad's key" is the key of the plot that the page
   shows, which the page's plot says (`PLOT.key`, by `keyOf` of `tools/sketch/boot.js`):
   `blockplot/sketch/plot/<id>/space` — but `home`, the owner's plot,
   which has the key of today, `blockplot/sketch/space`: the sketch that a browser held
   before a plot was a file is found on the owner's plot, with nothing copied, moved or
   written over. A script that runs with no `PLOT` — every check that loads
   `tools/sketch/demo-site.js` alone — keeps under the key of today too, and every text it writes
   into a store is byte for byte what the pad wrote before. **The example's sketch has one key
   on either pad**, `blockplot/sketch/plot/example/space`, since T-040.4: before, it had the
   key of today on the made-up pad. What is set aside is set
   aside under the sketch's own key, `<key>/unread/<number>`: a plot's texts are that
   plot's, and no key of a plot begins with another's. **The sketches of before are the
   first key's alone**: they are brought over where the page keeps under that key, and on
   no other plot. **A tab's steps to undo, and what it showed last, are of one plot** — one
   slot each, `blockplot/sketch/space/steps` and `blockplot/sketch/seen`, which say
   whose they are, `of`, but under the first key, where they say nothing. A page takes up
   neither where it is another plot's, and writes its own into the slot as it goes: the
   steps outlast a reload and another view of their plot, and do not follow to another
   plot and back. And another window is heard by the key of the page's own sketch
   (`sketch.KEY`): a window that shows one plot goes on showing it when another window
   draws on another.

