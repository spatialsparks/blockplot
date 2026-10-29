# tools/sketch

The owner's sketch pad, where the design is drawn: boxes on half-metre cells, a grid that follows the zoom, from
above and in slices, in 3D, in sections and in Info — every view shows the one sketch (ADR-0058).
Plain scripts, one dependency, three.js, and pages that any plain web server serves — `pnpm sketch`
gives them on 127.0.0.1 as plain files, and nothing more (ST-041); New plot makes a plot in the
page, and Keep writes through the browser (ST-040). **It never** imports
`apps/`, `packages/` or `design/`, is read by none of them, and holds no plot of the owner's: its
one plot is the made-up `example/`; the owner's lie in `design/plots/` (ST-030, ST-031).

**Its long notes lie in `docs/sketch/`**, whole, cut along their headings:
`docs/sketch/pad-api.md` (what the pad is, and its Public API), `docs/sketch/pad-invariants.md`,
`docs/sketch/pad-test.md`, `docs/sketch/pad-gotchas.md`; and one a folder —
`docs/sketch/view3d.md`, `docs/sketch/scene.md`, `docs/sketch/new-plot.md`, `docs/sketch/map.md`,
`docs/sketch/swisstopo.md`, `docs/sketch/cadastre.md`, `docs/sketch/example.md`, `docs/sketch/kml.md`,
`docs/sketch/under.md`. Read the part your
card names. `info/`, `sections/`, `distances/`, `lines/` and `store/` keep their notes beside their scripts.

## Invariants — by their numbers; in full in `docs/sketch/pad-invariants.md`

1. No build, and one dependency: three.js, for the 3D page alone, from `three/` beside the pages.
2. The server is a plain file server, with no plot, for this machine's own page: 127.0.0.1
   alone, and nothing for another site.
3. The sketch is the design, and no view holds design data of its own (directive 30): one file
   format, `docs/STORAGE_FORMAT.md`, one reader, `sketch.adopt`.
4. A plot of the owner's is the real plot: no test, fixture, check or CI artifact copies one,
   reads one or holds one, and no file of this folder holds anything of it.
5. Every file under 300 lines and through `pnpm lint`; pages and stylesheets counted by hand.
6. One space, five views of three planes: a change made in one view is the same in all.
7. A slice is seen from either side, and the front is the downhill end.
8. A layer is a cut through the space, never a list of its own.
9. Nothing a person drew is dropped without being asked.

## Whoever works here — the owner's rules

- No file of `design/plots/` is read but its `CLAUDE.md`, and none of `data/site/`.
- No pad is started by hand without `--demo`. A check or a browser test may start `serve.js`
  without it, on a port the system picks: it serves the pad's files, reads nothing of `design/`,
  and its pages ask swisstopo only where they are opened without a stand-in's `asks`, which no
  test does.
- The owner's pad on 127.0.0.1:4764 is never stopped, and none is started there.
- One browser-test run at a time: `pnpm e2e:sketch` binds port 4765.
- A rule, calculation or decision of a script has a check beside it, `*.check.js`, that fails if
  it breaks (directive 14); `check-each.js`, which `check.js` loads last, finds and runs it by
  its name.
- **What a task changes of the pad is written into the file of `docs/sketch/` that holds it, in
  the same change** (directive 19). This note changes where a module comes or goes, or a rule
  for whoever works here does.

## Commands

| Command | Does |
| --- | --- |
| `pnpm sketch:check` | The pad's checks, behind a gate that lets nothing leave this machine |
| `pnpm e2e:sketch` | Its browser tests alone, against `pnpm sketch --demo` on port 4765 |
| `pnpm sketch:look <page> <sketch> <picture> --demo\|--plot=<file>` | A picture of a page of the pad, without a window, of the example or of a plot's file |
| `pnpm lint` | ESLint — the 300 lines among it — the dependency check and the format check |

## Read this when doing that — the file, and the heading or the name a subject stands under

