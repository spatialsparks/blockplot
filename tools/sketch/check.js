// The sketch pad's one check: that every view shows one space - a stroke in one view is there in
// the others - how things are grabbed, moved and resized, what stands on a level and on a slice,
// how a block is cut and merged, undo, what is kept, and that the sketches of before come over. No browser, no site. From the root:
//   pnpm exec node tools/sketch/check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import './offline.js';
import { BEFORE, VERSION } from './check-golden.js';
import './check-blocks.js';
import './check-shapes.js';

// A browser's store, which takes no text longer than its limit.
const store = () => {
  const kept = new Map();
  return {
    kept,
    limit: Infinity,
    getItem: (key) => kept.get(key) ?? null,
    setItem(key, value) {
      if (value.length > this.limit) throw new Error('full');
      kept.set(key, value);
    },
  };
};
const [local, session] = [store(), store()];
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });

// A made-up paper, 71 rows across the plot, and ground that falls a row every ten columns
// down it and lies the same all the way across.
const SPANS = { top: [-5, 30.5], side: [440, 476] };
const groundRow = (column) => 40 + column / 10;
const made = { PLANE: 'side', CELL_M: 0.5, X0: -10, COLS: 146, ACROSS: 71, SPANS, groundRow };
// The paper of the plane that is drawn on, and where a place along a slice is from above.
Object.assign(made, { WIDE: 146, ROWS: 72 });
made.onSlice = (place, cut) => (made.PLANE === 'end' ? [cut, place] : [place, cut]);
globalThis.paper = made;

// The sketches of before: the side view's of coloured cells, the top view's of sheets of blocks.
const cells = {};
for (let x = 50; x < 70; x += 1) for (let y = 36; y < 42; y += 1) cells[`${x},${y}`] = 1;
const sideSheet = { name: 'Sheet 1', cells, lines: [[50, 30, 60, 26, 0]], labels: [] };
const sheets = [
  { name: 'Level 455 m', level: 455, blocks: [[52, 32, 60, 40, 4]], lines: [], labels: [] },
  { name: 'Sheet 1', blocks: [[10, 10, 14, 14, 2]], lines: [], labels: [[12, 12, 'Old']] },
];
const oldSide = JSON.stringify({ view: 'side', current: 0, sheets: [sideSheet, sideSheet] });
local.kept.set('blockplot/sketch/side', oldSide);
local.kept.set('blockplot/sketch/top', JSON.stringify({ view: 'top', current: 1, sheets }));

for (const one of ['figures', 'shapes', 'blocks', 'legacy', 'sketch', 'lines/model'])
  await import(`./${one}.js`);
await import('./strokes.js?side');
await import('./levels.js');
const { sketch, legacy } = globalThis;
const things = () => sketch.doc.things;
const rects = (view, key) => sketch.layer(view, key).things.map((entry) => entry.rect);

// They come over into one space, and stay in the browser as they were. The side view's block is
// a box 6 m deep about the middle of the plot; the level's block stands on its level, as high as that box;
// the block of a sheet without a level has no height, and stays flat on the ground.
assert.deepEqual(things(), [
  { x: [50, 70], y: [30, 42], z: [36, 42], colour: 1 },
  { x: [52, 60], y: [32, 40], z: [36, 42], colour: 4 },
]);
assert.deepEqual(sketch.doc.notes, [
  { view: 'side', at: 36, line: [50, 30, 60, 26, 0] },
  { view: 'top', at: 'ground', flat: [10, 10, 14, 14, 2] },
  { view: 'top', at: 'ground', label: [12, 12, 'Old'] },
]);
assert.equal(local.kept.get('blockplot/sketch/side'), oldSide);
assert.match(sketch.trouble, /1 other layers stay in this browser/);
assert.deepEqual(legacy.file({ view: 'top', current: 0, sheets: [sheets[0]] }).things, [
  { x: [52, 60], y: [32, 40], z: [36, 42], colour: 4 },
]);
assert.equal(legacy.file({ view: 'front', sheets: [] }), null);

