# tools/sketch/scene

The sketch as a scene: what its things add up to in space, on the ground of the plot — plain
data for a view in 3D to draw (ST-023) — the parts the house is built of, worked out by rules,
and where the sun stands over the plot (ST-024). No browser, no three.js, no design data.

## Public API

ES modules that import their neighbours alone, `./<name>.js`, and name no global: all else comes
as arguments. The head of a module is its contract; this is the map.

- `tools/sketch/scene/scene.js` — `sceneOf(site, things, figures)`: `{ solids, levels, ground, outline, box, parts }`
  of a `SITE` and the sketch's things as the pad places them (`sketch.rect`), each a box in
  cells; its head says what a thing has. `figures` are the house's eight: without them, no part.
  A block whose top slopes says `top`, and so does its solid, in metres: its box stays its box.
  **A site may say its ground as heights** (ST-027): where `site.ground` says `heights` — a
  grid, `heights[row][column]` in metres above sea level, as `scene.ground.heights` is one where
  the ground is one grid —
  that is the ground, the very grid, and `rowsCm` is not read, whether it stands beside it or
  not. So the 3D view hands the scene a ground that the sketch has shaped, and no block of
  ground and no cut (`view3d/read.js`, ST-028): the hill, the outline on it, the box round it
  all and what a rule gets as `groundAt` follow from that grid, and no module here knows of a
  block of ground or of a cut. **Or as near and far** (ST-042): where `site.ground` says `near`
  — `{ near, far, beyond, at }` of `view3d/reach.js`, near rectangles and far squares in cells —
  `scene.ground` is `{ near, far, paper }`: a grid as above of each near rectangle, every cell
  of it and none where a block stands; each far square `[x0, y0, x1, y1, h00, h10, h01, h11]`, its
  top left and bottom right corners in metres and its four heights; and the plot's paper from
  above, `{ min, max }`. A rule's `groundAt` is the near grid's that holds the place — every block
  stands in one — the outline lies on it, and elsewhere on `at`, the paper's own; and `box` is
  the solids, the outline and the near grids, never the far squares: what the camera is fitted
  to and the sun lights. **A thing may say two more words** (ST-033), which its solid keeps
  as it keeps `name`: `section`, the id of its section, a number; and `gallery`, the name of an
  object's group of the pad's gallery, 'Kitchen' or 'Garden' — not `group`, which is a block's.
  A thing that says neither is the thing it was. `frameOf(site)` is exported: the one formula of
  where a column and a row lie
- `tools/sketch/scene/parts.js` — what a part is, with its words, `OF` and `SHAPES`; it runs the rules. A part
  that slopes is a `slant`: all between two planes that slope along one extent of the plot
- `tools/sketch/scene/tops.js` — a top that slopes, said once for the rules that build under it (ST-026):
  `topOf(frame, thing)`, `{ along, high }` in metres or null; `lineOver(frame, thing, part)`,
  that top over a part of its block; `filled(rectangle, along, bottoms, tops)`, all that lies
  between some bottoms and some tops as the fewest boxes and slants — where a slant is made;
  `lineAt`, a line said anew over a part of what it was said of, and `HAIR_M`.
  **A rule says in its own head what it builds under a slope**, and needs no line here
- `tools/sketch/scene/house.js`, `tools/sketch/scene/objects.js` — **where a rule goes:** `RULES`, of blocks, and `KINDS`, of objects.
  A rule is a module of its own and one line in the list, and needs no line here; the head of
  each of the two says all that a rule gets, gives and has to hold. `tools/sketch/scene/slabs.js` is the first:
  floors and roofs, a floor open over a staircase that comes up to it — with `floorUnder` and
  `roofOver`, the slab under a cell and over one, and `floorWhole`, the floor with no opening
- `tools/sketch/scene/storage.js` — `storage`, the rules of a cupboard, a sideboard and a shelf (ST-034),
  spread into `KINDS`: each worked out anew from how long its object's box is along it — the
  box that `clear.js` hands on, cut too — in the words of `furniture.js`, `box` and `bySize`.
  `bySize(piecesOf)`, of `furniture.js`, is the rule of a kind whose pieces are worked out from
  its object's box, as `ruleOf` is the rule of one list of pieces: `piecesOf(long, deep, high)`
  is given the box in metres, along the object, across it and up, as it lies unturned, and says
  the pieces in shares of it (T-035.1). A cupboard, and a sideboard by the same rule, is a body of `joinery` and a door of `paint` each
  half metre; a shelf two sides, an upright each whole metre between and five boards, all of
  `joinery`. No count of eight holds: a cupboard of 6 m is thirteen pieces
- `tools/sketch/scene/seats.js` — `seats`, the rules of an office chair, an armchair and a corner
  sofa (ST-034), spread into `KINDS`, in the words of `furniture.js`, `box`, `round` and
  `rulesOf` — the armchair and the corner sofa `bySize`, built by their size (T-035.7, T-037.3)
  — each its back at its far side until it is turned. An office chair is a foot and a
  column of `metal` under a seat and a back of `fabric`; an armchair a seat, a back and two arms
  of `fabric` on four short legs of `joinery`; a corner sofa, of one hand, all `fabric`: the
  sofa's back, seat and right arm along its far side, and at its left end a back and a second
  seat that comes forward — an L
