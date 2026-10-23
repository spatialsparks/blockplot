// The check of a sketch that the pad cannot read: it is never written over. What the browser
// keeps under the pad's key and the pad cannot read is set aside as it is, under a key of its
// own, before the pad first writes. Two such texts are both kept; a store that takes no more is
// not written to; a sketch that the pad can read sets nothing aside; a page that loads the pad's
// scripts and changes nothing writes nothing; and each such text is offered as a file, byte for
// byte. The pad's own scripts, on a made-up store, paper and page: no browser, and nothing of the
// site. Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/unread.check.js
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { setImmediate as settled } from 'node:timers/promises';
import { BEFORE, VERSION } from './check-golden.js';

// A browser's store: it takes a text while all it holds stays within its limit, and counts writes.
const sizeOf = (kept) => [...kept].reduce((sum, [key, text]) => sum + key.length + text.length, 0);
const store = () => {
  const kept = new Map();
  return {
    kept,
    limit: Infinity,
    writes: 0,
    getItem: (key) => kept.get(key) ?? null,
    setItem(key, text) {
      this.writes += 1;
      if (sizeOf(new Map(kept).set(key, text)) > this.limit) throw new Error('full');
      kept.set(key, text);
    },
  };
};
const [local, session] = [store(), store()];
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });

// A made-up paper, check.js's: 71 rows across the plot, ground falling a row every ten columns.
const SPANS = { top: [-5, 30.5], side: [440, 476] };
const made = { PLANE: 'top', CELL_M: 0.5, X0: -10, COLS: 146, ACROSS: 71, WIDE: 146, ROWS: 72 };
globalThis.paper = Object.assign(made, { SPANS, groundRow: (column) => 40 + column / 10 });

// A made-up page. An element keeps who listens to it, to be called by hand. A link that is
// clicked is a file saved: its name, and what it holds - the address of a file is the file here.
// And a timer never rings: the page asks for one to forget such an address.
const [saved, byId] = [[], new Map()];
const element = (tag) => {
  const one = { style: {}, heard: {}, addEventListener: (type, hear) => (one.heard[type] = hear) };
  const save = () => saved.push({ name: one.download, file: one.href });
  return Object.assign(one, { click: () => (tag === 'a' ? save() : one.heard.click()) });
};
const document = {
  createElement: element,
  getElementById: (id) => byId.get(id) ?? byId.set(id, element()).get(id),
};
const madeUpURL = { createObjectURL: (file) => file, revokeObjectURL() {} };
Object.assign(globalThis, { document, URL: madeUpURL, setTimeout() {} });

for (const file of ['figures', 'shapes', 'categories', 'blocks', 'legacy'])
  await import(`./${file}.js`);
const KEY = 'blockplot/sketch/space';
const asideKey = (number) => `${KEY}/unread/${number}`;
const held = () => Object.fromEntries(local.kept);
// What the store is to hold: the texts set aside, each under its number, the sketch under the
// pad's key as the pad writes it, and what else the store held.
const holding = (sketch, aside, also = {}) => {
  const set = aside.map((text, at) => [asideKey(at + 1), text]);
  return { ...also, ...Object.fromEntries(set), [KEY]: JSON.stringify(sketch.doc) };
};

let loads = 0;
/** The pad's own script, loaded anew: the pad as it opens on what the stores then hold. */
async function open(texts, steps) {
  for (const one of [local, session]) one.kept.clear();
  for (const one of [local, session]) Object.assign(one, { limit: Infinity, writes: 0 });
  for (const [key, text] of Object.entries(texts)) local.kept.set(key, text);
  if (steps) session.kept.set(`${KEY}/steps`, JSON.stringify(steps));
  await import(`./sketch.js?${(loads += 1)}`);
  return globalThis.sketch;
}

/** The pad's script of files, loaded anew on the made-up page, for the sketch that is open. */
async function page() {
  await import(`./files.js?${(loads += 1)}`);
  return globalThis.files;
}

// What the page offers, in a made-up alarm that says `words` already: all that the alarm then
// says, and for each button the file it saves - its name, and its bytes.
async function offered(files, words = '') {
  const alarm = { textContent: words, parts: [], append: (...parts) => alarm.parts.push(...parts) };
  files.offer(alarm);
  for (const button of alarm.parts.filter((part) => part.heard)) button.click();
  const bytes = async ({ name, file }) => [name, Buffer.from(await file.arrayBuffer())];
  const said = words + alarm.parts.map((part) => part.textContent ?? part).join('');
  return { said, saves: await Promise.all(saved.splice(0).map(bytes)) };
}