// The layers. Level 455 m is the floor both boxes stand on. The side view's slice runs along
// the middle of the plot, through both; one further out runs through neither, and has nothing.
assert.deepEqual(sketch.keys(), [42, 'ground']);
assert.equal(sketch.nameOf('top', 42), 'Level 455 m');
assert.deepEqual(rects('top', 42), [
  [50, 30, 70, 42],
  [52, 32, 60, 40],
]);
assert.deepEqual(
  [sketch.on('side'), sketch.nameOf('side', 36)],
  [36, 'Slice 12.5 m across the plot'],
);
assert.equal(rects('side', 36).length, 2);
assert.deepEqual([rects('side', 29), rects('side', 42)], [[], []]);
assert.equal(sketch.on('top'), 42);

// --- from the side: what is done to a box is done to the box the top view shows --------------------
const COLOUR = 3;
const stroke = (tool, from, to, more) => sketch.apply({ tool, from, to, colour: COLOUR, ...more });
const zone = (x, y) => sketch.grab([x, y], 0.3)?.zone;
assert.deepEqual(
  [zone(70, 39), zone(65, 36.1), zone(50.1, 41.9), zone(65, 39), zone(80, 39)],
  ['e', 'n', 'sw', 'move', undefined],
);
// Shorter by 2 m at its downhill end, in the side view: shorter in the top view.
stroke('move', [70, 39], [66.2, 44], { grabbed: sketch.grab([70, 39], 0.3) });
assert.deepEqual(things()[0], { x: [50, 66], y: [30, 42], z: [36, 42], colour: 1 });
assert.deepEqual(rects('top', 42)[0], [50, 30, 66, 42]);
// A block drawn from the side is 6 m deep about the cut; a row up, it stands on its own level.
stroke('block', [80.5, 35.5], [89.5, 40.5]);
assert.deepEqual(things().at(-1), { x: [80, 90], y: [30, 42], z: [35, 41], colour: COLOUR });
assert.deepEqual(sketch.keys(), [41, 42, 'ground']);
// An object stands on what is nearest: the roof of a box, its floor, or the ground.
stroke('object', [63, 35.2], [63, 35.2], { kind: 'person' });
stroke('object', [100, 49], [100, 49], { kind: 'tree' });
assert.deepEqual(things().slice(-2), [
  { kind: 'person', x: 63, y: 36, floor: 36 },
  { kind: 'tree', x: 100, y: 36, floor: 'ground' },
]);
assert.deepEqual(sketch.rect(things().at(-1), 'side'), [94, 50 - 16, 106, 50]);
assert.deepEqual(sketch.rect(things().at(-2), 'side'), [63, 36 - 3.6, 64, 36]);
// Moved along the plot it stands on the ground again, lower down; a copy stays where it was put.
const tree = sketch.grab([100, 45], 0.3);
assert.equal(tree.zone, 'move');
stroke('move', [100, 45], [120, 45], { grabbed: { ...tree, copy: true } });
assert.deepEqual(things().at(-1), { kind: 'tree', x: 120, y: 36, floor: 'ground' });
assert.equal(sketch.rect(things().at(-1), 'side')[3], 52);
// A line and a label of the side view show wherever the cut runs.
sketch.apply({ tool: 'line', points: globalThis.lines.points([50, 36, 58, 32]), colour: COLOUR });
stroke('text', [60.2, 30.3], [60.2, 30.3], { text: 'Roof' });
assert.deepEqual(sketch.layer('side', 20).notes.slice(-2), [
  { view: 'side', at: 36, line: [50, 36, 58, 32, COLOUR] },
  { view: 'side', at: 36, label: [60, 30.5, 'Roof'] },
]);
// The eraser takes the thing on top at the pointer - from both views - or all that a box holds.
stroke('erase', [120, 45], [120, 45]);
assert.equal(things().filter((t) => t.kind === 'tree').length, 1);
stroke('erase', [78.5, 33.5], [92.5, 42.5]);
assert.deepEqual(sketch.keys(), [36, 42, 'ground']);

