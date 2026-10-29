# tools/sketch

The owner's sketch pad: boxes kept on half-metre cells, under a grid shown that follows the
zoom from 0.5 m to 500 m (ST-042), seen from above over the parcel
outline and in slices over the ground. It is where the design is drawn: the sketch is the source
of the design, and every view shows that one sketch (ADR-0058). It stands outside the product's
layers: nothing in `apps/`, `packages/` or `design/` reads it, and it imports nothing of them.
**It holds no plot of the owner's** (ST-030): a plot is a file among their data,
`design/plots/<id>/plot.json`, and this folder has one plot alone, the made-up example. **Its
pages hold the plot, not its server** (ST-040): a page gets its plot from the browser's store,
where a plot comes as a folder or as a file (File, "Open plot"), and the server gives plain
files. Of the repository the pad's server reads nothing to give a page, and writes nothing
(ST-041): a plot that is made from a map is made in the map's page, and written through the
browser into a folder that the owner picks, or offered as a file (ST-031, T-041.3). A sketch that Keep keeps goes into the `sketches/` of a plot that came as its
folder, through the browser, or into the browser's store (T-040.5): the server keeps none.
**Eight folders have a note of their own** (ST-031, ST-032, ST-036, ST-039, ST-040), and this one points to them: `tools/sketch/swisstopo/`
— whom the pad asks and how every address is built, the page's door, the pad's reader of
swissALTI3D and the stand-in that checks ask in swisstopo's place; `tools/sketch/new-plot/` — the order for
a new plot, the one computation of a plot from corners and ground, and what the page makes of
an order: a plot's file (ST-041); `tools/sketch/map/` — the page of a new plot: the map, a place found on it, the
corners of a plot marked on it, and the plot named and made. File's "New plot" leads there.
And two that came with version 7 of the sketch file (ST-032), of plain scripts: `tools/sketch/sections/`
— the sections of a sketch, in two: their one reading and the steps that change them, which the
pad's page loads since a hidden section leaves its paper (T-032.3), and their list beside the
paper, whose pick is the tool that fills one (T-032.4) — and `tools/sketch/info/` — the rates of a rough
cost, as a sketch holds them, what the sketch adds up to, and the Info page that shows both,
`tools/sketch/info.html`, the seventh view (T-032.5): what is the page's, its own note says.
And one that came with version 10 (ST-036): `tools/sketch/distances/` — the boundary distances
that the owner typed, as a sketch holds them: their one reading and how one is written (T-036.1).
And one that came with version 12 (ST-039): `tools/sketch/lines/` — the guide lines of a sketch,
the Line tool, a line's panel and the list under the levels.
And one that came with the pad without a server (ST-040): `tools/sketch/store/` — the browser's
store of plots, in IndexedDB, its keys and its notes, and the two ways a plot comes in, a plot's
folder and a plot's file (T-040.1); `tools/sketch/boot.js`, Open plot and New plot's page use it.

## Public API

`pnpm sketch` serves it at `http://127.0.0.1:4764` (`tools/sketch/serve.js`) **as plain files**
(ST-040, T-040.4): its pages, scripts and stylesheets, and three.js under `three/`, beside the
pages. **Any plain web server serves the pages as well**, with one thing beyond the pad's own
files: a folder `three/` beside the pages, holding three.js's `build/` and `examples/jsm/`, which
`pnpm sketch` gives out of the installed package, and **`tools/sketch/published.js`** writes
there (T-044.2): `node tools/sketch/published.js <folder>` writes into an empty folder every file
`pnpm sketch` gives, at its path, with three.js's `LICENSE` under `three/` and an empty
`.nojekyll` — the folder that a plain web host, GitHub Pages, is given. The 3D
page's import map names them from where the page is, `./three/…`, so the pad runs under any
path. **The server gives files and nothing else** (ST-041, T-041.4): it makes no plot — New plot
makes one in the map's page (T-041.3) — keeps no sketch (T-040.5), reads no setting but `PORT`
and nothing of `design/`, and writes nothing. Whom the map's page asks is the word `asks` of its
own address (T-041.2): no word, swisstopo; `?asks=<a port>`, a stand-in on this machine. As it
starts, the pad says one line: `The sketch pad: <origin> - Ctrl+C stops it.`, with `, on the
made-up plot` after `The sketch pad` on the made-up pad. The switch in the toolbar's View group
changes the view, and `/#top`, `/#side`, `/#far`, `/#front` or `/#back` opens one directly —
or `/3d.html`, the sixth view: a page of its own, for the sketch in 3D — or `/info.html`, the
seventh: a page of its own too, for what the sketch adds up to (`tools/sketch/info/CLAUDE.md`).
**No address names a plot** (ST-040): `/plots/<id>/` ended with T-040.4. Every link of the pad is
relative. **Every page shows the plot that its tab shows, else the one this browser showed
last, from the browser's store** (T-040.2, "The plot shown last", below), and where neither is
noted, or the one noted is not held, **the example, which is the page's own**: `demo-site.js`
in the place of the template's `site.js`. Another plot is opened from File, "Open plot", on the
pad's own page.
**The page no longer opens from its file**: every page's scripts lie in its `<template
id="scripts">`, and its one script outside it, `tools/sketch/boot.js`, the last thing of the
page, puts them in once the page has its plot — at once for the example, after the browser's
store answered for a plot it holds. The template's first tag, `<script src="site.js"></script>`,
is the plot's place, which `boot.js` fills with `demo-site.js` or leaves out: there is no file of
that name, and no server gives one. Where `boot.js` itself does not load, its own `onerror` says
"The pad did not start: its first script did not load. Reload the page." — in `#alarm`, and on
the Info page in `#info-said`; the 3D page marks its stage `none`. The 3D page says its own, as
it did: its scripts are modules, and three.js comes from `three/` beside it. Nothing imports
from here.

- **What the server gives** (ST-030, ST-040, T-040.4, T-040.5, T-041.4). `tools/sketch/serve.js`
  gives a path the file that `route` names, and nothing else:

  | Asked | `pnpm sketch` | The made-up pad, `--demo` |
  | --- | --- | --- |
  | `/`, `/index.html`, `/3d.html`, `/info.html`, a file of the pad, `/three/build/…`, `/three/examples/jsm/…` | The file as it lies (`route`) | The same |
  | `/site.js`, under whatever case | 404: no file has that name | The same |
  | `/plots/`, `/plots/<id>`, `/plots/<id>/`, any page, script or stylesheet under `/plots/<id>/` | 404, and nothing sent on: no 302 | The same |
  | `/kept/…`, `/plots/<id>/kept/…` — where the server kept sketches until T-040.5 | 404 by `GET`, as any path with no file; 403 by every other method, as for any file; nothing is written | The same |
  | What `route` gives nothing for | 404 | 404 |
  | `/new-plot/`, where the server made plots until T-041.4 | 404 by `GET`, as any path with no file; 403 by every other method | The same |
  | `/map/index.html` (ST-031) | The page of a new plot, with no header of its own: it brings its policy and its referrer's in its head, and learns whom it asks from its own address, `?asks=<a port>` or none (T-041.2, `docs/sketch/map.md`). Under other letters, `/Map/…`, 404 | **204, with no body** (`NO_PAGE` of `route`, T-041.4): File, which asks for it, has no "New plot", and the page's console no error |
  | Any other path of `/map/` | The file as it lies | 404: nothing else of `tools/sketch/map/` |

  **Guarded as before**: under the server's own host name, `127.0.0.1` and its port, alone — 403
  for every other; `localhost` is sent on to `127.0.0.1`, with what was asked. The pad's pages,
  scripts and stylesheets are given by GET alone, to the pad's own page, an address typed in and
  a page of another site that opens the pad. **No request writes anything** (T-041.4): a plain
  file server that holds the pad's folder and `three/` serves the same pages, but for the made-up
  pad's one 204. **That folder is written by `tools/sketch/published.js`** (ST-044, T-044.2):
  `published(pad, out)` writes each file whose path `route(…, false)` answers with that very file
  — `map/` whole, as `pnpm sketch` gives it, and no `example/plot.json`, which no page asks: the
  example comes as `demo-site.js` — the scripts of three.js's `build/` and `examples/jsm/` under
  `three/` with its `LICENSE`, which its licence asks of a copy, and an empty `.nojekyll`, so that
  GitHub Pages serves the folder as it lies; no `node_modules`. It refuses, writing nothing, a
  folder that holds anything, and a pad without `node_modules/three`
  (`three.js is not installed here: pnpm install`), and gives the paths it wrote.
- `tools/sketch/plots.js`, what the server read of the plots' folder for Keep, went with
  T-040.5, and `plots.check.js` with it: the server reads no plot
- **The frame of the three pages** (ST-029), `tools/sketch/frame.css`: the stylesheet that `tools/sketch/index.html`,
  `tools/sketch/3d.html` and `tools/sketch/info.html` name by its bare name, as they name their scripts — the page itself,
  the toolbar and a group of it, a control and what is pressed, open, off or `away`, a menu,
  `#work` and a side — and the one look of all three (below). What one page alone has, and what
  they state differently — how wide a side is — stays with that page: the 3D page's in its
  own `<style>`, the Info page's in `tools/sketch/info/info.css` (T-032.5), and the pad's in a stylesheet of
  its own, `tools/sketch/pad.css` (T-029.4), which
  `tools/sketch/index.html` names in the line after `tools/sketch/frame.css`, by its bare name too, and the server
  gives the same way: the page keeps no rule itself. The pad's colours have a stylesheet of their
  own, `tools/sketch/colours.css` (T-039.1), named in the line after `tools/sketch/pad.css`: the
  rules of the toolbar's `#palette` — `#colour`, `#colours-open` and the menu `#colours`, with
  the owner's list `#own-colours` (T-039.3) — and of the swatch's `#swatch-palette`, moved out of
  `tools/sketch/pad.css` (T-039.1) — the row that holds the swatch, `#swatch-row`, stays there,
  beside the rule it shares with the other rows of what is selected. A group of
  the toolbar is a direct child of `header` with the class `group`, `role="group"` and an
  `aria-label`, which the stylesheet writes under it as a small word: so a line of the toolbar
  is 68 pixels on every page, 54 for the controls and 14 for the word under them, and the
  toolbar breaks between its groups and never inside one — it is `74 * lines + 5` pixels high,
  79 on one line, which it is in a window of 1440 and of 1280 on all three pages (T-029.6,
  T-032.5, Gotchas). The pad's page has five, in this order, then one button that stands in
  no group, and `#title` after them: `#file-group`, File; `#view-group` — `#views`, `#smaller`, `#larger`,
  `#fit`, "Zoom to fit" (T-042.3), and after it, in the top view alone and only where the page
  offers swisstopo's map under it, `#under-control`, "Map": a switch, a choice of map — a
  menu, as File is: `#under-layer`, a button that says the chosen map and opens `#under-layers`,
  an entry a layer, and no `<select>` — and a slider of how strongly it shows, two rows in the group's height (`tools/sketch/under/switch.js`,
  `under.css`, T-046.3; `docs/sketch/under.md`) — hidden on the made-up pad, so its toolbar is
  as it was;
  `#edit-group` — `#undo`, `#redo` and the tools `move`, `merge`, `line`, `text`, `erase`;
  `#block-group` — `#high-row` with `#high`, and `#palette`, the colours, which
  `tools/sketch/palette.js` makes (T-039.1): `#colour`, the colour to draw with, which is the
  Block tool, the one that has no button of its own (T-029.3), and `#colours-open`, a small
  arrow, which opens the menu `#colours` (T-039.3); `#objects-group` —
  one button, `#object`, which is the tool `object` and holds `#object-picture`, a canvas,
  and `#object-name`: the object that a click sets down, which is picked in the gallery
  (T-029.4); and after them `#distances-open`, Distances, which opens the boundary distances
  and shuts them again (T-036.3). Beside the paper, two sides, each scrolling for itself: `#left`,
  the levels or the slice, which `tools/sketch/layers.js` fills, and under them, from above, the lines
  on every level, `#every-lines`, which `tools/sketch/lines/list.js` puts there (T-039.4), and over the
  hint of the layers, the sections, which `tools/sketch/sections/list.js` puts there (T-032.4) — and `#right`: first
  `#distances`, the boundary distances, hidden until Distances opens it — a row a distance,
  which `tools/sketch/distances/panel.js` makes, and the switch `#distances-shown` — then what is
  selected: `#selected` with `#picked`, after it the row of `tools/sketch/category-list.js`, then the row
  of `tools/sketch/swatch.js`, then the row of `tools/sketch/sections/list.js`, then the row of
  `tools/sketch/object-high.js`, then a selected line's panel, `#line-row`, of
  `tools/sketch/lines/panel.js` (T-039.4), and last `#none-picked`,
  "Nothing is selected.", which shows where `#picked` is hidden — and after `#selected` the
  gallery of the objects, `#gallery`, which shows in its place while Object is the tool
  (`tools/sketch/gallery.js`). `#right` is always there and
  as wide, so the paper does not move when a thing is selected. The 3D page's toolbar begins
  with `#file-group` and `#view-group` too, then `#ways`, `#stands`, `#with`, one button that
  stands in no group, `#settings-open`, and `#title`; and beside its stage it has two sides
  too (T-029.5): left `#side`, the levels, and right `#settings`, the figures of the house,
  which that button opens and which takes its width of the stage only while it is open
  (`docs/sketch/view3d.md`). A control keeps its id: the scripts, the checks and the browser tests
  find it by that, and `tests/e2e/sketch-frame.spec.ts` holds which place holds which
