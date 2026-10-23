# tools/sketch/kml

The Google Earth file (ST-016): what the sketch adds up to, at the plot, in a file that Google
Earth opens on the web, on the phone and on the desktop — since ST-038 the house as the 3D
page's White builds it, in plain white faces. The pad's one conversion from LV95 to
WGS84, its one writer of KML text, and the test file — one box on a plot, by a command — which
the orchestrator makes on the owner's plot and the owner opens (the story's rule 3, T-016.1).
Why it is the pad's and not the layers', and what it costs: the story's ADR,
`docs/adr/ADR-0138-the-google-earth-file-is-the-pads.md`; why it holds the White model's parts,
and what that costs: `docs/adr/ADR-0155-the-white-model-in-google-earth.md`.

## Public API

`tools/sketch/kml/wgs84.js` — imports nothing: a page and Node load it alike.

- `wgs84Of([east, north])` — `[longitude, latitude]` of WGS84, in degrees, of a place of LV95
  in metres, by swisstopo's approximate formulas: "Näherungsformeln für die Transformation
  zwischen Schweizer Projektionskoordinaten und WGS84", version of December 2016, section 2,
  page 4 — read from swisstopo's page "Transformationen (3D / Lage)",
  `https://www.swisstopo.admin.ch/de/transformationen-3d-lage`, where the document lies as
  `https://www.swisstopo.admin.ch/dam/de/sd-web/KLRCX9XIdXDu/ch1903wgs84-DE.pdf` (retrieved
  2026-10-15). It takes any two numbers; whether they are a place of LV95 is `isLV95`'s to say
- `ACCURACY_M` — 4.45 m: what the page states, better than 0.12" in longitude and 0.08" in
  latitude all over Switzerland, in metres on a sphere of `EARTH_RADIUS_M` (6 371 000 m),
  where a second of arc along a great circle is `SECOND_M`, 30.89 m: the hypotenuse of the two.
  An upper bound — a second of longitude in Switzerland is some 21 m, and the points of REFRAME
  lie within 1.94 m, the west's the farthest. `STATED_SECONDS`, the two figures of the page

`tools/sketch/kml/kml.js` — imports `onMap` and `isLV95` of `tools/sketch/new-plot/frame.js`
and `wgs84Of`, and nothing else: it runs in a page and in Node.

- `kmlOf({ name, about, place, raiseM, boxes, outline })` — the text of a KML file. `name` a
  text; `about` a list of texts, the lines of its description; `place` `{ originLV95,
  bearingDeg }`, where x = 0, y = 0 of the plot's frame lies in LV95 and the bearing x runs at;
  `raiseM` the metres every height of a box is raised by; `boxes` shapes as the scene's parts
  have them (`tools/sketch/scene/parts.js`), of which `shape`, `min`, `max`, a slant's
  `along`, `low` and `high`, and `colour`, `see` and `name` are read — `shape` `'box'` where
  it says none, and no `top` (ST-038); `outline` a plot's open ring of `[x, y]`. What it
  writes:
  - `<?xml …?>`, a `<kml>` of KML's name, one `<Document>`: its `<name>`, its `<description>`
    — the lines of `about`, one after another — a `<Style>` for each colour and way of seeing a
    box has, then a `<Placemark>` for each box, in their order, and one for the outline
  - **a box**: its `name`, or `Block`; its style; a `<MultiGeometry>` of a `<Polygon>` a face —
    its foot, its top and its four sides — each `absolute`, one plain ring, closed, the first
    point again at the end, and never an `<innerBoundaryIs>`: a part of the scene has no hole.
    A `box` has its foot at `min[2]` and its top at `max[2]`; a `slant` its foot at `low[0]`
    where x (along 0) or y (along 1) is `min[along]` and at `low[1]` where it is `max[along]`,
    its top at `high[0]` and `high[1]` the same way: a sloping foot or top slopes. A point that
    is the point before it again, within `SAME_M` (1e-9 m) on each axis, counting round the
    ring, is left out, and a face of fewer than three points is not written: a slant that comes
    down to an edge at one end has five faces, the two sides beside the edge triangles
  - **a point**: `longitude,latitude,altitude`, the place through `onMap(place)` and
    `wgs84Of`, to 7 decimals, the altitude `h + raiseM` to 2; one blank between two points
  - **the outline**: `Plot outline`, a `<LineString>` tessellated and `clampToGround`, its
    corners and the first again, at altitude 0
  - **a style**: the colour as KML writes it, `aabbggrr` — `ff` for a solid box, and for a
    see-through one 0.35 of 255, 89, `59`: `HIDES` of `tools/sketch/view3d/build.js`, typed in
    again, for the module may not import three.js — and plain: a `<PolyStyle>` with
    `<outline>0</outline>`, and no `<LineStyle>`, for White draws no edge, and a wall cut
    around its window would show its seams
  - every text from outside — a name, a line of `about` — with `&`, `<`, `>`, `"` and `'` as
    entities
  - it **throws**, in one sentence, where `place.originLV95` is no place of LV95, the bearing or
    the raise no finite number, or there is no box and no outline: no half file

