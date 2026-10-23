// The check of a cut through a box whose top slopes, by hand. First the rule alone, `remains` of
// blocks.js: whether a slope leaves anything of a box, of each kind of box, along the plot and
// across it. Then what the eraser and Merge of strokes.js lay of a box that is cut: no piece that
// lies wholly over the plane of its box - the case that was seen on the made-up plot, a notch in
// a sloping top, piece by piece, in each standing plane and from above - a box and a block gone
// where no piece is left, every other box cut as it was, and Undo after each. And the pieces of a
// cut share one slope, which a pull of one of them leaves to the others. A made-up paper and
// store, as slopes.check.js makes them. Alone: pnpm exec node tools/sketch/slopes-cut.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });
// The paper of slopes.check.js: 146 columns down the plot, 71 rows across it and 72 up, of half a
// metre. Nothing is drawn on it here and nothing said: the strokes and the pull alone are loaded.
const SPANS = { top: [-5, 30.5], side: [440, 476] };
const made = { CELL_M: 0.5, X0: -10, COLS: 146, ACROSS: 71, SPANS, INK: 'ink' };
globalThis.paper = made;
/** The scripts that read the plane once, loaded anew for a view: its plane, and whether it shows that paper from behind. */
async function view(name, plane, flip = false) {
  const [wide, rows] = [plane === 'end' ? 71 : 146, plane === 'top' ? 71 : 72];
  Object.assign(made, { PLANE: plane, FLIP: flip, WIDE: wide, ROWS: rows });
  for (const one of ['strokes', 'slopes']) await import(`./${one}.js?${name}`);
}
for (const one of ['figures', 'shapes', 'categories', 'blocks', 'legacy', 'sketch'])
  await import(`./${one}.js`);
const { sketch, blocks, structuredClone } = globalThis;
const text = () => JSON.stringify(sketch.doc);
const things = () => sketch.doc.things;
// The level that is drawn on, at 453 m, and where the two slices run: along row 36 of the top
// view, and along column 36. A sketch is begun anew with the things it is to hold, and no step.
const ON = { top: 46, side: 36, end: 36 };
const begin = (...boxes) => {
  sketch.doc = sketch.adopt({ ...sketch.blank(), things: structuredClone(boxes), on: { ...ON } });
  [sketch.past.length, sketch.future.length] = [0, 0];
};
// A box as text: its columns, its rows of the top view and its rows up, and the rows its top then
// lies in at its two ends. And what each box of the sketch says of a slope.
const lies = (box) => `${box.x} ${box.y} ${box.z} ${blocks.topOf(box)?.rows ?? 'level'}`;
const says = () => things().map((box) => JSON.stringify(box.slope) ?? 'none');
const undo = () => sketch.step(sketch.past, sketch.future);
/** A change of the sketch: one step, which Undo takes back to the byte and redo makes again. The things it leaves. */
function done(act) {
  const [before, steps] = [text(), sketch.past.length];
  act();
  const [after, more] = [text(), sketch.past.length - steps];
  undo();
  const undone = text();
  sketch.step(sketch.future, sketch.past);
  assert.deepEqual([after === before, more, undone, text()], [false, 1, before, after]);
  return things();
}
/** The eraser dragged over a box of cells of the paper, from its first cell to its last. */
const erase = (left, top, right, bottom) =>
  sketch.apply({ tool: 'erase', from: [left + 0.5, top + 0.5], to: [right - 0.5, bottom - 0.5] });
/** What the eraser leaves of a sketch whose boxes slope, each box as text - and no box that its slope leaves nothing of. */
function cut(...cells) {
  const left = done(() => erase(...cells));
  assert.ok(left.every(blocks.remains));
  return left.map(lies);
}
/** Merge, dragged from a cell of the paper to the next one in its row. */
const merge = (x, y) =>
  sketch.apply({ tool: 'merge', from: [x + 0.5, y + 0.5], to: [x + 1.5, y + 0.5] });

