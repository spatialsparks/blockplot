// The check of the height typed beside the paper (story ST-035, object-high.js): the pad's own
// scripts and that one on a made-up store, the made-up plot and a made-up page that keeps what is
// made. The parts, and where they were put; the row hidden for nothing, a block, a chair and a
// bed, and shown for a counter and a staircase with the height and the range of each; a height
// typed, in one step that Undo takes back to the byte; held to the range, rounded to 5 cm, and
// removed at the kind's own; no number, nought and the height it has make no step; a staircase's
// length follows its height. And of page.js and index.html, which want a whole page, the text:
// the page hands the row what is selected, and names the script once, before page.js. No browser,
// and no site but the made-up one. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/object-high.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });

// A MADE-UP PAGE that keeps what is made. A part has what it was given, the parts put into it,
// what was put before it, and the listeners it was told, one of a kind; `blurred` counts the
// times it gave the focus back.
function part(tagName) {
  const made = { tagName: tagName.toUpperCase(), parts: [], hears: {}, blurred: 0 };
  made.append = (...more) => void made.parts.push(...more);
  made.before = (...more) => void (made.led = more);
  made.addEventListener = (type, hear) => void (made.hears[type] = hear);
  made.blur = () => void (made.blurred += 1);
  return made;
}
// What the script asks the page for: the line that says that nothing is selected, which the row
// is put before.
const page = { 'none-picked': part('p') };
const document = { getElementById: (id) => page[id], createElement: part };
Object.assign(globalThis, { document, location: { hash: '#top' } });

// The pad's scripts on the made-up plot, in the order of index.html, as far as the row needs
// them, and the row's script last.
for (const one of 'demo-site paper figures shapes blocks legacy sketch object-high'.split(' '))
  await import(`./${one}.js`);
const { SITE, paper, shapes, sketch, objectHigh, structuredClone } = globalThis;
assert.equal(SITE.name, 'Made-up hillside plot');
assert.deepEqual([paper.PLANE, Object.keys(objectHigh)], ['top', ['show']]);

// THE PARTS, as the script made them: one row before the line that says that nothing is
// selected, hidden until an object that takes a height is shown. It is a label of a row of
// controls, and holds a field for figures, in steps of 5 cm, and the words "m high".
const [row, ...more] = page['none-picked'].led;
const [field, words] = row.parts;
assert.deepEqual([more.length, row.parts.length, row.hidden], [0, 2, true]);
assert.deepEqual([row.tagName, row.id, row.className], ['LABEL', 'object-high-row', 'group']);
assert.deepEqual([field.tagName, field.type, field.id], ['INPUT', 'number', 'object-high']);
assert.deepEqual([field.step, words], ['0.05', ' m high']);
assert.match(row.title, /^How high the selected object is: .+$/);

// A SKETCH of its own, on the ground: a block of one box; a chair and a bed, whose kinds take no
// height; a kitchen counter, 0.9 m high, which takes 0.85 to 1.1 m; and a staircase, 3 m high and
// 4.5 m long, which takes 2 to 4.5 m.
const BOX = { x: [0, 8], y: [16, 24], z: [16, 22], colour: 1 };
const at = (x) => ({ x, y: 20.5, floor: 'ground' });
const OBJECTS = ['chair', 'bed', 'counter', 'stairs'].map((kind, n) => ({
  kind,
  ...at(20 * n + 20),
}));
const [BLOCK, CHAIR, BED, COUNTER, STAIRS] = [0, 1, 2, 3, 4];
const things = () => sketch.doc.things;
const text = () => JSON.stringify(sketch.doc);
sketch.doc = sketch.adopt({ ...sketch.blank(), things: structuredClone([BOX, ...OBJECTS]) });
assert.deepEqual(
  things().map((one) => one.kind),
  [undefined, 'chair', 'bed', 'counter', 'stairs'],
);
// AS THE PAGE DOES (page.js, `refresh`): a thing is selected, and after every change of the
// sketch the row is handed what is selected. `heard` counts the times the page was told.
let selected = null;
let heard = 0;
sketch.onChange = () => {
  heard += 1;
  objectHigh.show(things().includes(selected) ? selected : null);
};
const select = (index) => objectHigh.show((selected = things()[index] ?? null));
/** What the row shows: `hidden` - or the height in its field, and its least and its most. */
const shows = () => (row.hidden ? 'hidden' : [field.value, field.min, field.max]);
/** A height typed, as a browser tells of one: the field's value, then its change. How many steps there are to undo, and how often the page was told. */
function type(value) {
  field.value = value;
  field.hears.change();
  return [sketch.past.length, heard];
}

// NOTHING, A BLOCK, A CHAIR, A BED: the row is hidden.
for (const index of [-1, BLOCK, CHAIR, BED]) {
  select(index);
  assert.equal(shows(), 'hidden', `of ${index}`);
}
// A COUNTER shows its 0.9 m, of 0.85 to 1.1 m; A STAIRCASE its 3 m, of 2 to 4.5 m. Showing
// writes nothing.
const plain = text();
select(COUNTER);
assert.deepEqual(shows(), ['0.9', '0.85', '1.1']);
select(STAIRS);
assert.deepEqual(shows(), ['3', '2', '4.5']);
assert.deepEqual([text(), sketch.past.length, heard], [plain, 0, 0]);

