# tools/sketch/swisstopo

Whom the sketch pad asks, and how (ST-031): the Federal Office of Topography, swisstopo, for the
page of a new plot — the one exception to "the sketch pad's pages ask the address they were
served from, … and nobody else" (directive 34; `docs/ARCHITECTURE.md`, "The network") — and,
since ST-046, for the pictures of the map under the top view, while the owner has it switched on:
`tools/sketch/under/lay.js` asks the map service, by `tileAddress` of the origin that `asksOf`
reads of the pad page's own word `asks`, and nothing else (`docs/sketch/under.md`). Here are the rules, the pad's one way
of asking, `tools/sketch/swisstopo/door.js`, the pad's own reader of swissALTI3D — the catalogue, a tile in parts, the
ground of a box — and the stand-in that checks and browser tests ask in swisstopo's place.
**The page asks**: `plotMadeOf` of `tools/sketch/new-plot/making.js` calls `groundOf`, for an order,
in the map's page (T-041.3); the pad's server asks nobody since T-041.4, which took away its
`made.js`, its `/new-plot/` and the setting `ASKS`.

## Public API

`tools/sketch/swisstopo/hosts.js` — a module of one import, `cadastre.js`, which imports nothing,
so that a page and the checks both load it. Its own comments say each rule in full.

- `HOSTS` — `map` `wmts.geo.admin.ch`, `search` `api3.geo.admin.ch`, `terrain` `data.geo.admin.ch`
- `asksOf(query)` — whom the map's page asks, by one word of its own address (ST-041, T-041.2),
  `query` its `location.search`: no word `asks`, swisstopo, the three; `?asks=5123`, one port —
  figures alone, 1 to 65 535, no nought before them — a stand-in at it in the place of all three;
  anything else — empty, a word, a host, two `asks` — `{ refused }`: `This page was told to ask
  "<what it was told>": a port of this machine, for a stand-in, or nothing, for swisstopo.`, what
  it was told quoted as JSON, two words joined by `, `, cut to 40 characters. No word names a
  host. `asksIn`, `ASKS` of the server's environment, went with T-041.4
- `mayAsk(origin)` — `https://` and one of the three, or `http://127.0.0.1:` and a port;
  `policyOf(asks)`, the second policy that the map's page puts into its own
  head — pictures from the map's origin, requests to the search's and the terrain's, each origin
  once, `'self'` alone for nobody, and no `frame-ancestors`, which a `<meta>` cannot say. No
  header and no `REFERRER` any more: the page brings both (T-041.2). `saidOf`, the server's line
  of whom it asked, and `pageAsks`, what its `GET /new-plot/` answered, went with T-041.4
- the map, as the service's own list has it: `TILE_PX`, `SHEET` — `{ west, east, south, north }`
  — `LEVELS`, `matrixOf(level)` — `{ columns, rows }` — `layersOf(cadastre)`, the layers of a
  cadastre as `CADASTRE` has one, frozen: `national` and `photo`, and between them, where
  `cadastre` is not null, `cadastral`, of its layer, ending and `to`, with both credits — each
  `{ id, ending, from, to, credits }`; `LAYERS`, `layersOf(CADASTRE)`; `CADASTRAL_FROM`,
  `CADASTRE.from`, or null where there is no cadastre: the cadastral map shows at no level;
  `MARK_FROM`, `FOUND_AT`; and `LV95`, 2056, the frame as the services name it
- the addresses, each null for an origin that `mayAsk` refuses and for a figure that is none:
  `tileAddress(origin, layer, level, column, row)`, `searchAddress(origin, words)` — with
  `SEARCH_MAX` and `PLACES_MOST`, and `queryValueOf(words)`, the words of a search as one value of
  a query, or null: blank, too long or no text — `tileName(year, eastKm, northKm)`, `collectionAddress(origin)`,
  `itemsAddress(origin, names)`, `fileAddress(origin, name)`
- a parcel of the official survey — its three addresses and `egridOf` — is the cadastre's:
  `tools/sketch/swisstopo/parcels.js`, in `docs/sketch/cadastre.md`, "The addresses of a
  parcel", which Blockplot's tree does not hold. `GEOPORTAL`, the name the three hosts share, as
  a plot's words say where a parcel came from, stays here: no other file of the pad may type it
  (`named.check.js`)
