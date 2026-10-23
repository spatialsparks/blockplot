// The check of a length (stories ST-034, ST-035; versions 8 and 9 of the sketch file). What the
// pad reads of an object that says one, `long`: `shapes.known` - a kind of `KINDS`, and no
// length, or one that the `long` of its kind's row of `shapes.TAKES` holds in whole half metres -
// and `shapes.sizeOf`, as long as it says, turned. A sketch with a length its kind does not take is refused whole by `sketch.adopt`, as
// one with a kind the pad does not know. And the cupboard that the golden file of every part
// gained with version 8, made again by the pad's own steps on the frozen file before it: set
// down with the Object tool, given its length in one change - byte for byte, and one step to
// undo. The pad's own scripts on a made-up store and the made-up plot: no browser, nothing of
// the real site. Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/long.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { asNow, golden, VERSION } from './check-golden.js';

// A browser's two stores, the first holding the file of every part as the pad of before wrote
// it: the pad reads it as it loads, from above.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
const KEY = 'blockplot/sketch/space';
// The version before the one that gave storage a length: its frozen file has no cupboard.
const BEFORE_IT = 7;
local.held.set(KEY, golden('every-part', BEFORE_IT));
globalThis.location = { hash: '#top' };
await import('./demo-site.js');
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
for (const file of ['paper', 'figures', 'shapes', 'blocks', 'legacy', 'sketch', 'strokes']) {
  await import(`./${file}.js`);
}
const { shapes, sketch } = globalThis;

// WHAT TAKES A LENGTH. The kinds with a `long` in `TAKES`, by the stories' tables, in its order:
// the staircases first, a length of their own (ST-037), then storage from half a metre to six
// among the rest; every other kind takes none. Of every kind an object that says no length is
// known, and one that says its kind's own length is known of these alone.
const STAIRS = ['stairs', 'widestairs'];
const STORAGE = ['cupboard', 'sideboard', 'shelf'];
const LENGTHS = ['island', 'counter', 'bath', 'shower', 'sofa', 'cornersofa', 'table', 'desk'];
const HOME = ['wardrobe', 'basin', 'sink', 'fridge', 'towelrail', 'bench', 'lounger', 'armchair'];
const GARDEN = ['gardentable', 'fountain', 'parasol', 'bush', 'tree'];
const lengthening = Object.keys(shapes.TAKES).filter((kind) => shapes.TAKES[kind].long);
assert.deepEqual(lengthening, [...STAIRS, ...LENGTHS, ...STORAGE, ...HOME, ...GARDEN]);
assert.deepEqual(
  STORAGE.map((kind) => shapes.TAKES[kind].long),
  Array(3).fill([0.5, 6]),
);
for (const kind of Object.keys(shapes.KINDS)) {
  const own = { kind, long: shapes.KINDS[kind].size[0] };
  assert.equal(shapes.known({ kind }), true, `a ${kind}`);
  assert.equal(shapes.known(own), lengthening.includes(kind), `a ${kind} of its own length`);
}
// What is none: a chair with a length; a cupboard too short, too long, of no whole half metre,
// of a length in words, of none at all; and a kind the pad does not have, nor a name that every
// object of the language has.
const NONE = [0.4, 6.5, 1.2, '2', null, 0, -0.5, Infinity];
assert.equal(shapes.known({ kind: 'chair', long: 0.5 }), false);
for (const long of NONE) assert.equal(shapes.known({ kind: 'cupboard', long }), false, `${long}`);
for (const kind of ['lamp', 'constructor', 'toString']) assert.equal(shapes.known({ kind }), false);
// What is: a cupboard of the shortest, of two and a half metres, of the longest - and one that
// says its kind's own length, as a person may write it by hand.
for (const long of [0.5, 2.5, 6, 1]) assert.ok(shapes.known({ kind: 'cupboard', long }), `${long}`);

