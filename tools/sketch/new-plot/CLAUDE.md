# tools/sketch/new-plot

The making of a plot (ST-031): a plot marked on the map becomes a plot's file among the owner's
data. The order and its sentences, the one computation of a plot from its corners and the
ground under them, and an order made in the page: its ground asked by the page, the text of its
file made (ST-041). The server's part, `POST /new-plot/` and `made.js`, went with T-041.4.
**It never** takes an address to ask from a page, and never writes a plot's file over another.

**Its long note is `docs/sketch/new-plot.md`** — "Public API", "An order made", "The frame, as
the pad has it", "The rule, in its order", "Invariants", "Test", "Gotchas": read the part your
card names. What a task changes here is written there, in the same change; this note changes
where a module comes or goes. The rules for whoever works on the pad are `../CLAUDE.md`'s.

## Modules

`request.js`, the order · `frame.js`, the plot's frame · `plot.js`, the one computation,
`plotOf` · `making.js`, the plot of an order made in the page, `plotMadeOf`, which the map's
page loads · `parcel.js`, a parcel read — what was typed (`typedOf`), what a search lists
(`parcelsOf`), a boundary as the corners of an order (`boundaryOf`) — the cadastre's, which the
map's page loads through `take.js` only where the pad offers it (ST-043; `docs/sketch/cadastre.md`) ·
`ring.js`, the outline of a polygon's parts, `largestOf` — the largest part's corners and what
was left out — which `parcel.js` and `geojson.js` use, in Blockplot's tree (T-045.2) ·
`geojson.js`, a GeoJSON file read, `outlineOf` — the text of a file or of what was pasted, as
one outline's corners in LV95, WGS84 converted by `lv95Of` of `../kml/wgs84.js`, or refused in
one sentence (T-045.4). Each has a `*.check.js` beside it, `making.js` three — `making.check.js`, the golden
file `tests/__fixtures__/new-plot/trial-slope.json`, which the server's `made` gave,
`trial-slope-photo.json`, the same pentagon marked on the photo (T-044.10), and
`trial-slope-file.json`, the same pentagon taken from a GeoJSON file (T-045.1);
`making-refused.check.js`; and `made-large.check.js`, a plot of 800 m by 600 m, its ground as
squares (plot file version 3, ST-042); `plot.js` three, `plot.check.js`,
`plot-parcel.check.js`, an order that names its parcel and the plot that says so (ST-043), and
`plot-geojson.check.js`, the plot of corners from a file and what it says (ST-045); and
`request.js` two, `request.check.js` and `request-geojson.check.js`, an order whose corners came
from a file.
`parcel.check.js` reads answers that it makes up, in the shape of swisstopo's; `ring.check.js`,
rings worked out by hand; `geojson.check.js`, made-up GeoJSON, the pentagon in LV95 and in WGS84.

## Read this when doing that — in `docs/sketch/new-plot.md`

| Doing | Read |
| --- | --- |
| What an order is, and what is refused | "Public API", `request.js`; "Invariants" |
| A parcel typed, listed or read into corners | "Public API", `parcel.js`; "Gotchas" |
| The rule of a polygon's outline: the part, the corners, what is left out | "Public API", `ring.js` |
| A GeoJSON file read: its frame, WGS84 converted, its refusals | "Public API", `geojson.js` |
| What the page makes of an order | "An order made"; "Public API", `making.js` |
| Corners, ground and the frame of a plot | "The frame, as the pad has it", "The rule, in its order" |
| The checks, and what each starts | "Test" |
| What surprised | "Gotchas" |