- `tools/sketch/scene/lamps.js` — `lamps`, the rules of a floor lamp, a table lamp, a pendant
  lamp, a plant and a towel rail (ST-034), spread into `KINDS`, in the words of `furniture.js`,
  `box`, `round`, `ball`, `dome` and `rulesOf`, each said from the foot of its box, which the pad
  lifts. A floor lamp is a foot and a stem of `metal` under a shade of `fabric`; a table lamp a
  foot of `ceramic`, a stem of `metal` and a shade of `fabric`, 0.75 m up; a pendant lamp a bowl
  of `metal`, a dome, on a cord of `metal`, 1.6 m up and up to 2.7 m; a plant a pot of
  `ceramic` under a ball of `leaf`; a towel rail two posts and three rails of `metal` along its
  far side, and a towel of `fabric` before them — built by its length, 0.5 to 1.5 m, in `bySize`
  (T-037.3): its posts 3 cm across at its two ends, its towel 0.35 m wide in its middle. A lamp
  lights nothing
- `tools/sketch/scene/garden.js` — `garden`, the rules of a bench, a garden table, a sun lounger,
  a parasol and a grill (ST-034), spread into `KINDS`, in the words of `furniture.js`, `box`,
  `round`, `ball`, `dome` and `rulesOf`; a bench's back at its far side, a lounger's at its head,
  its uphill end, until it is turned. A bench is at each end a frame and a post of `metal`, a seat
  between them and a back between the posts of `joinery`; a garden table a round top of
  `joinery` on a column and a foot of `metal`; a sun lounger four legs and a frame of `joinery`,
  a cushion on it and a raised back at its head of `fabric`; a parasol a foot of `stone`, a pole
  of `metal` and a canopy of `fabric`, a dome, from 2.1 m; a grill four legs of `metal`, a kettle
  of `metal`, a ball, and a handle of `joinery` on its lid. **The bench, the garden table, the
  lounger and the parasol are built by their size** (T-037.4), in `bySize`, each made piece as
  thick in metres at every size as at its kind's own, where they are the pieces of before: a
  bench of 1 to 4 m stands on its two ends of 4 cm, with no frame between; a garden table's top
  is round over its whole box, an oval where it is longer than deep, and longer than
  `ONE_COLUMN_M`, 2 m, it stands on two columns, each on its foot a quarter of its length in from
  its end; a lounger's legs are 5 cm along and its back 0.3 m at every length; a parasol's foot
  0.5 m and its pole 4 cm across under a canopy over its whole box. One cut by its room smaller
  than its kind's least size is laid out in shares of that size, which the rules say a second
  time of the pad's `TAKES`. The grill takes no size. The tree and the bush, `objects.js`'s, are
  built by their box already: their pieces grow with it, a trunk with its tree. The pad's
  `garden.js` draws the four's pieces in metres too: who changes one changes the other
- `tools/sketch/scene/furniture.js`, `tools/sketch/scene/fittings.js` — `furniture` and `fittings`,
  the rules of a room's furniture, a person, a car, a fountain, a door and a window in no wall,
  and of a kitchen's and a bathroom's fittings, spread into `KINDS`; `furniture.js` says how a
  shape is said — `box`, `round`, `ball`, `dome`, `ruleOf`, `rulesOf`, `bySize` — and how it is
  turned. **Built by their size**, each made piece as thick in metres at every size as at its
  kind's own, where each is the pieces of before: a bed, a sofa, a table and a desk (T-035.4,
  T-035.7); a wardrobe — a door about each 0.75 m, `Math.max(1, Math.round(long / 0.75))` — and a
  fountain, its bowl half its length and half its depth, where the pad draws its inner ring
  (T-037.3); an island, a counter, a bathtub and a shower (T-035.5); a sink — its hollow from 6 cm
  to at most 0.56 m from its uphill end, its drainer after it, none at 0.5 m — and a washbasin, its bowl a trough as long
  as its unit (T-037.3). A fridge takes a length, 0.5 to 1 m, and needs no rule by it: every piece
  of it runs its whole length. One cut by its room smaller than its kind's least size is laid
  out in shares of that size (ADR-0152)
- `tools/sketch/scene/walls.js`, `tools/sketch/scene/openings.js` — the walls of every room, and what a door and a window open of
  them: `wallOn(context, cell, face)`, how thick a wall stands on an upright face of a cell, in
  metres, and `PANE_M`, how thick a pane is. The head of each says its rule
- `tools/sketch/scene/faces.js` — which wall the box of a room has on an upright face, said once for the walls and
  for the slabs: `toward(context, at, beyond)`, none, `INNER` or `OUTER`; `thickOf(context, at,
  axis)`, how thick each is there; `FACES`, `EXTENTS`, and `WALL`, the surface of a wall. By it
  a slab of a room is a field and a rim: under each outer wall a strip of the wall's surface