// Three texts that the pad cannot read: one cut short, one of the space of a pad to come, one
// with a kind this pad does not know. The last is written as no pad writes one - its spaces, its
// line breaks, its numbers - so that only the text itself, as it was kept, is equal to it.
const CUT_SHORT = '{"space":7,"things":[{"x":[10,14],"y":[10,14],"z":[30,3';
const OTHER_SPACE = `{"space":${VERSION + 1},"things":[],"floors":[],"notes":[],"rooms":[{"name":"Küche"}]}`;
const UNKNOWN_KIND =
  '{ "space": 7,\n  "things": [{"kind":"hammock","x":20.50,"y":3e1,"floor":"ground"}],\n' +
  '  "floors": [], "notes": [], "name": "Zürich, 1. OG" }\n';
assert.equal(globalThis.shapes.KINDS.hammock, undefined, 'a hammock is a kind the pad knows now');

// And what it can read: a sketch of now, with an object of a kind it knows; one of each space
// before; and, with nothing under its key, an old sketch of the top view, which it brings over.
const box = (column) => ({ x: [column, column + 4], y: [10, 14], z: [30, 36], colour: 1 });
const draw = (column) => (doc) => doc.things.push(box(column));
const rest = () => ({ floors: [], notes: [], on: {}, show: { top: {} } });
const drawn = (things) => ({ space: VERSION, things, ...rest() });
const [kind] = Object.keys(globalThis.shapes.KINDS);
const READABLE = JSON.stringify(drawn([box(40), { kind, x: 20, y: 30, floor: 'ground' }]));
const older = (space) => JSON.stringify({ ...drawn([box(40)]), space, on: { side: 1 } });
const sheet = { name: 'Level 455 m', level: 455, blocks: [[52, 32, 60, 40, 4]] };
const old = { view: 'top', current: 0, sheets: [{ ...sheet, lines: [], labels: [] }] };
const OLD_TOP = { 'blockplot/sketch/top': JSON.stringify(old) };
// The steps a tab kept: one to undo, from a pad of a version before - a text that says 6.
const STEPS = { past: [older(6)], future: [] };

// What makes the pad write: a stroke, a file opened, an undo, a slice moved (kept, with no step).
const CHANGES = {
  'a stroke': (sketch) => sketch.change(draw(10)),
  'a file opened': async () => {
    byId.get('file').files = [{ name: 'made-up.json', text: () => Promise.resolve(READABLE) }];
    byId.get('file').heard.change();
    await settled();
  },
  'an undo': (sketch) => sketch.step(sketch.past, sketch.future),
  'a slice moved': (sketch) => {
    sketch.doc.on.side = 12;
    sketch.keep();
  },
};

// Whatever the text is, and whatever writes first: the pad opens on an empty paper and writes
// nothing; then the text is under a key of its own, as it was, a sketch that the pad reads is
// under the pad's, and the store holds nothing else. So it stays, whatever is changed after.
for (const text of [CUT_SHORT, OTHER_SPACE, UNKNOWN_KIND]) {
  for (const [name, change] of Object.entries(CHANGES)) {
    const sketch = await open({ [KEY]: text }, STEPS);
    await page();
    assert.deepEqual([sketch.doc, local.writes], [drawn([]), 0], `as the pad opens, for ${name}`);
    assert.deepEqual(sketch.unread(), { aside: [], waiting: text });
    await change(sketch);
    assert.deepEqual(held(), holding(sketch, [text]), `after ${name}`);
    assert.deepEqual(sketch.stored(), sketch.doc, `after ${name}, the pad cannot read its sketch`);
    assert.notDeepEqual(sketch.doc, drawn([]), `${name} changed nothing`);
    assert.deepEqual([sketch.unread(), sketch.trouble], [{ aside: [text], waiting: null }, '']);
    sketch.change(draw(20));
    sketch.step(sketch.past, sketch.future);
    sketch.keep();
    assert.deepEqual(held(), holding(sketch, [text]), `long after ${name}`);
  }
}

