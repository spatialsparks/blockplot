// The check of a top that slopes in the pad, by hand: the pull of slopes.js in the two standing
// planes - down by rows, to the floor and no lower, back to the top, the other corner, across a
// slope that ran the other way, a box of a block - and what Select does without Shift, on an
// edge, on an object and from above; Undo and redo of each. Then what the strokes and a level do
// with a box that slopes, what the pad says of one, and what every plane draws of it. A made-up
// paper and store, as check.js makes them. Alone: pnpm exec node tools/sketch/slopes.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });
// The paper of check.js: 146 columns down the plot, 71 rows across it and 72 up, of half a metre,
// and row 0 of a standing view at 476 m. The plot runs east, so the top view measures from its
// south side. What is drawn besides the sketch is land.js's, and no part of this check.
const SPANS = { top: [-5, 30.5], side: [440, 476] };
const made = { CELL_M: 0.5, X0: -10, COLS: 146, ACROSS: 71, SPANS, INK: 'ink', exact: String };
made.hex = (colour) => `colour ${colour}`;
made.wind = (bearing) => ({ 180: 'south', 360: 'north' })[bearing];
const land = { ground() {}, grid() {}, site() {} };
Object.assign(globalThis, { paper: made, land, SITE: { bearingDeg: 90 } });
/** The scripts that read the plane once, loaded anew for a view: its plane, and whether it shows that paper from behind. */
async function view(name, plane, flip = false) {
  const [wide, rows] = [plane === 'end' ? 71 : 146, plane === 'top' ? 71 : 72];
  Object.assign(made, { PLANE: plane, FLIP: flip, WIDE: wide, ROWS: rows });
  for (const one of ['strokes', 'slopes', 'labels', 'footer', 'draw', 'draw-marks'])
    await import(`./${one}.js?${name}`);
}
for (const one of ['figures', 'shapes', 'categories', 'blocks', 'legacy', 'sketch', 'levels'])
  await import(`./${one}.js`);
const { sketch, blocks, structuredClone } = globalThis;
const text = () => JSON.stringify(sketch.doc);
const things = () => sketch.doc.things;
// The level that is drawn on, at 452 m, and where the two slices run: along row 36 of the top
// view, and along column 68. A sketch is begun anew with the things it is to hold, and no more.
const ON = { top: 48, side: 36, end: 68 };
const begin = (...boxes) => {
  sketch.doc = sketch.adopt({ ...sketch.blank(), things: structuredClone(boxes), on: { ...ON } });
};
// A box as text: its columns, its rows of the top view and its rows up, what it says of a slope,
// and the rows its top then lies in at its two ends. And of boxes, what each says of a slope.
const lies = (box) =>
  `${box.x} ${box.y} ${box.z} ${JSON.stringify(box.slope) ?? 'none'} ${blocks.topOf(box)?.rows ?? 'level'}`;
const tops = (boxes = things()) => boxes.map((b) => JSON.stringify(b.slope) ?? 'level').join(' ');

// A hall of 8 m by 6 m and 4 m high: columns 60 to 76, rows 30 to 42 of the top view, its top in
// row 40 of a standing view and its floor in row 48: both slices run through it. And a top for
// it that falls 2 m down the plot, from row 40 at its uphill end to row 44.
const HALL = { x: [60, 76], y: [30, 42], z: [40, 48], colour: 1 };
const FALLS = { x: [60, 76], z: [40, 44] };
begin(HALL);
const PLAIN = text();
const SHIFT = { slope: true };
/** A stroke of Select from a place of the paper to another, with what it has at the first - and what is held down: Shift, or Ctrl. */
const stroke = (from, to, held) =>
  Object.assign({ tool: 'move', from, to }, { grabbed: { ...sketch.grab(from, 0.3), ...held } });
const undo = () => sketch.step(sketch.past, sketch.future);
/** A change of the sketch, which Undo takes back to the byte and redo makes again: the things it leaves. */
function done(act) {
  const before = text();
  act();
  const after = text();
  undo();
  const undone = text();
  sketch.step(sketch.future, sketch.past);
  assert.deepEqual([after === before, undone, text()], [false, before, after]);
  return things();
}
const select = (from, to, held) => done(() => sketch.apply(stroke(from, to, held)));
const drag = (from, to, held) => select(from, to, held).map(lies);
const pull = (from, to) => tops(select(from, to, SHIFT));
/** A pull that is none: the sketch is the text it was, and there is no step more to undo. */
function idle(from, to) {
  const was = [text(), sketch.past.length];
  sketch.apply(stroke(from, to, SHIFT));
  assert.deepEqual([text(), sketch.past.length], was);
}
/** A stroke of Select that Shift changes nothing of: with it and without, it leaves one and the same sketch. */
function shiftless(from, to) {
  const without = JSON.stringify(select(from, to));
  undo();
  assert.equal(JSON.stringify(select(from, to, SHIFT)), without);
  undo();
}

