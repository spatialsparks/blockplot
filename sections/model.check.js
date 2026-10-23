// The check of the sections of a sketch as they are read (story ST-032; version 7 of the sketch
// file): `sections.list`, what is a section and each kind of what is none; `sections.of`, of a
// box - of the boxes of its block the first that names a listed section - and of an object, by
// the block it stands in, edges and all, on made-up boxes by hand and on the made-up house:
// thirteen of its objects stand in its day rooms, nine in its night rooms, three in its bath, and
// the car and the tree in no block; `sections.hides`; and a sketch with what is none under each
// of the three fields of version 7, read and written back byte for byte. A name and what a step
// writes are steps.check.js's; what a stroke makes of a section, and the golden file, are
// strokes.check.js's. The pad's own scripts on a made-up store and the made-up plot: no browser,
// nothing of the real site. Run by tools/sketch/check.js, as every *.check.js is, or alone:
//   pnpm exec node tools/sketch/sections/model.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { golden, VERSION } from '../check-golden.js';

// A browser's two stores. The script of the sections is loaded first and once, before there is
// a paper or a sketch: it reads nothing as it loads. So is the script of the rates, and the list.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
for (const file of ['sections/model', 'info/rates', 'demo-site', 'categories']) {
  await import(`../${file}.js`);
}
const { sections } = globalThis;
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const KEY = 'blockplot/sketch/space';
const SCRIPTS = ['paper', 'figures', 'shapes', 'blocks', 'legacy', 'sketch', 'strokes', 'labels'];
let loads = 0;
/** The pad's sketch, loaded anew from above on the made-up plot, on a store that holds this text. */
async function pad(text) {
  for (const one of [local, session]) one.held.clear();
  local.held.set(KEY, text);
  globalThis.location = { hash: '#top' };
  loads += 1;
  for (const file of SCRIPTS) await import(`../${file}.js?${loads}`);
  return globalThis.sketch;
}
const EMPTY = { floors: [], notes: [], on: {}, show: { top: {} } };
const drawn = (things, more) => JSON.stringify({ space: VERSION, things, ...EMPTY, ...more });

// --- `sections.list` -----------------------------------------------------------------------------
// WHAT IS A SECTION: an entry with an `id` that is a whole number from 1 on and a `name` that
// holds a character which is no blank - as `{ id, name, hidden }`, hidden or not, in the order
// of the list and not of the numbers, with its name as it was written and nothing else of it.
const listed = (said) => sections.list({ sections: said });
const HOME = { id: 1, name: 'Home 1' };
assert.deepEqual(listed([HOME]), [{ id: 1, name: 'Home 1', hidden: false }]);
const CELLAR = { id: 7, name: ' Garage and cellar', hidden: true, colour: 3 };
assert.deepEqual(listed([CELLAR]), [{ id: 7, name: ' Garage and cellar', hidden: true }]);
const told = (said) => listed(said).map(({ id, name, hidden }) => `${id} ${name} ${hidden}`);
const THREE = [
  { id: 3, name: 'C' },
  { id: 1, name: 'a', hidden: true },
  { id: 2, name: 'B' },
];
assert.deepEqual(told(THREE), ['3 C false', '1 a true', '2 B false']);
// NOTHING BUT `true` HIDES: whatever else stands there, the section shows.
for (const hidden of [false, null, 'true', 1, 'yes', {}, [true]]) {
  assert.deepEqual(told([{ ...HOME, hidden }]), ['1 Home 1 false'], JSON.stringify(hidden));
}
// WHAT IS NONE says nothing, and the section after it is read as it stands: an `id` that is no
// whole number from 1 on; a `name` that is no text, or holds blanks alone; an entry that is no
// object, or a list. The last of the ids is a whole number that nobody can count on from.
const NO_IDS = [0, -1, 1.5, '1', null, undefined, true, [1], { id: 1 }, 2 ** 53];
const NO_NAMES = [undefined, null, '', ' ', ' \t\n', 7, true, ['Home 2'], { name: 'Home 2' }];
const NONE = [
  ...NO_IDS.map((id) => ({ id, name: 'Home 2' })),
  ...NO_NAMES.map((name) => ({ id: 2, name })),
  ...[null, 7, 'Home 2', true, [], [2, 'Home 2']],
];
for (const none of NONE) {
  assert.deepEqual(told([none]), [], JSON.stringify(none));
  assert.deepEqual(told([none, HOME, none]), ['1 Home 1 false'], JSON.stringify(none));
}
assert.equal(NONE.length, 25);
// AN `id` IS THE FIRST ENTRY'S THAT SAYS IT: the second of two is none, whatever its name - and
// so it is where the first is none for its name: an entry that says an `id` has it.
const TWICE = [HOME, { id: 1, name: 'Home 2' }, { id: 2, name: 'Garage' }, { id: 2, name: 'x' }];
assert.deepEqual(told(TWICE), ['1 Home 1 false', '2 Garage false']);
assert.deepEqual(told([{ id: 1, name: ' ' }, HOME, { id: 2, name: 'Garage' }]), ['2 Garage false']);
// WHAT IS NO LIST says nothing, and neither does a sketch that says nothing of its sections.
for (const none of [undefined, null, {}, { 0: HOME }, HOME, 'Home 1', 7, true]) {
  assert.deepEqual(listed(none), [], JSON.stringify(none));
}
for (const doc of [null, {}, { things: [] }]) assert.deepEqual(sections.list(doc), []);

