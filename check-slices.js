// The last part of the sketch pad's check - check.js runs it at its end, on a sketch begun
// anew: how large a block is - under a top that slopes, too - and how high it is drawn, what is
// written on blocks and beside them, what a block is set to count as and what the pad says of
// it, the slice across the plot, an object turned as it is set down, and objects on the grid.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NO_SLOPES } from './check-blocks.js';
import { VERSION } from './check-golden.js';

const { sketch, paper, blocks } = globalThis;
const COLOUR = 3;
const things = () => sketch.doc.things;
const rects = (plane, key) => sketch.layer(plane, key).things.map((entry) => entry.rect);
const stroke = (tool, from, to, more) => sketch.apply({ tool, from, to, colour: COLOUR, ...more });

// --- how large a block is ---------------------------------------------------------------------------
// From above: a floor of 5 m by 4 m on the level at 455 m, a storey high, and a stairwell of 1 m
// by 1.5 m cut out of it. The four boxes that are left are one block, and are measured as one.
sketch.doc = sketch.adopt(sketch.blank());
assert.deepEqual([sketch.blank().space, sketch.doc.space], [VERSION, VERSION], 'a new sketch');
sketch.newLevel(455);
stroke('block', [60.5, 20.5], [69.5, 27.5]);
stroke('erase', [64.5, 23.5], [65.5, 25.5]);
const floor = { boxes: 4, area: 18.5, long: 5, wide: 4, high: 3, volume: 55.5, floor: 455 };
assert.deepEqual(sketch.stats(things()[0]), floor);
assert.deepEqual(sketch.blockOf(things()[3]), things());
// Two storeys, one over the other and made one block from the side, cover their floor once.
const storey = (z) => ({ x: [0, 4], y: [0, 4], z, colour: 1, group: 9 });
sketch.doc.things.push(storey([10, 16]), storey([4, 10]));
const tower = { boxes: 2, area: 4, long: 2, wide: 2, high: 6, volume: 24, floor: 468 };
assert.deepEqual(sketch.stats(things().at(-1)), tower);
sketch.doc.things.length = 4;
// A top that slopes takes away from what a block holds, and from nothing else it is measured
// by. A hall of 8 m by 4 m, 4 m high: level, it holds 128 m³. Under a top that falls 2 m down
// the plot, from row 12 to row 16, it is 3 m high in the mean: 96 m³ - and so whichever way the
// top falls, along the plot or across it. As a wedge, down to its floor, 64 m³: half of it.
const hall = { x: [30, 46], y: [20, 28], z: [12, 20], colour: 1 };
const level = { boxes: 1, area: 32, long: 8, wide: 4, high: 4, volume: 128, floor: 466 };
const FALLS = { x: [30, 46], z: [12, 16] };
const sized = (slope) => sketch.stats({ ...hall, slope });
assert.deepEqual(sketch.stats(hall), level);
assert.deepEqual(sized(FALLS), { ...level, volume: 96 });
assert.deepEqual(sized({ x: [30, 46], z: [16, 12] }), { ...level, volume: 96 });
assert.deepEqual(sized({ y: [20, 28], z: [16, 12] }), { ...level, volume: 96 });
assert.deepEqual(sized({ x: [30, 46], z: [12, 20] }), { ...level, volume: 64 });
// Cut in two across the slope, each half keeps what the box said and lies on the same plane:
// 3.5 m and 2.5 m high in the mean, 56 m³ and 40 m³ - one block, which holds what the whole
// held. A third box of the block that says nothing is level, and counts whole: 16 m³ more.
const halves = [30, 38].map((from) => ({ ...hall, x: [from, from + 8], group: 9, slope: FALLS }));
sketch.doc.things.push(...halves);
assert.deepEqual(sketch.stats(halves[0]), { ...level, boxes: 2, volume: 96 });
sketch.doc.things.push({ ...hall, x: [46, 48], group: 9 });
const longer = { boxes: 3, area: 36, long: 9, wide: 4, high: 4, volume: 112, floor: 466 };
assert.deepEqual(sketch.stats(halves[1]), longer);
sketch.doc.things.length = 4;
// What is no slope says nothing, each kind of it (check-blocks.js): a sketch with a box for
// each is read all the same, and written again it is the bytes that were read - the field stays
// as it was written - while every box of it is level, and measured as the level hall. So with
// what says a slope: the sketch that is read is the sketch that is written, `slope` last.
const written = (boxes) =>
  `{"space":${VERSION},"things":${JSON.stringify(boxes)},"floors":[],"notes":[],"on":{},"show":{"top":{}}}`;