- `tools/sketch/swisstopo/cadastre.js` — **the cadastre** (T-044.9): `CADASTRE`, frozen, `{ layer,
  ending, to, credit, from, topic }` — the cadastral map's layer at the map service, the ending
  of its pictures, its last level, the cantons' credit, the level it shows from and the survey's
  topic — or, in Blockplot's tree, `null`: no cadastre. It imports nothing, and is the one module
  of the pad's code that names the layer and the topic (`docs/sketch/cadastre.md`)
- `tools/sketch/swisstopo/parcels.js` — the addresses of a parcel, loaded only where `CADASTRE` is
  not null (`docs/sketch/cadastre.md`)

**The door, and the ground of a box** (T-031.4): four modules that the server loaded until
T-041.4. The door imports nothing of Node (ST-041, T-041.1), so that the map's page loads it
since T-041.3, and asks as the server asked.

- `tools/sketch/swisstopo/door.js` — **the pad's one way of asking another machine**, the map's
  page's since T-041.3 — the server's until T-041.4:
  `getJson(origin, target, options)` and `getBytes(origin, target, options)`, one `GET` each, to an
  origin that `mayAsk` takes and to a `target` that is a path of it, with its query. `options`:
  `timeoutMs` in the place of `TIMEOUT_MS`, 30 000; `maxBytes` in the place of `MAX_BYTES`,
  1 048 576; and for `getBytes` `range: { first, last }`, a part of a file, both bytes included.
  Every `fetch` it makes says `redirect: 'manual'`, `credentials: 'omit'` and `referrerPolicy:
  'no-referrer'`, its `signal` and the one header `Range`. A part is held to its `Content-Range`
  where that can be read, and else — a page of another origin, which swisstopo shows none — to
  its status and its length: exactly the bytes asked for. A redirect is refused with where it
  pointed, or, where a browser hides that, as `The service sends on elsewhere, and was not
  followed: <address>`. What it refuses, each an error that ends with the address that was asked: its own head says
- `tools/sketch/swisstopo/statuses.js` — `STATUS_WORDS`, frozen: `STATUS_CODES` of `node:http`,
  copied entry for entry, so that the door names a status in Node's words without Node. A module
  that imports nothing
- `tools/sketch/swisstopo/catalogue.js` — what the catalogue says, read, with nothing asked in it: `readYears(collection)`,
  `{ first, last }`; `namesOf(tiles, years)`, every name that a tile could have in those years;
  `readNewest(answer, tiles, years)`, for each tile `{ tile, name, year }`, its newest state;
  `MAX_YEARS`, 50. Version 1 of the catalogue: `gsd`, where the parked product reads `eo:gsd`
- `tools/sketch/swisstopo/tile.js` — `readTile(origin, name, cells)`: the heights of `cells` out of the tile of that name,
  rows from south to north; `HEAD_BYTES`, 16 384, what is asked of a tile first
- `tools/sketch/swisstopo/ground.js` — **`groundOf(origin, box)`**, the ground of a box `{ minE, maxE, minN, maxN }` in
  LV95, on whole metres or not: `{ cells, heightsM, tiles }` — `cells`, `{ west, east, south,
  north }`, the cells that cover the box; `heightsM[row][column]`, metres above sea level, each
  the tile's own 32-bit number, rows from south to north and in a row from west to east;
  `tiles`, from south to north and west to east, each `{ name, year }`. It is what `plotOf` of
  `tools/sketch/new-plot/plot.js` takes as `ground`. `MAX_TILES`, 9 (ST-042: a paper of a kilometre
  turned 45° has a box of 1 414.2 m, which lies in three tiles each way at the most; until
  T-042.4, 4). An error where anything is refused,
  never a ground with a gap; nothing is kept on disk, and nothing remembered between two calls
- **What a plot costs in requests**, one after the other: the collection, the items — by every
  name that the box's tiles could have, 8 a tile today — and of each tile its head and a part
  for every row of blocks that the box needs — two where the row is longer than a megabyte. A
  plot of a house: five to ten. The largest paper that the pad takes, a kilometre on nine
  tiles: some eighty — the collection, the items by 72 names, nine heads and some seventy
  parts. A head is 16 kB, a row of blocks some 50 kB to a megabyte; a request has 30 seconds,
  and an answer a megabyte

