// The check of objects dragged to their size (stories ST-034, ST-035), by hand: `endOf` of
// stretch.js - which end of a cupboard the pointer has, at each turn and each zone, and of a
// chair, and in a slice - and what Select does with it through strokes.js: a cupboard dragged at
// its east end three cells further, and back to its own length, with no `long` then; past 6 m
// and to nothing, held at 6 and at 0.5, its other end where it was; turned a quarter and dragged
// at its south end; a copy that keeps its length; a move that leaves a `long` written at its own
// length; a shelf grabbed at its side, and a cupboard grabbed at its end in the side view, moved
// and no longer. Then both sides: `endOf` of a bed, a staircase, a counter, a table and a chair,
// a thin object's corner; a bed by its side, a table by its corner, a thin desk by its corner, a
// staircase widened and lengthened, a bed turned, a move that keeps a `deep`, a copy that keeps both.
// Each drag one step, which Undo takes back to the byte. A made-up paper and store, as
// slopes-cut.check.js makes them. Alone:
// pnpm exec node tools/sketch/stretch.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });
// The paper of slopes-cut.check.js: 146 columns down the plot, 71 rows across it and 72 up, of
// half a metre. The ground lies far under the level drawn on, in row 70, and is never stood on.
const SPANS = { top: [-5, 30.5], side: [440, 476] };
const made = { CELL_M: 0.5, X0: -10, COLS: 146, ACROSS: 71, SPANS, INK: 'ink' };
made.groundRow = () => 70;
made.onSlice = (place, cut) => (made.PLANE === 'end' ? [cut, place] : [place, cut]);
globalThis.paper = made;
/** The scripts that read the plane once, loaded anew for a view. */
async function view(name, plane) {
  const [wide, rows] = [plane === 'end' ? 71 : 146, plane === 'top' ? 71 : 72];
  Object.assign(made, { PLANE: plane, FLIP: false, WIDE: wide, ROWS: rows });
  for (const one of ['strokes', 'stretch']) await import(`./${one}.js?${name}`);
}
for (const one of ['figures', 'shapes', 'categories', 'blocks', 'legacy', 'sketch'])
  await import(`./${one}.js`);
const { sketch, structuredClone } = globalThis;
const text = () => JSON.stringify(sketch.doc);
const things = () => sketch.doc.things;
// The level that is drawn on, row 46 of a standing view, and the slice along row 36 of the top
// view. A sketch is begun anew with the things it is to hold, and no step.
const ON = { top: 46, side: 36, end: 36 };
const begin = (...all) => {
  sketch.doc = sketch.adopt({ ...sketch.blank(), things: structuredClone(all), on: { ...ON } });
  [sketch.past.length, sketch.future.length] = [0, 0];
};
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
/** A stroke of Select from a place of the paper to another, with what it has at the first, and whether a copy is moved. */
const drag = (from, to, copy = false) =>
  sketch.apply({ tool: 'move', from, to, grabbed: { ...sketch.grab(from, 0.3), copy } });
/** Where an object lies on the paper of a plane, and what length it says. */
const lies = (t, plane = 'top') => `${sketch.rect(t, plane)} ${t.long ?? 'own'}`;

// A cupboard of its own 1 m on the level, two cells along the plot and one across: its middle at
// column 30 and row 36.5, so that it lies from column 29 to 31, rows 36 to 37 - in the slice.
const CUPBOARD = { kind: 'cupboard', x: 30, y: 36.5, floor: 46 };
// The same turned a quarter: one cell along the plot, two across, columns 30 to 31, rows 35 to 37.
const ACROSS = { kind: 'cupboard', x: 30.5, y: 36, floor: 46, turn: 1 };
const CHAIR = { kind: 'chair', x: 20, y: 36.5, floor: 46 };
const SHELF = { kind: 'shelf', x: 30, y: 36.5, floor: 46 };

