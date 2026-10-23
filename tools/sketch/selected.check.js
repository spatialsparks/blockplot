// The check of what is done to what is selected (T-037.5, selected.js), by hand: `sketch.remove`
// of a box of a block of two - both go - of an object, and of nothing; `sketch.toLevel` of an
// object to another level and to the ground, of a block of two boxes one of which slopes - each
// box carried by as many rows, the slope with it - and refused for a block to the ground, with
// why, and for none to a level that takes a box of it off the plot's paper: the paper has no
// edge (ST-042). Each change one step, which Undo takes back to the byte; each refusal none.
// A made-up paper and store, as
// stretch.check.js makes them. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/selected.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });
// The paper of stretch.check.js: 146 columns down the plot, 71 rows across it and 72 up, of half
// a metre, seen from above. So a box lies within rows 0 to 72 of the side view.
const SPANS = { top: [-5, 30.5], side: [440, 476] };
const made = { CELL_M: 0.5, X0: -10, COLS: 146, ACROSS: 71, SPANS, INK: 'ink' };
Object.assign(made, { PLANE: 'top', FLIP: false, WIDE: 146, ROWS: 71, groundRow: () => 70 });
globalThis.paper = made;
for (const one of ['figures', 'shapes', 'categories', 'blocks', 'legacy', 'sketch', 'selected'])
  await import(`./${one}.js`);
const { sketch, structuredClone } = globalThis;
const text = () => JSON.stringify(sketch.doc);
const things = () => sketch.doc.things;

// THE SKETCH: a block of two boxes standing on row 46 - the first, its top sloping along the plot
// from row 30 down to row 36, and the second beside it - a box alone on that level, a person on
// it and a chair on the ground.
const SLOPED = { x: [10, 20], y: [10, 20], z: [30, 46], colour: 1, group: 1 };
SLOPED.slope = { x: [10, 20], z: [30, 36] };
const BESIDE = { x: [20, 30], y: [10, 20], z: [34, 46], colour: 1, group: 1 };
const ALONE = { x: [40, 50], y: [10, 20], z: [36, 46], colour: 2 };
const PERSON = { kind: 'person', x: 45, y: 15, floor: 46 };
const CHAIR = { kind: 'chair', x: 60, y: 30, floor: 'ground' };
const ALL = [SLOPED, BESIDE, ALONE, PERSON, CHAIR];
const begin = () => {
  sketch.doc = sketch.adopt({ ...sketch.blank(), things: structuredClone(ALL) });
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
  return structuredClone(things());
}
/** What changes nothing: no step, and the sketch to the byte. */
function none(act) {
  const [before, steps] = [text(), sketch.past.length];
  act();
  assert.deepEqual([text(), sketch.past.length], [before, steps]);
}
begin();
assert.equal(things().length, 5, 'the sketch reads as it was made');

// REMOVE. A box of a block of two: the whole block goes, in one step - the other box with it.
begin();
assert.deepEqual(
  done(() => sketch.remove([things()[1]])),
  [ALONE, PERSON, CHAIR],
);
// An object: the object alone. Two of a block, and an object, at once: all of them, one step.
begin();
assert.deepEqual(
  done(() => sketch.remove([things()[3]])),
  [SLOPED, BESIDE, ALONE, CHAIR],
);
begin();
assert.deepEqual(
  done(() => sketch.remove([things()[0], things()[1], things()[4]])),
  [ALONE, PERSON],
);
// Nothing, and a thing that is not in the sketch: nothing changes, and there is no step.
begin();
none(() => sketch.remove([]));
none(() => sketch.remove([structuredClone(PERSON)]));

// TO A LEVEL. An object to another level: its floor is that row, and nothing else changes.
begin();
assert.deepEqual(
  done(() => assert.equal(sketch.toLevel([things()[3]], 40), true)),
  [SLOPED, BESIDE, ALONE, { ...PERSON, floor: 40 }, CHAIR],
);
// To the ground, and from the ground to a level.
begin();
assert.deepEqual(done(() => sketch.toLevel([things()[3]], 'ground'))[3], {
  ...PERSON,
  floor: 'ground',
});
assert.deepEqual(done(() => sketch.toLevel([things()[4]], 46))[4], { ...CHAIR, floor: 46 });
// A block of two, by the box that slopes: six rows up, to row 40 - every box of it by as many,
// the slope with it; the box alone stays where it was. And by the other box, twelve rows down.
begin();
const UP = done(() => sketch.toLevel([things()[0]], 40));
assert.deepEqual(UP.slice(0, 3), [
  { ...SLOPED, z: [24, 40], slope: { x: [10, 20], z: [24, 30] } },
  { ...BESIDE, z: [28, 40] },
  ALONE,
]);
begin();
const DOWN = done(() => sketch.toLevel([things()[1]], 58));
assert.deepEqual(DOWN.slice(0, 2), [
  { ...SLOPED, z: [42, 58], slope: { x: [10, 20], z: [42, 48] } },
  { ...BESIDE, z: [46, 58] },
]);
// To the level it stands on: nothing changes, and no step.
begin();
none(() => sketch.toLevel([things()[0]], 46));

// REFUSED, with why, and nothing changes: a block to the ground. To a level that takes its top
// above the plot's paper - by the box beside, 31 rows up, the sloping box's top in row -1 - or
// its floor below it, past row 72, it goes as to any: the paper has no edge (ST-042). To row 15
// the slope goes with it, from row -1 to row 5; to row 73 the block goes 27 rows down.
begin();
const GROUND = 'A block stands on a level, not on the ground';
assert.equal(sketch.refusedLevel([things()[1]], 'ground'), GROUND);
none(() => assert.equal(sketch.toLevel([things()[1]], 'ground'), false));
for (const floor of [15, 73, 16, 72, 40])
  assert.equal(sketch.refusedLevel([things()[0]], floor), '');
assert.deepEqual(done(() => sketch.toLevel([things()[0]], 72))[1].z, [60, 72]);
begin();
assert.deepEqual(done(() => sketch.toLevel([things()[1]], 15)).slice(0, 2), [
  { ...SLOPED, z: [-1, 15], slope: { x: [10, 20], z: [-1, 5] } },
  { ...BESIDE, z: [3, 15] },
]);
begin();
assert.deepEqual(done(() => sketch.toLevel([things()[1]], 73)).slice(0, 2), [
  { ...SLOPED, z: [57, 73], slope: { x: [10, 20], z: [57, 63] } },
  { ...BESIDE, z: [61, 73] },
]);
// An object is refused nowhere: the ground, any level.
for (const floor of ['ground', 0, 72]) assert.equal(sketch.refusedLevel([things()[3]], floor), '');

process.stdout.write(
  'tools/sketch: what is selected is taken away whole, and carried to a level whole with its slope, each in one step, refused for a block on the ground and for none off the paper\n',
);
