// The check of the steps that change the sections of a sketch (story ST-032; version 7 of the
// sketch file), the format's only writers: `sections.make`, `put`, `rename`, `move`, `hide` and
// `remove`. Of each: the text of the sketch after it, to the byte, kept at once; one step, which
// Undo takes back to the byte and Redo makes again; and no step where nothing changed - a name
// that is refused, an `id` that the list does not have, an end of the list, what is so already.
// A section that is removed leaves its blocks in no section, and comes back with them. A new
// `id` is one that no box names. From the first step on the list is what the pad read of it.
// What a name is, and each sentence it is refused in, is named.check.js's. The pad's own scripts
// on a made-up store and the made-up plot: no browser, nothing of the real site. Run by
// tools/sketch/check.js, or alone: pnpm exec node tools/sketch/sections/steps.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { VERSION } from '../check-golden.js';

// A browser's two stores. The script of the sections is loaded first and once, before there is
// a paper or a sketch: it reads nothing as it loads.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
for (const file of ['sections/model', 'demo-site', 'categories']) await import(`../${file}.js`);
const { sections } = globalThis;
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const KEY = 'blockplot/sketch/space';
const SCRIPTS = ['paper', 'figures', 'shapes', 'blocks', 'legacy', 'sketch', 'strokes', 'labels'];
let [loads, sketch] = [0, null];
/** The pad's sketch, loaded anew from above on the made-up plot, on a store that holds this text. */
async function pad(text) {
  for (const one of [local, session]) one.held.clear();
  local.held.set(KEY, text);
  globalThis.location = { hash: '#top' };
  loads += 1;
  for (const file of SCRIPTS) await import(`../${file}.js?${loads}`);
  sketch = globalThis.sketch;
  assert.equal(JSON.stringify(sketch.doc), text, 'the sketch is not read as it was written');
}
const EMPTY = { floors: [], notes: [], on: {}, show: { top: {} } };
const drawn = (things, more) => JSON.stringify({ space: VERSION, things, ...EMPTY, ...more });
const things = () => sketch.doc.things;
const text = () => JSON.stringify(sketch.doc);
const state = () => [text(), local.held.get(KEY), sketch.past.length, sketch.future.length];
/** One step was made: the sketch is `after`, kept at once; Undo has the text of before, to the byte, and Redo this one again. */
function stepped(after, what) {
  const [before, steps] = [sketch.past.at(-1), sketch.past.length];
  assert.deepEqual(state(), [after, after, steps, 0], what);
  sketch.step(sketch.past, sketch.future);
  assert.deepEqual(state(), [before, before, steps - 1, 1], `${what}, undone`);
  sketch.step(sketch.future, sketch.past);
  assert.deepEqual(state(), [after, after, steps, 0], `${what}, done again`);
}
/** What changes nothing and makes no step - and what it answers, where that is said. */
function still(does, what, answers) {
  const was = state();
  const answer = does();
  assert.deepEqual(state(), was, what);
  if (answers !== undefined) assert.deepEqual(answer, answers, what);
}

// A made-up sketch on one level, row 24 of a standing view: a box alone, a block of two boxes
// with a name and a bed in it, and a third block. No section yet: the sketch says nothing of one.
const lies = (column) => ({ x: [column, column + 8], y: [16, 24], z: [18, 24], colour: 1 });
const [A, C] = [lies(10), lies(40)];
const B = [20, 28].map((column) => ({ ...lies(column), group: 1, name: 'Home' }));
const BED = { kind: 'bed', x: 24, y: 20, floor: 24 };
const PLAIN = drawn([A, ...B, C, BED]);
await pad(PLAIN);
assert.deepEqual([sections.list(), PLAIN.includes('section')], [[], false]);

