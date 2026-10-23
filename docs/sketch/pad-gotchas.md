## Gotchas

- **The owner's plot is no file of this folder any more** (ST-030). It lay here as a script,
  `site.js`, and was moved on 2026-10-13 into their data, as a plot's file:
  `design/plots/home/plot.json`. How it came to be — written on 2026-10-08, off the stored
  site and swissALTI3D — is that folder's to say now (`design/plots/CLAUDE.md`). One script
  of the pad makes a plot, and no other: `tools/sketch/new-plot/making.js`, for the map's page,
  which makes it in the browser and writes its folder where the owner picks, or offers its file
  (ST-031, T-041.3) — never the owner's `home`, and never over a plot that is there. The server
  writes nothing since T-041.4.
- **A pad that was started before T-040.4 gives a page what it no longer asks for**: its
  server read the rules as it started. A page of now asks it no `site.js` and no address of a
  plot, so it opens all the same, on the plot this browser shows; but `3d.html` asks three.js
  at `./three/`, which such a server gives too, and `map/index.html`, which File asks for
  "New plot", a made-up pad of before T-041.4 answers 404 — an error on the console, and no
  "New plot". Stop the pad and start
  it again with `pnpm sketch`, as after any change to `tools/sketch/routes.js` or
  `tools/sketch/serve.js`. Where `boot.js` itself does not come — the page opened from its
  file, or a server that refuses it — the page says "The pad did not start: its first script
  did not load. Reload the page." and nothing runs that could write.
- **The server has no plot of its own** (T-040.4): `/` shows the plot that the tab or the
  browser noted, from the browser's store, and else the example — never `home` by itself, and
  never a plot of `design/plots/` that the browser does not hold: the owner opens it once, by
  its folder or its file (File, "Open plot"), and from then on the browser shows it. So the
  owner's sketch of before, under the key of today, shows again once `home` is opened so.
  The kept sketches are the page's since T-040.5, in the plot's folder or in the browser, and
  the server has none. A file of the pad reads no plot.
- **A sketch does not say its plot**, in the browser neither: a plot's sketch is found by
  the key of its folder's name. A plot's folder that is renamed is another plot to a
  browser, with an empty paper, and the sketch stays under the key of the name it had;
  renamed back, it is there again. `home` renamed no longer has the key of today. A plot
  that is renamed in its file, `name`, keeps its folder, its key and its kept sketches.
- **`tools/sketch/look.js` puts its sketch under the key of the plot it shows** (T-040.4): with
  `--demo` the example's, `blockplot/sketch/plot/example/space`; with `--plot=<file>` the key
  that the page gave the plot it was handed, read off its `PLOT` once it shows, and the sketch
  put there before the page opens again — so either shows the sketch file that the look was
  handed.
- Each script is one function, and their order in `tools/sketch/index.html` is the order they need each other
  in: a `const document` at the top of a script is a syntax error in a browser, and a module does
  not load from a file. Another view is the page loaded again: what a tab shows, and its steps
  to undo, wait in `sessionStorage` meanwhile. `tools/sketch/3d.html` loads those of them that read the
  sketch, `tools/sketch/earth.js` among them, and `tools/sketch/views.js`; `tools/sketch/view3d/` and `tools/sketch/scene/` alone are modules.
  `tools/sketch/page.js` wants `tools/sketch/files.js` before it, `tools/sketch/shapes.js` wants `tools/sketch/figures.js`, and `tools/sketch/earth.js` wants
  `tools/sketch/blocks.js`: `tools/sketch/paper.js`, which loads first of all, asks for `earth` only when `settle` is
  called, and shapes nothing where no `tools/sketch/earth.js` was loaded. `tools/sketch/categories.js` wants nothing
  and reads nothing as it loads: every page names it in the line before `tools/sketch/blocks.js`, which
  asks for `categories` only when a block is read — and so do `tools/sketch/labels.js` and `tools/sketch/footer.js` —
  so a check loads it once, in any place before that, however often it loads the others anew.
  `tools/sketch/sections/model.js` too wants nothing and reads nothing as it loads (T-032.3): the pad's page
  names it in the line after `tools/sketch/sketch.js`, whose `shows` asks for `sections` only when a thing
  is asked of — so a check loads it once, too — and `tools/sketch/3d.html` names none.
  `tools/sketch/boot.js` is every page's first script and stands outside its template, the last tag
  of the page (T-040.2): it puts the template's scripts in, `site.js` first, so the checks that
  read a page's scripts by their one-line form read the template's list as before, and the
  checks of `tools/sketch/view3d/` that load the 3D page's scripts in Node load no `boot.js`. `tools/sketch/open-plot.js`
  wants `tools/sketch/kept.js` before it: its entry stands after that script's.
  `tools/sketch/blocks.js` stands at 298 of the linter's 300 lines, since the words a name is read by left
  it; `tools/sketch/page.js` at 298 — since the list of kinds went
  for the gallery, where a colour as the Block tool and the swatch had left it at 299, and
  the sections' two lines came (T-032.4) — and `tools/sketch/draw.js` at 290; and three
  are full, at 300, with no line to spare: `tools/sketch/strokes.js`, since a cut offers an object nothing
  to stand on, `tools/sketch/earth.js`, since the rule of the cut, and `tools/sketch/sketch.js`, since it says what
  shows (T-032.3) — at 299 since it keeps by plot (T-030.3), a line made free in its words
  for that. `tools/sketch/shapes.js` was near full too, and the staircases' drawings left it for
  `tools/sketch/stairs.js`, to make room there for the sizes of objects (T-035.1). What they
  learn next is a script
  of its own, with its line in `tools/sketch/index.html` — which stands at 256, since its own rules left
  it for `tools/sketch/pad.css` (T-029.4), and its scripts lie in its template, `site.js` first,
  one line since T-040.4, `boot.js` last outside it (T-040.2) —
  and `tools/sketch/3d.html` at 280, with Settings a button of its toolbar and the figures a side of
  their own (T-029.5), since
  what the two share of their look left them for `tools/sketch/frame.css` (ST-029). With the one look
  (T-029.6) `tools/sketch/frame.css` stands at 279 lines, `tools/sketch/icons.css` at 166 — with Info (T-032.5) — and **`tools/sketch/pad.css` at 298,
  with two lines to spare**, since the row of a section took a level's rules in their own
  lines, `:is(#layers, #sections)`, and its row on the right the rule of the other two
  (T-032.4): what the pad's own page learns next of its look wants a rule
  made shorter first, or a rule that both pages can share, in `tools/sketch/frame.css`. None of the five
  is counted by a gate (invariant 5). A rule of the pad's own
  page is written into `tools/sketch/pad.css`, and none into the page.
  `tools/sketch/views.js` stands at 213 lines, since it makes menus — and one with no button,
  `views.popup` (T-037.5) — says whose the tab's is and has a seventh view (T-032.5). A script
  that needs a
  button makes it, as `tools/sketch/kept.js` does — and so `tools/sketch/category-list.js`
  its list: it wants `tools/sketch/categories.js`, `tools/sketch/sketch.js`, `tools/sketch/labels.js`, `tools/sketch/footer.js` and `tools/sketch/views.js`
  before it, and `tools/sketch/page.js`, whose `refresh` calls `categoryList.show`, wants it. And so
  `tools/sketch/swatch.js`, at 91 lines, its row: it wants `tools/sketch/paper.js`, `tools/sketch/sketch.js`, `tools/sketch/strokes.js` and
  `tools/sketch/views.js` before it — the page names it in the line after `tools/sketch/category-list.js` — and
  `tools/sketch/page.js`, whose `refresh` calls `swatch.show`, wants it. And so `tools/sketch/gallery.js`, at 109
  lines, its gallery (T-029.4): it draws every kind as it loads, so it wants `tools/sketch/paper.js`,
  for the ink, `tools/sketch/shapes.js` with the five files that draw more kinds, and
  `tools/sketch/object-groups.js`, at 23 lines, before it — which wants `tools/sketch/shapes.js` alone, and which the
  page names in the line after `tools/sketch/furniture.js` — and, for how high a door and a window are,
  `tools/sketch/figures.js` and `tools/sketch/sketch.js`; the page names it in the line after `tools/sketch/swatch.js`, and
  `tools/sketch/page.js`, whose `refresh` calls `gallery.show` and which sets `gallery.onPick`, wants
  it. And so `tools/sketch/sections/list.js` its list and its row (T-032.4): it wants `tools/sketch/sketch.js`,
  `tools/sketch/sections/model.js`, `tools/sketch/strokes.js`, `tools/sketch/labels.js` and `tools/sketch/swatch.js` before it — the page names
  it in the line after `tools/sketch/gallery.js` — and `tools/sketch/page.js`, whose `refresh` calls
  `sectionList.show` and whose `pointerup` calls `sectionList.fill`, wants it; `tools/sketch/layers.js`,
  before it, asks for `sectionList` only as the paper is drawn (`layers.lit`), and where no
  list was loaded draws what it read. **A file of shapes that fails to load now stops the page as it opens** — tried, on a
  copy opened from its file with `tools/sketch/kitchen.js` taken away: the gallery draws every kind as it
  loads, fails at the first whose shape is missing, and `tools/sketch/page.js` after it, so no paper is
  drawn and nothing is written. Before, the page opened, and the paper failed at the first
  such object that a layer showed. `tools/sketch/draw.js`
  loads before the sketch, and asks for `sketch.worded` only when it draws.
- A step to undo is the sketch as text, and a tab keeps its steps across a reload — across an
  update of the pad, too. `sketch.step` reads a step as a sketch is read, through
  `sketch.adopt`: one of a version before is undone to as a sketch of this version, so that
  what the pad writes after it says 7; one that this pad cannot read — of a pad to come — is
  dropped at that press, with nothing written and the page not told.
- A block has a category, or none (`of` of `tools/sketch/categories.js`, ST-028), and what it counts as
  follows from it. The list beside the paper shows it and picks it (`tools/sketch/category-list.js`), and
  **stands at its first entry while nothing is picked**, with what the name gives in that
  entry's text — "Kitchen / Dining" reads "By its name: Kitchen" with nothing done. A list
  that stood at the name's category could not have that very category picked: a list tells
  of no pick that changes nothing. So a picked Kitchen reads "Kitchen", and the first entry
  goes on saying what the name gives while a category is picked: what going back to it
  brings. That is asked of the one reading as well — `categories.of` of the block's boxes
  with no category said — so the script names the field once, and reads none.
- On the paper a picked category stands where a name would, in the same ink: nothing there
  tells "Kitchen" the name from Kitchen the category. Beside the paper the list and its
  sentence do. A block with a name shows its name, whatever was picked for it. And the
  label of the selected block stands a line lower under either (`chosen` of `tools/sketch/page.js`).
- The list's five groups are named in `GROUPS` of `tools/sketch/category-list.js`: the pad's words for
  what a block counts as, said a second time, for `tools/sketch/footer.js` hands its own to nobody. A
  group is made where the list first names what it counts as, and a row falls into the
  group of its kind. A row added to `categories.LIST` wants its place among the rows that
  count as it does, and two figures of `tools/sketch/category-list.check.js` changed — thirty, and 22,
  5, 1, 1 and 1: the check holds the entries, group after group, to the list's own order.