// --- the pull, along the plot -----------------------------------------------------------------------
await view('side', 'side');
// DOWN BY ROWS. The hall's downhill top corner, column 76 in row 40, pulled three rows down with
// Shift - and a cell sideways, which counts for nothing: that end of its top lies in row 43, and
// its uphill end at the hall's top. The slope is said from the hall's own two columns, the axis
// first, last in its box - and no other byte of the sketch is another.
assert.equal(pull([76, 40], [77.2, 43.4]), '{"x":[60,76],"z":[40,43]}');
assert.equal(text(), PLAIN.replace('"colour":1', '"colour":1,"slope":{"x":[60,76],"z":[40,43]}'));
// TO THE FLOOR AND NO LOWER. Twenty rows further down would be row 63: the end stops at the
// floor, row 48, and the hall is a wedge. Pulled down again, it is there already: no stroke.
assert.equal(pull([76, 40], [76, 60]), '{"x":[60,76],"z":[40,48]}');
idle([76, 40], [76, 45]);
// BACK TO THE TOP, and no higher. Twelve rows up from the floor would be row 36: the end stops
// at the hall's top, the hall says no slope, and the sketch has the bytes it had.
assert.deepEqual([pull([76, 40], [76, 28]), text()], ['level', PLAIN]);
// THE OTHER CORNER. The downhill end three rows down once more. The uphill corner lies at the
// hall's top and goes no higher: no stroke, and the slope stays. Two rows down, that end lies in
// row 42 and the other at the hall's top: it falls up the plot. Up again by two, it is level.
pull([76, 40], [76, 43]);
idle([60, 40], [60, 30]);
assert.equal(pull([60, 40], [60, 42]), '{"x":[60,76],"z":[42,40]}');
assert.deepEqual([pull([60, 40], [60, 38]), text()], ['level', PLAIN]);
// A PULL THAT ENDS IN THE ROW IT BEGAN IN is no stroke. Nor is it of a box cut out of the hall,
// whose top ends between two rows, in row 41.5: a row down from there, a whole row, is row 43.
idle([60, 40], [64, 40.4]);
begin({ ...HALL, x: [60, 66], slope: FALLS });
idle([66, 40], [67, 40.4]);
assert.equal(pull([66, 40], [66, 41]), '{"x":[60,66],"z":[40,43]}');
// ACROSS A SLOPE THAT RAN THE OTHER WAY. A top that falls across the plot shows this view its
// higher end, row 40, at both corners. The downhill one pulled two rows down from there, the
// top falls down the plot, and across it no more.
begin({ ...HALL, slope: { y: [30, 42], z: [44, 40] } });
assert.equal(pull([76, 40], [76, 42]), '{"x":[60,76],"z":[40,42]}');
// A BOX OF A BLOCK OF SEVERAL is pulled alone. An annex of 4 m stands downhill of the hall, one
// block with it: its downhill corner a row down, the annex has a top of its own, and the hall
// none. The corner the two share is the annex's, which lies on top: there it is pulled uphill.
begin({ ...HALL, group: 1 }, { ...HALL, x: [76, 84], group: 1 });
assert.equal(pull([84, 40], [84, 41]), 'level {"x":[76,84],"z":[40,41]}');
assert.equal(pull([76, 40], [76, 42]), 'level {"x":[76,84],"z":[42,40]}');
// WITHOUT SHIFT a corner makes the box larger, as it did: the annex 1 m longer and 1 m higher.
// Its slope goes with its top, two rows up, and stays at the two columns it was said at.
assert.equal(drag([84, 40], [86, 38])[1], '76,86 30,42 38,48 {"x":[76,84],"z":[40,38]} 40,38');
// ON AN EDGE AND ON THE MIDDLE OF A BOX Shift changes nothing of what Select does: the top edge
// of the hall a row up, the hall moved, a bottom corner pulled out. Nor on an OBJECT, a person
// beside the hall, taken at a top corner, nor on a label: no stroke on either pulls.
begin(HALL, { kind: 'person', x: 90, y: 36, floor: 48 });
shiftless([68, 40], [68, 39]);
shiftless([68, 44], [70, 45]);
shiftless([76, 48], [78, 50]);
const person = stroke([90, 44.5], [90, 47], SHIFT);
assert.deepEqual([person.grabbed.zone, sketch.pull(person)], ['move', false]);
assert.equal(sketch.pulled({ tool: 'label', from: [76, 40], to: [76, 43], label: 0 }), null);
// While a top is pulled the paper shows the line of the top as it will be, in ink: from the
// uphill end at the hall's top to the downhill end three rows down. Without Shift, none.
const pulling = sketch.pulled(stroke([76, 40], [76, 43], SHIFT));
assert.equal(JSON.stringify(pulling), '{"line":[[60,40],[76,43]],"colour":"ink"}');
assert.equal(sketch.pulled(stroke([76, 40], [76, 43])), null);