- `tools/sketch/scene/open.js`, `tools/sketch/scene/glass.js` — open air and glass: a railing along every edge of an open floor that
  has a drop beside it, by `STEP_M` and `RAIL_M`; panes in frames on the faces and the top of
  glass, by `FRAME_M` and `FRAME_EVERY_M`. The head of each says its rule
- `tools/sketch/scene/steps.js` — the steps of a staircase, the rules of `stairs`, `widestairs` and `spiral`: a
  flight as boxes one can count, each as wide as the flight's box, a spiral one as a post and
  treads round it, as many as a height holds at `RISE_M`; but a flight that says a length of its own,
  `long` (ST-037), has the whole number nearest (2 × height + `long`) / `STRIDE_M`, 0.63 m, at the
  least two — by its own `long`, so a flight its room cuts keeps its count — its treads over its box
  as ever. `RISE_M` and `STRIDE_M` and the count are said a second time by the pad, `shapes.stepsOf`
  of `tools/sketch/stairs.js`, for its words
- `tools/sketch/scene/flights.js` — what a straight flight runs over, said once for the four rules that ask (ST-026):
  `runOf(context, thing)`, the blocks along it from its foot on — its own room, under its foot
  or named with `STAIR` first, and the rooms under it; `crossing`, the flights across a face;
  `flightOver`, whether a flight is a cell's ceiling; `FLIGHTS`, the kinds that are one: `stairs`,
  a metre wide, and `widestairs`, a metre and a half — a kind is one word there. By it a
  flight over more than one block is whole: fitted as one thing (`tools/sketch/scene/clear.js`), open underneath
  over a room under it (`SOFFIT_M`, `soffit`, `tools/sketch/scene/steps.js`), with a wall across it that ends under
  its steps (`tools/sketch/scene/walls.js`) and no roof on that room where the flight is its ceiling (`tools/sketch/scene/slabs.js`)
- `tools/sketch/scene/clear.js` — `fitted(context, thing)`: the box of an object clear of the walls of its room,
  moved before it is cut and never cut under `LEAST` of its length — what `context.boxOf` hands
  a rule for its object; `standing(thing)`: the level it stands on, the cells under its middle
- `tools/sketch/scene/space.js` — `spaceOf(things)`: who holds a cell, which boxes are one block, what a block
  counts as; `pieces`, a face of a box in rectangles; `metres`, a box of cells in metres
- `tools/sketch/scene/surfaces.js` — `SURFACES`, a plain colour each, and `floorOf(name, as)`. Two of them are
  wood: `wood` is a floor's, and the trunk of a tree; `joinery` is the wood of what stands on a
  floor — every piece of `tools/sketch/scene/furniture.js`, `tools/sketch/scene/fittings.js` and `tools/sketch/scene/storage.js` that is of wood, a door's leaf too
- `tools/sketch/scene/holds.js` — `amiss(scene, liftOf)`: what does not hold of a scene's parts, in words; `liftOf`
  says a lift, or `[dx, dy, dh]` of an object that was moved clear of a wall. A slant is asked
  by what it fills (`filled`): under the top of its block, and in a part of another surface
- `tools/sketch/scene/cut.js` — `shown(scene, cut)`, `partsShown(scene, cut)`: what shows at `'all'`, or at a level
- `tools/sketch/scene/shows.js` — what a tab shows (ST-033): `switchedOff(solid, off)`, whether a switch takes
  a thing away, `off` being `{ sections, levels, groups }` — section ids and `NO_SECTION`,
  `'none'`; levels in metres; gallery groups — by its `section`, its `floor` or its `gallery`;
  `shownBy(scene, cut, off)`, `{ solids, parts }`: what `cut.js` shows at that cut less what a
  switch takes away, a part with its thing; `OPENS`, `side`, `far`, `front`, `back`, and
  `openAlong(site, on, from)`, `{ axis, at, keeps }` or null: the plane through the middle of
  the row `on.side` or the column `on.end` that the view looks at, in metres, and which half is
  kept — the one away from that view's eye
- `tools/sketch/scene/above.js` — `aboveGround(scene)`: `{ boxes, under }`, what goes to Google Earth (ST-016) —
  the scene's own solids of blocks, in its order, but those whose highest point, the higher end
  of a top that slopes, lies at or under the lowest grid point of `scene.ground` on their
  footprint, edges included — of the near grid they stand in, where the ground is near grids
  and far squares (ST-042); `under`, how many were left out so. No object is in either, and a
  box with no grid point under it is kept. It reads the ground the scene was handed, and works
  out none
- `tools/sketch/scene/ground.js` — `groundMesh(ground)`: `{ positions, indices }`, the top of the hill;
  `hillMesh(ground, lowest)`: its walls, down to a flat base `BASE_BELOW_M` under `lowest`;
  `landOf(ground, lowest)`: `{ top, hill }` — of a ground of one grid those two, as they were;
  of near grids and far squares (ST-042) `{ top, hill, skirts }`: `top` every near grid's cells
  and every far square's two triangles, with `light`, a 1 for each point beyond the plot's
  paper; `hill` the walls of the near grids' pits, where a block stands, and one base under all
  of it, `BASE_BELOW_M` under the lowest of the scene and of the far squares; and `skirts` the
  near grids' walls along their own edges, down to the base, and a skirt from every edge of a
  far square straight down by half its side and at least `SKIRT_M`, 1 m — to the base where the
  edge lies on the rim of all that is drawn. A skirt's top meets the ground beside it: a view
  draws the skirts behind the ground, and the walls of a pit ahead of it (`view3d/build.js`); `drawnBox(ground, box)`, the box around `box` and every far square — all that is
  drawn, which the camera's sight reaches (`view3d/stage.js`, `sightOf`)
