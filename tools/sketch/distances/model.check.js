// The check of the boundary distances (distances/model.js; story ST-036, version 10 of the sketch
// file): the three and their range, typed in, with no figure of any zone among them; what a
// sketch says of them and what it does not; what a typed text is as one, and the one sentence in
// which it is refused; how one is written into a sketch - in their order whatever order they were
// set in, one taken away, and after the last the bytes of a sketch that never held one; how a
// line is labelled. And the three distances that the golden file of every part gained with
// version 10, made again by the pad's own changes on the frozen file before it - byte for byte,
// and three steps to undo. The pad's own scripts on a made-up store and the made-up plot: no
// browser, nothing of the real site.
// Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/distances/model.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { asNow, golden, VERSION } from '../check-golden.js';

// A browser's two stores, the first holding the file of every part as the pad of version 9
// wrote it: the pad reads it as it loads, from above.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
const KEY = 'blockplot/sketch/space';
// The version before the one that brought the boundary distances.
const BEFORE_IT = 9;
local.held.set(KEY, golden('every-part', BEFORE_IT));
globalThis.location = { hash: '#top' };
await import('../demo-site.js');
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
for (const file of ['paper', 'figures', 'shapes', 'blocks', 'legacy', 'sketch']) {
  await import(`../${file}.js`);
}
await import('./model.js');
const { distances, sketch } = globalThis;

// --- the three, and their range ------------------------------------------------------------------
// Typed in: three names and their words, and no figure (the story's rule 3: no default).
assert.deepEqual(distances.LISTED, [
  { name: 'smallM', words: 'small boundary distance' },
  { name: 'largeM', words: 'large boundary distance' },
  { name: 'annexM', words: 'boundary distance of annexes' },
]);
assert.ok(Object.isFrozen(distances.LISTED), 'the list of distances can be changed in a page');
assert.ok(distances.LISTED.every(Object.isFrozen), 'a listed distance can be changed in a page');
const said = distances.LISTED.flatMap(Object.values);
assert.ok(
  said.every((one) => typeof one === 'string'),
  'a figure stands in the list',
);
assert.deepEqual([distances.FROM_M, distances.TO_M], [0.5, 30]);

// --- `distances.of` ------------------------------------------------------------------------------
// A sketch that says nothing of them has none: no sketch, a blank one, the file of every part as
// version 9 wrote it, a `distances` that holds nothing, and one that is no object.
const NEVER = `{"space":${VERSION},"things":[],"floors":[],"notes":[],"on":{},"show":{"top":{}}}`;
for (const doc of [undefined, JSON.parse(NEVER), sketch.doc, { distances: {} }, { distances: 4 }]) {
  assert.deepEqual(distances.of(doc), {});
}
// Each at both ends of the range, read in the order of the list whatever order it was written in.
const ENDS = { annexM: 30, largeM: 0.5, smallM: 30 };
assert.deepEqual(Object.entries(distances.of({ distances: ENDS })), [
  ['smallM', 30],
  ['largeM', 0.5],
  ['annexM', 30],
]);
assert.deepEqual(distances.of({ distances: { smallM: 0.5, largeM: 30 } }), {
  smallM: 0.5,
  largeM: 30,
});
// Not read: a text, a figure outside the range, what is no number - and a fourth name.
for (const none of ['4', -1, 0.49, 30.01, Number.NaN, null]) {
  const doc = { distances: { smallM: none, largeM: none, annexM: none } };
  assert.deepEqual(distances.of(doc), {}, String(none));
}
assert.deepEqual(distances.of({ distances: { roadM: 4, largeM: 7.5 } }), { largeM: 7.5 });

// --- `distances.typed` ---------------------------------------------------------------------------
// Digits, with one point or one comma among them or none, taken to the centimetre.
const TYPED = [
  ['4', 4],
  ['7,5', 7.5],
  [' 4.004 ', 4],
  ['0.5', 0.5],
  ['30', 30],
];
for (const [text, value] of TYPED) assert.deepEqual(distances.typed(text), { value }, text);
// Blanks alone take the distance away.
for (const text of ['', '  ']) assert.deepEqual(distances.typed(text), { value: null });
// Everything else is refused, in one sentence that names the range and what was typed, trimmed.
for (const text of ['abc', '0', '-2', '+2', '0.49', '30.01', '4 m', '1e1', '4.5.1', ' abc ']) {
  const refused = `A boundary distance is a number from 0.5 to 30 m: "${text.trim()}" is none.`;
  assert.deepEqual(distances.typed(text), { refused }, text);
}

