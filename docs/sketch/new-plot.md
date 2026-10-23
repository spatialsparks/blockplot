# tools/sketch/new-plot

The making of a plot (ST-031): a plot marked on a map becomes a plot's file among the owner's
data. Here are **the order** — what an order is, the sentences, the folder of a name (T-031.1);
**the one computation** — of corners and the ground under them, the plot as the pad has one
(T-031.3); and **an order made, in the page** (ST-041, T-041.3): the ground asked by the page
through the pad's one door, the plot worked out and the text of its file made — `making.js`,
which the map's page loads (`tools/sketch/map/make.js`), from File's "New plot". The server's
part, `POST /new-plot/` and `made.js`, which wrote the plot into a folder of the server's
(T-031.6), went with T-041.4: the pad's server makes no plot.

## Public API

`tools/sketch/new-plot/request.js` — a module that imports nothing, so that the map's page and the browser's store
(`tools/sketch/store/rules.js`) both load it. Its own comments say each rule in full. `NEW`,
`MAKE_MAX_BYTES` and `asked`, the server's address of a new plot and what a request there was to
do, went with T-041.4.

- `orderOf(text)` — an order read, `{ name, corners, side, aroundM, on }`, and `parcel` or
  `file` where it had one, or `{ status: 400, refused }`: one sentence, the first of the
  module's list of eleven that holds. A corner is `[easting, northing]` in LV95; `side` is the corner that the side
  begins at; `on` is one of five — a map, the photo, or a map and the photo, in that order:
  `["national"]`, `["cadastral"]`, `["photo"]`, `["national","photo"]`, `["cadastral","photo"]`
  (the national map one since T-044.10, for a pad that offers no cadastre; never the two maps).
  Any other is refused, the eighth sentence: `It does not say what the corners were marked on: a
  map, the aerial photo, or a map and the photo.` `parcel` (ST-043, T-043.1) is absent
  where the corners were marked by hand, or `{ egrid, number, canton, asGiven }`: `egrid` `CH`
  and twelve figures — the rule of `egridOf` of `tools/sketch/swisstopo/parcels.js`, said again,
  and `plot-parcel.check.js` holds the two to be one; `number` a text that is not blank,
  `NUMBER_MAX`, 20, characters at the most; `canton` two capital letters, as `BE`; `asGiven`
  true or false — whether the corners are still the parcel's as given, or were changed by hand
  since. Any other shape is refused, the ninth sentence, after `on`'s: `Its parcel is none: an
  EGRID, CH and twelve figures; a number of 20 characters at the most; a canton, two capital
  letters; and whether its corners are as given.` `file` (ST-045, T-045.1) is absent but where
  the corners came from a GeoJSON file the person gave, and then exactly `{ wgs84, asGiven }`,
  two booleans: whether its corners were converted from WGS84, and whether they are still as the
  file gave them. With a `file`, `on` may also be `[]` — corners that no map showed, as a file's
  are until one is set or moved — or any of the five; without one, `[]` is refused in the eighth
  sentence. Any other shape of a file is refused, the tenth sentence, after the parcel's: `Its
  file is none: whether its corners were converted from WGS84, and whether they are as given.`;
  and a parcel and a file together, the eleventh: `It has a parcel and a file: its corners are
  the one's or the other's.` Nothing else of the file is in an order. Limits: `NAME_MAX`, 80; `CORNERS_MAX`, 1000
  (50 until T-043.1: a parcel's boundary is taken with all its corners, for hand and parcel
  alike — `It has no outline: three corners to 1000, each an easting and a northing in
  metres.`); `AROUND_MAX_M`, 20 — and `AROUND_M`, 5, is what a page offers
- `SAID` — the sentences that the cards after this one say, written here once: `same`, `flat`,
  `crosses`, `large(alongM, acrossM)`, `steep(fromM, toM)`, `ground(why)`, `disk(why)` —
  `nobody`, the server's refusal on a pad that asked nobody, went with T-041.4. `PAPER_MAX_M`, 1000: a paper is 1 000 m at the most along the plot, across it and
  up (ST-042; until T-042.4, 120)
- `folderOf(name)` — the folder of a name: an id that `plotName` of `tools/sketch/routes.js` takes, 60
  signs at the most (`FOLDER_MAX`), `plot` of a name that leaves nothing — and with `plot-`
  before it where its first part is a name that Windows keeps for a device (T-031.7; Gotchas):
  `con` is `plot-con`. `freeOf(folder, taken)` — the id that a new plot gets: the folder, or
  with `-2`, `-3`, … after it, the first that no name of `taken` is in small letters — and
  never `home` or `example`

`tools/sketch/new-plot/frame.js` — the paper of corners, with nothing of the ground in it (T-031.3). It imports
`tools/sketch/new-plot/request.js` and nothing else: the map's page loads it too, to show the paper as it will lie.

- `CELL_M`, 0.5 — the pad's cell. `longest(corners)` — the side that the paper lies along where
  none was picked: side `i` runs from corner `i` to the next, and of the longest it is the
  first — as long as they are to the centimetre
- `paperOf(corners, side, aroundM, quarter = 0)` — `{ refused }`, a sentence of `SAID`: `same`,
  `flat`, `crosses` or `large`. Or the frame and the paper: `origin`, `[east, north]` in LV95,
  and `bearingDeg`; `corners`, as they were taken; `outline`, each corner `[x, y]` in the
  frame; `xFromM`, `xToM`, `yFromM`, `yToM`; `sheet`, the paper's four corners in LV95, one
  after the other round the paper — anticlockwise on the map, from the corner where `x` and
  `y` are least; `box`, `{ minE, maxE, minN, maxN }` in metres, the box of LV95 that holds
  those four: **what the ground is asked for**, in the shape that `groundOf` of `tools/sketch/swisstopo/`
  takes one (T-031.4) — metres under other names than the ground's `cells` have; and `areaM2`,
  the area that the outline encloses, worked out of the outline as it is rounded — the figure
  that the plot's file has (`areaOf`), for the map's page to say — the sum of `enclosed(outline)`,
  exported since T-043.1 so that a parcel's parts are measured with it too (directive 32).
  `quarter` is which way `x`
  runs: 0 along the side as it was marked, 1 to its right, 2 back along it, 3 to its left. The
  ground says which: a page says none, and `plotMadeOf` asks for the ground of the `box` with
  none said
- `onMap({ origin, bearingDeg })` — what gives of `[x, y]`, a place of that frame, its place
  `[east, north]` in LV95. A paper of `paperOf` is such a frame
- `isLV95(place)` — whether `place` is a place of LV95: `[east, north]`, two finite numbers of
  its figures — an east from 2 000 000 to under 3 000 000, a north from 1 000 000 to under
  2 000 000, which tells them from LV03's six figures (T-016.1). The Google Earth file asks it
  (`docs/sketch/kml.md`)

`tools/sketch/new-plot/plot.js` — the plot of an order and the ground under it (T-031.3). It imports `tools/sketch/new-plot/frame.js` and
`tools/sketch/new-plot/request.js` — and, since T-043.1, `GEOPORTAL` of `tools/sketch/swisstopo/hosts.js`,
the name a parcel's words give the service, which no file but `hosts.js` and its check may type
(`named.check.js`; ADR-0183) — and nothing else
but `squares.js` and `windows.js`, for their effect. The map's page loads it through
`making.js` (T-041.3); the server did until T-041.4. What the corners were marked on is said by
`MARKED_ON` — `the national map` (T-044.10), `the cadastral map`, `the aerial photo` — and the
cantons' credit, `© Cadastral Surveying Switzerland / FL`, stands beside swisstopo's only where
the corners touch the cadastral map or are a parcel's; else `© swisstopo` alone — so of corners
from a file, `© swisstopo` alone but where a corner was moved on the cadastral map. A file's
words (ST-045, T-045.1, `fileWords`) say, in `credit` and in the first source, that the outline
came from a file you gave, or is after one, changed by hand; converted from WGS84 to about a
metre, where it was; with no survey and no legal effect; and that where the file came from, and
on what terms, is not recorded. Nothing of the file but its corners reaches the plot. The eight
texts are `docs/STORAGE_FORMAT.md`'s, "A plot that is made from a map".

- `plotOf({ name, corners, side, aroundM, on, parcel, file, ground, day })` — `{ site }`, a site as `write` of
  `tools/sketch/plot-file.js` takes one, or `{ refused }`: a sentence of `paperOf`'s, or `steep`. The
  first seven are an order's, `parcel` or `file` where it has one. `ground` is `{ cells: { west, east, south, north }, heightsM,
  tiles }` — `heightsM[row][column]`, rows from south to north and in a row from west to east,
  the height of the cell whose middle lies at `E = (west + column + 0.5) * 0.5`,
  `N = (south + row + 0.5) * 0.5`; `tiles`, each `{ name, year }`: what `groundOf` of
  `tools/sketch/swisstopo/` gives of the `box` (T-031.4). `day` is a day as `2026-10-13`. **Ground that
  does not cover the paper, or holds no height under it, is no refusal: it throws** a
  `RangeError`
- `heightAt(ground, [east, north])` — the ground at a place of LV95, read between the four
  middles of cells around it; it throws where the ground does not cover the place.
  `fallOf(heights)` — `{ downX, downY }`, metres a metre: how the plane falls that fits the
  heights of a paper best. `quarterOf({ downX, downY })` — which way `x` runs, of the four
- `UNDER_M`, 3, and `OVER_M`, 16 — what the standing views show under the lowest ground, a
  storey, and over the highest: a house of four storeys of 3 m and a roof of 4 m

`tools/sketch/new-plot/made.js` — what the server did with an order (T-031.6): it asked for the
ground, worked the plot out and wrote its file into a folder of its own. It went with T-041.4,
and its three checks with it; `tests/__fixtures__/new-plot/trial-slope.json` is the text it gave.

`tools/sketch/new-plot/making.js` — the plot of an order made in the page (ST-041, T-041.3): what `made` did
before the disk, in a module that imports nothing of Node and loads none that does — `paperOf`,
`plotOf`, `SAID`, `folderOf` and `orderOf` of the three above, `groundOf` of
`tools/sketch/swisstopo/ground.js` and `write` of `tools/sketch/plot-file.js`. The map's page loads it.

- `plotMadeOf(text, { origin, day })` — `{ folder, text }`: `folder` the folder that the name
  gives, `folderOf(order.name)`, before any is known to be taken, and `text` the plot's file as
  `write` gives it; or `{ refused }`, one sentence. `text` is the order as JSON, as the map's page
  writes it; `origin` whom the ground is asked of, the page's `terrain`; `day` as `2026-10-20`.
  In the order that `made` had, the first that holds: the sentence of `orderOf`, of `paperOf` — each with
  nothing asked —, `SAID.ground(why)` with what the door or the reader said, the error's
  message cut to its first 300 characters and never its cause, the sentence of `plotOf`
  (`steep`), `SAID.disk(why)` with what `write` refused. What `plotOf` throws, it rejects with.
  One order's requests go one after the other, as `groundOf` asks them; the page's button is off
  while a plot is made, so a page makes one at a time
- **Rule 2 of ST-041, by one golden file**: `tests/__fixtures__/new-plot/trial-slope.json` is the
  very text that `made` gave for the pentagon's order on the stand-in, on 2026-10-20 — recorded
  once from `made`, committed as it came — and since `made` went (T-041.4) it holds Rule 2 alone:
  `plotMadeOf` gives it through what a page of another origin is shown of the answers, by the
  eight requests that the server asked. In a
  browser the door is told less, and says less (`docs/sketch/swisstopo.md`, "Gotchas"): of a
  tile's file that is no tile, the page says that the part was another than was asked for, where
  the server said that the file does not begin as a tile does
- **And the same pentagon marked on the aerial photo** (T-044.10):
  `tests/__fixtures__/new-plot/trial-slope-photo.json`, written once by `plotMadeOf` of the order
  with `"on":["photo"]`, of 2026-10-20 — byte for byte `trial-slope.json` but its `credit` and the
  first of its `sources`, which say `the aerial photo` and `© swisstopo` alone. Marked on the
  national map, as Blockplot marks one, the plot is that golden but for those two, which say `the
  national map` and `© swisstopo` alone
- **And the same pentagon taken from a file** (ST-045, T-045.1):
  `tests/__fixtures__/new-plot/trial-slope-file.json`, written once by `plotMadeOf` of the order
  with `"on":[]` and `"file":{"wgs84":false,"asGiven":true}`, of 2026-10-20 — byte for byte
  `trial-slope-photo.json` but its `credit`, `Outline: from a file you gave, no survey. Ground:
  swissALTI3D. © swisstopo`, and the first of its `sources`, in both trees

`tools/sketch/new-plot/parcel.js` — the cadastre's, loaded only where the pad offers it
(`docs/sketch/cadastre.md`), through `map/take.js`, and left out of Blockplot's tree. A parcel
read (ST-043, T-043.3): what the owner typed in New
plot's field "Parcel", what swisstopo's search lists for it, and a parcel's boundary out of an
answer of the find or the identify, as the corners of an order. It imports `SEARCH_MAX`
and `SHEET` of `tools/sketch/swisstopo/hosts.js`, `egridOf` and `PARCELS_MOST` of `parcels.js`,
`CORNERS_MAX` and `NUMBER_MAX` of `request.js` and `largestOf` of `ring.js`, and nothing else — no
script of `map/`. It asks, shows and marks nothing: the map's page loads it (T-043.5), hands it what came,
and does the rest itself; how corners are taken is the marking's (T-043.4).

- `typedOf(typed)` — what the field held, without the blanks at its ends: `{ egrid }` where
  `egridOf` gives one; `{ words }` where it is other words, `SEARCH_MAX`, 80, characters at the
  most; else `{ refused }`: `Type a municipality and a parcel number, or an EGRID.` of blanks,
  or of what is no text; `A parcel is found by 80 characters at the most.`
- `parcelsOf(text)` — the parcels of a search's answer, each `{ label, egrid }`, in the answer's
  order, `PARCELS_MOST`, 10, at the most, an EGRID once; or null, no JSON or no list `results`.
  `label` is `attrs.label` as it came — HTML, as `<b>Musterlingen</b> 1234 (CH 1111 2222 3333)`: the page
  shows it as text, through `wordsOf` of `map/find.js` — and `egrid` is `egridOf` of what stands
  in its last brackets. A result with no label, a blank one, or one whose last brackets give no
  EGRID is left out
- `boundaryOf(text)` — a parcel of an answer of the find or the identify, in the order the first
  holds: **null**, no JSON or no list `results`; **`{ none: true }`**, the list is empty; of the
  results those of **land** — `realestate_type` null or absent, or a text that holds
  `Liegenschaft` in any case — their fields in `properties`, or where that is no object in
  `attributes`; `{ refused }` where none is land: `Parcel <n> (<c>) is a <type>, no parcel of
  land: a plot is made of a parcel of land.` of the first; where several are: `Several parcels
  of land lie there: click well inside one.`; then the one — **null** unless its `number` is a
  text, or a whole number taken as one, not blank, `NUMBER_MAX` characters at the most, its `ak`
  two capital letters and its `geometry` a `Polygon` or a `MultiPolygon`, each part one ring or
  more, each ring one pair or more of finite numbers on `SHEET`; `{ refused }`, `Parcel <n>
  (<c>) has no EGRID that the pad can read.`, where `egridOf` takes no `egris_egrid`. The
  corners and `left` are `largestOf`'s of its parts (`ring.js`, below, T-045.2). Fewer than
  three corners: null; more than `CORNERS_MAX`: `Parcel <n> (<c>) has <count> corners, and a
  plot has 1000 at the most.` Else **`{ parcel: { egrid, number, canton }, corners, left }`** —
  `corners` each `[e, n]` in LV95, and `left`, both as `largestOf` gives them. Every word of a service that a sentence repeats is a text: its tags out (`/<[^<>]*>/g`, the
  expression of `wordsOf`, said again), its blanks at the ends off, cut to 40 characters, whole
  ones, with no `…` (ADR-0185)

`tools/sketch/new-plot/ring.js` — the outline of a polygon (ST-045, T-045.2): one computation
for a ring (directive 32), which a parcel read (`parcel.js`) uses, and a GeoJSON file's reader
(`geojson.js`, T-045.4), in Blockplot's tree as in this one. It imports `enclosed` of `frame.js` and nothing else, and has no
page, request, clock or global. It refuses nothing: how few or how many corners are too few or
too many is its caller's sentence.

- `largestOf(parts)` — `parts` a polygon's parts, each a list of rings, the outer first, each
  ring a list of `[e, n]` in LV95 that its caller has read, none of them empty: **`{ corners,
  left }`**. `corners`: of the part whose outer ring encloses the most, the first of two alike,
  its outer ring as it was given — a corner that repeats the one before it taken as one, the
  corner that closes the ring, a repeat of the first, taken off, a ring left open taken as it
  is; nothing rounded, moved or turned. `left`, what was left out, or empty: `The largest of its
  2 parts is marked; the other, <a> m², is left out.` or `The largest of its <k> parts is marked;
  the other <k-1>, <a> m² in all, are left out.`; `Its hole of <a> m² is not left out of the
  plot.` or `Its <h> holes, <a> m² in all, are not left out of the plot.` — both, the parts'
  first, a blank between. An area is `enclosed` of the ring with its figures from its first
  corner (see "Gotchas"), the outer rings of the other parts or the holes of the part marked,
  to a whole square metre

`tools/sketch/new-plot/geojson.js` — a GeoJSON file read (ST-045, T-045.4): the text of a file, or
of what was pasted, read into one outline's corners in LV95, or refused in one sentence. In
Blockplot's tree as in this one; the page that hands it the text is T-045.5's. It imports
`largestOf` of `ring.js`, `isLV95` of `frame.js`, `CORNERS_MAX` of `request.js`, `SHEET` of
`tools/sketch/swisstopo/hosts.js`, and `lv95Of` and `SHEET_WGS84` of `tools/sketch/kml/wgs84.js` —
one of the two files outside `kml/` that `kml/own.check.js` lets name it — and nothing else. No
page, request, clock or global: the bytes of a text are counted by its code points, as
`TextEncoder` counts them. Its coordinates are never guessed (ST-045, rule 2); WGS84 is converted
here, every position by `lv95Of`, once, and nothing of it is kept (rule 3); the ring is
`largestOf`'s, and this module has no rule of its own for the part, the closing corner, repeats
or what is left out (rule 4); nothing is rounded, moved or turned (rule 5).

- `FILE_MAX_BYTES` — 5 000 000, 5 MB of UTF-8, the owner's cap of 2026-10-23
- `SAID` — its sentences, frozen
- `outlineOf(text)` — **`{ corners, wgs84, said }`**: `corners` each `[e, n]` in LV95 as
  `largestOf` gives them, `wgs84` whether they were converted, `said` the line; or
  **`{ refused }`**, one sentence. By this rule, in this order, the first that holds:
  1. no text, or blank: `Choose a GeoJSON file, or paste one into the box.`; more than
     `FILE_MAX_BYTES` in UTF-8: `The file is larger than 5 MB: give the outline of your plot
     alone.`; no JSON: `It is no JSON: a GeoJSON file is JSON text.`
  2. the geometry: a `Polygon` or `MultiPolygon` is itself; a `Feature`, its `geometry`; a
     `FeatureCollection`, of its `features` (a list, else no GeoJSON) those whose `geometry` is a
     `Polygon` or `MultiPolygon` — several: `The file holds <k> outlines: keep the one of your
     plot, and give it again.`; one: taken, and the other features are passed over. A `Point`,
     `MultiPoint`, `LineString`, `MultiLineString`, `GeometryCollection`, a `Feature` whose
     geometry is null, absent or none of the two, a collection with no polygon: `It holds no
     outline: no Polygon or MultiPolygon.` Any other object, or no object: `It is no GeoJSON: no
     Feature, FeatureCollection or geometry.` Every part one ring or more, every ring one
     position or more, every position two finite figures or three — a height, not read — else
     `Its outline's coordinates are none: two figures for each corner, or three.`
  3. the frame, of the top object's `crs` — one on a feature of a collection is not read. Absent
     or null: none. Else its `properties.name`, trimmed, looked up to the letter in the table
     below. A name of none: `Its crs, <name>, is none that the pad takes: LV95, EPSG:2056, or
     longitude and latitude, WGS84.`, the name cut to 40 characters; a `crs` with no name that is
     a text, or a blank one: `Its crs says no frame that the pad can read: LV95, EPSG:2056, or
     longitude and latitude, WGS84.`
  4. what the coordinates are, of the first two figures of every position of the geometry taken,
     all of them: **LV95** where each is `isLV95`; **LV95, north first** where each reversed is;
     **LV03** where each plus `[2 000 000, 1 000 000]` lies on `SHEET`; **WGS84** where each lies
     in `SHEET_WGS84`, longitude first; **WGS84, latitude first** where each reversed does; else
     **of no grid**. They cannot overlap: no longitude or LV03 figure is two million, and no LV95
     or LV03 figure is that small. With no `crs`: LV95 taken; WGS84 converted; latitude first,
     `Its coordinates give the latitude before the longitude: GeoJSON gives the longitude
     first.`; north first, `Its coordinates give the north before the east: GeoJSON gives the
     east first.`; LV03, `This file is in LV03, the old Swiss grid: export it again in LV95,
     EPSG:2056.`; of no grid, `Its coordinates are of no grid of Switzerland: the first corner is
     <a>, <b>.` With a `crs` of LV03: that LV03 sentence. Of LV95 or WGS84: taken or converted
     where the coordinates are that, else `Its crs says <LV95, EPSG:2056 | WGS84>, and its
     coordinates are <LV95 | LV95, north first | LV03 | longitude and latitude | latitude and
     longitude, latitude first | of no grid of Switzerland>.`
  5. WGS84 converted, every position by `lv95Of`. Then every corner of every part on `SHEET`,
     its edges in — else `A corner lies off the map of Switzerland: New plot makes plots in
     Switzerland alone.`, LV95 off the sheet too
  6. the ring, `largestOf` of the parts in LV95: fewer than three corners, `The outline has
     fewer than three corners: it encloses nothing.`; more than `CORNERS_MAX`, `The outline has
     <k> corners, and a plot has 1000 at the most.`
  7. `said`, a blank between each that is not empty: `The file's outline is marked: <k>
     corners.`; where converted, `The file gives longitude and latitude (WGS84): its corners are
     converted to LV95, good to about a metre.`; `left` of `largestOf`; and where some were
     passed over, `One feature that is no outline was passed over.` or `<p> features that are no
     outline were passed over.`

  The thirteen names of a `crs`, each to the letter:

  | Frame | Names |
  | --- | --- |
  | LV95 | `EPSG:2056`, `urn:ogc:def:crs:EPSG::2056`, `http://www.opengis.net/def/crs/EPSG/0/2056` |
  | WGS84 | `urn:ogc:def:crs:OGC:1.3:CRS84`, `urn:ogc:def:crs:OGC::CRS84`, `OGC:CRS84`, `http://www.opengis.net/def/crs/OGC/1.3/CRS84`, `EPSG:4326`, `urn:ogc:def:crs:EPSG::4326`, `http://www.opengis.net/def/crs/EPSG/0/4326` |
  | LV03 | `EPSG:21781`, `urn:ogc:def:crs:EPSG::21781`, `http://www.opengis.net/def/crs/EPSG/0/21781` |

  The four of `www.opengis.net` are names of frames, which nobody asks:
  `tools/sketch/swisstopo/named.check.js` lets them through, each to the letter.