- `tools/sketch/scene/stations.js` — `stations(scene, { fieldDeg, downDeg })`: five, each `{ eye, target, up }`
- `tools/sketch/scene/sun.js` — `sunOf(bearingDeg, { fromDeg, highDeg, name })`: `{ toward, name }`, the way to the
  one named sun — `SUN_BEARING_DEG`, `SUN_HEIGHT_DEG`, `SUN_NAME` — and the words that name it

## Units and frame

Metres, as `[x, y, h]`: x down the plot, y across it, h above sea level — the frame of `site.js`.
From above, with x to the right, y runs up: the top view. A column lies at
`xFromM + column * cellM`, a row of the top view at `yToM - row * cellM`, a row of a standing
view at `sideM[1] - row * cellM`. Nothing is mirrored, and nothing is stretched. By the compass,
x points where the site's `bearingDeg` says, and y a quarter back from there.

## Test

`pnpm sketch:check` runs every `*.check.js` here, one beside each module — and `tools/sketch/scene/rim.check.js`,
the second of `tools/sketch/scene/slabs.js`: the slabs of rooms whose walls are not the same all round; and
`tools/sketch/scene/wide.check.js`, the wide staircase's: a flight of 1.5 m at each turn, under a floor open over
its 27 cells, in a stair room as wide as itself and over a storage; and, of a top that slopes
(ST-026), `tools/sketch/scene/roofs.check.js`, the third of `tools/sketch/scene/slabs.js`, and `tools/sketch/scene/gables.check.js`, the second of
`tools/sketch/scene/walls.js` — a roof and the walls under one, by hand — and `tools/sketch/scene/glasshouse.check.js`, the second
of `tools/sketch/scene/glass.js`: glass under one — on a plot
and things made up in it, against figures worked out by hand. `tools/sketch/scene/tops.check.js` holds, beside
`tools/sketch/scene/tops.js`, a solid with its top, a rule of its own that builds a floor, a wall and a roof under
one with `topOf`, `lineOver` and `filled` alone, and what a slant is. `tools/sketch/scene/heights.check.js` holds a
ground that is said as heights (ST-027), on a plot of its own with one grid point a metre over
its plane and no `rowsCm` at all: the scene's ground is that very grid, which cannot be written
there; the outline lies on it, the box ends at it, the hill's top has it, and a rule made up
there gets it as `groundAt`, at a grid point and between four; said as text the plot is the
same scene, and said both ways `heights` is the ground. `tools/sketch/scene/above.check.js` holds, on a ground made up by hand that falls along x, which boxes
stand above it: a cellar under it and one with its top at it left out, one a centimetre over a
grid point of its downhill edge kept whole, a top that slopes asked at its higher end, a box off
the paper kept, and no object kept or counted — and on a ground of two near grids (ST-042), a
cellar under each kept out and a block between them kept. `tools/sketch/scene/ground.check.js` holds,
by hand, the top, the walls and the base of a grid of three cells by two, and (ST-042) a ground
of a near grid and two far squares, one beyond the paper: its points, triangles and lightness,
the hill its base alone, every skirt to the metre and to the base on the rim, and `drawnBox`;
and a near grid of two cells with a block in one: the pit's wall the hill's, the grid's three
walls along its edge skirts. `tools/sketch/scene/scene.check.js` also refuses a
module that imports anything but a neighbour, or names `globalThis`. `tools/sketch/scene/shows.check.js` holds, on
a scene of two levels typed by hand — three rooms in section 1, section 2 and none, a sofa and a
table of "Furniture", a window and a car — what each switch takes away at every cut, and nothing
else, and three at once; on a plot typed by hand the two words kept on a solid, and the plane of
each of the four views' slices to the centimetre, which half it keeps, and a box it cuts and one
it does not. A rule's check asks its
rule alone, `sceneOf(site, things, figures, { blocks: [rule] })`, so that the next rule does not
break it; `tools/sketch/scene/house.check.js` tries every rule together on one house, with `amiss` — and on that
house under three tops that slope, a room's, a block of glass's and open air's, where every
other thing keeps the parts it had — and
`tools/sketch/scene/faces.check.js` every part of such a house on its facades: none but a wall's surface, or glass.
`tools/sketch/scene/storage.check.js` holds, as `tools/sketch/scene/furniture.check.js` does for the furniture, each
kind of storage at 0.5, 1.5 and 6 m and at its four turns, in a made-up hall and on its
ground: `amiss` finds nothing, its count of pieces by its length, the pieces turned as the pad
turns its drawing, the body and the doors on either side of the line that the pad draws from
above and a shelf's pieces behind its line; a cupboard of 1.5 m and a shelf of 2 m by hand,
piece for piece; a box cut short a door each whole half metre of it; and that `objects.js` has
the three rules.
`tools/sketch/scene/flight-steps.check.js` holds the count of a straight flight (ST-037, rules 2 and 3) by
hand — 3 m high by 4.5 m long and its own, 17 steps of 17.6 cm by 26.5 cm; 2.5 m by 6 m, 17 of
14.7 cm by 35.3 cm; and with no length of its own the steps of before, 16 at 3 m — through the
pad's `shapes.stepsOf` and its words under the paper and of what is selected, a staircase and a
wide one, turned and not; the scene's flight with a `long` counted and measured from its parts,
and one without, step for step where it lay before; the pad and the scene on one count at every
height from 2 to 4.5 m in 5 cm and length from 2 to 8 m in half metres, with and without a
`long`; and `stepsOf` of a spiral staircase and of a chair, `null`.
`tools/sketch/scene/beds.check.js` holds the same of a bed 1, 1.5 and 2 m wide (T-035.4) at its
four turns, in a made-up hall and on its ground: `amiss` finds nothing, its count of pieces by
its width — four under 1.5 m, five from it — and its mattress 4 cm in from either side, the
pieces turned as the pad turns its drawing, and as many pillows as the pad draws from above,
each lying on one of them; a bed of 1 m and one of 2 m by hand, piece for piece, the second the
five pieces of the bed before it had a width, and the two pillows of a bed of 1.5 m; a bed cut
to 0.5 m and to 5 cm by its room, still four pieces within its box; and that `objects.js` has
the rule. The rule and the pad's drawing each say `TWO_PILLOWS_M`: who changes one changes the
other.
`tools/sketch/scene/fittings-sized.check.js` holds the same of a kitchen counter, an island, a
bathtub and a shower by their size (T-035.5), each at its four turns, in a made-up hall and on
its ground: a counter of 0.5, 2.5, 3.5 and 6 m at 0.85 and 1.1 m high, an island of 1 m by 1 m
and of 5 m by 1.5 m, a bathtub of 1.5 m, a shower of 2 by 1, 1 by 2 and 2 by 2 m. `amiss` finds
nothing; a counter is a body of joinery, a worktop of stone and a front of paint about each 0.6 m
— 1, 4, 6 and 10 — all as wide, 1.5 cm apart and from its ends; every piece of the four is as
thick in metres as in the kind's own pieces at its own size; the pieces are turned as the pad
turns its drawing, and the worktop, the tray, the bathtub's walls round its hollow and the
shower's head lie on what the pad draws from above at each size; a counter of 3.5 m and a shower
of 2 m by 1 m by hand, piece for piece; a counter cut short and shallow by its room still within
its box; and that `objects.js` has the four rules. The rules and the pad's `bathroom.js` each say
a bathtub's walls and a shower's head in metres: who changes one changes the other.
`tools/sketch/scene/tables.check.js` holds the same of a sofa, a corner sofa, a table and a desk
by their size (T-035.7), each at its kind's own size and at the least and the most of each of
its ranges — the pad's `TAKES` — at its four turns, in a made-up hall and on its ground: `amiss`
finds nothing; the count of pieces is the same at every size, and each piece as thick in metres
as at the kind's own size; the pieces are turned as the pad turns its drawing, and lie on what
the pad draws from above at each size — a sofa's back and arms, a corner sofa's two backs and
arm and its second seat in the pad's L, a table's top and legs, a desk's top, and its drawers
and its board on either side of the pad's line; a corner sofa of 4 m by 3 m and a table of 4 m
by 1.5 m, 1.1 m high, by hand, piece for piece; each of the four cut to 0.3 m and to 5 cm by its
room, still as many pieces within its box; and that `objects.js` has the four rules. The rules
and the pad's `furniture.js` each say the four's pieces in metres, and the rules the least of
each range: who changes one changes the other.
`tools/sketch/scene/seats.check.js` holds the same of each seat at its four turns, in a made-up
hall and on its ground: `amiss` finds nothing, its count of pieces and their surfaces, none of
`wood` or `plain` nor the object's whole box, the pieces turned as the pad turns its drawing and
lying on what it draws from above (`LIES_ON`); an armchair by hand, piece for piece; the corner
sofa's second seat at its uphill end, turned and never mirrored; and that `objects.js` has the
three rules.
`tools/sketch/scene/lamps.check.js` holds the same of each lamp, the plant and the towel rail
at its four turns, in a made-up hall and on its ground, lifted as the pad lifts its kind: `amiss`
finds nothing, its count of pieces and their surfaces, none of `wood` or `plain` nor the
object's whole box, its lowest piece on its slab or its ground — a table lamp 0.75 m over it, a
pendant lamp 1.6 m, its cord to 2.7 m — the pieces turned as the pad turns its drawing and lying
on what it draws from above (`LIES_ON`); a floor lamp and a towel rail by hand, piece for piece;
and that `objects.js` has the five rules.
`tools/sketch/scene/garden.check.js` holds the same of the bench, the garden table, the sun
lounger, the parasol and the grill at its four turns, in a made-up hall of a storey of 4 m and on
its ground: `amiss` finds nothing, its count of pieces and their surfaces, none of `wood` or
`plain` nor the object's whole box, its lowest piece on its slab or its ground, the pieces turned
as the pad turns its drawing and lying on what it draws from above (`LIES_ON`); a parasol and a
grill by hand, piece for piece; and that `objects.js` has the five rules.
`tools/sketch/scene/indoor-sized.check.js` holds a home's objects by their size (T-037.3): a
wardrobe of 0.5, 1.5, 3 and 6 m at 1 and 2.5 m high, a fountain of 1 by 1, 2 by 2 and 6 by 3 m,
an armchair of 1 and 1.5 m, a towel rail of 0.5 and 1.5 m, a sink of 0.5, 1 and 2 m, a washbasin
of 0.5 and 2 m, a fridge of 0.5 and 1 m and a bathtub of 2 by 1.5 m, each at its four turns in a
made-up hall. `amiss` finds nothing; a wardrobe is a body and a door about each 0.75 m — 1, 2, 4
and 8 — all as wide, 1.5 cm apart and from its ends, the others as many pieces as at their own
size; every piece as thick in metres as at its kind's own size, and there today's pieces, to the
number and to the place; at every turn what the pad draws from above lies on the pieces — a
fountain's basin and bowl, an armchair's back and arms, a towel rail's posts, rails and towel, a
sink's tap and its grooves on its drainer, the rims round each hollow drawn, a wardrobe's doors
on either side of each joint drawn; a wardrobe cut to 0.4 m within its box; a wardrobe of 3 m
and a sink of 2 m by hand, piece for piece; and that `objects.js` has the rules. It turns through
the pad's drawing at every quarter, and has no section of its own that turns each object back.
`tools/sketch/scene/garden-sized.check.js` holds the garden by its size (T-037.4): a bench of 1,
1.5 and 4 m, a garden table of 1 by 1 by 0.7, 2 by 1.5 by 0.75 and 4 by 2 by 1.1 m, a lounger of
1.5 and 2.5 m, a parasol of 1.5 by 1.5 and 4 by 3 m, a tree of 2 by 2 by 3 and 12 by 12 by 25 m
and a bush of 0.5 by 0.5 by 0.5 and 4 by 4 by 3 m, each at its four turns on the ground of a
made-up plot, each of a size its kind takes. `amiss` finds nothing; each is as large as it says
and stands on the ground; each made piece is as thick in metres as at its kind's own size, a
tree's and a bush's pieces in the shares of their box, and a garden table is three pieces up to 2
m and five longer, its columns in its middle or each a quarter of its length in from its end, at
1 to 4 m; at its own size each of the four is today's pieces, to the number and to the place; at
every turn what the pad draws from above lies on the pieces — a bench's seat and back, a table's
top, a lounger's frame, cushion and back, a parasol's canopy and pole, a tree's crown and trunk, a
bush; each of the four cut to 0.4 m each way within its box; a garden table of 4 m by 2 m by
hand, piece for piece; and that `objects.js` has the six rules. The rules and the pad's
`garden.js` each say the four's pieces in metres: who changes one changes the other.
The made-up house of the browser tests, with its two tops that slope, is tried with every rule
in `view3d/made-up.check.js`, and worked out by hand there — on the ground that its lawn
shapes (ST-027) and its cut takes away (ST-028), handed in as heights: no rule here knows of
the lawn or of the cut, and the garden beside the lawn has a railing along a part of its
downhill edge, where the hill alone left it one along all of it. Of that house the cut moves
the car alone, which stands on the ground: no railing comes or goes, and no part lies where
the cut was drawn (`view3d/made-up-cut.check.js`). A browser sees the same house in
`tests/e2e/sketch-3d-ground.spec.ts` and in `tests/e2e/sketch-3d-cut.spec.ts`.