// --- from above: the same space ---------------------------------------------------------------------
Object.assign(made, { PLANE: 'top', ROWS: 71 });
await import('./strokes.js?top');
// The person on the roof made a level up there: the boxes stand a level lower.
sketch.doc.on.top = 42;
// Wider from above, and longer: the side view's box is longer, and a cut further out runs through it.
stroke('move', [50, 30], [48, 27], { grabbed: sketch.grab([50.1, 30.1], 0.3) });
assert.deepEqual(things()[0], { x: [48, 66], y: [27, 42], z: [36, 42], colour: 1 });
assert.deepEqual(rects('side', 36)[0], [48, 36, 66, 42]);
assert.deepEqual(rects('side', 28), [[48, 36, 66, 42]]);
// A block drawn on a level stands on it, as high as what stands there already.
stroke('block', [20.5, 50.5], [27.5, 55.5]);
assert.deepEqual(things().at(-1), { x: [20, 28], y: [50, 56], z: [36, 42], colour: COLOUR });
assert.deepEqual(rects('side', 52), [[20, 36, 28, 42]]);
// The ground takes objects, not blocks: a block has to stand on a level.
sketch.doc.on.top = 'ground';
const count = things().length;
stroke('block', [30.5, 50.5], [37.5, 55.5]);
assert.equal(things().length, count);
assert.match(sketch.trouble, /A block stands on a level/);
stroke('object', [30.2, 50.3], [30.2, 50.3], { kind: 'car' });
assert.deepEqual(things().at(-1), { kind: 'car', x: 30, y: 50.5, floor: 'ground' });
assert.deepEqual(rects('top', 'ground'), [
  [94, 30, 106, 42],
  [26, 49, 35, 53],
]);
// Turned by a quarter, the car stands across the plot; a click with Select leaves it as it stands.
sketch.turn(things().at(-1));
stroke('move', [30, 50], [30.2, 50.1], { grabbed: sketch.grab([30, 50], 0.3) });
assert.deepEqual(rects('top', 'ground')[1], [28, 46, 32, 55]);
// The old sketch's label and flat box lie on the ground, and go with a click each.
stroke('erase', [12.2, 12.2], [12.2, 12.2]);
stroke('erase', [12.2, 12.2], [12.2, 12.2]);
assert.deepEqual(sketch.layer('top', 'ground').notes, []);

// A level by hand, to draw on; a level lifted with all that stands on it; a level taken away.
assert.equal(sketch.newLevel(450), true);
assert.equal(sketch.newLevel(400), false);
assert.deepEqual([sketch.on('top'), sketch.keys()], [52, [36, 42, 52, 'ground']]);
sketch.shiftLevel(42, -1);
assert.deepEqual(things()[0].z, [35, 41]);
assert.deepEqual(sketch.keys(), [36, 41, 52, 'ground']);
sketch.removeLevel(41);
assert.deepEqual(
  things().map((t) => t.kind ?? 'box'),
  ['person', 'tree', 'car'],
);

// Undo brings back what was there, redo what was done, and each state is kept as it is made.
const was = JSON.stringify(sketch.doc);
sketch.step(sketch.past, sketch.future);
assert.equal(things().length, 6);
sketch.step(sketch.future, sketch.past);
assert.equal(JSON.stringify(sketch.doc), was);
assert.deepEqual(sketch.stored(), sketch.doc);
// The steps outlast the page: all of them, or the newest that the tab's store takes.
const [past, future] = [[...sketch.past], [...sketch.future]];
sketch.remember();
sketch.past.length = 0;
sketch.recall();
assert.deepEqual([sketch.past, sketch.future], [past, future]);
session.limit = JSON.stringify({ past: past.slice(-5), future }).length;
sketch.remember();
sketch.recall();
assert.deepEqual(sketch.past, past.slice(-5));