## An order made

**In the page, since T-041.3; the server's part went with T-041.4.** `plotMadeOf` reads the
order, works its paper out, asks for the ground through the pad's one door, works the plot out
and makes the text of its file — the first refusal that holds, in one sentence, and nothing
asked before the paper is known:

| Where | Says |
| --- | --- |
| the text is no order | the sentence of `orderOf` |
| its paper is none | the sentence of `paperOf`: `same`, `flat`, `crosses`, `large` — before anything is asked |
| the ground does not come, or comes as what cannot be read | `SAID.ground` with what the door or the reader said, the error's message — never its cause — cut to its first 300 characters |
| the plot is none | the sentence of `plotOf`: `steep` |
| `write` refuses the site | `SAID.disk` with `write`'s sentence: a fault of the pad, which no order should meet |
| — | the folder that its name gives, and the text of the plot's file |

What the page does with it — keeps it in the browser's store, writes its folder into a folder
that the owner picks, or offers its file — is `tools/sketch/map/make.js`'s
(`docs/sketch/map.md`). What the server decided of an order, the disk touched last, a folder
claimed by making it, what a failed write left taken away, one order at a time, is ADR-0128's,
`docs/adr/ADR-0128-the-pad-makes-a-plot.md`, and went with `made.js`.

## The frame, as the pad has it