## Gotchas

- Where a thing lies is the pad's to say. Of an object on the ground, the caller gives as
  `floor` the row of the ground under its middle: its box's bottom, plus its kind's lift.
- What stands on a block's floor is lifted by the floor's slab (`lift`, `tools/sketch/scene/parts.js`): a door lies
  a slab higher here than in the pad's slices. Its `floor`, which a cut asks, stays the block's.
  What stands on a level inside a block is lifted by the slab at that block's foot, and what
  stands over a staircase by the floor beside the opening: a flight begins where the one under
  it ends, and a thing drawn over a stairwell hangs at floor height. A door and a window in a
  wall beside an opening are raised alike (`floorM`, `tools/sketch/scene/walls.js`), though the wall runs down.
- An object's parts lie where `tools/sketch/scene/clear.js` fits its box — out of the walls of its room, and cut
  where the room is too small. Its solid, its `floor`, its lift and the cells it is read by
  are the sketch's still: Volumes and the pad's views show it where it was drawn, and a floor
  is open over a staircase by the cells the sketch has it in, with no railing round the hole.
- A tree's shares are said twice, in `tools/sketch/scene/objects.js` and in `view3d/build.js`; here its trunk ends
  where the box of its crown begins, for wood may not lie in leaf (`tools/sketch/scene/holds.js`).
