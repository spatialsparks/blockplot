// The check of how the 3D view writes a figure of the house into the sketch: the pad's own
// scripts, loaded here on the made-up plot, with tests/__fixtures__/sketch/made-up.json in a
// made-up store that keeps what it is given and notes every writing. A figure that is typed and
// taken is in the sketch the browser keeps, which differs from the one before in `figures`
// alone, and is one step more for the pad's Undo; what is refused, and a figure the sketch has
// already, write nothing; a figure set and then set back to its default leaves the sketch byte
// for byte as it was; a sketch that another window kept meanwhile is not lost, though this page
// was never told of it; where the browser keeps what cannot be read, nothing is written and
// nothing is set aside; a figure that the store does not take is not held here either; a sketch
// of a version before is one of this version once a figure is set, and not before; and where
// nothing is kept yet, the figure is kept in a sketch with nothing drawn.
// No browser, and nothing of the real site: site.js is never read. Who may write the sketch at
// all is rules.check.js's. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { asNow, BEFORE, golden, VERSION } from '../check-golden.js';

const SKETCH = golden('made-up');
const KEY = 'blockplot/sketch/space';
// A browser's two stores: what each keeps, every key that was written, in its order - and, of the
// sketch's store, whether it takes no more.
const kept = new Map();
const written = [];
let full = false;
const store = (holds, note) => ({
  getItem: (key) => holds.get(key) ?? null,
  setItem(key, text) {
    if (full) throw new Error('a made-up store that takes no more');
    note.push(key);
    holds.set(key, String(text));
  },
});
const stores = { localStorage: store(kept, written), sessionStorage: store(new Map(), []) };
for (const [name, value] of Object.entries(stores)) {
  Object.defineProperty(globalThis, name, { value, configurable: true });
}
globalThis.location = { hash: '' };
// The pad's switch of views wants a page, and is made up: its rule for a key is told apart here
// by a mark on what the key was typed into.
globalThis.views = { seen: {}, keep() {}, typing: ({ target }) => target.field === true };
for (const file of ['demo-site', 'paper', 'figures', 'shapes', 'categories', 'blocks', 'legacy']) {
  await import(`../${file}.js`);
}
/** The pad's sketch and the view's reader, loaded anew - the sketch is read as its script loads - with a count of how often the page was told to read again. */
let loads = 0;
async function opened() {
  loads += 1;
  await import(`../sketch.js?${loads}`);
  const reader = await import(`./read.js?${loads}`);
  const told = { times: 0 };
  // A page that hears nothing from the browser: no window tells it of another's change.
  reader.watch(() => (told.times += 1), { addEventListener() {} });
  return { ...reader, told, pad: globalThis.sketch };
}
/** What was done, in numbers: the writings into the store, the steps to undo, the tellings. */
const done = ({ pad, told }) => [written.length, pad.past.length, told.times];
/** The sketch with these figures, as the pad writes it: `figures` last, and nothing else changed. */
const figured = (sketch, figures) => `${sketch.slice(0, -1)},"figures":${JSON.stringify(figures)}}`;

kept.set(KEY, SKETCH);
const page = await opened();
const { FIGURES, read, typed, typing, usual, pad, told } = page;
// What Settings list is the pad's own list of the figures, and a key is a field's by the pad's
// rule: both are handed on as they are.
assert.equal(FIGURES, globalThis.figures.FIGURES);
assert.deepEqual([typing({ target: { field: true } }), typing({ target: {} })], [true, false]);
// As the page opens, a figure can be written: nothing is said against it. Nothing was written.
const DEFAULTS = globalThis.figures.of({});
assert.deepEqual([read().locked, read().figures, done(page)], ['', DEFAULTS, [0, 0, 0]]);

