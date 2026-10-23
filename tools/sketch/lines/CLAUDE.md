# tools/sketch/lines

The guide lines of a sketch (ST-039): a line of as many corners as the owner sets, point after
point, each on the grid shown (ST-042) or with Alt to the centimetre, from above and in every
slice; selected, said in words and taken away. A line is `notes[].line` of version 12 of `docs/STORAGE_FORMAT.md`:
one flat list `[x1, y1, …, xn, yn, colour]`, two points or more, the colour last where the list
is odd; `at: "every"` on a line of the top view puts it on every level, and `hidden: true` beside
it is its own switch (T-039.1). Selected, a line has its panel beside the paper — a row a
segment, "On every level" and its own "Shown" — the lines on every level are listed under the
levels, and the swatch recolours it (T-039.4).

## Public API

`model.js` — `globalThis.lines`; no page, no sketch but the line it is handed, and nothing read as
it loads. Of the paper only what it is handed — `cellM`, how long a cell is, and `flip`, whether
a view is flipped — and `paper.exact`, asked by `words` when it is called.

- `points(line)` — `[[x, y], …]` of a flat list; `colourOf(line)` — its last entry where the list
  is odd, else `null`; `made(points, colour)` — the flat list again, the colour last
- `snapped(at, free, cellM)` — a place of the paper, in cells, as a point: the nearest grid point
  (`Math.round`), or with `free` to the centimetre (`Math.round(v * cellM * 100) / (cellM * 100)`,
  k/50 of a cell at 0.5 m). Never `-0` (Rule 1)
- `measured(a, b, cellM, flip)` — `{ m, deg }`: a segment's length in metres, and its angle in
  degrees from 0 up to 360, **counter-clockwise from the screen's right, as the view shows the
  paper**: rows run down the screen, and a flipped view's columns run leftwards (`paper.FLIP`).
  Neither is rounded. T-039.4 types into the same two numbers
- `near(line, at, reach)` — whether a place lies within `reach` cells of a segment;
  `crosses(rect, line)` — whether a segment passes through the inside of a box `[left, top,
  right, bottom]`, along its edge being outside (the eraser's `crosses` of before, taken over
  every segment); `within(rect, line)` — whether every point lies in the box, its edge within
- `here(note, plane, key)` — whether a note is on a layer: of its plane; from above on its level,
  or `at: "every"` without `hidden: true` — so a line its own switch hides is on no layer (Rule 2);
  on a slice wherever the slice runs, as every note of a slice
- `words(note, cellM, name)` — `Line of 4 corners, 23.45 m long, in Boundary.`: its points, its
  length in all to the centimetre (`paper.exact`) and the colour's `name` as handed;
  `, on every level` before the stop where it says `at: "every"`, `, on every level, hidden`
  where its switch hides it
- **A selected line changed** (T-039.4), each rule changing the note or the line it is handed and
  nothing else, called in a `sketch.change`: `typedLength(text)` — `{ m }`, digits with one point
  or one comma, rounded to the centimetre by its digits (`12.345` is 12.35), more than nought, or
  `{ refused: 'A length is a number of metres, more than nought.' }`; `typedAngle(text)` —
  `{ deg }`, the same digits after an optional minus, to a tenth by its digits (`30.05` is 30.1)
  and taken round to 0 up to 360 (`-90` is 270, `360` is 0, `725` is 5), or `{ refused: 'An angle
  is a number of degrees.' }`; `setSegment(line, at, m, deg, { cellM, flip })` —
  `{ line }`, a new list with point `at + 1` where `m` metres at `deg` from point `at` put it as
  the view shows the paper (`measured` read backwards), to the millimetre (`Math.round(v * cellM
  * 1000) / (cellM * 1000)`), every other point and the colour as they were — past the plot's
  paper too, which has no edge (ST-042, T-042.3). `everyLevel(note, every, level)`
  — `at` to `"every"`, or to `level` with `hidden` taken away; `hide(note, hidden)` — `hidden:
  true`, or none; `recolour(note, colour)` — the last entry of `line`, and nothing else of it
- **The line in progress**, plain data `{ points, placing }` — its points so far, and whether a
  point follows the pointer — and its steps, each giving the next, or `null` for none:
  `pressed(drawing, point, reach)` — the first point, or one more at the end and `placing` again,
  but none within `reach` cells of the last, so the second click of a double-click adds none;
  `escaped(drawing)` — `placing` off where it was on, else `null`; `ended(drawing)` — its points
  where there are two or more, else `null`: a line of one point is not kept