- **One look, said once** (T-029.6), by the stylesheets alone — no script says any of it. Its
  figures are the custom properties at the head of `tools/sketch/frame.css`, which every rule of the three
  stylesheets, of `tools/sketch/3d.html` and of the Info page's `tools/sketch/info/info.css` (T-032.5) takes: `--ink`,
  the words and the ground of what is chosen;
  `--faint`, a group's name and a quiet word; `--off`, the words of what is off; `--paper`;
  `--hair`, a hairline; `--grey`, a track, a band and what the pointer is over — and
  `--grey-over` where the ground under the pointer is the grey already, which a part says by
  `--over`. No accent colour: the colours of a page are the blocks', and the colours to
  draw in. **The toolbar is a ribbon with nothing hidden**: every group shows, with its name
  under it and a thin upright line after it. **A main control is a square**, 48 pixels by 50
  — a way 56 — with a small drawing over its word: a button that is a direct child of a
  group of the toolbar or of the toolbar itself, and a link of the switch; **a lesser one is
  small**, 24 pixels, one over the other, its drawing alone: `#undo` over `#redo`, `#larger`
  over `#smaller`. **A control has no box** — no border, no ground of its own, the grey under
  the pointer and a ring of 2 pixels where the keyboard has it (`:focus-visible`). **What is
  chosen has the ink, with white words, and nothing else has**: what says
  `aria-pressed="true"`, `aria-expanded="true"` or, a link of the switch, `aria-current` — a
  tool, the view that shows, a way, the level drawn on or shown, File and Settings while
  they are open. A tile of the gallery says `aria-pressed` too, and lies in a band of the
  grey instead: the tool has the ink. **Choices that exclude each other stand in a track**, a
  band of the grey round its parts: `#views`, and on the 3D page `#ways` and `#stands`. **A
  colour is round**, 18 pixels — the colour to draw with, in the toolbar, with a ring where
  Block is the tool; in its menu the eleven in two rows and the owner's colours one under the
  other, a round swatch beside each name, the one drawn in marked with a ring. **A
  menu floats**: the class `menu`, a panel with soft corners and a soft shadow. **The small
  drawings are `tools/sketch/icons.css`'s** (below). What is no menu area keeps its look, but that a
  button in it is the new button: the paper, the stage, the alarm, the footer, the window of
  Keep. `tests/e2e/sketch-look.spec.ts` holds the rules; how calm it is, a look
- `tools/sketch/icons.css` — the small drawings of the toolbar's controls, on every page (T-029.6): the
  third stylesheet, which `tools/sketch/3d.html` and `tools/sketch/info.html` name in the line after `tools/sketch/frame.css` and
  `tools/sketch/index.html` in the line after `tools/sketch/colours.css`, by its bare name, and the server gives as it
  gives those. Each
  drawing is a shape said in the file itself — a picture written out as text, laid as a mask
  over the colour of its control's words: so it is white where the control is chosen and
  faint where it is off. No font, no set of icons from anywhere and no file of a picture
  (invariant 1): twenty-seven of them, drawn for this pad on a grid of 20 with a line of 1.5
  and round ends — a sheet for File; for the seven views a cube seen askew with the face that
  the view looks at filled, the bare cube for 3D, and a table for Info, its head, two rows and
  a column of names (T-032.5); a plus and a minus; two bent arrows; a
  pointer's arrow, two squares become one, a line with a dot at each end, a tag, a rubber;
  for the three ways a house filled, in outline and in two tones; for the five stands a small
  square with a mark on the side it is seen from; three sliders for Settings; and the small
  sign after the name on the button of the Objects group. A control keeps its word: the four
  lesser ones alone show their drawing with no word, and keep the names that are read out
- **File is a menu, on both pages** (T-029.2): `#file-group` holds one button, `#file-menu`,
  "File", and the part it opens, `#file-entries`, hidden until then — on the pad's page
  `#open`, `#open-kept`, `#open-plot`, `#save`, `#keep` and, under the small word "Export",
  `#picture`, "Picture (PNG)": the three that open, then the two that save, then Export
  (T-030.4) — and **on a pad with plots a seventh, `#new-plot`, "New plot", after
  `#open-plot`** (T-031.7, under "Open plot" below): Open file, Open kept, Open plot, New
  plot, Save file, Keep, Picture (PNG) — with the hidden field `#file` beside them in the
  group; on the 3D page,
  under "Export", `#picture`, "Picture (PNG)" too — there the stage as it shows (T-029.5) —
  then `#save`, "3D file (GLB)", and the line `#save-why`: **no "Open plot" and no "New plot"
  there**, for that page asks nobody, and shows the plot of its address. The button says its own
  name, so the group has no `aria-label` and no word under it: it is named by its button
  (`aria-labelledby`), and is as wide on both pages — the switch of views beside it lies at
  the same pixels on both. Each entry is the button it was, heard by the script that heard
  it: `tools/sketch/files.js`, `tools/sketch/kept.js`, `tools/sketch/open-plot.js`, `tools/sketch/view3d/panel.js`. What opens and shuts a menu,
  and what has the
  keys meanwhile, is `views.menu` and `views.typing` of `tools/sketch/views.js`; how a menu looks is the
  class `menu` of `tools/sketch/frame.css`: under its button, its entries one under the other, over
  whatever lies below it, and taking no room of the toolbar (Gotchas)
- `pnpm sketch --demo` — the pad on the made-up plot, at `http://127.0.0.1:4765`, as it was
  for every test (T-030.3). Its files are the same files as the other's (T-040.4): what is the
  example's is the page's own, as on any pad — and what the page keeps goes into the browser,
  as on any pad (T-040.5): nothing of `design/` is read or written, and nothing is written at
  all — as on the other pad (T-041.4). **It asks no other machine, and has no New plot**
  (ST-031): it has nothing of `tools/sketch/map/` but `GET /map/index.html`, answered 204 with no
  body, so that File has no "New plot" and the page's console no error; and it says one line,
  `The sketch pad, on the made-up plot: <origin> - Ctrl+C stops it.` It is
  the one switch, and any other argument is refused. With a `PORT` in the environment either
  pad listens there instead, and answers to that address alone: a second pad beside the one
  that runs
- **Keep** and **Open kept**, in the File menu: "Open kept" after "Open file", "Keep" after
  "Save file" (`tools/sketch/kept.js`, the window; `tools/sketch/kept-ways.js`, where and what
  is said). They are **the shown plot's** (ST-030), `PLOT.id`. Keep asks for a name, offering
  the day and the time, and says under its field where the plot's sketches are kept —
  "Sketches of this plot are kept in the folder terrace." or "Sketches of this plot are kept in
  this browser only — save a file to keep a copy." — then keeps the sketch as it is, the bytes
  that "Save file" saves, `JSON.stringify(sketch.doc)`, once: never over a sketch that is kept
  (ST-040, T-040.5):
  - **a plot that came as its folder** (`PLOT.way` `folder`): its handle, `plot(PLOT.id).folder`
    of `tools/sketch/store/held.js`; `mayWrite` of `tools/sketch/store/ways.js`, asked on Keep's
    own click, so that the browser may ask the person; granted, `keepIn` writes
    `sketches/<name>.json` there, and the window says "Kept in the folder terrace:
    sketches/<name>.json"; a name taken there, ""<name>" is taken: a sketch is kept under that
    name, and nothing was written. Give this one another name."; **refused**, the sketch is kept
    in the browser instead, "The folder terrace may not be written to, so this sketch is kept in
    this browser only — save a file to keep a copy."
  - **every other plot** — its file, the example: `keep(PLOT.id, name, text)` of `held.js`, and
    "Kept in this browser only — save a file to keep a copy." Where it is the plot's first
    sketch in the browser, the browser is asked to keep what it holds (`persist()`), and its no
    is said after: "This browser may clear it when it is short of room." A private window
    cannot be told by the page: that sentence is all the pad says of it.
  Open kept lists, of a folder's plot, the sketches of its `sketches/` (`keptIn`; where the
  browser will not let the page read the folder, it asks for leave, and refused it lists the
  browser's alone, "The folder terrace may not be read, so the sketches kept in this browser
  alone are listed.") and after them those this browser kept on that id, each said
  `in this browser`; of every other plot, `kept(PLOT.id)`. The newest first of each; a file that
  ends in `.json` under a name the rule does not take is counted, "Not listed: <n> of the files
  there, …". A sketch kept in a folder before, by the pad's server, is a file there like any:
  listed and opened as it was, whatever version wrote it. The one picked opens as "Open file"
  opens a file: Undo brings back what was there. Both say what happened in a window of their
  own. Opened from its file, the page cannot load the store, and they say so. **The server
  keeps nothing** since T-040.5: `/kept/` and `/plots/<id>/kept/` went with it
