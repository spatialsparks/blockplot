# tools/sketch/scene

The sketch as a scene: what its things add up to in space, on the ground of the plot — plain
data for a view in 3D to draw (ST-023) — the parts the house is built of, worked out by rules,
and where the sun stands over the plot (ST-024). Modules that import each other and nothing else.
**It never** touches a browser, three.js or design data, and names no global.

**Its long note is `docs/sketch/scene.md`** — "Public API", "Units and frame", "Test",
"Gotchas": read the part your card names. What a task changes here is written there, in the
same change; this note changes where a module comes or goes. The rules for whoever works on
the pad, and its commands, are `../CLAUDE.md`'s.

## Modules

`scene.js`, `sceneOf`, the entry · `parts.js` · `tops.js` · `house.js`, `objects.js` ·
`walls.js`, `openings.js`, `faces.js`, `slabs.js` · `open.js`, `glass.js` · `steps.js`,
`flights.js` · `clear.js` · `space.js` · `surfaces.js` · `holds.js` · `cut.js`, `shows.js` · `above.js` · `ground.js` · `stations.js` ·
`sun.js` · `fittings.js`, `furniture.js`, `storage.js`, `seats.js`, `lamps.js`, `garden.js`. Each has a `*.check.js` beside it, and more checks hold
what several add up to; `../check.js` runs each by its name.

## Read this when doing that — in `docs/sketch/scene.md`

| Doing | Read |
| --- | --- |
| A module's entry points | "Public API", by the module's name |
| Metres, cells and the plot's frame | "Units and frame" |
| The checks, and what each holds | "Test" |
| Where a thing lies, a flight, a roof, a tree | "Gotchas" |