- Which way a flight climbs and where a spiral staircase begins is said twice: where the pad
  draws them, `TOP.stairs`, `TOP.spiral` and `TURNS` of `shapes.js`, and in `CLIMBS` of
  `tools/sketch/scene/flights.js` and `UPHILL_DEG` of `tools/sketch/scene/steps.js`. `tools/sketch/scene/steps.check.js` has the pad draw both, and fails
  where they differ.
- A flight over more than one block has as many steps as its `step` parts have tops: the step
  over the edge of a room under it is two parts. Which room is its own hangs on its foot - drawn
  the other way round it stands solid in the storage - and on the first word of a name: "Back
  stairs" is a room, and a block that was picked a Staircase is handed on under that name
  (below). What it runs over is read off the cells the sketch has it in, its box off
  `tools/sketch/scene/clear.js`: a wall's thickness apart. And only the walls of the storey it stands on end under
  it: a wall of the storey above still runs down beside the opening, across the stairwell.
- A tread of a spiral staircase says `from` above `to`: it winds clockwise, in degrees that
  count down past nought and are not brought back into one turn.
- A top that slopes takes away from its box and adds nothing: a solid's `min` and `max`, and
  the scene's `levels`, `ground` and `box`, know no slope, and `top` alone says what lies under
  it. A thing says its top in rows, which count down the paper: across the plot `topOf` turns
  it over, once, and a rule never reads `thing.top` itself.