// AS LONG AS IT SAYS. Its size is its length along it, and turned by a quarter it lies across;
// a shelf that says none is as long as its kind. On the paper, from above, a cupboard of 3 m
// turned lies across about the middle that it had along: six cells by one, either way.
assert.deepEqual(shapes.sizeOf({ kind: 'cupboard', long: 2.5 }), [2.5, 0.5, 2]);
assert.deepEqual(shapes.sizeOf({ kind: 'sideboard', long: 6, turn: 1 }), [0.5, 6, 0.8]);
assert.deepEqual(shapes.sizeOf({ kind: 'shelf', turn: 3 }), [0.5, 1, 2]);
const three = { kind: 'cupboard', x: 30, y: 20, floor: 18, long: 3 };
assert.deepEqual(sketch.rect(three, 'top'), [27, 20, 33, 21]);
assert.deepEqual(sketch.rect({ ...three, turn: 1 }, 'top'), [30, 17, 31, 23]);

// READ WHOLE, OR NOT AT ALL. A sketch whose objects are all known is read with their lengths as
// they say them - its kind's own too; one with a single object that is not is no sketch, however
// much else of it would be read: it is set aside, and nothing of it is shown.
const BLOCK = { x: [20, 24], y: [20, 22], z: [12, 18], colour: 1 };
const sketchOf = (...things) => ({
  space: VERSION,
  things,
  floors: [],
  notes: [],
  on: {},
  show: {},
});
const good = [0.5, 2.5, 6, 1].map((long) => ({ kind: 'shelf', x: 30, y: 20, floor: 18, long }));
const read = sketch.adopt(sketchOf(BLOCK, ...good));
assert.deepEqual(
  read.things.map((thing) => thing.long),
  [undefined, 0.5, 2.5, 6, 1],
);
for (const long of NONE) {
  const bad = { kind: 'sideboard', x: 30, y: 24, floor: 18, long };
  assert.equal(sketch.adopt(sketchOf(BLOCK, ...good, bad)), null, `a sideboard of ${long}`);
}
const chair = { kind: 'chair', x: 30, y: 24, floor: 'ground', long: 0.5 };
assert.equal(sketch.adopt(sketchOf(BLOCK, chair)), null);

// THE CUPBOARD OF THE FILE OF EVERY PART. The file of the version before, as the pad reads it:
// its head made of this version. From above, on its level 18, the Object tool sets a cupboard
// down at column 22.5 and row 25.5 - in the studio, where nothing lies - and one change makes it
// 2.5 m long: it lies on columns 20 to 25 and row 25. The sketch is the golden file of the
// version that brought the cupboard, as the pad reads it, byte for byte, and kept so; one step
// undoes the length, and the cupboard stands as it was set down.
const BROUGHT_IT = 8;
const brought = asNow('every-part', BROUGHT_IT);
assert.equal(JSON.stringify(sketch.doc), asNow('every-part', BEFORE_IT));
assert.equal(sketch.on(), 18);
sketch.apply({ tool: 'object', from: [22.5, 25.5], to: [22.5, 25.5], kind: 'cupboard' });
const setDown = JSON.stringify(sketch.doc);
sketch.change((doc) => {
  doc.things.at(-1).long = 2.5;
});
assert.equal(JSON.stringify(sketch.doc), brought);
assert.deepEqual([local.held.get(KEY), sketch.past.length], [brought, 2]);
assert.deepEqual(sketch.rect(sketch.doc.things.at(-1), 'top'), [20, 25, 25, 26]);
sketch.step(sketch.past, sketch.future);
assert.equal(local.held.get(KEY), setDown);
assert.equal(setDown, brought.replace(',"long":2.5}', '}'));

process.stdout.write(
  'tools/sketch: the kinds with a length in TAKES take one, storage half a metre to six, in half metres; a sketch with any other is not read; and the file of every part gained its cupboard by the steps of the pad\n',
);
