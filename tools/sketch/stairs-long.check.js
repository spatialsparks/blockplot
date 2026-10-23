// The check of a staircase's own length and of the kinds that took a size with it (story ST-037;
// version 11 of the sketch file). `shapes.sizeOf` of a staircase that says a `long` - that long,
// whatever its height, turned or not - and of one that says none, as long as its flight, as it
// was before, worked out by hand; `shapes.known` of a staircase's length, and of each range that
// version 11 added to `TAKES`, at both its ends. A staircase dragged at its end from above keeps
// the length it was dragged to - its kind's own too - where a side dragged back to its kind's
// own depth says none. `sketch.adopt` of a sketch with a wardrobe of 6 m and a staircase of 8 m,
// and of one with a fridge too long. And the wide staircase's length that the golden file of
// every part gained with version 11, made again by the pad's own change on the frozen file
// before it - byte for byte, and one step to undo. The pad's own scripts on a made-up store and
// the made-up plot: no browser, nothing of the real site.
// Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/stairs-long.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { asNow, golden, VERSION } from './check-golden.js';

// A browser's two stores, the first holding the file of every part as the pad of the version
// before wrote it: the pad reads it as it loads, from above.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
const KEY = 'blockplot/sketch/space';
// The version before the one that gave a staircase a length of its own.
const BEFORE_IT = 10;
local.held.set(KEY, golden('every-part', BEFORE_IT));
globalThis.location = { hash: '#top' };
await import('./demo-site.js');
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const SCRIPTS = ['paper', 'figures', 'shapes', 'categories', 'blocks', 'legacy', 'sketch'];
for (const file of [...SCRIPTS, 'strokes', 'stretch']) await import(`./${file}.js`);
const { shapes, sketch } = globalThis;

// A STAIRCASE OF ITS OWN LENGTH is that long at any height, along it, and across it turned.
for (const kind of shapes.FLIGHTS) {
  const deep = shapes.KINDS[kind].size[1];
  for (const [long, high] of [2, 4.5, 8].flatMap((one) => [2.5, 4.5].map((up) => [one, up]))) {
    assert.deepEqual(shapes.sizeOf({ kind, long, high }), [long, deep, high], `${kind} ${long}`);
    const turned = { kind, long, high, turn: 1 };
    assert.deepEqual(shapes.sizeOf(turned), [deep, long, high], `${kind} ${long} turned`);
  }
}
// ONE THAT SAYS NONE is as long as its flight, as before, by hand: the fewest steps of which none
// rises more than 0.19 m, each 0.28 m deep, rounded up to a whole half metre.
//   2 m: 11 steps, 3.08 m, so 3.5 m; 2.5 m: 14, 3.92, so 4 m; 3 m: 16, 4.48, so 4.5 m;
//   3.5 m: 19, 5.32, so 5.5 m; 4.5 m: 24, 6.72, so 7 m
const TODAY = [
  [2, 3.5],
  [2.5, 4],
  [3, 4.5],
  [3.5, 5.5],
  [4.5, 7],
];
for (const [high, long] of TODAY) {
  assert.deepEqual(shapes.sizeOf({ kind: 'stairs', high }), [long, 1, high], `${high} m high`);
  const wide = { kind: 'widestairs', high, turn: 3 };
  assert.deepEqual(shapes.sizeOf(wide), [1.5, long, high], `a wide one ${high} m high`);
}
assert.deepEqual(shapes.sizeOf({ kind: 'stairs' }), [4.5, 1, 3]);

// ITS LENGTH IS KNOWN from 2 m to 8 m in half metres, and refused below, above, of no whole half
// metre, and in words.
for (const long of [2, 8]) assert.ok(shapes.known({ kind: 'stairs', long }), `${long}`);
for (const long of [1.5, 8.5, 2.25, '4']) {
  assert.equal(shapes.known({ kind: 'widestairs', long }), false, `${long}`);
}
// WHAT VERSION 11 ADDED to `TAKES`, typed in from the story's table, each range read at both ends.
const ADDED = {
  stairs: { long: [2, 8] },
  widestairs: { long: [2, 8] },
  bath: { deep: [1, 1.5] },
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
};
for (const [kind, fields] of Object.entries(ADDED)) {
  for (const [field, range] of Object.entries(fields)) {
    assert.deepEqual(shapes.TAKES[kind][field], range, `${kind} ${field}`);
    for (const metres of range) assert.ok(shapes.known({ kind, [field]: metres }), kind);
  }
}