// --- blocks cut into shape, and merged ----------------------------------------------------------------
// The eraser's box is cut out of the block it reaches into: a stairwell out of a floor. What is
// left is one block still - and from the side, a cut through the stairwell runs through two boxes.
const on52 = () => things().filter((t) => t.z?.[1] === 52);
const area = (boxes) => boxes.reduce((sum, t) => sum + (t.x[1] - t.x[0]) * (t.y[1] - t.y[0]), 0);
sketch.doc.on.top = 52;
stroke('block', [60.5, 20.5], [69.5, 27.5]);
stroke('erase', [64.5, 23.5], [65.5, 25.5]);
assert.deepEqual([on52().length, area(on52())], [4, 80 - 6]);
assert.equal(new Set(on52().map((t) => t.group)).size, 1);
assert.notEqual(on52()[0].group, undefined);
assert.deepEqual(
  rects('side', 24).map((rect) => [rect[0], rect[2]]),
  [
    [60, 64],
    [66, 70],
  ],
);
assert.deepEqual(rects('side', 21), [[60, 46, 70, 52]]);
// Held by its middle the whole block moves; with Ctrl a copy does, a block of its own. A click
// of the eraser takes a whole block.
stroke('move', [61, 21], [63, 21], { grabbed: sketch.grab([61, 21], 0.3) });
assert.deepEqual([Math.min(...on52().map((t) => t.x[0])), on52().length], [62, 4]);
stroke('move', [63, 21], [63, 41], { grabbed: { ...sketch.grab([63, 21], 0.3), copy: true } });
assert.deepEqual([on52().length, new Set(on52().map((t) => t.group)).size], [8, 2]);
stroke('erase', [63.5, 41.5], [63.5, 41.5]);
assert.deepEqual([on52().length, area(on52())], [4, 74]);
// Merged, the blocks a stroke's box reaches into are one, of the first one's colour; where they
// lie in each other the later one gives way, so that the block is nowhere double.
stroke('block', [80.5, 20.5], [84.5, 24.5]);
sketch.apply({ tool: 'block', from: [83.5, 22.5], to: [89.5, 27.5], colour: 5 });
stroke('merge', [81.5, 21.5], [88.5, 26.5]);
const merged = on52().filter((t) => t.x[0] >= 80);
assert.deepEqual([new Set(merged.map((t) => t.group)).size, area(merged)], [1, 25 + 42 - 6]);
assert.deepEqual([...new Set(merged.map((t) => t.colour))], [COLOUR]);
assert.notEqual(merged[0].group, on52()[0].group);

// A window does not stand on its floor but 0.9 m over it; a staircase turns by quarters, and
// after four it lies as it lay.
assert.deepEqual(sketch.rect({ kind: 'window', x: 10, y: 10, floor: 42 }, 'side'), [
  9,
  42 - 1.8 - 3,
  12,
  42 - 1.8,
]);
sketch.doc.on.top = 'ground';
stroke('object', [20, 60], [20, 60], { kind: 'stairs' });
assert.deepEqual(sketch.rect(things().at(-1), 'top'), [16, 59, 25, 61]);
for (const quarter of [1, 2, 3, 0]) {
  sketch.turn(things().at(-1));
  assert.equal(things().at(-1).turn, quarter);
}
assert.deepEqual(sketch.rect({ ...things().at(-1), turn: 1 }, 'top'), [19, 56, 21, 65]);
// What shows on top is what the pointer takes, whichever was made first: an object lies over a
// block, and what is lifted - a window in a wall, a hob on a worktop - over what stands on the floor.
sketch.doc.on.top = 52;
for (const kind of ['window', 'bed']) stroke('object', [100, 10], [100, 10], { kind });
stroke('block', [98.5, 8.5], [101.5, 11.5]);
const lying = sketch.layer('top', 52).things.map((entry) => entry.thing.kind);
assert.deepEqual(lying.slice(-3), [undefined, 'bed', 'window']);
assert.equal(sketch.grab([100, 10], 0.3).at, lying.length - 1);

// A sketch of when the side view had three strips opens with the slice along the strip that was
// drawn on - the south-west one ran 6.5 m across the plot - and what it said of how a strip
// showed is gone. One of a space after it keeps its slice. Each is of the space of now once read.
const strips = { ...sketch.doc, space: 1, on: { side: 2 }, show: { side: { 0: 'hidden' } } };
local.kept.set(sketch.KEY, JSON.stringify(strips));
assert.deepEqual([sketch.stored().space, sketch.stored().on.side], [VERSION, 48]);
assert.deepEqual(sketch.stored().show, { top: {} });
const sliced = [...BEFORE, VERSION].map((space) => sketch.adopt({ ...strips, space }));
for (const s of sliced) assert.deepEqual([s.space, s.on.side, s.show], [VERSION, 2, { top: {} }]);

// What is no sketch is not read: one of before, a box without a height, no JSON, a space to come.
const lacking = `{"space":${VERSION},"things":[{"x":[1,2],"y":[1,2]}],"floors":[],"notes":[]}`;
for (const other of [oldSide, lacking, '?', JSON.stringify({ ...strips, space: VERSION + 1 })]) {
  local.kept.set(sketch.KEY, other);
  assert.equal(sketch.stored(), null, other);
}

// The slice across the plot, how large a block is, an object turned as it is set down.
await import('./check-slices.js');
process.stdout.write(
  'tools/sketch: one space in every view, strokes, levels, undo and storage hold\n',
);

// Then each *.check.js under this folder, by name, as its own script and on a clock of its own.
await import('./check-each.js');