// The outer walls from 0.4 m to 0.3 m. Nothing is said against it; the sketch that the browser
// keeps is the one before with `figures` after it, and differs in nothing else; it was written
// once, under the pad's key; the step to undo is the sketch before, byte for byte; and the page
// was told once to read again - what it reads then has the figure.
assert.equal(typed('outerWallM', '0.3'), '');
assert.equal(kept.get(KEY), figured(SKETCH, { outerWallM: 0.3 }));
const { figures: set, ...rest } = JSON.parse(kept.get(KEY));
assert.deepEqual([set, rest], [{ outerWallM: 0.3 }, JSON.parse(SKETCH)]);
assert.deepEqual([written, pad.past, told.times], [[KEY], [SKETCH], 1]);
assert.deepEqual(read(true).figures, { ...DEFAULTS, outerWallM: 0.3 });
// The pad's Undo takes the figure back, and its Redo brings it again.
pad.step(pad.past, pad.future);
assert.equal(kept.get(KEY), SKETCH);
pad.step(pad.future, pad.past);
assert.equal(kept.get(KEY), figured(SKETCH, { outerWallM: 0.3 }));

// What is refused writes nothing, is no step, and has the page read nothing again: no number, a
// figure above its range, one below it, and nothing at all. Each is refused in the pad's words,
// which name the range. And so does a figure that the sketch has already: nothing is said
// against it, and nothing is done.
let before = [kept.get(KEY), done(page)];
const REFUSED = [
  [
    'railingHighM',
    '5',
    /^How high a railing is: a number from 0\.5 to 1\.5 m\. 5 m is too much\.$/,
  ],
  ['railingHighM', 'high', /a number from 0\.5 to 1\.5 m\. "high" is none\.$/],
  ['outerWallM', '0.05', /a number from 0\.1 to 0\.8 m\. 0\.05 m is too little\.$/],
  ['sillHighM', '', /a number from 0 to 1\.5 m\. "" is none\.$/],
];
for (const [name, text, why] of REFUSED) {
  assert.match(typed(name, text), why);
  assert.deepEqual([kept.get(KEY), done(page)], before, `${name}: ${text}`);
}
for (const same of ['0.3', '0,30', ' .3 ']) assert.equal(typed('outerWallM', same), '');
assert.equal(usual('doorHighM'), '');
assert.deepEqual([kept.get(KEY), done(page)], before);

// A second figure, with a comma, and to the centimetre: `figures` holds both, in the order the
// figures are listed in - the walls before the door, whichever was typed first.
assert.equal(typed('doorHighM', '2,4'), '');
assert.equal(typed('innerWallM', '0.149'), '');
const three = { outerWallM: 0.3, innerWallM: 0.15, doorHighM: 2.4 };
assert.equal(kept.get(KEY), figured(SKETCH, three));
// Default leaves the sketch without the figure - and with all of them at their defaults again,
// the sketch is byte for byte what it was before a figure was touched.
assert.equal(usual('innerWallM'), '');
assert.equal(kept.get(KEY), figured(SKETCH, { outerWallM: 0.3, doorHighM: 2.4 }));
assert.equal(usual('outerWallM'), '');
assert.equal(typed('doorHighM', '2.1'), '');
assert.equal(kept.get(KEY), SKETCH);
// Six figures were written by now: six steps and six tellings - and, with the pad's Undo and its
// Redo, eight writings into the store, each under the pad's key.
assert.deepEqual([done(page), new Set(written)], [[8, 6, 6], new Set([KEY])]);

// Another window drew a block and set a figure meanwhile, and this page was never told: no
// window tells it anything here. The next figure is written into that sketch - the block and
// the other window's figure are in it - and the step to undo takes back the one figure alone.
const drawn = JSON.parse(SKETCH);
const BLOCK = { x: [60, 66], y: [24, 30], z: [18, 24], colour: 3, name: 'Drawn elsewhere' };
const OTHER = figured(JSON.stringify({ ...drawn, things: [...drawn.things, BLOCK] }), {
  roofSlabM: 0.5,
});
kept.set(KEY, OTHER);
assert.equal(typed('floorSlabM', '0.25'), '');
const both = JSON.parse(kept.get(KEY));
assert.deepEqual(both.things.at(-1), BLOCK);
assert.deepEqual(both.figures, { floorSlabM: 0.25, roofSlabM: 0.5 });
assert.deepEqual({ ...both, figures: { roofSlabM: 0.5 } }, JSON.parse(OTHER));
assert.equal(pad.past.at(-1), OTHER);
// So is a figure that this page takes back: the other window's sketch, with its own figure.
kept.set(KEY, OTHER);
assert.equal(usual('roofSlabM'), '');
assert.deepEqual(JSON.parse(kept.get(KEY)), { ...drawn, things: [...drawn.things, BLOCK] });

