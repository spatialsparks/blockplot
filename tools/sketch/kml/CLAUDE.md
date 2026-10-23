# tools/sketch/kml

The Google Earth file (ST-016, ST-038): the house as the 3D page's White builds it — the parts
of its blocks above the ground, walls with their openings, floors, roofs, railings, panes, each
plain white faces, less what a switch of the 3D page takes away — at the plot, and the plot's
outline, as the text of a KML file. The pad's one conversion from LV95 to WGS84, and back —
**the one place in the pad where WGS84 exists** (directive 35), but New plot's reader of a
GeoJSON file, which turns a file's WGS84 into LV95 by it as it reads it and keeps none (ST-045)
— its one writer of KML, the test file, by a command, and the house for the 3D page's File, with the raise the browser keeps for a plot.
Modules that import the plot's frame, the plot's reader, the scene's `above.js`, `shows.js` and
`surfaces.js`, and each other, and nothing else. **It never** asks another machine, and writes
no file but where the command is told to.

**Its long note is `docs/sketch/kml.md`** — "Public API", "Units and frame", "Invariants",
"Test", "Gotchas": read the part your card names. What a task changes here is written there, in
the same change; this note changes where a module comes or goes. The rules for whoever works on
the pad, and its commands, are `../CLAUDE.md`'s.

## Modules

`wgs84.js`, `wgs84Of` and `ACCURACY_M`, `lv95Of`, `LV95_ACCURACY_M` and `SHEET_WGS84` · `kml.js`, `kmlOf`, the text of a file · `try.js`, the
test file, `pnpm sketch:kml` · `house.js`, `houseFile` and `raiseOf`, `keptRaise` and
`keepRaise`, what the 3D page asks — never the conversion. Each has a `*.check.js` beside it,
and `own.check.js` holds that no file of the pad outside this folder names the conversion, but
`new-plot/geojson.js` and its check, `lv95Of` alone, and `map/page.check.js`, the file
`kml/wgs84.js` alone, as one the map's page loads;
`../check.js` runs each by its name.

## Whoever works here

- The command is run on the made-up plot alone, `tools/sketch/example/plot.json`, by an agent:
  the owner's plot is the orchestrator's to try, and the file the owner's to send.
- A file it writes lies outside the repository, and no `.kml` or `.kmz` is committed.

## Read this when doing that — in `docs/sketch/kml.md`

| Doing | Read |
| --- | --- |
| A module's entry points, the command | "Public API" |
| Metres, the plot's frame, LV95, WGS84, heights | "Units and frame" |
| What always holds | "Invariants" |
| The checks, and the reference points | "Test" |
| KML's name, the check of addresses, a real plot | "Gotchas" |
