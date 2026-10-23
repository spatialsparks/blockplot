// The check of a hidden section on the paper (story ST-032, task T-032.3), by hand, on the
// made-up house with its upper home in a section that the model's steps make and hide: the two
// boxes of the night rooms, the bath and the roof terrace, and the twelve objects that stand in
// them. Hidden, it lies on no layer of any plane, and every other thing lies where it lay, in
// its order, as in the house with those sixteen things taken out; `sketch.lies` answers what it
// answered; no click of Select, no click and no box of the eraser and no box of Merge reaches
// it, and what is set down in a slice stands on none of its floors; a block of it that is
// selected is so no more (page.js, by its text); a level's line and "Delete" say how much of it
// there is (layers.js, on a made-up page); a hidden block of ground shapes the ground as it did;
// the levels' buttons take it with all else on its level; and shown again, all is as it was.
// Where no sections script is loaded everything shows: the pad's page names the script, and the
// 3D page the model alone, which it asks no `shows` of. The pad's own scripts on a made-up store
// and the made-up plot, a view at a time, as earth-cut-shown.check.js loads them: no browser, and
// nothing of the real site. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/sections/hidden.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import process from 'node:process';

// A browser's two stores, and a made-up page for layers.js: an element is made where it is
// asked for, and keeps its children, its words and what it hears.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
function element() {
  const made = { dataset: {}, children: [], setAttribute() {}, querySelector: () => null };
  made.append = (...more) => made.children.push(...more);
  made.replaceChildren = (...all) => (made.children = all);
  made.addEventListener = (type, heard) => (made.heard = heard);
  return made;
}
const page = {};
globalThis.document = { getElementById: (id) => (page[id] ??= element()), createElement: element };
/** The question that "Delete" asks: kept, and answered no - nothing is deleted. */
const asked = [];
globalThis.confirm = (question) => {
  asked.push(question);
  return false;
};

// The model and the made-up plot, loaded once: the model reads nothing as it loads, and asks
// `globalThis.sketch` when it is asked.
for (const file of ['sections/model', 'demo-site', 'categories']) await import(`../${file}.js`);
const { sections } = globalThis;
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const KEY = 'blockplot/sketch/space';
const SCRIPTS = ['paper', 'figures', 'shapes', 'blocks', 'earth', 'land', 'legacy', 'sketch'];
const MORE = ['strokes', 'levels', 'labels', 'layers'];
let [loads, sketch, paper] = [0, null, null];
/**
 * The pad's scripts, loaded anew for a view, on a store that holds this text, in the order that
 * the page loads them - and AS THE PAGE DOES (page.js, `refresh`), the ground settled after every
 * change, with the sketch's things.
 */
async function pad(hash, text) {
  for (const one of [local, session]) one.held.clear();
  local.held.set(KEY, text);
  globalThis.location = { hash };
  loads += 1;
  for (const file of [...SCRIPTS, ...MORE]) await import(`../${file}.js?${loads}`);
  ({ sketch, paper } = globalThis);
  sketch.onChange = () => paper.settle(sketch.doc.things);
  sketch.onChange();
}
const things = () => sketch.doc.things;
const text = () => JSON.stringify(sketch.doc);

// THE MADE-UP HOUSE, tests/__fixtures__/sketch/made-up.json: from above three levels and the
// ground - 817 m, row 18; 814 m, row 24; 812 m, row 28, where the lawn's box has its floor - and
// the slices it opens with, along row 30 and across column 36. ITS UPPER HOME, by hand: at 817 m
// the two boxes of the night rooms, the bath and the roof terrace, and the twelve objects that
// stand on that level - nine in the night rooms and three in the bath. And the same house with
// those sixteen things taken out of the text.
const FIXTURE = `${import.meta.dirname}/../../../tests/__fixtures__/sketch/made-up.json`;
const HOUSE = readFileSync(FIXTURE, 'utf8');
const upper = (thing) =>
  ['Night rooms', 'Bath', 'Roof terrace'].includes(thing.name) || thing.floor === 18;