Read off the pad's own code, and seen on a made-up plot from above and from the side:

- **`y` runs to the left of one who looks down `x`.** `cell` of `tools/sketch/paper.js`: in the top view
  a column grows with `x` and a row grows as `y` falls — `x` runs to the right of the paper,
  `y` up it.
- **`bearingDeg` is the compass bearing that `x` runs at: from north, clockwise.** `north` of
  `tools/sketch/land.js`: the arrow's tip, marked N, lies at `[cos(angle), -sin(angle)]` in cells whose
  rows count downward — north lies `bearingDeg` degrees anticlockwise of `x` on the paper. A
  slice along the plot has `downhill, wind(bearingDeg)` at its right, and a slice across it
  `wind(bearingDeg - 90)` at its left, which is where `y` is largest.
- **The rows of the ground run from `y = yToM` down, and a row from `x = xFromM` on**:
  `heights[row][column]`, the row and the column of the top view's paper.
- **3D shows the same hand**: the plot's x, y and height are three.js's x, −z and y
  (`docs/sketch/view3d.md`, "Units and frame").

So with `b` the bearing: in LV95 `x` points along `(sin b, cos b)` — east, north — and `y` along
`(-cos b, sin b)`.

## The rule, in its order

1. **A corner is taken to the centimetre.** Then refused, the first that holds: `same`, two
   corners that follow each other at one place, the last and the first too; `flat`, corners
   that all lie on one line — or fewer than three; `crosses`, two sides that meet anywhere but
   at the corner they share, or lie back along each other. Each is asked of whole centimetres,
   and is exact. `flat` is asked of the line, not of the area: corners in the order of a bow
   enclose nothing by the sum of an area, and are refused as crossing.
