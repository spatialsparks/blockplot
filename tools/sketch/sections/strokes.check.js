// The check of what the pad's own strokes make of a section (story ST-032), with strokes.js as
// it is: no stroke was changed for a section. From above, three blocks side by side - A in
// section 1, B in section 2, C in none: the pieces that the eraser's box leaves of A, a corner
// taken or cut in two, each say 1 and are one block; a copy of A, moved with Ctrl, says 1, and so
// do the pieces of a copy; A and B merged are one block of section 1 - of section 2, where B
// stands before A in the sketch - and C merged with B is of section 2, whichever stands first.
// Each is one step, which Undo takes back. Then the golden files of version 7: the file that
// holds every field is its file of `v6/` with the seven steps that gave it its sections and its
// rates, made here again at every run, byte for byte; and the made-up house is its file of
// `v6/` but for its version. The pad's own scripts on a made-up store and the made-up plot: no
// browser, nothing of the real site. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/sections/strokes.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { asNow, golden, VERSION } from '../check-golden.js';

// A browser's two stores. The scripts of the sections and of the rates are loaded first and
// once, before there is a paper or a sketch: they read nothing as they load.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
for (const file of ['sections/model', 'info/rates', 'demo-site', 'categories']) {
  await import(`../${file}.js`);
}
const { sections, rates } = globalThis;
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
  assert.deepEqual([globalThis.paper.PLANE, sketch.past.length], ['top', 0]);
}
const things = () => sketch.doc.things;
const text = () => JSON.stringify(sketch.doc);
const stroke = (tool, from, to, more) => sketch.apply({ tool, from, to, colour: 3, ...more });
/** Of each thing: the section it is in, and how many boxes its block has. */
const told = () =>
  things().map((thing) => `${sections.of(thing)?.id ?? 'none'} of ${sketch.blockOf(thing).length}`);
/** The stroke was one step: Undo has the sketch as it was, to the byte, and Redo as it is. */
function undone(was) {
  const [now, steps] = [text(), sketch.past.length];
  sketch.step(sketch.past, sketch.future);
  assert.deepEqual([text(), sketch.past.length], [was, steps - 1]);
  sketch.step(sketch.future, sketch.past);
  assert.deepEqual([text(), local.held.get(KEY), sketch.past.length], [now, now, steps]);
}

// THE SKETCH: on the level at 814 m, row 24 of a standing view, three blocks of 4 m by 4 m side
// by side, columns 20 to 44 and rows 16 to 24 of the top view - A red, B green, C blue - and two
// sections. A is in the first and B in the second; C is in none.
const lies = (column) => ({ x: [column, column + 8], y: [16, 24], z: [18, 24] });
const A = { ...lies(20), colour: 1, section: 1 };
const B = { ...lies(28), colour: 4, section: 2 };
const C = { ...lies(36), colour: 6 };
const HOMES = [
  { id: 1, name: 'Home 1' },
  { id: 2, name: 'Home 2' },
];
const drawn = (...all) =>
  JSON.stringify({
    space: VERSION,
    things: all,
    floors: [],
    notes: [],
    on: { top: 24 },
    show: { top: {} },
    sections: HOMES,
  });
const PLAIN = drawn(A, B, C);
await pad(PLAIN);
assert.deepEqual([text(), sketch.on(), told()], [PLAIN, 24, ['1 of 1', '2 of 1', 'none of 1']]);

// --- the eraser ---------------------------------------------------------------------------------------
// ITS BOX TAKES A CORNER OF A, 1.5 m by 1.5 m: what is left of A is two boxes in the place of
// the one - the 4 m by 2.5 m under the corner, and the 2.5 m by 1.5 m beside it - each with all
// that A said, its section too, and with one `group`: one block of section 1, in A's place.
stroke('erase', [20.5, 16.5], [22.5, 18.5]);
const CORNER =
  '{"x":[20,28],"y":[19,24],"z":[18,24],"colour":1,"section":1,"group":1},' +
  '{"x":[23,28],"y":[16,19],"z":[18,24],"colour":1,"section":1,"group":1}';
