// The check of drawing that snaps to the grid shown (story ST-042, Rule 2; T-042.2), against
// figures worked out by hand on the made-up plot from above (demo-site.js: x = -4 + c/2 and
// y = 28 - r/2 at column c and row r, so at 5 m columns 8, 18, 28 ... and rows 6, 16 ... are
// lines). At 5 m: a box drawn - and the Eraser's box - covers the 5 m squares the stroke touches,
// an edge dragged lands on a 5 m line, a block moved goes by whole steps of 5 m, an object goes
// by the cell, and a line's point lands on the nearest 5 m point, with Alt to the centimetre. At
// 0.5 m each as before: the cell under the pointer. Every place stored is a whole number of
// cells, or Alt's centimetre (Rule 1). The pad's own scripts on a made-up store, the Line tool on
// a made-up canvas: no browser, nothing of the real site. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/snap.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

const store = (held = new Map()) => ({
  getItem: (key) => held.get(key) ?? null,
  setItem: (key, text) => held.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });
globalThis.location = { hash: '#top' };
// The Line tool's page, made up: a canvas and a document that keep what is heard on them, and
// the pointer, the palette and the views as far as the tool asks them.
const heard = (on = {}) => ({
  on,
  addEventListener: (name, does) => void (on[name] = does),
  setPointerCapture() {},
});
const canvas = heard();
const document = { ...heard(), getElementById: (id) => (id === 'paper' ? canvas : null) };
const pointer = { at: (event) => event.at, reach: () => 0.3 };
const made = { document, pointer, palette: { colour: () => 0 }, views: { typing: () => false } };
Object.assign(globalThis, made, { ownColours: {} });
const SCRIPTS = 'demo-site paper grid figures shapes blocks legacy sketch lines/model strokes';
for (const file of [...SCRIPTS.split(' '), 'lines/tool']) await import(`./${file}.js`);
const { SITE, grid, sketch, lineTool } = globalThis;
assert.equal(SITE.name, 'Made-up hillside plot');

// A block from above stands on a level: the level of row 20. The made-up plot's paper is 92
// columns by 62 rows, and a block goes past it as far as it is taken (blocks.reshape; ST-042):
// the box that is dragged and moved here is drawn 120 columns nearer than the stroke from
// (150.3, 20.4), on the same lines - as it was while the paper had an edge.
const blank = () => sketch.adopt({ ...sketch.blank(), floors: [20], on: { top: 20 } });
sketch.doc = blank();
const [FROM, TO] = [
  [150.3, 20.4],
  [189.6, 39.7],
];
const NEARER = [FROM, TO].map(([x, y]) => [x - 120, y]);
/** The box a stroke from `from` to `to` draws, as the sketch keeps it: its extents along and across. */
function drawn([from, to]) {
  sketch.apply({ tool: 'block', from, to, colour: 3 });
  const { x, y } = sketch.doc.things.at(-1);
  return { x, y };
}
/** What the Move tool makes of what lies at a place, dragged by `by`: how it is grabbed, and its rect. */
function dragged(at, by) {
  const grabbed = sketch.grab(at, 0.3);
  const to = [at[0] + by[0], at[1] + by[1]];
  return [grabbed.zone, sketch.moved({ tool: 'move', from: at, to, grabbed }).slice(0, 4)];
}