`tool.js` — `globalThis.lineTool`, the Line tool's events and nothing to decide. It reads, as it
loads, `paper`, `sketch`, `lines`, `ownColours`, `palette`, `pointer` and `views`, and hears on the
canvas `pointerdown`, `pointermove`, `pointerup`, `pointercancel` and `dblclick`, and on the
document `keydown` and `keyup`, before the page does.

- While Line is the tool: **a press** with the left button sets a point — on the nearest point
  of the grid shown, `grid.round` of `tools/sketch/grid.js` asked as it places one (ST-042), or
  with Alt to the centimetre — and the pointer captured; **a press dragged** farther than
  `pointer.reach()` and let go there, with no line in progress, sets the second point there and
  ends the line at once: a drag draws a line of two points as it did. **Enter** or **a
  double-click** ends the line; **Escape** drops the point being placed — the line stays, with no
  point at the pointer, until a press goes on with it — and a second Escape drops the line. While
  a line is in progress the two keys are the tool's alone (`stopImmediatePropagation`). A key
  typed into a field, or with a menu open, is not the tool's (`views.typing`)
- **A line ends** with `sketch.apply({ tool: 'line', points, colour, at })`: the colour is
  `palette.colour()`, read as the line ends, and `at` the layer it was drawn on — so that a line
  ended by another layer lies where it was drawn. Nothing of it is in the sketch before that
- `state(tool, key)` — the tool and the layer drawn on, which `page.js`'s `refresh` hands it each
  time, after the layers are read: another tool or another layer ends the line in progress as
  Enter does; Undo and Redo, which change neither, leave it be
- `preview(over)` — `{ line: [[x, y], …], colour }`, the points and, while placing, the point at
  the pointer `over` (on the grid shown, or free while Alt is held), in `paper.hex` of the palette's
  colour; `null` where no line is in progress. `page.js`'s `preview` gives it while Line is the
  tool, `draw-marks.js`'s `marks.stroke` draws it as any line, and `footer.js`'s `measure` says its last
  segment: `— 4.25 m at 30.0°`, `lines.measured`, the length by `paper.exact` and the angle to a
  tenth, 359.96° said as 0.0°
- `pick(note | null)`, `picked()` — the line Select took, while it is in the sketch: erased or
  undone, it is none. `words()` — its words by `lines.words`, the colour named by
  `ownColours.called`; `''` where none is selected
- **Delete** or Backspace, with nothing held beside them and a line selected, take it away in one
  `sketch.change`, which Undo takes back. **Escape** with no line in progress selects no line, and
  the page's Escape goes on
- `onChange()` — how the page is drawn again, which `page.js` sets to its `render`

`panel.js` — `globalThis.linePanel`, a selected line's panel (T-039.4). It reads, as it loads,
`paper`, `sketch` and `lines`, and makes `#line-row`, a section it puts into `#selected` before
`#none-picked` — so after the swatch's row and the other rows put there before it — holding
`#line-levels`, from above alone: `#line-every`, "On every level", and `#line-shown`, "Shown",
there while the first is ticked; and `#segments`, a row a segment, `[data-segment="<at>"]`: `1 to
2`, a field of text for its length, `[name=length]`, "m", one for its angle, `[name=angle]`, "°",
and a sentence under them, `.refused`, `role="alert"`.

- `show(note | null)` — `page.js`'s `refresh` hands it `lineTool.picked()`: hidden of none; else
  the boxes as the note says (`at: "every"`, no `hidden: true`), and each segment's length by
  `paper.exact` and its angle to a tenth, 359.96° said 0.0° — but a field the owner is typing
  into keeps what they typed. The rows are made anew only where the number of segments changed
- A field's `change` (Enter, or the focus gone) takes **both fields of its row**: `typedLength`,
  `typedAngle`, then `setSegment` with the paper's `CELL_M` and `FLIP` — it hands `WIDE` and
  `ROWS` too, which `setSegment` no longer reads (T-042.3) — written
  `note.line = …` in one `sketch.change`; a refusal is said under that row until the next change,
  nothing is written, and the fields show the line as it is