const lower = (thing) => !upper(thing);
const WITHOUT = JSON.stringify({
  ...JSON.parse(HOUSE),
  things: JSON.parse(HOUSE).things.filter(lower),
});
// Every layer that is read: from above the three levels and the ground; the slices of the file,
// and one more through the bath - along row 34, and across column 42.
const LAYERS = [
  ...[18, 24, 28, 'ground'].map((key) => ['top', key]),
  ...[30, 34].map((key) => ['side', key]),
  ...[36, 42].map((key) => ['end', key]),
];
const read = () => LAYERS.map(([plane, key]) => sketch.layer(plane, key));
const lying = () =>
  LAYERS.map(([plane, key]) => things().map((thing) => sketch.lies(thing, plane, key)));
const counted = (laid) => laid.map((layer) => layer.things.length);
/** The layers, each thing of them as the thing and its rect: its place is its place in its own sketch. */
const seen = (laid) =>
  laid.map((layer) => {
    assert.ok(layer.things.every(({ index, thing }) => things()[index] === thing));
    return { ...layer, things: layer.things.map(({ thing, rect }) => ({ thing, rect })) };
  });

// THE SECTION, by the model's steps, from above: made, and the four boxes put into it - and so,
// by the model's one reading, the sixteen things of the upper home are in it, and nothing else.
await pad('#top', HOUSE);
assert.deepEqual([sketch.keys(), sketch.on()], [[18, 24, 28, 'ground'], 18]);
const UPPER = things().filter(upper);
assert.deepEqual([UPPER.filter(sketch.isBox).length, UPPER.length], [4, 16]);
assert.deepEqual(sections.make('Upper home'), { id: 1 });
sections.put(UPPER.filter(sketch.isBox), 1);
assert.deepEqual(
  things().filter((thing) => sections.of(thing)?.id === 1),
  UPPER,
);
const [SHOWN, LAID, LIES, GRID] = [text(), read(), lying(), paper.shaped()];
assert.deepEqual(counted(LAID), [16, 18, 1, 2, 11, 10, 8, 6]);

// HIDDEN, by the step: every thing shows but those sixteen, and no layer holds one of them -
// from above the level at 817 m nothing, and the slices three to six things fewer. Every layer
// holds what it holds of the house with the sixteen taken out of the sketch, thing for thing,
// each with its rect and in its order. `sketch.lies` is the geometry, and answers what it did.
sections.hide(1, true);
const HIDDEN = text();
assert.equal(HIDDEN, SHOWN.replace('"Upper home"}', '"Upper home","hidden":true}'));
assert.deepEqual(things().map(sketch.shows), things().map(lower));
const HIDDEN_LAID = seen(read());
assert.deepEqual(counted(HIDDEN_LAID), [0, 18, 1, 2, 8, 4, 5, 3]);
assert.deepEqual(lying(), LIES);
// The ground is the grid it was: a hidden block of the house holds the ground back as it did.
// The upper home stands over the day rooms, so the house without it has that grid too.
assert.deepEqual(paper.shaped(), GRID);
const hidden = sketch.doc;
sketch.doc = sketch.adopt(JSON.parse(WITHOUT));
sketch.onChange();
assert.deepEqual([paper.shaped(), seen(read())], [GRID, HIDDEN_LAID]);
sketch.doc = hidden;
sketch.onChange();

// WHERE NO SECTIONS SCRIPT IS LOADED - the 3D page loads none - everything shows, whatever the
// sketch says: every layer is what it is with the section shown.
const model = globalThis.sections;
delete globalThis.sections;
assert.deepEqual([things().every(sketch.shows), read()], [true, LAID]);
globalThis.sections = model;

// FROM ABOVE, with the level at 817 m drawn on: Select has nothing where the night rooms lie,
// column 32 and row 31 - reaching half a cell, where no edge is. Left of the paper, the level's
// line says what is hidden of it, after what shows; and "Delete" asks with how many of the
// things that it would take are hidden.
const REACH = 0.5;
assert.equal(sketch.grab([32, 31], REACH), null);
const rows = () => page.layers.children.map((row) => row.children.at(-1).textContent);
const deleting = (what) =>
  `Delete Level 817 m, with all that stands on it (${what})? Undo brings it back while this tab stays open.`;