const boxed = (slopes) => slopes.map((slope) => ({ ...hall, slope }));
const silent = written(boxed(Object.values(NO_SLOPES).flat()));
const unsloped = sketch.adopt(JSON.parse(silent));
assert.equal(JSON.stringify(unsloped), silent);
assert.ok(unsloped.things.length > 40 && silent.includes('"slope":{"x":"30,46","z":[12,16]}'));
for (const box of unsloped.things) {
  assert.deepEqual([blocks.topOf(box), sketch.stats(box)], [null, level], JSON.stringify(box));
}
const saying = written(boxed([FALLS]));
assert.equal(JSON.stringify(sketch.adopt(JSON.parse(saying))), saying);
assert.ok(saying.includes('"colour":1,"slope":{"x":[30,46],"z":[12,16]}}],"floors"'));
// Drawn from above, a block's floor is the level drawn on, and it is a storey high - or as high
// as is asked for, by half metres, and 99 m from row 42 up to row -156: the paper has no edge.
const drawn = (high) => {
  stroke('block', [90.5, 20.5], [93.5, 23.5], { high });
  return sketch.doc.things.pop().z;
};
assert.deepEqual(
  [drawn(), drawn(2.4), drawn(0.1), drawn(99)],
  [
    [36, 42],
    [37, 42],
    [41, 42],
    [-156, 42],
  ],
);
// The wide staircase is set down as every object is, by its middle and on whole cells: nine
// along the plot by three across it, and six rows high in either slice - 4.5 m by 1.5 m, a
// storey high. Turned by a quarter, it lies on three cells by nine. So lies the one of the
// golden file that holds every field, and its sink a row up from it: neither lies in the other.
stroke('object', [38.7, 17.4], [38.7, 17.4], { kind: 'widestairs' });
const wide = sketch.doc.things.pop();
assert.deepEqual(wide, { kind: 'widestairs', x: 38.5, y: 17.5, floor: 42 });
assert.deepEqual(sketch.rect(wide, 'top'), [34, 16, 43, 19]);
assert.deepEqual(sketch.rect(wide, 'side'), [34, 36, 43, 42]);
assert.deepEqual(sketch.rect(wide, 'end'), [16, 36, 19, 42]);
assert.deepEqual(sketch.rect({ ...wide, turn: 1 }, 'top'), [37, 13, 40, 22]);
assert.deepEqual(sketch.rect({ kind: 'sink', x: 41, y: 15.5, floor: 42 }, 'top'), [40, 15, 42, 16]);