**The reader of a tile** (T-031.2): four modules that import each other and nothing else.

- `tools/sketch/swisstopo/lzw.js` — `decodeLzw(packed, byteCount)`: TIFF's LZW undone, exactly so many bytes or a refusal
- `tools/sketch/swisstopo/tiff.js` — `readTileHead(bytes)`: what a tile states of itself in its first bytes, in the one
  form that swisstopo publishes, every other refused with why; `MAX_BLOCK_CELLS`, 512 by 512
- `tools/sketch/swisstopo/grid.js` — `CELL_M`, 0.5, `LV95_EPSG`, 2056, `cellsCovering(box)`, `middleOf`, `tilesOf(cells)`,
  `cellsIn(tile, cells)`: a box is `{ minE, maxE, minN, maxN }`, cells `{ west, east, south, north }`,
  counted from the zero of LV95, a tile `{ eastKm, northKm }`. `tilesOf` refuses with a
  `RangeError` cells that are no whole numbers that count exactly, and cells that lie where no
  tile's name of four figures can hold them
- `tools/sketch/swisstopo/blocks.js` — `windowOf(tile, cells)`, `blocksOf(tile, window)`, `rangesOf(blocks)`,
  `JOINED_WITHIN_BYTES`, 4096: which blocks a box needs, and which parts `{ first, last }` of the file —
  blocks joined only while the part stays within the door's `MAX_BYTES`, so that a box across a
  whole tile, a row of sixteen blocks of up to 64 kB, is asked in two parts (T-042.4)
