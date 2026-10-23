// The check of the figures of the house (figures.js): the eight defaults and their ranges, what
// a sketch says of a figure and what it does not, every way a typed text is refused and the
// words for it, and how a figure is written into a sketch - one that is set and set back leaves
// the sketch byte for byte as it was. Then one height everywhere: a door, a window and its sill
// at changed figures, in both slices, in what the pad says of them and under Select, as soon as
// a figure is changed. And the files of the versions before, from 2 on, are read as they were, to
// the byte. The pad's own scripts on a made-up store and the made-up plot: no browser, nothing of
// the real site. Run by check.js, or alone: pnpm exec node tools/sketch/figures.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { asNow, BEFORE, golden, VERSION } from './check-golden.js';

// A browser's two stores, and the address of the pad's side view: a slice along the plot.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
globalThis.location = { hash: '#side' };
for (const file of ['demo-site', 'paper', 'figures', 'shapes', 'categories', 'blocks', 'legacy']) {
  await import(`./${file}.js`);
}
const { figures, shapes, blocks } = globalThis;
const KEY = 'blockplot/sketch/space';
let loads = 0;
/** The pad's sketch, loaded anew on a store that holds this text, with what a tool does to it and what the pad says of it in words. */
async function pad(text) {
  local.held.clear();
  local.held.set(KEY, text);
  for (const file of ['sketch', 'strokes', 'footer']) await import(`./${file}.js?${(loads += 1)}`);
  return globalThis.sketch;
}

// The eight figures as the story has them (ST-024, rule 2), by hand: the name of each in a
// sketch, what it is, its default, and its range. Metres.
const TABLE = [
  ['outerWallM', 'how thick an outer wall is', 0.4, 0.1, 0.8],
  ['innerWallM', 'how thick an inner wall is', 0.2, 0.05, 0.5],
  ['floorSlabM', 'how thick a floor is', 0.3, 0.1, 0.6],
  ['roofSlabM', 'how thick a roof is', 0.3, 0.1, 0.8],
  ['railingHighM', 'how high a railing is', 1, 0.5, 1.5],
  ['doorHighM', "how high a door's opening is", 2.1, 1.8, 2.6],
  ['windowHighM', 'how high a window is', 1.5, 0.3, 2.5],
  ['sillHighM', "how high a window's sill lies over the floor", 0.9, 0, 1.5],
];
const DEFAULTS = Object.fromEntries(TABLE.map(([name, , usual]) => [name, usual]));
assert.deepEqual(Object.keys(figures.FIGURES), Object.keys(DEFAULTS));
for (const [name, words, usual, from, to] of TABLE) {
  assert.deepEqual(figures.FIGURES[name], { words, unit: 'm', default: usual, from, to });
  assert.ok(from < to && from <= usual && usual <= to, `the default of ${name} is in its range`);
}

// A sketch that says nothing of its figures has the eight defaults, in their order: no sketch,
// one drawn before there were figures, and one whose `figures` is no list of them.
const SILENT = [undefined, null, {}, { figures: null }, { figures: {} }, { figures: 'thick' }];
for (const doc of [...SILENT, { figures: 0.3 }, { figures: [0.3, 0.2] }]) {
  assert.deepEqual(Object.entries(figures.of(doc)), Object.entries(DEFAULTS));
}
// A figure of the sketch that lies within its range is the sketch's - at either end of the
// range too - and the other seven are their defaults. One outside its range is the default, and
// so is what is no number. A name that is no figure's is not read.
for (const [name, , usual, from, to] of TABLE) {
  const said = (value) => figures.of({ figures: { [name]: value } });
  const inside = from + (to - from) / 4;
  assert.notEqual(inside, usual);
  for (const value of [from, inside, to]) {
    assert.deepEqual(said(value), { ...DEFAULTS, [name]: value }, `${name} at ${value}`);
  }
  const NONE = [from - 0.01, to + 0.01, -1, 99, `${inside}`, null, true, NaN, Infinity, [inside]];
  for (const value of NONE) assert.deepEqual(said(value), DEFAULTS, `${name} at ${value}`);
}
const stray = { figures: { wallM: 0.3, outerWallM: 0.3 } };
assert.deepEqual(figures.of(stray), { ...DEFAULTS, outerWallM: 0.3 });