// With an old sketch in the browser too, the pad opens on what that holds, as it did before.
// The text it cannot read is set aside all the same, and the old sketch stays as it is.
{
  const sketch = await open({ ...OLD_TOP, [KEY]: UNKNOWN_KIND });
  assert.equal(sketch.doc.things.length, 1);
  sketch.change(draw(10));
  assert.deepEqual(held(), holding(sketch, [UNKNOWN_KIND], OLD_TOP));
}

// Two texts that the pad cannot read, one after the other, are both kept. The second comes from
// another window, of a pad that knows more, while this one is open. A text that is set aside
// already gets no second key. And a pad that opens later on a third sets that one aside too.
{
  const sketch = await open({ [KEY]: UNKNOWN_KIND });
  sketch.change(draw(10));
  local.kept.set(KEY, OTHER_SPACE);
  assert.deepEqual(sketch.unread(), { aside: [UNKNOWN_KIND], waiting: OTHER_SPACE });
  sketch.change(draw(20));
  assert.deepEqual(held(), holding(sketch, [UNKNOWN_KIND, OTHER_SPACE]));
  local.kept.set(KEY, UNKNOWN_KIND);
  sketch.change(draw(30));
  assert.deepEqual(held(), holding(sketch, [UNKNOWN_KIND, OTHER_SPACE]), 'set aside twice');
  const later = await open({ ...held(), [KEY]: CUT_SHORT });
  later.change(draw(10));
  assert.deepEqual(held(), holding(later, [UNKNOWN_KIND, OTHER_SPACE, CUT_SHORT]));
}