// AT 5 M. The box covers the 5 m squares the stroke touches: from the line at or before its low
// corner to the one past its high corner - and so does the Eraser's; its reach is the stroke's.
grid.shown = 5;
assert.deepEqual(sketch.shape({ from: FROM, to: TO }).cells, [148, 16, 198, 46]);
assert.deepEqual(sketch.shape({ from: TO, to: FROM }).cells, [148, 16, 198, 46]);
const reach = sketch.shape({ from: FROM, to: TO }).reach.map((v) => Number(v.toFixed(6)));
assert.deepEqual(reach, [150, 20.1, 189.9, 40]);
assert.deepEqual(drawn([FROM, TO]), { x: [148, 198], y: [16, 46] });
sketch.doc = blank();
assert.deepEqual(drawn(NEARER), { x: [28, 78], y: [16, 46] });
// Its east edge, dragged by 7.2 cells to 85.2, lands on the nearest line, 88; its corner by
// (7.2, -6.3) on (88, 6); the block, moved by 13 cells and 4, goes by 10 and none, by -16 by -20.
assert.deepEqual(dragged([78, 30], [7.2, 0]), ['e', [28, 16, 88, 46]]);
assert.deepEqual(dragged([78, 16], [7.2, -6.3]), ['ne', [28, 6, 88, 46]]);
assert.deepEqual(dragged([50, 30], [13, 4]), ['move', [38, 16, 88, 46]]);
assert.deepEqual(dragged([50, 30], [-16, 0]), ['move', [8, 16, 58, 46]]);
sketch.apply({ tool: 'move', from: [78, 30], to: [85.2, 30], grabbed: sketch.grab([78, 30], 0.3) });
assert.deepEqual(sketch.doc.things.at(-1).x, [28, 88]);
// An object goes by the cell under the pointer: a chair set down below the box, moved by -13.4.
const SET = [60.7, 52.2];
sketch.apply({ tool: 'object', kind: 'chair', from: SET, to: SET, turned: 0 });
const chair = sketch.doc.things.at(-1);
const [zone, rect] = dragged([chair.x, chair.y], [-13.4, 2.6]);
assert.equal(zone, 'move');
const by = rect.map((v, i) => v - sketch.rect(chair, 'top')[i]);
assert.deepEqual(by, [-13, 3, -13, 3]);
// RULE 1: every box the sketch keeps lies on whole cells.
const whole = () => sketch.doc.things.filter(sketch.isBox).flatMap((t) => [t.x, t.y, t.z].flat());
assert.ok(whole().every(Number.isInteger), `${whole()}`);

// A LINE'S POINT: the nearest point of the 5 m grid; with Alt, to the centimetre, as ST-039 made it.
lineTool.state('line', 20);
canvas.on.pointerdown({ button: 0, at: [30.2, 30.6], altKey: false, pointerId: 1 });
const lastPoint = (over) => lineTool.preview(over).line.at(-1);
assert.deepEqual(lineTool.preview(null).line, [[28, 26]]);
assert.deepEqual(lastPoint([12.9, 20.4]), [8, 16]);
canvas.on.pointermove({ altKey: true });
assert.deepEqual(lastPoint([12.9, 20.4]), [12.9, 20.4]);
assert.deepEqual(lastPoint([12.937, 20.4]), [12.94, 20.4]);
canvas.on.pointermove({ altKey: false });

// AT 0.5 M, AS BEFORE: the cell under the pointer.
grid.shown = 0.5;
assert.deepEqual(sketch.shape({ from: FROM, to: TO }).cells, [150, 20, 190, 40]);
sketch.doc = blank();
assert.deepEqual(drawn(NEARER), { x: [30, 70], y: [20, 40] });
assert.deepEqual(dragged([70, 30], [7.2, 0]), ['e', [30, 20, 77, 40]]);
assert.deepEqual(dragged([70, 20], [7.2, -6.3]), ['ne', [30, 14, 77, 40]]);
assert.deepEqual(dragged([50, 30], [13, 4]), ['move', [43, 24, 83, 44]]);
assert.deepEqual(lastPoint([12.9, 20.4]), [13, 20]);
assert.deepEqual(lastPoint([-0.2, 20.6]), [0, 21]);
assert.ok(!Object.is(lastPoint([-0.2, 20.6])[0], -0), 'never -0');
// ACROSS THE PAPER'S EDGE, column 92 (ST-042): a box drawn from 88.4 to 100.2 keeps columns 88 to
// 101; its east edge dragged 30.6 on lands on 132, its west edge 130.2 back on -42; moved by 300
// columns and -90.4 rows it goes as far; and kept moved, it lies there, every cell of it.
assert.deepEqual(
  drawn([
    [88.4, 20.4],
    [100.2, 39.7],
  ]),
  { x: [88, 101], y: [20, 40] },
);
assert.deepEqual(dragged([101, 30], [30.6, 0]), ['e', [88, 20, 132, 40]]);
assert.deepEqual(dragged([88, 30], [-130.2, 0]), ['w', [-42, 20, 101, 40]]);
assert.deepEqual(dragged([94, 30], [300, -90.4]), ['move', [388, -70, 401, -50]]);
sketch.apply({
  tool: 'move',
  from: [94, 30],
  to: [394, -60.4],
  grabbed: sketch.grab([94, 30], 0.3),
});
const { x: along, y: across } = sketch.doc.things.at(-1);
assert.deepEqual(
  [along, across],
  [
    [388, 401],
    [-70, -50],
  ],
);

assert.ok(whole().every(Number.isInteger), `${whole()}`);

process.stdout.write(
  'tools/sketch: a box, its edges and a line point snap to the grid shown - at 5 m to the 5 m lines, a block moved by 5 m steps, an object by the cell - and at 0.5 m to the cell, as before\n',
);