// What is typed. A number within the range is the figure, to the centimetre: with a point or a
// comma, with blanks around it, at either end of the range. And a zero is no zero below zero.
const OUTER = 'How thick an outer wall is: a number from 0.1 to 0.8 m.';
const TYPED = ['0.3', '0,3', ' 0.30 ', '.3', '+0.3', '0.304', '0.306', '0.1', '0.8', '0.0951'];
const VALUES = [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.31, 0.1, 0.8, 0.1];
TYPED.forEach((text, at) => {
  assert.deepEqual(figures.typed('outerWallM', text), { value: VALUES[at] }, text);
});
assert.ok(Object.is(figures.typed('sillHighM', '-0').value, 0));
// Refused, each in words that name the range: what is no number - nothing, a word, a unit, two
// points, an exponent - what lies below the range, and what lies above it.
const refusedAs = (text, why) =>
  assert.deepEqual(figures.typed('outerWallM', text), { refused: `${OUTER} ${why}` }, text);
for (const text of ['', '   ', 'thick', '0.3 m', '1.2.3', '1e-1', '0x1', '.', '-', 'NaN', '0 3']) {
  refusedAs(text, `"${text.trim()}" is none.`);
}
refusedAs('0.09', '0.09 m is too little.');
refusedAs('0,094', '0.09 m is too little.');
refusedAs('-0.3', '-0.3 m is too little.');
refusedAs('0.81', '0.81 m is too much.');
refusedAs('0.806', '0.81 m is too much.');
refusedAs('5,0', '5 m is too much.');
// A wall of no thickness and a railing of five metres, as the story has them.
refusedAs('0', '0 m is too little.');
const RAILING = 'How high a railing is: a number from 0.5 to 1.5 m. 5 m is too much.';
assert.equal(figures.typed('railingHighM', '5').refused, RAILING);
const SILL = "How high a window's sill lies over the floor: a number from 0 to 1.5 m.";
assert.equal(figures.typed('sillHighM', 'low').refused, `${SILL} "low" is none.`);
// Of every figure: both ends of its range are taken, and a centimetre beyond either is refused.
for (const [name, , , from, to] of TABLE) {
  const range = `: a number from ${from} to ${to} m.`;
  const [low, high] = [from, to].map((value) => figures.typed(name, `${value}`));
  assert.deepEqual([low, high], [{ value: from }, { value: to }], name);
  const [below, above] = [from - 0.01, to + 0.01].map((value) => Number(value.toFixed(2)));
  assert.ok(figures.typed(name, `${below}`).refused.endsWith(`${range} ${below} m is too little.`));
  assert.ok(figures.typed(name, `${above}`).refused.endsWith(`${range} ${above} m is too much.`));
  assert.ok(figures.typed(name, 'x').refused.endsWith(`${range} "x" is none.`), name);
}