// --- what is written --------------------------------------------------------------------------------
// A block's name is every box's of it, and is asked of any of them; no name takes it away again.
await import('./labels.js');
sketch.name(things()[0], 'Hall');
assert.deepEqual(
  things().map((box) => box.name),
  ['Hall', 'Hall', 'Hall', 'Hall'],
);
assert.deepEqual([sketch.named(things()[3]), sketch.boxAt([65, 24])], ['Hall', undefined]);
assert.equal(sketch.boxAt([61, 21]), things()[0]);
sketch.name(things()[1], '');
assert.equal(sketch.named(things()[0]), undefined);
// So with its colour: a block is painted whole, and an undo has it as it was.
sketch.paint(things()[2], 7);
assert.deepEqual([...new Set(things().map((box) => box.colour))], [7]);
sketch.step(sketch.past, sketch.future);
assert.deepEqual([...new Set(things().map((box) => box.colour))], [COLOUR]);
// A step is read as a sketch is. One that this pad cannot read - a tab kept it from a pad to
// come - is no step: Undo drops it, and the sketch stays as it is, with nothing more to redo.
// One of the version before is undone to as a sketch of now: what the pad then keeps says VERSION.
// (The first figure of a sketch's text is its space.)
const kept = () => globalThis.localStorage.getItem(sketch.KEY);
const [stays, undo, redo] = [kept(), sketch.past.length, sketch.future.length];
sketch.past.push(...[-1, 1].map((by) => stays.replace(/\d+/, String(VERSION + by))));
sketch.step(sketch.past, sketch.future);
assert.deepEqual([kept(), sketch.past.length, sketch.future.length], [stays, undo + 1, redo]);
sketch.step(sketch.past, sketch.future);
assert.deepEqual([kept(), sketch.past.length, sketch.future.length], [stays, undo, redo + 1]);
// A label lies where it was put until it is moved: as far as the stroke went, by half cells.
stroke('text', [70.2, 30.3], [70.2, 30.3], { text: 'Garden' });
assert.deepEqual([sketch.labelAt([70.8, 30.9]), sketch.labelAt([72, 30.5])], [0, -1]);
sketch.moveLabel(0, [70.8, 30.9], [74.1, 28.2]);
assert.deepEqual(sketch.doc.notes, [{ view: 'top', at: 42, label: [73.5, 28, 'Garden'] }]);
sketch.doc.notes.length = 0;

// --- what a block counts as -------------------------------------------------------------------------
// It is said as a name is: on every box of the block, and on nothing else - not on the block
// beside it, and not on an object. A box that says it is read before the name, and against it:
// a roof terrace that is set to a room. Taken away, the name counts again, and the sketch is
// byte for byte what it was before it was set.
const text = () => JSON.stringify(sketch.doc);
const plain = text();
sketch.doc.things.push(
  { x: [80, 84], y: [20, 24], z: [36, 42], colour: 1, name: 'Garden' },
  { kind: 'bed', x: 90, y: 30, floor: 42 },
);
sketch.name(things()[0], 'Roof terrace');
const named = text();
const counts = (at) => Object.values(blocks.countsAs(sketch.blockOf(things()[at]))).join(' by ');
assert.equal(counts(3), 'open by name');
sketch.count(things()[2], 'room');
const set = JSON.parse(named);
for (const box of set.things.slice(0, 4)) box.is = 'room';
assert.equal(text(), JSON.stringify(set));
assert.deepEqual([counts(3), counts(4)], ['room by is', 'open by name']);
sketch.count(things()[1]);
assert.equal(text(), named);
assert.equal(counts(0), 'open by name');
// One step of Undo brings back what was: what was set before, and then nothing set.
sketch.count(things()[0], 'glass');
sketch.count(things()[3], 'room');
sketch.step(sketch.past, sketch.future);
assert.equal(counts(1), 'glass by is');
sketch.step(sketch.past, sketch.future);
assert.equal(text(), named);
// An object has nothing to count as: it is left as it is, and no step is made to undo.
const steps = [...sketch.past];
sketch.count(things()[5], 'glass');
sketch.countNext(things()[5]);
assert.deepEqual([text(), sketch.past], [named, steps]);
// The key C goes a step on, by whichever box the block is held: read from its name, then set - a
// room, open air, glass, ground, a cut - and by its name again, with the sketch byte for byte as
// it was: six steps. Undo goes the same way back. A block without a name is a room at both ends.
const BY_HAND = ['room by is', 'open by is', 'glass by is', 'ground by is', 'cut by is'];
const round = (boxes) =>
  boxes.map((box) => {
    sketch.countNext(things()[box]);
    return counts(boxes[0]);
  });