- **Open plot**, in the File menu, after "Open kept" (`tools/sketch/open-plot.js` and
  `tools/sketch/open-plot-ways.js`, T-030.4, T-040.3), on the pad's page alone: a window, "Open a
  plot", that lists **the plots this browser holds** (`held()` of `tools/sketch/store/held.js`) —
  the one opened newest first, and of one day by their id — and **the example**, last. Each is a
  button with its name, and after it, small, what holds of these, with a comma between: its area
  to a whole square metre, `336 m²`; `opened 2026-10-20`; where its sketches are kept, `the folder
  terrace` or `this browser`; `the example`; `shows now`. The example says neither area nor day:
  `the example`, its name as `tools/sketch/demo-site.js` says it. The entry of the plot that shows
  says `aria-current="true"`: that plot is `PLOT.id`. No count of kept sketches: the list asks no folder, which would ask the browser's
  permission for each. **Under the list, the two ways in**: "A plot's folder…", `#plot-folder`,
  where the browser takes folders (`takesFolders()` of `tools/sketch/store/ways.js`: Chrome,
  Edge), and else, `#plot-no-folder`, "This browser cannot be given a folder — Chrome and Edge
  can. A plot's file opens here, and what is kept on it stays in this browser."; and "A plot's
  file…", `#plot-file-pick`, always, which clicks a hidden `<input type="file"
  accept=".json,application/json">`, `#plot-file`. **A folder** is picked (`pickFolder`) and read
  (`fromFolder`, then `read` of `tools/sketch/plot-file.js`): refused, `#plot-said` says `"<the
  folder's name>" cannot be opened: <the sentence>` and nothing is held; else it is held as a
  plot of the folder way, its id its name — in the place of a plot of that id of either way: the
  folder wins, and what was kept in the browser on that id stays where it is. **A file** is read
  (`file.text()`, `read`): refused, `"<the file's name>" cannot be opened: <the reader's
  sentence>`, nothing held; else its id is `fileId(text, site.name, the held plots)` — a held
  plot of this very text is that plot, and is only shown: a folder's record is never made a
  file's — and a plot not held is held as a plot of the file way. **Held, then shown**: where
  it is the first plot the browser holds, `persist()` is asked, and where it answers no the
  window says once, as the page opens again, "This browser may clear what it holds when it is
  short of room: a plot's folder keeps its sketches; a sketch kept in the browser is safe once
  saved as a file."; both notes, `TAB` and `LAST`, are set to the id, and the page is loaded
  again where it is, its address and the view's hash as they are (T-040.4: no address names a
  plot, so none is left). What is to be said rides the
  page's history entry, `history.state.plotSaid`, and is taken out of it as it is said. A pick of
  the plot that shows closes the window; of another held plot or the example, the notes and the
  same reload. A step back no longer goes to the plot that showed before. **`GONE`**
  (`tools/sketch/boot.js`): the window opens as the page does and says first `The plot "<id>"
  that this browser showed last is no longer held here: the browser may have cleared what it
  held. Open its folder or its file again.` A store that cannot be listed is said: `The plots
  this browser holds cannot be listed: ` and why; a way that fails, `Nothing was opened: ` and
  why. Shut, by a button or Escape, the window leaves no focus inside it. The script is two
  halves, as `tools/sketch/kept.js` is. First the words of the window, with nothing of the page
  in them — `openPlot.said(record, shows)`, the small words of an entry; `openPlot.order(records)`,
  the entries: the held plots in order, then the example; `openPlot.says`, every sentence of the
  window — then the entry, `#open-plot`, which the script makes itself and puts after
  `#open-kept`, and its window, a `<dialog>`: `#plot-window`, named by its heading,
  `#plot-title`, with `#plot-list`, the ways' `#plot-ways` (`tools/sketch/open-plot-ways.js`,
  the line after `open-plot.js` in the page's template), `#plot-said` and "Close" — made as
  `tools/sketch/kept.js` makes its own, with that window's guard of its keys, and no rule of a
  stylesheet. `openPlot.say(text)`, `openPlot.go(id, after)` and `openPlot.asked` are for the
  ways' script and the check. The store and the reader are loaded by `import()`, from where the
  scripts lie
- **New plot**, in the File menu, after "Open plot" (`tools/sketch/open-plot.js`, T-031.7,
  T-040.3), **where the pad has the page of a new plot** (T-041.4): one `GET map/index.html`,
  from where the page is, as the page opens, whatever plot it shows — so a pad served under a
  path of its own asks its own folder — and the entry `#new-plot` where it answers 200 and on
  nothing else: `pnpm sketch`, and any plain web server that holds the pad's folder; not the
  made-up pad, which answers **204, with no body**, so that the browser puts no error on the
  console (T-040.4's ADR), nor a 404 or a request that fails (`openPlot.asked`). A click goes to the page of a new plot,
  `tools/sketch/map/index.html`, from where the page is, where the owner marks the corners of a
  plot on a map of swisstopo's, names it and makes it, and from where "Back to the pad" leads
  back (`docs/sketch/map.md`): the plot made is held in the browser's store and noted as the
  tab's, and the pad's own page opens on it (T-040.2). **Neither the made-up pad nor the 3D
  page has the entry**; File then has the six entries it had
- **The plot shown last** (`tools/sketch/boot.js`, T-040.2), every page's first script and its
  only one outside its `<template id="scripts">`: which plot the page shows, and then the page's
  scripts. **Which plot**: the one this tab shows, its id under `blockplot/plot/tab` in
  `sessionStorage`, else the one this browser showed last, under `blockplot/plot/last` in
  `localStorage` (`TAB`, `LAST` and `shownOf` of `tools/sketch/store/rules.js`, stated there a
  second time, since a plain script imports nothing as it loads; a note that is no text, or empty,
  is none, and a store that cannot be read is no note). **Nothing noted, or `example` noted: the
  example, the page's own** (T-040.4) — at once, with `PLOT = { id: 'example', key:
  'blockplot/sketch/plot/example/space', way: 'example' }` set first and `demo-site.js` in
  `site.js`'s place; where nothing was noted, nothing is noted then either. Another id:
  `store/held.js` and `plot-file.js` are
  imported from where `boot.js` lies, the plot is asked of the store and its text read by `read`,
  and `SITE` is its site, `PLOT` `{ id, key: keyOf(id), way }` — the first key for `home` — and
  the scripts go in **with no `site.js`**. Not held, a text that no longer reads, or a store that
  fails: `GONE` is that id, both notes are taken out (they are notes, not design), and the
  example shows, noting nothing. A plot shown from the store, or the example noted, writes both
  notes where they say another or none — so a reload, another view and 3D keep
  the tab's plot, a new tab or an address typed takes the last, and **a window goes on showing
  its plot when another window opens another**. No address names a plot: `/plots/<id>/` went
  with T-040.4, and every page reads the notes. **Putting the scripts in**: for each tag of the
  template a new `<script>` with its attributes, `async` false, appended to `<body>` — so they
  run in their order, the 3D page's module last; the template's `<script src="site.js">` is the
  plot's place, filled with `demo-site.js` for the example and left out for another plot, so
  that the page never asks for a `site.js`; when the last has loaded, `<html data-shown>` is
  `PLOT.id` — the mark a browser test waits for where the store was asked. It makes
  nothing else on a page, and names no machine
- `pnpm sketch:look <page> <sketch file> <picture file> --demo|--plot=<file> [--width=<pixels>] [step …]` —
  `tools/sketch/look.js`, its words read by `argsOf` of `tools/sketch/look-args.js`: a
  picture of a page of the pad, `index.html#side` or `tools/sketch/3d.html`, for whoever must see what was
  drawn and has no window for it. **Of one plot of two** (T-040.4): `--demo`, the made-up plot,
  or `--plot=<file>`, a plot's file, which the page is given as File's "Open plot" is given one
  (`#plot-file`) and holds in the look's browser; neither, or both, is refused with "A look is of
  the made-up plot, --demo, or of a plot's file, --plot=<file>, and of one of the two: the pad
  holds no plot of its own." It starts a made-up pad of its own on a free port either way, opens
  the page in the tests' browser with the sketch file in the page's store under the shown plot's
  key, does the steps, saves a PNG where
  it was told, and prints the page's title, its `#alarm`, its body's `dataset`, the console's
  errors and every request to another origin — which it refuses. The window is 1440 pixels wide
  and 900 high; with `--width=2400` it is so wide, and as high. The pad's toolbar is one line
  in both — which it is from 1265 pixels on, in the top view on the made-up plot, and from
  1159 standing up, since its controls are squares (T-029.6) and the plot's name takes 8em at
  the least (T-032.5); the 3D page's from 1263, and the Info page's from 558 — measured in the
  tests' browser, where they were 1241, 1135 and 1239 with six views and 10em. A
  width that is no
  whole number from 320 to 4000 is refused, as every
  other `--` word but `--demo` and `--plot=` is: never skipped. A step is `click=<selector>`,
  `click=<x>,<y>`, `key=<key>`, `drag=<x>,<y>,<x>,<y>`, `wait=<milliseconds>`;
  `sdrag=<x>,<y>,<x>,<y>`, a drag with Shift held, which at a top corner of a box slopes its
  top — and, to go near in 3D, `wheel=<x>,<y>,<notches>` and `rdrag=<x>,<y>,<x>,<y>`, a drag
  with the right button
- `tools/sketch/routes.js` — the server's rule, with nothing of the network or the disk in it:
  `route(target, demo)`, the file a path gets, from this folder on, and its type — a page, a
  script or a stylesheet: `.html`, `.js`, `.css` — or null. `site.js` is a name like any other
  since T-040.4: no file of the folder has it, so the server answers 404 for it, under whatever
  case, on either pad, and nothing is made of a plot;
  `setting(arguments, environment)`, the mode and the port, or why the server does not start;
  `tools/sketch/serve.js` listens, guards, and reads the files that the rule names. The rule of
  a kept sketch's name, `keptName`, moved to `tools/sketch/store/rules.js` with T-040.5, and
  `kept`, what a request under `/kept/` was to do, went
- `tools/sketch/routes.js`, the names of a plot (ST-030), after the rules that were there and with
  nothing of the network or the disk in them either. Three constants: `PLOT_FILE`, `plot.json`,
  and `PLOT_KEEPS`, `sketches`, a plot's file and the folder of its kept sketches, in the plot's
  own folder — `tools/sketch/store/ways.js` takes both — and `EXAMPLE_FILE`,
  `tools/sketch/example/plot.json`, the made-up plot's file from this folder on. `PLOTS_IN` and
  `plotsIn`, where New plot made plots, went with the server's making (T-041.4).
  `EXAMPLE`, `OWN`, `SPACE`, `plotName`, `keptName`,
  `KEPT_ENDING` and `KEPT_NAME_MAX` moved to `tools/sketch/store/rules.js` with T-040.5, where
  the page's rules are; `PLOTS`, `plotOf` and `noPlot` went, with the kept sketches' routes. The
  key a browser keeps a plot's sketch under is the page's own, `keyOf` of
  `tools/sketch/boot.js` and of `tools/sketch/store/rules.js`: no rule of the server's says it
- `tools/sketch/routes.js`, the map's page (ST-031): `MAP`, `map`, `MAP_PAGE`, `tools/sketch/map/index.html`,
  and `NO_PAGE`, `{ status: 204 }` — and in `route`, a path under `tools/sketch/map/` gets no file
  on the made-up pad, but for the page itself, which gets `NO_PAGE` there (T-041.4); and on no pad
  under other letters than small ones: a disk may take `Map` for `map`.
  `tools/sketch/plot-routes.check.js` proves it
- **The three folders of a new plot** (ST-031), each with a note of its own, which says what
  the folder gives: this file points there, and says no more. `tools/sketch/swisstopo/`
  (`docs/sketch/swisstopo.md`): `hosts.js` — a module that imports nothing, for a page and the
  checks: whom the map's page asks, by the word `asks` of its address (`asksOf`), which origin may
  be asked at all (`mayAsk`), the page's policy (`policyOf`), the map as its service lists it, and
  every address that is asked, built there and nowhere else; `door.js`, the one way in which the
  pad asks another machine, from the map's page;
  the pad's own reader of swissALTI3D — a tile's head, its blocks in parts, the catalogue,
  and `groundOf` of `ground.js`, the ground of a box; and, test support that no page and no
  module of the pad's pages loads, the stand-in for the three services, `stand-in.js`, with its
  made-up world, and `__fixtures__/` — three copies of the parked product's, and two answers
  of the real catalogue, each folder under a note of its own. `tools/sketch/new-plot/`
  (`docs/sketch/new-plot.md`): `request.js` — a module that imports nothing: an order read or
  refused in one sentence
  (`orderOf`), the sentences of the making (`SAID`), and the folder that a plot gets of its
  name (`folderOf`, `freeOf`); `frame.js` and `plot.js`, which import it — the one
  computation of a plot: the paper of corners (`paperOf`), which the map's page loads too,
  and the plot of an order and the ground under it (`plotOf`); and `parcel.js`, a parcel read
  for the map's page — what was typed (`typedOf`), what the search lists (`parcelsOf`), and a
  parcel's boundary as the corners of an order, the outer boundary of its largest part, with
  what was left out said, or the sentence that refuses it (`boundaryOf`, ST-043). `tools/sketch/map/` (`docs/sketch/map.md`): the
  page — the map and Find (T-031.5), and on the map the marking, `marks.js`, with the naming
  and the making, `make.js` (T-031.7): a corner by a click that was no drag, the area and the
  paper as `paperOf` has them, the folder as `folderOf` and `freeOf` have it, and the plot made
  in the page at "Make the plot" and not before (T-041.3); and a parcel taken onto the marks,
  `take.js` (ST-043, T-043.5) — found by its words or its EGRID, picked of a list, or under a
  click with "Take the parcel under a click" on, its corners read by `parcel.js`