2. **The frame.** Its origin is the first corner of the side, so the side lies along a line of
   the paper's grid. Its bearing is the side's own, from its first corner to its second, plus
   `quarter` quarter turns, to four decimals; the axes are worked out of the bearing as it is
   written: the frame is what the file says.
3. **The outline**, each corner in the frame, to the millimetre — one that the millimetre leaves
   no area is `flat` too. **The paper**: from the smallest `x` less the ground around, down to
   a whole cell, to the largest plus it, up to one; `y` likewise. `large` where it is longer
   than `PAPER_MAX_M` either way, said along the side and across it.
4. **Which way `x` runs** (`plotOf` from here on). The ground at every grid point of that
   paper, with `x` along the side; the plane that fits those heights best, by least squares;
   and of the four ways the one that the plane falls most along — of two that fall alike, the
   first: along the side, to its right, back along it, to its left.
5. **The paper again, in that frame, and a height at every grid point**, a row after another
   from `y = yToM` down: read between four cells, and taken to the whole centimetre. `baseM` is
   the lowest of them, down to a whole metre; a height is written in centimetres over it. The
   heights are taken into one array of whole centimetres once (four million points on a paper
   of a kilometre): **a paper of at most `windows.WHOLE_M`, 120 m, along and across keeps them
   as rows, `{ baseM, rowsCm }` — a plot's file of version 2, byte for byte what New plot wrote
   before ST-042; a larger one as squares, `{ baseM, squares, cornersCm }` of `squares.make` —
   version 3**, within `squares.TOLERANCE_CM`, 5 cm, of every height (T-042.4).