// The night rooms of the case that was seen, on this paper: 5 m long and 3 m high, columns 60 to
// 70, their top in row 40 of a standing view and their floor in row 46 - here 6 m across the plot,
// rows 30 to 42 of the top view. Their top falls 2 m to the uphill end, from row 40 at column 70
// to row 44 at column 60: two fifths of a row with every column, so that it lies in row 43.2 at
// column 62, in row 42.4 at column 64, in row 42 at column 65, 41.6 at 66 and 40.8 at 68. The
// same top the other way falls to the downhill end, and lies in row 41.6 at column 64, 42.4 at 66.
const ROOMS = { x: [60, 70], y: [30, 42], z: [40, 46], colour: 1 };
const UPHILL = { x: [60, 70], z: [44, 40] };
const DOWNHILL = { x: [60, 70], z: [40, 44] };
const sloped = (slope, more) => ({ ...ROOMS, ...more, slope });
/** A box turned a quarter on the ground: what ran down the plot runs across it, its plane too. */
const turned = (box) => ({
  ...box,
  x: box.y,
  y: box.x,
  slope: { y: box.slope?.x, z: box.slope?.z },
});
/** Boxes of the rooms as the sketch has them written: what each says after its extents, and of each its columns and its rows up. */
const written = (more, ...boxes) => {
  const one = ([x, z]) => `{"x":[${x}],"y":[30,42],"z":[${z}],${more}}`;
  return `[${boxes.map((box) => one(box.split(' ')))}]`;
};

// --- the rule alone ---------------------------------------------------------------------------------
// SOMETHING IS LEFT of a box that says no slope, or what is none; of one that its plane lies
// wholly over, or meets at its top; of one the plane passes through, either way; of a wedge,
// whose top comes down to its floor at one end, row 46, and of one whose plane goes under its
// floor at one end. And of a piece of the rooms that the plane passes through: the first 2 m of
// their upper 1.5 m, where the plane comes up over row 43 at column 62.5, and the first 3 m of
// their upper metre, where it lies in row 41.6 at column 66.
const LEFT = [
  [undefined],
  ['x'],
  [{ x: [70, 60], z: [50, 48] }],
  [{ x: [60, 70], z: [38, 34] }],
  [{ x: [60, 70], z: [36, 40] }],
  [UPHILL],
  [DOWNHILL],
  [{ x: [60, 70], z: [46, 40] }],
  [{ x: [60, 70], z: [40, 50] }],
  [UPHILL, { x: [60, 64], z: [40, 43] }],
  [UPHILL, { x: [60, 66], z: [40, 42] }],
];
// NOTHING IS LEFT where the plane lies in the row of the floor, or lower, at both of the box's
// own ends: wholly under the rooms; in the row of their floor at one end and under it at the
// other, either way; and under a piece of them - the first 2 m of their upper metre, whose floor
// is row 42, with the plane in rows 44 and 42.4; the same 50 cm longer, where the plane lies in
// the very row of that floor, 42; and its like at the downhill end of the top that falls there.
// The reading is as it was: such a box has no top that slopes, and is as high as it is drawn.
const NOTHING = [
  [{ x: [60, 70], z: [50, 48] }],
  [{ x: [60, 70], z: [46, 50] }],
  [{ x: [60, 70], z: [52, 46] }],
  [UPHILL, { x: [60, 64], z: [40, 42] }],
  [UPHILL, { x: [60, 65], z: [40, 42] }],
  [DOWNHILL, { x: [66, 70], z: [40, 42] }],
];
for (const [left, boxes] of [
  [true, LEFT],
  [false, NOTHING],
]) {
  for (const [slope, more] of boxes) {
    const box = sloped(slope, more);
    const read = [blocks.remains(box), blocks.remains(turned(box))];
    assert.deepEqual(read, [left, left], JSON.stringify(box));
    if (left) continue;
    assert.deepEqual([blocks.topOf(box), blocks.highOf(box)], [null, box.z[1] - box.z[0]]);
  }
}
// The rows are worked out as the reading works them out, whole numbers multiplied before they
// are divided: a plane that falls a row with every column lies in row 1 a column on, the very
// row of this floor - where 1 / 49 * 49 is a hair less, and would leave a box.
const exact = { x: [11, 20], y: [0, 2], z: [0, 1], slope: { x: [10, 59], z: [0, 49] } };
assert.deepEqual([blocks.remains(exact), (1 / 49) * 49 < 1], [false, true]);

// --- the eraser, along the plot -----------------------------------------------------------------------
await view('side', 'side');
// What the paper fills of the things in the slice, in cells, as the areas beside it add them up.
const covered = () =>
  things().reduce((sum, box) => sum + blocks.covers(box, 'side', sketch.rect(box, 'side')), 0);