- Under a top that slopes a floor and a railing are as they were, level, and `amiss` does not
  ask them whether they rise over it: where a top comes down to the floor of its block, the
  floor's slab stands over it. A roof, a wall, a pane and a frame are asked, and each is built
  under the top: a room by `tools/sketch/scene/slabs.js`, `tools/sketch/scene/walls.js` and `tools/sketch/scene/openings.js` (T-026.5), a block of
  glass by `tools/sketch/scene/glass.js` (T-026.6). Open air under a slope is the floor and the railing it was.
- The questions of a cell, and what lies beyond a face, answer by the box, under a slope too:
  `floorUnder`, `floorWhole`, `roofOver` and `wallOn`, and `toward` of `tools/sketch/scene/faces.js`. So
  `roofOver` answers for the cell at the top of the box, however far under it the roof lies:
  whoever builds up to a roof asks the top as well. A strip of a roof's rim is asked for at
  the top of the box, wherever the roof lies. And a room beside a sloping one has half an
  inner wall toward its whole box - over its roof too, where the box is empty and an outer
  wall would be thicker.
- An opening is a box under a head that slopes: it ends under the lowest place of its wall's
  head along its own width, under a lintel up to the head - a wedge, in a wall along the
  slope - and a pane has a level head. So a door between a level room and a sloping one is
  opened at two heights, each half of the wall under its own head: the door into the bath of
  the made-up house is one.
- Under another block a room has no roof, sloping or not: its walls end at its top, and between
  them and the floor of the block above lies a wedge of air, as high as the top has fallen.
  The story leaves a block over a sloping top as it was drawn.
- Glass under a slope is measured straight down, and level across: a member hangs `FRAME_M`
  under the top, not square to it, and is thinner seen square to a steep slope. The bars of a
  roof of glass run down the plot whichever way it falls: along a top that falls down the plot
  or up it, level across one that falls across - there the two long members slope.
- Where a top comes down to the floor of its block, nothing stands at the low end: no wall and
  no rim of the roof, no face of glass and no member along it. The roof ends on the floor's
  slab - a room's thins out on it - and the slab goes on beyond, level, its edge as thick as
  its figure.
- Nothing that stands in a room is shortened by its roof: an object is as high as its kind,
  and a block and an object are not asked of each other. A flight of stairs is a storey high:
  in a stair room drawn only as high, with its top pulled down, the upper steps stand in the
  roof and come out on top of it. The stairwell is drawn a storey higher at the head of the
  flight, and its top pulled down from there.
- A slant is asked by its box, as what is round is, where it slopes along another extent than
  the top of its block, or than a slant of another surface that it meets: no rule makes one.
  And an object's parts are lifted by their boxes alone (`tools/sketch/scene/objects.js`): a slant made by the
  rule of an object would be found, its box no longer the box around it.
- `filled` leaves out what is no higher or no longer than a hair, cuts nothing off within a
  hair of an end, and takes two lines a hair apart for one: a piece of it may have its bottom
  a hair over its top at an end, and `amiss` lets that by.
- A door or a window that opens a wall has no part: the opening and the pane are its room's.
  Its solid stays. One that opens nothing is what the rule of its kind makes of it: a door its
  leaf, shut, and a window its pane.
- A wall is several shapes that touch - boxes, and slants under a head that slopes: cut along
  itself beside every opening, where it is thicker than a cell and its floor differs under it,
  and where its head passes from one line to another. At the inner corner of a block of two
  boxes two walls meet in a line, with no post behind it. `wallOn` knows of no opening.