// Where the browser keeps what the pad cannot read - a kind it does not know, no JSON - no
// figure is written, typed or set back, and it is said why. The text is as it was, under the
// pad's key; nothing is set aside from here - no other key is written; it is no step; and the
// page is told to read again: it reads that it is locked, in the same words.
for (const unread of ['{"space":7,"things":[{"kind":"unicorn"}],"floors":[],"notes":[]}', '?']) {
  kept.set(KEY, unread);
  before = [written.length, pad.past.length];
  const times = told.times;
  assert.match(typed('outerWallM', '0.2'), /^No figure can be changed here: .* cannot be read/);
  assert.equal(usual('floorSlabM'), typed('outerWallM', '0.2'));
  assert.deepEqual([kept.get(KEY), [...kept.keys()]], [unread, [KEY]]);
  assert.deepEqual([written.length, pad.past.length, told.times], [...before, times + 3]);
  assert.equal(read(true).locked, typed('outerWallM', '0.2'));
  // What is no figure is refused in the pad's words there too: it was never asked of the store.
  assert.match(typed('outerWallM', '9'), /is too much\.$/);
}
// A sketch again: it is no longer locked, and the figure is written.
kept.set(KEY, SKETCH);
assert.equal(read(true).locked, '');
assert.equal(typed('outerWallM', '0.2'), '');
assert.equal(kept.get(KEY), figured(SKETCH, { outerWallM: 0.2 }));

// A store that takes no more: the figure is not kept, and that is said. The browser keeps what
// it kept, the page is told to read again, and what it reads - and what the pad's scripts hold
// from then on - is the sketch that is kept, not the figure that was not.
full = true;
before = [kept.get(KEY), written.length, told.times];
assert.match(typed('outerWallM', '0.6'), /^This browser did not keep the figure/);
assert.deepEqual(
  [kept.get(KEY), written.length, told.times],
  [before[0], before[1], before[2] + 1],
);
assert.equal(read(true).figures.outerWallM, 0.2);
assert.deepEqual(pad.doc.figures, { outerWallM: 0.2 });
full = false;

// A sketch of a version before, as a browser may still keep one: the made-up house as a pad of
// each version before wrote it, from version 2 on - the folders of the frozen corpora.
// The house of version 6 has its cut, the one box that says a category, and none before has
// one; and none says a section or a rate: version 7 brought those. A figure that it has already
// writes nothing: it stays the text it was. A figure that is set makes it a sketch of this
// version, as a stroke does: the same text but for its `space`, with `figures` after it.
for (const space of BEFORE) {
  const [file, now] = [golden('made-up', space), asNow('made-up', space)];
  assert.notEqual(now, file, `v${space}/made-up.json is of another version`);
  const picked = file.split('"category"').length - 1;
  const cuts = file.split(',"category":"ground-cut"}').length - 1;
  assert.deepEqual([picked, cuts], space < 6 ? [0, 0] : [1, 1], `v${space}/made-up.json: its cut`);
  assert.doesNotMatch(file, /"(sections?|rates)"/, `v${space}/made-up.json`);
  kept.set(KEY, file);
  assert.equal(typed('doorHighM', '2.1'), '');
  assert.equal(kept.get(KEY), file);
  assert.equal(typed('doorHighM', '2.4'), '');
  assert.equal(kept.get(KEY), figured(now, { doorHighM: 2.4 }));
}

// A browser that keeps no sketch yet: the figure is kept all the same, in a sketch with nothing
// drawn - what the pad holds as it opens there.
kept.clear();
const first = await opened();
assert.deepEqual([first.read().things, first.read().locked], [[], '']);
assert.equal(first.typed('windowHighM', '1.2'), '');
assert.equal(
  kept.get(KEY),
  `{"space":${VERSION},"things":[],"floors":[],"notes":[],"on":{},"show":{"top":{}},"figures":{"windowHighM":1.2}}`,
);
assert.deepEqual([first.pad.past.length, first.told.times], [1, 1]);

process.stdout.write(
  'tools/sketch/view3d: a figure typed is in the sketch the browser keeps, alone and at once, as a step to undo; what is refused or cannot be kept writes nothing, and another window loses nothing\n',
);