// THE CASE THAT WAS SEEN. A notch of 1 m, columns 64 to 66, erased from over the rooms down to
// row 42, 1 m into them. Three pieces are left of their box: the 2 m under the notch, all 5 m
// long, whose top falls from its own top in row 42 to row 44; uphill of the notch 2 m by 1 m,
// with the plane under all of it, in rows 44 and 42.4; and downhill of it 2 m by 1 m, with a top
// from row 41.6 up to row 40. The first and the last are laid, one block, each with the plane -
// and the piece uphill is not: it stood there as a box over the slope, where nothing was drawn.
// The paper filled 40 cells of the rooms, 10 m²: now 30 and 4.8, and no longer 8 more.
begin(sloped(UPHILL));
assert.equal(covered(), 40);
const SEEN = ['60,70 30,42 42,46 44,42', '66,70 30,42 40,42 41.6,40'];
assert.deepEqual(cut(64, 39, 66, 42), SEEN);
const ONE = '"colour":1,"slope":{"x":[60,70],"z":[44,40]},"group":1';
assert.equal(JSON.stringify(things()), written(ONE, '60,70 42,46', '66,70 40,42'));
assert.equal(covered().toFixed(1), '34.8');
// A ROW DEEPER, to row 43, the plane passes through the piece uphill of the notch - it comes up
// over row 43 at column 62.5 - and that piece is laid, with a top from its floor up to row 42.4.
begin(sloped(UPHILL));
const DEEPER = [
  '60,70 30,42 43,46 44,43',
  '60,64 30,42 40,43 43,42.4',
  '66,70 30,42 40,43 41.6,40',
];
assert.deepEqual(cut(64, 39, 66, 43), DEEPER);
// NO PIECE OF A BOX. Of that piece the last metre is erased, columns 62 to 64: what the plane
// passed through. Its first metre has the plane under it, in rows 44 and 43.2: the box is gone,
// as one that lay wholly in the cut is, and the block is the other two.
assert.deepEqual(cut(62, 39, 64, 43), [DEEPER[0], DEEPER[2]]);
assert.deepEqual(new Set(things().map((box) => box.group)), new Set([1]));
// INTO THE HIGHER HALF, columns 66 to 68, every piece is laid: uphill of the notch the plane
// comes up over row 42 at column 65, and downhill of it the top runs from row 40.8 to row 40.
begin(sloped(UPHILL));
const HIGHER = [
  '60,70 30,42 42,46 44,42',
  '60,66 30,42 40,42 42,41.6',
  '68,70 30,42 40,42 40.8,40',
];
assert.deepEqual(cut(66, 39, 68, 42), HIGHER);
// ONE PIECE LEFT OF TWO is a box alone, and says no group: all that lay downhill of column 64,
// down to row 42, erased - the 2 m under it are laid, and the piece uphill is not.
begin(sloped(UPHILL));
assert.deepEqual(cut(64, 39, 71, 42), [SEEN[0]]);
assert.equal(things()[0].group, undefined);

// CUT AS THEY WERE: the level rooms, to the last piece and in its order - under the notch, uphill
// of it and downhill of it, one block - and to the byte. So are the rooms under a plane that
// lies wholly over them, whose pieces all say it and are all level. And so is a box that its
// plane lies wholly under - from another sketch, or made shorter - which reads level, the box a
// box: the pad showed all of it, and it is cut as the box it is. Merged, uncut, it stays.
const THREE = ['60,70 42,46', '60,64 40,42', '66,70 40,42'];
begin(ROOMS);
const notched = () => JSON.stringify(done(() => erase(64, 39, 66, 42)));
assert.equal(notched(), written('"colour":1,"group":1', ...THREE));
const OVER = { x: [60, 70], z: [38, 34] };
const UNDER = { x: [60, 70], z: [50, 48] };
for (const slope of [OVER, UNDER]) {
  begin(sloped(slope));
  const said = `"colour":1,"slope":${JSON.stringify(slope)},"group":1`;
  assert.equal(notched(), written(said, ...THREE));
  assert.ok(things().every((box) => blocks.topOf(box) === null));
}
begin(sloped(UNDER), { ...ROOMS, x: [70, 76] });
const BESIDE = ['60,70 30,42 40,46 level', '70,76 30,42 40,46 level'];
assert.deepEqual(done(() => merge(69, 41)).map(lies), BESIDE);

// --- Merge ------------------------------------------------------------------------------------------
// A shaft of 1 m, columns 64 to 66, from 1 m over the rooms to 1 m into them, drawn before them.
// Merged, the rooms give way to it where the two lie in each other, and are cut as the notch
// cut them: the piece uphill of the shaft, over their plane, is not laid. One block of three
// boxes, in the shaft's colour.
const SHAFT = { x: [64, 66], y: [30, 42], z: [38, 42], colour: 2 };
begin(SHAFT, sloped(UPHILL));
assert.deepEqual(done(() => merge(63, 41)).map(lies), ['64,66 30,42 38,42 level', ...SEEN]);
assert.ok(things().every((box) => box.colour === 2 && box.group === 1 && blocks.remains(box)));
// TWO LEVEL BOXES are merged as they were, to the byte: the shaft, and the three pieces of the
// rooms that the notch left of them, in the shaft's colour.
begin(SHAFT, ROOMS);
const MERGED = written('"colour":2,"group":1', '64,66 38,42', ...THREE);
assert.equal(JSON.stringify(done(() => merge(63, 41))), MERGED);
// NOTHING LEFT OF A BOX. The rooms as a wedge - their top down to their floor at column 70 - and
// made 2 m longer there, to column 74: the plane falls on under their floor, and their top is one
// line to it. A wall that was drawn before them stands in all of them up to column 70. Merged,
// the wedge gives way: its last 2 m have the plane under them, in rows 46 and 48.4, and the
// block is the wall alone.
const LONG = sloped({ x: [60, 70], z: [40, 46] }, { x: [60, 74] });
const WALL = { x: [56, 70], y: [30, 42], z: [38, 48], colour: 2 };
begin(WALL, LONG);
assert.deepEqual(done(() => merge(69, 41)).map(lies), ['56,70 30,42 38,48 level']);