- A word of the list is read wherever it stands in a name, in a longer word too: "Showcase"
  holds `wc` and is a Toilet, "Shallow end" holds `hall` and is a Corridor, "Embedded" a
  Bedroom. Each is a room all the same, as it was: the words that are new are words of
  rooms, and a name counts as what it counted as (ST-028, rule 4) — which
  `tools/sketch/categories.check.js` holds against the reading of before, kept in that check. So a word
  for open air, for glass, for ground or for a cut is never added to the list without a
  story: it would change what kept sketches count as. A word for a room may be, where it
  stands in no word of another row, and no other row's word in it: the check says so.
- A cut is the fifth thing a block counts as, new with version 6 (ST-028), and **it takes
  ground away**: under it the ground lies no higher than its floor (`tools/sketch/earth.js`). On the paper
  a cut is a block in its colour, in every view, with no mark of its own, and its floor is
  the ground: the line of a slice runs level along it, under the hill as it was — what is
  filled and what is cut is still told by which of the two lines lies higher, and by the
  tint: between them a fill is tinted, and a cut is paper. From above nothing shows the cut
  ground. To the rule a cut is neither ground nor a block of the house
  (`read` of `tools/sketch/earth.js`): it holds no ground back. `tools/sketch/view3d/read.js` hands on no box of it, so
  in 3D it is no solid, has no wall and no roof, and gives no level: it is the hill where it
  bites (`docs/sketch/view3d.md`). The pad says of it where its floor lies, and no height, no
  volume and no floor of a room. And nothing stands on it (below). For the ground under a
  cut no line of `tools/sketch/land.js`, of `tools/sketch/view3d/` or of `tools/sketch/scene/` changed: a slice and the 3D view ask
  the paper, which holds the one ground.
- Only the floor of a cut counts: not how high its box reaches, nor a top of it that slopes.
  So its top edge moves nothing — moved with Select, the paper works nothing out — and the
  block is drawn up through the earth that is to go, as high as one likes. Its floor is
  level wherever it bites; a cut that slopes is a block of ground with a sloping top, drawn
  under the hill. A cut that bites nowhere — wholly over the ground, off the plot, inside a
  block of the house clear of its edges — shapes nothing: alone in a sketch it leaves the
  paper with no grid, and a slice with no thin line and no second line of words.
- A cut is held against the ground as it would be without the cuts, all of them (`tools/sketch/earth.js`;
  ADR-0108 has why). So **beside ground that lies lower already — a deeper pit of
  ground, a block of ground with its top under the hill — a cut takes nothing**, though the
  hill itself stood over its floor: it never holds ground up. And **of two cuts side by side
  each holds its floor**: the shallower is a terrace beside the deeper one, with a step
  between them, where the deeper one alone would have let the ground run down to it. Where a
  cut and a block of ground lie over one place, the lower of the two is the ground.
- A step is one cell wide at the outline too, where the ground is the site's: a cut that
  reaches the edge of the plot leaves a wall of earth there, in half a metre — 2.8 m high at
  the uphill end of the cut beside the made-up day rooms, 0.8 m at its downhill end. Nothing
  limits how steep the ground is. And just downhill of a cut the ground lies a hair under
  its floor: it runs out to the edge from there, and falls with the hill.
- A name is a cut where it holds `ground cut`, two words with one blank, and no `ground
  fill`: so "Playground cutting" is a cut by chance, and "Groundcut", "Ground-cut" and "Cut"
  are rooms. A sketch of any version is read so, the kept ones too: a block so named, which
  was a room — or open air or glass, by another word of its name — is a cut the moment its
  sketch opens, with no word of the file changed (`docs/STORAGE_FORMAT.md`, "version 5").
- In the scripts `cut` is said of four things: where a slice runs (`#cut`, the tool `'cut'`
  of `tools/sketch/page.js`), a box cut out of a block (`tools/sketch/slopes-cut.check.js`), the level a 3D view is cut
  at (`tools/sketch/scene/cut.js`) — and a block that counts as one: `"is":"cut"`, the category
  `ground-cut`. And a block of ground whose top lies under the hill cuts too, and is no cut.
- A block counts as a room, open air, glass, ground or a cut (`countsAs` of `tools/sketch/blocks.js`), and
  the fourth is new with version 5 (ST-027). In the pad a block of ground shapes the ground: the
  line of a slice, the tint under it, where an object on the ground stands and what the pad
  says of a place are the shaped ground's, and the block itself is a block in its colour in
  every view, with no mark of its own — from above nothing shows the shaped ground at all.
  **In 3D a block of ground is the hill, and no thing**: the 3D view is handed the shaped
  ground and no box of a block of ground. `tools/sketch/view3d/read.js` has the paper settle the ground of
  the sketch it reads, hands the scene the plot with the paper's own grid — the one the
  slices are drawn by — and leaves the boxes of ground out: no solid, no part, no level and
  no hole in the hill, with what stands on the ground on it (`docs/sketch/view3d.md`).
- The ground is settled in two places, and in no third: on the pad's page in the first line
  of `refresh` of `tools/sketch/page.js`, and on the 3D page in `read` of `tools/sketch/view3d/read.js`, before a thing
  is read. On the pad's page
  every change ends there — a stroke, the key C, an undo and a redo, a level lifted, a file or
  a kept sketch opened, a slice stepped, another window's change — and the layers are read
  after it, for they ask the ground where an object stands: `tools/sketch/earth-shown.check.js` holds the
  order by the text of `tools/sketch/page.js`, and `sketch-3d-ground.spec.ts` by what a browser draws, the
  made-up tree on its lawn. What draws without `refresh`
  works out nothing: a pointer that moves, a stroke in progress, a slice's line that is
  dragged. So **while a block of ground is dragged the ground stays where it was**, and
  follows when the pointer lets go. And the footer's words of the pointer's place are written
  when the pointer moves: after C or Undo they say the ground of before until it does.
- A slice shows the hill as it was on every slice once the paper holds a shaped ground
  (`paper.shaped()`), and on none before: `tools/sketch/land.js` holds no two heights against each other.
  So the words "— the ground as it was" stand also on a slice where the two lines are one to
  the eye, far from every block of ground. What is filled and what is cut is told by which
  line lies higher and by the tint — between the two a fill is tinted and a cut is paper —
  and by nothing else; the thin line lies under the ink wherever the two are less than some
  3 cm apart, at the zoom the pad opens with. A block of ground that shapes nothing — off the
  plot, or wholly inside a block of the house — brings neither the line nor the words, and
  neither does a cut that bites nowhere.
- What stands on the ground follows it; what stands on a level does not. An object set down
  on the top of a block stands on that level — a row — where the block is a room, and on
  `'ground'` once the block is ground: the first stays in its row when the block's top is
  moved, the second goes with it. And an object set down nearer to the floor of a block of
  ground than to its top stands on that floor, under the ground (`standOn` of `tools/sketch/strokes.js`).
  **A cut is no thing to stand on** (ST-028): its boxes offer neither their floor nor their
  top, so whatever is set down in a cut stands on `'ground'` — at the cut's floor wherever
  the ground lay higher, on the ground under that floor where it lay lower, and with the
  floor as that is moved. `standOn` asks `blocks.countsAs` of the block, and reads no `is`:
  a box that says nothing, of a block that counts as a cut, offers nothing either. What was
  set down on a block before it was made a cut stays on its level, in the air: nothing moves
  an object but the owner.
- **An object set down where a hidden block stands** — on its level, within its floor plan —
  belongs to that block (`sections.of`) and is hidden with it at once (T-032.3): the level's
  line counts one more hidden thing, and the pad says nothing else.
- The shaped ground is worked out on the grid, and the grid shows in it (`tools/sketch/earth.js`). Between
  two grid points the ground is a straight line (`paper.groundAt`), so a step is one cell
  wide, half a metre: at the edge of the plot, where a block of ground reaches it, and
  against a block of the house — a slice shows the step into the house inside that block's
  last cell. A cell that the outline passes through is the site's: where the outline runs
  askew, or off the lines of the grid as a real plot's does, the shaped ground meets the hill
  up to a cell inside the outline. And two blocks of the house that touch at a corner leave a
  way between them: the ground runs through that one grid point, out of a courtyard too.
- A block of ground moves the whole plot by a little, the hill behind the house too: every
  grid point of the plot's ground that no block sets lies as far over the hill as the mean of
  its neighbours, so none stays quite the site's — some 0.6 mm under the made-up car, with a
  block of ground before the porch. The site's very numbers hold on the outline and outside
  it, inside a block of the house, and in a place the house closes in with no ground set.
- A cut moves the whole plot too, and by more than a block of ground does: the ground runs
  out from its floor to the edge on every side. With the cut that the made-up house has
  beside its day rooms, 252 grid points lie at its floor and 1 067, those among them, more
  than a centimetre from where they lay; under the middle of the made-up car, 7 m up the
  plot from the cut, the ground lies 0.16 to 0.19 m under the hill, and the car stands 0.18 m
  lower. So what the pad says of a place, where an object on the ground stands and where an
  open floor has a railing in 3D change far from a cut — though of the made-up house the car
  is all that the cut moves in 3D: no railing of it comes or goes.
- `paper.settle` works the ground out anew at every change of a box of ground, and — while a
  block of ground is there — of where a box of the house lies: some 5 ms on the made-up plot
  and 10 to 30 ms on a plot of ten thousand grid points, three hundred sweeps each. On such a
  plot a place that the house closes in on every side, with one small block of ground in it,
  is the slowest kind: two thousand sweeps, a fifth of a second. And a house drawn as a maze
  may reach `SWEEPS_MOST`, unsaid: the ground is then as far as it came. Told things that
  shape the same ground, the paper works out nothing, in a fifth of a millisecond for two
  hundred boxes: when a page calls `settle` is the page's to say. The pad's page calls it at
  every `refresh`, in each of its five views: in the tests' browser a working out took 4 to
  5 ms on the made-up plot — and the made-up house takes two of them now (below). From above
  it is worked out for nothing that shows: in the top view no script asks the paper for a
  height.
- What the rule costs with a cut, by the figures of T-028.3, measured on the owner's PC: **a
  sketch with a block of ground and a cut that bites is worked out twice**, in about twice
  the time — 7 ms where the made-up house with its lawn alone took 4, 39 ms where a house on
  ten thousand grid points took 20 — and `sweeps` is both workings out together, twice
  `SWEEPS_MOST` at the most. **The made-up house is such a sketch since it has its cut**
  (T-028.5): its lawn raises, its cut bites, and its ground is worked out twice, in 579
  sweeps, 289 and 290 — wherever a page, a check or a browser test has the paper settle the
  ground of it. A sketch with cuts alone, or with a cut that bites nowhere, is swept once. While
  there is a cut, every change of where a box of the house lies works the ground out anew,
  as while there is a block of ground; a cut's box made higher is the same text, and costs
  nothing. The rest is in ADR-0108: the run-out of a fill that a cut bites into,
  an edge that a cut shares with a block of ground or of the house, a box of no width.