// --- what the strokes do with a box that slopes, along the plot ---------------------------------------
// MOVED 5 m down the plot and 1 m up, the hall has its plane where it went: ten columns on, two
// rows up. A COPY, with Ctrl, 4 m further down, has a slope of its own there: the hall's stays.
begin({ ...HALL, slope: FALLS });
const MOVED = '70,86 30,42 38,46 {"x":[70,86],"z":[38,42]} 38,42';
assert.equal(drag([68, 46], [78, 44])[0], MOVED);
const COPY = '78,94 30,42 38,46 {"x":[78,94],"z":[38,42]} 38,42';
assert.deepEqual(drag([78, 44], [86, 44], { copy: true }), [MOVED, COPY]);
undo();
// MADE LONGER at its downhill end by 4 m, the hall says the slope it said, and its top falls on
// along that plane, to row 44 at column 94: two rows further down than it was pulled to. MADE
// SHORTER by 6 m from there, it ends on the plane too, in row 41.
assert.equal(drag([86, 42], [94, 42])[0], '70,94 30,42 38,46 {"x":[70,86],"z":[38,42]} 38,44');
assert.equal(drag([94, 42], [82, 42])[0], '70,82 30,42 38,46 {"x":[70,86],"z":[38,42]} 38,41');
// ITS TOP EDGE moved 1 m up, the two rows go with the top. ITS FLOOR moved 1 m down, nothing of
// the slope changes. LIFTED WITH ITS LEVEL by 2 m, the plane is four rows up, as the hall is.
assert.equal(drag([76, 38], [76, 36])[0], '70,82 30,42 36,46 {"x":[70,86],"z":[36,40]} 36,39');
assert.equal(drag([76, 46], [76, 48])[0], '70,82 30,42 36,48 {"x":[70,86],"z":[36,40]} 36,39');
const lifted = done(() => sketch.shiftLevel(48, -4)).map(lies);
assert.deepEqual(lifted, ['70,82 30,42 32,44 {"x":[70,86],"z":[32,36]} 32,35']);
// CUT FROM THE SIDE - a doorway of 2 m, from row 44 down - the hall is three boxes of one block,
// and each says the plane the hall lay on: the part over the doorway falls along it to its own
// floor, row 44, and the two legs lie wholly under it, and are level.
begin({ ...HALL, slope: FALLS });
const cut = done(() => sketch.apply({ tool: 'erase', from: [66.5, 44.5], to: [69.5, 48.5] }));
assert.deepEqual(cut.map(lies), [
  '60,76 30,42 40,44 {"x":[60,76],"z":[40,44]} 40,44',
  '60,66 30,42 44,48 {"x":[60,76],"z":[40,44]} level',
  '70,76 30,42 44,48 {"x":[60,76],"z":[40,44]} level',
]);