// --- one slope, the very object -----------------------------------------------------------------------
// The pieces of a cut hold one and the same slope until the sketch is next read. So a top corner
// of one of them pulled with Shift - the downhill one of the piece downhill of the notch, a row
// down - says a slope of its own for that piece, from its own two columns, and the slope of the
// other two is the object it was, saying what it said. Undo has the three on one plane again.
begin(sloped(UPHILL));
erase(66, 39, 68, 42);
const [under, uphill, downhill] = things();
assert.ok(uphill.slope === under.slope && downhill.slope === under.slope);
const [SAID, cutOnce] = [JSON.stringify(UPHILL), text()];
const corner = { tool: 'move', from: [70, 40], to: [70, 41] };
sketch.apply({ ...corner, grabbed: { ...sketch.grab(corner.from, 0.3), slope: true } });
assert.deepEqual(says(), [SAID, SAID, '{"x":[68,70],"z":[40,41]}']);
assert.ok(uphill.slope === under.slope && JSON.stringify(under.slope) === SAID);
undo();
assert.deepEqual([text(), says()], [cutOnce, [SAID, SAID, SAID]]);

// --- from the other side ------------------------------------------------------------------------------
// The other side shows the same paper from behind, and a stroke is in cells of the paper: the
// same notch leaves the same two pieces. And A TOP THAT FALLS THE OTHER WAY, 2 m to the downhill
// end: there the piece that is not laid is the one downhill of the notch, with the plane in rows
// 42.4 and 44 - and a row deeper it is laid, with a top from row 42.4 down to its floor.
await view('far', 'side', true);
begin(sloped(UPHILL));
assert.deepEqual(cut(64, 39, 66, 42), SEEN);
begin(sloped(DOWNHILL));
assert.deepEqual(cut(64, 39, 66, 42), ['60,70 30,42 42,46 42,44', '60,64 30,42 40,42 40,41.6']);
begin(sloped(DOWNHILL));
const FAR = ['60,70 30,42 43,46 43,44', '60,64 30,42 40,43 40,41.6', '66,70 30,42 40,43 42.4,43'];
assert.deepEqual(cut(64, 39, 66, 43), FAR);

// --- across the plot --------------------------------------------------------------------------------
// The rooms turned a quarter: 5 m across the plot, rows 60 to 70 of the top view, along which the
// paper of the front and the back view runs, with a top that falls 2 m to row 60. The same notch
// there, and the same a row deeper: the same pieces, with their rows where their columns were.
await view('end', 'end');
begin(turned(sloped(UPHILL)));
assert.deepEqual(cut(64, 39, 66, 42), ['30,42 60,70 42,46 44,42', '30,42 66,70 40,42 41.6,40']);
assert.deepEqual(new Set(says()), new Set(['{"y":[60,70],"z":[44,40]}']));
begin(turned(sloped(UPHILL)));
const END = ['30,42 60,70 43,46 44,43', '30,42 60,64 40,43 43,42.4', '30,42 66,70 40,43 41.6,40'];
assert.deepEqual(cut(64, 39, 66, 43), END);

// --- from above -------------------------------------------------------------------------------------
// A cut from above leaves every piece as high as its box. The wedge that was made longer, erased
// from its uphill end to column 69: the rest has the plane in row 45.4 at that end, over its
// floor, and is laid. NONE OF A BLOCK: erased to column 70, where the plane meets the floor, the
// rest has it under all of it. By its plane nothing of the block was there: it is gone.
await view('top', 'top');
begin(LONG);
assert.deepEqual(cut(59, 29, 69, 43), ['69,74 30,42 40,46 45.4,46']);
begin(LONG);
assert.deepEqual(cut(59, 29, 70, 43), []);

process.stdout.write('tools/sketch: a cut lays no piece that its slope leaves nothing of\n');