await view('top', 'top');
// WHICH END. Along the plot its ends are east and west, and a corner counts as the end it lies
// at; across, north and south. Its sides and its middle move it - and so does every zone of a
// kind that takes no length.
const ZONES = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'move'];
const along = ['move', 'e', 'e', 'e', 'move', 'w', 'w', 'w', 'move'];
const turned = ['n', 'n', 'move', 's', 's', 's', 'move', 'n', 'move'];
for (const [turn, ends] of [along, turned, along, turned].entries()) {
  const ask = (zone) => sketch.endOf({ ...CUPBOARD, turn }, zone);
  assert.deepEqual(ZONES.map(ask), ends, `turned ${turn}`);
}
assert.deepEqual(
  ZONES.map((zone) => sketch.endOf(CHAIR, zone)),
  Array(9).fill('move'),
);
// By the pointer: a hair inside its east end, at its north-east corner, on its north side and
// on its middle; a chair at its east edge.
begin(CUPBOARD, CHAIR);
const grabbed = (at) => sketch.grab(at, 0.3)?.zone;
assert.deepEqual(
  [
    [30.9, 36.5],
    [31, 36],
    [30, 36.05],
    [30, 36.5],
    [20.95, 36.5],
  ].map(grabbed),
  ['e', 'e', 'move', 'move', 'move'],
);

// LONGER BY THREE CELLS, at its east end: 5 cells, 2.5 m. Its west end stays in column 29, and
// its middle goes half as far as the end, a cell and a half, to 31.5. Dragged back, it is its
// own 1 m and says no length: the sketch it was, byte for byte.
begin(CUPBOARD);
const PLAIN = text();
let [cupboard] = done(() => drag([30.95, 36.5], [33.95, 36.5]));
assert.equal(lies(cupboard), '29,36,34,37 2.5');
assert.equal(cupboard.x, 31.5);
[cupboard] = done(() => drag([33.95, 36.5], [30.95, 36.5]));
assert.equal(Object.hasOwn(cupboard, 'long'), false);
assert.equal(text(), PLAIN);
// At its west end, three cells further west: the east end stays in column 31.
[cupboard] = done(() => drag([29.05, 36.5], [26.05, 36.5]));
assert.equal(lies(cupboard), '26,36,31,37 2.5');

// HELD. Twenty cells past its east end is 11 m: it is 6 m, its west end where it was. Twenty
// past its west end the same, the east end staying. Dragged to nothing it keeps a cell, 0.5 m.
begin(CUPBOARD);
[cupboard] = done(() => drag([30.95, 36.5], [50.95, 36.5]));
assert.equal(lies(cupboard), '29,36,41,37 6');
begin(CUPBOARD);
[cupboard] = done(() => drag([29.05, 36.5], [9.05, 36.5]));
assert.equal(lies(cupboard), '19,36,31,37 6');
begin(CUPBOARD);
[cupboard] = done(() => drag([30.95, 36.5], [10.95, 36.5]));
assert.equal(lies(cupboard), '29,36,30,37 0.5');
// At the plot paper's east edge, column 146, a drag goes on past it - the paper has no edge
// (ST-042): ten cells on, 6.5 m, held at 6 m, to column 155.
begin({ ...CUPBOARD, x: 144 });
[cupboard] = done(() => drag([144.95, 36.5], [154.95, 36.5]));
assert.equal(lies(cupboard), '143,36,155,37 6');

// ACROSS. Turned a quarter, at its south end three rows down: 2.5 m, its north end in row 35.
begin(ACROSS);
[cupboard] = done(() => drag([30.5, 36.95], [30.5, 39.95]));
assert.equal(lies(cupboard), '30,35,31,40 2.5');
assert.deepEqual([cupboard.x, cupboard.y], [30.5, 37.5]);
[cupboard] = done(() => drag([30.5, 35.05], [30.5, 45.05]));
assert.equal(lies(cupboard), '30,39,31,40 0.5');

// A COPY KEEPS ITS LENGTH: the cupboard of 2.5 m copied two rows down, by its middle.
begin({ ...CUPBOARD, long: 2.5, x: 31.5 });
const [kept, copy] = done(() => drag([31.5, 36.5], [31.5, 38.5], true));
assert.deepEqual([lies(kept), lies(copy)], ['29,36,34,37 2.5', '29,38,34,39 2.5']);

