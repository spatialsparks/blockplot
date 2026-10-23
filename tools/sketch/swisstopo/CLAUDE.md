# tools/sketch/swisstopo

Whom the sketch pad asks, and how (ST-031): swisstopo, for the page of a new plot — the one
exception to "the sketch pad's pages ask the address they were served from, … and nobody
else" (directive 34). The rules of every address, the pad's one door — the map's page's since
T-041.3, and no more the server's (T-041.4) — the pad's own reader of swissALTI3D, and the
stand-in that the checks and browser tests ask in swisstopo's place. **No other file** of the pad names their hosts.

**Its long note is `docs/sketch/swisstopo.md`** — "Public API", "Invariants", "Test",
"Gotchas": read the part your card names. What a task changes here is written there, in the
same change; this note changes where a module comes or goes. The rules for whoever works on
the pad are `../CLAUDE.md`'s; `__fixtures__/` keeps its own notes here.

## Modules

`hosts.js`, the three hosts, the word `asks` of the map's page's address and its policy ·
`cadastre.js`, the cadastre — the cadastral map's layer and the survey's topic, named nowhere
else, or null in Blockplot's tree — and `parcels.js`, a parcel's addresses, the cadastre's own
and loaded only where it is not null (`docs/sketch/cadastre.md`) ·
`door.js`, the one way of asking, which imports nothing of Node, for a page and the checks, and `statuses.js`, the words it names a status
in · `catalogue.js`, `tile.js`, `tiff.js`, `lzw.js`, `blocks.js`, `grid.js`, `ground.js` —
swissALTI3D read · `stand-in.js`, `made-up.js`, `made-up-tile.js`, `made-up-parcels.js` — the
stand-in, and its made-up parcels of the survey — and
`as-a-browser.js`, what a page of another origin is shown of an answer: test support, as
`made-up-tile.js` is. Their checks stand beside them, `named.check.js` among them: no file names
a host of theirs but `hosts.js` and its check.

## Read this when doing that — in `docs/sketch/swisstopo.md`

| Doing | Read |
| --- | --- |
| A module's entry points, an address | "Public API" |
| What is asked, and what is refused | "Invariants" |
| The checks, the stand-in and the recorded answers | "Test"; `__fixtures__/CLAUDE.md` |
| A redirect, a part, a size, a link in a comment | "Gotchas" |
