// The check of a category and of a cut in the pad (story ST-028; version 6 of the sketch
// file): what categories.check.js, which holds the list and its two readings, had no room for.
// The one writer, `sketch.categorise`: a key of the list on every box of the block and `is` off
// every box, in one step that Undo takes back to the byte; the key where it stood, where a box
// had one; no key takes the category away and leaves `is`; an object, and a word that no row
// has, change nothing. `sketch.worded`, the word on a block without a name. The key C, six
// steps round from a picked category. What stands under the two fields and says nothing stays
// in a sketch as it was written. What the pad says,
// word for word, in a standing view and from above: what a block counts as and by what - by its
// category, where one was picked - of a cut where its floor lies and no more, and of every
// block its category, in a sentence of its own. And the golden file of version 6 that holds every
// field: its cut, as the pad's own strokes draw, name, categorise and set it - byte for byte.
// The pad's own scripts on a made-up store and the made-up plot: no browser, nothing of the real
// site. Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/categories-pad.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { asNow, golden, VERSION } from './check-golden.js';

// A browser's two stores. The scripts that read the paper are loaded anew for each view: what
// the pad says of a block differs between a standing view and the view from above. The list
// reads nothing as it loads, and is loaded once.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
for (const file of ['demo-site', 'categories']) await import(`./${file}.js`);
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const KEY = 'blockplot/sketch/space';
const SCRIPTS = ['paper', 'figures', 'shapes', 'blocks', 'legacy', 'sketch', 'strokes', 'labels'];
let loads = 0;
/** The pad's sketch, loaded anew in a view of the made-up plot, on a store that holds this text: with what a tool does to it, its writers, and what the pad says in words. */
async function pad(view, text) {
  for (const one of [local, session]) one.held.clear();
  local.held.set(KEY, text);
  globalThis.location = { hash: `#${view}` };
  loads += 1;
  for (const file of [...SCRIPTS, 'footer']) await import(`./${file}.js?${loads}`);
  assert.equal(globalThis.paper.VIEW, view);
  return globalThis.sketch;
}

// --- the one writer: `sketch.categorise` ------------------------------------------------------------
// A made-up sketch: a roof terrace of two boxes, an L, open air by its name and a Roof by it;
// a block with no name; and a bed.
const TERRACE = [
  { x: [50, 58], y: [22, 30], z: [22, 24], colour: 4, group: 1, name: 'Roof terrace' },
  { x: [50, 54], y: [30, 38], z: [22, 24], colour: 4, group: 1, name: 'Roof terrace' },
];
const BLOCK = { x: [30, 42], y: [22, 30], z: [18, 24], colour: 2 };
const BED = { kind: 'bed', x: 20, y: 20, floor: 24 };
const drawn = (...all) =>
  JSON.stringify({ space: VERSION, things: all, floors: [], notes: [], on: {}, show: { top: {} } });
const PLAIN = drawn(...TERRACE, BLOCK, BED);
let sketch = await pad('side', PLAIN);
const things = () => sketch.doc.things;
const text = () => JSON.stringify(sketch.doc);
const undo = () => sketch.step(sketch.past, sketch.future);
const is = (at) => {
  const boxes = sketch.blockOf(things()[at]);
  const { category, by } = globalThis.categories.of(boxes);
  return `${category?.key}, ${by}: ${Object.values(globalThis.blocks.countsAs(boxes)).join(' by ')}`;
};
// The sketch with the terrace saying more: what each of its two boxes says after its name.
const saying = (more) =>
  PLAIN.replaceAll('"name":"Roof terrace"}', `"name":"Roof terrace"${more}}`);
