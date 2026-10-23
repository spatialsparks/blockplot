// The check of an object's sizes (stories ST-035, ST-037; versions 9 and 11 of the sketch file).
// What a kind takes, `shapes.TAKES`: the stories' table of sizes, each range holding the kind's
// own size. What the pad reads of an object that says a `long`, a `deep` or a `high`:
// `shapes.known` - each absent, or a whole step that its kind's range holds - and
// `shapes.sizeOf`, at that size, turned or not, a staircase that says no length as long as its
// flight, worked out from its height by hand (its own length: stairs-long.check.js). A sketch
// with a size its kind does not take is refused whole by `sketch.adopt`. And the desk that the
// golden file of every part gained with version 9, made again by the pad's own change on the
// frozen file before it - byte for byte, and one step to undo. The pad's own scripts on a
// made-up store and the made-up plot: no browser, nothing of the real site.
// Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/sizes.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { asNow, golden, VERSION } from './check-golden.js';
import { RISE_M } from './scene/steps.js';

// A browser's two stores, the first holding the file of every part as the pad of version 8
// wrote it: the pad reads it as it loads, from above.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
const KEY = 'blockplot/sketch/space';
// The version before the one that gave the desk its depth and height.
const BEFORE_IT = 8;
local.held.set(KEY, golden('every-part', BEFORE_IT));
globalThis.location = { hash: '#top' };
await import('./demo-site.js');
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
for (const file of ['paper', 'figures', 'shapes', 'blocks', 'legacy', 'sketch']) {
  await import(`./${file}.js`);
}
const { shapes, sketch } = globalThis;
const FIELDS = ['long', 'deep', 'high'];

// WHAT A KIND TAKES: the story's table of sizes, typed in from it, and no other kind. Each range
// holds its kind's own size - the length, the depth or the height of its row of `KINDS`.
assert.deepEqual(shapes.TAKES, {
  stairs: { long: [2, 8], deep: [1, 2], high: [2, 4.5] },
  widestairs: { long: [2, 8], deep: [1, 2], high: [2, 4.5] },
  spiral: { high: [2, 4.5] },
  island: { long: [1, 5], deep: [1, 1.5], high: [0.85, 1.1] },
  counter: { long: [0.5, 6], high: [0.85, 1.1] },
  bath: { long: [1.5, 2], deep: [1, 1.5] },
  shower: { long: [1, 2], deep: [1, 2] },
  bed: { deep: [1, 2] },
  sofa: { long: [1.5, 4], deep: [1, 1.5] },
  cornersofa: { long: [2, 4], deep: [1.5, 3] },
  table: { long: [1, 4], deep: [1, 1.5], high: [0.7, 1.1] },
  desk: { long: [1, 3], deep: [0.5, 1], high: [0.65, 1.25] },
  cupboard: { long: [0.5, 6], high: [1, 2.5] },
  sideboard: { long: [0.5, 6], high: [0.5, 1.2] },
  shelf: { long: [0.5, 6], high: [0.5, 2.5] },
  wardrobe: { long: [0.5, 6], high: [1, 2.5] },
  basin: { long: [0.5, 2] },
  sink: { long: [0.5, 2] },
  fridge: { long: [0.5, 1] },
  towelrail: { long: [0.5, 1.5] },
  bench: { long: [1, 4] },
  lounger: { long: [1.5, 2.5] },
  armchair: { long: [1, 1.5], deep: [1, 1.5] },
  gardentable: { long: [1, 4], deep: [1, 2], high: [0.7, 1.1] },
  fountain: { long: [1, 6], deep: [1, 6] },
  parasol: { long: [1.5, 4], deep: [1.5, 4] },
  bush: { long: [0.5, 4], deep: [0.5, 4], high: [0.5, 3] },
  tree: { long: [2, 12], deep: [2, 12], high: [3, 25] },
});
for (const [kind, takes] of Object.entries(shapes.TAKES)) {
  assert.ok(Object.hasOwn(shapes.KINDS, kind), kind);
  FIELDS.forEach((field, at) => {
    const [own, range] = [shapes.KINDS[kind].size[at], takes[field]];
    if (range) assert.ok(range[0] <= own && own <= range[1], `${kind}: its own ${field}`);
  });
}

// WHAT IS KNOWN, field by field. Absent, and at each end of each range, of every kind that takes
// it. Refused: a step below and a step above each range - half a metre of a length and a depth,
// 5 cm of a height - no whole step, a text, null, and a size on a kind that does not take it.
const STEP = { long: 0.5, deep: 0.5, high: 0.05 };
for (const [kind, takes] of Object.entries(shapes.TAKES)) {
  for (const field of FIELDS.filter((one) => takes[one])) {
    const [from, to] = takes[field];
    for (const metres of [from, to]) assert.ok(shapes.known({ kind, [field]: metres }), kind);
    for (const metres of [from - STEP[field], to + STEP[field], '1', null]) {
      assert.equal(shapes.known({ kind, [field]: metres }), false, `${kind} ${field} ${metres}`);
    }
  }
}
const NONE = [
  { kind: 'bed', deep: 1.2 },
  { kind: 'counter', high: 0.93 },
  { kind: 'table', long: 2.25 },
  { kind: 'chair', deep: 0.5 },
  { kind: 'bed', high: 1 },
  { kind: 'stairs', long: 8.5 },
  { kind: 'spiral', deep: 2 },
  { kind: 'person', high: 1.8 },
];
for (const thing of NONE) assert.equal(shapes.known(thing), false, JSON.stringify(thing));
// A height that is a whole 5 cm worked out in binary is one: 0.95 m, and 0.85 + 0.1.
for (const high of [0.95, 0.85 + 0.1, 1.05]) assert.ok(shapes.known({ kind: 'counter', high }));
// A size that says its kind's own, written by hand, is known.
assert.ok(shapes.known({ kind: 'desk', long: 1.5, deep: 1, high: 0.75 }));