assert.deepEqual(round([0, 1, 2, 3, 0, 1]), [...BY_HAND, 'open by name']);
assert.equal(text(), named);
const back = [1, 2, 3, 4, 5, 6].map(() => {
  sketch.step(sketch.past, sketch.future);
  return counts(0);
});
assert.deepEqual(back, [...BY_HAND.toReversed(), 'open by name']);
assert.equal(text(), named);
sketch.name(things()[4], '');
const nameless = text();
assert.deepEqual(round([4, 4, 4, 4, 4, 4]), [...BY_HAND, 'room by name']);
assert.equal(text(), nameless);
// Of page.js, which wants a whole page to load, the text alone: C is a key of its own, though
// not with Alt, and takes that step of what is selected, whatever tool is on - where nothing is
// selected, of nothing. The two lines of its branch, comments aside, and that it ends with them.
const lines = readFileSync(`${import.meta.dirname}/page.js`, 'utf8').split('\n');
const code = lines.map((line) => line.trim()).filter((line) => !line.startsWith('//'));
const BRANCH = [
  "} else if (!event.altKey && key === 'c') {",
  'if (picked) sketch.countNext(picked);',
];
const where = code.indexOf(BRANCH[0]);
assert.deepEqual(code.slice(where, where + 2), BRANCH, 'the key C, in page.js');
assert.match(code[where + 2], /^\}/, 'the key C takes a step, and does nothing else');

// What the pad says of a block that is selected, before how large it is: what it counts as and
// by what - its name, no name, or what was set - and that C changes it. The words are
// footer.js's, which asks the paper for a number as text - on the made-up paper, the number -
// and for the side of the plot that the top view measures from.
Object.assign(paper, { exact: String, wind: () => 'north' });
globalThis.SITE = { bearingDeg: 0 };
await import('./footer.js');
const said = (at) => globalThis.footer.picked(things()[at]).words;
const HALL = '18.5 m² of floor, 5 m by 4 m, 3 m high, 55.5 m³. Its floor is 455 m above sea level.';
const BESIDE = '4 m² of floor, 2 m by 2 m, 3 m high, 12 m³. Its floor is 455 m above sea level.';
assert.equal(said(3), `Roof terrace: open air, by its name. C changes it. ${HALL}`);
assert.equal(said(4), `Block: a room, as it has no name. C changes it. ${BESIDE}`);
// Set, a block says so: against its name - a roof terrace that is a room - and with it.
for (const [as, what] of Object.entries({ room: 'a room', open: 'open air', glass: 'glass' })) {
  sketch.count(things()[0], as);
  assert.equal(said(3), `Roof terrace: ${what}, set by hand. C changes it. ${HALL}`);
  sketch.count(things()[4], as);
  assert.equal(said(4), `Block: ${what}, set by hand. C changes it. ${BESIDE}`);
}
// A name that holds none of the words is a room's, by its name too; a greenhouse is glass.
sketch.count(things()[0]);
for (const [name, what] of Object.entries({ Hall: 'a room', 'Greenhouse 2': 'glass' })) {
  sketch.name(things()[1], name);
  assert.equal(said(2), `${name}: ${what}, by its name. C changes it. ${HALL}`);
}
sketch.name(things()[0], '');
assert.equal(said(0), `Block of 4 boxes: a room, as it has no name. C changes it. ${HALL}`);
// With the block beside it and the bed gone again, nothing is left of all that was set.
sketch.doc.things.length = 4;
assert.equal(text(), plain);

