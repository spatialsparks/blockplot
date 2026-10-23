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
map's page loads through `take.js` only where the pad offers it (ST-043; `docs/sketch/cadastre.md`). Each has a `*.check.js` beside it, `making.js` three — `making.check.js`, the golden
file `tests/__fixtures__/new-plot/trial-slope.json`, which the server's `made` gave, and
`trial-slope-photo.json`, the same pentagon marked on the photo (T-044.10);
`making-refused.check.js`; and `made-large.check.js`, a plot of 800 m by 600 m, its ground as
squares (plot file version 3, ST-042); and `plot.js` two, `plot.check.js` and
`plot-parcel.check.js`, an order that names its parcel and the plot that says so (ST-043).
`parcel.check.js` reads answers that it makes up, in the shape of swisstopo's.

## Read this when doing that — in `docs/sketch/new-plot.md`

| Doing | Read |
| --- | --- |
| What an order is, and what is refused | "Public API", `request.js`; "Invariants" |
| A parcel typed, listed or read into corners | "Public API", `parcel.js`; "Gotchas" |
| What the page makes of an order | "An order made"; "Public API", `making.js` |
| Corners, ground and the frame of a plot | "The frame, as the pad has it", "The rule, in its order" |
| The checks, and what each starts | "Test" |
| What surprised | "Gotchas" |