6. **`sideM`**: `[baseM - UNDER_M, the highest up to a whole metre + OVER_M]`. `steep` where
   that is more than `PAPER_MAX_M` high.
7. **The site**, its fields in the order of the format's table, with `notes` an empty list, no
   area of the land register and no point of a house — and its `credit` and its `sources`, to
   the letter: what the corners were marked on, by hand and no survey, with the day — or, of an
   order with a `parcel` (T-043.1), which parcel of the official survey they are, its number,
   canton and EGRID, as given or changed by hand since, with both credits whatever `on` says,
   for the boundary is the cadastral map's (`docs/STORAGE_FORMAT.md` has the words); a line a
   tile of the ground, with the year of its state; and where the frame lies in LV95.

## Invariants

1. **An order is corners, a name and figures — never an address to ask** (ST-031, rule 5): it
   has five fields, and a sixth where its corners are a parcel's, `parcel` (T-043.1) — which
   names the parcel, and asks for nothing — and a seventh is refused.
2. An order is refused whole, in one sentence, before anything is asked or written.
3. **Every id that `freeOf` gives of a folder of `folderOf` is one that `plotName` takes**, and
   is neither of the pad's own two, under whatever case.
4. **A plot lies in the pad as it lies on the map** (rule 7): `y` to the left of `x`, and `x`
   the way that the ground falls. One computation says so, `paperOf` and `plotOf`, and nothing
   else works out a frame, a paper or a height of a new plot.
5. **The paper is one sheet of ground whichever way `x` runs**: a quarter on, `x` is what `-y`
   was, the sheet begins a corner back, and its four corners are the same places in LV95 but
   for the last figure of a sum. So the ground of the `box` with `x` along the side covers the
   paper that the ground then gives.
6. **A site of `plotOf` is one that `write` takes**: every figure of it that is nought is a
   plain nought, and every height lies inside `sideM`, at neither end.
7. **Neither module names a global, a clock, a file or a request — nor does `making.js`, nor
   `parcel.js`**: the ground and the day are handed over, and what is no plot is said in a
   sentence of `SAID`, written in `tools/sketch/new-plot/request.js`; what came of swisstopo is
   handed to `parcel.js` as text, and what is no parcel is said in its own sentences, written
   there once.
8. **A plot's file is the text that `write` gave**, whole, of a site that reads back: `plotMadeOf`
   gives it, and the map's page writes it, never over another plot (`docs/sketch/map.md`).
9. to 11. — what `made.js` took away, said and asked — went with it (T-041.4).

## Test

`pnpm sketch:check` finds the twelve checks by their names. Nine start nothing and read no
file — but `parcel.check.js`, which reads the code of `parcel.js`, `ring.check.js`, which reads
the code of `ring.js`, `geojson.check.js`, which reads the code of `geojson.js` (T-045.4), and
`request-geojson.check.js`, which reads the code of `request.js`; the three of an order made in the page (T-041.3, T-042.4) each start the stand-in for
swisstopo, as a process of its own on a port that the system picks, and ask nothing but this
machine. The three of the server's `made.js` — `made.check.js`, `made-refused.check.js` and
`made-disk.check.js` — went with it (T-041.4).

- `tools/sketch/new-plot/making.check.js`, **Rule 2 of ST-041** (T-041.3): `plotMadeOf` of the pentagon's
  order on the stand-in on 2026-10-20, through `asABrowser(fetch)` of
  `tools/sketch/swisstopo/as-a-browser.js`, gives the folder `Trial slope` and the golden file
  `tests/__fixtures__/new-plot/trial-slope.json`, which `made` gave, byte for byte — by the eight
  GETs of the stand-in that the server asked, held by hand since `made` went (T-041.4): the
  collection, the items by the sixteen names of the two tiles, and of each tile its head and two
  parts, target and range, in that order, none beside another;
  of another day, the golden file with that day. The order marked on the photo gives
  `trial-slope-photo.json` byte for byte, and marked on the national map that golden but for
  its credit and the first of its sources, each typed in (T-044.10). The order taken from a file
  gives `trial-slope-file.json` byte for byte, its credit typed in, and that golden is the
  photo's but for its credit and the first of its sources (T-045.1). And of `making.js` and the seventeen modules it
  loads, to the last — what is loaded for what it does, as `squares.js`, among them — every
  import a module of the pad's, none of Node's; of `making.js` itself no `globalThis`, `Date`,
  `fetch`, `window`, `document`, `location` or `import(`