// --- the slice across the plot --------------------------------------------------------------------
// It runs down the middle of the paper until it is moved, along a column of the top view, and
// has what it runs through and nothing else: through the stairwell, the floor to either side.
Object.assign(paper, { PLANE: 'end', WIDE: 71, ROWS: 72 });
await import('./strokes.js?end');
assert.deepEqual([sketch.on('end'), sketch.nameOf('end', 73)], [73, 'Slice 26.5 m down the plot']);
assert.deepEqual(rects('end', 73), []);
assert.deepEqual(rects('end', 62), [
  [20, 36, 23, 42],
  [26, 36, 28, 42],
  [23, 36, 26, 42],
]);
assert.deepEqual(rects('end', 65), [
  [20, 36, 23, 42],
  [26, 36, 28, 42],
]);
// A block drawn on the slice reaches 3 m to either side of it, along the plot; an object stands
// in the slice, on what is nearest - here the block's roof.
sketch.doc.on.end = 100;
stroke('block', [30.5, 35.5], [39.5, 40.5]);
assert.deepEqual(things().at(-1), { x: [94, 106], y: [30, 40], z: [35, 41], colour: COLOUR });
stroke('object', [35.2, 34.8], [35.2, 34.8], { kind: 'person' });
assert.deepEqual(things().at(-1), { kind: 'person', x: 100, y: 35, floor: 35 });
assert.deepEqual(sketch.rect(things().at(-1), 'end'), [35, 35 - 3.6, 36, 35]);
// Moved along the slice, the block is moved across the plot: so the top view has it.
stroke('move', [35, 38], [31, 38], { grabbed: sketch.grab([35, 38], 0.3) });
assert.deepEqual(sketch.rect(things().at(-2), 'top'), [94, 26, 106, 36]);
// Narrower by a metre at the edge that is grabbed; the slice along the plot has it so too.
stroke('move', [36, 38], [34, 38], { grabbed: sketch.grab([36, 38], 0.3) });
assert.deepEqual(things().at(-2).y, [26, 34]);
assert.deepEqual(rects('side', 30), [[94, 35, 106, 41]]);
// A line and a label of the slice are kept with it, apart from the other slice's.
sketch.apply({ tool: 'line', points: globalThis.lines.points([26, 35, 30, 33]), colour: COLOUR });
assert.deepEqual(sketch.layer('end', 20).notes, [
  { view: 'end', at: 100, line: [26, 35, 30, 33, COLOUR] },
]);
assert.deepEqual(sketch.layer('side', 30).notes, []);

// --- an object, turned ------------------------------------------------------------------------------
// It is set down as it was turned beforehand, and a quarter on from there. A staircase shows
// its length to the slice along the plot and its width to the one across it, until it is turned.
stroke('object', [50, 41], [50, 41], { kind: 'stairs', turned: 3 });
const stairs = things().at(-1);
assert.deepEqual([stairs.turn, stairs.x, stairs.y], [3, 100, 50]);
sketch.turn(stairs);
assert.equal(stairs.turn, 0);
assert.deepEqual(sketch.rect({ ...stairs, floor: 42 }, 'end'), [49, 36, 51, 42]);
assert.deepEqual(sketch.rect({ ...stairs, floor: 42 }, 'side'), [96, 36, 105, 42]);
assert.deepEqual(sketch.rect({ ...stairs, floor: 42, turn: 1 }, 'end'), [46, 36, 55, 42]);

// --- an object on the grid --------------------------------------------------------------------------
// What is whole cells long fills whole cells, as near as may be to where it was put, however it
// is turned - and on the floor every kind is whole cells. A window alone is thinner than a cell:
// it lies about the line it was put on.
const lying = (kind, x, y, turn) => sketch.rect({ kind, x, y, floor: 42, turn }, 'top');
assert.deepEqual(lying('hob', 52, 38), [52, 38, 53, 39]);
assert.deepEqual(lying('counter', 52, 30.5), [50, 30, 55, 31]);
assert.deepEqual(lying('counter', 52, 30.5, 1), [52, 28, 53, 33]);
for (const kind of Object.keys(globalThis.shapes.KINDS).filter((name) => name !== 'window')) {
  assert.ok(lying(kind, 20.5, 30).every(Number.isInteger), `a ${kind} fills whole cells`);
  assert.ok(lying(kind, 20, 30.5, 1).every(Number.isInteger), `a ${kind} does, turned`);
}
const [left, top, right, bottom] = lying('window', 10, 10);
assert.deepEqual([left, right, Math.round((top + bottom) * 50) / 100], [9, 12, 10]);
assert.ok(Math.abs(bottom - top - 0.6) < 1e-9);