// Written into a sketch, the figures that differ from their defaults stand under `figures`, in
// the order they are listed, whatever order they were set in: after all the sketch held.
const BLANK = `{"space":${VERSION},"things":[],"floors":[],"notes":[],"on":{},"show":{"top":{}}}`;
const drawn = JSON.parse(BLANK);
figures.set(drawn, 'doorHighM', 2.4);
assert.equal(JSON.stringify(drawn), `${BLANK.slice(0, -1)},"figures":{"doorHighM":2.4}}`);
for (const [name, value] of Object.entries({ sillHighM: 0, outerWallM: 0.3, innerWallM: 0.15 })) {
  figures.set(drawn, name, value);
}
const SET = { outerWallM: 0.3, innerWallM: 0.15, doorHighM: 2.4, sillHighM: 0 };
assert.deepEqual(Object.entries(drawn.figures), Object.entries(SET));
assert.deepEqual(figures.of(drawn), { ...DEFAULTS, ...SET });
// What a figure cannot be is not written: the last good figure stays.
for (const none of [0, 0.81, '0.3', NaN, null, undefined]) {
  figures.set(drawn, 'outerWallM', none);
  assert.deepEqual(drawn.figures, SET, `an outer wall of ${none}`);
}
// Set to its default, a figure is left out - and with the last of them `figures` itself: the
// sketch has the bytes it had before a figure was changed. A default set where no figure is
// held writes nothing.
figures.set(drawn, 'outerWallM', 0.4);
assert.deepEqual(Object.keys(drawn.figures), ['innerWallM', 'doorHighM', 'sillHighM']);
for (const name of ['sillHighM', 'innerWallM', 'doorHighM']) {
  figures.set(drawn, name, DEFAULTS[name]);
}
figures.set(drawn, 'roofSlabM', 0.3);
assert.equal(JSON.stringify(drawn), BLANK);
// Of a `figures` written by hand - a figure at its default, one out of its range, a name that
// is none - there stand, once a figure is set, the figures that the pad read of it.
const byHand = { figures: { note: 'thin', roofSlabM: 0.3, railingHighM: 9, doorHighM: 2.4 } };
figures.set(byHand, 'floorSlabM', 0.25);
assert.deepEqual(
  Object.entries(byHand.figures),
  Object.entries({ floorSlabM: 0.25, doorHighM: 2.4 }),
);

// The golden files of the format, in the pad: made-up.json, whose figures are the defaults, and
// every-part.json, which holds one. A figure changed through the pad's own `change` is kept at
// once, with the sketch; set back, the sketch is the file again, byte for byte - and so after
// an undo and a redo.
const WITH = {
  'made-up': (text) => `${text.slice(0, -1)},"figures":{"outerWallM":0.3}}`,
  'every-part': (text) => text.replace('"figures":{', '"figures":{"outerWallM":0.3,'),
};
for (const [name, changed] of Object.entries(WITH)) {
  const [file, sketch] = [golden(name), await pad(golden(name))];
  assert.equal(JSON.stringify(sketch.doc), file, `${name}.json is not read as it is written`);
  const held = name === 'every-part' ? { windowHighM: 1.2 } : {};
  assert.deepEqual(figures.of(sketch.doc), { ...DEFAULTS, ...held });
  sketch.change((doc) => figures.set(doc, 'outerWallM', 0.3));
  assert.deepEqual([local.held.get(KEY), sketch.past], [changed(file), [file]], name);
  assert.equal(figures.of(sketch.stored()).outerWallM, 0.3);
  sketch.change((doc) => figures.set(doc, 'outerWallM', 0.4));
  assert.deepEqual([JSON.stringify(sketch.doc), local.held.get(KEY)], [file, file], name);
  sketch.step(sketch.past, sketch.future);
  assert.equal(local.held.get(KEY), changed(file));
  sketch.step(sketch.future, sketch.past);
  assert.equal(local.held.get(KEY), file);
}

// The corpora of the versions before, frozen: the two golden files as pads of those versions
// wrote them. Each is read, and nothing of it is lost: written again, by the pad as it keeps it,
// it is the same text but for its version. No top of version 2 or 3 slopes, two of each file
// from version 4 on do; one block of each file from version 5 on is ground - a block of one box;
// one of each file from version 6 on is a cut, and one box of it says a category, none before;
// none before version 7 says a section or a rate, and from it on the file of every part does -
// its rates a second "category". A file of version 2: the eight defaults, every block by name.
for (const space of BEFORE) {
  for (const name of ['made-up', 'every-part']) {
    const [file, was] = [golden(name, space), `{"space":${space},`];
    assert.ok(file.startsWith(`${was}"things":[{"x":[`), `v${space}/${name}: another version`);
    const sketch = await pad(file);
    const boxes = sketch.doc.things.filter(sketch.isBox);
    sketch.keep();
    assert.equal(local.held.get(KEY), asNow(name, space), `v${space}/${name}.json`);
    const sloping = boxes.map(blocks.topOf).filter(Boolean);
    assert.equal(sloping.length, space < 4 ? 0 : 2, `v${space}/${name}.json slopes`);
    const counted = boxes.map((box) => blocks.countsAs(sketch.blockOf(box)).as);
    const told = ['ground', 'cut'].map((as) => counted.filter((one) => one === as).length);
    const said = [...told, file.split('"category"').length - 1, /"(sections?|rates)"/.test(file)];
    const [cut, rated] = [+(space > 5), space > 6 && name === 'every-part'];
    assert.deepEqual(said, [+(space > 4), cut, cut + rated, rated], `v${space}/${name}`);
    if (space > 2) continue;
    assert.deepEqual([sketch.doc.figures, figures.of(sketch.doc)], [undefined, DEFAULTS]);
    assert.deepEqual([...new Set(boxes.map((box) => blocks.countsAs([box]).by))], ['name'], name);
  }
}