// A MOVE LEAVES A LENGTH AS WRITTEN: a `long` of the cupboard's own 1 m, written by hand, stays
// when it is moved by its middle two rows down.
begin({ ...CUPBOARD, long: 1 });
[cupboard] = done(() => drag([30, 36.5], [30, 38.5]));
assert.equal(lies(cupboard), '29,38,31,39 1');

// ITS SIDE MOVES IT. A shelf grabbed at its north side and dragged two rows down is moved, as
// long as it was; a chair at its east edge, three cells on, too.
begin(SHELF, CHAIR);
const [shelf] = done(() => drag([30, 36.05], [30, 38.05]));
assert.equal(lies(shelf), '29,38,31,39 own');
const [, chair] = done(() => drag([20.95, 36.5], [23.95, 36.5]));
assert.equal(lies(chair), '23,36,24,37 own');

// BOTH SIDES (ST-035). A bed of its own 2 m by 2 m, columns 28 to 32 and rows 36 to 40; a table
// of its own 2 m by 1 m, columns 58 to 62 and rows 35 to 37; a staircase of 4.5 m by 1 m,
// columns 86 to 95 and rows 36 to 38. A depth's sides are north and south along the plot, east
// and west turned a quarter; a corner holds both where the kind takes both, and counts as the
// end or the side it lies at where it takes one.
const sized = (t) => `${sketch.rect(t, 'top')} ${t.long ?? 'own'} ${t.deep ?? 'own'}`;
const BED = { kind: 'bed', x: 30, y: 38, floor: 46 };
const TABLE = { kind: 'table', x: 60, y: 36, floor: 46 };
const STAIRS = { kind: 'stairs', x: 90.5, y: 37, floor: 46 };
const COUNTER = { kind: 'counter', x: 30, y: 36.5, floor: 46 };
const ofEach = (thing, turn) => ZONES.map((zone) => sketch.endOf({ ...thing, turn }, zone));
for (const turn of [0, 1, 2, 3]) {
  const [lengthwise, crosswise] = turn % 2 === 0 ? [along, turned] : [turned, along];
  assert.deepEqual(ofEach(BED, turn), crosswise, `a bed turned ${turn}`);
  assert.deepEqual(ofEach(STAIRS, turn), ZONES, `a staircase turned ${turn}`);
  assert.deepEqual(ofEach(COUNTER, turn), lengthwise, `a counter turned ${turn}`);
  assert.deepEqual(ofEach(TABLE, turn), ZONES, `a table turned ${turn}`);
  assert.deepEqual(ofEach(CHAIR, turn), Array(9).fill('move'), `a chair turned ${turn}`);
}
// A THIN OBJECT'S CORNER. On a desk one cell deep it is the end it lies at; on one a cell long
// - which no kind of the table may be, asked of `endOf` alone - the side.
const THIN = ['n', 'e', 'e', 'e', 's', 'w', 'w', 'w', 'move'];
assert.deepEqual(ofEach({ kind: 'desk', deep: 0.5 }, 0), THIN);
const SHORT = ['n', 'n', 'e', 's', 's', 's', 'w', 'n', 'move'];
assert.deepEqual(ofEach({ kind: 'desk', long: 0.5 }, 0), SHORT);

// A BED BY ITS SIDE. Its south side one row in: 1.5 m deep, its north side in row 36 still,
// its middle half a row up. Back out, its own 2 m: no `deep`, the sketch it was to the byte.
// One row further out it is held at 2 m: nothing changes, and there is no step. At its north
// side two rows in, past its range: held at 1 m, its south side in row 40.
begin(BED);
const BARE = text();
assert.equal(sketch.grab([30, 39.95], 0.3).zone, 's');
let [bed] = done(() => drag([30, 39.95], [30, 38.95]));
assert.deepEqual([sized(bed), bed.y], ['28,36,32,39 own 1.5', 37.5]);
[bed] = done(() => drag([30, 38.95], [30, 39.95]));
assert.deepEqual([Object.hasOwn(bed, 'deep'), text()], [false, BARE]);
const steps = sketch.past.length;
drag([30, 39.95], [30, 40.95]);
assert.deepEqual([text(), sketch.past.length], [BARE, steps]);
[bed] = done(() => drag([30, 36.05], [30, 39.05]));
assert.equal(sized(bed), '28,38,32,40 own 1');