// --- `sections.make` ---------------------------------------------------------------------------------
// A new section stands at the foot of the list, under its name without the blanks at its ends,
// with the next number: `sections` is the last field of the sketch, after all it held, and an
// entry says its `id` and its `name` and nothing else. A name that is refused makes no step.
const HOME = { id: 1, name: 'Home 1' };
const GARAGE = { id: 2, name: 'Garage and cellar' };
assert.deepEqual(sections.make('  Home 1 '), { id: 1 });
stepped(drawn([A, ...B, C, BED], { sections: [HOME] }), 'the first section');
assert.ok(text().endsWith(',"on":{},"show":{"top":{}},"sections":[{"id":1,"name":"Home 1"}]}'));
assert.deepEqual(sections.make('Garage and cellar'), { id: 2 });
const TWO = drawn([A, ...B, C, BED], { sections: [HOME, GARAGE] });
stepped(TWO, 'the second section');
assert.equal(sketch.past.length, 2);
const NEEDED = { refused: 'A section needs a name.' };
const TAKEN = { refused: 'There is a section "Home 1" already.' };
const LONG = { refused: "A section's name has 60 characters at the most: this one has 61." };
still(() => sections.make(' '), 'a section with no name', NEEDED);
still(() => sections.make('home 1'), 'a section under a name that is taken', TAKEN);
still(() => sections.make('n'.repeat(61)), 'a section under too long a name', LONG);

// --- `sections.put` -----------------------------------------------------------------------------------
// The block of each box among the things goes into the section: its `id` on every box of the
// block, as its last field. The block of two boxes, by its second box, and the bed, which is
// passed over. Put there again, nothing changes.
const into = (id) => (thing) => ({ ...thing, section: id });
sections.put([things()[2], things()[4]], 1);
const PUT = drawn([A, ...B.map(into(1)), C, BED], { sections: [HOME, GARAGE] });
stepped(PUT, 'a block put into a section');
assert.equal(text().split(',"name":"Home","section":1}').length, 3);
still(() => sections.put([things()[1], things()[2], things()[4]], 1), 'put there again');
// Into another section, the number stands where the first stood - a box that was named since
// says its name after it - and a block that had none says it last.
sections.put([things()[3]], 1);
sketch.name(things()[3], 'Yard');
sections.put([things()[3], things()[0], things()[1]], 2);
const yard = { ...C, section: 2, name: 'Yard' };
const MOVED = drawn([into(2)(A), ...B.map(into(2)), yard, BED], { sections: [HOME, GARAGE] });
stepped(MOVED, 'three blocks put into another section');
assert.ok(text().includes('"colour":1,"section":2,"name":"Yard"},{"kind":"bed"'));
// With null, out of every section: the field is gone from every box of each block.
sections.put([things()[2], things()[0]], null);
stepped(drawn([A, ...B, yard, BED], { sections: [HOME, GARAGE] }), 'two blocks put out');
sections.put(things(), null);
const NAMED = { ...C, name: 'Yard' };
stepped(drawn([A, ...B, NAMED, BED], { sections: [HOME, GARAGE] }), 'every block put out');
// WHAT CHANGES NOTHING, and makes no step: an `id` that the list does not have, and what is no
// `id`; an object alone, and no thing; and out of every section what is in none.
for (const none of [9, 0, '1', undefined, true]) {
  still(() => sections.put(things(), none), `put into ${none}`);
}
still(() => sections.put([things()[4]], 1), 'a bed put into a section');
still(() => sections.put([], 1), 'nothing put into a section');
still(() => sections.put(things(), null), 'put out of no section');

// --- `sections.rename` -------------------------------------------------------------------------------
// Another name, without the blanks at its ends: `{ name }`, and one step. Its own name in other
// capitals is no name that is taken. The name it has makes no step; a name that is refused
// neither, in its sentence; and an `id` that the list does not have gives neither.
await pad(TWO);
assert.deepEqual(sections.rename(1, ' Upper home '), { name: 'Upper home' });
const UPPER = { id: 1, name: 'Upper home' };
stepped(drawn([A, ...B, C, BED], { sections: [UPPER, GARAGE] }), 'a section renamed');
assert.deepEqual(sections.rename(1, 'UPPER HOME'), { name: 'UPPER HOME' });
const LOUD = { id: 1, name: 'UPPER HOME' };
stepped(drawn([A, ...B, C, BED], { sections: [LOUD, GARAGE] }), 'a section renamed in capitals');
still(() => sections.rename(1, ' UPPER HOME '), 'the name it has', { name: 'UPPER HOME' });
const UPPER_TAKEN = { refused: 'There is a section "UPPER HOME" already.' };
still(() => sections.rename(2, 'upper home'), 'a name that is taken', UPPER_TAKEN);
still(() => sections.rename(2, '  '), 'no name', NEEDED);
for (const none of [9, 0, '1', undefined]) {
  still(() => sections.rename(none, 'Shed'), `rename ${none}`, {});
  still(() => sections.rename(none, ''), `rename ${none} to nothing`, {});
}