// 0.95 TYPED on the counter: it says `high` 0.95, and nothing else of the sketch is another. One
// step, the page told once, and the field gave the focus back. Undo has the bytes of before.
select(COUNTER);
const blurred = field.blurred;
assert.deepEqual(type('0.95'), [1, 1]);
assert.equal(
  text(),
  plain.replace('"kind":"counter","x":60,"y":20.5,"floor":"ground"', '$&,"high":0.95'),
);
assert.deepEqual(
  [things()[COUNTER].high, shows(), field.blurred],
  [0.95, ['0.95', '0.85', '1.1'], blurred + 1],
);
sketch.step(sketch.past, sketch.future);
assert.deepEqual([text(), sketch.past.length], [plain, 0]);
// THE SAME VALUE AGAIN makes no step: typed back to 0.95, then 0.95 once more.
select(COUNTER);
heard = 0;
assert.deepEqual(type('0.95'), [1, 1]);
assert.deepEqual(type('0.95'), [1, 1]);
// HELD TO THE RANGE: 1.3 is 1.1, and 0.2 is 0.85. ROUNDED TO 5 CM: 0.93 is 0.95, 1.04 is 1.05.
for (const [typed, high] of [
  ['1.3', 1.1],
  ['0.2', 0.85],
  ['0.93', 0.95],
  ['1.04', 1.05],
]) {
  type(typed);
  assert.deepEqual([things()[COUNTER].high, field.value], [high, String(high)], typed);
}
// THE KIND'S OWN, 0.9, removes `high`: the sketch is what it was before any height.
type('0.9');
assert.deepEqual([Object.hasOwn(things()[COUNTER], 'high'), text()], [false, plain]);
// NO HEIGHT changes nothing - no number, nought, below it, nothing typed - and the field shows
// the height again.
const steps = sketch.past.length;
for (const typed of ['abc', '0', '-1', '']) {
  assert.deepEqual(type(typed), [steps, heard], typed);
  assert.deepEqual([text(), shows()], [plain, ['0.9', '0.85', '1.1']], typed);
}

// A STAIRCASE AT 2.5 m: `high` 2.5, and its flight 4 m long, as every plane asks `sizeOf` - 14
// steps of at most 0.19 m, 0.28 m deep, 3.92 m, rounded up to a half metre. At 4.5 m it is 7 m.
select(STAIRS);
assert.deepEqual(shapes.sizeOf(things()[STAIRS]), [4.5, 1, 3]);
type('2.5');
assert.deepEqual([things()[STAIRS].high, shapes.sizeOf(things()[STAIRS])], [2.5, [4, 1, 2.5]]);
type('9');
assert.deepEqual([things()[STAIRS].high, shapes.sizeOf(things()[STAIRS])], [4.5, [7, 1, 4.5]]);
// Nothing selected, a height typed is none.
select(-1);
const before = [text(), sketch.past.length];
type('1');
assert.deepEqual([text(), sketch.past.length, shows()], [...before, 'hidden']);

// OF page.js, which wants a whole page to load, the text alone. `refresh` hands the row what is
// selected in the line after it hands the gallery the kind - after it settled what is selected -
// and nothing else of the page names the row.
const read = (file) => readFileSync(`${import.meta.dirname}/${file}`, 'utf8');
const code = read('page.js')
  .split('\n')
  .map((line) => line.trim());
const refresh = code.slice(code.indexOf('function refresh() {'));
const shown = refresh.findIndex((line) => line.startsWith('globalThis.gallery.show('));
assert.ok(shown > 0 && shown < refresh.indexOf('render();'), 'refresh hands the gallery its kind');
assert.match(refresh[shown + 1], /^globalThis\.objectHigh\.show\(picked\);/);
assert.equal(code.filter((line) => line.includes('objectHigh')).length, 1, 'named once');
// OF index.html: the script is named once, after all that it asks as it loads - the shapes, the
// sketch - and after the swatch's, whose row it stands under; and before page.js.
const NAMES_A_SCRIPT = /^<script src="([^"]+)"><\/script>$/;
const scripts = read('index.html')
  .split('\n')
  .flatMap((line) => NAMES_A_SCRIPT.exec(line.trim())?.[1] ?? []);
const place = scripts.indexOf('object-high.js');
assert.equal(scripts.filter((one) => one === 'object-high.js').length, 1);
for (const ahead of ['shapes.js', 'sketch.js', 'swatch.js'])
  assert.ok(scripts.indexOf(ahead) >= 0 && scripts.indexOf(ahead) < place, ahead);
assert.ok(place < scripts.indexOf('page.js'), 'the page hands the row what is selected');

process.stdout.write(
  'tools/sketch: the height of a selected object whose kind takes one is typed beside the paper, held to its range and to 5 cm, in one step; a staircase follows it in length\n',
);