const SET = saying(',"is":"room"');
assert.deepEqual([text(), is(0), is(1)], [PLAIN, 'roof, name: open by name', is(0)]);
// C HAD SET IT: a room, by hand. Picked - by its second box - the block says the key on both
// boxes, as their last field, and `is` on neither: it counts as its category says. One step,
// kept as it is made; Undo has what C had set again, to the byte, and redo the pick.
sketch.countNext(things()[0]);
assert.deepEqual([text(), is(1)], [SET, 'roof, name: room by is']);
sketch.categorise(things()[1], 'storage');
assert.deepEqual([text(), is(0), is(1)], [saying(',"category":"storage"'), is(1), is(0)]);
assert.deepEqual(
  [is(0), local.held.get(KEY), sketch.past.length],
  ['storage, picked: room by category', text(), 2],
);
undo();
assert.equal(text(), SET);
sketch.step(sketch.future, sketch.past);
assert.equal(text(), saying(',"category":"storage"'));
// ANOTHER ONE PICKED stands where the first stood, and the picked one counts, whatever the name
// says. C after it sets by hand again, against the category - and picked once more, the same
// key, `is` is gone again. The same key with no `is` to take away changes nothing: no step.
sketch.categorise(things()[0], 'balcony');
assert.deepEqual(
  [text(), is(1)],
  [saying(',"category":"balcony"'), 'balcony, picked: open by category'],
);
sketch.countNext(things()[1]);
assert.deepEqual(
  [text(), is(0)],
  [saying(',"category":"balcony","is":"room"'), 'balcony, picked: room by is'],
);
for (const steps of [5, 5]) {
  sketch.categorise(things()[0], 'balcony');
  assert.deepEqual([text(), sketch.past.length], [saying(',"category":"balcony"'), steps]);
}
// NO KEY takes the category away: the block is read from its name again, and the sketch is
// byte for byte what it was before a category was picked. And it leaves `is` as it is: with C
// pressed after the pick, what C set stays - the sketch of before the pick, to the byte.
sketch.categorise(things()[1]);
assert.deepEqual([text(), is(0), sketch.past.length], [PLAIN, 'roof, name: open by name', 6]);
undo();
assert.equal(text(), saying(',"category":"balcony"'));
sketch.countNext(things()[0]);
sketch.categorise(things()[0], '');
assert.deepEqual([text(), is(1)], [SET, 'roof, name: room by is']);
// WHAT CHANGES NOTHING, and makes no step: an object, with a key and with none; a word that no
// row has - the name of a row, a key with a blank, one that every object has, a number; and no
// key, on a block that says none.
const steps = sketch.past.length;
for (const none of ['bedroom', undefined]) sketch.categorise(things()[3], none);
for (const none of ['Bathroom', 'living room', 'pool', 'constructor', 7, true, ['gym'], '']) {
  sketch.categorise(things()[2], none);
}
assert.deepEqual([text(), sketch.past.length], [SET, steps]);
assert.equal(text().includes('category'), false);

// --- the word on a block without a name: `sketch.worded` ---------------------------------------------
// The name of the category that was picked for it, as the list shows it - and none where the
// block has a name, where nothing was picked, and of an object. A box that had no category has
// it as its last field; named after, and another picked, the key stands where it stood.
const worded = () => things().map(sketch.worded);
assert.deepEqual(worded(), [undefined, undefined, undefined, undefined]);
sketch.categorise(things()[2], 'bathroom');
sketch.categorise(things()[0], 'gym');
assert.deepEqual(worded(), [undefined, undefined, 'Bathroom', undefined]);
assert.ok(text().includes('"z":[18,24],"colour":2,"category":"bathroom"},{"kind":"bed"'));
sketch.name(things()[2], 'Balcony');
sketch.categorise(things()[2], 'storage');
assert.ok(text().includes('"colour":2,"category":"storage","name":"Balcony"},{"kind":"bed"'));
assert.deepEqual([worded()[2], is(2)], [undefined, 'storage, picked: room by category']);
// C goes its six steps round from a picked category as from a name: each of the five set by
// hand, the category picked all the while, and after the sixth the bytes of before.
const [picked, ROUND] = [text(), ['room', 'open', 'glass', 'ground', 'cut']];
const round = [...ROUND, 'room'].map(() => (sketch.countNext(things()[2]), is(2)));
const stepped = [...ROUND.map((as) => `${as} by is`), 'room by category'];
assert.deepEqual([round, text()], [stepped.map((as) => `storage, picked: ${as}`), picked]);
// Of two boxes of one block the first that says a key counts, as with a name: the word is its.
sketch.name(things()[0], '');
things()[0].category = 'no key';
assert.deepEqual(worded().slice(0, 2), ['Gym', 'Gym']);
// And a sketch is refused for nothing that stands under the two fields: with what is no key and
// no word a block counts as, it is read, and written back byte for byte, each as it was written.
const STRAY = drawn({ ...BLOCK, category: 'Bathroom', is: 'pool' }, { ...BLOCK, category: 7 });
assert.equal(JSON.stringify(sketch.adopt(JSON.parse(STRAY))), STRAY);
assert.ok(STRAY.includes('"category":"Bathroom","is":"pool"},') && STRAY.includes('"category":7}'));