- Each box one `sketch.change`: "On every level" by `everyLevel(note, ticked, sketch.on())` — off
  every level the line lies on the layer drawn on, and its `hidden` goes; "Shown" by `hide`. The
  line stays selected: a change mutates the note in place

`list.js` — `globalThis.everyList`, the lines on every level (T-039.4). It reads, as it loads,
`paper`, `sketch`, `lines` and `ownColours`, and makes `#every-lines`, a section it puts after
`#layers`, outside it — `layers.js` does not name it: an `h2`, "On every level", then a button a
line of the top view at `"every"`, hidden or not, in the sketch's order, `data-line` its place
among the notes, saying `Line of 4 corners, in Boundary` and `, hidden` where its switch hides it,
`aria-current="true"` on the line selected. A click calls `lineTool.pick(note)` and
`sketch.onChange()`. `show(note | null)` — `page.js`'s `refresh` hands it `lineTool.picked()`, in
the line after the panel's; it writes the buttons anew, the focused one keeping the focus; the
section is hidden in a slice and where no line is on every level.

`lines.css` — the look of both, named by `index.html` after `colours.css`.

What the pad's other scripts ask of the folder:

- `layers.js` — `lit()`, while no section is picked, puts the lines that say `at: "every"` and are
  on the layer drawn on by `lines.here` — so none its switch hides — after that layer's own
  notes, at its strength, whatever any level's eye says; where there are none it gives `drawn`
  itself. While a section is picked they are drawn nowhere, as no note is. No count has them,
  and they make no level (`sketch.layer`, `sketch.levels`, unchanged)
- `swatch.js` — where no thing is selected, `show` asks `globalThis.lineTool?.picked()`, not as
  it loads: of a line the row shows its colour (`lines.colourOf`, `paper.hex`), its name
  (`ownColours.called`) and the menu with it marked, titled `The colour of the selected line: a
  click opens the colours, and a pick recolours the line`; a pick is `lines.recolour` in one
  `sketch.change`. A block selected is the swatch's as before
- `page.js` — `refresh`, after the line's words: `linePanel.show(lineTool.picked())`, then
  `everyList.show(lineTool.picked())`

- `pointer.js` — `pointer.grab(at)` has, after a label and before a thing, the line drawn last of
  those `lines.here` puts on the layer drawn on, within `pointer.reach()`: `{ line: <its place
  among the notes>, zone: 'move' }`. It asks `lines` only of a note that is a line.
  `pointer.reach()`, new, is that reach in cells: 6 screen pixels
- `page.js` — Line makes no drag of the page's; Select on a line calls `lineTool.pick` and drags
  nothing; a thing selected by the page, by Select or by the right button's menu, picks no line;
  where `lineTool.picked()` is a line at a `refresh`, no thing is selected, and `#picked` says
  `lineTool.words()`. So whoever picks a line — T-039.4's list — calls `lineTool.pick` and a
  refresh, and nothing more. While Line is the tool the paper is drawn again at each move
- `draw.js` — through `draw-marks.js`'s `marks.mark` since T-042.3 — `mark({ line })`, of `chosen()` where a line is selected: the line's points drawn
  over in ink 2 pixels wider than a line (4.5), and a square of 6 pixels at each corner; drawn
  whether the layer draws the line or not, so a hidden line, picked from a list, shows by its mark
- `strokes.js` — `apply` writes a line of `points` and no `from`/`to`: `{ view: PLANE, at: at ??
  <the layer drawn on>, line: lines.made(points, colour) }`, of two points or more, one step. Its
  `shape` gives `cells` and `reach`, and no line's ends. The eraser asks `lines` — `here`,
  `crosses`, `within` — where it erases and of a note that is a line alone: a click takes a line
  of several corners where any segment passes within its reach, a dragged box one that lies wholly
  in it, a line on every level from any level, and none that its switch hides
- `right-menu.js` — unchanged: a right press on a line has no thing, and opens nothing; Delete
  there takes away things alone

`tools/sketch/index.html` loads `model.js` after `own-colours.js` — `sections/model.js` must stand
right after `sketch.js` — and before `strokes.js`; `tool.js` after `pointer.js`, then `panel.js`
and `list.js`, before `right-menu.js` and `page.js`; and `lines.css` after `colours.css`. No other
page loads the folder.

## Invariants

1. A point is where it was put (Rule 1): on the grid shown — whole cells at every step — or
   with Alt to the centimetre. The pad never moves a point that was set.
