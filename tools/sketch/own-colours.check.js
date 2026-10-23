// The check of the colours of the owner's and of the lines of version 12 of the sketch file
// (story ST-039). The readers of a colour of paper.js - `isOwn`, `named`, `hex` - of the eleven,
// of a value and of what is neither. The list of own-colours.js: what `of` lists and what it
// does not, what `called` says, each refusal of `add` and one that is written, what `using`
// counts, and `remove`, which changes nothing drawn. `sketch.adopt` of a sketch whose list is
// all wrong. A line on every level, which makes no level and lies on none. And the gain of the
// golden file of every part with version 12, made again by the pad's own changes on the frozen
// file before it - byte for byte, and as many steps to undo. The pad's own scripts on a made-up
// store and the made-up plot: no browser, nothing of the real site.
// Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/own-colours.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { asNow, golden, VERSION } from './check-golden.js';

// A browser's two stores, the first holding the file of every part as the pad of the version
// before wrote it: the pad reads it as it loads, from above.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
const KEY = 'blockplot/sketch/space';
// The version before the one that brought lines of many points and colours of the owner's.
const BEFORE_IT = 11;
local.held.set(KEY, golden('every-part', BEFORE_IT));
globalThis.location = { hash: '#top' };
await import('./demo-site.js');
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const SCRIPTS = ['paper', 'figures', 'shapes', 'categories', 'blocks', 'legacy', 'sketch'];
for (const file of [...SCRIPTS, 'strokes', 'own-colours']) await import(`./${file}.js`);
const { paper, sketch, ownColours } = globalThis;

// THE READERS OF A COLOUR. Of the eleven, by their number, their entry; a value `#rrggbb` in
// small letters is the owner's, named by itself; anything else - a number past the eleven, a
// number in words, capitals, a figure short, nothing - is ink, as the pad paints it.
const [INK, GREY, BLUE] = [['ink', '#1f2933'], ['grey', '#8795a1'], '#3a7bd5'];
const READ = [
  [0, false, INK],
  [10, false, GREY],
  [11, false, INK],
  ['1', false, INK],
  [BLUE, true, [BLUE, BLUE]],
  ['#3A7BD5', false, INK],
  ['#3a7bd', false, INK],
  [null, false, INK],
];
for (const [colour, own, named] of READ) {
  const said = [paper.isOwn(colour), paper.named(colour), paper.hex(colour)];
  assert.deepEqual(said, [own, named, named[1]], String(colour));
}

// THE LIST, read leniently. Listed: a name with a character that is no blank, 30 characters at
// the most, and a value of the owner's, neither alike one listed before - a name compared
// without regard to capitals or to blanks at its ends. The rest is not listed, and stays.
const GOOD = { name: 'Hedge', value: '#2e7d32' };
const LIST = [
  GOOD,
  { name: 'x'.repeat(31), value: '#111111' },
  { name: '   ', value: '#222222' },
  { name: ' hEDGE ', value: '#333333' },
  { name: 'Lawn', value: GOOD.value },
  { name: 'No value' },
  { name: 'Capitals', value: '#ABCDEF' },
  'Hedge',
  { name: 'x'.repeat(30), value: '#444444' },
];
assert.deepEqual(ownColours.of({ colours: LIST }), [GOOD, LIST.at(-1)]);
for (const none of [{}, { colours: 'Hedge' }, { colours: { name: 'Hedge' } }]) {
  assert.deepEqual(ownColours.of(none), [], JSON.stringify(none));
}
assert.equal(ownColours.MOST, 30);

// WHAT THE PAD CALLS A COLOUR: the eleven by their names, a listed value by its name, a value
// the list does not name by itself, anything else ink.
const listed = { colours: [GOOD] };
const NAMES = 'ink red orange yellow green teal blue purple pink brown grey'.split(' ');
assert.deepEqual(
  NAMES.map((name, at) => ownColours.called(at, listed)),
  NAMES,
);
assert.equal(ownColours.called(GOOD.value, listed), 'Hedge');
assert.equal(ownColours.called('#5a9e4b', listed), '#5a9e4b');
assert.equal(ownColours.called(12, listed), 'ink');

// ADDED, OR REFUSED in one sentence with nothing written.
const doc = { colours: [{ name: 'Cellar "blue"', value: BLUE }] };
const REFUSED = [
  ['Sky', '#3A7BD5', 'A colour is written #rrggbb.'],
  ['Sky', 'blue', 'A colour is written #rrggbb.'],
  [' \t ', '#87ceeb', 'A colour needs a name.'],
  [undefined, '#87ceeb', 'A colour needs a name.'],
  ['y'.repeat(31), '#87ceeb', "A colour's name is 30 characters at the most."],
  [' cellar "BLUE" ', '#87ceeb', 'There is a colour "Cellar "blue"" already.'],
  ['Sky', BLUE, 'That colour is on the list already, as "Cellar "blue"".'],
];
const before = JSON.stringify(doc);
for (const [text, value, refused] of REFUSED) {
  assert.deepEqual(ownColours.add(doc, text, value), { refused }, `${text} ${value}`);
  assert.equal(JSON.stringify(doc), before, `${text} ${value}`);
}
assert.deepEqual(ownColours.add(doc, '  Sky  ', '#87ceeb'), { name: 'Sky' });
assert.deepEqual(doc.colours.at(-1), { name: 'Sky', value: '#87ceeb' });
const made = {};
assert.deepEqual(
  [ownColours.add(made, 'y'.repeat(30), '#87ceeb'), made.colours.length],
  [{ name: 'y'.repeat(30) }, 1],
);