- test support, which no page and no module of the pad's pages imports: `tools/sketch/swisstopo/made-up-tile.js` — `packLzw`,
  `madeUpTile(tile)`, a tile written in memory, `fieldOf`, `changed`; `tools/sketch/swisstopo/made-up.js` — the made-up
  world at the origin of the Swiss grid, rules and no file: `heightAt`, `TILES`, `PLACES` and what
  the services answer of them; `tools/sketch/swisstopo/__fixtures__/` — three copies of the parked product's, and in
  `catalogue/` two answers of the real catalogue (each folder's note); and
  `tools/sketch/swisstopo/as-a-browser.js` — `asABrowser(ask)`, a way of asking that asks by `ask`
  and shows each answer as Chromium shows a page of another origin, where the service says
  `Access-Control-Allow-Origin: *` and exposes no header: the headers cut to `SAFELISTED`, the
  CORS-safelisted ones (`cache-control`, `content-language`, `content-length`, `content-type`,
  `expires`, `last-modified`, `pragma`); a 3xx asked under `redirect: 'manual'` an answer of
  type `opaqueredirect`, status 0, with no header and no body; and an answer without
  `Access-Control-Allow-Origin` a `TypeError`, as a failed request. It shows no preflight, and
  unpacks nothing
- **the stand-in**, `node tools/sketch/swisstopo/stand-in.js`: on 127.0.0.1 alone, at `PORT` or —
  none named, or named empty — at a port that the system picks, it says `The stand-in for
  swisstopo: http://127.0.0.1:<port> - made-up pictures, places and ground. Ctrl+C stops it.` and
  answers for all three hosts, by `GET`; a preflight, `OPTIONS` with
  `Access-Control-Request-Method: GET`, at any address, with 204; any other method with 405, and
  what it does not know with 404. Every answer says `Access-Control-Allow-Origin: *`, and none
  `Access-Control-Expose-Headers`, as swisstopo answered the trial of 2026-10-20 (ST-041). The
  map's page is told of it by its address, `?asks=<its port>` (T-041.2). Its parcels are
  `tools/sketch/swisstopo/made-up-parcels.js`'s (T-043.2), test support as `made-up.js` is, and
  loaded by the stand-in, with `parcels.js`, only where `CADASTRE` is not null — where it is null
  the stand-in answers no parcel, a 404 (T-044.9):
  `PARCELS`, nine made-up parcels near the origin, on the made-up slope, each `{ municipality,
  number, egrid, canton, type, polygons }` — **Musterlingen 1234**, `CH000000001234`, seven
  corners and 1 201.43 m² round E 2 600 020 / N 1 200 010, where the browser tests' `openNear`
  brings the map; **Musterlingen 77** twice, `…0771` and `…0772`, and **Ober-Musterlingen 77**,
  `…0773`; **1235**, a square of 40 m with a hole of 10 m; **1236**, of two parts, the larger
  second; **1237**, a `Baurecht`, and **1234-1**, `CH000000012341`, a `StWE`, no land; and
  **1238**, 120 corners on a circle of 25 m — and `parcelsFor(words, limit)`, `parcelOf(egrid)`,
  `parcelsAt({ e, n })`, each `{ status, type, body }` as `placesFor` gives:

  | Asked, at the address that `tools/sketch/swisstopo/hosts.js` or `parcels.js` builds on its origin | It answers, of `tools/sketch/swisstopo/made-up.js` and `made-up-parcels.js` |
  | --- | --- |
  | a picture, `tileAddress` | an SVG of 256 by 256 that says its layer, level, column and row, in the layer's tint |
  | a search, `searchAddress`, with whatever `limit` | the four places, as many as `limit`; none for `nowhere`, 500 for `fails`, no JSON for `garbage` |
  | a parcel's search, `parcelSearchAddress`, with the pad's `limit` alone | `{ results }`, each `{ id, weight, attrs }` as a place's, `attrs.origin` `parcel`, `attrs.label` the trial's HTML — `<b>Musterlingen</b> 1234 (CH 0000 0000 1234)` — `attrs.y` and `attrs.x` a point inside it, `attrs.geom_st_box2d` its box, and no boundary: every parcel whose number is the last word and whose municipality holds the words before it, in any case; 500 for `fails`, no JSON for `garbage` |
  | a parcel's find, `parcelAddress`, by its EGRID | `{ results }`, the parcel of that EGRID or none: a GeoJSON feature — `type`, `id`, `featureId`, `layerBodId`, `layerName`, `bbox`, `geometry`, `properties` — a `Polygon`, or a `MultiPolygon` for 1236, in LV95, each ring closed; `properties` the trial's `number`, `ak`, `identnd`, `egris_egrid`, `realestate_type` |
  | the parcel under a place, `parcelAtAddress`, its two figures of `geometry` | the same features, of every parcel whose area holds the place: none in the hole of 1235, none beside every parcel |
  | `collectionAddress`, `itemsAddress` | the collection; an item for each state of the tiles named |
  | a tile's file, `fileAddress` | the newest state's, whole or by `Range` — 206, or 416 from its end on; an older state's, 404 |
  | a preflight, `OPTIONS` with `Access-Control-Request-Method: GET`, at any address | 204, no body: `Access-Control-Allow-Methods: GET`, `Access-Control-Allow-Headers: range` |
  | `/asked`, `/asked?forget` | every request since, an `OPTIONS` too: `{ method, target, range, referer, cookie, origin, beside }` |

## Invariants

1. **The three hosts are named in `tools/sketch/swisstopo/hosts.js`, typed in once more in `tools/sketch/swisstopo/hosts.check.js`, and in no
   other file of the pad**: every other script, and every other check, takes one from `HOSTS`.
2. **No address that is asked is made of what a page or a service handed over**: an origin that
   `mayAsk` takes, figures that the pad worked out, and words in one value of a query — and one
   thing that a service handed over: an EGRID, the search's label of which a pick is then asked
   by its EGRID, as the trial found that it must (ST-043), **once `egridOf` gave it** — fourteen
   signs that the pad checked, in one value of a query. A tile's
   file has its address built here, never taken from the catalogue's answer: the link that the
   catalogue lists is held against that address, and a link that is another is a refusal, never
   a request.
3. **No word `asks` of the map's page's address names another host, and no check and no test
   opens that page without a stand-in's `asks`** — which would ask swisstopo: the rule is held in
   `tools/sketch/swisstopo/hosts.check.js`, and the browser tests' gate,
   `tests/e2e/sketch-own-pad.ts`, refuses whatever goes to neither the pad nor the stand-in.
4. **The reader is the parked product's, written anew** (`packages/adapters/src/geodata/terrain/`,
   of which nothing is imported): its form, its limits and the words of its refusals are argued
   in ADR-0045, ADR-0048 and ADR-0052, and a refusal says what the parked one says, to the letter
   — but in two places, where the pad's is stricter: a text of the tile is repeated quoted and
   cut, and cells that cannot be counted are refused (ADR-0125).