// --- `sections.move` and `sections.hide` -------------------------------------------------------------
// Three sections. A place down the list with 1, a place up with -1, and no box is touched; at
// an end of the list nothing, and nothing for any other number of places or another `id`.
const YARD = { id: 3, name: 'Yard' };
const three = (...listed) => drawn([A, ...B.map(into(1)), into(3)(C), BED], { sections: listed });
await pad(three(HOME, GARAGE, YARD));
sections.move(1, 1);
stepped(three(GARAGE, HOME, YARD), 'a section moved down');
sections.move(1, 1);
stepped(three(GARAGE, YARD, HOME), 'a section moved down to the foot');
still(() => sections.move(1, 1), 'moved down at the foot');
still(() => sections.move(2, -1), 'moved up at the head');
sections.move(3, -1);
stepped(three(YARD, GARAGE, HOME), 'a section moved up to the head');
for (const by of [0, 2, -2, 0.5, '1', '-1', undefined, null, true]) {
  still(() => sections.move(2, by), `moved by ${by}`);
}
still(() => sections.move(3, 2), 'moved two places down');
still(() => sections.move(1, -2), 'moved two places up');
for (const none of [9, '2', undefined]) still(() => sections.move(none, 1), `move ${none}`);
// Hidden, an entry says `hidden: true` after its name; shown again, the field is gone: the
// bytes of before. Nothing but `true` hides, and anything else shows. What is so already makes
// no step, and nothing does for another `id`.
const before = text();
sections.hide(2, true);
const HIDDEN = three(YARD, { ...GARAGE, hidden: true }, HOME);
stepped(HIDDEN, 'a section hidden');
assert.ok(text().includes('{"id":2,"name":"Garage and cellar","hidden":true},{"id":1,'));
assert.deepEqual(sections.list()[1], { ...GARAGE, hidden: true });
still(() => sections.hide(2, true), 'hidden again');
still(() => sections.hide(1, false), 'shown, as it is');
still(() => sections.hide(3), 'shown, with nothing said');
for (const no of ['true', 1, 'yes', {}]) still(() => sections.hide(1, no), `hidden with ${no}`);
still(() => sections.hide(9, true), 'another id hidden');
sections.hide(2, false);
stepped(before, 'a section shown again');
sketch.step(sketch.past, sketch.future);
assert.equal(text(), HIDDEN);
sections.hide(2);
stepped(before, 'a section shown again, with nothing said');

// --- `sections.remove` -------------------------------------------------------------------------------
// The entry is gone from the list, and `section` from every box of every block that is in the
// section - of the block D too, which is in section 1 by its first box, though its second names
// another - and from every other box that says its `id`: the second box of E, a block of
// section 2. No box is changed otherwise: A, of section 2, and C, of section 3, are as they were.
const D = [1, 2].map((id, at) => ({ ...lies(50 + 8 * at), group: 2, section: id }));
const E = [2, 1].map((id, at) => ({ ...lies(70 + 8 * at), group: 3, section: id }));
const listed = [HOME, { ...GARAGE, hidden: true }, YARD];
const HELD = [into(2)(A), ...B.map(into(1)), into(3)(C), BED, ...D, ...E];
const FULL = drawn(HELD, { sections: listed });
await pad(FULL);
const ids = () => things().map((thing) => sections.of(thing)?.id ?? null);
assert.deepEqual(ids(), [2, 1, 1, 3, 1, 1, 1, 2, 2]);
sections.remove(1);
const bare = ({ x, y, z, colour, group }) => ({ x, y, z, colour, group });
const LEFT = [into(2)(A), ...B, into(3)(C), BED, ...D.map(bare), E[0], bare(E[1])];
stepped(drawn(LEFT, { sections: listed.slice(1) }), 'a section removed');
assert.deepEqual(ids(), [2, null, null, 3, null, null, null, 2, 2]);
assert.equal(sketch.past.length, 1);
// Undo brings the section back with its blocks, and with the bed that stands in one of them.
sketch.step(sketch.past, sketch.future);
assert.deepEqual([text(), ids()], [FULL, [2, 1, 1, 3, 1, 1, 1, 2, 2]]);
assert.deepEqual(sections.list()[0], { ...HOME, hidden: false });
sketch.step(sketch.future, sketch.past);
for (const none of [1, 9, '2', undefined, null]) {
  still(() => sections.remove(none), `remove ${none}`);
}
// With its last section a sketch has no `sections`: with no box that names one, it has the bytes
// of a sketch that never held a section.
sections.remove(3);
sections.remove(2);
stepped(drawn([A, ...B, C, BED, ...D.map(bare), ...E.map(bare)]), 'the last section removed');
assert.deepEqual([sections.list(), text().includes('section')], [[], false]);