assert.equal(text(), PLAIN.replace(JSON.stringify(A), CORNER));
assert.deepEqual(told(), ['1 of 2', '1 of 2', '2 of 1', 'none of 1']);
undone(PLAIN);
// IT CUTS A IN TWO, a metre wide and from edge to edge: the two halves, 1.5 m wide each, say 1
// and are one block.
await pad(PLAIN);
stroke('erase', [23.5, 15.5], [24.5, 24.5]);
const HALVES =
  '{"x":[20,23],"y":[16,24],"z":[18,24],"colour":1,"section":1,"group":1},' +
  '{"x":[25,28],"y":[16,24],"z":[18,24],"colour":1,"section":1,"group":1}';
const CUT = PLAIN.replace(JSON.stringify(A), HALVES);
assert.equal(text(), CUT);
assert.deepEqual(told(), ['1 of 2', '1 of 2', '2 of 1', 'none of 1']);
undone(PLAIN);

// --- a copy --------------------------------------------------------------------------------------------
// Select, with Ctrl held, moves a copy and leaves the block: the copy of the two halves, 5 m
// further across the plot, is the last two of the things - a block of its own, with another
// `group`, and of section 1 as the block it was made of.
const held = { ...sketch.grab([21, 20], 0.3), copy: true };
assert.deepEqual(held, { at: 0, zone: 'move', copy: true });
stroke('move', [21, 20], [21, 30], { grabbed: held });
const COPIES =
  '{"x":[20,23],"y":[26,34],"z":[18,24],"colour":1,"section":1,"group":2},' +
  '{"x":[25,28],"y":[26,34],"z":[18,24],"colour":1,"section":1,"group":2}';
assert.equal(text(), CUT.replace('}],"floors"', `},${COPIES}],"floors"`));
assert.deepEqual(told(), ['1 of 2', '1 of 2', '2 of 1', 'none of 1', '1 of 2', '1 of 2']);
undone(CUT);
// So of a block of one box: the copy of B says 2, and is a block of its own.
await pad(PLAIN);
stroke('move', [32, 20], [32, 30], { grabbed: { ...sketch.grab([32, 20], 0.3), copy: true } });
assert.deepEqual(things().at(-1), { ...B, y: [26, 34] });
assert.deepEqual(told(), ['1 of 1', '2 of 1', 'none of 1', '2 of 1']);
undone(PLAIN);

// --- merged --------------------------------------------------------------------------------------------
// Merge makes one block of the blocks that its box reaches into, in the colour of the first,
// and leaves each box what it says: of the block's boxes the first that names a listed section
// counts, and Merge lays the boxes of the block that stands first in the sketch first.
// A AND B: one block of two boxes, of section 1 - A stands first. C is as it was.
const merged = (...boxes) => boxes.map((one) => ({ ...one, colour: boxes[0].colour, group: 1 }));
await pad(PLAIN);
stroke('merge', [26.5, 18.5], [29.5, 19.5]);
assert.deepEqual(things(), [C, ...merged(A, B)]);
assert.deepEqual([things()[1].section, things()[2].section], [1, 2]);
assert.deepEqual(told(), ['none of 1', '1 of 2', '1 of 2']);
undone(PLAIN);
// The box that was B still says 2, read by nobody while A's stands first: with all that was A
// erased away, the block that is left is of section 2.
stroke('erase', [20.5, 16.5], [27.5, 23.5]);
assert.deepEqual(
  [things(), told()],
  [
    [C, merged(A, B)[1]],
    ['none of 1', '2 of 1'],
  ],
);
// B AND A, where B stands before A in the sketch: one block of section 2.
await pad(drawn(B, A, C));
stroke('merge', [26.5, 18.5], [29.5, 19.5]);
assert.deepEqual(things(), [C, ...merged(B, A)]);
assert.deepEqual(told(), ['none of 1', '2 of 2', '2 of 2']);
undone(drawn(B, A, C));
// C WITH B, a block of no section with one of section 2: of section 2, whichever stands first
// in the sketch - where it is C, its box says nothing, and B's is the first that names one.
for (const [first, second] of [
  [B, C],
  [C, B],
]) {
  await pad(drawn(A, first, second));
  stroke('merge', [34.5, 18.5], [37.5, 19.5]);
  assert.deepEqual(things(), [A, ...merged(first, second)]);
  assert.deepEqual(told(), ['1 of 1', '2 of 2', '2 of 2']);
  undone(drawn(A, first, second));
}
// And all three: one block of section 1, by its first box.
await pad(PLAIN);
stroke('merge', [26.5, 18.5], [37.5, 19.5]);
assert.deepEqual([things(), told()], [merged(A, B, C), ['1 of 3', '1 of 3', '1 of 3']]);