- **An order made** (`docs/sketch/new-plot.md` says all of it): `tools/sketch/new-plot/making.js` —
  `plotMadeOf`, what the map's page does with an order (T-041.3): it asks for the ground, works
  the plot out and gives the text of its file, which the page keeps and writes. The server's
  `made.js`, which wrote a plot into a folder of the server's, went with T-041.4
- `tools/sketch/offline.js` — the gate of the checks (ST-031, rule 3; under Test): loaded first, it refuses
  every connection of its process that does not go to a loopback address, written as an
  address, and adds itself to `NODE_OPTIONS` for every Node process started from there.
  `beyond(args)` is its rule alone: where a call of `socket.connect` leads, if beyond this
  machine. No page loads it, and the server does not import it
- `tools/sketch/package.json` — the pad as a member of the workspace: of type `module`, as the server and
  the checks are, with its one dependency, three.js
- `tools/sketch/3d.html`, `tools/sketch/view3d/` — the 3D page: the sketch on the ground of the plot, as its blocks of
  ground shape it (ST-027) and its cuts take it away (ST-028), shown in one of
  three ways on a stage of three.js — the Volumes, coloured solids; White, the parts a house is
  built of, white under a named sun that casts shadows; Materials, the same parts each in its
  surface, with lights and a backdrop of its own — and drawn again when another window changed
  the sketch. It reads the sketch, and writes one thing of it: a figure of the house, typed in
  its Settings, through `sketch.change` and `figures.set` (invariant 9). What its tab shows —
  the way it is shown in, its shadows, its level, its ground, where it looks — it keeps for the
  tab, through `views.seen` and `views.keep`. And "3D file (GLB)", an entry of its File menu
  — what "Save 3D file" was — in White and in Materials
  saves the parts that show as one binary glTF, `house-<day>.glb`, for another 3D program: the
  page writes it itself and hands it to the browser by a link, as "Save file" does a sketch —
  the server takes nothing, and nothing reads the file back (`docs/STORAGE_FORMAT.md`, "Export
  and import"). And beside it "Picture (PNG)", the entry before it (T-029.5), in every way of
  showing — the Volumes too: it saves the stage as it shows as `house-<day>.png` — ground,
  backdrop, shadows and all, a pixel of the picture for each of the screen's, where the 3D
  file is the parts alone — by the same link, out of the page's memory, and the page says
  the name it was saved under on its line. The levels stand left of the stage; Settings is
  a button of the toolbar that opens the figures right of it, and shut, the stage has that
  room. Modules, and the pad's only code that imports three.js (`docs/sketch/view3d.md`)
- `tools/sketch/scene/` — the sketch as a scene: what its things add up to in space, on the ground of the
  plot, as plain data for the 3D view to draw; given the figures of the house, the parts it is
  built of — floors and roofs, the walls of every room with what a door and a window open of
  them, a railing where an open floor has a drop beside it, panes in frames where a block is
  glass, the steps of a staircase, and an object as the pieces of its kind, furniture and all;
  under a top that slopes, a roof, walls and glass that follow it (ST-026);
  and what gives way: an object stands clear of the walls of its room, and a floor is open over
  a staircase that comes up to it — each made by a rule, and a rule added by a line
  (`house.js`, `objects.js`); and where the one named sun stands over the plot (`sun.js`).
  Modules that import each other and nothing else, and name no global (`docs/sketch/scene.md`)
- `site.js` — **no file, and no server makes one** (ST-030, T-040.4): the name of the plot's
  place in a page's template, which `tools/sketch/boot.js` fills with `demo-site.js` for the
  example and leaves out for a plot of the browser's store. What a page reads of its plot is
  `globalThis.SITE`, the site as every script reads it — the outline in the plot's frame, the
  ground, the notes, and where each came from — and `globalThis.PLOT`, `{ id, key, way }`: which
  plot the page shows, the key that the browser keeps its sketch under, and how it came. The
  owner's plot, which lay here as a script until 2026-10-13, is a plot's file among their data
  (`design/plots/CLAUDE.md`)
- `tools/sketch/demo-site.js` — the made-up site as a script, of the same shape as a plot's but for one
  point: a plot of 644 m²
  that does not exist, on a ground that is a plane. Written by hand, and nothing in it is
  taken from a plot of the owner's. It says no `PLOT`: `boot.js` sets the example's first, and
  every page loads it as it is where the example shows; more than twenty checks load it. The point is `house`, where the words "house today"
  stood on the
  paper: no view writes them any more (ST-029), no script reads the point, a plot's file may
  say it, and the made-up site has none. It says where it lies, `originLV95` (ST-016): the
  zero of the Swiss grid, `[2600000, 1200000]` — a made-up place, and no real plot's
- `tools/sketch/plot-file.js` — a plot's file (ST-030): the stored format `blockplot/plot`, version 3
  (`docs/STORAGE_FORMAT.md`, "The plot file — version 3"), its one reader and its writer. A
  plot's file is a site as the pad has it, field for field — `sources` among them, which
  the owner's plot says and the made-up site does not — as one JSON document, with `format` and
  `version` before it. **It says where it lies** (ST-016), or does not: `originLV95`, after
  `bearingDeg`, the place of the frame's zero in LV95 — the made-up site's `[2600000,
  1200000]`, the zero of the Swiss grid, a made-up place. **Its ground is squares** in version 3
  (ST-042): `ground.squares` and `ground.cornersCm`, read by `tools/sketch/squares.js`. It reads
  versions 1 to 3, and writes the oldest that holds the site — 3 where its ground says
  `squares`, else 2 where it says `originLV95`, else 1 — so a plot's file of before reads and
  writes back byte for byte. An ES module with nothing of Node, the network, the disk or a page
  in it: it imports `isLV95` of `tools/sketch/new-plot/frame.js` and, for its effect,
  `tools/sketch/squares.js`, and a page may load it (ST-040). `FORMAT`, `VERSION` — 3, the
  newest — and
  three functions: `read(text)`, `{ site }` — the file's own object without `format` and
  `version`, its fields in the file's order: what `globalThis.SITE` is to be — or
  `{ refused }`, one sentence, the first that holds of the format's list, to
  the letter; `write(site)`, `{ text }`, the canonical form with the fields in the order of the
  format's table — or `{ refused }`: in the reader's words what the reader refuses, and `It
  does not read back as it was written.` for what a file does not hold; `areaOf(site)`,
  square metres, not rounded — the area a plot states, and where it states none, the area
  its outline encloses. `scriptOf`, the script the server made of a plot's file, went with
  T-040.4. Whoever needs a plot out of a file asks `read`, and nothing else reads one:
  `tools/sketch/boot.js` and Open plot in the page; the server reads no plot since T-040.5
- `tools/sketch/example/` — the pad's own example (ST-030): one plot, the made-up one, as a plot's file,
  `tools/sketch/example/plot.json`, written by `write` of the site that `tools/sketch/demo-site.js` gives, and never
  by hand. So **the made-up plot lies in this folder twice** — as the script, which the
  made-up pad serves and more than twenty checks load, and as the file — and
  `tools/sketch/plot-file.check.js` holds the two to be one plot. Whoever changes the made-up plot
  changes the script and writes the file anew, in one command (`docs/sketch/example.md`)
- `tools/sketch/paper.js` — the views, and what each one's paper shows of the site, in metres and in cells;
  `tools/sketch/land.js` — how the grid and the site are drawn on it: the grid of the step
  `grid.stepAt` has of the pen's `unit`, the CSS pixels of a cell as drawn — which `grid.shown`
  is set to, the coarsest where none shows — a line every step in `#e3e7eb` and every fifth, where
  the metres are a multiple of five steps, in `#cdd3da`, each laid on a whole pixel of the screen,
  and none where `stepAt` is null; the rulers' figures at every strong line, in metres by
  `paper.exact` — every 2.5 m at 0.5 m, every 2 500 m where no grid shows — along the window's
  top and down its left side, none on its left and bottom edges, and down the left side none
  within a metre of its top or its foot (ST-042). **The paper has no edge** (T-042.3): what the
  pen is handed as `view`, the window in cells, is what the grid, its figures and a slice's ground
  are drawn over, the north arrow, the captions and the ends' words standing at the window's
  corners and foot; a pen with no `view` draws the plot's paper as before. Of a slice the line of
  the one ground and the tint under it, `#f1ebe0`, and beyond the plot's paper — where
  `paper.measured` says no — the ground flat at its nearest edge's height (`paper.groundAt`), its
  line in `paper.FAINT` and thinner, 1.5, and its tint lighter, `#f7f4ee`; and — while the paper holds a shaped ground — the site's own along the
  whole slice, a thin line under that line, with the words "— the ground as it was" (ST-027):
  over a cut the thin line runs above the line of the ground, with paper between the two, for
  the tint lies under the ground (ST-028) — no line of it changed for a cut;
  `tools/sketch/draw.js` — how the sketch is: a box
  under its top, where that slopes, and from above with an arrow down it, and on a block its
  name — or, where it has none, the category that was picked for it (`sketch.worded`); a line
  through every point of it, in their order, in its colour (ST-039); `paper.draw(canvas, { px,
  left, top, layers, cuts, picked, preview })` — **the canvas is the window** (T-042.3): as large
  as it shows, a pixel of it a pixel of the screen, the place `left`, `top`, in cells of the
  view as the screen shows its columns, at its top left corner, and `px` CSS pixels a cell drawn
  at `px × devicePixelRatio` exactly, with the window's corner and each box's edges on whole
  pixels; from above all of the window `#f4f5f7` and the plot's paper white on it — neither
  while `under.shows()` says that swisstopo's map lies under the paper, whose pictures
  `under.lay()`, called after each draw, lays in `#under-map` under the canvas
  (`docs/sketch/under.md`) — in a slice white; the marks of what is selected and the stroke in progress by
  `tools/sketch/draw-marks.js`, `globalThis.marks` — `take(pen)`, `arrow`, `mark`, `stroke` —
  loaded by `index.html` right after `draw.js` (ST-042);
  `tools/sketch/zoom.js` — what the window shows: `zoom.px`, on the rungs of `grid.LADDER`, from
  0.006 to 32 screen pixels a cell, and `zoom.left`, `zoom.top`, the place at its corner.
  `place(left, top)` puts it there, on whole pixels; `to(px, x, y)` goes to the rung at or
  under `px` and keeps the point under the pointer, or the window's middle, where it was;
  `by(dx, dy)` moves it by so many CSS pixels; `fit(rects)` takes the largest rung at which the
  plot's paper and the rects, in cells, fit both ways, and puts them in the middle; `drawn()`,
  the rects of what the view shows — its things and its lines. `#smaller` and `#larger` go a
  rung at a time (`grid.next`), and `#fit`, "Zoom to fit", fits the paper and `drawn()`. **The
  wheel moves the paper** — down and up, with Shift sideways — and Ctrl with the wheel zooms, a
  rung at a time, at the pointer; the middle button dragged, or the left with Space held, drags
  the paper, and no tool hears it. The first time the largest rung at which the plot fits from
  left to right, at the paper's corner, and a zoom the tab kept that is no rung the rung under
  it; the tab keeps the place as it kept the scroll, in cells, under the same keys (ST-042)
- `tools/sketch/grid.js` — the grid shown and the zoom's rungs (ST-042), `globalThis.grid`: a
  plain script with no page in it, loaded by `index.html` after `paper.js` and before `land.js`.
  `STEPS_M`, `[0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]`; `APART_PX`, 8; `STRONG`, 5; `LADDER`,
  the 29 rungs from 0.006 to 32, 8, 10 and 20 among them; `rung(px)`, the rung at or under a
  number, the first under the first; `next(px, by)`, the rung `by` rungs on, held to the ends;
  `stepAt(unit)`, the finest step whose lines stand `unit × step / cellM` pixels apart, at least
  `APART_PX` (compared within 1e-9), or null; `shown`, the step the paper was last drawn with —
  0.5 until it is drawn, 500 where it shows none — **what a click snaps to** (Rule 2);
  `floor(place, axis)` and `round(place, axis)`, of a place of the plane's paper in cells along
  it (0) or up it (1), the line of the grid shown at or before it and the nearest: the lines lie
  where `paper.metres` are a whole multiple of the step, so on whole cells (Rule 1). A flipped
  view counts its cells as an unflipped one
- `tools/sketch/paper.js`, the readers of a colour, on every page (ST-039): `COLOURS`, the pad's
  eleven, `[name, hex]` by their number; `paper.isOwn(colour)` — a colour of the owner's, a text
  `#rrggbb` in small letters; `paper.named(colour)` — `[name, hex]`: of the eleven their entry,
  of a colour of the owner's its value twice, of anything else ink's; and `paper.hex(colour)`,
  its hex. Whatever draws or names a colour asks these: the paper, the areas under it, the
  swatch and the 3D page
- `tools/sketch/own-colours.js` — the owner's colours, `globalThis.ownColours` (ST-039): the one
  reading of the list `colours` of the sketch and its two steps, the format's only writers, on
  the pad's page alone, after `tools/sketch/paper.js` — no page in it, and nothing read as it
  loads. `MOST`, 30, the characters of a name at the most; `of(doc)`, the colours of the list in
  their order, each `{ name, value }`, read leniently: an entry that is no such name and value,
  or that is alike one listed before it, is not listed and refuses no file; `called(colour,
  doc)`, the name the pad shows — of the eleven theirs, of a listed value its name, of another
  value the value, of anything else `ink`; `add(doc, text, value)`, `{ name }` written at the
  end of the list, or `{ refused }` in one sentence with nothing written; `using(doc, value)`,
  `{ blocks, lines }` in that value, the boxes of one `group` one block; `remove(doc, value)`,
  its entry taken off the list — and the list where none is left — with nothing drawn
  changed. `add` and `remove` are called in a `sketch.change`: one step each. Modelled on
  `tools/sketch/sections/model.js`
- `tools/sketch/paper.js`, the one ground that every view asks (ST-027), on every page: the site's own, as
  the blocks of ground of the sketch shape it, and its cuts (ST-028). `settle(things)` — a
  sketch's things as the sketch holds them, `sketch.doc.things`, and not as a view places
  them — has the ground be as they shape it, and says whether it worked the ground out anew:
  only where a box of ground changed, or a box of a cut — where it lies, or its floor, and
  not how high it reaches — or, while there is one of either, where a box of the house lies.
  A page calls it when
  its sketch changed, before it asks the ground — the pad's page in the first line of `refresh`
  of `tools/sketch/page.js`, the 3D page in `read` of `tools/sketch/view3d/read.js`, before it reads a thing: the two
  places, and no third; `shaped()` is the grid it then holds — `heights[row][column]`, metres above
  sea level at every grid point of the top view's paper — or null while the ground is the
  site's own, **and on a paper that is not `WHOLE`**, where `settledIn()` gives the windows that
  were settled, `[{ rect, heights }]` (on a `WHOLE` paper the empty list); `groundAt(column, row)` and `groundRow(column, row)` are that one ground at a
  place — in a window `heightAt` of its heights, elsewhere the site's own;
  `realAt(column, row)` and `realRow(column, row)` the site's own, whatever was
  settled — of a plot of version 3 `baseM + cmAt / 100` of its squares, `earth`'s own
  expression, so that a held point is the site's very number. Until a page calls `settle`, and with no block of ground and no cut, `groundAt` is
  `realAt`, to the last figure — and so it is where no block is ground and no cut bites.
  Beyond the top view's paper each is the ground at its nearest edge. `measured(column, row)`
  says whether a place lies on that paper, its edges within — where the ground is measured, and
  past them it is not (T-042.3). And of a plot of any size (ST-042): `WHOLE` — true where the paper is at most
  `windows.WHOLE_M`, 120 m, along and across, and on a page without `windows.js`; `land(rect)`
  — the site as `earth.shaped` reads it, cut to a rectangle `[left, top, right, bottom]` of the
  top view's paper in cells, its ground `rowsCm` of the grid's own texts — of the whole paper of
  a plot of version 1 or 2 `SITE` itself, the very object; each rectangle made once while it is
  in use; `grid()` — the site's own ground at every grid point, `heights[row][column]`, made
  once, of a `WHOLE` plot of version 3 alone, and else null: what `tools/sketch/view3d/read.js`
  hands on where nothing is shaped. `siteFaults()` of a plot of version 3 holds its lowest and
  highest corner against `sideM`. Settled on a paper that is not `WHOLE`, the ground is worked
  out in the windows of `tools/sketch/windows.js`, each by `earth.shaped(land(window),
  windows.shifted(things, window))`.
  Whoever wants the ground asks these, and never `tools/sketch/earth.js`
- `tools/sketch/squares.js` — the ground as squares (ST-042), `globalThis.squares`: a plain script
  with no page, no disk and no network in it, loaded by the three pages before `paper.js` and
  imported for its effect by `plot-file.js`. `TOLERANCE_CM`, 5; `make(cm, cols, rows)` —
  `{ squares, cornersCm }` of a height in centimetres over `baseM` at every grid point, a row
  after another from the top, the tree made within 5 cm, iteratively; `fault(ground, cols,
  rows)` — the sentence of the format's list that holds of a ground of version 3 whose fields
  are of their kinds, or null; `read(ground, cols, rows)` — `{ cmAt, lowest, highest, count }`
  of a ground that `fault` passed: the ground at any place of the paper in centimetres over
  `baseM`, clamped to the paper, the lowest and highest corner, and how many squares of ground,
  held in typed lists; `walk(tree, visit)` — every square of a tree that `read` gave, depth
  first, `visit(column, row, size, ground)`, a split square's quarters only where it returned
  true (T-042.5 cuts the far ground by it)
- `tools/sketch/windows.js` — the ground in windows (ST-042), `globalThis.windows`: a plain script
  loaded by the pad's page and the 3D page before `paper.js`, with no page in it. `REACH_M`, 40;
  `WHOLE_M`, 120; `shapers(things)` — `[left, top, right, bottom]` in cells of every box whose
  block counts as ground or as a cut, a `group` asked once; `around(rects, reach, bounds)` —
  each widened by `reach` cells, cut to `bounds` where given and dropped where that leaves no
  cell, and those that overlap or touch merged until none do, ordered by their top and then
  their left; `shifted(things, rect)` — the boxes moved onto the window's paper, a slope with
  them, no object
- `tools/sketch/earth.js` — the rule that shapes the ground (ST-027), on both pages, with no sketch, no
  paper and no page in it: `earth.shaped(site, things)` gives null where nothing is shaped,
  and else `{ heights, sweeps }` — the ground at every grid point, and the sweeps of its
  workings out. Over a block of ground the ground is its top, level or sloping, of two the
  higher; on
  the outline of the plot and outside it, the site's; between the two a grid point lies as far
  over the site's ground as the mean of its neighbours does — and the house holds the ground
  back: no ground is worked out through a block of the house, a room, open air or glass. A
  cut is neither ground nor of the house, and takes ground away (ST-028): the ground is
  worked out without the cuts first; under a cut it is then the cut's floor wherever that
  first ground lay higher — the hill, or what a fill made of it — of several cuts the lowest
  floor; and the ground is worked out once more, from the start. Nowhere does it lie higher
  than without the cuts; only the floor of a cut counts; and nothing is shaped where no cut
  bites and no block is ground. `sweeps` is of both workings out, twice `SWEEPS_MOST` at the
  most. Its head says the rule in
  full, in its own words — a cell of the house, a cell of the plot, the four kinds of grid
  point and their order, and the cut. `earth.shapedBy(things)` is what of the things shapes
  the ground, as a text — with a third part, the cuts, where the sketch has one: by it the
  paper tells whether to work the ground out anew. And three constants that
  say how exactly it is worked out, none a figure of the design: `OVER`, `SETTLED_M`,
  `SWEEPS_MOST`. It reads a site's ground as `rowsCm` alone: of a plot of version 3, and of a
  window of a paper that is not `WHOLE`, the paper hands it `paper.land(rect)`, a site of that
  rectangle with the grid's own texts (ST-042) — earth.js did not change for it
- `tools/sketch/sketch.js` — the sketch: one space of things, its layers on each plane, how large a block is
  — under a top that slopes, too — undo, what is kept — and what is set aside before:
  `sketch.unread()` gives the texts that the browser keeps as a sketch and a pad could not
  read, `{ aside, waiting }` (invariant 9). **It keeps by plot** (ST-030): `sketch.KEY` is
  the key that the page's plot says, `globalThis.PLOT?.key` — the example's
  `blockplot/sketch/plot/example/space` since T-040.4, on either pad — and the first key,
  `blockplot/sketch/space`, the plot `home`'s, and where a script runs with no `PLOT`: in
  every check that loads `tools/sketch/demo-site.js` alone. The sketch, and every text that is set aside for
  it, are that key's; the sketches of before are the first key's alone; and a tab's steps
  to undo are one plot's, the one it shows (invariant 9)
- `tools/sketch/categories.js` — the categories a block can have (ST-028), on every page, with no sketch, no
  paper and no page in it: it reads nothing as it loads. `LIST`, the pad's one list of thirty
  rows, each `{ key, name, as, words }` — the word a box says under `category`, the name the
  pad shows, what a block of it counts as, and the words a name is read by; and `of(boxes)`,
  the one reading of what a block is: `{ category, by }` — a row of the list, or null where
  the block has none, and `'picked'` or `'name'`. A category that a box says comes before the
  name; a name is read first by what its words count as — ground, a cut, glass, open air, a
  room — and then by the word that stands first in it. Whoever needs a block's category asks
  this, and reads no `category` and no name itself. The list is the owner's to grow, by a row
  or by a word for a room; a key is what a kept sketch says, and is never renamed or taken
  away. And a name is no longer free to change: it is what the pad shows, and what the 3D view
  reads once a category was picked (T-028.6) — rewording one, or adding a row, turns
  `tools/sketch/view3d/picked.check.js` red until someone says what its floor is
- `tools/sketch/category-list.js` — the list of categories beside the paper (ST-028), right of it since
  ST-029, on the pad's page
  alone: with a block selected, under the pad's words of it, a row, `#category-row`, that
  holds a list, `#category`, and under it the sentence of `tools/sketch/footer.js`, `#category-said`. The
  list has "by its name" first, with no word for a value, and then the thirty rows of
  `categories.LIST` in five groups, by what they count as. It stands at the category that
  was picked for the block, and at its first entry while none was — and that entry reads
  what the block's name gives: "By its name: Kitchen", "By its name: no category". A pick
  goes to `sketch.categorise`, the first entry with no word, which takes the category away.
  `categoryList.show(thing)` is its one way in: `refresh` of `tools/sketch/page.js` hands it what is
  selected, after every change, and of nothing and of an object the row is hidden. The list
  is a field (`views.typing`): it gives the focus back once a category is picked, and on
  Escape; and the key **K** takes the focus to it and opens it. The script makes its parts
  itself, as `tools/sketch/kept.js` does, and adds no rule to the stylesheet
- `tools/sketch/swatch.js` — the colour of the selected block, right of the paper (T-029.3), on the pad's
  page alone: under the list of categories a row, `#swatch-row`, that holds the swatch,
  `#swatch` — a button in the block's colour, read out as "Colour: red" — beside it the
  colour's name, `#swatch-name`, and the colours, `#swatch-palette`: a menu of that button
  (`views.menu`), with a button for each of the eleven colours of `paper.COLOURS`, in the
  list's order, `[data-colour="<its place>"]`, in its colour and under its name — and after
  them one for each colour of the owner's, in the order of the sketch's list
  (`ownColours.of`), `[data-colour="#rrggbb"]`, read out by its name, written anew at every
  `show` (T-039.3). The swatch shows the colour of the box that is selected, as the paper
  draws it — a colour the pad has not is its first, ink — beside its name, `ownColours.called`:
  of a listed value its name, of a plain one its value; and that colour is marked in the menu
  with `aria-current` — of the eleven by its name, of the owner's by its value, a plain value
  nowhere: pressed is said of a tool. Nothing is added to the list here, or taken off it. A pick goes to the one writer of a colour,
  `sketch.paint` of `tools/sketch/strokes.js`: every box of the block, one step, which Undo takes back —
  and to nobody else: the colour that Block draws in is the palette's (`tools/sketch/palette.js`),
  and stays what it was.
  `swatch.show(thing)` is its one way in: `refresh` of `tools/sketch/page.js` hands it what is selected,
  in the line after it hands the list the same, and of nothing and of an object the row is
  hidden and the menu shut, by the `shut` that `views.menu` returned — but where no thing is
  selected and a line is (`globalThis.lineTool?.picked()`, asked in `show`), the row is the
  line's: its colour, its name, the menu with it marked, titled for a line, and a pick recolours
  it, `lines.recolour` in one `sketch.change`, which Undo takes back (ST-039, T-039.4;
  `tools/sketch/lines/CLAUDE.md`). The script makes its parts itself and puts the row before
  `#none-picked`; its look is `tools/sketch/colours.css`'s, and its row's `tools/sketch/pad.css`'s (Gotchas)
- `tools/sketch/palette.js` — the toolbar's colours, `globalThis.palette` (T-039.1, T-039.3), on
  the pad's page alone, after `tools/sketch/swatch.js` and before `tools/sketch/pointer.js`. It
  makes, in `#palette`: `#colour`, a round button in the colour to draw with, read out by its
  name (`ownColours.called`), titled "Draw a block in <name> (B: in the colour picked last)",
  pressed where Block is the tool; `#colours-open`, `▾`, read out as "Colours", which opens and
  shuts the menu `#colours` (`views.menu`); and in it the eleven, in two rows, each read out by
  its name — then `#own-colours`, the owner's list in the sketch's order, a row each of a
  button that picks the colour, `[data-colour="#rrggbb"]`, a round swatch and the name, and a
  button `×`, "Take <name> off the list"; more than eight scroll, and a sketch that lists none
  has no row — then "Add a colour", a label round `<input type="color" id="colour-chooser">`.
  The colour to draw with is marked (`aria-current`) in the menu. The colour to draw with is one
  of the eleven by its number, or a value of the owner's, listed or not; the tab keeps it under
  `colour`, and anything else it kept is red. A pick in the menu leaves Line on where Line is
  the tool, and is Block with any other; a click on `#colour` is Block whatever the tool was. A
  colour chosen in the chooser (its `change`) asks for a name — `prompt('Name of the new
  colour: up to 30 characters')` — and is added by `ownColours.add`, in one `sketch.change`,
  and picked; a refusal is said in the alarm (`sketch.trouble`), nothing written; no name given,
  nothing is. A `×` takes the colour off by `ownColours.remove`, in one step; where something
  is drawn in it (`ownColours.using`) the pad asks first — "2 blocks and 1 line are in "<name>".
  They keep its colour, with no name. Take "<name>" off the list?", with the words for one and
  none of a part that is nought — and on no takes nothing off. What is drawn in it keeps its
  value (Rule 3); a colour to draw with taken off stays, with no name. `palette.colour()`, the
  colour to draw with; `palette.show(tool)`, which `refresh` of the page calls with the tool,
  and which writes the button anew, and the list where the sketch lists other colours than it
  shows — so an Undo, Open file and another window's change show; `palette.onPick`, which the
  page sets, and which a pick calls with the tool it leaves on, `'line'` or `'block'` — the
  palette says the tool after a pick, and the page takes it. Its look is
  `tools/sketch/colours.css`'s; its check `tools/sketch/palette.check.js`
- `tools/sketch/object-high.js` — the height of the selected object, right of the paper (T-035.8),
  on the pad's page alone: a row, `#object-high-row`, a label that holds a field for figures,
  `#object-high`, and the words "m high". It shows for an object whose kind takes a height — a
  `high` in its row of `shapes.TAKES` — its field holding the object's height,
  `shapes.sizeOf(thing)[2]`, with `min` and `max` the kind's range and `step` 0.05; for a
  block, any other object and nothing it is hidden. A height is set on the field's `change`,
  Enter or the focus leaving: what is no number or not above nought changes nothing; anything
  else is held to the range and rounded to 5 cm, and where that is not the height the object
  has, one `sketch.change` — one step, which Undo takes back — writes `high`, or removes it at
  the kind's own. A staircase's length follows, on every plane (`shapes.sizeOf`). The field
  then gives the focus back, as `#high` of the toolbar does: while it has it, every key is its
  own (`views.typing`). `objectHigh.show(thing)` is its one way in: `refresh` of
  `tools/sketch/page.js` hands it what is selected, in the line after the gallery's. The script makes
  its parts itself and puts the row before `#none-picked`, after the swatch's — the row of
  `tools/sketch/sections/list.js` goes in between; its look is the swatch row's, in `tools/sketch/pad.css`
- `tools/sketch/strokes.js` — what a tool does to it, and what an object that is set down or moved in a
  slice stands on (`standOn`): of the ground and of the floors and tops of the boxes at its
  place, the nearest — but no floor and no top of a block that counts as a cut, so what
  stands in a cut stands on the ground (ST-028) — and, from above, an object grabbed at an end, a
  side or a corner that its kind may be sized by, which `grab` has of `sketch.endOf` and `put`
  sizes by `sketch.stretch`
  (`tools/sketch/stretch.js`, each asked for with `?.`, so a page or a check without it moves every
  object as before) — and `sketch.placed(key, to, turned)`, the object that a click of Object
  sets down, its middle at `to`: of the key's kind, or, where the key is a start's
  (`shapes.STARTS`, ST-035), of the start's kind with its `sizes` — `{ kind, …place, turn?,
  …sizes }`, so a single bed is a bed with `"deep":1` from its first step; where no start is
  loaded — a check without `tools/sketch/object-groups.js` — the key is the kind, as before. **A
  line** (ST-039, T-039.2): `sketch.apply({ tool: 'line', points, colour, at })` writes it of its
  `points`, two or more, and of no `from` and `to` — `{ view, at: at ?? <the layer drawn on>, line:
  lines.made(points, colour) }`, one step; the stroke's `shape` gives `cells` and `reach`, and no
  line's ends. **The grid shown** (ST-042): `shape`'s `cells` are the squares of `grid.shown` that
  the stroke touches — a box drawn and the Eraser's box — from `grid.floor` of its low corner to
  one step past that of its high one, and `moved` lands a box's dragged edge or corner on
  `grid.round` and moves a block by whole steps; an object goes by the cell, as do Paste and the
  keys. Where `grid.js` is not loaded — a check — every cell is a line, as before. **No edge
  holds them** (T-042.3): a box drawn, moved or resized keeps every cell it was given, past the
  plot's paper too — `blocks.reshape` keeps a box one cell at the least and nothing else — and a
  box drawn in a slice is 6 m deep about the slice, and one drawn from above as high as asked,
  wherever that takes them; and the eraser asks `lines` — `here`, `crosses`, `within` — of a note that is a
  line alone: a click takes one where any segment passes within its reach, a dragged box one
  that lies wholly in it, a line on every level from any level, and none its switch hides — the
  rest in `tools/sketch/lines/CLAUDE.md`;
  `tools/sketch/levels.js` — what is done to a whole level;
  `tools/sketch/labels.js` — the names of blocks, the labels that lie loose, and `sketch.count(thing, as)`:
  what a block is set to count as, on every box — C steps the selected block on, six steps
  round: by its category or its name, a room, open air, glass, ground, a cut; and of a
  category (ST-028) `sketch.categorise(thing, key)`, its one writer — a key of the list on
  every box of the block and `is` off every box, for the category says what the block counts
  as; with no key the category off every box, and `is` left as it is — and
  `sketch.worded(thing)`, the word that stands on a block without a name: the name of the
  category that was picked for it. `tools/sketch/blocks.js` — a
  box grabbed, moved, resized, cut out of another, outlined and measured with its block, and
  `countsAs(boxes)`: a block as a `room`, `open` air, `glass`, `ground` or a `cut` —
  `{ as, by }`, the one answer to what a block counts as (ST-027, ST-028): by its boxes' `is`;
  else by its category, `by: 'category'` where one was picked and `by: 'name'` where its name
  gave it, or gave none — a room then (`categories.of`, asked when a block is read, and not as
  the script loads). Whoever needs it asks this, and reads neither `is`, nor `category`, nor
  a name itself
- `tools/sketch/slopes.js` — a top that slopes, pulled with the pointer (ST-026): with Select, in a standing
  view and with Shift held, a top corner of a box is pulled by whole rows. That end of its top
  goes as many rows down or up as the pointer went, from where it lay — no higher than the
  box's top, no lower than its floor — the other end lies at the box's top, and the box says
  its `slope` anew, from its own two ends along that view's paper: or says none, pulled back
  up. `sketch.pull(stroke)` does it, inside the one change that `sketch.apply` makes, and says
  whether the stroke was a pull; `sketch.pulled(stroke)` is what the paper shows meanwhile,
  the line of the top as it will be. Without Shift a corner makes the box larger, as ever
- `tools/sketch/stretch.js` — an object dragged to its size (ST-034, ST-035, ST-037): with Select, in the top view, an
  object is dragged by whole cells, the far side staying, as a block is resized — by an end along
  its length where its kind takes a `long` in its row of `shapes.TAKES`, by a long side where it
  takes a `deep`, by a corner both where it takes both. A staircase takes both (ST-037): its side
  widens it, its end lengthens it. Whatever else is grabbed — an end or a side its kind takes
  nothing for, the middle, a kind of no row, any slice — moves it as ever, and a move leaves every
  size it says as written. `sketch.endOf(thing, zone)`: the letters of a zone of `blocks.grab`
  that the object is dragged by — of its length `e`/`w` along the plot and `n`/`s` turned a
  quarter, of its depth the other two — or `'move'`. A corner keeps both letters only where the
  kind takes both and the object is more than a cell each way: one a cell deep counts it as the
  end it lies at, one a cell long as the side. The cursor then is a block edge's or corner's,
  by the zone. `sketch.stretch(thing, rect)`: along each way that a rect of the top view is
  longer or shorter than the object, lays that extent onto it, held within its kind's range and
  to whole half metres — `long` or `deep` where it is not the kind's own, none where it is, but a staircase's `long`
  always: dragged at its end, a staircase says its length from then on, its kind's own 4.5 m too,
  for one that says none is as long as its flight (`shapes.FLIGHTS`) — and
  gives back the rect it then has, shortened where it was held at the edge that moved; a way the
  rect is as long as the object is left as written; of any other object and in a slice the rect
  as it was, and nothing done. `put` of `tools/sketch/strokes.js` lays the middle from that rect,
  inside the one change that `sketch.apply` makes
- `tools/sketch/blocks.js`, the one reading of a top that slopes (ST-026), on every page and with no sketch
  and no paper in it — `slopeOf(box)`: what a box says under `slope`, `{ axis, at, z }` — the
  axis the plane falls along, `'x'` or `'y'`, its two lines of the paper's grid and the row of a
  standing view the top lies in at each — or null, and null for all that is no slope;
  `topOf(box)`: `{ axis, rows }`, the row the top lies in at the box's own two ends along that
  axis, on that plane and held between the box's top and its floor — or null where the top is
  level; `highOf(box)`: how high the box is from end to end, in rows, under a slope the mean of
  its two ends. Whoever needs a slope asks these, and reads no `slope` itself. `remains(box)`:
  whether a slope leaves anything of a box — nothing where its plane lies in the row of the
  box's floor, or lower, at both of the box's own ends — which `erase` and `merge` of
  `tools/sketch/strokes.js` ask of the pieces of a cut, to lay no box over a slope (Gotchas). And what the
  pad works out of one: `carried(was, now)`, a box as it is to lie with its slope where the
  box went — moved, the plane is moved as far; its top edge moved, the two rows go with it; an
  end made longer or shorter, or its floor moved, the plane stays — which `put` of `tools/sketch/strokes.js`
  and `shiftLevel` lay every box through; `topOn(box, plane)`, what a plane shows of a top:
  `ends`, the row it is drawn in at the left of the box's rect and at the right — where the
  view looks along the slope the higher end at both, with `low` for a line across — and from
  above `falls`, the step on the paper that leads down it; `fills(box, plane, rect)`, what a
  box fills of a plane as its rect there says it lies — the rect, and after it those two rows,
  the rect's own top where the top is level and from above; and `covers(box, plane, rect)`, how
  many cells that is. One shape for the picture and for the number: `tools/sketch/draw.js` fills it and
  draws the edge of a block round such shapes, `tools/sketch/layers.js` says how much each colour covers by
  it, and `tools/sketch/footer.js` says which way a top falls by `topOn`
- `tools/sketch/figures.js` — the eight figures of the house, on every page: `FIGURES`, each with its
  default and its range; `of(doc)`, every figure of a sketch; `typed(name, text)`, `{ value }`
  or `{ refused }` in words; `set(doc, name, value)`, which writes one into `doc.figures`
- `tools/sketch/shapes.js` — the objects: to judge size by, and stairs — a staircase of 1 m, a wide one of
  1.5 m, `widestairs`, drawn as the first is, and a spiral one — doors, windows, a kitchen, a
  bathroom, furniture, a garden — a kind is a row of `KINDS` and a shape for each view, whichever file
  draws it. What a kind takes is one table, `shapes.TAKES` (ST-034, ST-035, ST-037): for each kind
  that may be sized, `{ long?, deep?, high? }`, each `[from, to]` in metres — the story's table
  of sizes, `docs/STORAGE_FORMAT.md`; `[0.5, 6]` of `long` for `cupboard`, `sideboard` and
  `shelf` — and an object of it may say `long`, `deep` and `high` within those, a length and a
  depth in whole half metres, a height in whole 5 cm. A kind with no row takes nothing. A
  staircase, `stairs` or `widestairs` — `shapes.FLIGHTS` — takes a `long` of 2 to 8 m, a length
  of its own; one that says none is as long as its flight, worked out from its height — the fewest steps of which none rises more than `shapes.RISE_M`, 0.19 m, the
  scene's `RISE_M` said a second time, each 0.28 m deep, rounded up to a whole half metre: 4.5 m
  at 3 m, 4 m at 2.5 m. `shapes.sizeOf(t)` gives an object's size in metres, along the plot,
  across it, up — its own `long`, `deep` and `high` in the place of its kind's, a staircase that
  says no length as long as its flight, turned by a quarter across; `shapes.known(t)` is whether the pad reads an
  object as it says itself: a kind of `KINDS`, and each of `long`, `deep` and `high` absent or
  a number of a whole step that its kind's range in `TAKES` holds — what `sketch.adopt` asks of
  every object, so that a file with any other is refused whole.
  `shapes.draw(ctx, thing, view, box, ink, hair)` draws an object into its box on a plane's
  paper: a drawing is given the pen, whether it is seen from its end, and its object's size as
  it lies unturned, `[long, deep, high]` in metres — `sizeOf` of it taken as not turned
  (T-035.1). `tools/sketch/stairs.js` — the staircase, the wide one and the spiral one, out of
  `tools/sketch/shapes.js` to make room there for sizes (T-035.1); and how many steps a straight
  staircase has, `shapes.stepsOf(thing)` → `{ count, rise, going }` in metres, or null of what
  is no flight (ST-037): of one with a length of its own, n the whole number nearest (2 × height
  + length) / `STRIDE_M`, 0.63 m, at the least two, each rise height / n and each going length /
  n — 20 steps of 15 cm by 32.5 cm at 3 m high and 6.5 m long; of one that says none, the steps
  it was always built with. `STRIDE_M` is a figure of comfort, read off no building rule, said a
  second time in the scene's `scene/steps.js`, and `scene/flight-steps.check.js` holds the two to
  one count;
  `tools/sketch/kitchen.js`, `tools/sketch/bathroom.js`, `tools/sketch/garden.js` — a tree, a bush, a fountain, and the garden's furniture: a bench, a garden table, a sun lounger, a parasol, a grill —
  and `tools/sketch/furniture.js` — the bed, the furniture and storage, a bed with one pillow under
  1.5 m wide and two from 1.5 m (T-035.4); a sofa, a corner sofa, a table and a desk (T-035.7),
  a wardrobe and an armchair (T-037.3) drawn by their size in metres, each piece as thick at any
  size as at its own, as the kitchen's sink and the bathroom's washbasin and towel rail are by
  their length in `kitchen.js` and `bathroom.js`, which `shapes.js` hands a drawing in metres —
  the bed's kind named "Bed", for a bed dragged to 1 m is no king-size bed (T-035.6) — the shapes of those, each adding to `SIDE` and `TOP`,
  loaded in that order after `tools/sketch/shapes.js` (T-034.1, T-035.1); `tools/sketch/legacy.js` — the sketches of before, brought over
- `tools/sketch/object-groups.js` — the groups of the objects (ST-029), written once, beside the kinds:
  `shapes.GROUPS`, six in the order of the gallery, each `{ name, kinds, tiles }` with its kinds by
  their keys in `shapes.KINDS` — Doors, windows and stairs; Kitchen; Bathroom; Furniture;
  Garden; People and cars — as the table `TABLE` of the script names them, row for row: every
  kind in one group and in no second; a kind's name and its size stay `KINDS`' own. And the
  named starting sizes (ST-035), `shapes.STARTS`: a start a key, `{ name, kind, sizes, place }`
  — `singlebed`, "Single bed", a `bed` with `{ deep: 1 }`; `doublebed`, `{ deep: 1.5 }`;
  `kingbed`, "King-size bed", `{}`, each in the place of `bed`; and `widestaircase`, "Wide
  staircase, one storey", a `stairs` with `{ deep: 1.5 }`, in the place of `widestairs`. **A start
  is no kind** (Gotchas): its key is no key of `KINDS`, and no file says it. A group's `kinds`
  are the kinds, `widestairs` and `bed` among them, as ever — what the 3D page's switches read
  (`tools/sketch/view3d/read.js`); its `tiles` are those kinds in order, each replaced by the
  starts in its place where it has any: what the gallery shows, forty-three. It reads nothing
  as it loads but `shapes`, and knows no page
- `tools/sketch/gallery.js` — the gallery of the objects, right of the paper (T-029.4), on the pad's page
  alone: `#gallery`, hidden at first, which the script makes itself and puts after
  `#selected`. For each group of `shapes.GROUPS` a part with its heading and, under it, a
  tile for each of its `tiles`: a button `[data-kind="<key>"]` — a kind's key or a start's
  (ST-035) — that holds a small canvas —
  the picture — the name and, under the name, the size, as the list of kinds said
  it: `2 by 1 m, 0.8 m high`. A start's tile has the start's name, and the size of its kind
  at its sizes, `shapes.sizeOf({ kind, …sizes })`: "Single bed", `2 by 1 m, 1 m high`. **A
  picture is the pad's own drawing of the object from
  above** — `shapes.draw`, in the paper's ink and with its thin line, as `tools/sketch/draw.js` asks it,
  of an object that is not turned, a start's at its sizes: a single bed with one pillow — fitted into its square by its size along the
  plot and across it, in proportion and with a margin: a window is a thin bar, a tree a
  circle. No image, and nothing that the paper does not draw. `gallery.show(kind, open)`
  is its one way in: `refresh` of `tools/sketch/page.js` hands it the tile's key that a click sets down and
  whether Object is the tool, in the line after the swatch's. It marks the tile of that
  key as picked, `aria-pressed`, and no other; writes the tile's picture and its name
  into the button of the Objects group, `#object-picture` and `#object-name`; says every
  size anew — a door's and a window's are the figures of the sketch at that moment — and,
  `open`, shows `#gallery` and hides `#selected`, and else the other way round. A click on
  a tile calls `gallery.onPick(key)`, which the page sets: the script decides nothing
  itself. Its look is `tools/sketch/pad.css`'s: a tile a row, the picture 44 pixels square, and a
  heading that stays in sight over its group's tiles while the side is scrolled (Gotchas)