// --- a new `id` -------------------------------------------------------------------------------------
// One more than the largest that the list or any box says: a number that no box names - also
// where a box names a section that is gone from the list, or the list is not in the order of
// its numbers. What is no `id` on a box says nothing here either, and neither does an object.
assert.deepEqual(sections.make('Home 1'), { id: 1 });
const NAMING = [into(7)(A), into('12')(C), { ...BED, section: 40 }];
const [FIVE, SECOND] = [5, 2].map((id) => ({ id, name: `Section ${id}` }));
await pad(drawn(NAMING, { sections: [FIVE, SECOND] }));
assert.deepEqual([sections.make('Six'), sections.make('Seven')], [{ id: 8 }, { id: 9 }]);
assert.equal(
  sections
    .list()
    .map(({ id }) => id)
    .join(),
  '5,2,8,9',
);
assert.deepEqual([sections.of(things()[0]), things()[0].section], [null, 7]);
await pad(drawn([into(3)(A), C]));
assert.deepEqual([sections.make('Home 1'), sections.of(things()[0])], [{ id: 4 }, null]);

// --- from the first step on ----------------------------------------------------------------------------
// `sections` is what the pad read of it, as `figures` is once a figure is set: an entry that was
// none is gone, and an entry says `id`, `name` and `hidden` and nothing else. A step that
// changes nothing rewrites nothing: the list stays as it was written.
const MORE = { name: 'Home 1', more: 3, hidden: 'yes', id: 1 };
const BY_HAND = { figures: { doorHighM: 2.4 }, sections: [null, { id: 2, name: ' ' }, MORE, HOME] };
await pad(drawn([into(1)(A), C], BY_HAND));
still(() => sections.hide(1, false), 'shown, as it is, in a list written by hand');
still(() => sections.put([things()[0]], 1), 'put where it is, in a list written by hand');
still(() => sections.put([things()[1]], null), 'put out of no section, there');
still(() => sections.rename(1, ' Home 1 '), 'the name it has, there', { name: 'Home 1' });
still(() => sections.move(1, 1), 'moved at the foot, there');
still(() => sections.remove(2), 'what is no section removed, there');
sections.hide(1, true);
const READ = { ...BY_HAND, sections: [{ id: 1, name: 'Home 1', hidden: true }] };
stepped(drawn([into(1)(A), C], READ), 'the list as the pad read it');
// And a list that holds no section is left out of the sketch, where a step changed a box.
const NO_LIST = [{ sections: [null, { id: 0, name: 'x' }] }, {}];
for (const none of NO_LIST) {
  await pad(drawn([into(1)(A), C], none));
  sections.put([things()[0]], null);
  stepped(drawn([A, C]), 'a box put out of a section that is none');
}
// A sketch that holds figures gets its sections after them: where they were first set.
await pad(drawn([A], { figures: { doorHighM: 2.4 } }));
sections.make('Home 1');
assert.ok(text().endsWith(',"figures":{"doorHighM":2.4},"sections":[{"id":1,"name":"Home 1"}]}'));

process.stdout.write(
  'tools/sketch/sections: a section is made, filled, renamed, moved, hidden and removed, each in one step that Undo takes back to the byte, and nothing that changes nothing is a step\n',
);