globalThis.layers.refresh();
assert.deepEqual(rows(), ['16 hidden', '5 blocks, 13 objects', '1 block', '2 objects']);
page.remove.heard();
assert.deepEqual([asked.at(-1), text()], [deleting('16, 16 of them hidden'), HIDDEN]);

// SHOWN AGAIN: the sketch is the text of before the hiding, every layer what it was, Select has
// the night rooms there, and the level's line and "Delete" say what they said.
sections.hide(1, false);
assert.deepEqual([text(), read()], [SHOWN, LAID]);
assert.equal(sketch.layer('top', 18).things[sketch.grab([32, 31], REACH).at].thing, UPPER[1]);
globalThis.layers.refresh();
assert.deepEqual(rows(), ['4 blocks, 12 objects', '5 blocks, 13 objects', '1 block', '2 objects']);
page.remove.heard();
assert.deepEqual([asked.at(-1), text()], [deleting('16'), SHOWN]);

// THE LAWN, the block of ground, in a hidden section of its own: no layer holds it, and it shapes
// the ground all the same - the grid it was, number for number. Without it the grid is another.
const lawn = things().find((thing) => thing.name === 'Lawn');
assert.equal(LAID[2].things[0].thing, lawn);
assert.deepEqual(sections.make('Lawn'), { id: 2 });
sections.put([lawn], 2);
sections.hide(2, true);
assert.ok(read().every((layer) => layer.things.every((entry) => entry.thing !== lawn)));
assert.deepEqual(paper.shaped(), GRID);
paper.settle(things().filter((thing) => thing !== lawn));
assert.notDeepEqual(paper.shaped(), GRID);
sketch.onChange();
assert.deepEqual(paper.shaped(), GRID);

// THE LEVELS' BUTTONS take all that stands on a level, hidden or not - levels.js knows no
// section. The level at 817 m, its section hidden again, is lifted a row and lowered a row with
// its sixteen things, and deleted with them: each one step, which Undo takes back. Lifted, all
// sixteen are hidden still. Lowered, its row 19 runs through the day rooms and the cut, and the
// window on the night rooms' uphill edge, row 22, stands in the cut's box too - the last thing of
// the sketch, in no section: it belongs to the cut then, and shows (`sections.of`).
sections.hide(1, true);
const before = text();
for (const [by, showing] of [
  [-1, []],
  [1, ['window 44.5 22']],
]) {
  sketch.shiftLevel(18, by);
  const moved = sketch.stood(sketch.doc, 18 + by).things;
  const said = moved.filter(sketch.shows).map(({ kind, x, y }) => `${kind} ${x} ${y}`);
  assert.deepEqual([moved.length, said], [16, showing]);
  sketch.step(sketch.past, sketch.future);
}
sketch.removeLevel(18);
assert.deepEqual([things().length, things().filter(upper)], [21, []]);
sketch.step(sketch.past, sketch.future);
assert.equal(text(), before);

// IN THE SIDE VIEW, on the slice of row 30: the day rooms, the porch, the store and the lawn, and
// of the upper home three boxes - the second of the night rooms, the bath and the roof terrace.
// Select has nothing at the night rooms' place, column 35 and row 15, and the Label tool no
// block; a click of the eraser there changes nothing, and is no step. The slice's line says so.
await pad('#side', HIDDEN);
assert.deepEqual([paper.PLANE, sketch.on(), text()], ['side', 30, HIDDEN]);
assert.deepEqual([sketch.grab([35, 15], REACH), sketch.boxAt([35, 15])], [null, undefined]);
sketch.apply({ tool: 'erase', from: [35, 15], to: [35, 15] });
assert.deepEqual([text(), sketch.past.length], [HIDDEN, 0]);
globalThis.layers.refresh();
assert.equal(
  page['cut-at'].textContent,
  'Slice 13 m across the plot: 4 blocks, 4 objects, 3 hidden.',
);
// What is set down at column 35, near row 12.5, stands on the day rooms' top, row 18 - and on the
// night rooms' top, row 12, once the section shows: tried by hand before the card. Shown, the
// Label tool has the night rooms there, and the slice's line counts their blocks.
assert.equal(sketch.standOn(35, 12.5), 18);
sections.hide(1, false);
assert.deepEqual([sketch.standOn(35, 12.5), sketch.boxAt([35, 15])?.name], [12, 'Night rooms']);
globalThis.layers.refresh();
assert.equal(page['cut-at'].textContent, 'Slice 13 m across the plot: 7 blocks, 4 objects.');