5. **The pad holds no tile**: a made-up one is written in memory, by a rule. And the stand-in
   builds no address: a request is what `tools/sketch/swisstopo/hosts.js` builds of its figures, or a 404.
6. **`tools/sketch/swisstopo/door.js` is the one script of this folder that asks another machine**
   — of the pad, the scripts of `tools/sketch/map/` ask too: the map's pictures, Find's search and
   the parcel's three requests (`take.js`, T-043.5), each by an address of `hosts.js` or `parcels.js`
   (`tools/sketch/swisstopo/named.check.js`) — and it
   asks an origin that `mayAsk` takes and no other — said before anything is sent. It imports
   nothing of Node, and asks from a page of the browser as from Node. It sends no header but
   `Range`, and nothing of the person's — no cookie, no referrer, no name: every `fetch` says
   `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`. **It follows no redirect** — where
   a browser hides where it points, it is refused all the same — takes **no whole file for a
   part** — status 206 and saying so in `Content-Range`, or, where that cannot be read, exactly
   the bytes asked for; else it is refused — and reads **no answer beyond its size**: a
   megabyte, or what its request states, and a part its own length. So no whole tile is ever read.
7. **One request after the other** (ST-031, rule 9): the collection, the items, then tile by tile
   its head and its parts. Nothing is fetched ahead, nothing twice, and nothing in bulk.
8. **An error says what did not come, in words, and ends with the address that was asked.** It
   repeats no word of a service but quoted, cut, and with every sign that could steer a terminal
   written out by its number; a status is named in Node's words for its number.

## Test

`pnpm sketch:check` finds twenty-one checks here by their names. `tools/sketch/swisstopo/hosts.check.js` — `tools/sketch/swisstopo/hosts.js` by
hand, with nothing running: the national map and the photo typed in, `layersOf(null)` those two
alone and `layersOf` of a made-up cadastre a third between them, `LAYERS` as `layersOf(CADASTRE)`
and `CADASTRAL_FROM` as `CADASTRE`'s level or null, so that both values of the switch are held
here (T-044.9), and every case of what a picture is and is not on the photo, which every pad
has; `tools/sketch/swisstopo/cadastre.check.js` (T-044.9) — the real cadastre's: its six figures
typed in, and frozen, the cadastral map made of them, its level, a metre a pixel, and its
picture at the origin of the Swiss grid to the letter — the cadastre's own, which Blockplot's tree
leaves out; `tools/sketch/swisstopo/hosts-parcel.check.js` (T-043.1) — the
three addresses of a parcel, of `parcels.js`, the trial's three requests typed in at the origin of the Swiss grid
on the search's origin, which it builds of `HOSTS`, and on a stand-in's; what is none of each;
and `egridOf` by hand; what `tools/sketch/routes.js` gives of the map's folder is
`tools/sketch/plot-routes.check.js`'s since T-041.4. `tools/sketch/swisstopo/named.check.js` — invariant
1 and the rest of "the pad's code names three hosts and no other", over every `.js`, `.html` and
`.css` of the pad, each rule with its proof on a folder of its own making; its head says the
rules. Beside the three hosts and 127.0.0.1 it lets two names of a kind of file through, which
nobody asks, each to the letter: SVG's, `http://www.w3.org/2000/svg`, and KML's,
`http://www.opengis.net/kml/2.2`, for the Google Earth file (T-016.1) — and refuses
`http://www.opengis.net/kml/2.3` as a host it may not name. It lets through, too, the four
names of frames of a GeoJSON's `crs` that New plot's reader takes (`tools/sketch/new-plot/geojson.js`,
T-045.4), each to the letter, typed in again: `http://www.opengis.net/def/crs/EPSG/0/2056`,
`http://www.opengis.net/def/crs/OGC/1.3/CRS84`, `http://www.opengis.net/def/crs/EPSG/0/4326`
and `http://www.opengis.net/def/crs/EPSG/0/21781` — and refuses
`http://www.opengis.net/def/crs/EPSG/0/3857` as a host it may not name. `tools/sketch/swisstopo/served.check.js` — the server itself, told its port alone
(T-041.4): the map's page under its own name alone, with no header of its own; and on the made-up
pad that page a 204 with nothing, and nothing else of its folder.