- A name is ground where it holds `ground fill`, two words with one blank, in capitals or not
  and whatever else stands in it: so "Playground filling" is ground by chance, and "Groundfill",
  "Ground-fill" and "Auffüllung" are rooms — C says what the name does not. It is asked before
  every other word of the list — before a cut, glass and open air: "Ground fill, roof terrace"
  is ground, and so is "Ground cut over ground fill". A sketch of any
  version is read so, the kept ones too: a block so named is ground the moment its sketch
  opens, with no word of the file changed (`docs/STORAGE_FORMAT.md`, "version 4").
- A sixth thing to count as wants a word in five places, as the fifth did in four (ADR-0081):
  the words `is` may say, `COUNTS_AS` of `tools/sketch/blocks.js`; `COUNTS` of `tools/sketch/labels.js`, for the key's
  round; a phrase in `COUNTED` of `tools/sketch/footer.js`; its place in the order a name is read in,
  `ORDER` of `tools/sketch/categories.js`, with a row of the list that counts as it; and a name for its
  group in the list beside the paper, `GROUPS` of `tools/sketch/category-list.js`. Where the second or
  the third lacks it, `tools/sketch/counts.check.js` fails: its round asks a phrase of every step; where
  the fifth does, `tools/sketch/category-list.check.js` fails, which names every group. And
  every reader of `countsAs` has to say what it does with the new answer: `read` of
  `tools/sketch/earth.js`, where whatever is no ground and no cut is a block of the house; `isGround`
  of `tools/sketch/view3d/read.js`, which hands the scene every block that is neither — the scene itself
  reads a word it does not know as a room (`asOf` of `tools/sketch/scene/space.js`); and `standOn` of
  `tools/sketch/strokes.js`, which has an object stand on every block but a cut.
- Of ground the pad says one sentence on its top, in metres above sea level, and names no
  floor: "Its top is 816 m above sea level.", or under a top that slopes "Its top falls down
  the plot, from 816 m above sea level to 815 m." — the two ends as `topOf` reads them, which
  lie under the top of the box where the box is a piece of a longer ramp. A level top is the
  highest of the block's boxes as they were drawn, `stats.floor + stats.high`. Of a cut it
  says one sentence on its floor, and none on its top, sloping or not: "Its floor is 814 m
  above sea level." — the lowest floor of the block's boxes, `stats.floor`. Of every block
  that is neither a slope is still said over its floor. The label on the selected block,
  and the face under the pointer in the status line, are the box's as drawn, height and all,
  whatever the block counts as.
- **A look is told a place in pixels, and these notes say it in cells**: `<column 42.75, row
  35.5>`, a column and a row of the view's paper — for the pixels change whenever the toolbar
  or the left side does. The rule that turns cells into pixels, said once: in a window of 1440
  pixels, on the made-up plot, the paper opens at 10 pixels a cell, a column lies
  `257 + 10 * column` pixels across and a row `80 + 10 * row` pixels down — the left side is
  256 pixels wide and the toolbar, one line there since T-029.6, 79 high, and one pixel more
  lies inside the cell. So `<column 42.75, row 35.5>` is typed `684,435`, the corner
  `<column 30, row 12>` is `557,200`, and two rows are 20 pixels. Whoever changes how high the
  toolbar is, or how wide the left side, changes this one line, and no look. With `--width`
  the sides are as wide and the paper opens larger: `tools/sketch/zoom.js` fits the plot's columns, 92 on
  the made-up plot, into what the two sides leave of the window, at the largest rung of
  `grid.LADDER` that fits (ST-042) — 20
  in a window of 2400, where a column lies `257 + 20 * column` across and a row
  `80 + 20 * row` down, and 24 in one of 2800.
- **The grid shown is the grid of the cell as drawn** (ST-042). `paper.draw` draws a cell at
  `px × devicePixelRatio` exactly since T-042.3 — the window's corner and each box's edges on
  whole pixels, and no cell rounded — so the rung 1.5 shows the 5 m grid: a look takes six clicks
  of `#smaller` from 10 — 8, 6, 4, 3, 2, 1.5 — to a 5 m grid, its figures every 25 m, and the
  tests' window five from 8. What a click snaps to is `grid.shown`, the step last drawn: so the
  snap and the lines seen agree. The grey metre lines of before are gone:
  at 0.5 m every fifth line, 2.5 m, is the stronger one, and the figures stand there. A check
  that loads `tools/sketch/strokes.js` without `tools/sketch/grid.js` snaps to every cell, as before.
- **The canvas is the window, not the paper** (T-042.3). `#scroller` scrolls no more: the wheel
  moves the paper, Ctrl with it zooms, and a look's `wheel=<x>,<y>,<notches>` moves the paper
  as a wheel does. The middle button, and the left with Space held, are heard on `#scroller` in
  the capture phase and stop there, so no tool on the canvas hears a press that moves the paper.
  A place is pointed at by `zoom`'s window — `px`, `left`, `top`, `tests/e2e/sketch-paper.ts` in
  a browser test — and never by the canvas's box shared out over the paper's cells. The canvas's
  foot moves with the line under it, which takes two lines at times: a test that holds the
  paper still compares its corner and the canvas's left, right and top.
- To see what the pad says of ground: a made-up sketch with a block named "Ground fill" —
  `pnpm sketch:look "index.html#side" <that sketch> <picture> --demo "click=<x>,<y>"` on the
  block, and `"key=c"` after it, once for a room set by hand, four times for ground set by
  hand, five times for a cut set by hand, six times for its name again. So of a block named
  "Ground cut", which is a cut by its name as it is clicked, and of one named "Kitchen /
  Dining", a room. With an `sdrag` from a top corner of the block to two rows under it, a
  ramp.
  The same look shows the ground shaped: level along the block's top and out to the plot
  boundary, over the thin line — with a `drag` from the block's top edge to ten rows under it,
  the top ten rows lower, a cut where that lies under the hill; and with `"key=4"` the slice
  across the plot, where that runs through the block. And with no step at all, the made-up
  sketch shows a terrace as it is drawn: `pnpm sketch:look "index.html#side"
  tests/__fixtures__/sketch/made-up.json <picture> --demo` — before the glass porch the ground
  runs level for seven metres, a brown block under it and the tree on it, and falls to the
  hill at the plot boundary, over the thin line of the hill as it was; with `"key=1"` the lawn
  from above, a block on a level of its own, 812 m.
- To see a cut: the made-up sketch has one, the last of its things (T-028.5). From above,
  `pnpm sketch:look "index.html#top" tests/__fixtures__/sketch/made-up.json <picture> --demo
  "click=text=Level 814 m"`: a red block along the long side of the day rooms, out to the
  plot boundary, with "Ground cut" on it — and with `"click=<column 40, row 16>"` after it,
  right of the paper the pad's words of a cut and its category in the list. With `"key=4"` in
  the click's place the front
  view, whose slice runs through the cut: the ground stands at the floor of the day rooms
  against their side, and at the plot boundary the hill stands over it as a wall of earth.
  The file's slice along the plot runs beside the cut, along row 30: for the side view, a
  copy outside the repository with `"side":16` under `on` — `pnpm sketch:look
  "index.html#side" <that copy> <picture> --demo`: the red block, the ground level along its
  floor, 814 m, the hill as it was a thin line through the block above it with paper between
  the two, and uphill of the block the ground climbing back to the hill. With `"key=o"
  "click=<column 35, row 22.25>" "click=<column 45, row 18.5>"` after it, two people set down
  in the cut, near its floor
  and near the top of its box, both standing on its floor. In 3D: `docs/sketch/view3d.md`.
- To see the list of categories: `pnpm sketch:look "index.html#top"
  tests/__fixtures__/sketch/made-up.json <picture> --demo "click=<column 42.75, row 35.5>"` —
  the bath: right of the paper the pad's words of it, and under them "By its name: Bathroom"
  over "Category: Bathroom, by its name."; with `"click=<column 32, row 31>"`, the night
  rooms, "By its name: no
  category"; and with `"key=k"` after a click the list open, its first entry and the group
  "A room" under it — the tests' browser draws an open list into the page's picture. A click
  within `GRAB_PX` of an edge that two blocks share — 6 pixels of the screen, at whatever
  zoom (`tools/sketch/page.js`), which is more than half a cell where the paper opens at 10 — takes the
  block that lies on top: at `<column 43.5, row 35.5>`, 5 pixels from the edge that the bath
  has at column 44, the roof terrace, a Roof by its name, for "roof" stands first in it; and
  two pixels further from that edge, the bath. A
  sketch made up with a block that says `"category":"kitchen"` and no name shows the word
  on the block and, once the block is selected, its size a line under the word.
- To see the swatch: that look of the bath — `pnpm sketch:look "index.html#top"
  tests/__fixtures__/sketch/made-up.json <picture> --demo "click=<column 42.75, row 35.5>"` —
  shows it under the list of categories and its sentence, a hairline over each of the two
  rows: a round swatch in teal, beside "teal";
  no Block button in the toolbar, and Select the one tool in the ink there. With
  `"click=#swatch"` after it the eleven colours under the swatch, a panel that floats, in two
  rows of six and five, teal marked with a ring; with
  `"click=#swatch-palette [data-colour='2']"` after
  that the bath in orange and the swatch too, the colours shut, and Undo to be had. With
  `"click=#colours-open" "click=#colours [aria-label='blue']"` in the place of those two:
  `#colour` blue with its ring in the toolbar, Select no longer in the ink, and the bath in teal
  as it was. With a copy of `tests/__fixtures__/sketch/every-part.json` whose `colours` holds
  twelve, and `"click=#colours-open"`: the menu under the round button and its arrow — the
  eleven in two rows, red ringed, the owner's colours a row each with its name and a `×`,
  scrolled after eight, and "Add a colour"; and with `key=s "click=text=Level 815 m"
  click=486,310 click=#swatch`, the cellar selected: the swatch in `#3a7bd5`, "Cellar "blue""
  beside it, and its menu with the eleven and the twelve, the cellar's ringed (T-039.3). And
  `"index.html#side"` with no step:
  the Block group is the colours alone, and no paper says "house today" — it stood at
  column 23, from above in row 16, and in a slice a metre over the ground.
- A top that slopes is a plane said on the paper, and not from its box (`tools/sketch/blocks.js`). So a box
  that is cut keeps its plane with no code: every piece has the field — one and the same
  object, until the sketch is next read — and reads its own two ends off it. A piece that the
  plane lies wholly under would read level, and stand over the slope as a box that nobody drew:
  a cut lays no such piece (`blocks.remains`, asked by `pieces` of `tools/sketch/strokes.js`, for `erase` and
  for `merge`), so no box stands over a slope beside a notch that was erased into it, and a box
  of which no piece is left is gone — but a box that its plane lay wholly under already, from a
  file or made shorter, reads level as ever, and is cut as the box it shows. A box that
  is moved, copied or lifted with its level takes the plane along (`carried`), and so does its
  top edge. A box that is made longer keeps the plane where it is, and falls on along it, past
  where it was pulled to; made longer at its higher end, it has its own top there.