// --- `distances.set` -----------------------------------------------------------------------------
// Set as large, annex, small, they stand small, large, annex: after what the sketch held.
const doc = JSON.parse(NEVER);
distances.set(doc, 'largeM', 6);
distances.set(doc, 'annexM', 2.5);
distances.set(doc, 'smallM', 3);
const ALL = `${NEVER.slice(0, -1)},"distances":{"smallM":3,"largeM":6,"annexM":2.5}}`;
assert.equal(JSON.stringify(doc), ALL);
// What is no distance writes nothing: a name not listed, a value out of the range or no number.
const wrong = [
  ['roadM', 4],
  ['toString', 4],
  ['smallM', 0.49],
  ['largeM', 30.01],
  ['annexM', '4'],
  ['annexM', Number.NaN],
  ['annexM', undefined],
];
for (const [name, value] of wrong) {
  distances.set(doc, name, value);
  assert.equal(JSON.stringify(doc), ALL, `${name} ${value}`);
}
// `distances` stands where it was first set: a field added after it stays after it.
doc.later = true;
distances.set(doc, 'largeM', null);
const BUT_LARGE = `${NEVER.slice(0, -1)},"distances":{"smallM":3,"annexM":2.5},"later":true}`;
assert.equal(JSON.stringify(doc), BUT_LARGE);
delete doc.later;
// The last taken away leaves the bytes of a sketch that never held one.
distances.set(doc, 'smallM', null);
distances.set(doc, 'annexM', null);
assert.equal(JSON.stringify(doc), NEVER);
// What is none in a `distances` is read and written back as it is, until a distance is set: then
// `distances` is what `of` read, with that change.
const ODD = `${NEVER.slice(0, -1)},"distances":{"roadM":4,"smallM":"4","largeM":7.5}}`;
const odd = sketch.adopt(JSON.parse(ODD));
assert.equal(JSON.stringify(odd), ODD);
distances.set(odd, 'annexM', 2);
assert.equal(JSON.stringify(odd), `${NEVER.slice(0, -1)},"distances":{"largeM":7.5,"annexM":2}}`);

// --- `distances.label` ---------------------------------------------------------------------------
const LABELS = [
  [4, '4.0 m'],
  [7.5, '7.5 m'],
  [3.25, '3.25 m'],
  [0.5, '0.5 m'],
  [30, '30.0 m'],
];
for (const [value, text] of LABELS) assert.equal(distances.label(value), text);

// THE DISTANCES OF THE FILE OF EVERY PART. The file of version 9, as the pad reads it: its head
// made of this version. Three changes give it a large distance of 6 m, one of annexes of 2.5 m
// and a small one of 3 m: the sketch is the golden file of the version that brought the
// distances - by its number, so that this holds once it is frozen - byte for byte, and kept so;
// three steps of Undo take it back.
const BROUGHT_IT = 10;
const [was, brought] = [asNow('every-part', BEFORE_IT), asNow('every-part', BROUGHT_IT)];
assert.ok(VERSION >= BROUGHT_IT, 'the pad writes a version before the distances');
assert.equal(JSON.stringify(sketch.doc), was);
sketch.change((it) => distances.set(it, 'largeM', 6));
sketch.change((it) => distances.set(it, 'annexM', 2.5));
sketch.change((it) => distances.set(it, 'smallM', 3));
assert.equal(JSON.stringify(sketch.doc), brought);
assert.deepEqual([local.held.get(KEY), sketch.past.length], [brought, 3]);
for (let step = 0; step < 3; step += 1) sketch.step(sketch.past, sketch.future);
assert.equal(local.held.get(KEY), was);

process.stdout.write(
  'tools/sketch/distances: three boundary distances with no default, read within 0.5 to 30 m, typed to the centimetre or refused in one sentence, written in their order and gone without a trace, labelled; and the file of every part gained its three by changes of the pad\n',
);