- `tools/sketch/new-plot/making-refused.check.js`: `plotMadeOf` through `asABrowser(fetch)` of the fourteen orders that
  the server's `made-refused.check.js` listed — no order, or no paper — each in the server's sentence, with
  nothing asked of the stand-in; ground that does not come — the one cell without a height, the
  tile that there is not, **cut at 300 characters**, the tile whose file is no tile, in the
  browser's sentence, and the stand-in stopped — nine requests in all, and none for the orders

- `tools/sketch/new-plot/made-large.check.js`, **a plot of 800 m by 600 m made** (ST-042,
  Behaviour row 2; T-042.4): `plotMadeOf` — `made` until T-041.4 — against the stand-in, of the
  order `Large` — corners `[2600010, 1200010]`,
  `[2600800, 1200010]`, `[2600800, 1200600]`, `[2600010, 1200600]`, 5 m around, in the
  stand-in's tile 2600/1200, clear of the tile it has none of and of its cell with no height.
  Held: made, in the folder `Large`; its file of version 3, its ground `{ baseM, squares, cornersCm }`, read by
  `plot-file.js`'s `read`; at every grid point of its paper — 1 601 by 1 201 — `squares.read(…)
  .cmAt` within 5 cm of the height it was made of, the point placed in LV95 by the file's
  `originLV95` and `bearingDeg` and its height `heightAt` over `groundOf` of the stand-in, to
  the centimetre, less `baseM`; the file at most 100 000 bytes (it is some 34 kB, 2 385
  squares); and all of it within 20 s — **about 1.0 s on the owner's PC** (2026-10-20). Then
  `plotOf` alone, on a plane: a paper of 120 m by 30 m keeps `rowsCm`, one of 121 m by 30 m
  `squares` and `cornersCm`, the two within 5 cm of each other.
- `tools/sketch/new-plot/request.check.js`: an order that is one; every sentence of the list on an order
  that is also wrong in every way the list names after it, and each alone, at the edge of what
  an order may say — of `on`, the five lists taken and, among the refused, `["national","cadastral"]`
  and `["photo","national"]` (T-044.10, when `["national"]` stopped being refused);
  `SAID` and the limits, typed in; every row of the card's table of folders,
  each an id that `plotName` takes; the twenty-four names that Windows keeps for a device, each
  with `plot-` before it, and what only begins or ends with one, as it is; and `freeOf`.
- `tools/sketch/new-plot/parcel.check.js` (T-043.3), a parcel read, on answers that the check
  makes up in the shape of the trial's of 2026-10-20, at the origin of the Swiss grid — no
  parcel that exists. `typedOf` of an EGRID with blanks, of words, of blanks and of what is no
  text, of 80 characters and of 81; `parcelsOf` of two alike, labels with no brackets, a blank
  one, a non-text, the same EGRID twice, eleven, and of what is no list; `boundaryOf` of a
  `Polygon` of 35 corners to the decimetre, its ring closed — the 35, figure for figure, none
  on a whole metre — of none and of what cannot be read, told apart; of a `Baurecht`, a `StWE`,
  a kind of tags, of a tag that opens and never closes, cut at 40; of land by `Liegenschaft`
  beside a `StWE`, of two of land; of `attributes` in the place of `properties`, of a number
  as a figure, of EGRIDs that are none, of each field that makes the answer unread before it;
  of a hole, of two, of two parts the larger second, of three, of a part with a hole beside
  another, each sentence to the letter and each area to a whole square metre; of corners
  repeated and the ring closed or not; of 1000 corners and of 1001; and of a corner past each
  edge of the sheet, one on its edge, three figures, a `Point` and every other geometry that is
  none. And of `parcel.js`'s code: no `globalThis`, `Date`, `fetch`, `window`, `document`,
  `location` or `import(`, and its four imports, `ring.js` among them since T-045.2, none of
  `map/`. **Tried broken 31 ways, one
  at a time** (T-043.3) — a guard left out, a limit moved, the closing corner kept, the largest
  part the smallest, a tag's expression widened: a check failed each time, after four cases
  were added that the first draft had not held
- `tools/sketch/new-plot/ring.check.js` (T-045.2), the outline of a polygon by hand, rings in
  LV95 from E 2 600 000, N 1 200 000: a square of 10 m with a hole of 2 m by 2 m and a second
  part of 3 m by 3 m given before it — the square marked, by its area, and both sentences to
  the letter, `9 m²` and `4 m²`; three parts, `13 m² in all`; two holes, `5 m² in all`; a ring
  closed and the same left open, the same corners; a corner given three times running, taken
  once; two parts that enclose alike, the first taken; figures to the centimetre as given;
  nothing left out, `left` empty. And of `ring.js`'s code: `./frame.js` its one import
- `tools/sketch/new-plot/geojson.check.js` (T-045.4), a GeoJSON read, of made-up GeoJSON built
  in the check, no file read. The pentagon of `trial-slope.json` in LV95 — a `Feature`, a bare
  `Polygon`, under each of the three names of LV95 and one with blanks around it, a `crs` of
  null, a height on every position, left open, its third corner twice running, and inside a
  collection whose feature names LV03, a `crs` not read — each time its five corners to the
  figure. In WGS84, its corners typed in as T-045.0's trial turned them, to ten decimals: under
  no `crs` and each of the seven names of WGS84, `lv95Of` of each and within `LV95_ACCURACY_M`
  of the pentagon's, `wgs84` true, the two sentences. Refused, each to the letter: latitude
  first, north first, LV03 by its figures, by each of its three names and by both; a `crs` of
  LV95 over longitude and latitude, north first, LV03 and latitude first, one of WGS84 over LV95
  and over no grid; no grid, and LV95 and WGS84 in one ring; `EPSG:3857`, `epsg:2056`, a name of
  50 characters cut at 40, a `crs` with no name, a name that is a figure, a `crs` that is a
  text, a blank name; a corner at E 2 950 000, and WGS84 that converts off the sheet; a corner
  on each edge of `SHEET_WGS84`, converted off the sheet, and 0.01° past each, of no grid; a
  ring on the sheet's south-west corner, taken; two corners; 1001, and 1000 taken; every
  geometry that is no outline, a `Feature` of null, of a `Point` and of none, a collection with
  none and an empty one; `{}`, `[]`, a text, null, a figure, a collection with no list, a type
  that is none; two polygon features; no text, blanks, null, a figure; three texts that are no
  JSON; 6 MB, and 5 MB to the byte taken and a byte more refused, of characters of one to four
  bytes at the edge of each — `x`, U+007F, `é`, U+07FF, `€`, U+FFFF, an emoji — and a lone
  surrogate, each counted as Node's encoder counts it; every way of coordinates that are none,
  `1e400` among them. A `MultiPolygon` of the pentagon and a square of 3 m, `9 m²`; a hole of
  2 m by 2 m, `4 m²`; a collection with two `Point`s and with one `LineString`, passed over. And
  of `geojson.js`'s code, its comments out: no `globalThis`, `TextEncoder`, `fetch`,
  `document`, `Date`, `window`, `import(` or `require(`, and its imports the six names of five
  modules, and no other. **Tried broken 18 ways, one at a time** (T-045.4) — a name not trimmed,
  the cap's edge, a byte count's edges, the sheet's check left out, latitude first not reversed,
  the box's edge, a count passed over, the limits of corners, the LV03 `crs`, the cut of a name,
  LV95 converted: a check failed each time, after the box's edges and the bytes' were added
- `tools/sketch/new-plot/plot-parcel.check.js` (T-043.1), an order that names its parcel: read
  as given and changed, its four in order; every shape of a parcel that is none in the ninth
  sentence, after `on`'s, and a seventh field in the second; an order without one as before,
  with no `parcel`; `egridOf` and the order's rule of an EGRID one, over texts that the check
  makes up; the plot of a parcel's order on made-up level ground — its `credit` and its three
  kinds of source to the letter, as given and changed, with both credits under every `on` —
  and the rest of it the plot of the same corners by hand; and `enclosed` by hand.
- `tools/sketch/new-plot/request-geojson.check.js` (T-045.1), an order whose corners came from a
  file: read as given and changed, converted or not, its two in order, with `on` `[]` and with
  a map; with a file, an `on` that is neither still the eighth; every shape of a file that is
  none — a key missing, a third key, a text, null — in the tenth sentence, after the parcel's;
  a parcel and a file, each one, in the eleventh; `on: []` without a file the eighth; an order
  without one as before, with no `file`; and `request.js`'s code, which imports nothing.
- `tools/sketch/new-plot/plot-geojson.check.js` (T-045.1), the plot of a file's order on made-up
  level ground, as `plot-parcel.check.js` makes it: its `credit` and its first source to the
  letter — the eight words, as given and changed, converted from WGS84 or not — with
  `© swisstopo` alone, and both credits where `on` holds `cadastral`; no key and no word of the
  file in the plot; and the rest of it the plot of the same corners by hand.
- `tools/sketch/new-plot/frame.check.js`, the paper by hand: `longest`; of the card's eight hand cases every figure
  that the paper alone gives, the quarter said by hand — **case 1's third corner `[30, 12]`,
  where a mirrored plot has `[30, -12]`**; the sheet and the box of case 1, and by how little
  the box lies beside whole metres; `onMap`; the four quarters of two plots, one sheet of
  ground; and what is refused, each in its sentence and the first that holds, a paper of
  1 001 m among it, and one of 1 000 m that fits.
- `tools/sketch/new-plot/plot.check.js`, the plot by hand, on **the eight hand cases**: made-up corners at the origin
  of the Swiss grid, on ground made up by a rule — a 32-bit height at the middle of every cell
  — where the answer is known. A slope along the side, one across it, a wall of 3 m under a
  rectangle and under a plot askew, flat ground, no ground around, another side picked, corners
  as a click gives them: each site figure for figure, every height of seven of them, **case 1's
  first height 480, where a mirrored plot has 420, and case 2's bearing 306.8699 and 60 by 80
  cells, where a plot that lies along the picked side has 36.8699 and 80 by 60**; each through
  `write` and `read`. Then `heightAt`, on the ground and off it; `fallOf` and `quarterOf`; the
  standing paper beside a whole metre; ground too steep for the pad; and the credit and the
  sources of each `on`, to the letter, with two tiles of two years.

**The two modules were tried broken one thing at a time** (T-031.3), each of 304 breaks alone,
on a copy outside the repository — a sign turned, a guard left out, two axes swapped, a
rounding changed, a word of a source reworded: a check failed each time. Listing them showed
two rules that nothing could reach, which went, and seven things that the checks did not hold
as they were first written, each of which gained its case.

**`tools/sketch/new-plot/made.js`, and the lines of `serve.js` that handed an order on, were tried the same way**
(T-031.6, before both went with T-041.4), 82 breaks, each alone, on a copy of the pad outside the repository — a row of the
table left out or under another status, the cut a character off, the error's cause in the place
of its message, the line of orders left out or poisoned by one that failed, a flag or a call of
the disk changed, the folder taken away before the file, the day read off Greenwich's clock: a
check fails for every one. Listing them showed nine things that the checks did not hold as they
were first written, each of which gained its case — a request of no length, to which Node's own
client gave one; bytes that were no order however they were read; a full stop after words that
end with one; the year at its turn; the day of the server's clock, where the pad stood in the
check's own zone; a file that said no day at all, held against a sentence that said none
either; whom the ground is asked of; a folder that the list has, tried all the same; and an
order that asks nothing, waiting in line. One break changes nothing, and was left out: an order
that waits for the one before it once more, before it stands in line.

## Gotchas

- A letter that has no plain form — `ß`, `Æ`, `Ø` — is left out of the folder: `Straße` gives
  `Strae`. The folder is an id; the name that the pad shows is the file's own.
- **A name is taken in small letters** because this disk holds `Home` and `home` to be one
  folder. What makes the folder must still fail where it is there: two windows may ask at once.
- The sheet of the map is said twice — here, and as `SHEET` of `tools/sketch/swisstopo/hosts.js`, for
  this module imports nothing: the check holds the two to be one. So are `home` and `example`.
- "The first field that no order has" is the first as the order's own object lists them: a
  name that is a whole number comes before every word.
- Whether an outline is one that a plot can have, and how large its paper comes out, `orderOf`
  does not say: `paperOf` does, in the sentences of `SAID`.
- **How the page calls it** (`tools/sketch/new-plot/making.js`, T-041.3): `paperOf(corners, side, aroundM)` — refused,
  or its `box`; the ground of that box; then `plotOf`, which asks `paperOf` again itself, with
  `x` the way that the ground falls, and refuses what it refuses.
- **The box of a paper that lies askew lies on no whole metres**, however round the corners
  are: its bearing is written to four decimals, so each corner of the paper is turned about
  the origin by up to a micrometre for every metre that it lies from there. Case 1's box, whose
  corners a hand puts at E 2 599 997 and 2 600 045, N 1 200 003 and 1 200 053, is `minE`
  2599997.000000452, `maxE` 2600045.0000010272, `minN` and `maxN` 0.00000004 m under theirs —
  a micrometre at the most, which `tools/sketch/new-plot/frame.check.js` holds by hand. The cells that cover it are
  the round box's: 5199993 to 5200090, 2400005 to 2400106. Only a paper along the grid of
  LV95, as the rectangle's at a bearing of 90, has a box on round figures.
- **What the figures cost** (ADR-0123): four decimals of a bearing leave the far end
  of a side up to a tenth of a millimetre off its line; the outline to the millimetre encloses
  hundredths of a square metre more or less than the corners as they were marked — 746.638 m²
  for 746.647 in case 8; and a height between four cells makes a wall of 3 m a slope over one
  cell.
- **A height is taken to the centimetre before the base is read off it**: ground at 560 m that
  comes out of the reading a hair under it has its base at 560, not at 559.
- **A nought is a plain nought.** A corner that stands on an axis of its frame lies a hair to
  one side of it, and under nought it would be written as a zero with a minus before it, which
  `write` refuses: `It does not read back as it was written.` The rounding to the millimetre
  adds a nought, the paper's edges follow the outline, and the base gets its nought the same
  way.
- **Two sides that follow each other are not asked whether they lie back along each other**: a
  third side then begins or ends on one of them, and is found as every other meeting is.
- **A place a hair off the ground is read at its edge** (`HAIR`, a micrometre): the paper's
  corners are worked out again in the frame that the ground gave, and land a last figure
  beside the box in one plot of very many.
- **The outline's area is worked out in three places by the same sum**: `siteFaults` of
  `tools/sketch/paper.js`, `areaOf` of `tools/sketch/plot-file.js`, and `paperOf` here, which imports neither.
  `tools/sketch/new-plot/plot.check.js` holds the two of a new plot to be one figure.
- On a ridge or in a hollow the plane that fits best is nearly level, and `x` runs by what
  little it falls. Dead flat, along the side as it was marked.
- **There is no clock for a whole order**: each request of the door has 30 seconds, and the
  page's button is off while a plot is made.
- **What is said of ground that did not come may end in the middle of an address**: the door's
  and the reader's words end with the address that was asked, and of a message of more than
  300 characters the end goes — the items of a plot on nine tiles are asked by 72 names.
- **A paper of a kilometre costs some eighty requests and some 300 MB** (T-042.4): the
  collection, the items, nine heads and some seventy parts of a megabyte at the most, one after
  the other; and the page holds the ground, its heights, the tree and the file while it makes
  the plot. The grid of four million points is one array of whole centimetres, and no list of
  it is ever spread into `Math.min`. How long a real plot of a kilometre takes is learned when
  the owner makes one: no check asks a real service.
- **A name that Windows keeps for a device is no new plot's folder** (T-031.7). Node makes a
  folder `con`, `nul`, `aux` or `com1`, lists it, reads it back and takes it away — tried on
  the owner's machine — but a file manager of Windows may not be able to take it away, and a
  plot that was marked wrong is deleted by hand. So `folderOf`, as its last step, puts `plot-`
  before a folder whose first part is such a name, in whatever letters, and cuts it to
  `FOLDER_MAX` again: `con`, `prn`, `aux`, `nul`, `com0` to `com9`, `lpt0` to `lpt9`. The first
  part is what stands before the folder's first dot, less the blanks at its end, which
  Windows passes over there: `NUL.1` is `plot-NUL.1`, `Com7.north plan` `plot-Com7.north plan`
  and `aux .x` `plot-aux .x`; `console`, `con-2`, `my.con` and `com10` are as they are. It is
  `folderOf`'s rule and not `freeOf`'s: a figure after the name leaves its first part what it
  is, `plot-con-2`. The map's page shows the folder by the same rule, for it loads the module.
  A folder of such a name that lies in the plots' folder already is a plot like any other.
- **How a check stands in for a thing that a page is not handed**: the door looks `fetch` up at
  every request, so a check gives one tile's file itself and passes every other request on to
  the stand-in.
- **A parcel's EGRID in a search stands in the label alone** (T-043.3): in its last brackets,
  in four groups, `(CH 1111 2222 3333)`, beside a name in HTML that may hold brackets of its
  own; the search gives no boundary, so a pick is asked again by its EGRID. **A find's or an
  identify's fields may stand in `properties` or in `attributes`**: the trial named the
  fields, not where they stand, and `parcel.js` reads both.
- **A parcel's area is worked out from its first corner**: `enclosed` of figures of seven
  digits multiplies two of them, some 3·10¹² — `ring.js` (`parcel.js` until T-045.2) takes each ring less its first
  corner before it sums, so that the areas said are those of the corners, not of the
  rounding of a double.
- `tools/sketch/new-plot/parcel.js` stands at 160 lines and `tools/sketch/new-plot/parcel.check.js` at 260; `tools/sketch/new-plot/ring.js` at 63 and `tools/sketch/new-plot/ring.check.js` at 76 (T-045.2); `tools/sketch/new-plot/geojson.js` at 231 and **`tools/sketch/new-plot/geojson.check.js` at 299** (T-045.4): a case more of the reader wants a line made free first.
- `tools/sketch/new-plot/frame.js` stands at 252 lines, `tools/sketch/new-plot/plot.js` at 256 and `tools/sketch/new-plot/request.js` at 221 (T-045.1), `tools/sketch/new-plot/frame.check.js` at 257 —
  and **`tools/sketch/new-plot/plot.check.js` at 299** — `tools/sketch/new-plot/request.check.js` at 258, `tools/sketch/new-plot/making.check.js` at 187 (T-045.1) and
  `tools/sketch/new-plot/made-large.check.js` at 147 since T-041.4, and `tools/sketch/new-plot/plot-parcel.check.js` at 169: what is checked next of a plot wants a
  line made free first, or a check of its own. A check shares no helper: each says its corners
  and its ground itself, and each of the three of an order made starts the stand-in with lines
  of its own.