- The pull is hidden behind a key: the pad says it in the title of Select and, in a standing
  view, of every block that is selected. It is pulled at a top corner of the box, its outer
  size — also at the lower end, where that corner lies over the paper: what is selected has
  its heavier edge round the box, and there the corners are. Where top corners of two blocks
  meet, Select has the one that lies on top, as ever. Pulled, the other end always lies at
  the box's top: a top of a piece that lay under its box's top is said anew from the piece.
- **A size is set from above** (ST-034, ST-035, `tools/sketch/stretch.js`). In a slice an object shows its
  length or its depth, by the way it lies, and stands on a floor that the drag would move: its
  edges there move it, as every object is moved, and so do Shift and every other zone. From
  above only an end along its length where its kind takes a `long`, a long side where it takes
  a `deep`, and a corner of the two sizes it: the middle, an edge its kind takes nothing for and
  any kind without a row in `shapes.TAKES` are moved. A staircase takes a `deep` and a `long`
  (ST-037), so its side widens it, and its end lengthens it, and it keeps that length: dragged
  back to 4.5 m it still says `long`, for one that says none is as long as its flight.
  A thin object is one cell deep: from its end within reach it is on its north or south edge
  too, so `blocks.grab` names a corner, `ne` or `sw`, and the corner counts as the end it lies
  at even where its kind takes a depth — so an end in reach always lengthens it; on one a cell
  long, the corner counts as the side. `'move'` itself holds an `e`, and is never an end.
  Dragged back to its kind's own size it writes no `long` or `deep`, and the sketch is the one
  it was to the byte; a size that a hand wrote at the kind's own stays through a move, which
  sets no size. Past a range the outline that the paper shows while the pointer is down goes
  on with the pointer (`sketch.moved`, which knows no kind); let go, the object is at the end
  of its range, its far side where it was. Let go, the line under the paper (`#status`) says
  the object at the pointer as the stroke left it — its new size, as the panel beside the paper
  does — before the pointer moves again: `page.js` tells it after the stroke is applied, never
  before, so a box reshaped and a thing moved say their size as they now are too (T-000.26).
- **A height is typed** (ST-035, T-035.8, `tools/sketch/object-high.js`), never dragged: from above an
  object shows no height to drag, and in a slice its top edge moves it, as every edge there
  does (above). The field beside the paper sets it, in 5 cm, for the kinds whose row of
  `shapes.TAKES` has a `high`. A hob or a sink on a counter whose height was typed still sits
  at 0.9 m: they do not follow it. A staircase's length follows its height — its flight is
  worked out from it — so a staircase typed to 2.5 m is 4 m long on every plane at once, and
  may then reach over what lies at its end. The field takes every key while it has the focus,
  and gives it back at Enter: an R or a Delete typed there is a figure's, never the object's.
- The sizes the pad says of a block in words are its box's, the outer size, as before a top
  could slope: how far it reaches and how high, beside the paper, and the face of the box under
  the pointer or of a stroke, in the status line. What it holds and what it covers are not: its
  volume is the sloping one's (`sketch.stats`), and the areas under the layers say what the
  paper fills of each colour (`blocks.covers`) — along a slope the box under its top, and
  looked at along a slope the box up to its higher end, which is more than a slice cuts.
- To see a top pulled: `pnpm sketch:look "index.html#side" tests/__fixtures__/sketch/made-up.json
  <picture> --demo "sdrag=<column 30, row 12>,<column 30, row 16>"` — the uphill top corner of
  the night rooms, four rows down — and with `"key=1"` after it the arrow from above,
  with `"key=4"` the line across it in the front view, with `"key=Control+z"` the box again.
  With no step at all, that file shows two tops that slope as they are drawn: the porch's, a
  straight line falling down the plot, and the bath's, looked at along its slope, with the
  line of its lower end across it.
- Nothing that stands in a room is shortened by its roof (`docs/sketch/scene.md`). A flight of
  stairs is a storey high, 3 m, whatever the block it stands in: in a stair room drawn only as
  high, with its top pulled down over the flight, the upper steps stand in the roof and come
  out on top of it in 3D. A stairwell under a sloping roof is drawn a storey higher at the
  head of its flight, and its top pulled down from there.
- A figure is asked for, never copied: a door's `size` and a window's `size` and `lift` in
  `shapes.KINDS` are read anew each time, from the sketch that the pad holds. The list of kinds,
  which was written once as the page loaded, is no more: the gallery says every size anew at
  every `show` (`tools/sketch/gallery.js`) — at every `refresh` of the page, so after a figure typed in
  another window, a file opened, an Undo — and writes a tile only where it says another. A
  tile's picture is drawn once, as the page loads: from above a door and a window are as
  large whatever the figures say.
- A key pressed anywhere in the page is a tool's or a view's — `tools/sketch/page.js` and `tools/sketch/views.js` listen
  on the document — unless it is typed into a field: both ask `views.typing` first, and there
  every key is the field's, Ctrl+Z too. So the height gives the focus back
  on `change`: with the arrow keys, at the first step. It is the one field of `tools/sketch/page.js` that
  does (T-029.4): the list of kinds went, and a tile of the gallery is a button and no
  field — a key pressed while one has the focus is a tool's or a view's, but Enter and the
  space bar, which press it again. `tools/sketch/kept.js` still keeps its window's keys.
- **A click on a colour of the toolbar is a tool, and no paint** (T-029.3). It takes Block
  in that colour, whatever tool was on, and what is selected stays selected and as it was:
  a block is painted by its swatch, right of the paper. B takes Block in the colour picked
  last — red, until one is picked — and so does a height typed or stepped into the field:
  at the first figure that is a height, so "4.5" takes Block at the 4, and whoever wanted to
  stay with Select presses S again. With another tool no colour shows pressed, and **nothing
  then shows the colour that a line or a loose label is drawn in**: it is the one picked
  last, seen again once Block is taken. Nothing shows the colour of the selected block in
  the toolbar either: the swatch does.
- The swatch shows the colour of **the box that is selected**, and a pick paints **the whole
  block**. The pad's own tools leave a block in one colour — Merge gives it the colour of
  its first, and a pick paints every box — so the two differ only in a sketch that was
  written by hand: of a block whose boxes differ in colour, the swatch is the colour of the
  box that was clicked, and a pick of that very colour is a step all the same, which paints
  the others. A colour the pad has not — a place the list does not have, in such a sketch —
  shows as ink, as the paper draws
  it; a pick of ink then writes the place of ink, a step that changes nothing to the eye.
  When the colours open, the first of them, ink, has the focus, and not the block's own:
  that is `views.menu`'s way with every menu.
- `tools/sketch/swatch.js` shuts its own menu where nothing is selected any more while it is open —
  another window changed the sketch — or the keys would stay the menu's on a page that
  shows none. It shuts it by the `shut` that `views.menu` returned (T-000.24), which shuts
  the menu where it is open and leaves it be where it is shut — before, a script had no way
  to, and the swatch clicked its own button, and only where the part showed, for a click on
  the button of a shut menu opens it. Tried without shutting it: the row goes, the menu stays
  open with nothing to see, B takes no tool and 2 goes to no view, until an Escape.
- What a browser does with the keys of the swatch's colours, tried in the tests' browser
  (T-029.3): a click, Enter or the space bar on the swatch opens them, the first — ink —
  with the focus; Tab and Shift+Tab walk them, and no arrow, Home, End or letter does
  anything; Enter or the space bar on a colour picks it, and the focus is the page's;
  Escape shuts them and gives the swatch the focus, where B is the page's again, and a
  second Escape leaves nothing selected. Shift+Tab from the first colour goes to the swatch
  with the colours open still, and once more to the list of categories, which shuts them —
  and there a letter picks a category (above). **Tab from the last colour goes on to the
  list of the block's section** (T-032.4), whose row follows the swatch's and shows whenever
  the swatch does: the focus is gone to another control, so the colours shut, and the keys
  are that list's. Before, the swatch's row was the last thing of the page that takes the
  focus, and the colours stayed open, with the keys theirs, until a Tab more came round to
  File. **The colours shut where the focus goes on, in the page or out of it**, whatever the
  order of the page (T-000.24): out of it, the window's `blur` shuts the menu that is open —
  heard on the window, for the part's `focusout` would come at a click on a word of the menu
  too. `tools/sketch/views-menu.check.js` holds that in Node; no browser test tried it.
- **The gallery takes the place of what is selected, and what is selected stays selected
  behind it** (T-029.4). While Object is the tool, `#selected` is hidden whole — the pad's
  words, the list of categories, the swatch, the line that says that nothing is selected —
  and the gallery shows where it stood; the paper still shows what is selected, by its
  heavier edge and its label. Tried in the tests' browser, with a block selected and O
  pressed: **C steps what the block counts as, unseen** — one step, which Undo takes back,
  and after an Undo nothing is selected, as ever; K does nothing, for the list does not
  show; R turns the object about to be set down, and nothing of what is selected; Escape
  leaves nothing selected; a click on the paper sets an object down and selects nothing;
  and with S, or any other tool, what is selected shows again. `tools/sketch/gallery.js` hides
  `#selected` itself, by `hidden`: a script that puts a part into the right side puts it
  into `#selected`, as `tools/sketch/category-list.js` and `tools/sketch/swatch.js` do, or it stands beside the
  gallery.
- **A start is no kind** (ST-035, T-035.6, `tools/sketch/object-groups.js`). "Single bed", "Double
  bed", "King-size bed" and "Wide staircase, one storey" are named starting sizes, keys of
  `shapes.STARTS` and never of `KINDS`: a tile of one hands the page its key, and
  `sketch.placed` writes **the start's kind with its sizes** — a single bed is
  `{"kind":"bed",…,"deep":1}` from its first step, a king-size bed a `bed` with no `deep`, the
  wide staircase a `stairs` with `"deep":1.5`. No file holds a start's key, and an object never
  remembers which tile set it down: a single bed dragged to 2 m says no `deep`, and is then a
  king-size bed in all but the word. A `widestairs` stays a kind of its own (rule 4 of the
  story) — read, drawn and built as before, in its group's `kinds` — and has no tile: the
  wide staircase's tile stands in its place. So a browser that kept "King-size bed" or "Wide
  staircase" picked before, `bed` or `widestairs`, **picks the person** as the page opens:
  `tools/sketch/page.js` keeps a picked key from the browser only where it is one of the gallery's tiles,
  until a tile is picked again. A check that loads `tools/sketch/strokes.js` without
  `tools/sketch/object-groups.js` has no `STARTS`, and every key it hands `placed` is the kind, as before.
- A picture is fitted to its tile: the longer of the kind's two sizes on the floor fills
  the square, so **a chair shows as large as a tree**, and a hob as a bed. How large a thing
  is, the words under its name say. The pictures of the tiles are drawn once, as the page
  loads, with as many pixels as the screen then has for one of the page's: a zoom of the
  browser stretches them until the page loads anew — not tried. The picture on the button
  is drawn at every `refresh`. A picture has no ground of its own: `tools/sketch/pad.css` lays the
  paper's white under it, so that its ink shows where the button has the ink, and where a
  picked tile lies in its band of grey.