// --- `sections.of`, of a box ------------------------------------------------------------------------
// A made-up sketch on one level, row 24 of a standing view: boxes of 4 m by 4 m in a row of the
// top view, rows 16 to 24, and the sections "Home 1" and "Home 2", the second hidden. With no
// sketch handed over, `list` reads the pad's own.
const HOMES = [HOME, { id: 2, name: 'Home 2', hidden: true }];
const [FIRST, SECOND] = [
  { id: 1, name: 'Home 1', hidden: false },
  { id: 2, name: 'Home 2', hidden: true },
];
const box = (column, row, more) => ({
  x: [column, column + 8],
  y: [row, row + 8],
  z: [18, 24],
  colour: 1,
  ...more,
});
// Each box with the section that its block is in, by hand: 1, 2, or none.
const BOXES = [
  // A box alone that names a listed section, and one that names nothing.
  [box(2, 16, { section: 1 }), 1],
  [box(11, 16), null],
  // A block of two boxes: the first that names a listed section counts, for both.
  [box(20, 16, { group: 1, section: 2 }), 2],
  [box(28, 16, { group: 1, section: 1 }), 2],
  // The first says nothing, and the second names one.
  [box(38, 16, { group: 2 }), 1],
  [box(46, 16, { group: 2, section: 1 }), 1],
  // The first names a section that is gone from the list: it says nothing, and the second counts.
  [box(56, 16, { group: 3, section: 9 }), 2],
  [box(64, 16, { group: 3, section: 2 }), 2],
  // A box that names one which the list does not have, and nothing else in its block: in none.
  [box(74, 16, { group: 4, section: 9 }), null],
  [box(82, 16, { group: 4 }), null],
  // What is no `id` names nothing: a text, though it reads as a number of the list.
  [box(2, 26, { section: '1' }), null],
  [box(11, 26, { section: [2] }), null],
];
let sketch = await pad(
  drawn(
    BOXES.map(([thing]) => thing),
    { sections: HOMES },
  ),
);
assert.deepEqual(sections.list(), [FIRST, SECOND]);
const things = () => sketch.doc.things;
const idOf = (thing) => sections.of(thing)?.id ?? null;
assert.deepEqual(
  things().map(idOf),
  BOXES.map(([, id]) => id),
);
// `of` gives the section as `list` gives it, and null where a thing is in none.
assert.deepEqual([sections.of(things()[3]), sections.of(things()[1])], [SECOND, null]);