// READ WHOLE, the rest of the file: a list whose every entry is wrong refuses no sketch, lists
// nothing, and is written back as it was read.
const BAD = [LIST[1], LIST[2], LIST[5], LIST[6], LIST[7], { value: '#555555' }, 42, null];
const WRONG = { ...sketch.blank(), space: VERSION, show: { top: {} }, colours: BAD };
const adopted = sketch.adopt(WRONG);
assert.deepEqual([JSON.stringify(adopted), ownColours.of(adopted)], [JSON.stringify(WRONG), []]);

// THE GAIN OF THE FILE OF EVERY PART. The file of the version before, as the pad reads it: its
// head made of this version. Two colours added to the list; the cellar painted in the first; a
// line of four corners, one of them off the grid to the centimetre, on every level, in the
// second; and a line on every level that its own switch hides. The sketch is the golden file of
// the version that brought them - by its number, so that this holds once it is frozen - byte
// for byte, and kept so; as many steps undo it.
const BROUGHT_IT = 12;
const [was, brought] = [asNow('every-part', BEFORE_IT), asNow('every-part', BROUGHT_IT)];
assert.equal(JSON.stringify(sketch.doc), was);
const levels = sketch.levels();
const added = [];
sketch.change((one) => added.push(ownColours.add(one, 'Cellar "blue"', BLUE)));
sketch.change((one) => added.push(ownColours.add(one, 'Boundary', '#c0392b')));
assert.deepEqual(added, [{ name: 'Cellar "blue"' }, { name: 'Boundary' }]);
const cellar = sketch.doc.things[3];
assert.deepEqual([cellar.colour, cellar.name, cellar.z], [0, undefined, [18, 22]]);
sketch.paint(cellar, BLUE);
const AROUND = [4, 4, 61.38, 4, 61.38, 46, 4, 46, '#c0392b'];
sketch.change((one) => one.notes.push({ view: 'top', at: 'every', line: AROUND }));
sketch.change((one) => {
  const hidden = { view: 'top', at: 'every', line: [4, 50, 30, 50, 1] };
  one.notes.push(hidden);
  hidden.hidden = true;
});
assert.equal(JSON.stringify(sketch.doc), brought);
assert.deepEqual([local.held.get(KEY), sketch.past.length], [brought, 5]);
// Read again, the file is the same, byte for byte.
assert.equal(JSON.stringify(sketch.adopt(JSON.parse(brought))), brought);

// A LINE ON EVERY LEVEL makes no level and lies on no layer: the levels are what they were, and
// no layer of any plane has it. What the cellar is drawn in is its value.
assert.deepEqual(sketch.levels(), levels);
const everywhere = (note) => note.at === 'every';
for (const key of sketch.keys()) assert.ok(!sketch.layer('top', key).notes.some(everywhere), key);
for (const [plane, key] of [
  ['side', 20],
  ['end', 30],
]) {
  assert.ok(!sketch.layer(plane, key).notes.some(everywhere), plane);
}
assert.equal(paper.hex(sketch.doc.things[3].colour), BLUE);
assert.equal(ownColours.called(BLUE), 'Cellar "blue"');

// HOW MUCH IS IN A COLOUR: the workshop, a block of two boxes, painted in the second colour,
// is one block, beside one line; the cellar one block, and no line.
sketch.paint(sketch.doc.things[1], '#c0392b');
assert.deepEqual(ownColours.using(sketch.doc, '#c0392b'), { blocks: 1, lines: 1 });
assert.deepEqual(ownColours.using(sketch.doc, BLUE), { blocks: 1, lines: 0 });
assert.deepEqual(ownColours.using(sketch.doc, '#87ceeb'), { blocks: 0, lines: 0 });

// REMOVED, A COLOUR STAYS ON WHAT IS DRAWN IN IT (Rule 3): the list one shorter, and every box
// and every line as it was - called now by its value. The last removed takes the list away.
const drawn = () => JSON.stringify([sketch.doc.things, sketch.doc.notes]);
const held = drawn();
sketch.change((one) => ownColours.remove(one, '#c0392b'));
assert.deepEqual(ownColours.of(), [{ name: 'Cellar "blue"', value: BLUE }]);
assert.deepEqual([drawn(), ownColours.called('#c0392b')], [held, '#c0392b']);
assert.deepEqual(ownColours.using(sketch.doc, '#c0392b'), { blocks: 1, lines: 1 });
sketch.change((one) => ownColours.remove(one, BLUE));
assert.deepEqual([drawn(), 'colours' in sketch.doc], [held, false]);

// UNDONE, step by step, to the file of the version before as the pad reads it.
const steps = sketch.past.length;
for (let step = 0; step < steps; step += 1) sketch.step(sketch.past, sketch.future);
assert.deepEqual([JSON.stringify(sketch.doc), local.held.get(KEY)], [was, was]);
assert.equal(steps, 5 + 3);

process.stdout.write(
  "tools/sketch: a colour of the owner's is its value, the eleven their number, anything else ink; the list of colours is read leniently, added to and taken from, and what is drawn keeps its colour; a line on every level makes no level; and the file of every part gained version 12 by changes of the pad\n",
);