- The button of the Objects group is as wide for every kind, 104 pixels, so that
  the toolbar does not move when another is picked: a square like the others and wider, with
  the object's picture where they have a drawing, its name under it in two lines at the
  most, and after the name a small sign that it opens something (T-029.6). The longest name,
  "Spiral staircase, one storey", has room in its two lines; a name that had none would be
  cut short there, with three dots. The picture is drawn 18 pixels square, and stands on a
  white tile of 20, which shows where the button has the ink. The button is read out by its
  object,
  "Person" or "Sofa", in the group "Objects": it has no label of its own, its picture is
  hidden from a screen reader, and its title says what it does, and O. A tile is read out
  by its name and its size, "Sofa 2 by 1 m, 0.8 m high". While Object is the tool two things
  say that they are pressed: the button, as the tool, and the tile that is picked, in the
  gallery — the toolbar itself still has one.
- The gallery scrolls with the right side, which is what scrolls there, and **opens at its
  top, whatever is picked**: with a car picked, the last tile, a window 900 pixels high
  shows the car on the button and not in the gallery, until one scrolls — the tiles under
  their six headings are twice as high as the side and more: the side is 791 pixels. A heading stays
  in sight over its
  group's tiles: `position: sticky`, in a part of its own for each group, so that the next
  heading pushes it out. It sticks 8 pixels above the side's content, `top: -8px` — the
  side's own padding (`tools/sketch/frame.css`): the browser holds a sticky part inside that padding,
  and with `top: 0` the tiles would show in a strip above the heading. Whoever changes the
  padding of a side changes that figure with it.
- To see the gallery: `pnpm sketch:look "index.html#top"
  tests/__fixtures__/sketch/made-up.json <picture> --demo "key=o"` — right of the paper
  the gallery, "Doors, windows and stairs" first, each kind a small drawing beside its name
  and its size, and in the toolbar one button over "Objects", in the ink, with a person on
  it; with `"click=[data-kind=tree]"` after it the tree's tile picked, in a band of the grey
  with a mark of the ink at its left edge — the look scrolls
  the side until the tile shows — and the button a tree; with `"key=s"` after that the
  gallery gone, "Nothing is selected." in its place, and the paper where it was. Every look
  that presses O shows the gallery right of the paper from now on: the two people set down
  in a cut (above), and the object set down on a sketch that the pad cannot read (below).
- **While a menu is open, every key is the menu's** (T-029.2): `views.typing` says yes of
  each, whatever it was pressed on — the page, a button, an entry — so the four scripts that
  ask it before they read a key take none, and none of them knows of a menu: `tools/sketch/page.js`, the
  switch of `tools/sketch/views.js`, `tools/sketch/category-list.js`, and on the 3D page `tools/sketch/view3d/panel.js`. No tool, no
  view, no level, no undo, no K. A script that listens for keys and does not ask is not held
  off: whoever adds a listener asks `views.typing` first, as ever. The browser keeps its own
  keys: Tab goes from entry to entry and out of the menu, which then shuts; Enter and the
  space bar press what has the focus; no arrow walks a menu, and no letter picks from it.
  **Escape is the menu's, and ends at the switch's listener** (`stopImmediatePropagation`):
  it shuts the menu and gives its button the focus. Were the key to go on, `tools/sketch/page.js` — which
  hears a key after `tools/sketch/views.js` does, by the order of the scripts — would find the menu shut,
  take the Escape for its own, and leave nothing selected. A listener that hears a key before
  `tools/sketch/views.js` does finds the menu open still, and is told that the key is not its own. After
  Escape File has the focus, and the space bar or Enter opens it again, as they press any
  button. After a pick the entry that had the focus is hidden with its menu, and the focus is
  the page's: the next key is a tool's or a view's again. The colours of a block's swatch
  are the pad's second menu (T-029.3), made by `tools/sketch/swatch.js` through `views.menu`: open, they
  have the keys the same way, and `tools/sketch/swatch.js` itself listens for no key.
- **A right press opens its menu on `pointerdown`, and keeps its `mousedown` from its
  default** (T-037.5): the browser hands the focus on at the mouse's press, after the pointer's
  — to the body, for the paper takes none — and would take it from the menu's first entry,
  which `views.popup` had just given it. So `tools/sketch/right-menu.js` prevents the right
  button's `mousedown` on the paper; the page's `contextmenu`, swallowed as before, comes later
  and opens nothing. The menu itself rarely reaches the window's right edge from the paper —
  the side right of it is wider than the menu — but the list of an entry does: Category ▸,
  in a window of 640 pixels, opens left of the menu, and, longer than many a window, scrolls.
- A menu lies under its button and over what lies below that, and what lies below File is
  not the paper: File stands at the page's left edge. The open menu is a panel that floats
  (T-029.6), 156 pixels wide and 225 high on the pad's page — 195, until "Open plot" was its
  sixth entry (T-030.4), and an entry higher, 30 pixels, on a pad with plots, where "New
  plot" is its seventh (T-031.7) — 4 pixels under File's square.
  In a window of 1440 pixels, and of 1280, the pad's toolbar is one line, and the menu lies
  under it over the head of the left side alone: its heading, "New level", "Delete" and the
  first three levels, or the slice's words, its first button, the left of its slider and the
  first lines of the hint. Where the toolbar
  has two lines — from 1264 pixels down, from above, since the switch has seven views — it
  also lies over the first thing of
  the second line, which begins under File: the plot's name, and in a window of 1024 the
  button of the Objects group. Nothing is hidden while the menu is shut, and the
  toolbar is as high and the paper where it lay with the menu open. To see it: `pnpm
  sketch:look "index.html#top"
  tests/__fixtures__/sketch/made-up.json <picture> --demo "click=#file-menu"`.
- The class `menu` lays a part out from the foot and the left edge of the nearest thing
  around it that is positioned: a group of the toolbar is (`position: relative`, for its
  word). A menu that is made elsewhere — beside the paper, say — wants the row of its button
  positioned so, or it hangs from the corner of whatever is: `#swatch-row` is, by a rule of
  the pad's own stylesheet, which also lays the colours of `#swatch-palette` in rows of six —
  the eleven in two, six and five, and the owner's after them, as the toolbar's menu has them,
  in a panel 174 pixels wide — where a menu's entries stand one under the other. The toolbar's
  `#colours` hangs from `#palette`, which `tools/sketch/colours.css` positions so, for it is a
  group inside a group: from the Block group it would hang from that group's left edge. `sketch-colour.spec.ts` holds that the colours lie under the
  swatch and inside the right side. And `views.menu` asks two
  things of a page: that the entries are `button`s inside the part that opens, and that the
  button which opens it stands outside that part.
- **A group of the toolbar is a grid of two rows** (T-029.6), 54 pixels high, and a thing in
  it takes both rows unless its page says otherwise: so a script that fills a group appends
  to it as it did, and a new button there is a square at once. A lesser control says its row
  — `#undo` and `#larger` the first, `#redo` and `#smaller` the second — and the grid packs
  the two into one column (`dense`). The group's name stands under its box, by the
  stylesheet, in a margin of 14 pixels, and the thin line that closes the group in the gap
  after it: a group's own height, as a browser says it, is the 54 of its controls. The 3D
  page's `#ways` and `#stands` are groups and tracks at once: the grey is the group's own
  ground, which is why the name lies outside the box.
- **A drawing is a rule of `tools/sketch/icons.css`**: for a control `X`, `X::before { content: ''; --icon:
  url("data:image/svg+xml,<svg …>") }` — the rule at the file's head draws every `::before`
  of a button of the toolbar and of a link of the switch that has a content, 20 pixels each
  way, as a mask over the colour of the words. Without the content there is no drawing, and
  no empty square either. A picture is written with `'` for its quotes and with no `#` in it
  — a `#` ends a data address — so its lines say `black`, which is no colour that shows: a
  mask is read by how much it covers. **Say `button[data-way=…]`, never `[data-way=…]`
  alone**: the 3D page says its way on the body too, `data-way`, and a rule of the bare mark
  finds the body — seen, in the browser test, as a control named by all the words of the
  page.
- **What the stylesheets do not say, because no mark says it** (T-029.6): **a stand has the
  look for chosen only while the view is at it** — `tools/sketch/view3d/panel.js` marks the way and the level
  with `aria-pressed`, and a stand by `shows.stood` as `tools/sketch/view3d/main.js` says (T-000.23): the
  one clicked, Front as a page with no kept look opens, and none once a hand moves the view, for
  a stand is a place to look from that the next drag leaves, and the mark with it. A colour's ground is the script's, written on the
  button itself: the stylesheet can lay no grey under the pointer there, so a colour under
  the pointer has a halo, and the one drawn in a ring. The links of the switch carry no word
  of their own for a rule: their drawings find them by the end of their address,
  `a[href$='#top']`, `a[href$='3d.html']`. And the pressed tile of the gallery says
  `aria-pressed`, as the tool does: `tools/sketch/pad.css` takes the ink off it again, for a band.
- **The two words of a view stand one under the other** by a blank that is wider than the
  square, `word-spacing`: "Top view" would have room on one line, and "Front view" not. The
  name of a stand breaks where it has a hyphen, "North-west", if it is too long. A word that
  cannot break and is too long — "Materials" has a wider square for that — runs over the
  edges of its square, where a font runs wider than the tests' browser's on Windows.
- **The plot's name takes what is left of the toolbar's line**, 8em at the least — 104 pixels,
  where it took 130 until the switch had seven views (T-032.5) — and
  breaks into as many as three lines there before it takes a line of the toolbar for
  itself: so the toolbar is one line down to 1265 pixels whatever the plot is called, as
  measured in the tests' browser — and the 3D page's down to 1263, the Info page's to 558. A
  name that needs more than three lines in what is left is cut after the third, with
  nothing to say so — tried with a name of 97 letters, which is whole in a window of 1440
  and loses its end, the area, in one of 1280.
- **The row of the level drawn on has the ink by `:has()`**, which every browser of 2024 on
  knows; one that does not shows the level's name alone in the ink, and the rest of the row
  as every other row. In that row the keyboard's ring is white, for an ink ring on the ink
  shows nothing.
- **Tab reaches the minus before the plus**, though the plus stands over it: the two are in
  the page in that order, and the stylesheet alone puts the larger on top.
- **The alarm's button keeps a white ground**: `tools/sketch/files.js` gives it ink for its words, in a
  band that is red, so it is the one button with a ground of its own.
- The list of categories is such a field, and one key is its own on the page: **K**, heard
  by a third listener on the document, `tools/sketch/category-list.js`'s, which asks `views.typing`
  first. With a block selected it gives the list the focus and opens it (`showPicker`) —
  and ends the key there: a K that goes on is typed into the list, which picks a Kitchen by
  its first letter. Tried in the tests' browser: an open list takes its keys itself — the
  arrows walk it, Enter and Tab pick, and of Escape the page hears no more than the key
  come up. So the list gives the focus back on `change`, and on Escape both as the key goes
  down, where the list is shut, and as it comes up, where it was open. What is left: a list
  that is opened with the pointer and shut by a second click on it keeps the focus with
  nothing picked, and so does one in a browser that lets no script open it — there the next
  letter picks by its first letter, a B a Bedroom, and an arrow key the next entry: one
  pick, the focus is given back, and Undo takes it back.