- A slab of a room is several parts of one `of`: its field, and after it a strip of plaster
  under each outer wall, as wide as the wall is thick — the two across the plot from corner to
  corner, the two along it between them. A strip is asked for where a wall stands, on the level
  its slab lies on, and not where a door opens it: a threshold in an outer wall is plaster, and
  from above a roof shows a rim of it. Toward another room a slab is its own surface to its
  edge — under a door between two rooms two floors meet — and so is every slab of open air and
  of glass: a garden that lies on a room still shows its grass across that room's facade.
- A drop is read off the ground that the scene was handed, at the edge of a floor: `groundAt`
  knows no block. On the 3D page that ground is the shaped one (ST-027): an open floor has no
  railing where a block of ground brings the ground up to within a step of its slab, and has
  one where the ground is cut down beside it. **It is the cut ground too** (ST-028): a railing
  comes where a cut takes the ground away beside an open floor, more than a step under its
  slab — in `view3d/earth-cut.check.js` along a garden's uphill edge, where the hill met its
  floor — and no rule here learned of a cut for it. A block of ground
  moves the whole plot by a little, and a cut by more (`docs/sketch/pad-gotchas.md`), so a
  railing may come or go along an edge that neither touches: where the hill lay just over a
  step under a floor, or just under one. A
  railing through boxes of one block that lie on each other is a part in each. And frames that
  meet are boxes in each other: a corner's post is there twice, and the head of a wall of
  glass once more under the edge of its roof, which alone is `over`.
- A place among the scene's things — `part.thing`, a solid's place, what `space.who` answers —
  is a place in the `things` that the scene was handed, and none in the sketch: the 3D view
  hands on no box of a block of ground, and none of a cut (`view3d/read.js`). Whoever goes
  from a part back to the sketch counts without them.
- A thing's name is the name it was handed, and not always the owner's: the 3D view hands
  every box of a block for which a category was picked on under the name of that category —
  "Garden", "Bathroom", "Staircase" (`view3d/read.js`, ST-028). Two things are read off a
  name here, what a floor is made of (`floorOf`, `tools/sketch/scene/surfaces.js`) and whether a room is a
  flight's own (`STAIR`, `tools/sketch/scene/flights.js`): both follow a pick so, and no module here knows of a
  category. The pick is read, and the name no more: a picked Roof on a block named "Green
  roof" is paved, where "green" gave grass. And a name of the list is read by the words of
  these lists, as any name: a picked Shaft has a floor of wood, a block named "Duct" one of
  concrete (`view3d/picked.check.js` holds every row's floor).
- The scene trusts the grid of a site that says `heights`: it does not ask whether the grid has
  a height at every grid point of the paper, nor whether it is the site's at the outline. A
  grid of another size is taken as it is: the hill ends where the grid ends, and beyond it the
  outline lies as high as the grid's edge. And the grid is another's, on the 3D page the
  paper's own, by which the slices are drawn: nothing here writes into it, and
  `tools/sketch/scene/heights.check.js` hands the scene one that cannot be written.
- On which edge a door's leaf closes at each turn is said twice: where the pad draws a door,
  `TOP.door` and `TURNS` of `shapes.js`, and in `leafs` of `tools/sketch/scene/openings.js`, by which a door in a
  room as wide as itself opens one wall and not two. `tools/sketch/scene/openings.check.js` holds all four turns.
- `tools/sketch/scene/walls.check.js` stands at 290, `tools/sketch/scene/steps.check.js` at 293, `tools/sketch/scene/fittings.check.js` and
  `tools/sketch/scene/holds.check.js` at 296, `tools/sketch/scene/slabs.check.js`, `tools/sketch/scene/rim.check.js` and `tools/sketch/scene/flights.check.js` at 298,
  `tools/sketch/scene/clear.check.js` at 299 and `tools/sketch/scene/openings.check.js` at 300 of the linter's 300 lines: what is
  checked next of a wall, a staircase, a flight over blocks, a fitting, a slab, an opening, what
  gives way or what holds wants a check of its own. So do the three of a top that slopes:
  `tools/sketch/scene/roofs.check.js` stands at 292, `tools/sketch/scene/gables.check.js` at 296 and `tools/sketch/scene/glasshouse.check.js` at 297.
  `tools/sketch/scene/faces.check.js` and `tools/sketch/scene/house.check.js` have room, and `tools/sketch/scene/tops.check.js` some: it holds what a
  slant is, which `tools/sketch/scene/holds.check.js` had no room for. `tools/sketch/scene/heights.check.js` has room, at 167.
- `ground.heights[row][column]` begins at the top of the top view's paper, the largest y;
  `drawn[row][column]` is the cell below and right of that grid point. `outline` is a ring,
  and lies a hair off the mesh inside a cell that is no plane: draw it over the ground.
- `drawn` knows no cut: where a block stood that a cut took off, the pit stays, with the base
  of the hill for its floor.
- `stations` fits the ball around `box` into `fieldDeg`, the narrower of the camera's angles, and
  reads nothing else of a scene. `left` is the pad's side view; `above` alone has y for `up`.
- The sun is of no day and no hour (ST-024, rule 5): its name goes with its two figures.
- `tools/sketch/scene/scene.check.js` reads every module's words: none may have `from` before a quote. It is full,
  at 299 lines. And `view3d/rules.check.js` reads the checks here: none may say `from 'three'`.