// --- one height everywhere ---------------------------------------------------------------------------
// A room at 817 m with a platform in it, half a metre up; a door and a window on the room's
// floor, row 18, and a window on the ground - a sketch of version 2, made here: it is the same
// sketch, of the version of now, at the eight defaults, its room a room by its name.
const ROOM = { x: [30, 50], y: [22, 38], z: [12, 18], colour: 2, name: 'Room' };
const PLATFORM = { x: [42, 48], y: [20, 26], z: [14, 17], colour: 10 };
const DOOR = { kind: 'door', x: 40, y: 30, floor: 18 };
const PANE = { kind: 'window', x: 40.5, y: 22, floor: 18 };
const LOW = { kind: 'window', x: 10.5, y: 10, floor: 'ground' };
const things = [ROOM, PLATFORM, DOOR, PANE, LOW];
const TWO = { space: 2, things, floors: [], notes: [], on: {}, show: { top: {} } };
const sketch = await pad(JSON.stringify(TWO));
const { footer } = globalThis;
assert.equal(JSON.stringify(sketch.doc), JSON.stringify({ ...TWO, space: VERSION }));
assert.deepEqual(figures.of(sketch.doc), DEFAULTS);
assert.deepEqual(blocks.countsAs(sketch.blockOf(sketch.doc.things[0])), { as: 'room', by: 'name' });
// Numbers that went through a division are compared to a millionth of a cell.
const rectIs = (thing, plane, rect, what) =>
  sketch
    .rect(thing, plane)
    .forEach((edge, at) => assert.ok(Math.abs(edge - rect[at]) < 1e-6, what));
/** A door, a window and its sill, so many rows high: in both slices, in words, and under the pointer. */
function stands(doorRows, paneRows, sillRows, said) {
  const [door, pane, low] = sketch.doc.things.slice(2);
  rectIs(door, 'side', [39, 18 - doorRows, 41, 18], `the door, ${said}`);
  rectIs(door, 'end', [29, 18 - doorRows, 31, 18], `the door from its end, ${said}`);
  rectIs(pane, 'side', [39, 18 - sillRows - paneRows, 42, 18 - sillRows], `the window, ${said}`);
  rectIs(pane, 'end', [21.7, 18 - sillRows - paneRows, 22.3, 18 - sillRows], `its end, ${said}`);
  // The ground lies in row 12 + 0.2 * 10.5 + 0.04 * 10 = 14.5 under the window on the ground.
  rectIs(low, 'side', [9, 14.5 - sillRows - paneRows, 12, 14.5 - sillRows], `the low one, ${said}`);
  // From above nothing changes: a door is 2 cells by 2, a window 3 cells on the line of a wall.
  rectIs(door, 'top', [39, 29, 41, 31], said);
  rectIs(pane, 'top', [39, 21.7, 42, 22.3], said);
  const [doorM, paneM] = [doorRows / 2, paneRows / 2];
  assert.deepEqual(
    [footer.picked(door).words, footer.picked(pane).words],
    [
      `Door: 1 m by 1 m, ${doorM} m high, on the level at 817 m. R turns it.`,
      `Window: 1.5 m by 0.3 m, ${paneM} m high, on the level at 817 m. R turns it.`,
    ],
  );
  sketch.doc.on.side = 30;
  const under = footer.measure([40, 17], null, sketch.grab([40, 17], 0.3));
  assert.ok(under.endsWith(` — a door of 1 m by ${doorM} m, ${doorM} m²`), `${under}, ${said}`);
}

