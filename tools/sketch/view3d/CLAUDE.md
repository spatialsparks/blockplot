# tools/sketch/view3d

The scripts of the pad's 3D page, `../3d.html`: the sketch on the ground of the plot, on a stage
of three.js — the Volumes, White and Materials — cut at a level or opened along a slice, with
Settings for the figures, full screen, and the house saved as one 3D file or the stage as a picture. The
pad's only code that imports three.js. **It never** works out anything of a thing for itself: it draws what `../scene/` works out.

**Its long note is `docs/sketch/view3d.md`** — "Public API", "Units and frame", "Invariants",
"Test", "Gotchas": read the part your card names. What a task changes here is written there, in
the same change; this note changes where a module comes or goes. The rules for whoever works on
the pad, and its commands, are `../CLAUDE.md`'s.

## Modules

`main.js`, the page's entry · `read.js`, the sketch as the pad reads it, and the one writer of
a figure · `reach.js`, how far the ground is drawn and how fine: near grids and far squares
(ST-042) · `settings.js`, `panel.js` · `switches.js`, a switch a section and a group of
objects, and "Open along", and `side.css`, how they look · `showing.js`, the ways of showing ·
`view.js`, `stage.js`, `fit.js`, `frame.js`, `lights.js` · `sliced.js`, the house opened along a
slice of the pad, its cut faces dark · `build.js`, `meshes.js`, `shapes.js` ·
`patterns.js`, the floors', walls' and roofs' patterns in Materials, worked out in the shader ·
`file.js`, the 3D file and the Google Earth file · `full.js`, full screen: the stage alone, its picture and back. Their checks stand beside them, and `../check.js` runs each by its name.

## Read this when doing that — in `docs/sketch/view3d.md`

| Doing | Read |
| --- | --- |
| A module's entry points | "Public API", by the module's name |
| Metres, the plot's frame, the ground | "Units and frame" |
| What the page always does | "Invariants", by their numbers |
| The checks and the browser tests of the 3D page | "Test"; `docs/sketch/pad-test.md`, `tests/e2e/sketch-3d*.spec.ts` |
| A hill, a cut, a terrace, a picture, a file, the header | "Gotchas", by its words in bold |
