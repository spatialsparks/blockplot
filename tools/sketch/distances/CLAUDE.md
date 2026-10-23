# tools/sketch/distances

The boundary distances of a sketch (ST-036; version 10 of `docs/STORAGE_FORMAT.md`): how far a
building keeps from its parcel's boundary, as the owner typed them from their own zone's rules.

## Public API

`model.js` — `globalThis.distances`; reads nothing as it loads, and knows no sketch but the one
it is handed.

- `LISTED`, frozen — `{ name, words }` of each, in the order a sketch writes them: `smallM`,
  "small boundary distance"; `largeM`, "large boundary distance"; `annexM`, "boundary distance
  of annexes". No figure stands in it
- `FROM_M`, 0.5, and `TO_M`, 30 — the range, both ends within, said here alone
- `of(doc)` — `{ smallM?, largeM?, annexM? }`, what the sketch holds within the range, in the
  order of `LISTED`; `{}` for a sketch that holds none
- `typed(text)` — `{ value }`, to the centimetre; `{ value: null }` for blanks alone, which takes
  the distance away; or `{ refused }`, in one sentence: digits with one point or one comma, or
  none — no sign, no unit, no exponent
- `set(doc, name, value)` — writes one, or takes it away with `null`; `doc.distances` is then
  what `of` read, with that change, in the order of `LISTED`, and left out where it holds none. A
  name not listed, or no number within the range, writes nothing. Call it in a `sketch.change`
- `label(value)` — `4.0 m`, `7.5 m`, `3.25 m`: one decimal, or two where the centimetres need them

`lines.js` — `globalThis.distanceLines`; reads nothing as it loads, and knows no page, no plot and
no sketch: only the outline it is handed.

- `at(outline, metres)` — the lines that lie exactly `metres` inside an outline (the story's
  rules 1 and 2, within 2 cm): a list of **pieces**, each a closed polyline `[[x, y], ...]` in the
  outline's own metres, its first point repeated as its last, in no promised order; an empty list
  where no place of the plot is that far from its outline. The outline is a plot's `outline`:
  either winding, any number of corners, a corner given twice or a last one repeating the first.
  Round about a corner that turns inward the line is an arc in chords, 2 mm from it at most; a
  notch narrower than twice the distance holds none; a waisted plot may give two pieces. Worked
  out once for each figure, never at each drawing: 1 to 7 ms on six corners

`panel.js` — `globalThis.distancePanel`, the plan's panel and its lines (T-036.3). It reads, as
it loads, `distances`, `distanceLines`, `sketch`, `views`, `paper` and `SITE`, makes a row a
distance in `#distance-fields` — its words, the field `#distance-<name>`, "m", a short line in its
colour, `#distance-<name>-range` and `#distance-<name>-said` — and hears `#distances-open`, each
field's `change` (taken by `typed`, written by `set` in one `sketch.change`, an empty field taking
the distance away) and the switch `#distances-shown`, which it hands `views.keep` as
`distancesShown`. The colours, named there alone and held by no sketch: `smallM` `#2563eb`,
`largeM` `#c026d3`, `annexM` `#0f766e`.

- `show()` — the fields and the words beside them follow the sketch: a field says the sketch's
  figure, or nothing, but leaves a text of the owner's that was refused until it is typed into
  again or the sketch holds another figure there; beside it why it was refused, or `No place of
  the plot is <label> from its outline: there is no line.` `page.js`'s `refresh` calls it
- `drawn()` — what the paper draws now: `[]` where the view is not from above or the switch is
  off; else `{ name, label, colour, pieces }` for each distance the sketch holds that gives a
  line, in the order of `LISTED`, the pieces those of `at(SITE.outline, value)`, worked out once
  a figure and kept in a `Map` while the page is open
- `draw(pen)` — draws `drawn()` with the pen that `land.site` is handed, after the outline and the
  plot's notes: each piece solid, 1.5 pixels, its label once a piece at the middle of its longest
  side, in its colour, 11 pixels

`tools/sketch/index.html` alone loads the folder — `model.js`, `lines.js`, `panel.js`, after
`sections/list.js` and before `zoom.js` — and `distances.css`, the panel's look, after `icons.css`.
No other page has the button, the panel or the lines: not 3D, not Info, not a slice.

## Invariants

1. No default (directive 31; the story's rule 3): the pad holds no figure of any zone, and a
   distance that is not typed is none, and draws nothing.
2. One reading: whoever needs a distance asks `of`, and reads no `distances` itself. `set` is the
   format's only writer. What is none stays as written until a distance is next set.
3. The switch that shows the lines is the view's, kept for the tab: it is never written here,
   nor into the sketch.

## Test

`pnpm sketch:check` finds `model.check.js`: the list and its range, typed in; `of`, `typed`,
`set` and `label` on made-up sketches; and the three distances that `every-part.json` gained with
version 10, made again by the pad's own changes on its file of version 9, with three steps of Undo.

And `lines.check.js`: a proof of rules 1 and 2 of its own, sharing nothing with `lines.js` but the
distance to a side — each piece walked every centimetre, inside and at the distance within 2 cm,
and every crossing of the distance on a grid of probes every 5 cm within 2 cm of a piece, each
piece closed — then the hand cases on made-up outlines: the made-up plot at 4 m and 7.5 m, by its
six corners within 1 mm, either winding, none at 10.5 m and 30 m; an L with an inward corner and a
notch; a plot with a waist, two pieces at 4 m and one at 2.9 m; a corner that does not turn and
one given twice, and the sliver 2 cm wide at 9.99 m.

`panel.js` is a view, and has no check of its own (directive 14): the story's one browser test,
`tests/e2e/sketch-distances.spec.ts`, holds it, and `plot-keys.check.js` that two `views.keep`s of
one page both keep.