// --- what is said, and what is drawn ---------------------------------------------------------------
// A canvas that keeps what is drawn in the hall's colour, at 10 pixels a cell: `fills`, a rect as
// its left, top, width and height and any other shape as its corners; `inks`, every line that is
// stroked, piece by piece; and `laid`, how far apart two columns lay as it was filled, and where
// the first. Whatever else a drawing asks of a canvas is done, and not kept.
function pictured() {
  const [fills, inks, mine] = [[], [], (style) => style === 'colour 1'];
  let [points, laid, filled] = [[], null, null];
  const fill = (shape, style) => mine(style) && fills.push(shape.join()) && (filled = laid);
  const pieces = () => points.flatMap((at, i) => (i % 2 ? [`${points[i - 1]},${at}`] : []));
  const pen = {
    setTransform: (...by) => (laid = [by[0], by[4]]),
    beginPath: () => (points = []),
    moveTo: (...at) => points.push(at),
    lineTo: (...at) => points.push(at),
    fillRect: (...rect) => fill(rect, pen.fillStyle),
    fill: () => fill(points, pen.fillStyle),
    stroke: () => mine(pen.strokeStyle) && inks.push(...pieces()),
  };
  const ctx = new Proxy(pen, { get: (target, key) => target[key] ?? (() => {}) });
  const layer = { ...sketch.layer(made.PLANE, sketch.on()), faded: false };
  made.draw({ style: {}, getContext: () => ctx }, { px: 10, layers: [layer], cuts: {} });
  return { fills: fills.join(' '), inks: inks.sort().join(' '), laid: filled };
}
// What the pad says of the box that is selected: of the hall its size, how its top falls, and how.
const words = (at = 0) => globalThis.footer.picked(things()[at]).words;
const said = (volume, more = '') =>
  `Block: a room, as it has no name. C changes it. 48 m² of floor, 8 m by 6 m, 4 m high, ${volume} m³. Its floor is 452 m above sea level.${more}`;
const falls = (way, from, to, whose = 'Its top') =>
  ` ${whose} falls ${way}, from ${from} m over its floor to ${to} m.`;
const HOW =
  ' With Shift held down, drag a top corner of a box down to slope its top, or back up to level it.';

// ALONG THE SLOPE the cut hall is filled under its top alone - the part over the doorway a wedge,
// the legs as they were - and the edge of the block runs along that top, with none where two of
// its boxes meet: by hand, nine pieces. The other side shows the same from behind. Of a box of
// several the pad says that the top is that box's: 2 m over its own floor, and down to it.
const along = pictured();
assert.equal(along.fills, '60,40,76,44,76,44,60,44 60,44,6,4 70,44,6,4');
const EDGE = '60,40,60,44 60,40,76,44 60,44,60,48 60,48,66,48 66,44,66,48 66,44,70,44';
assert.equal(along.inks, `${EDGE} 70,44,70,48 70,48,76,48 76,44,76,48`);
assert.deepEqual(along.laid, [10, 0]);
await view('far', 'side', true);
assert.deepEqual(pictured(), { ...along, laid: [-10, 1460] });
assert.ok(words().endsWith(falls('down the plot', 2, 0, 'The top of this box') + HOW));
assert.ok(words(1).endsWith(`above sea level.${HOW}`));
// Of every block a standing view says how to slope a top. FROM THE OTHER SIDE the pull is the same
// pull, on the same paper: four rows down, the hall is filled under one line, has four pieces
// of edge, and holds what is under its top - 3 m high in the mean.
begin(HALL);
assert.equal(words(), said(192) + HOW);
assert.equal(pull([76, 40], [76, 44]), '{"x":[60,76],"z":[40,44]}');
assert.equal(pictured().fills, '60,40,76,44,76,48,60,48');
assert.equal(pictured().inks, '60,40,60,48 60,40,76,44 60,48,76,48 76,44,76,48');
assert.equal(words(), said(144, falls('down the plot', 4, 2)) + HOW);

// --- across the plot --------------------------------------------------------------------------------
// The paper of the front and the back view runs along the rows of the top view: the hall lies on
// it from row 30 to row 42. THE PULL there says the slope from those two rows: of the hall that
// falls down the plot, the corner at row 42 four rows down - it falls across the plot, towards
// the south, and is filled under that top; the other corner six rows down, towards the north.
await view('end', 'end');
assert.equal(pull([42, 40], [42, 44]), '{"y":[30,42],"z":[40,44]}');
assert.equal(words(), said(144, falls('towards the south side', 4, 2)) + HOW);
assert.equal(pictured().fills, '30,40,42,44,42,48,30,48');
assert.equal(pull([30, 40], [30, 46]), '{"y":[30,42],"z":[46,40]}');
assert.equal(words(), said(120, falls('towards the north side', 4, 1)) + HOW);
// LOOKED AT ALONG ITS SLOPE the hall is filled up to its higher end, row 40, with a line across
// it at its lower, row 44. Its downhill half alone, which begins in row 42, is filled from there.
begin({ ...HALL, slope: FALLS });
assert.equal(pictured().fills, '30,40,12,8');
assert.equal(pictured().inks, '30,40,30,48 30,40,42,40 30,44,42,44 30,48,42,48 42,40,42,48');
begin({ ...HALL, x: [68, 76], slope: FALLS });
assert.equal(pictured().fills, '30,42,12,6');
assert.equal(pictured().inks, '30,42,30,48 30,42,42,42 30,44,42,44 30,48,42,48 42,42,42,48');
// MOVED 2 m across the plot and 1 m up, the hall has its plane two rows up, at the columns it
// was said at. Pulled there, a top that fell down the plot falls across it.
begin({ ...HALL, slope: FALLS });
assert.equal(drag([36, 44], [40, 42])[0], '60,76 34,46 38,46 {"x":[60,76],"z":[38,42]} 38,42');
assert.equal(pull([34, 38], [34, 39]), '{"y":[34,46],"z":[39,38]}');