// --- `sections.of`, of an object ---------------------------------------------------------------------
// An object belongs to the block it stands in: of the boxes that lie on its level - their top
// over it, their floor on it or under it - and hold its middle, edges and all, the last in the
// sketch: the one that a click takes there. By hand, each with a chair. P and Q share an edge,
// column 18; S holds T, a box of no section that was drawn later; U is two storeys high.
const P = { x: [10, 18], y: [40, 48], z: [18, 24], colour: 2, section: 1 };
const Q = { x: [18, 26], y: [40, 48], z: [18, 24], colour: 2, section: 2 };
const S = { x: [40, 52], y: [40, 48], z: [18, 24], colour: 2, section: 1 };
const T = { x: [44, 48], y: [42, 46], z: [18, 24], colour: 3 };
const U = { x: [60, 68], y: [40, 48], z: [12, 24], colour: 2, section: 2 };
const CHAIRS = [
  // In P; on its corner and on its near edge; and on the edge that it shares with Q, where
  // both hold it: Q, the later of the two.
  [14, 44, 24, 1],
  [10, 40, 24, 1],
  [10, 44, 24, 1],
  [18, 44, 24, 2],
  // On the far edges of Q, which a click would leave out - and half a cell beyond them: in none.
  [26, 44, 24, 2],
  [22, 48, 24, 2],
  [26, 48, 24, 2],
  [26.5, 44, 24, null],
  [22, 48.5, 24, null],
  // In S alone; and in T, which lies in S and was drawn after it: T is in no section.
  [42, 44, 24, 1],
  [46, 44, 24, null],
  [44, 44, 24, null],
  // On P's roof, row 18, it stands in no box: a box holds what stands under its top.
  [14, 44, 18, null],
  // On a level that U rises through, row 18, and on U's floor.
  [64, 44, 18, 2],
  [64, 44, 24, 2],
  // On the ground in P, and on a level beside every box.
  [14, 44, 'ground', null],
  [80, 44, 24, null],
];
const chair = ([x, y, floor]) => ({ kind: 'chair', x, y, floor });
// A `section` on an object is no field of the format: it says nothing, in a box and in none.
const STRAY = [
  { kind: 'chair', x: 62, y: 42, floor: 24, section: 1 },
  { kind: 'chair', x: 80, y: 42, floor: 24, section: 1 },
];
sketch = await pad(drawn([P, Q, S, T, U, ...CHAIRS.map(chair), ...STRAY], { sections: HOMES }));
const chairs = things().slice(5);
assert.deepEqual(chairs.map(idOf), [...CHAIRS.map((said) => said[3]), 2, null]);
assert.deepEqual(things().slice(0, 5).map(idOf), [1, 2, 1, null, 2]);

// --- `sections.hides` ---------------------------------------------------------------------------------
// "Home 2" is hidden: its boxes, and the objects that stand in them. Nothing else is.
assert.deepEqual(
  things().map((thing) => sections.hides(thing)),
  things().map((thing) => idOf(thing) === 2),
);
assert.equal(things().filter(sections.hides).length, 1 + 1 + 4 + 2 + 1);
// A sketch with no hidden section answers no before it looks at the thing: of a thing that
// cannot be looked at, it says no - and with a hidden section, it does look.
const unseen = new Proxy({}, { get: () => assert.fail('the thing was looked at') });
assert.throws(() => sections.hides(unseen), /the thing was looked at/);
sketch = await pad(drawn([P, Q, chair([14, 44, 24])], { sections: [HOME, { id: 2, name: 'B' }] }));
assert.deepEqual(
  [...things().map(sections.hides), sections.hides(unseen)],
  [false, false, false, false],
);
sketch = await pad(drawn([P, Q, chair([14, 44, 24])]));
assert.deepEqual([...things().map(idOf), sections.hides(unseen)], [null, null, null, false]);