// With nothing set, every size is the one of before there were figures: by hand, each kind with
// its size, and what is lifted. A door is 2.1 m high, 4.2 rows; a window 1.5 m, 3 rows, its
// sill 1.8 rows up. No kind of then was renamed or taken away: the nineteen stand in their order
// and are the first of the list, but for the one kind that came between them since - the wide
// staircase of version 4, the row after the staircase.
const KINDS_BEFORE =
  'person 0.5 0.5 1.8, bed 2 2 1, car 4.5 2 1.5, tree 6 6 8, bush 1.5 1.5 1.2, fountain 2 2 1, ' +
  'stairs 4.5 1 3, spiral 2 2 3, door 1 1 2.1, window 1.5 0.3 1.5, island 2.5 1 0.9, ' +
  'counter 2.5 0.5 0.9, hob 0.5 0.5 0.1, sink 1 0.5 0.3, fridge 0.5 0.5 2, toilet 0.5 0.5 0.4, ' +
  'basin 0.5 0.5 0.85, bath 2 1 0.6, shower 1 1 2';
const LIFTED = { window: 0.9, hob: 0.9, sink: 0.9 };
const before = KINDS_BEFORE.split(', ').map((row) => row.split(' '));
const listed = Object.keys(shapes.KINDS);
assert.equal(listed[listed.indexOf('stairs') + 1], 'widestairs');
assert.deepEqual(
  listed.filter((kind) => kind !== 'widestairs').slice(0, before.length),
  before.map(([kind]) => kind),
);
for (const [kind, ...size] of before) {
  const { size: sized, lift } = shapes.KINDS[kind];
  assert.deepEqual([sized, lift], [size.map(Number), LIFTED[kind]], kind);
}
stands(4.2, 3, 1.8, 'with nothing set');
// A door of 2.4 m: at once, wherever its size is read. The window is as it was.
sketch.change((doc) => figures.set(doc, 'doorHighM', 2.4));
stands(4.8, 3, 1.8, 'with doors of 2.4 m');
// A window of 1.2 m, its sill 1.5 m up.
sketch.change((doc) => figures.set(doc, 'windowHighM', 1.2));
sketch.change((doc) => figures.set(doc, 'sillHighM', 1.5));
stands(4.8, 2.4, 3, 'with windows of 1.2 m, 1.5 m up');
assert.deepEqual([shapes.KINDS.window.size, shapes.KINDS.window.lift], [[1.5, 0.3, 1.2], 1.5]);
// Select moves the window 2 m down the plot, in the slice along its wall. It stays on its floor:
// its sill, row 15, and the 3 rows it is lifted by are row 18 - the room's floor, where the 1.8
// rows of a default sill would have stood it on the platform, row 17.
sketch.doc.on.side = 22;
const held = sketch.grab([40.5, 14], 0.3);
assert.equal(sketch.layer('side', 22).things[held.at].thing, sketch.doc.things[3]);
sketch.apply({ tool: 'move', from: [40.5, 14], to: [44.5, 14], grabbed: held });
assert.deepEqual(sketch.doc.things[3], { ...PANE, x: 44.5 });
rectIs(sketch.doc.things[3], 'side', [43, 12.6, 46, 15], 'the window, moved');
// An undo of the move, and of the sill: the window is where it was, its sill at 0.9 m again.
sketch.step(sketch.past, sketch.future);
sketch.step(sketch.past, sketch.future);
stands(4.8, 2.4, 1.8, 'with the sill set back by an undo');
// What another window kept is what this one shows, as the pad's page takes it from the store.
const elsewhere = { ...TWO, space: 7, figures: { doorHighM: 1.8, sillHighM: 0 } };
local.held.set(KEY, JSON.stringify(elsewhere));
sketch.doc = sketch.stored();
stands(3.6, 3, 0, 'as another window set them');

process.stdout.write(
  'tools/sketch: the figures have their defaults and ranges, are kept with the sketch, and a door and a window are as high as they say\n',
);