- `tools/sketch/layers.js` — the levels, or a view's slice, left of the paper (`#left`), with the hint
  under them — the two arrows of a level, whose text is a sign, are read out by what their
  titles say —
  in a standing view it says, last, how a block shapes the ground and how a cut takes ground
  away: all that tells the owner how (ST-027, ST-028) — and under the paper how much the
  blocks of each colour cover of the layer drawn on: of a box what the paper fills of it
  (`blocks.covers`), under its top where that slopes; the eleven by their number, then the
  owner's colours by their value, each dot in `paper.hex` of its colour (ST-039). `layers.lit()`,
  what the paper draws, has from above the lines on every level that their own switch does not
  hide after the notes of the layer drawn on, at its strength, whatever any level's eye says —
  and none while a section is picked; they are on no layer's count and make no level, and where
  there are none it is `layers.drawn()` itself (T-039.4, `tools/sketch/lines/CLAUDE.md`);
  `tools/sketch/footer.js` — what is said in
  words: of the pointer's place — and while a line is drawn, the segment being placed, `— 4.25 m
  at 30.0°`, by `lines.measured` as the view shows the paper (ST-039, T-039.2), and where the
  pointer lies beyond the plot's paper, `paper.measured` of its place on the top view's paper
  saying no, ` — no measured ground here` last (ST-042) — of what is
  selected — of a block, what it counts as and by
  what; of a box whose top slopes, which way it
  falls and how high its two ends lie, and in a standing view how a top is sloped; of a
  block of ground no floor, no height and no volume, but one sentence on its top, in metres
  above sea level: how high it lies, or which way it falls and where its two ends lie; of a
  cut where its floor lies, and no word of its top; and of every block its category,
  `footer.picked(thing).category`, a sentence of its own beside `words` and `label` — which
  one and by what, or that it has none — that stands under the list of categories. Of a
  straight staircase its steps, as `shapes.stepsOf` counts them, "20 steps, each 15 cm by
  32.5 cm", its rise by its going: under the paper with the pointer on it, and in the words of
  it selected (ST-037). And of several things selected, `footer.several(things)`, `<n> things
  selected: Delete erases them, and the right button acts on all of them.` — and '' of one or
  none (T-037.6);
  `tools/sketch/files.js` — save, open, picture, and
  `files.offer(alarm)`: every text of `sketch.unread()` as a file, by a button in the alarm;
  `tools/sketch/kept-ways.js` — Keep and Open kept's first half, with nothing of the page in
  it (T-040.5): `keptWays.where(at)`, `keptWays.keep(name, text, at)`, `keptWays.list(at)`,
  `keptWays.open(entry, at)`, `keptWays.refusal(name)`, `keptWays.offered(now)`, `keptWays.says`
  and `keptWays.RULE` — each handed `at`, the page's plot `{ id, way }`, the store's `held` and
  `ways` and, to open, the page's `sketch` and `legacy`;
  `tools/sketch/kept.js` — the two buttons, which the script makes itself and puts into the
  File menu, each after its like — `#open-kept` after `#open`, `#keep` after `#save` — and
  their window, `#kept-window`, with `#kept-name`, `#kept-where`, `#kept-list` and `#kept-said`;
  it loads `store/held.js` and `store/ways.js` as a button asks, and gives `kept.keep(name)`,
  `kept.list()`, `kept.open(entry)`, `kept.refusal(name)`, `kept.offered(now)` and `kept.needs`,
  what the page lacks where it is opened from its file;
  `tools/sketch/open-plot.js` — Open plot: the entry of the File menu and the window of the plots, and
  after it the entry "New plot", where `GET map/index.html` answers 200;
  `tools/sketch/open-plot-ways.js` — the window's two ways in, a plot's folder and a plot's
  file (T-040.3); and
  `tools/sketch/boot.js` — every page's first script: its plot, the tab's or the one shown last, and its scripts (all above);
  `tools/sketch/views.js` — the switch of the seven views, on every page: the keys 1 to 7, V for the next,
  round all seven; a page that is none of the five says which on its switch, `data-view` —
  `3d`, or `info` (T-032.5) — and from it a link to one of the five names the pad's page;
  `views.typing(event)`, whether a key is typed into a field, and so is no view's and no
  tool's — **and yes of every key while a menu is open**, whatever it was pressed on;
  `views.menu(button, panel)`, which makes a menu of a button and of the part it opens: shut,
  the part is `hidden` and the button says `aria-expanded="false"`; a click on the button
  opens it, and the first entry that is not off — a `button` in the part — takes the focus; a
  second click shuts it, and so do a click on an entry, once the entry has heard it, Escape —
  after which the button has the focus — the pointer down outside its two parts, the focus
  gone to another control, **the window's `blur`** — Tab past the page's last control, a click
  in another window — and another menu that opens: one is open at a time. **It returns
  `shut`**, a function that shuts that menu where it is the one open, as a second click on its
  button does, and does nothing where it is shut or another is open; the focus stays where it
  is (T-000.24). The script makes the File menu itself, where a page has `#file-menu` and
  `#file-entries`: a script that wants another calls `views.menu`. **`views.popup(panel)`**
  (T-037.5) makes a menu of a part alone, with no button, which a script opens where it likes
  — the right button's: shut, the part is `hidden`; it returns `open()`, which shuts the menu
  that is open, shows the part, makes it the one open and gives its first entry that is not
  off the focus. It shuts as every menu does — at Escape, after which the focus is where it
  was before the menu opened, at the pointer down or the focus outside the part, at the
  window's `blur`, and where another menu opens — and at a pick: a click on an entry that
  opens no list of its own (`aria-haspopup`), once the entry has heard it. And what a tab keeps through it: `views.seen`, what
  the tab showed last **of the plot that the page shows** — nothing, where it showed
  another plot last (ST-030) — and
  `views.keep`, which has it keep what it shows as the page goes — on the 3D page too, its way,
  shadows, level, ground and look. And the words of the toolbar: from above, in 3D and on the
  Info page the plot's name, and after it its area, where the plot states one — a plot that states none
  shows its name alone; `tools/sketch/page.js` — tools, pointer, keyboard, what `#alarm` says, and
  the one call that has the ground follow the sketch, at the head of its `refresh` — where
  it also hands the list of categories what is selected, the swatch after it, and the
  gallery, in the line after that, the object that a click sets down — and the row of
  `tools/sketch/object-high.js` what is selected, in the line after the gallery's. **A colour
  of the toolbar is the Block tool** (T-029.3) — the toolbar's colours are
  `tools/sketch/palette.js`'s since T-039.1: the page asks `palette.colour()` for a stroke and a
  label, has `palette.show(tool)` mark the colour, and takes the tool that `palette.onPick`
  names: a pick sets the colour and takes Block — or leaves Line on, where Line is the tool
  (T-039.3) — and paints nothing: what is selected stays as it is, and is painted by its swatch.
  A colour shows pressed where Block is the tool and it is the colour; with another tool
  none does, and the colour is remembered: B takes Block in it, and a line and a loose label
  are drawn in it. A
  height typed or stepped into `#high` takes Block too, in the colour picked last. **An
  object is picked in the gallery** (T-029.4): O, or a click on the button of the Objects
  group, takes Object with the kind that was set down last — a person, until one is picked
  — and the gallery shows right of the paper; a click on a tile is what the next click on
  the paper sets down, and R turns it before that click, as it did; with another tool the
  gallery goes, and what is selected shows again. There is no Object button with that word
  on it, and no list of kinds. So of the tool buttons, the colours and the button of the
  Objects group exactly one shows pressed — **or none, while a section is picked** in the
  list left of the paper: the pick is a tool of its own, `'section'`, which `refresh` takes
  back from `sectionList.show`, and which another tool, a colour, an object, a height or
  Escape ends (`tools/sketch/sections/CLAUDE.md`, T-032.4). **The right button erases
  nothing** (T-037.5): the page's pointer is the left button's alone, and the browser's own
  menu stays swallowed on the paper. **Several may be selected** (T-037.6): beside `picked`, the
  one thing that the panels right of the paper show, `several`, the things selected when there
  are more than one — while several are, `picked` is null, and the list of categories, the
  swatch, the height and the section's row are hidden as with nothing selected; each is drawn
  as one is, its block's boxes or the object, and the words right of the paper are
  `footer.several`. A left press with Select, Escape, an undo or a change that takes one of
  them away and a switch of view end several; the tab does not keep them. It hands the right
  button's menu what is selected, `rightMenu.selected`, a function giving a list — `[picked]`,
  or `several`, or `[]` — and takes what it selects, `rightMenu.select(things)`: several, one,
  or none, and refreshes. **Line** (ST-039, T-039.2) has its own presses, `tools/sketch/lines/tool.js`,
  and no drag of the page's — a point on the nearest point of the grid shown, `grid.round` of
  each axis, or with Alt to the centimetre (ST-042) — its button is titled `Click corners; Alt off grid; Enter ends (L)`;
  Select on a line picks it there (`lineTool.pick`) and drags nothing, and a line selected is the
  one thing selected: no thing is, and `#picked` says the line's words; a thing selected picks no
  line; Escape selects no line, and Delete or Backspace take the line selected away, one step.
  `refresh` hands, after the line's words, `linePanel.show(lineTool.picked())` and then
  `everyList.show(lineTool.picked())` (T-039.4) — `tools/sketch/lines/CLAUDE.md` holds the rest.
  `paper.draw` of `tools/sketch/draw.js` takes for `picked` one mark or a list of them, one a
  thing — or a line's mark, `{ line }`, its points drawn over in ink and a square at each corner,
  whether the layer draws the line or not; and draws a line of the sketch of any number of points;
  `tools/sketch/pointer.js` — the pointer on the paper, cut out of `page.js` for the menu asks
  the same: `pointer.at(event)`, its place in cells, as `zoom` shows the window and anywhere,
  beyond the plot's paper too (ST-042), and `pointer.grab(at)`, what Select has
  there — a label; a line, `{ line: <its place among the notes>, zone: 'move' }`, the one drawn
  last of those `lines.here` puts on the layer drawn on, within `pointer.reach()`, the reach of a
  grab in cells, 6 screen pixels (ST-039); a thing of the layer drawn on; or from above a slice's
  line;
  `tools/sketch/selected.js` — what is done to what is selected, one thing or several, whole,
  each one step: `sketch.remove(things)`, of a box its whole block — what a click of the eraser
  takes — and an object; `sketch.toLevel(things, floor, pressed = things[0])`, every thing
  carried by the rows between the level of the thing pressed — a box's `z[1]`, an object's
  `floor` — and `floor`, so that they keep their heights to each other: every box of a block by
  as many, a top that slopes with it (`blocks.carried`), an object's `floor` by as many — to
  `floor` itself where either is the ground; refused where `sketch.refusedLevel(things, floor,
  pressed)` says why — a block goes on no ground; to a level that takes a box of it off the side
  view's paper it goes all the same, for the paper has no edge (ST-042); `sketch.turnEach(things)`, every object a quarter on, as R;
  `sketch.categoriseEach(things, key)`, every block's category, as `sketch.categorise` writes it;
  `sketch.duplicate(things)`, a copy of each one cell right as seen on screen, each group a group
  of its own — the copies. **Copy and Paste**, within one sketch and one page, never through the
  system's clipboard: `sketch.copy(things)` holds copies of each whole in the page's memory,
  with the plane and the layer they were copied on — a switch of view loads the page anew, and
  they go — and `sketch.copied()` says whether anything is; `sketch.paste(at)` lays them anew, in
  one step, so that the middle of all of them on this plane's paper lies on the cell of `at`, in
  whole cells, as far as that takes them: the paper has no edge (ST-042); from above onto the level drawn on,
  every thing by the rows between the level it was copied on and that one — an object onto the
  ground, or from it, to the layer drawn on — and in a slice along the paper alone, its heights
  and its place across kept. Each group copied gets a group of its own, and a box keeps its
  `section` where the sketch still has it and drops it where not; what it laid it gives back,
  and it can be pasted again. `sketch.pasteRefused()` says why not: nothing copied, a block on
  the ground — "A block stands on a level, not on the ground"; and `tools/sketch/right-menu.js` with its look,
  `tools/sketch/right-menu.css` — **the right button's menu**, from above and in every slice,
  and none on the 3D page or the Info page. A right press on a block or an object — what Select
  would have there — selects it, whatever the tool, and opens the menu with its top left corner
  where it was pressed — on one of several selected, the menu of all of them, which stay
  selected; on the empty paper, the empty paper's menu; on a label or a slice's line nothing.
  The entries of things, `rightMenu.entries(things, at, pressed)`, in this order, an entry
  that does not apply left out, and one that can do nothing off, with why under it: **Delete**;
  **Copy**; **Duplicate**, a copy one cell right on the paper, as a drag with Ctrl lays one —
  of several, of each — the copies selected; **Turn**, where an object is among them, each as
  R; **Section ▸**, where a block is, the sections by name and "In no section", the one all
  of them are in marked — off where the sketch has none; **Category ▸**, where a block is, "By
  its name" and the categories under the words of the groups of the list beside the paper, the
  one picked for all of them marked; **Move to level ▸**, the levels of the top view and of
  objects the ground, the one the thing pressed stands on marked and off. **The empty paper's
  menu**, `rightMenu.blank(at)`: **Paste**, where something was copied — off with why where it
  cannot be pasted there — what it pasted selected; and **Select all on this level** from
  above, **Select all in this slice** standing up — every block and object of the layer drawn
  on that shows, a block once, by its first box; one thing alone is `picked`. An entry with ▸ opens its list beside
  the menu, right of it or left where the right has no room; a list longer than the window
  scrolls. A pick is one step, and shuts the menu; it shuts as `views.popup` says. **The menu
  opens inward, whole**: `rightMenu.placed(at, size, window)` puts it left of, or above, the
  place where it would reach past the right or bottom edge, and never past the left or top.
  **Delete and Backspace**, with nothing held beside them, erase what is selected, whole, in
  one step, and nothing is selected after; with nothing selected they do nothing, and while a
  field or a menu has the keys (`views.typing`) they are not the page's. **Ctrl+C** copies what
  is selected, and **Ctrl+V** pastes what was copied at the pointer's last place on the paper,
  where it is on it — and neither does anything from a field