// --- the objects of the made-up house ---------------------------------------------------------------
// tests/__fixtures__/sketch/made-up.json has no section. With its day rooms, its night rooms and
// its bath in a section each, by the pad's own steps, its 27 objects stand so, by hand - each
// kind in the order of the file: thirteen in the day rooms, nine in the night rooms, three in
// the bath, and the car and the tree, on the ground, in none.
sketch = await pad(golden('made-up'));
assert.deepEqual([sections.list(), things().map(idOf).filter(Boolean)], [[], []]);
for (const name of ['Day rooms', 'Night rooms', 'Bath']) {
  const { id } = sections.make(name);
  sections.put([things().find((thing) => thing.name === name)], id);
}
const objects = things().filter((thing) => !sketch.isBox(thing));
const standing = Object.groupBy(objects, (thing) => sections.of(thing)?.name ?? 'in none');
const kinds = (name) => standing[name].map((thing) => thing.kind).join(' ');
assert.deepEqual(Object.keys(standing).sort(), ['Bath', 'Day rooms', 'Night rooms', 'in none']);
assert.equal(
  kinds('Day rooms'),
  'door stairs window door counter sink hob fridge table chair chair sofa widestairs',
);
assert.equal(kinds('Night rooms'), 'window window window door door bed wardrobe desk chair');
assert.deepEqual([kinds('Bath'), kinds('in none')], ['toilet basin shower', 'car tree']);
const count = (name) => standing[name].length;
assert.deepEqual(
  [objects.length, count('Day rooms'), count('Night rooms'), count('Bath'), count('in none')],
  [27, 13, 9, 3, 2],
);
// Why the edges count: two of its four windows stand on a far edge of their block - on the day
// rooms' last row, 38, and on the night rooms' last column, 50. By a click's own rule, which
// leaves the far edges out, no box of their level would hold either.
const onLevel = (object) => things().filter((thing) => sketch.lies(thing, 'top', object.floor));
const byClick = (object) => (thing) =>
  thing.x[0] <= object.x &&
  object.x < thing.x[1] &&
  thing.y[0] <= object.y &&
  object.y < thing.y[1];
const windows = objects.filter((thing) => thing.kind === 'window');
const onEdge = windows.filter((pane) => !onLevel(pane).filter(sketch.isBox).some(byClick(pane)));
assert.deepEqual(
  onEdge.map((pane) => `${pane.x} ${pane.y}: ${sections.of(pane).name}`),
  ['44.5 38: Day rooms', '50 26.5: Night rooms'],
);

// --- what is none, read and written back ------------------------------------------------------------
// A sketch is refused for nothing that stands under the three fields of version 7: with what is
// no section on a box and in the list, and what is no rate, it is read - every block in no
// section, no section listed, no rate - and written back byte for byte, each as it was written.
const AWAY = [
  box(2, 16, { section: 'Home 1' }),
  box(11, 16, { section: 0 }),
  box(20, 16, { section: 4, group: 1 }),
  box(28, 16, { section: null, group: 1 }),
];
const NO_RATES = { as: { room: 'dear', pool: 5, glass: -1 }, category: ['kitchen'], more: 1 };
const AMISS = [
  drawn(AWAY, { sections: NONE, rates: NO_RATES }),
  drawn(AWAY, { rates: 950, sections: 'Home 1' }),
  drawn(AWAY, { sections: { 1: 'Home 1' }, rates: [950] }),
];
const read = () => [sections.list(), things().map(idOf), globalThis.rates.of(sketch.doc)];
for (const text of AMISS) {
  sketch = await pad(text);
  sketch.keep();
  assert.deepEqual([JSON.stringify(sketch.doc), local.held.get(KEY)], [text, text]);
  assert.deepEqual(read(), [[], [null, null, null, null], { as: {}, category: {} }]);
  assert.equal(sections.hides(things()[2]), false);
}
// And so beside what is one: a section that says more than the format has, among what is none,
// is read - its `hidden` is no `true`, so it shows - with the block that names it, and a rate
// beside what is none; and the sketch is the text it was, with all that nobody read.
const YARD = { id: 4, name: 'Yard', hidden: 'yes', more: [1] };
const MIXED = drawn(AWAY, { sections: [...NONE, YARD], rates: { ...NO_RATES, as: { open: 300 } } });
sketch = await pad(MIXED);
sketch.keep();
assert.deepEqual([JSON.stringify(sketch.doc), local.held.get(KEY)], [MIXED, MIXED]);
const yard = { id: 4, name: 'Yard', hidden: false };
assert.deepEqual(read(), [[yard], [null, null, 4, 4], { as: { open: 300 }, category: {} }]);

process.stdout.write(
  'tools/sketch/sections: a section is read off the list and off the first box of a block that names it, an object belongs to the block it stands in, and what is none says nothing\n',
);