Six hold the reader and its test support, with nothing running — `tools/sketch/swisstopo/lzw.check.js`, `tools/sketch/swisstopo/tiff.check.js`,
`tools/sketch/swisstopo/tiff-types.check.js`, `tools/sketch/swisstopo/grid.check.js`, `tools/sketch/swisstopo/blocks.check.js`, `tools/sketch/swisstopo/made-up-tile.check.js`: **every case of
the parked tests, under its title and with its figures, 136**, and nineteen of the pad's own — the
three fixtures and the parked product's four recorded tiles by length and SHA-256 among them, and
three for where the pad's reader is stricter (T-031.4). `tools/sketch/swisstopo/stand-in.check.js` starts the stand-in
and asks it by `node:http`: every row but the preflight's, which `tools/sketch/swisstopo/door-browser.check.js` holds, and the parcels', a picture of each layer that `LAYERS` has, a tint each, the world by hand, a made-up tile read back in parts to the
heights of its rule, each tile to the bytes of the slow way. `tools/sketch/swisstopo/stand-in-parcels.check.js` (T-043.2)
starts it the same way and holds the three rows of a parcel, every made-up parcel by hand: the
labels to the letter, each EGRID in its four groups, `Musterlingen 77` three, `Musterlingen 1234`
one, `Musterlingen 9999` none, `fails` 500, `garbage` no JSON; the find of every EGRID, rings
closed and every figure to the decimetre, the hole of 1235, the two parts of 1236, the 120
corners of 1238, the two that are no land, `CH000000009999` none; the identify at E 2 600 020 /
N 1 200 010 in 1234, the search's point of every parcel in it, the hole and beside every parcel
none; `/asked` with each, in its order; and a 404 for what `parcels.js` builds not — another
`limit`, another layer, `tolerance=5`, a third figure in `geometry`, an EGRID in lower case.
Both wait for the stand-in's line — `stand-in.check.js` and `tests/e2e/sketch-own-pad.ts` by its
words — which says nothing of parcels and stays as it is. **The seven modules were tried with
592 breaks, each alone**: all but eight fail a check (which, and why: ADR-0124).