// --- from above -------------------------------------------------------------------------------------
// Shift changes nothing there: a corner of the hall makes it larger. Of a level block every word
// is as it was, and a block that slopes says which way - and nothing of Shift.
await view('top', 'top');
begin(HALL);
shiftless([76, 30], [78, 28]);
assert.equal(words(), said(192));
// The hall shows whole, with an arrow in its ink down its top: half as long as the hall, a
// quarter of the way across it, with a head of a cell - from column 64 to column 72 in row 33.
// Up the plot it points the other way, and across the plot down a column. A level hall has none.
const BOX = '60,30,60,42 60,30,76,30 60,42,76,42';
begin({ ...HALL, slope: FALLS });
assert.equal(pictured().fills, '60,30,16,12');
assert.equal(pictured().inks, `${BOX} 64,33,72,33 71,32.5,72,33 71,33.5,72,33 76,30,76,42`);
assert.equal(words(), said(144, falls('down the plot', 4, 2)));
begin({ ...HALL, slope: { x: [60, 76], z: [44, 40] } });
assert.equal(pictured().inks, `${BOX} 65,32.5,64,33 65,33.5,64,33 72,33,64,33 76,30,76,42`);
assert.equal(words(), said(144, falls('up the plot', 4, 2)));
begin({ ...HALL, slope: { y: [30, 42], z: [40, 44] } });
assert.equal(pictured().inks, `${BOX} 63.5,38,64,39 64,33,64,39 64.5,38,64,39 76,30,76,42`);
begin(HALL);
assert.equal(pictured().inks, `${BOX} 76,30,76,42`);
// MOVED 2 m down the plot and 1 m across it, a plane is four columns on - or two rows on.
begin({ ...HALL, slope: FALLS }, { ...HALL, y: [50, 62], slope: { y: [50, 62], z: [44, 40] } });
assert.equal(drag([68, 36], [72, 38])[0], '64,80 32,44 40,48 {"x":[64,80],"z":[40,44]} 40,44');
assert.equal(drag([68, 56], [72, 58])[1], '64,80 52,64 40,48 {"y":[52,64],"z":[44,40]} 44,40');
// CUT FROM ABOVE - a well of 2 m by 2 m - the hall is four boxes of one block, which hold one and
// the same slope, the very object: each lies on the plane the hall lay on, and reads its own two
// ends off it. So no slope is changed in place: MOVED whole, a column up the plot, each piece has
// its own, a column back - and not four. MERGED with the block beside it, which has none, too.
begin({ ...HALL, slope: FALLS }, { ...HALL, x: [76, 80] });
sketch.apply({ tool: 'erase', from: [66.5, 34.5], to: [69.5, 37.5] });
const pieces = things().slice(0, 4);
assert.ok(pieces.every((piece) => piece.group === 1 && piece.slope === pieces[0].slope));
assert.equal(pieces.map((p) => blocks.topOf(p).rows).join(' '), '40,44 40,44 40,41.5 42.5,44');
const BACK = `${'{"x":[59,75],"z":[40,44]} '.repeat(4)}level`;
assert.equal(tops(select([62, 32], [61, 32])), BACK);
const merged = done(() => sketch.apply({ tool: 'merge', from: [74.5, 32.5], to: [78.5, 33.5] }));
assert.deepEqual([new Set(merged.map((piece) => piece.group)).size, tops()], [1, BACK]);

process.stdout.write('tools/sketch: a top is pulled, goes with its box, and shows in every view\n');