// A BOX OVER THE WHOLE PAPER, of the eraser and of Merge, on the house with its upper home hidden
// and on the house without it. The four boxes and the twelve objects are as they were, to the
// byte, and every other thing is what the stroke makes of it in the house without them - but
// that the block Merge makes has the next `group`, 2, where the night rooms keep their 1. The
// eraser takes the day rooms, the porch, the store, the lawn and four objects: 29 things are
// left. Merge makes one block of those four boxes. Each is one step.
const WHOLE = { from: [0, 0], to: [paper.WIDE - 1, paper.ROWS - 1] };
const UPPER_TEXT = JSON.stringify(JSON.parse(HIDDEN).things.filter(upper));
for (const [tool, left, groups] of [
  ['erase', 29, 0],
  ['merge', 37, 4],
]) {
  const after = [];
  for (const house of [HIDDEN, WITHOUT]) {
    await pad('#side', house);
    sketch.apply({ tool, ...WHOLE });
    assert.equal(sketch.past.length, 1);
    after.push(things());
  }
  const [inHidden, without] = after;
  const made = JSON.stringify(without);
  assert.deepEqual([inHidden.length, made.split('"group":1').length - 1], [left, groups]);
  assert.equal(JSON.stringify(inHidden.filter(upper)), UPPER_TEXT);
  assert.equal(JSON.stringify(inHidden.filter(lower)), made.replaceAll('"group":1', '"group":2'));
}

// THE PAGES, by their text. The pad's page names two scripts of sections/: the model once, in
// the line after sketch.js, and the list beside the paper (T-032.4) once, in the line after
// gallery.js; and the 3D page the model alone, once, in the line after views.js (story ST-033),
// and the list never. `refresh` of page.js hands the paper every thing of the
// sketch first, as ever - the ground is not hidden - and keeps what is selected while it is
// there and shows: a block that is hidden while it is selected is selected no more.
const lines = (name) => readFileSync(`${import.meta.dirname}/../${name}`, 'utf8').split('\n');
const INDEX = lines('index.html');
const script = (name) => `<script src="${name}"></script>`;
const after = (name) => INDEX[INDEX.findIndex((line) => line.trim() === script(name)) + 1].trim();
assert.equal(after('sketch.js'), script('sections/model.js'));
assert.equal(after('gallery.js'), script('sections/list.js'));
assert.equal(INDEX.filter((line) => line.includes('sections/')).length, 2);
const SOLID = lines('3d.html');
const views = SOLID.findIndex((line) => line.trim() === script('views.js'));
assert.equal(SOLID[views + 1].trim(), script('sections/model.js'));
assert.equal(SOLID.filter((line) => line.includes('sections/')).length, 1);
const PAGE = lines('page.js');
const from = PAGE.indexOf('  function refresh() {');
const refresh = PAGE.slice(from, PAGE.indexOf('  }', from));
assert.equal(refresh[1].trim().split(';')[0], 'paper.settle(sketch.doc.things)');
const KEEPS = 'if (!sketch.doc.things.includes(picked) || !sketch.shows(picked)) picked = null;';
assert.equal(refresh.filter((line) => line.trim() === KEEPS).length, 1);

process.stdout.write(
  'tools/sketch/sections: what a hidden section holds lies on no layer and no stroke reaches it, the ground and every other thing are as they were, and shown again all is\n',
);