- `tools/sketch/kept-ways.js` states the rule for a name of `tools/sketch/store/rules.js`,
  `keptName`, a second time — the page loads no module — and `tools/sketch/kept.check.js` fails
  where the two differ on a name it tries: change both, and the plots' own note,
  `design/plots/CLAUDE.md`, with them. A rule that is loosened later takes more names; one that
  is tightened leaves files in the folder that the pad no longer lists — **and plots that it no
  longer opens**: a plot's folder is named by the same rule (`plotName`), and its name is the
  plot's key in every browser.
- **Keep writes where the owner's folder is** (T-040.5): into the `sketches/` of the folder that
  was picked through Open plot — a worktree's `design/plots/<id>/` where that is the one
  picked — through the browser, and nothing through the server, which keeps nothing. The window
  says where before anything is kept, "Sketches of this plot are kept in the folder <name>." or
  "… in this browser only — save a file to keep a copy.", and after, the file it wrote,
  `sketches/<name>.json`. The example, a plot that came as its file, and a folder that may not
  be written to keep in the browser's store, by the plot's id.
- **A folder's leave asked again**: a browser may forget, between visits, that a folder may be
  written to and read. Keep and Open kept then ask again, and asking wants a click — Keep's or
  Open kept's, which they are: a page that asks of itself is refused. Refused, Keep keeps the
  sketch in the browser and says so — "The folder <name> may not be written to, so this sketch
  is kept in this browser only — save a file to keep a copy." — and Open kept lists the
  browser's alone, saying "The folder <name> may not be read, …". Nothing is lost: what lies in
  the folder is there at the next leave, and what the browser kept is listed after it, "in this
  browser".
- **The browser's no to keeping what it holds** is said with a plot's first sketch kept in the
  browser — "This browser may clear it when it is short of room." — and not again: `persist()`
  is asked once a plot, and a browser of the tests always answers no. A sketch in the browser
  alone is saved with "Save file" to outlast a browser that clears.
- The time a kept sketch was kept is the time its file was written, as the disk has it: a
  clone or a checkout writes every file anew, and then the name is what says when. Of two files
  of one moment the later name is listed first.
- A file put into a plot's `sketches/` by hand is listed if its name is one the rule takes, and
  counted — "Not listed: …" — if it is not: a second download from a browser, `plan (1).json`,
  is such a name. One that is no sketch is listed, and refused in words when it is opened.
- **A folder named `example` is no plot** (`plotName`, and `folderId` of
  `tools/sketch/store/rules.js`): Open plot refuses it, and the example keeps in the browser.
  `home` keeps the first key, the key of today. Two names are not free for a plot of one's own.
- A browser that does not say who asks — it sends no `Sec-Fetch-Site`, as a Safari before 16.4
  — draws on either pad, for the server gives it the pad's files and the page its plot
  (T-040.4), and keeps and opens kept, which ask no server (T-040.5), but has no "New plot": the
  server refuses it what it refuses another site's page. `/site.js` in the address bar is a 404 — no file has that name.
- `tools/sketch/kept.check.js` stands at 294 of the linter's 300 lines (T-040.5) — what is checked
  next of Keep wants a check of its own — and `tools/sketch/routes.check.js` at 299
  since it holds the stylesheet: what is
  checked next of the server wants a `*.check.js` of its own. `tools/sketch/look.js` stands at 299 too,
  since it takes a width: what a look learns next wants a line made free first. So do
  `tools/sketch/unread.check.js`, full at
  300, `tools/sketch/check-slices.js`, at 298, `tools/sketch/figures.check.js`, full at 300, and — of a top that slopes —
  `tools/sketch/slopes.check.js`, at 299, `tools/sketch/slopes-cut.check.js`, at 292, and `tools/sketch/check-blocks.js`, at 299
  since its three lines on the text of the made-up house, which had no room to say that
  house's cut, went to `tools/sketch/view3d/made-up-cut.check.js`, for what is checked next of
  theirs: what `tools/sketch/check-blocks.js` had no line for of the made-up house, `tools/sketch/view3d/made-up.check.js`
  holds, itself at 299 — with the house's lawn and its cut in it, for which it was made
  shorter line by line, and no assertion went; and what it had none for of ground,
  `tools/sketch/counts.check.js`, at 299 —
  what is checked next of what a block counts as wants a check of its own, as the categories
  have theirs: `tools/sketch/categories.check.js`, at 283, and `tools/sketch/categories-pad.check.js`, at 298 — and
  the list beside the paper its own, `tools/sketch/category-list.check.js`, at 296, and the swatch its
  own, `tools/sketch/swatch.check.js`, at 269. A version
  of the sketch file that comes next finds the two full ones full: a line that states the
  version is changed in place there, and a list that grows by a word may break in two. Of the
  ground itself,
  `tools/sketch/earth.check.js` stands at 290, `tools/sketch/earth-paper.check.js` at 275 and `tools/sketch/earth-shown.check.js` at
  288; of a cut, `tools/sketch/earth-cut.check.js` at 299 and `tools/sketch/earth-cut-shown.check.js` at 294, since a
  slice asks its pen a thing fewer — what is
  checked next of a cut wants a check of its own; and the browser tests of the ground,
  `tests/e2e/sketch-ground.spec.ts`, at 285, and
  `tests/e2e/sketch-3d-ground.spec.ts`, at 299, and of the made-up house's cut,
  `tests/e2e/sketch-3d-cut.spec.ts`, at 299. `tests/e2e/sketch-file.spec.ts` stands at 288,
  since each version before is a line of its list there (T-032.1); it picks in the gallery,
  and O and what the tiles say are one helper there, `gallery`.
  The list's browser test, `tests/e2e/sketch-category.spec.ts`, stands at 298, the frame's,
  `tests/e2e/sketch-frame.spec.ts`, at 295 — since the 3D page's levels stand alone in their
  side, its table is shorter (T-029.5) — the swatch's,
  `tests/e2e/sketch-colour.spec.ts`, at 299, and the look's, `tests/e2e/sketch-look.spec.ts`,
  at 299 too (T-029.6): what is tested next of a file, of the frame, of a colour or of the
  look wants a line made free first, or a test of its own. The gallery has its own:
  `tools/sketch/gallery.check.js` — cut in two to make room for kinds, the text of the page and of
  `tools/sketch/page.js` now `tools/sketch/gallery-text.check.js`'s (T-034.1) — and `tests/e2e/sketch-gallery.spec.ts`, at 281 (T-029.4).
  Since File is
  a menu (T-029.2): `tools/sketch/views.check.js` stands at 299, with the seventh view — what is checked next of a menu, or of
  the rule for a key, wants a check of its own; `tests/e2e/sketch-menu.spec.ts` at 299,
  `tests/e2e/sketch-slope.spec.ts` at 299, and `tests/e2e/sketch-kept.spec.ts` stood full, at
  300, until T-040.5 made it 225: there an entry of File is pressed through one helper of one line, `pick`, File first
  and then the entry. The formatter breaks a chain of calls that ends in `.then(…)` over
  five lines: a helper that is to stay one line awaits the first click and gives the second,
  with a comma between the two.
  Since a plot is a file (T-030.1): `tools/sketch/routes.js` stands at 254 lines, with the rules of a plot
  after the rules that were there; `tools/sketch/plot-file.js` at 247; `tools/sketch/plot-routes.check.js` at 192, with
  room; and **`tools/sketch/plot-file.check.js` is full, at 299** — what is checked next of a plot's file
  wants a check of its own; the script that a page loaded of a plot, `scriptOf`, which
  `tools/sketch/plot-routes.check.js` held, went with T-040.4. Since the pad goes by plots (T-030.3): `tools/sketch/serve.js`
  stands at 250 lines, where it had 173, and `tools/sketch/plots.js` at 101 (both cut down, and
  `plots.js` gone, with T-040.5: `serve.js` at 131, `routes.js` at 123); `tools/sketch/routes.js` at 254 still,
  with `KEPT_IN` gone and `route` a line longer; `tools/sketch/kept.js` at 261 and
  `tools/sketch/paper.js` at 186; `tools/sketch/kept.check.js` and `tools/sketch/routes.check.js` were changed in place, and stand
  at 299 still; `tools/sketch/view3d/rules.check.js` at 211. The two checks of the pad by plot stand
  at 230, `tools/sketch/plots-served.check.js` — which holds the guard of `/kept/` on both pads
  since T-040.5 — and at 268, `tools/sketch/plot-keys.check.js`, what `tools/sketch/kept.js`
  asked by plot gone from it with T-040.5; `tools/sketch/plots.check.js` went with
  `tools/sketch/plots.js`: **what is checked next of the server goes to
  `tools/sketch/plots-served.check.js`**, and what is checked next of what a browser keeps by
  plot to a check of its own. Each starts its pad and asks it with a few lines of its own, as `tools/sketch/kept.check.js`
  and `tools/sketch/routes.check.js` do: a check is one file, and shares no helper. Since Open plot
  (T-030.4): `tools/sketch/open-plot.js` stands at 221 lines, where it had 169, and 187 with the
  entry "New plot" (T-031.7); `tools/sketch/kept.js` at 261
  still, with its one line changed; `tools/sketch/index.html` at 205 — with the two scripts of
  `tools/sketch/sections/` (T-032.3, T-032.4) — and `tools/sketch/3d.html` at 267, counted by
  hand; `tools/sketch/open-plot.check.js` was full, at 299, was at 277 after T-040.3, which
  asks no server, and stands at 290; and
  the two browser tests of the plots: `tests/e2e/sketch-plots.spec.ts` (T-040.3) at 255 and
  `tests/e2e/sketch-plots-last.spec.ts` at 205 — neither starts a pad of its own any more, both
  run on the made-up pad, and a plot's folder is `tests/e2e/sketch-folder.ts`'s (T-040.3).
  `tests/e2e/sketch-frame.spec.ts` and `tests/e2e/sketch-menu.spec.ts` gained the entry in
  place, and stand at 295 and 299 still. Two more ways in which the formatter makes a check
  longer: where a call has two arguments or more and one of them is a call that is handed a
  function — `assert.deepEqual(list.map((one) => …), [1, 2])` — it lays every argument on a
  line of its own, so the list is worked out in the line before; and a list whose parts are
  all lists of two or more, `[[0, 0], [0, 2]]`, it lays a part a line, so a check makes its
  corners of one flat list of numbers. Since the server is a plain file server (T-041.4): `tools/sketch/routes.js`
  stands at 116 lines and `tools/sketch/serve.js` at 75 — `tools/sketch/new-plot/made.js`, the
  module that made a plot for the server, went with its three checks; **`tools/sketch/check.js`
  stands at 290**, its runner and that runner's clock in `tools/sketch/check-each.js`
  (T-000.21), at 49: what the gate learns next is `tools/sketch/offline.js`'s, at 51. The rules
  of a new plot are modules of their own: `tools/sketch/swisstopo/hosts.js` at 289, with the
  three addresses of a parcel (T-043.1) — what is asked next wants a module of its own —
  `tools/sketch/new-plot/request.js` at 189; their checks at 229, `hosts.check.js`, 145,
  `hosts-parcel.check.js`, 252, `named.check.js`, 157, `served.check.js`, 249,
  `request.check.js`, 169, `plot-parcel.check.js`, and 146, `tools/sketch/offline.check.js`,
  each with room. **Of the three folders, as their own notes
  have it** (ST-031): in `tools/sketch/swisstopo/` nine files stand at 295 to 299 —
  `made-up-tile.js`, its check, `stand-in.check.js`, `tiff.check.js`, `door.check.js`,
  `catalogue.check.js`, `ground-parts.check.js`, `door-parts.check.js` and
  `ground-refused.check.js`; in `tools/sketch/new-plot/`, `plot.check.js` stands at 299 — what
  is checked next of the door, of the ground or of a plot wants a check of its own; in
  `tools/sketch/map/`, `marks.js` stands at 172 and `marking.js` at 170, cut in two by T-043.4,
  and `find.check.js` is full, at 299 — and of
  the browser tests of the map and the marking, the module that they share,
  `tests/e2e/sketch-own-pad.ts`, is full, at 298, and `sketch-map-find.spec.ts` and
  `sketch-new-plot.spec.ts` stand at 296 and 299, `sketch-map.spec.ts` at 242 since its layers'
  case moved into `sketch-map-layers.spec.ts` (T-044.12; `docs/sketch/map.md`). **The checks of a new plot were tried with the modules broken
  one thing at a time** (T-031.1), each of 345 breaks alone, on a copy of the pad outside the
  repository — 134 in `tools/sketch/swisstopo/hosts.js`, 140 in `tools/sketch/new-plot/request.js`, 29 in `tools/sketch/offline.js`,
  8 in the two lines of `tools/sketch/routes.js` and 34 in the eighteen of `tools/sketch/serve.js` that they then had: a comparison turned,
  a guard left out, two origins swapped, a sentence reworded, a limit one off — and a check
  failed each time; and so the rule of `named.check.js` itself, 44 breaks, by its own proof.
  Listing them showed five things: a guard that nothing could reach, which went; and four
  that the checks did not hold as they were first written — three blanks in a name, a type
  that is no text, a script in a folder `tools/sketch/map/` of another folder, and the four words that
  no file says, which the proof had taken from the rule's own list: each gained its case.
  The verifier then found a guard that was owed and could be reached — `mayAsk` took
  `http://127.0.0.1:null`, this machine with the word `null` for its port — and since the
  second attempt that guard stands, with the case that reaches it in `hosts.check.js`.
