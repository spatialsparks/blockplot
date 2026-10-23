# tools/sketch/info

What the sketch adds up to (ST-032): the rates of a rough cost, as version 7 of the sketch file
holds them, the sums, and the page that shows them, `../info.html` (T-032.5). Plain scripts.

## Public API

`rates.js` — `globalThis.rates`, as `../figures.js`: it asks `categories`, and knows no sketch
but the one it is handed. `PER`, `{ room: 'm³', glass: 'm³', open: 'm²' }` — what a rate
multiplies, named here once. `MOST`, 1 000 000. `of(doc)`, `{ as, category }`: the rates a sketch
holds, under `PER`'s words and the keys of `categories.LIST` that count as one; all else unread.
`typed(text)` — `{ value }` to the centime, `{ value: null }` for blanks, which takes the rate
away, or `{ refused }`; `1'200` is 1200. `set(doc, { as } or { category }, value)`, in a change.

`sums.js` — `globalThis.sums`, one way in: `of()`, what `sketch.doc` adds up to, none rounded:
`blocks`; `apart`, `{ ground, cut }`, in no row; `house`; `sections`, `levels`, `categories`, each
`{ rows, total }`; `twice`, `[{ level, name, m2 }]`; `through`. A row is `{ name, blocks, floor,
open, volume, cost, without }`, with `id`, `level`, or `key`, `as`, `rate`; a total is "Total".

`page.js` — the Info page's last script: it shows `sums.of()`, adds up nothing, and writes a rate.
Its ids are its tests' contract: `#info-said`, `-none`, `-house`, `-is`, `-rates` with `#rate-room`,
`-glass`, `-open`; `#info-sections`, `-levels`, `-categories` with `#rate-<key>`; `#info-twice`,
`-through`, `-apart`. `globalThis.infoPage`: `area`, `volume`, `francs` — each unit's one
rounding, to 2, 3 and 0 decimals — and `cost`, a row's cost in words.

## Invariants

1. No rate is the pad's (the story's rule 3): no default, and no cost without one. `0` is a rate.
2. One reading and one writer of a rate, `of` and `set`: `doc.rates` holds what the pad read of
   it, in `of`'s order, and no empty part. What is no rate is not read, not written, refuses none.
3. A block's floor and volume are `sketch.stats`'; hiding changes no figure. Under a piece of a
   slope two totals may differ in a last binary digit, which `page.js` rounds away as it shows.
4. `page.js` writes a rate as `../view3d/read.js` writes a figure: into the sketch kept at that
   moment, by `sketch.change`, never over a text it cannot read. A field's untaken text stays.

## Test

`pnpm sketch:check` finds three: `rates.check.js` — `typed` on 19 rates and 32 refusals, `set`;
`sums.check.js` — each figure of T-032.2 by hand, a total the sum of its rows; `page.check.js` —
every cell of the page, a rate typed, the text of `info.html`. In a browser `e2e/sketch-info*`.