// --- what the pad says -------------------------------------------------------------------------------
// Word for word, of blocks of 6 m by 4 m and 3 m high on 814 m - rows 18 to 24 of a standing
// view - and of a bed. `words` is what stands beside the paper: what the block counts as, by
// what, the key, and how large it is. Of a room, open air and glass, as ever: 24 m² of floor,
// 3 m high, 72 m³, its floor at 814 m. Of ground its top, 817 m. Of a cut its floor, 814 m, and
// no word of a floor's area, of a height, of a volume or of its top. And `category`, a sentence
// of its own. The fifth and the sixth block had C pressed once, the last five times.
const SIZED = '24 m² of floor, 6 m by 4 m, 3 m high, 72 m³. Its floor is 814 m above sea level.';
const TOP = '24 m², 6 m by 4 m. Its top is 817 m above sea level.';
const FLOOR = '24 m², 6 m by 4 m. Its floor is 814 m above sea level.';
const [PICKED, BY_NAME] = ['picked from the list.', 'by its name.'];
const TOLD = [
  [
    { name: 'Kitchen / Dining' },
    'Kitchen / Dining: a room, by its name',
    SIZED,
    `Kitchen, ${BY_NAME}`,
  ],
  [{ category: 'bathroom' }, 'Block: a room, by its category', SIZED, `Bathroom, ${PICKED}`],
  [{ category: 'balcony' }, 'Block: open air, by its category', SIZED, `Balcony, ${PICKED}`],
  [
    { name: 'Balcony', category: 'storage' },
    'Balcony: a room, by its category',
    SIZED,
    `Storage, ${PICKED}`,
  ],
  [{ name: 'Roof terrace' }, 'Roof terrace: a room, set by hand', SIZED, `Roof, ${BY_NAME}`],
  [{ category: 'garden' }, 'Block: a room, set by hand', SIZED, `Garden, ${PICKED}`],
  [
    { name: 'Day rooms' },
    'Day rooms: a room, by its name',
    SIZED,
    null,
    'its name holds no word of the list.',
  ],
  [{}, 'Block: a room, as it has no name', SIZED, null, 'it has no name.'],
  [{ category: 'ground-fill' }, 'Block: ground, by its category', TOP, `Ground fill, ${PICKED}`],
  [{ category: 'ground-cut' }, 'Block: a cut, by its category', FLOOR, `Ground cut, ${PICKED}`],
  [{ name: 'Ground cut' }, 'Ground cut: a cut, by its name', FLOOR, `Ground cut, ${BY_NAME}`],
  [{}, 'Block: a cut, set by hand', FLOOR, null, 'it has no name.'],
];
const PRESSED = { 4: 1, 5: 1, 11: 5 };
const laid = (said, at) => ({
  x: [2 + 14 * (at % 6), 14 + 14 * (at % 6)],
  y: at < 6 ? [10, 18] : [30, 38],
  z: [18, 24],
  colour: 3,
  ...said,
});
const TO_SLOPE =
  ' With Shift held down, drag a top corner of a box down to slope its top, or back up to level it.';
for (const view of ['side', 'top']) {
  sketch = await pad(view, drawn(...TOLD.map(([said], at) => laid(said, at)), BED));
  for (const [at, presses] of Object.entries(PRESSED)) {
    for (let press = 0; press < presses; press += 1) sketch.countNext(things()[at]);
  }
  const more = view === 'top' ? '' : TO_SLOPE;
  for (const [at, [, counted, large, category, none]] of TOLD.entries()) {
    const said = globalThis.footer.picked(things()[at]);
    assert.equal(said.words, `${counted}. C changes it. ${large}${more}`, `${view}, block ${at}`);
    const its = category === null ? `No category: ${none}` : `Category: ${category}`;
    assert.equal(said.category, its, `${view}, the category of block ${at}`);
  }
  assert.deepEqual(
    [things().at(-1), globalThis.footer.picked(things().at(-1)).category],
    [BED, ''],
  );
}