- **A pad that was started before T-041.4 is the server of before**: it read its rules as it
  started. It says where it makes plots and whom it asks, takes an order at `/new-plot/`, and,
  made up, answers `map/index.html` with 404 — an error on the console, and no "New plot". Stop
  it and start it again, as after any change to `tools/sketch/routes.js` or
  `tools/sketch/serve.js`. A script that waits for the pad by its lines waits for the one line
  that it says now, `The sketch pad: <origin> - Ctrl+C stops it.`
- **The map's page asks swisstopo where it is opened without a stand-in's `asks`** (T-041.4):
  the pad is told nothing of whom to ask any more, and a page told nobody, or a word that
  names no port, asks nobody. So a look or a test opens it with `?asks=<the stand-in's port>`,
  and the owner's own pad, `pnpm sketch`, asks swisstopo where a new plot is made
  (`docs/sketch/swisstopo.md`).
- The pad is a member of the workspace for its one dependency: after a pull that brings or
  changes it, run `pnpm install` — until then `/three/` answers 404, and the 3D page says that
  it did not load. Node reads the nearest `package.json`: the pad's says `module`, as the
  root's does, or `tools/sketch/serve.js`, `tools/sketch/look.js` and the checks would not load.
- The server gives a file only under a plain name: letters, digits, `-` and `_`, in parts with
  one dot between them, ending in `.html`, `.js` or `.css` in small letters — a stylesheet
  since the two pages share one (ST-029), and under `/three/` a script alone. A file named
  otherwise, a picture or a font, or a file two folders deep gets a 404 until `tools/sketch/routes.js` says
  otherwise, and `tools/sketch/routes.check.js` with it. The server says `nosniff`: a stylesheet that came
  under another type, no browser would take.
- A pad that was started before `tools/sketch/frame.css` came knows no stylesheet: its server read the
  rule as it started, answers 404 for that file, for `tools/sketch/pad.css` and for `tools/sketch/icons.css`, and the
  page stands there without its frame, without its own rules and without a drawing —
  its parts one under the other, the levels over the paper, and every control working. Stop
  the pad and start it again with `pnpm sketch`, as after any change to `tools/sketch/routes.js` or
  `tools/sketch/serve.js`. On the 3D page the stage then has no height: its controls stand there, and no
  picture — looked at, with the stylesheet answered by 404. A pad that was started since
  gives a stylesheet that came later with no new start: it reads a file when it is asked
  for. And where `tools/sketch/icons.css` alone is not given, or a browser knows no mask, every control
  stands there with its word and no drawing — Undo, Redo and the two that zoom with their
  words too, in squares too small for them: the words are hidden by the stylesheet that
  draws, and by no other.
- With two sides the paper opens smaller than it did (ST-029): `tools/sketch/zoom.js` fits the plot into
  what they leave, and on the made-up plot that is 10 pixels a cell in a window of 1440, where
  it was 12, and 8 in the browser tests' window of 1280, where it was 10. The left side is 256
  pixels wide, not the 250 its card first gave it: a row of the levels — a name as "Level 817
  m", "drawn on" and the two arrows — needed 229 pixels of the side's 231 while each of the
  four was a button in a box, and at 250 the words "drawn on" broke in two. Up to 260 the
  paper opens at those 10 and 8 all the same. **Since the look of T-029.6 a row has room**:
  its name, the quiet word and the two arrows need 192 of the 231 pixels, and what stands on
  the level has a line of its own under them, the whole width. So a level at half a metre,
  "Level 814.5 m", and a left side that scrolls in a window on a desk, where a scroll bar
  takes 15 pixels, both fit — looked at with twelve levels, four of them at half metres, in a
  window 620 pixels high; the tests' browser and a look hide their scroll bars, which then
  take no room, so the scroll bar's 15 pixels are reckoned and not seen. A name that had no
  room would be cut short, with three dots. The right side is 260.
- 3D is no row of `paper.VIEWS`: it has no plane and no paper. `tools/sketch/views.js` holds it, and a page
  says that it is the 3D one on its switch, `data-view="3d"`. From there a link to one of the
  five names their page, `index.html#side`: the pad then stands at `/index.html`, the same
  address to the browser as `/`, with the same sketch.
- `tools/sketch/strokes.js`, `tools/sketch/slopes.js`, `tools/sketch/labels.js`, `tools/sketch/footer.js` and `tools/sketch/draw.js` read the plane once, as
  they load: the check loads `tools/sketch/strokes.js` three times, under three names, and `tools/sketch/slopes.check.js`
  all five for each view it draws in. `tools/sketch/slopes.js` wants `tools/sketch/sketch.js` and `tools/sketch/blocks.js` before it,
  and nothing of `tools/sketch/strokes.js`: `apply` asks for `sketch.pull` when a stroke is made, and where
  no `tools/sketch/slopes.js` was loaded — in the other checks — Select moves and resizes as it did.
- The paper of the plane `end` runs as the rows of the top view do — from the north-east side of
  the plot to the south-west one — so it is the back view's; the front view flips it. An object
  shows it its standing shape a quarter on (`shapes.draw`).
- A sketch with a kind the page does not know, or of a version it does not know — this pad's,
  to an older checkout's — is not read at all: the pad opens on an empty paper — or on the
  sketches of before, where the browser has them — and the alarm says that this browser holds
  a sketch that this pad cannot read, with a button that saves it as a file. The next change
  is no longer kept in its place: the text is set aside first (invariant 9). It is still not
  read, and nothing here turns it into a sketch that is. So every kind is a row of `KINDS` in
  `tools/sketch/shapes.js`, whichever file draws it — a file of shapes that fails to load must not make a
  sketch unreadable — and a kind is never renamed or taken away.
- A kind added to `KINDS` turns `tools/sketch/scene/furniture.check.js` red until `tools/sketch/scene/` gives it pieces
  — and `tools/sketch/gallery.check.js`, until it has its place in a group of `tools/sketch/object-groups.js` and its
  row in that check's table, typed in with its name and its size: the gallery shows no kind
  that stands in no group, so such a kind could be read, drawn and moved, and not set down.
  A seventh group is a row of `tools/sketch/object-groups.js`, and a line of the check.
- A text that was set aside stays in the browser, and its button in the alarm with it —
  `Save sketch 1 that was set aside`, a file `sketch-unread-1.json` — in every pad that opens
  there, also one that could read it: nothing in the pad takes a set-aside text away. The key
  is removed by hand, in the browser's own tools, once the file is saved. A pad that knows the
  kind reads that file with "Open file".
- What the alarm says of such a sketch is the page's, in `tools/sketch/files.js`, and not `sketch.trouble`:
  `tools/sketch/3d.html` loads `tools/sketch/sketch.js` too, and adds the pad's trouble to its own words for a sketch
  that cannot be read (`tools/sketch/view3d/read.js`). And `tools/sketch/page.js` writes the alarm's words anew with
  every refresh: what a script puts into `#alarm` is gone then, so `files.offer` is called
  right after, each time.
- To see the pad on a sketch that it cannot read: `pnpm sketch:look "index.html#top" <a made-up
  file with a kind of its own> <picture> --demo`, and with `"key=o" "click=<column 33, row
  29>"` after it — any place of the paper — an object set down: the first change.
- The things of a layer are in the order they lie over each other, not the order they were made
  in: boxes, then objects, then what is lifted. It is the order they are drawn in, and the one
  the pointer takes them in. A label is over them all.
- A line or a label of a slice shows wherever that slice runs: a note has no depth.
- Under the house that stands there today, the ground is the terrain model's guess — and no
  view says where that house stands any more (ST-029): the words "house today" went from
  the top view and from the slices, on every plot. A plot's file may still say the point they
  stood at, `house`, which no script reads: it is kept for the plot that has one — the
  owner's — and the pad changes no plot. `tools/sketch/demo-site.js` has no such point. The sizes
  in `tools/sketch/shapes.js` are common ones, nobody's measurements — and on the floor every kind but the
  window is whole cells, so that it fits the grid: a counter is 0.5 m deep here, a real one 0.6.
  `sketch.rect` lays such an object on whole cells, nearest to where it was put: an object of
  an older sketch shows up to a quarter of a metre from where it was drawn.
- A saved sketch is JSON on one line: inside the repository, `pnpm lint` would refuse its format
  — but under a `__fixtures__/` folder and in `design/plots/`, which the formatter leaves
  alone: the made-up sketches, and the kept ones with the plots they were kept on.
- To see Keep and Open kept, File is clicked first, which opens its menu: `pnpm sketch:look
  "index.html#top" tests/__fixtures__/sketch/made-up.json <picture> --demo "click=#file-menu"
  "click=#keep"`, and after it
  `"click=text=Keep under this name"` for what the window says of a sketch that was kept, then
  `"click=text=Close" "click=#file-menu" "click=#open-kept"` for the list. A step that clicks
  an entry while the menu is shut fails, after 15 seconds: the entry does not show. In that
  window a button is the new button (T-029.6): "Keep under this name", "Close" and a kept
  sketch's name are words, with the grey under the pointer and the ring of the keyboard, and
  the window itself keeps the look it had. On the made-up pad the window says a path in
  the system's temporary files. A look is told no folder of plots since T-041.4, which took
  `PLOTS` away: nothing is written into the fixtures.
