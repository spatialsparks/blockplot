// The check of the rates of a rough cost (info/rates.js; story ST-032, version 7 of the sketch
// file): what a rate multiplies and how large one can be, typed in; what a sketch says of its
// rates and what it does not; what a typed text is as a rate - a point, a comma, an apostrophe
// between two digits - and the one sentence in which it is refused; and how a rate is written
// into a sketch - the parts in their order whatever order they were set in, a rate taken away,
// and after the last the bytes of a sketch that never held one. Then in the pad: a rate set
// through the pad's own `change` is kept at once, with the sketch, as one step that Undo takes
// back. No rate is the pad's: none of this adds anything up. The pad's own scripts on a made-up
// store and the made-up plot: no browser, nothing of the real site. Run by tools/sketch/check.js,
// or alone: pnpm exec node tools/sketch/info/rates.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { golden, VERSION } from '../check-golden.js';

// The script is loaded first, before the list it asks: it reads nothing as it loads.
await import('./rates.js');
await import('../categories.js');
const { rates, categories } = globalThis;

// --- what a rate multiplies, and how large it can be --------------------------------------------------
// Typed in (the story's rule 3): a cubic metre of rooms and of what stands under glass, a square
// metre of open air - and nothing for ground or for a cut. A rate is at most a million.
assert.deepEqual(Object.entries(rates.PER), [
  ['room', 'm³'],
  ['glass', 'm³'],
  ['open', 'm²'],
]);
assert.ok(Object.isFrozen(rates.PER), 'what a rate multiplies can be changed in a page');
assert.equal(rates.MOST, 1000000);
// A category has a rate of its own where its row counts as one of the three: all of the list
// but the two of the ground - 22 of rooms, 5 of open air and one of glass, in the list's order.
const RATED = categories.LIST.filter((row) => !row.key.startsWith('ground-'));
assert.deepEqual([categories.LIST.length, RATED.length], [30, 28]);
const counting = (as) => RATED.filter((row) => row.as === as).length;
assert.deepEqual([counting('room'), counting('open'), counting('glass')], [22, 5, 1]);

// --- `rates.of` -----------------------------------------------------------------------------------------
// A sketch that says nothing of its rates has none, in two empty parts: no sketch, one drawn
// before there were rates, and one whose `rates` holds no part.
const NO_RATE = { as: {}, category: {} };
const SILENT = [undefined, null, {}, { rates: null }, { rates: {} }, { rates: 'dear' }];
for (const doc of [
  ...SILENT,
  { rates: 950 },
  { rates: [950] },
  { rates: { as: 7, category: [] } },
]) {
  assert.deepEqual(rates.of(doc), NO_RATE, JSON.stringify(doc));
}
// What a sketch holds, each under its name: the three of `as`, both ends of the range among
// them, and a category's own. They stand in the order of the pad, whatever order the sketch
// has them in: a room, glass, open air - and the kitchen before the garage, as in the list.
const HELD = {
  category: { garage: 420.5, kitchen: 1000000 },
  as: { open: 0, glass: 1200.5, room: 950 },
};
const READ = {
  as: { room: 950, glass: 1200.5, open: 0 },
  category: { kitchen: 1000000, garage: 420.5 },
};
assert.deepEqual(rates.of({ rates: HELD }), READ);
const inOrder = (read) =>
  JSON.stringify([Object.keys(read), Object.keys(read.as), Object.keys(read.category)]);
assert.equal(inOrder(rates.of({ rates: HELD })), inOrder(READ));
// Every category that can have a rate has the one that the sketch holds for it.
const each = Object.fromEntries(RATED.map((row, at) => [row.key, at + 0.25]));
assert.equal(
  JSON.stringify(rates.of({ rates: { category: each } }).category),
  JSON.stringify(each),
);
// WHAT IS NONE is not read: what is no number within the range, a centime beyond either end; and
// what stands under any other name - ground and a cut, which have no rate, a word that is none,
// a category under its name in place of its key, a rate that stands in no part.
for (const none of [-0.01, 1000000.01, -1, 2e6, '950', null, true, [950], { value: 950 }]) {
  const said = { as: { room: none, open: 300 }, category: { kitchen: none, garage: 420.5 } };
  const read = { as: { open: 300 }, category: { garage: 420.5 } };
  assert.deepEqual(rates.of({ rates: said }), read, JSON.stringify(none));
}
const STRAY = {
  room: 950,
  as: { ground: 5, cut: 5, pool: 5, Room: 5, open: 300 },
  category: { 'ground-fill': 5, 'ground-cut': 5, pool: 5, Kitchen: 5, 'living room': 5, lift: 80 },
};
assert.deepEqual(rates.of({ rates: STRAY }), { as: { open: 300 }, category: { lift: 80 } });
// And no zero below zero: a rate of -0, which a file can say, is a rate of 0.
assert.ok(Object.is(rates.of(JSON.parse('{"rates":{"as":{"room":-0}}}')).as.room, 0));

