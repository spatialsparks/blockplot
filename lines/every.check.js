// The check of the lines on every level (ST-039, T-039.4): layers.js and lines/list.js on a
// made-up page that keeps what it is handed, as earth-cut-shown.check.js has layers.js, with the
// pad's own scripts on a made-up store and the made-up plot. A sketch of two levels, 18 and 26,
// with a line on every level, a second one that its own switch hides, and a third on level 18:
// what the paper draws, `layers.lit()` - the first with the layer drawn on, on level 18, on a
// level whose eye says hidden and on the ground, the second on none, the third on level 18
// alone, and none of them while a section is picked; level 18's count, one note; and the list
// left of the paper - two buttons in the sketch's order, the second hidden, the one selected
// marked, a click handing the made-up Line tool its note, and hidden with no line on every
// level. No browser, and no site but the made-up one. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/lines/every.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });

// A MADE-UP PAGE that keeps what it is handed: an element is made where it is first asked for,
// and has what it was given, the parts put into it, what was put after it, what it says of
// itself and its listeners.
function part(tagName) {
  const made = { tagName: tagName.toUpperCase(), parts: [], hears: {}, said: {}, dataset: {} };
  made.append = (...more) => void made.parts.push(...more);
  made.replaceChildren = (...more) => void (made.parts = more);
  made.after = (...more) => void (made.followed = more);
  made.addEventListener = (type, hear) => void (made.hears[type] = hear);
  made.setAttribute = (what, value) => void (made.said[what] = value);
  return made;
}
const made = {};
const document = { getElementById: (id) => (made[id] ??= part('div')), createElement: part };
// A section picked, or none (sections/list.js), and what a section holds: nothing here.
let section = null;
const sectionList = { picked: () => section };
const sections = { of: () => null, hides: () => false };
// THE MADE-UP LINE TOOL: what the list hands it.
const lineTool = { pick: (note) => void (lineTool.handed = note) };
Object.assign(globalThis, {
  document,
  sectionList,
  sections,
  lineTool,
  location: { hash: '#top' },
});

const SCRIPTS =
  'demo-site paper figures shapes categories blocks legacy sketch own-colours lines/model';
for (const one of [...SCRIPTS.split(' '), 'layers', 'lines/list']) await import(`../${one}.js`);
const { SITE, paper, sketch, layers, everyList } = globalThis;
assert.deepEqual([SITE.name, paper.PLANE], ['Made-up hillside plot', 'top']);
let told = 0;
sketch.onChange = () => (told += 1);

// THE SKETCH: levels 18 and 26, each hidden while another is drawn on; a red line on every
// level, a second in "Boundary" that its own switch hides, and a third on level 18.
const FIRST = { view: 'top', at: 'every', line: [4, 50, 30, 50, 1] };
const SECOND = { view: 'top', at: 'every', hidden: true, line: [4, 40, 30, 40, 9, 9, '#c0392b'] };
const THIRD = { view: 'top', at: 18, line: [4, 30, 30, 30, 6] };
sketch.doc = sketch.adopt({
  ...sketch.blank(),
  floors: [18, 26],
  notes: [FIRST, SECOND, THIRD],
  colours: [{ name: 'Boundary', value: '#c0392b' }],
  show: { top: { 18: 'hidden', 26: 'hidden' } },
});
const [, second, third] = sketch.doc.notes;
assert.deepEqual(sketch.keys(), [18, 26, 'ground']);

/** What the paper draws, drawn on a layer: of each layer its key and its notes, by their places among the sketch's. */
function drawnOn(key) {
  sketch.doc.on.top = key;
  layers.refresh();
  return layers
    .lit()
    .map((one) => [one.key, one.notes.map((note) => sketch.doc.notes.indexOf(note))]);
}
// ON LEVEL 18, on level 26 - whose eye says hidden - and on the ground: the first with the layer
// drawn on, after its own notes; the second on none; the third on level 18 alone.
assert.deepEqual(drawnOn(18), [
  ['ground', []],
  [18, [2, 0]],
]);
assert.deepEqual(drawnOn(26), [
  ['ground', []],
  [26, [0]],
]);
assert.deepEqual(drawnOn('ground'), [['ground', [0]]]);
// Level 18 shown while the ground is drawn on: the third there, the first on the ground alone.
sketch.doc.show.top[18] = 'shown';
assert.deepEqual(drawnOn('ground'), [
  [18, [2]],
  ['ground', [0]],
]);
// The second shown by its switch: with the first, in the sketch's order.
delete second.hidden;
assert.deepEqual(drawnOn(26), [
  ['ground', []],
  [18, [2]],
  [26, [0, 1]],
]);
second.hidden = true;
// WHILE A SECTION IS PICKED, none of them: the layer drawn on twice, and no note on every level.
section = 3;
assert.deepEqual(drawnOn(18), [
  ['ground', []],
  [18, [2]],
  [18, []],
]);
section = null;

// THE COUNT of level 18 is its own note, and no line on every level; the ground's is nothing.
drawnOn(18);
const counted = made.layers.parts.map((item) => [
  item.parts[0].textContent,
  item.parts.at(-1).textContent,
]);
assert.deepEqual(counted, [
  [sketch.nameOf('top', 18), '1 note'],
  [sketch.nameOf('top', 26), 'nothing yet'],
  ['Ground', 'nothing yet'],
]);

// THE LIST, after the levels' list and outside it: the words, then a button for each line on
// every level in the sketch's order, by its place among the notes, the hidden one saying so.
const [list] = made.layers.followed;
assert.deepEqual([list.tagName, list.id, list.hidden], ['SECTION', 'every-lines', true]);
everyList.show(null);
const [title, ...buttons] = list.parts;
assert.deepEqual([list.hidden, title.textContent], [false, 'On every level']);
const read = (one) => [one.dataset.line, one.textContent, one.said['aria-current'] ?? 'no'];
assert.deepEqual(buttons.map(read), [
  ['0', 'Line of 2 corners, in red', 'no'],
  ['1', 'Line of 3 corners, in Boundary, hidden', 'no'],
]);
// The line selected is marked; a click on the hidden one hands the Line tool that note, and the
// page is told once.
everyList.show(second);
assert.deepEqual(
  list.parts
    .slice(1)
    .map(read)
    .map((one) => one[2]),
  ['no', 'true'],
);
list.parts[2].hears.click();
assert.deepEqual([lineTool.handed === second, told], [true, 1]);
// NO LINE ON EVERY LEVEL: the list is hidden.
sketch.doc.notes = [third];
everyList.show(null);
assert.deepEqual([list.hidden, list.parts.length], [true, 1]);

process.stdout.write(
  'tools/sketch/lines: a line on every level is drawn with the layer drawn on, on every level and the ground, on no count, none hidden by its switch and none while a section is picked; the list left of the paper selects each\n',
);