// --- the golden files -------------------------------------------------------------------------------
// The made-up house is its file of version 5 as the pad reads it, with its cut, by hand, as the
// last of its things: one thing more, and so not that file. And the file of version 6
// that holds every field is its file of version 5 with one thing more, the last: a cut, as the
// pad writes it - the Block tool in the side view, on the slice that the file has, row 20 of the
// top view, from column 62 to 68 and from row 18 to 22, in pink; named; its category picked; set
// to a cut, as five presses of C set it: 6 m deep about its slice, rows 14 to 26. Byte for byte
// but for its version, the file of `v6/`, frozen: what the file of now has more is sections/'s.
const more = (text, thing) => text.replace('}],"floors"', `},${thing}],"floors"`);
const CUT = '{"x":[30,50],"y":[10,22],"z":[18,24],"colour":1,"category":"ground-cut"}';
assert.equal(golden('made-up'), more(asNow('made-up', 5), CUT));
assert.notEqual(asNow('made-up', 5), golden('made-up'));
sketch = await pad('side', golden('every-part', 5));
assert.deepEqual([text(), sketch.on()], [asNow('every-part', 5), 20]);
sketch.apply({ tool: 'block', from: [62.5, 18.5], to: [67.5, 21.5], colour: 8 });
sketch.name(things().at(-1), 'Dig');
sketch.categorise(things().at(-1), 'ground-cut');
sketch.count(things().at(-1), 'cut');
const DIG =
  '{"x":[62,68],"y":[14,26],"z":[18,22],"colour":8,"name":"Dig","category":"ground-cut","is":"cut"}';
assert.equal(text(), asNow('every-part', 6));
assert.equal(asNow('every-part', 6), more(asNow('every-part', 5), DIG));
assert.deepEqual([local.held.get(KEY), sketch.past.length], [asNow('every-part', 6), 4]);
// It holds each word that a block can say, once, on every box of the block: its studio glass,
// its workshop - the two boxes of group 1 - open air, its cellar a room, its bank ground, its
// dig a cut. The dig is its sixth box, the last of its things, and level; it is a cut by what
// it says, with the category that was picked for it, and the one thing of the file that says
// one. Before it stands the bank, and before that the last of the file's objects, the wide
// staircase.
const boxes = things().filter(sketch.isBox);
const told = boxes.map((box) => `${box.group ?? 'alone'}: ${box.is}`);
const ALONE = ['alone: glass', '1: open', '1: open', 'alone: room', 'alone: ground', 'alone: cut'];
assert.deepEqual(told, ALONE);
const [wide, bank, dig] = things().slice(-3);
assert.deepEqual(
  [boxes.at(-1), globalThis.blocks.topOf(dig), is(things().length - 1)],
  [dig, null, 'ground-cut, picked: cut by is'],
);
assert.deepEqual(
  things().filter((thing) => 'category' in thing),
  [dig],
);
assert.deepEqual(
  [wide.kind, things().findLast((thing) => thing.kind), bank.name],
  ['widestairs', wide, 'Bank'],
);
// Its floor lies in row 22, 815 m, on the level that the cellar and the bank stand on: it makes
// no level of its own. No thing of the file lies in it or against it. And it is a cut in the
// air, which takes nothing away: the hill lies at 820 - 0.1 c - 0.02 r m, 813.52 m at its
// uphill corner, column 62 of row 14, and 812.68 m at the one across from it.
assert.deepEqual(
  [dig.z[1], bank.z[1], boxes[3].z[1], sketch.nameOf('top', 22)],
  [22, 22, 22, 'Level 815 m'],
);
const meets = (a, b) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
const lies = (thing) => sketch.rect(thing, 'top');
const touching = things().filter((thing) => thing !== dig && meets(lies(thing), lies(dig)));
assert.deepEqual(touching, []);
const hill = [globalThis.paper.realAt(62, 14), globalThis.paper.realAt(68, 26)];
assert.deepEqual(
  hill.map((metres) => metres.toFixed(6)),
  ['813.520000', '812.680000'],
);
// And the pad says of it what it says of a cut: 3 m by 6 m, its floor at 815 m.
const said = globalThis.footer.picked(dig);
assert.deepEqual(
  [said.words, said.category],
  [
    `Dig: a cut, set by hand. C changes it. 18 m², 3 m by 6 m. Its floor is 815 m above sea level.${TO_SLOPE}`,
    'Category: Ground cut, picked from the list.',
  ],
);

process.stdout.write(
  'tools/sketch: a category is picked onto every box of a block and takes `is` off it, the pad says it in a sentence of its own, and of a cut where its floor lies\n',
);