Eight hold the door and the ground of a box (T-031.4; the eighth T-041.1's) — **the parked tests of the plumbing and of
the terrain's client, case for case where they hold of this door and this reader**, each on the
stand-in, started as a process of its own, or on servers of the check's own on 127.0.0.1; none
asks another machine, and none writes a file. `tools/sketch/swisstopo/door.check.js`, 19 cases: whom it asks — each of
the three hosts over https, with a `fetch` of the check's own in the place of the machine's, which
notes the address and what it is handed — `redirect: 'manual'`, `credentials: 'omit'`,
`referrerPolicy: 'no-referrer'` — and sends nothing; and for fourteen origins that it does not ask, and twelve
targets that are no path of their service, that `fetch` is never called — an answer, a status, an
HTML page, a redirect refused with where it pointed, a service that does not answer.
`tools/sketch/swisstopo/door-parts.check.js`, 14: a part asked for with `Range` and with no header of the pad's, a part
that is another — one that says nothing of itself among them, shorter or longer than was asked
for — the whole file in its place — and the server sees the client go before it has
sent a tile — and the stand-in's tile, its head and its end.
`tools/sketch/swisstopo/door-browser.check.js`, 9 (T-041.1): the door as a page of another origin meets it, through
`asABrowser` — the text of `door.js` and `tools/sketch/swisstopo/statuses.js` imports nothing of Node, and `STATUS_WORDS`
equals `STATUS_CODES`, key for key; what `fetch` is handed; on servers of its own, a part of
exactly the bytes asked taken, one byte short refused — the end of a file too, which Node takes
— a whole file for a part refused, an opaque redirect refused with the address and nothing asked
after it, and no `Access-Control-Allow-Origin` `could not be reached`; **the first hand case of a
plot through the stand-in, as a browser and by Node, the same ground height for height by the
same eight `GET`s in the same order**; and the stand-in's preflight, 204 and its three headers,
no `Access-Control-Expose-Headers`, and the `OPTIONS` at `/asked`. `tools/sketch/swisstopo/door-size.check.js`, 13: an answer
that states its length, one that states none, one that never ends, one that stalls, a packed
one. `tools/sketch/swisstopo/catalogue.check.js`, 43: **the two answers of the real catalogue, held to their length and
their SHA-256, and read** — the years 2019 to 2026, the state of 2025 at the address that the pad
builds — and every answer that is refused. `tools/sketch/swisstopo/ground.check.js`, 5, through the stand-in: a box in
one tile, one where four meet, and **the first hand case of a plot (T-031.3) — 102 rows of 98
heights, two tiles of two years, in the eight requests of its card**, by the stand-in's own
account. `tools/sketch/swisstopo/ground-parts.check.js`, 20: tiles whose every cell differs, in blocks and in tiles that
are not square, and a file that comes in parts and is not as its directory says.
`tools/sketch/swisstopo/ground-refused.check.js`, 19: a tile of another form, a catalogue that says another thing, the
stand-in stopped, and every box that is refused with nothing asked. **The four modules were
tried with 244 breaks, each alone**, on a copy outside the repository — 102 of the door, 62 of
the catalogue, 50 of the tile, 30 of the ground: a check fails for every one. Nine did not at
first: six gained their case, and three were lines that held nothing, which went (the ADR of
T-031.4). And the two fixes of the reader with 29: every one fails a check.

## Gotchas

- **`tools/sketch/swisstopo/named.check.js` reads text**: `` `https://${host}` `` and `'https://' + host` are "a host
  that the script puts together", whatever `host` holds; and it does not hold a script of Node's
  that asks without `fetch(`. What keeps a check on this machine all the same is the gate,
  `tools/sketch/offline.js`; what keeps the map's page there is its policy. A check that must try a
  fourth host puts it together, as `other('example.org')` in `tools/sketch/swisstopo/hosts.check.js` does — and a
  comment is text too: a link to a document stands in a note, never in a script or a page.
- An address takes **any** origin that may be asked, not its own service's: with a stand-in
  all three are one. The caller hands `asks.map`, `asks.search` or `asks.terrain`.
- 80 characters of a search are 80 as a script counts them, which is what `maxlength` counts.
- **The stand-in is stricter than swisstopo**: a blank as `+`, the fields in another order or a
  level written `026` are a 404. A request for the terrain waits 5 ms, so that two sent at once
  show `beside` 1. Whoever starts it beside a pad hands it `PORT` empty, or it takes the pad's.
  A parcel's search is taken with the pad's own `limit` alone, where a place's takes any.
- **A made-up parcel's fields stand under `properties`**, as GeoJSON has them: the trial named
  the fields and not the key that holds them, and the pad's reader takes `attributes` too
  (T-043.3). `Baurecht` and `StWE` are made-up words — the trial saw `realestate_type` `null`,
  for land, and no other value. Where the trial was silent — `id`, `layerName`, a search's `rank`
  — the stand-in makes one up. The ring of 1238 is worked out by a rule, each corner on the
  circle to the decimetre, and a corner that so falls on one line with its two neighbours moved
  out a decimetre — 31 of them: the made-up survey has no corner that a reader could drop.
- **`madeUpTile` takes `flatOutside` at its word**: a world whose rule left its box would be
  served wrong, and one cell read back would not show it — the slow way in the check does.
- `CELL_M` is the parked `CELL_SIZE_M`, `packLzw` its `encodeLzw`. Seven files are full, at 295 to
  299 of the linter's 300 lines — `tools/sketch/swisstopo/made-up-tile.js`, its check, `tools/sketch/swisstopo/stand-in.check.js`,
  `tools/sketch/swisstopo/tiff.check.js`, `tools/sketch/swisstopo/door.check.js`, `tools/sketch/swisstopo/catalogue.check.js`, `tools/sketch/swisstopo/ground-parts.check.js` — and
  `tools/sketch/swisstopo/door-parts.check.js` stands at 295, `tools/sketch/swisstopo/ground-refused.check.js` at 296 and `tools/sketch/swisstopo/blocks.check.js` at 294: what is checked next of
  the door or of the ground wants a check of its own, as two cases of a tile in parts already
  stand in `tools/sketch/swisstopo/ground-refused.check.js`. `tools/sketch/swisstopo/hosts.js`
  stands at 252 since T-044.9, which moved the three addresses of a parcel to `parcels.js`.
  `tools/sketch/swisstopo/stand-in-parcels.check.js` stands at 268, and
  `tools/sketch/swisstopo/stand-in.js` at 199.
- **The door is another than the parked plumbing in three things**, each of which stops the pad
  from making a plot, with the reason in words, should swisstopo change its ways: a redirect is
  refused, to whatever host — `The service sends on to "<where>", and was not followed` — a
  service that ignores `Range` is refused, where the parked plumbing cuts the part out of the
  whole file, and an answer holds a megabyte where the parked one takes 32 MiB.
- **In a browser the door is told less, and says less** (T-041.1, its proposed ADR). A page of
  another origin reads no header that the service does not expose, and swisstopo exposes none:
  so no `Content-Range`, and a part is held to its status and its length alone — exactly the
  bytes asked for. A part of another offset but the right length is not told there; a part that
  is shorter, the end of a file among them, is refused, which Node takes for what its
  `Content-Range` says — the pad asks no part beyond a file's end of swisstopo: a tile's head is
  16 384 bytes of megabytes, and a block's part is what the tile's directory names. A redirect is
  an answer of type `opaqueredirect` there, with no `Location`: refused as `The service sends on
  elsewhere, and was not followed: <address>`, and where it pointed is never said. Under
  `redirect: 'manual'` a browser does not follow it; one that did would be refused at the next
  answer's part or JSON all the same. A service that does not allow every origin is `could not
  be reached`.
- **`STATUS_WORDS` is a copy** of Node's `STATUS_CODES`: a Node of another version that names a
  status anew makes `tools/sketch/swisstopo/door-browser.check.js` fail, and `tools/sketch/swisstopo/statuses.js` is copied anew from it.
- **An answer is held to its size before its status is read**, as the card has the order: an
  error page that is longer than the part that was asked for is refused for its size — `The
  service answered with more than 10 bytes` — and its status is not said. A tile's head is
  16 384 bytes and a real block 9 kB or more, so an error of a few hundred bytes is named by its
  status; a part of ten bytes, as a check may ask for, is not.
- **A status is named in Node's words**, `404 Not Found` whatever the service said of its 404,
  and by its number alone where Node has no words for it — the words of `STATUS_WORDS`, so a
  page names it as the server does. What a service says of itself — where
  it sends on, what it calls a part — is quoted, cut to 80 characters, and every sign beyond the
  plain ones of ASCII written out: `\u009b`, `\u00fc`. The catalogue's refusals cut to 60, as the
  parked ones do; `tools/sketch/swisstopo/tiff.js` writes a tile's text as JSON writes one, with the signs 127 to 159
  by their number too, and leaves a Latin-1 letter as it is (`tools/sketch/swisstopo/tiff-types.check.js`, "±9999").
- **The door looks `fetch` up at every request**, on `globalThis`: so a check hands it one of its
  own — `asABrowser(fetch)` among them. Nothing else of the pad may: `tools/sketch/swisstopo/named.check.js` holds where `fetch(` stands,
  and `tools/sketch/swisstopo/as-a-browser.js` calls what it is handed under another name.
- `readNewest` holds a file's link by its end — the path that `fileAddress` builds — and not by
  its host: with a stand-in the host is this machine's. The file is asked for at the pad's own
  address either way.
- **`groundOf` refuses a box before anything is asked** with a `RangeError`: no four numbers, no
  ground, cells that are no numbers that count exactly, more than nine tiles — `The box lies in
  12 tiles of a square kilometre, and 9 are read at most.` A box whose kilometres no tile's name
  can hold is refused as early by `tools/sketch/swisstopo/grid.js`, in its own words: an order's corners are held to
  the sheet of the map, so no owner meets it. Every other refusal is an `Error` that ends with
  an address: `The download service's answer was refused: <why>: <address>` for the catalogue,
  the reader's words and the tile's address for a tile.
- A check that waits for a server to see its client go gives it three seconds: an answer that is
  dropped unread and not let go of is let go of only when the machine tidies up, some seconds on,
  and such a check would pass late where it should fail.