`tools/sketch/kml/try.js` — the test file.

- `pnpm sketch:kml <plot.json> <east> <north> <out.kml> [raise]` — reads the plot's file by
  `read` of `tools/sketch/plot-file.js`, and writes a KML file of one box on its ground and its
  outline, at the place given, raised by `raise` metres, 0 where none is said. It prints
  `Written: <out.kml>`, and nothing of the plot. It refuses, in one sentence on the error
  stream and with nothing written: too few or too many words; a place that is no place of LV95
  (LV03's figures have six digits); a raise that is no number; an `out.kml` inside the
  repository — the folder three up from the script, by `path.relative`, a path on another drive
  lying outside; a plot's file that cannot be read, or that `read` refuses, in its sentence;
  and an `out.kml` where a file is (`flag: 'wx'`)
- `trialOf(site)` — `{ box, outline }`: the box `TRIAL_SIDE_M` (8) by 8 m along the plot's x
  and y, `TRIAL_HIGH_M` (6) high, red, solid, named "Test box, 8 by 8 by 6 m, on the plot's
  ground"; its middle the mean of the outline's corners; its foot the ground at the grid point
  of the paper nearest that middle — `baseM` plus that point's centimetres — and the edge of
  the paper where the middle lies off it. The outline is the site's
- `trial(words)` — the command, of its words: `{ written }` or `{ refused }`

`tools/sketch/kml/house.js` — the house for Google Earth, which the 3D page asks (T-016.4,
ST-038): imports `kmlOf`, `ACCURACY_M`, `aboveGround` of `tools/sketch/scene/above.js`,
`shownBy` of `tools/sketch/scene/shows.js` and `SURFACES` of `tools/sketch/scene/surfaces.js`,
and nothing else; it runs in a page and in Node. The page names neither `kml.js` nor
`wgs84.js`.

- `raiseOf(text)` — the raise of a field's text, in metres: 0 of an empty text or of blanks; a
  number with a sign or none and a decimal point or comma — `-2,5`, `+1`, `.5`; else null — a
  letter, a unit, an exponent
- `houseFile(scene, site, raiseM, now, off = {})` — the Google Earth file of a scene
  (`sceneOf`: its `solids`, its `ground` and its `parts`, as the 3D page works them out) on a
  site (its `name`, `outline`, `bearingDeg` and `originLV95`), saved at `now`, a Date, less
  what `off` switches off — `{ sections, levels, groups }`, as the 3D page holds them
  (`switchedOff`, `docs/sketch/scene.md`). **What it holds is the White model's parts** of the
  blocks that `aboveGround` keeps: `shownBy(scene, 'all', off).parts`, of which a part goes
  with its block, `scene.solids[part.thing]` — walls with what a door and a window open of
  them, floors, roofs, railings, panes, frames — each handed to `kmlOf` as a box: its `shape`,
  `min`, `max` and a slant's `along`, `low` and `high`; white, `#ffffff`; `see` `'through'`
  where its surface hides a share (`SURFACES[surface].hides`: glass) and `'solid'` else; named
  `<block> — <what it is>`, `Parlour — wall`, of the block's name, or `Block`, and the part's
  `of`. A section or a level switched off takes its blocks' parts away; a group is of objects
  and takes none. **The cut is not applied**, nor "Open along": the file is the whole house at
  every cut. One of: `{ refused }` where the site says no `originLV95`, in `NO_PLACE`, the
  sentence of the entry's line; `{ unraised: true }` where `raiseM` is null; `{ text: null }`
  where no part is left — no block stands above the ground, or every part of the kept blocks is
  switched off; `{ failed }` where `kmlOf` throws, in its sentence; else `{ text, under, parts
  }`: `kmlOf` of the parts, the site's outline and its place, named `<plot> — house`; how many
  blocks were left under the ground; and how many Placemarks of parts it wrote. Its
  description, four lines: `The house of the sketch on <plot>, as White shows it in 3D, saved
  on <day>.`, the day by the world's clock; `Raised by <m> m, tuned by eye to Google Earth's
  ground.`, or `Not raised: …`; places to within about `ACCURACY_M`, by swisstopo's
  approximate formulas; and what is left out — the objects, the ground as the sketch shapes it,
  `what is switched off in 3D` where a switch took a part of a kept block away, and so many
  blocks under the ground where there are any
- `keptRaise(page)`, `keepRaise(text, page)` — the raise as the browser keeps it, a text as it
  was typed: in `page.localStorage`, under `raiseKey(page.PLOT)` — `blockplot/earth/raise/<id>`
  of the page's plot, or `RAISE_KEY`, `blockplot/earth/raise`, where the page has none, as
  on the made-up pad. `keepRaise` keeps only a text that `raiseOf` takes; `keptRaise` gives `''`
  where none is kept. Each reaches for the store and the plot when it is called, not as the
  module loads: the 3D page's modules may name neither (`docs/sketch/view3d.md`, invariant 4),
  so they ask these (`docs/adr/ADR-0141-the-raise-is-kept-by-kml.md`). The raise is no
  design figure: nothing writes it into a sketch or a plot

## Units and frame

Inside the pad, positions are metres of the plot's frame and heights metres above sea level;
a plot's place is LV95 (directive 35). x points along `(sin b, cos b)` in LV95 and y along
`(-cos b, sin b)`, `b` the bearing (`docs/sketch/new-plot.md`, "The frame, as the pad has it"):
`onMap` turns `[x, y]` into `[east, north]`. **WGS84 exists here alone**, and only on the way
out: each corner is converted on its own, so the grid's turn against true north is in the file
and needs no figure of its own. **Heights are not converted**: Google Earth's altitudes are taken
as metres above sea level, and the raise takes up what differs — Google Earth's ground and sea
level are not swisstopo's, by a few metres — tuned by eye (the ADR, Decision 4 and 5).

## Invariants

1. **WGS84 lies in `tools/sketch/kml/` alone**: no `.js` or `.html` of the pad outside it names
   `wgs84.js` or `wgs84Of` — `tools/sketch/kml/own.check.js` holds it.
2. **Nothing is asked**: no module here asks another machine, and the checks run behind the
   pad's gate. What REFRAME answered was asked by hand while building, and typed in.
3. **Nothing of a real plot in a check**: the checks read the made-up plot, and places of round
   figures far from any. An agent runs the command on `tools/sketch/example/plot.json` alone.
4. **A file of a plot is written outside the repository, and over no file**; `.gitignore`
   holds `*.kml` and `*.kmz` all the same: a file of the owner's house is their location.
5. **Every figure of the file comes from the sketch, the plot and the place given**, but the
   raise, which is typed, and said in the file (directive 30).

## Test

`pnpm sketch:check` finds six checks here by their names.
`tools/sketch/kml/wgs84.check.js` — the document's worked example, E 2 700 000 / N 1 100 000,
to its printed figures, 8° 43' 49.80" and 46° 02' 38.86", within half the last, 0.005"; the
grid's zero, which the constant terms give alone; and three points of round figures — west
E 2 500 000 / N 1 140 000, east E 2 830 000 / N 1 170 000, south E 2 720 000 / N 1 080 000 —
whose WGS84 was asked of swisstopo's REFRAME, `https://geodesy.geo.admin.ch/reframe/lv95towgs84`,
by hand on 2026-10-15: each within `ACCURACY_M`, the gap worked out on the sphere.
`tools/sketch/kml/kml.check.js` — at the grid's zero, bearing 90 (x east, y north): a level
box and a see-through one, each six closed rings of five points at the corners worked out by
hand and their heights plus a raise of −2.5; a slant along x, `min [0, 0, 10]`, `max [2, 1,
11]`, low `[10, 10]`, high `[11, 10]`, which comes down to an edge at x = 2 — five faces by
hand, the two beside the edge triangles of three points and the closing one; a slant along y
whose foot slopes too, low `[10, 9]`, high `[12, 11]`, six faces, its foot and top at their two
heights; no ring of the file holding a point twice running; the alpha of `HIDES`; every style
plain — `<outline>0</outline>`, no `<LineStyle>` — and no `innerBoundaryIs`; a name with the
five signs, escaped; the outline clamped and closed; no figure of LV95 in the text; each
refusal. `tools/sketch/kml/try.check.js` — `trialOf` on the made-up plot by
hand: the mean at x 19.5, y 67/6; column 47, row 34; the foot 814.62 m and the top 820.62 m —
and the command run, its one line, and each refusal with nothing written, the repository's
inside among them, in a folder of the system's temporary files that it takes away.
`tools/sketch/kml/house.check.js` — `raiseOf` of thirteen texts, `''`, `' '`, `'2.5'`,
`'-2,5'`, `'+1'`, `'x'` and `'1e400'` among them; the raise kept by the key of a plot and by the
one key of a pad with none, and a text that is no number keeping nothing. By hand, a scene of a
room over a made-up ground, a cellar under it and a tree, each built of one part: one Placemark,
`Room — wall`, its points at its heights less 2.5, and the outline; the name escaped; the four
lines of the description, White's, one block under the ground; not raised; two under it; and
each refusal — no place, no number, no box above the ground, a place `kmlOf` refuses. And the
made-up house, read as `tools/sketch/view3d/made-up-cut.check.js` reads it, at its made-up
place: all eight blocks of the house above the ground, in the scene's order — the store, wholly
under the hill before the cut, kept, for the cut bares its corner at column 30, row 24, which
lies between the cut's floor and the store's top (the reasoning is the check's comment) — and
their 153 parts by their names, in the scene's order — floor 33, wall 44, pane 24, frame 32,
roof 16, rail 4 — and the outline; 917 faces; the 24 panes see-through white, the rest solid
white; the lowest point of a part at 814 m and the highest at 820 m, each plus 2.5. Should the
scene's rules change, the figures are what the check finds, and its comment says why they moved.
`tools/sketch/kml/white.check.js` — the made-up site and figures of
`tools/sketch/scene/openings.check.js`, typed in again: a room, `Parlour`, with a window in its
wall at y 7.5, built by the scene's own rules, at the grid's zero, raised 2.5 m. The room is 18
Placemarks of 108 Polygons, and no `innerBoundaryIs`; its wall around the window five, in their
order — beside it, under the sill, the lintel, beside it, the pane — each at its eight corners
worked out by hand to 7 decimals of a degree and 2 of a metre; none of the four pieces of wall
reaches into the hole, x 2 to 3.5 and 106.25 to 107.5 m; the walls `ffffffff`, the pane
`59ffffff`, no `<LineStyle>`. Then the parlour and a dining room beside it, each a section of its
own: no `off`, or `{}`, the whole house; one section off, none of its parts, and the description
says what is switched off; the level of both, 105 m, off, `{ text: null }`; a group off,
`['Kitchen']`, the same file as none. `tests/e2e/sketch-3d-kml.spec.ts` holds the same parts in
a browser, T-038.2. `tools/sketch/kml/own.check.js` — invariant 1, on the pad, where it finds
nothing, and on a made-up folder, where it finds the script outside `kml/` that imports
`./kml/wgs84.js`.

Seventeen breaks of the modules were tried, each alone: every one fails a check (T-016.1); and
eight of `house.js`, each failing `house.check.js` (T-016.4). Six more of the White model
(T-038.1), each alone: a slant written level — `kml.check.js` and `house.check.js` fail; a face
of no height kept — both again; the switches ignored — `white.check.js`; a part of a block under
the ground written — `house.check.js`; glass written solid — `house.check.js` and
`white.check.js`; an edge drawn — `kml.check.js` and `white.check.js`.

## Gotchas

- **KML's name is an address, and the check of addresses reads text**:
  `tools/sketch/swisstopo/named.check.js` lets `http://www.opengis.net/kml/2.2` through, to the
  letter, as it lets SVG's through — and refuses `…/kml/2.3`, or any other of that host. A
  script here names no host of swisstopo's either: where the document and REFRAME lie is said
  in this note, never in a comment.
- **The command is never run on a real plot by an agent.** The orchestrator runs it on the
  owner's, with the place worked out outside the repository, and sends the owner the file; the
  file's name and its description hold the plot's name, and its points the plot's place.
- **The document's two sections go opposite ways**: section 1, from WGS84 to LV95, is "im
  1-Meter-Bereich"; section 2, the one used here, states 0.12" and 0.08" — 4.45 m at the most.
  Its "Sollwerte" are the exact values; the check holds the formula to what the formula gives,
  as the page prints it.
- **A description's lines** are joined by a line break, which Google Earth may show as a
  blank: they are plain text, and no HTML is written.