// AT ITS SIZE. Its size is its length along it, its depth across it and its height; turned by
// a quarter it lies across. On the paper a desk of 0.5 m by 1.5 m lies on one row of cells.
assert.deepEqual(shapes.sizeOf({ kind: 'table', long: 3, deep: 1.5, high: 0.9 }), [3, 1.5, 0.9]);
assert.deepEqual(shapes.sizeOf({ kind: 'table', deep: 1.5, high: 1.1, turn: 1 }), [1.5, 2, 1.1]);
assert.deepEqual(shapes.sizeOf({ kind: 'bed', deep: 1 }), [2, 1, 1]);
assert.deepEqual(shapes.sizeOf({ kind: 'bed', deep: 1.5, turn: 3 }), [1.5, 2, 1]);
assert.deepEqual(shapes.sizeOf({ kind: 'counter', high: 0.95, turn: 2 }), [2.5, 0.5, 0.95]);
const desk = { kind: 'desk', x: 28.5, y: 16, floor: 18, deep: 0.5, high: 1.1 };
assert.deepEqual(sketch.rect(desk, 'top'), [27, 16, 30, 17]);
const side = sketch.rect(desk, 'side');
assert.deepEqual([side[0], side[2], side[3]], [27, 30, 18]);
assert.ok(Math.abs(side[3] - side[1] - 2.2) < 1e-9, 'the desk is 1.1 m high from the side');

// A STAIRCASE'S LENGTH is its flight's, by hand: the fewest steps of which none rises more than
// 0.19 m, each 0.28 m deep, rounded up to a whole half metre.
//   2 m:   2 / 0.19 = 10.53, so 11 steps; 11 x 0.28 = 3.08 m, so 3.5 m
//   2.5 m: 13.16, so 14 steps; 3.92 m, so 4 m
//   3 m:   15.79, so 16 steps; 4.48 m, so 4.5 m - as every staircase was, and is without a height
//   3.5 m: 18.42, so 19 steps; 5.32 m, so 5.5 m
//   4.5 m: 23.68, so 24 steps; 6.72 m, so 7 m
const FLIGHTS = [
  [2, 3.5],
  [2.5, 4],
  [3, 4.5],
  [3.5, 5.5],
  [4.5, 7],
];
for (const [high, long] of FLIGHTS) {
  assert.deepEqual(shapes.sizeOf({ kind: 'stairs', high }), [long, 1, high], `${high} m high`);
  const wide = { kind: 'widestairs', high, turn: 1 };
  assert.deepEqual(shapes.sizeOf(wide), [1.5, long, high], `a wide one ${high} m high`);
}
assert.deepEqual(shapes.sizeOf({ kind: 'stairs' }), [4.5, 1, 3]);
assert.deepEqual(shapes.sizeOf({ kind: 'widestairs' }), [4.5, 1.5, 3]);
assert.deepEqual(shapes.sizeOf({ kind: 'stairs', deep: 2, high: 2.5 }), [4, 2, 2.5]);
// Its rise is the scene's: the two are said twice, and bound here.
assert.equal(shapes.RISE_M, RISE_M);

// READ WHOLE, OR NOT AT ALL. A sketch whose objects all say sizes their kinds take is read with
// them as they say them; one with a single object that does not is no sketch.
const BLOCK = { x: [20, 24], y: [20, 22], z: [12, 18], colour: 1 };
const sketchOf = (...things) => ({
  space: VERSION,
  things,
  floors: [],
  notes: [],
  on: {},
  show: {},
});
const at = { x: 30, y: 20, floor: 18 };
const good = [
  { kind: 'bed', ...at, deep: 1 },
  { kind: 'counter', ...at, long: 3.5, high: 0.95 },
  { kind: 'stairs', ...at, deep: 1.5, high: 2.5 },
];
const read = sketch.adopt(sketchOf(BLOCK, ...good));
assert.deepEqual(read.things.slice(1), good);
for (const bad of NONE) {
  const one = { ...at, ...bad };
  assert.equal(sketch.adopt(sketchOf(BLOCK, ...good, one)), null, JSON.stringify(bad));
}

// THE DESK OF THE FILE OF EVERY PART. The file of version 8, as the pad reads it: its head made
// of this version. One change gives the desk in the studio a depth of 0.5 m and then a height of
// 1.1 m: the sketch is the golden file of the version that brought the desk's sizes - by its
// number, so that this holds once it is frozen - byte for byte, and kept so; one step undoes both.
const BROUGHT_IT = 9;
const [was, brought] = [asNow('every-part', BEFORE_IT), asNow('every-part', BROUGHT_IT)];
assert.equal(JSON.stringify(sketch.doc), was);
sketch.change((doc) => {
  const it = doc.things.find((thing) => thing.kind === 'desk');
  it.deep = 0.5;
  it.high = 1.1;
});
assert.equal(JSON.stringify(sketch.doc), brought);
assert.deepEqual([local.held.get(KEY), sketch.past.length], [brought, 1]);
sketch.step(sketch.past, sketch.future);
assert.equal(local.held.get(KEY), was);

process.stdout.write(
  'tools/sketch: what each kind takes is the story table; a length, a depth and a height are read in whole steps within it, a staircase as long as its flight, and a sketch with any other is not read; and the file of every part gained its desk by a change of the pad\n',
);