// A TABLE BY ITS CORNER, one cell out each way: 2.5 m by 1.5 m, its north-west corner where it
// was. Far past both ranges: held at 4 m and at 1.5 m.
begin(TABLE);
assert.equal(sketch.grab([61.95, 36.95], 0.3).zone, 'se');
let [table] = done(() => drag([61.95, 36.95], [62.95, 37.95]));
assert.deepEqual([sized(table), table.x, table.y], ['58,35,63,38 2.5 1.5', 60.5, 36.5]);
begin(TABLE);
[table] = done(() => drag([61.95, 36.95], [81.95, 46.95]));
assert.equal(sized(table), '58,35,66,38 4 1.5');

// A DESK ONE CELL DEEP, columns 59 to 62 and row 36, grabbed at its south-east corner and
// dragged a cell out each way: it is 2 m long and as deep as it was.
begin({ kind: 'desk', deep: 0.5, x: 60.5, y: 36.5, floor: 46 });
assert.equal(sketch.grab([61.95, 36.95], 0.3).zone, 'e');
const [desk] = done(() => drag([61.95, 36.95], [62.95, 37.95]));
assert.equal(sized(desk), '59,36,63,37 2 0.5');

// A STAIRCASE. Its south side two rows out: 2 m wide, its north side in row 36. Its east end
// three cells out makes it 6 m long, its west end where it was, and it says its length (ST-037).
begin(STAIRS);
let [stairs] = done(() => drag([90, 37.95], [90, 39.95]));
assert.equal(sized(stairs), '86,36,95,40 own 2');
assert.equal(sketch.grab([94.95, 38], 0.3).zone, 'e');
[stairs] = done(() => drag([94.95, 38], [97.95, 38]));
assert.equal(sized(stairs), '86,36,98,40 6 2');

// TURNED A QUARTER, a bed's depth runs along the plot: its east side a cell in, 1.5 m, its west
// side in column 28.
begin({ ...BED, turn: 1 });
assert.equal(sketch.grab([31.95, 38], 0.3).zone, 'e');
[bed] = done(() => drag([31.95, 38], [30.95, 38]));
assert.deepEqual([sized(bed), bed.x], ['28,36,31,40 own 1.5', 29.5]);

// A MOVE LEAVES A DEPTH AS WRITTEN: a `deep` of the bed's own 2 m, written by hand, stays when
// the bed is moved by its middle. A COPY KEEPS BOTH SIZES: a table of 2.5 m by 1.5 m copied
// four rows down.
begin({ ...BED, deep: 2 });
[bed] = done(() => drag([30, 38], [33, 38]));
assert.equal(sized(bed), '31,36,35,40 own 2');
begin({ ...TABLE, long: 2.5, deep: 1.5, x: 60.5, y: 36.5 });
const both = done(() => drag([60.5, 36.5], [60.5, 40.5], true)).map(sized);
assert.deepEqual(both, ['58,35,63,38 2.5 1.5', '58,39,63,42 2.5 1.5']);

// NOT IN A SLICE. Along row 36, standing on the floor of a room under it, the cupboard is
// grabbed at its east end: it is moved three cells, and is no longer - nor does stretch.js lay
// a length here.
await view('side', 'side');
const ROOM = { x: [20, 60], y: [30, 42], z: [40, 46], colour: 1 };
begin(ROOM, CUPBOARD);
assert.deepEqual([sketch.endOf(CUPBOARD, 'e'), sketch.endOf(TABLE, 'se')], ['move', 'move']);
assert.equal(sketch.grab([30.95, 44], 0.3).zone, 'move');
[, cupboard] = done(() => drag([30.95, 44], [33.95, 44]));
assert.equal(lies(cupboard, 'side'), '32,42,34,46 own');
assert.equal(cupboard.floor, 46);
const rect = [32, 42, 37, 46];
assert.equal(sketch.stretch(cupboard, rect), rect);
assert.equal(Object.hasOwn(cupboard, 'long'), false);

process.stdout.write('stretch: ends, lengths, holds, turns, copies, sides and slices hold\n');