// --- `rates.typed` ---------------------------------------------------------------------------------------
// A number within the range is the rate, to the centime: with a point or a comma, with blanks
// around it, at either end of the range. `0` is a rate: that thing costs nothing. And an
// apostrophe between two digits is passed over, the straight one and the curled one, which is
// named by its number here, 2019: a thousand is typed as the page writes it.
const CURLED = '\u{2019}';
assert.deepEqual([CURLED.length, CURLED.codePointAt(0), "'".codePointAt(0)], [1, 0x2019, 0x27]);
const TYPED = {
  950: 950,
  0: 0,
  '0.0': 0,
  ' 300 \t': 300,
  1200.5: 1200.5,
  '1200,5': 1200.5,
  '.5': 0.5,
  '5.': 5,
  '007': 7,
  420.504: 420.5,
  420.506: 420.51,
  1000000: 1000000,
  '1000000.00': 1000000,
  1000000.004: 1000000,
  "1'200": 1200,
  [`1${CURLED}200`]: 1200,
  "1'000'000": 1000000,
  "12'345,67": 12345.67,
  [`12${CURLED}345.6`]: 12345.6,
};
for (const [text, value] of Object.entries(TYPED)) {
  assert.deepEqual(rates.typed(text), { value }, text);
}
assert.equal(Object.keys(TYPED).length, 19);
// A text of blanks alone is no rate and no refusal: it takes the rate away.
for (const blank of ['', ' ', ' \t\n', undefined, null]) {
  assert.deepEqual(rates.typed(blank), { value: null }, JSON.stringify(blank));
}
// REFUSED, each in the one sentence, which names the range and says the text as it was typed,
// without the blanks at its ends: a sign, a letter, a unit, a blank within, two points, an
// exponent; a centime beyond the range, and far beyond it; an apostrophe that does not stand
// between two digits - at an end, beside another, beside the point; and the digits of another
// writing, the last.
const NO_RATES = ['-5', '+5', '-0', '-0.01', 'dear', 'x', '5 CHF', '5.-', '1 200', '1.2.3'];
NO_RATES.push('1,2,3', '1,200.50', '1e3', '0x10', '.', ',', 'NaN', 'Infinity', '1000000.01');
NO_RATES.push('1000001', '2000000', "'1200", "1200'", "'", "1''200", "1'.5", "1.'5", "'1'200");
NO_RATES.push(`${CURLED}1200`, `1200${CURLED}`, `1'${CURLED}200`, '١٢٠٠');
for (const text of NO_RATES) {
  const refused = `A rate is a number from 0 to 1000000, in francs: "${text}" is none.`;
  assert.deepEqual(rates.typed(text), { refused }, text);
  assert.deepEqual(rates.typed(`  ${text}\t`), { refused }, `${text}, with blanks around it`);
}
assert.equal(NO_RATES.length, 32);

