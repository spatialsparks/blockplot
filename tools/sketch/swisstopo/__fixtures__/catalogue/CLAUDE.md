# tools/sketch/swisstopo/__fixtures__/catalogue

Two answers of the real catalogue of swisstopo's downloads, version 1, and this note (ST-031,
T-031.4). They are what the pad's reader of the catalogue, `../../catalogue.js`, is first proved
on. **© swisstopo.** Neither holds a height, a place of anybody's or anything of a plot: they
say which states of one tile there are, and where its files lie.

## What lies here

| The file | Bytes | SHA-256 |
| --- | --- | --- |
| `collection.json` | 1978 | `f2e87449d1b8a46abb44df2e54cc24f66fede749f1d4ba45a3e6f597cc5fff5b` |
| `items-2600-1200.json` | 5854 | `7a41a9764b5bb4cb2f055eee34b1ef84dd455ed4f48f538f631329170d8ede17` |

Both were **read by hand on 2026-10-13, by the orchestrator, at the origin of the Swiss grid in
Bern** — E 2 600 000 / N 1 200 000 — and nowhere else, with one request each. No test, no check
and no agent asked for them: they stand on the card of T-031.4, folded into lines, and were cut
out of it by a script, never typed. Each is one line of JSON with no line end.

- `collection.json` — the catalogue's entry for swissALTI3D, asked for at
  `https://data.geo.admin.ch/api/stac/v1/collections/ch.swisstopo.swissalti3d`. It states the
  one span of time that its items are of, 2019-01-01 to 2026-01-01, `gsd` 0.5 and 2.0, and
  `proj:epsg` 2056.
- `items-2600-1200.json` — the items of the tile north-east of the origin, asked for by four
  names of which the catalogue has two, at
  `https://data.geo.admin.ch/api/stac/v1/search?collections=ch.swisstopo.swissalti3d&ids=swissalti3d_2019_2600-1200,swissalti3d_2024_2600-1200,swissalti3d_2025_2600-1200,swissalti3d_2026_2600-1200`.
  It lists the state of 2019 and the state of 2025, each with four files — 0.5 m and 2 m, as a
  cloud-optimised GeoTIFF and as a zipped list of points — and no link to a next part. A file
  says the side of its cells as `gsd`, where version 0.9 of the catalogue, which the parked
  product asks, says `eo:gsd`.

## Invariants

1. **Nothing here is ever reformatted, and nothing is changed.** `.gitattributes` keeps what
   lies under a `__fixtures__/` folder byte for byte, the formatter and the linter leave it
   alone, and `../../catalogue.check.js` holds each of the two files to its length and its
   SHA-256 — and the folder to these two and this note: a file that is added wants holding too.
2. **The addresses above are cited, never asked.** They stand in this note and in the two
   answers, which `../../named.check.js` does not read; no script and no check of the pad types a
   host. The check holds, of each answer, that the address it says of itself is the one that
   `../../hosts.js` builds.
3. Nothing of a plot of the owner's, and nothing that a service sent for one: the origin of the
   Swiss grid is where the federal services were asked, by hand, and nowhere else.

## Test

`pnpm sketch:check` — `../../catalogue.check.js` holds the two files, and reads them: the years
2019 to 2026, and of the tile the state of 2025, at the address that the pad builds.