// The store takes no more: a copy of the text lacks one character of room. Nothing is written,
// the text stays under the pad's key, and the pad says that it is not keeping the sketch, and
// why. What was drawn stays on the paper, and once the store takes more, the next change sets
// the text aside and keeps all of it.
const NOT_KEEPING = 'This browser is not keeping the sketch: ';
const copy = asideKey(1).length + UNKNOWN_KIND.length;
{
  const sketch = await open({ [KEY]: UNKNOWN_KIND });
  local.limit = sizeOf(local.kept) + copy - 1;
  for (const column of [10, 20]) {
    sketch.change(draw(column));
    assert.deepEqual(held(), { [KEY]: UNKNOWN_KIND }, 'a store that is full was written to');
    assert.ok(sketch.trouble.startsWith(`${NOT_KEEPING}it holds one that this pad cannot read`));
    assert.match(sketch.trouble, /has no room to set it aside, so nothing was written\. Use "Save/);
  }
  local.limit = Infinity;
  sketch.change(draw(30));
  assert.deepEqual(held(), holding(sketch, [UNKNOWN_KIND]));
  assert.deepEqual([sketch.doc.things, sketch.trouble], [[10, 20, 30].map(box), '']);
}

// Room for the copy, and none for a sketch that is larger than the text: the text is then kept
// twice, the pad says what it always said of a store that is full, and the next change makes no
// third copy. And a store that cannot be asked what it holds is not written to at all.
{
  const sketch = await open({ [KEY]: UNKNOWN_KIND });
  local.limit = sizeOf(local.kept) + copy;
  for (const columns of [[10, 20, 30, 40, 50, 60], [70]]) {
    sketch.change((doc) => doc.things.push(...columns.map(box)));
    assert.ok(JSON.stringify(sketch.doc).length > UNKNOWN_KIND.length);
    assert.deepEqual(held(), { [KEY]: UNKNOWN_KIND, [asideKey(1)]: UNKNOWN_KIND });
    assert.equal(sketch.trouble, `${NOT_KEEPING}use "Save file" before you close the tab.`);
  }
  local.limit = Infinity;
  sketch.change(draw(80));
  assert.deepEqual([held(), sketch.trouble], [holding(sketch, [UNKNOWN_KIND]), '']);

  const [asked, before] = [local.getItem, held()];
  local.getItem = () => {
    throw new Error('refused');
  };
  local.writes = 0;
  sketch.change(draw(90));
  assert.deepEqual(await offered(await page()), { said: '', saves: [] });
  local.getItem = asked;
  assert.equal(sketch.trouble, `${NOT_KEEPING}use "Save file" before you close the tab.`);
  assert.deepEqual([held(), local.writes], [before, 0]);
}

// A sketch that the pad can read sets nothing aside: the store holds what it held, and under
// the pad's key the sketch as the pad always wrote it, with one write for each change.
const OLDER = [1, ...BEFORE].map((space) => ({ [KEY]: older(space) }));
for (const [index, texts] of [{}, { [KEY]: READABLE }, ...OLDER, OLD_TOP].entries()) {
  const sketch = await open(texts);
  assert.equal(sketch.doc.things.length, [0, 2][index] ?? 1, 'sketch is not read');
  assert.deepEqual(sketch.unread(), { aside: [], waiting: null });
  assert.deepEqual(await offered(await page()), { said: '', saves: [] });
  assert.equal(local.writes, 0, 'the pad wrote as it opened');
  sketch.change(draw(10));
  sketch.step(sketch.past, sketch.future);
  sketch.keep();
  assert.deepEqual(held(), holding(sketch, [], texts));
  assert.deepEqual([local.writes, sketch.trouble], [3, '']);
}

// A page that loads the pad's script and changes nothing - as the 3D view does, until a figure
// is typed there - writes nothing and sets nothing aside, whatever it asks of the sketch. Nor
// does an Undo to a step that the pad cannot read, of a pad to come: it is dropped. And the
// script has no words of its own for the text: the 3D view adds the pad's trouble to its own.
{
  const kept = { past: [...STEPS.past, OTHER_SPACE], future: [] };
  const sketch = await open({ [KEY]: UNKNOWN_KIND }, kept);
  assert.deepEqual(sketch.unread(), { aside: [], waiting: UNKNOWN_KIND });
  assert.deepEqual([sketch.stored(), sketch.levels(), sketch.past], [null, [], kept.past]);
  assert.deepEqual(sketch.layer('top', sketch.on('top')).things, []);
  sketch.step(sketch.past, sketch.future);
  assert.deepEqual([held(), local.writes, session.writes], [{ [KEY]: UNKNOWN_KIND }, 0, 0]);
  assert.deepEqual([sketch.trouble, sketch.past, sketch.future], ['', STEPS.past, []]);
}

// The page says so as it opens, after whatever else the alarm says, and offers the text as a
// file: its bytes are the text's, as it was kept. After the first change the words are gone, and
// the button offers what was set aside - the same bytes, under the same name. Of two set aside
// and a third that waits, each has a button, in the order they came in; and a text that waits
// and is set aside already has the one.
{
  const sketch = await open({ [KEY]: UNKNOWN_KIND });
  const files = await page();
  const UNREAD =
    'This browser holds a sketch that this pad cannot read. It is left as it is: ' +
    'the first change made here sets it aside and does not write over it.';
  const ASIDE = ['Save sketch 1 that was set aside', 'Save sketch 2 that was set aside'];
  const file = (text, at) => [`sketch-unread-${at + 1}.json`, Buffer.from(text)];
  const first = [UNKNOWN_KIND].map(file);
  assert.deepEqual(await offered(files), { said: `${UNREAD}Save it as a file`, saves: first });
  assert.equal((await offered(files, 'Said.')).said, `Said. ${UNREAD}Save it as a file`);
  sketch.change(draw(10));
  assert.deepEqual(await offered(files), { said: ASIDE[0], saves: first });
  local.kept.set(KEY, OTHER_SPACE);
  sketch.change(draw(20));
  local.kept.set(KEY, CUT_SHORT);
  const said = [UNREAD, ...ASIDE, 'Save it as a file'].join('');
  const saves = [UNKNOWN_KIND, OTHER_SPACE, CUT_SHORT].map(file);
  assert.deepEqual(await offered(files), { said, saves });
  local.kept.set(KEY, UNKNOWN_KIND);
  const twice = { said: [UNREAD, ...ASIDE].join(''), saves: saves.slice(0, 2) };
  assert.deepEqual(await offered(files), twice);
}

// No browser test opens the pad on such a sketch, and the page's own script wants a whole page
// to load: its text, at least, has it call the offer once it has written the alarm's words.
const pageJs = readFileSync(`${import.meta.dirname}/page.js`, 'utf8');
const written = pageJs.indexOf("$('alarm').textContent =");
assert.ok(written >= 0 && pageJs.includes("files.offer($('alarm'));", written), 'no offer made');

process.stdout.write('tools/sketch: what the pad cannot read is set aside, never written over\n');