// --- `rates.set` -----------------------------------------------------------------------------------------
// Written into a sketch, the rates stand under `rates`, after all the sketch held: `as` before
// `category`, a room, glass, open air, and the categories in the list's order - whatever order
// they were set in. A rate that is set again stands where it stood.
const BLANK = `{"space":${VERSION},"things":[],"floors":[],"notes":[],"on":{},"show":{"top":{}}}`;
const drawn = JSON.parse(BLANK);
const text = () => JSON.stringify(drawn);
const holding = (held) => `${BLANK.slice(0, -1)},"rates":${held}}`;
rates.set(drawn, { category: 'garage' }, 420.5);
assert.equal(text(), holding('{"category":{"garage":420.5}}'));
rates.set(drawn, { as: 'open' }, 300);
rates.set(drawn, { category: 'kitchen' }, 1500);
rates.set(drawn, { as: 'room' }, 950);
rates.set(drawn, { as: 'glass' }, 0);
const ALL = '{"as":{"room":950,"glass":0,"open":300},"category":{"kitchen":1500,"garage":420.5}}';
assert.equal(text(), holding(ALL));
rates.set(drawn, { as: 'glass' }, 1200);
rates.set(drawn, { category: 'kitchen', as: undefined }, 1000000);
const SET = ALL.replace('"glass":0', '"glass":1200').replace('"kitchen":1500', '"kitchen":1000000');
assert.equal(text(), holding(SET));
assert.deepEqual(rates.of(drawn), JSON.parse(SET));
// WHAT IS NO RATE is not written, and the sketch stays as it is: a number outside the range,
// what is no number, and nothing; a name that has no rate, no name, and two names at once.
for (const none of [-0.01, 1000000.01, '950', NaN, undefined, true, [950], Infinity]) {
  rates.set(drawn, { as: 'room' }, none);
  rates.set(drawn, { category: 'garage' }, none);
  assert.equal(text(), holding(SET), `a rate of ${none}`);
}
const NO_NAMES = [{ as: 'ground' }, { as: 'cut' }, { as: 'pool' }, { category: 'ground-cut' }];
NO_NAMES.push({ category: 'pool' }, { category: 'Kitchen' }, { room: 'as' }, {}, null, undefined);
NO_NAMES.push('room', ['as', 'room'], { as: 'room', category: 'garage' }, { as: ['room'] });
for (const none of NO_NAMES) {
  for (const value of [5, null]) rates.set(drawn, none, value);
  assert.equal(text(), holding(SET), JSON.stringify(none));
}
// TAKEN AWAY with null, one by one: a part that holds none is left out, and with the last rate
// `rates` itself - the sketch has the bytes it had before a rate was set. Taking away what the
// sketch does not hold writes nothing.
rates.set(drawn, { as: 'glass' }, null);
assert.equal(text(), holding(SET.replace('"glass":1200,', '')));
rates.set(drawn, { category: 'kitchen' }, null);
rates.set(drawn, { category: 'garage' }, null);
assert.equal(text(), holding('{"as":{"room":950,"open":300}}'));
rates.set(drawn, { as: 'open' }, null);
rates.set(drawn, { category: 'garage' }, null);
assert.equal(text(), holding('{"as":{"room":950}}'));
rates.set(drawn, { as: 'room' }, null);
assert.equal(text(), BLANK);
rates.set(drawn, { as: 'room' }, null);
assert.equal(text(), BLANK);
// Of a `rates` written by hand - a rate that is none, a name that is none, the parts in another
// order - there stand, once a rate is set, the rates that the pad read of it. And a rate of -0
// is written as the 0 it is.
const byHand = {
  rates: { note: 'dear', category: { pool: 3, garage: 420.5 }, as: { open: 300, room: 'x' } },
};
rates.set(byHand, { as: 'glass' }, -0);
assert.equal(
  JSON.stringify(byHand),
  '{"rates":{"as":{"glass":0,"open":300},"category":{"garage":420.5}}}',
);
assert.ok(Object.is(byHand.rates.as.glass, 0));

// --- in the pad ------------------------------------------------------------------------------------------
// The made-up house, which holds no rate, in a made-up store. A rate set through the pad's own
// `change` is kept at once, with the sketch, after all it held, as one step; taken away, the
// sketch is the file again, byte for byte - and so after an undo and a redo. A rate that the
// sketch has already makes no step.
const kept = new Map();
const store = {
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, held) => kept.set(key, held),
};
Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: store, configurable: true });
globalThis.location = { hash: '#top' };
const KEY = 'blockplot/sketch/space';
const HOUSE = golden('made-up');
kept.set(KEY, HOUSE);
for (const file of ['demo-site', 'paper', 'figures', 'shapes', 'blocks', 'legacy', 'sketch']) {
  await import(`../${file}.js`);
}
const { sketch } = globalThis;
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
assert.deepEqual([JSON.stringify(sketch.doc), rates.of(sketch.doc)], [HOUSE, NO_RATE]);
const RATED_HOUSE = `${HOUSE.slice(0, -1)},"rates":{"as":{"room":950}}}`;
sketch.change((doc) => rates.set(doc, { as: 'room' }, rates.typed('  950.00 ').value));
assert.deepEqual([kept.get(KEY), sketch.past], [RATED_HOUSE, [HOUSE]]);
assert.deepEqual(rates.of(sketch.stored()), { as: { room: 950 }, category: {} });
sketch.change((doc) => rates.set(doc, { as: 'room' }, 950));
assert.equal(sketch.past.length, 1, 'a rate that the sketch has is a step');
sketch.change((doc) => rates.set(doc, { as: 'room' }, rates.typed(' ').value));
assert.deepEqual(
  [JSON.stringify(sketch.doc), kept.get(KEY), sketch.past.length],
  [HOUSE, HOUSE, 2],
);
sketch.step(sketch.past, sketch.future);
assert.equal(kept.get(KEY), RATED_HOUSE);
sketch.step(sketch.future, sketch.past);
assert.equal(kept.get(KEY), HOUSE);

process.stdout.write(
  'tools/sketch/info: a rate is the number that was typed, from 0 to a million, kept with the sketch in the order of the pad, and gone without a trace once it is taken away\n',
);