// --- the golden files -------------------------------------------------------------------------------
// The made-up house of version 7 is its file of version 6 but for its version, which says 7, and
// says nothing of a section or of a rate. And the file that holds every field is its file of version 6 with all that
// version 7 brought, by seven steps, as the pad writes them: two sections made; the studio - the
// first of its things - and the workshop, by the first of its two boxes, put into the first; the
// second hidden; and three rates set, each in a change of its own - for a room, for open air,
// and for the category Workshop alone. Byte for byte, the file: a golden file that is edited by
// hand fails here.
assert.equal(asNow('made-up', 7), asNow('made-up', 6));
assert.ok(golden('made-up', 7).startsWith('{"space":7,'));
assert.doesNotMatch(golden('made-up', 7), /section|rates/);
await pad(golden('every-part', 6));
assert.equal(text(), asNow('every-part', 6));
assert.deepEqual(
  [things()[0].name, things()[1].name, things()[1].group],
  ['Studio', 'Workshop "L"', 1],
);
assert.deepEqual(sections.make('Atelier "Süd"'), { id: 1 });
assert.deepEqual(sections.make('Yard'), { id: 2 });
sections.put([things()[0], things()[1]], 1);
sections.hide(2, true);
sketch.change((doc) => rates.set(doc, { as: 'room' }, 950));
sketch.change((doc) => rates.set(doc, { as: 'open' }, 300));
sketch.change((doc) => rates.set(doc, { category: 'workshop' }, 420.5));
const EVERY = asNow('every-part', 7);
assert.equal(text(), EVERY);
assert.deepEqual([local.held.get(KEY), sketch.past.length], [EVERY, 7]);
// By hand: three boxes of the file end with their section - the studio and both boxes of the
// workshop - and the file ends with its sections and its rates, after its figures. With those
// taken out, it is its file of version 6 but for its version: nothing else of it changed.
const ENDS =
  ',"sections":[{"id":1,"name":"Atelier \\"Süd\\""},{"id":2,"name":"Yard","hidden":true}],' +
  '"rates":{"as":{"room":950,"open":300},"category":{"workshop":420.5}}}';
assert.ok(EVERY.endsWith(`,"figures":{"windowHighM":1.2}${ENDS}`));
assert.equal(EVERY.split(',"section":1}').length, 4);
assert.deepEqual(
  things().flatMap((thing, at) => ('section' in thing ? [at] : [])),
  [0, 1, 2],
);
assert.equal(EVERY.replaceAll(',"section":1}', '}').replace(ENDS, '}'), asNow('every-part', 6));
// As the pad reads it: two sections, the second hidden; the studio, the workshop and the six
// objects that stand in them in the first - the person and the bush stand on the ground - and
// the cellar, the bank and the dig in none. The hidden section holds no block: nothing of the
// file is hidden. A room at 950 francs a cubic metre, open air at 300 a square metre, and the
// category Workshop at 420.50 of its own.
assert.deepEqual(sections.list(), [
  { id: 1, name: 'Atelier "Süd"', hidden: false },
  { id: 2, name: 'Yard', hidden: true },
]);
const inFirst = things().map((thing) => sections.of(thing)?.id === 1);
const FIRST = 'Studio, Workshop "L", Workshop "L", window, bed, spiral, sink, desk, widestairs';
assert.equal(
  things()
    .filter((_, at) => inFirst[at])
    .map(({ name, kind }) => name ?? kind)
    .join(', '),
  FIRST,
);
assert.deepEqual(
  [things().length, things().filter((thing) => sections.of(thing)?.id === 2)],
  [14, []],
);
assert.deepEqual(things().filter(sections.hides), []);
assert.deepEqual(rates.of(sketch.doc), {
  as: { room: 950, open: 300 },
  category: { workshop: 420.5 },
});

process.stdout.write(
  'tools/sketch/sections: the pieces of a cut, a copy and a merged block keep the section of their block with no stroke changed, and the golden file is what seven steps write\n',
);
