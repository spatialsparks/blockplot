# tools/sketch/map

The page of a new plot (ST-031): swisstopo's map, brought nearer, taken further and moved; a
place found on it by its words; the corners of a plot marked on it — or a parcel's taken whole,
by its number, its EGRID or a click (ST-043), or a GeoJSON file's (ST-045) — the plot named, and made.
The one page of the pad that asks another machine, whom the word `asks` of its address says.
File's "New plot" leads here, where `GET map/index.html` answers 200: the made-up pad answers it
with 204, and has nothing else of this folder (T-041.4). **It never**
asks a host that `../swisstopo/hosts.js` does not name, and writes no script or style into a tag.

**Its long note is `docs/sketch/map.md`** — "Public API", "What the owner does there",
"Invariants", "Test", "Gotchas": read the part your card names. What a task changes here is
written there, in the same change; this note changes where a module comes or goes. The rules
for whoever works on the pad are `../CLAUDE.md`'s.

## Modules

`index.html`, the page, and `map.css` · `page.js`, its one script · `view.js`, the arithmetic
of a view, and where the map goes for an outline taken (`goesTo`, T-045.2) · `map.js`, the map · `find.js`, a place found · `marking.js`, a plot while it is
marked, with nothing of the page in it, its corners set by hand, or a parcel's or a GeoJSON
file's taken whole ·
`marks.js`, the corners marked on the map · `file.js`, a GeoJSON file's outline, chosen or
pasted, read in the page and taken onto the marks, in both trees (ST-045) · `take.js`, a parcel asked for and taken onto the
marks — the cadastre's, which `page.js` loads by `import()` only where the pad offers it, and
shows `#parcel-part` then (`docs/sketch/cadastre.md`) · `make.js`, the plot made in the page. Each script
but `map.js`, `marks.js` and `file.js`, the page's wiring, has a check beside it — `marking.js` three,
`marking.check.js`, `marking-parcel.check.js` and `marking-geojson.check.js` (ST-045).

## Read this when doing that — in `docs/sketch/map.md`

| Doing | Read |
| --- | --- |
| A module's entry points, the page's controls | "Public API" |
| What the owner sees and does, step by step | "What the owner does there" |
| What the page always does, whom it asks | "Invariants" |
| The checks and the browser tests of the map | "Test"; `tests/e2e/sketch-map*.spec.ts`, `sketch-new-plot*.spec.ts` |
| The page going away, a refusal, `../` | "Gotchas" |