- To see Open plot (T-030.4, T-040.3), File first, as for Keep: `pnpm sketch:look "index.html#top"
  tests/__fixtures__/sketch/made-up.json <picture> --demo "click=#file-menu"` shows the
  menu — Open file, Open kept, Open plot, Save file, Keep, the word Export, Picture (PNG) —
  and with `"click=#open-plot"` after it the window "Open a plot", with the example in it,
  "Made-up hillside plot", and small after it "the example, shows now", and under the list
  its two ways in. **A look of another plot is given its file** (T-040.4): `pnpm sketch:look
  "index.html#top" <a sketch> <picture> --plot=tests/__fixtures__/plots/terrace/plot.json` —
  the page is handed the file as "Open plot" is, holds it in the look's browser and shows it,
  its outline of five corners, its name in the toolbar, and the sketch under that plot's key.
  **A look opens on the example otherwise**, whatever was shown last: its browser is new each
  time, and has noted nothing.
- To see New plot (T-031.7): a look cannot, since T-040.4 — it starts the made-up pad, which
  has no "New plot", and with `--demo` the menu has its six entries. On a pad with plots the
  menu has seven, "New plot" the fourth, and a click on it goes to `/map/index.html`, "New plot -
  Sketch pad". **The map, the marks and the making a look cannot show** either: it refuses
  every request to another origin, a stand-in's too. They are seen in the pictures that the
  browser tests save — `pnpm e2e:sketch sketch-new-plot`, then `marked.png` and `made.png`
  under `test-results/` (`docs/sketch/map.md`) — or by hand, in a browser, on a pad that is
  told a stand-in.
- **The pad's page is not opened from its file** (T-030.3, T-040.2): from its file it had no
  plot, and it has not been tried so since `tools/sketch/boot.js` came. Served by any plain web
  server, the pages open (T-040.4): the pad's files as
  they lie, and three.js in a folder `three/` beside the pages (`tools/sketch/published.js` writes
  the pad so for GitHub Pages, T-044.2). There the example shows, Open plot holds a plot's file or folder, and `tools/sketch/kept.js`
  and New plot have no server to ask. Without a stylesheet a copy lacks that part of its
  look: without `tools/sketch/pad.css` the two sides have no width of their own, and "Nothing is
  selected." shows whatever is selected — the browser tests fail so, tried — and without
  `tools/sketch/icons.css` no control has a drawing. `tools/sketch/look.js` opens no file.
- A browser keeps a sketch for the address it was drawn at — the host and the port — and
  there **for each plot under the plot's own key** (invariant 9). So the made-up plot, on its
  own port, has a sketch of its own — and a `PORT` that is another pad's address opens that
  pad's sketches: never name 4764 beside `--demo`, for the owner's browser keeps there. Two
  pads on two ports — the owner's, and one of a check's or a test's own — share nothing: another port is another store. **The example has one key** since T-040.4,
  `blockplot/sketch/plot/example/space`, on either pad; before, the made-up pad kept it
  under the key of today, and a sketch kept so on 4765 is no longer shown — the browser tests
  start each case with a store of their own, and a look seeds its sketch anew. Two notes more
  are no sketch's (T-040.2): `blockplot/plot/tab` in `sessionStorage`, the plot this tab
  shows, and `blockplot/plot/last` in `localStorage`, the one this browser showed last —
  each an id, written by `tools/sketch/boot.js` where a plot is shown from the browser's store or the
  example is noted, and by nobody where nothing was noted. They are this browser's, at this
  address: another browser, a private window and another port have noted nothing, and open on
  the example. The note of before, `blockplot/sketch/last`, which held the server's
  ids, is left where it is and read by nothing.
- **An address typed goes to the plot shown last** (T-040.2) — of the plots this browser holds.
  The pad's own address, `/`, `/index.html`, `/3d.html` or `/info.html`, in a new tab, shows the
  plot noted last; in a tab that showed a plot, that tab's plot — a reload, another view, 3D and
  back — whatever another window showed since. Nothing goes on to another address, and no
  address names a plot: `/plots/<id>/` is a 404 since T-040.4, and the word `?no-plot=` of
  before is no longer said — a query is never read, and `/?no-plot=<id>` is the pad's page. Where the plot noted is not held,
  or its text no longer reads, the page shows the example, says it in `GONE`, and takes both
  notes out. **The page waits for the store**: where a held plot
  is noted, its scripts go in only once IndexedDB has answered — after the page's `load` — so a
  browser test waits for `html[data-shown="<id>"]`, which `boot.js` sets once the last script
  has loaded.
- **A note that names no plot** this browser holds — changed by hand, in the browser's own
  tools — is a plot that is gone: the page shows the example, `GONE` is that id, and both
  notes are taken out. The rule for a name is not stated a third time.
- **A tab keeps the steps of one plot, the one it shows.** Opened on another plot in the
  same tab — by its address, or from File, "Open plot" (T-030.4) — the page has no step to undo,
  and writes its own into the tab's one slot as it goes: back on the first plot the sketch
  is there as it was left, and its steps are gone. A reload, another view and the 3D page
  of one plot keep them, as they did. What the tab showed — the tool, the colour, the zoom,
  where the paper was moved to (T-042.3), what was selected, the 3D view's way and look — goes the
  same way: a page of another plot opens as a page does the first time. Both say whose
  they are under `of`, the plot's key, and nothing under the first key: **a page that keeps
  a thing of its own through `views.keep` gives it another name than `of`**. And a pad of
  before this task, started on the same port, knows no `of`: in a tab that last showed
  another plot it would take that plot's steps for its own — after going back to an older
  checkout, a tab is opened anew.
- **One check asks whether this checkout changed while it ran** (T-040.5 took two away, and
  T-041.4 `tools/sketch/new-plot/made.check.js`): `tools/sketch/plots-served.check.js`, of this
  folder and of all of `design/`, by names and times. A file that is saved there in that second — by an editor, or by the
  owner's own pad keeping a sketch in the checkout that the gate runs in — fails the check,
  with a line that says what was written to, and nothing of what it holds. Run again.
- The made-up ground is a plane, so that a height on it is worked out by hand: 820 m at the
  paper's uphill corner, 0.2 m lower with every metre down the plot, 0.04 m with every metre
  across it. On its paper a column is `2 * (x + 4)`, a row of the top view `2 * (28 - y)`, and a
  row of a standing view `2 * (826 - height)`: at column c and row r the ground lies at
  820 − 0.1 c − 0.02 r m. Its outline, in cells, runs (12, 44), (12, 10), (80, 10), (80, 38),
  (66, 50), (32, 50): two of its sides run askew, and neither along a line of the grid.
- **The made-up plot lies in this folder twice** since a plot is a file (T-030.1): as
  `tools/sketch/demo-site.js`, the script, and as `tools/sketch/example/plot.json`, the file — 26 931 bytes on 127
  lines, nearly all of it ground, a corner of its outline on four lines. A change of the one
  without the other turns `tools/sketch/plot-file.check.js` red: change the script, by hand, and write
  the file anew with the one command of `docs/sketch/example.md`. The file is never formatted —
  `.prettierignore` names it — and the server gives it to nobody: `route` knows no `.json`,
  so `/example/plot.json` is a 404, as `/plot.json` under a plot's address is. **A page that
  shows the example loads `tools/sketch/demo-site.js`, and not the reading of the example's
  file** (T-040.4), on either pad: the one check is what holds the two to be the same plot.
  The server reads it for nothing since T-040.5.
- What `tools/sketch/plot-file.js` is strict about. **`read` refuses what the pad could not draw**, and
  reads what it draws and then says in red (`paper.siteFaults`): so a plot's file that reads
  may still open with the alarm. Its sentences are what the pad is to say of a plot that it
  cannot open — a word of one is changed in three places, the module, its check and the
  format's text. **`write` gives a text only of a site that reads back as it was**, by
  `util.isDeepStrictEqual`: a field that is `undefined` is refused, where JSON would leave it
  out — a site is built with what it does not say left out — and so is a zero with a minus
  before it, which a file does not hold, though `read` takes a file that says `-0`. **And so
  is a site out of another context**: `isDeepStrictEqual` asks what kind of thing each part
  is, and a site that a script left in a context of `node:vm` is made of that context's
  lists and objects — tried on `tools/sketch/demo-site.js`: run by `vm`, its site does not read back as it
  was written; loaded by `await import('./demo-site.js')`, as the checks load it, it writes
  the example's 26 931 bytes. A script that says a site is loaded with `import`. The
  order of a site's fields is not held against it: `write` lays them in the table's order,
  and `read` gives them in the file's own. The module imported `isDeepStrictEqual` of Node's
  `util` until ST-040, which gave it a comparison of its own, so that a page loads it.
- The outline's area is worked out in three places now, by the same sum: `siteFaults` of
  `tools/sketch/paper.js`, for the alarm of a page; `areaOf` of `tools/sketch/plot-file.js`, for whoever lists plots
  without a page; and `paperOf` of `tools/sketch/new-plot/frame.js`, for the map's page, which imports
  neither (T-031.3). Nothing holds the first two against each other but the made-up plots,
  whose areas the check has by hand: 644 m², 300 m², 336 m²; `tools/sketch/new-plot/plot.check.js` holds
  the third against the second on the plots that it works out — `made.check.js` held the list's
  520 m² of a plot that was made, until T-041.4 took it away.
- **A sign that is not seen is named by its number in a script, never typed**: a byte-order
  mark is `String.fromCodePoint(0xfeff)` in `tools/sketch/plot-file.js`, and the line separators of the
  check of `scriptOf` likewise, while there was one — as `tools/sketch/routes.check.js` names its letters. Typed, or written as
  `\u` and four figures by a tool that turns that into the sign itself, it stands in the
  file unseen, and a review reads past it: it stood so in T-030.1, in the module and in its
  check, until each file was asked for every sign over 127.
- `tools/sketch/look.js` **starts the made-up pad, always** (T-040.4): the server has no plot of
  its own to show, so a look is of the example, `--demo`, or of a plot's file, `--plot=<file>`,
  which the page is given as "Open plot" is given one — and a look told neither, or both, is
  refused. **A plot's file of the owner's is the real plot**: its picture then belongs outside
  the repository, and in nothing that leaves this machine. An agent looks with `--demo`, or
  with `--plot=` naming a made-up plot of `tests/__fixtures__/plots/` — `pnpm sketch:look
  "index.html#top" tests/__fixtures__/sketch/made-up.json <picture>
  --plot=tests/__fixtures__/plots/terrace/plot.json`: the terrace plot's outline of five
  corners, "Made-up terrace, by the lake / north" in the toolbar with no area after it, and
  the made-up house drawn in cells of another paper, which means nothing there; with
  `"3d.html"` its hill. After
  every step it waits 300 ms, for the page if it
  loads anew, and two frames more; a view that takes longer to draw wants a `wait` step.