2. A line in progress is no part of the sketch: it is written once, as it ends, in one step.
3. The model decides and the tool hears: no rule of a line stands in `tool.js` or the page.
4. Nothing unseen is taken: a line its own switch hides is on no layer, so neither Select nor the
   eraser reaches it.

## Test

`pnpm sketch:check` finds `model.check.js`: `points`, `colourOf` and `made`; `snapped` on the grid
and free at 61.379 and −0.011 cells, never −0; `measured` along each axis, at 30° and 210°, and
the same line in a flipped view; `near`, `crosses` and `within` of a line of four points against
places and boxes it misses, touches along an edge and passes through; `here` of a line of a
level, of the ground, on every level from above and in each slice, and hidden (on none); `words`
of a line of a level, off the grid, on every level and hidden; a line in progress pressed four
times and once at its last point, escaped, pressed on and escaped twice, and `ended` of one point
and of two. And the eraser of `strokes.js` on the made-up plot: a box over two points of a line
takes nothing, a click on its third segment takes it, a line on every level is taken from
another level and from the ground, and one hidden by its switch from none; and `apply` of a line
of `points`, at the layer named and at the one drawn on, and of one point, none. And T-039.4's
rules: `typedLength` of `12.34`, `12,34`, `12.345` and refusals of `0`, `-1`, `1e2`, `12.3.4`, an
empty text, `4 m` and `0.004`; `typedAngle` of `30`, `30.05`, `-90`, `360`, `725` and `-0`, and
refusals of `north` and the like; `setSegment` of the second segment of a line of four points,
12.34 m at 30° from `[60, 30]` — `[81.374, 17.66]`, the three others where they were, read back
12.34 m and 30.0° — the same flipped, `[38.626, 17.66]`, two set past the plot's paper, to `[129.282, -10]` and
`[40, -1]`, and 2000
random segments of 1 m to 10 m from the paper's middle, each read back to the centimetre and the
tenth; `everyLevel`, `hide` and `recolour`, both ways.

`every.check.js` — `layers.js` and `list.js` on a made-up page, levels 18 and 26 each hidden while
another is drawn on, a line on every level, one its switch hides and one on level 18: `lit()` on
18, on 26 and on the ground — the first after the layer drawn on's own notes, the second on none,
the third on 18 alone — and none while a section is picked; level 18's count `1 note`; the list's
two buttons, the hidden one saying so, the selected one marked, a click handing the made-up Line
tool its note and telling the page once, and the list hidden with no line on every level.
`recolour.check.js` — `swatch.js` on a made-up page with a made-up Line tool: a line selected in
red and in "Boundary", each shown and marked; green and Moss picked, one step each, the rest of
the sketch byte for byte; Undo to the bytes of before; a block selected painted and no line;
hidden with neither. `swatch.check.js` passes unchanged.

The story's one browser test, `tests/e2e/sketch-lines.spec.ts`, holds the main path; `panel.js`
and `list.js` are views and wiring past their rules, with no check of their own (directive 14).

`check.js` and `check-slices.js` draw their lines of two points by `points`, writing what they
wrote. `tool.js` is wiring, with no check of its own (directive 14); the browser test holds the
path.

## Gotchas

- **Alt.** In Chromium a release of Alt after a click takes the focus to the browser's own menu;
  while Line is the tool, `tool.js` calls `preventDefault` on Alt's keydown and keyup. A press and
  its click with Alt held say `altKey`. A double-click is two presses and two clicks — the second
  click and the `dblclick` say `detail` 2, and no press says how many it is (`detail` 0) — so the
  second press adds no point because it lies within reach of the first, not by its `detail`.
- **`lines.here` is the one reading of a line's layer.** `sketch.layer` gives a line of
  `at: "every"` to no level, so no count has it; `layers.lit` draws it with the layer drawn on, and
  Select and the eraser reach it from any level.
- **`layers.lit() === layers.drawn()`** where no line is on every level and no section picked:
  `sections/list.check.js` holds it, so `lit` gives `drawn` itself then.
- **Text checks read `page.js`**: `category-list.check.js`, `sections/list.check.js`,
  `sections/hidden.check.js`, `swatch.check.js`, `earth-shown.check.js` and `check-slices.js` read
  lines of `refresh`, `chosen`, `pointerup` and the keys word for word. The line's words are
  written after the panels, not where a thing's are.