| Doing | Read |
| --- | --- |
| The sketch file: its reader, its versions, what is set aside | `docs/sketch/pad-invariants.md`, 3 and 9; `docs/sketch/pad-api.md`, `tools/sketch/sketch.js`, `tools/sketch/labels.js`, `tools/sketch/files.js`, `tools/sketch/own-colours.js` (the owner's colours); `docs/sketch/pad-gotchas.md`, "A sketch with a kind the page does not know" |
| The server and its routes: plain files, three.js under `three/`, the made-up pad's 204 for the map's page, no plot and no kept sketch; and those files written into a folder for a plain web host | `docs/sketch/pad-api.md`, "What the server gives", `tools/sketch/routes.js` (`setting`, `route`), `tools/sketch/published.js` (`published`); `docs/sketch/pad-invariants.md`, 2 |
| The plots: a plot's file, which plot a page shows — the tab's, the one shown last, else the example — and every page's first script, Open plot and its ways in, Keep | `docs/sketch/pad-api.md`, `tools/sketch/plot-file.js`, "The plot shown last" (`tools/sketch/boot.js`, the pages' `<template id="scripts">`), **Open plot** (`tools/sketch/open-plot.js`, `tools/sketch/open-plot-ways.js`), **Keep** (`tools/sketch/kept.js`, `tools/sketch/kept-ways.js`: into a plot's folder, else the browser's store); `docs/sketch/pad-invariants.md`, 4; `docs/sketch/example.md` |
| The browser's store of plots: a plot's folder or file brought in, held in IndexedDB, its key, the tab's plot and the last, kept sketches in the browser or the folder | `tools/sketch/store/CLAUDE.md`, whole: `store/rules.js`, `store/held.js`, `store/ways.js`; `docs/STORAGE_FORMAT.md`, "The browser's store — version 1"; `docs/adr/ADR-0164-the-pad-without-a-server.md` (numbered as the sprint lands) |
| The cadastre — the cadastral map and the parcel, where the pad offers them | `docs/sketch/cadastre.md`; `tools/sketch/swisstopo/cadastre.js` |
| The map under the top view: where it lies, its level, its pictures, the control "Map" in the View group | `docs/sketch/under.md`; `tools/sketch/under/place.js` (`underOf`), `tools/sketch/under/lay.js` (`globalThis.under`) and `under/under.css`, `tools/sketch/under/switch.js` (the switch, the choice, the slider, kept for the tab) |
| A new plot: the map, the order, swisstopo | `docs/sketch/map.md`, `docs/sketch/new-plot.md`, `docs/sketch/swisstopo.md`; `docs/sketch/pad-api.md`, "The three folders of a new plot" |
| The pad's pages: frame, look, File menu, toolbar and its colours, the right button's menu, Delete, several selected, Copy and Paste; the grid shown, the zoom, the paper without edges — its window, panned and fitted — and what snaps to the grid | `docs/sketch/pad-api.md`, "The frame of the three pages", "One look, said once", "File is a menu", and the entries of `tools/sketch/grid.js`, `tools/sketch/zoom.js`, `tools/sketch/draw.js` and `tools/sketch/draw-marks.js`, `tools/sketch/page.js`, `tools/sketch/palette.js` and `colours.css`, `tools/sketch/views.js` (`views.popup`), `tools/sketch/pointer.js`, `tools/sketch/selected.js` and `tools/sketch/right-menu.js`, `right-menu.css` |
| The Line tool: a line point after point, Alt, a line selected, said and erased; its panel, its segments typed, on every level, its switch, the list under the levels, recoloured | `tools/sketch/lines/CLAUDE.md`, whole: `lines/model.js`, `lines/tool.js`, `lines/panel.js`, `lines/list.js`, and what `page.js`, `pointer.js`, `strokes.js`, `draw.js`, `draw-marks.js`, `footer.js`, `layers.js` and `swatch.js` ask of them |
| Ground, cuts, categories, slopes, objects, the gallery; the ground as squares, and in windows on a plot over 120 m | `docs/sketch/pad-api.md`, `tools/sketch/earth.js`, `tools/sketch/squares.js`, `tools/sketch/windows.js`, `tools/sketch/categories.js`, `tools/sketch/slopes.js`, `tools/sketch/stretch.js`, `tools/sketch/shapes.js`, `tools/sketch/gallery.js`, `tools/sketch/object-high.js` |
| The 3D page | `docs/sketch/view3d.md`; `docs/sketch/scene.md`, what it draws; `docs/sketch/pad-api.md`, `tools/sketch/3d.html` |
| The Google Earth file: LV95 to WGS84, KML, the test file | `docs/sketch/kml.md`; `tools/sketch/kml/`; the story's ADR, `docs/adr/ADR-0138-the-google-earth-file-is-the-pads.md` |
| The checks, and what each holds | `docs/sketch/pad-test.md`, from its top: the gate, then each `*.check.js` by name; each folder's file, "Test" |
| The browser tests, and what they start | `docs/sketch/pad-test.md`, "`pnpm e2e:sketch`" and the tests by name; `tests/CLAUDE.md` |
| A look at a page | `docs/sketch/pad-api.md`, "`pnpm sketch:look`"; `docs/sketch/pad-gotchas.md`, "To see …" and `tools/sketch/look.js`, its words `tools/sketch/look-args.js` |
| The gotchas of each | `docs/sketch/pad-gotchas.md`, by its words in bold; each folder's file, "Gotchas" |
| The made-up plot, worked out by hand | `docs/sketch/pad-gotchas.md`, "The made-up ground is a plane"; `docs/sketch/example.md` |

`docs/sketch/` has no note of its own: this table is its index.