// READ WHOLE, OR NOT AT ALL: a wardrobe of 6 m and a staircase of 8 m are read as they say; a
// fridge of 1.5 m makes the sketch none.
const BLOCK = { x: [20, 24], y: [20, 22], z: [12, 18], colour: 1 };
const sketchOf = (...things) => ({ ...sketch.blank(), space: VERSION, things });
const at = { x: 30, y: 20, floor: 18 };
const good = [
  { kind: 'wardrobe', ...at, long: 6 },
  { kind: 'stairs', ...at, long: 8, high: 3.5 },
];
assert.deepEqual(sketch.adopt(sketchOf(BLOCK, ...good)).things.slice(1), good);
const fridge = { kind: 'fridge', ...at, long: 1.5 };
assert.equal(sketch.adopt(sketchOf(BLOCK, ...good, fridge)), null);

// THE WIDE STAIRCASE OF THE FILE OF EVERY PART. The file of the version before, as the pad reads
// it: its head made of this version. One change makes the wide staircase in the workshop 5.5 m
// long, a cell longer at each end about its middle: the sketch is the golden file of the version
// that brought a staircase's length - by its number, so that this holds once it is frozen - byte
// for byte, and kept so; one step undoes it.
const BROUGHT_IT = 11;
const [was, brought] = [asNow('every-part', BEFORE_IT), asNow('every-part', BROUGHT_IT)];
assert.equal(JSON.stringify(sketch.doc), was);
const wide = () => sketch.doc.things.find((thing) => thing.kind === 'widestairs');
assert.deepEqual(sketch.rect(wide(), 'top'), [34, 16, 43, 19]);
sketch.change((doc) => {
  doc.things.find((thing) => thing.kind === 'widestairs').long = 5.5;
});
assert.equal(JSON.stringify(sketch.doc), brought);
assert.deepEqual([local.held.get(KEY), sketch.past.length], [brought, 1]);
assert.deepEqual(sketch.rect(wide(), 'top'), [33, 16, 44, 19]);
sketch.step(sketch.past, sketch.future);
assert.equal(local.held.get(KEY), was);

// DRAGGED, IT KEEPS ITS LENGTH. From above on its level, a staircase 3 m high and so 4.5 m long,
// columns 16 to 25 and rows 36 to 38: its east end four cells out, 6.5 m, its west end where it
// was; four cells back, 4.5 m - its kind's own, and said all the same. Its south side a row out,
// 1.5 m deep; a row back, 1 m, its kind's own, and its depth said no more. Each drag one step.
const things = [{ kind: 'stairs', x: 20.5, y: 37, floor: 18 }];
sketch.doc = sketch.adopt({ ...sketch.blank(), on: { ...sketch.doc.on }, things });
const drag = (from, to) => {
  const steps = sketch.past.length;
  sketch.apply({ tool: 'move', from, to, grabbed: { ...sketch.grab(from, 0.3), copy: false } });
  assert.equal(sketch.past.length, steps + 1);
  const [stairs] = sketch.doc.things;
  return `${sketch.rect(stairs, 'top')} ${stairs.long ?? 'own'} ${stairs.deep ?? 'own'}`;
};
assert.equal(sketch.grab([24.95, 37], 0.3).zone, 'e');
assert.equal(drag([24.95, 37], [28.95, 37]), '16,36,29,38 6.5 own');
assert.equal(drag([28.95, 37], [24.95, 37]), '16,36,25,38 4.5 own');
assert.equal(drag([20.5, 37.95], [20.5, 38.95]), '16,36,25,39 4.5 1.5');
assert.equal(drag([20.5, 38.95], [20.5, 37.95]), '16,36,25,38 4.5 own');

process.stdout.write(
  'tools/sketch: a staircase is as long as it says, 2 m to 8 m, or as its flight where it says none; the kinds of version 11 take their sizes; dragged, a staircase keeps its length; and the file of every part gained the length of its wide staircase by a change of the pad\n',
);
