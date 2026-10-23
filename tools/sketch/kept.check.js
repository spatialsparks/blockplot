// The check of the kept sketches (ST-025, ST-040 T-040.5), with no browser and no server. First
// the rule of a name, `keptName` of store/rules.js: every kind of name a kept sketch can have and
// every kind it cannot - and kept-ways.js's rule, stated a second time for the page, says the
// same of each. Then kept-ways.js, the first half of Keep and Open kept, on made-up stores: each
// sentence to the letter, of a folder that lets the page write, of a name taken there, of a
// folder that does not, of the browser, of the browser's no to keeping what it holds; the list's
// order and what it does not list; and a kept sketch opened as "Open file" opens a file - the
// golden files of every version the pad wrote among them (the story's Rule 4) - with Undo.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import process from 'node:process';
import { BEFORE, VERSION, asNow, golden } from './check-golden.js';
import { KEPT_ENDING, KEPT_NAME_MAX, keptName, keptOrder } from './store/rules.js';

// The rule for a name: each kind it takes, and each it refuses.
const LONGEST = 'n'.repeat(KEPT_NAME_MAX);
const NAMES = ['plan', 'Plan B', '2026-10-10 14.30.05', 'a', '7', '_', '-x', 'a_b-c', 'a.b.c'];
NAMES.push('ends.', 'two  blanks', 'plan.json', 'CON', LONGEST);
const NO_NAMES = {
  'a slash': ['a/b', '/a', 'a/', '/'],
  'a backslash': ['a\\b', '\\a', '..\\a'],
  'two dots, or a dot at its start': ['..', '.', '...', '.hidden', '../a'],
  'an encoded one': ['%2e%2e', 'a%2fb', 'a%5cb', '%2Fa', 'a%20b', 'a%00', 'a%2eb', 'pl%61n'],
  'nothing in it, or a blank at an end': ['', ' ', '   ', ' a', 'a ', ' a '],
  'one of 81': [`${LONGEST}n`],
  'another letter': ['Küche', 'ſ', 'ı', 'é'],
  'another sign': ['a:b', 'a*b', 'a?b', 'a"b', 'a<b', 'a|b', 'a,b', 'a (1)', 'a\nb', 'a\tb'],
};
const REFUSED = Object.values(NO_NAMES).flat();
assert.deepEqual([KEPT_NAME_MAX, KEPT_ENDING], [80, '.json']);
for (const name of NAMES) assert.ok(keptName(name), name);
for (const name of REFUSED) assert.ok(!keptName(name), JSON.stringify(name));
for (const no of [undefined, null, 7, ['plan']]) assert.ok(!keptName(no), 'what is no text');

// The page's scripts that Open kept needs, on a made-up store and page: the sketch, and how a
// sketch of before is read. kept-ways.js imports nothing and is handed what it asks.
const local = { held: new Map(), getItem: (key) => local.held.get(key) ?? null };
local.setItem = (key, text) => local.held.set(key, text);
const session = { getItem: () => null, setItem() {} };
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
const page = new Proxy(() => page, { get: () => page, set: () => true });
Object.assign(globalThis, { document: page, location: { hash: '', protocol: 'http:' } });
for (const file of ['demo-site', 'paper', 'figures', 'shapes', 'categories', 'blocks', 'legacy'])
  await import(`./${file}.js`);
await import('./kept-ways.js');
const { says, RULE, refusal, offered, where, keep, list, open } = globalThis.keptWays;
const split = (name) => (refusal(name) === '') !== keptName(name);
assert.deepEqual([...NAMES, ...REFUSED].filter(split), [], 'the two rules differ');
assert.equal(refusal(''), 'Nothing was kept: give the sketch a name.');
assert.equal(
  refusal('a/b'),
  `Nothing was kept: "a/b" cannot be the name of a kept sketch. ${RULE}`,
);
assert.equal(
  RULE,
  'A name is letters of the English alphabet, figures, spaces, dots, - and _: 80 at most, and no dot at its start.',
);
assert.equal(offered(new Date(2026, 0, 5, 7, 8, 9)), '2026-01-05 07.08.09');

// A made-up plot - `terrace` as its folder, or `id` of another way - and the store's two modules
// over maps: the folder's sketches/ and the browser's. `asked` counts what each was asked.
let moment = 1000;
function madeUp({ way = 'folder', id = 'terrace', write = true, persists = false, read = true }) {
  const [inFolder, inBrowser, asked] = [new Map(), new Map(), []];
  const handle = { name: 'terrace' };
  const record = way === 'folder' ? { id, way, folder: handle } : { id, way, folder: null };
  const held = {
    plot: async (one) => (asked.push(`plot ${one}`), one === id ? record : null),
    keep: async (plot, name, text) => {
      asked.push(`keep ${plot}`);
      const key = `${plot}/${name}`;
      if (inBrowser.has(key)) return { taken: true };
      inBrowser.set(key, { plot, name, text, at: (moment += 1) });
      return { kept: true };
    },
    kept: async (plot) =>
      keptOrder(
        [...inBrowser.values()]
          .filter((one) => one.plot === plot)
          .map(({ name, at }) => ({ name, at })),
      ),
    keptText: async (plot, name) => inBrowser.get(`${plot}/${name}`)?.text ?? null,
    persist: async () => (asked.push('persist'), persists),
  };
  let leave = write;
  const ways = {
    mayWrite: async (one) => {
      asked.push(`may ${one.name}`);
      read ||= leave;
      return leave;
    },
    keepIn: async (_, name, text) => {
      if (inFolder.has(name)) return { taken: true };
      inFolder.set(name, { text, at: (moment += 1) });
      return { kept: true };
    },
    keptIn: async () => {
      if (!read)
        throw Object.assign(new Error('The request is not allowed.'), { name: 'NotAllowedError' });
      const names = [...inFolder.keys()].filter(keptName);
      const kept = keptOrder(names.map((name) => ({ name, at: inFolder.get(name).at })));
      return { kept, other: inFolder.size - names.length };
    },
    keptTextIn: async (_, name) => inFolder.get(name)?.text ?? null,
  };
  const withdraw = () => (leave = false);
  return { at: { plot: { id, way }, held, ways }, inFolder, inBrowser, asked, withdraw };
}
const BROWSER = 'in this browser only — save a file to keep a copy';
const NO_ROOM = 'This browser may clear it when it is short of room.';
const TAKEN = (name) =>
  `"${name}" is taken: a sketch is kept under that name, and nothing was written. Give this one another name.`;

// WHERE, said under the field before a name is given.
assert.equal(await where(madeUp({}).at), 'Sketches of this plot are kept in the folder terrace.');
for (const way of ['file', 'example'])
  assert.equal(await where(madeUp({ way }).at), `Sketches of this plot are kept ${BROWSER}.`);

// A FOLDER THAT LETS THE PAGE WRITE: the bytes there, as handed; the name taken there writes
// nothing; the browser holds none of them, and is not asked to keep what it holds.
const folder = madeUp({});
assert.deepEqual(await keep('plan', '{"a":1}', folder.at), {
  kept: true,
  words: 'Kept in the folder terrace: sketches/plan.json',
});
assert.deepEqual(await keep('plan', '{"b":2}', folder.at), { kept: false, words: TAKEN('plan') });
assert.equal(folder.inFolder.get('plan').text, '{"a":1}');
assert.deepEqual([folder.inBrowser.size, folder.asked.includes('persist')], [0, false]);
assert.deepEqual(folder.asked, ['plot terrace', 'may terrace', 'plot terrace', 'may terrace']);

// A FOLDER THAT MAY NOT BE WRITTEN TO: asked, refused, kept in the browser and said so - with
// the browser's no, as it is the plot's first sketch there - and the second time without it.
folder.withdraw();
const refusedTo = `The folder terrace may not be written to, so this sketch is kept ${BROWSER}.`;
assert.deepEqual(await keep('plan', '{"c":3}', folder.at), {
  kept: true,
  words: `${refusedTo} ${NO_ROOM}`,
});
assert.deepEqual(await keep('second', '{"d":4}', folder.at), { kept: true, words: refusedTo });
assert.deepEqual(await keep('second', '{"e":5}', folder.at), {
  kept: false,
  words: TAKEN('second'),
});
assert.equal(folder.asked.filter((one) => one === 'persist').length, 1);
assert.deepEqual(
  [...folder.inFolder.keys(), folder.inBrowser.get('terrace/plan').text],
  ['plan', '{"c":3}'],
);

// EVERY OTHER PLOT keeps in the browser, by its id: the browser's no said with the first, a yes
// not said, a browser that does not answer taken for a no.
for (const id of ['example', 'home', 'My plot']) {
  const other = madeUp({ way: id === 'example' ? 'example' : 'file', id });
  const first = { kept: true, words: `Kept ${BROWSER}. ${NO_ROOM}` };
  assert.deepEqual(await keep('plan', 'x', other.at), first, id);
  assert.deepEqual(await keep('plan b', 'y', other.at), { kept: true, words: `Kept ${BROWSER}.` });
  assert.deepEqual([...other.inBrowser.keys()], [`${id}/plan`, `${id}/plan b`]);
  assert.ok(!other.asked.some((one) => one.startsWith('may')), id);
}
const lasting = madeUp({ way: 'file', persists: true });
assert.deepEqual(await keep('plan', 'x', lasting.at), { kept: true, words: `Kept ${BROWSER}.` });
const silent = madeUp({ way: 'file' });
silent.at.held.persist = () => Promise.reject(new Error('no answer'));
assert.equal((await keep('plan', 'x', silent.at)).words, `Kept ${BROWSER}. ${NO_ROOM}`);

// A name that is none is refused before anything is asked; a store that fails says why.
const asksNone = madeUp({ way: 'file' });
for (const name of REFUSED) assert.equal((await keep(name, 'x', asksNone.at)).words, refusal(name));
assert.deepEqual(asksNone.asked, []);
const broken = madeUp({ way: 'file' });
broken.at.held.keep = () => Promise.reject(new Error('The disk is full.'));
broken.at.held.kept = broken.at.held.keep;
assert.deepEqual(await keep('plan', 'x', broken.at), {
  kept: false,
  words: 'Nothing was kept: The disk is full.',
});
assert.deepEqual(await list(broken.at), {
  kept: null,
  folder: null,
  words: 'The kept sketches could not be listed: The disk is full.',
});

// THE LIST: the folder's first, the newest first and of one moment the later name, then the
// browser's; what ends in .json under a name the pad does not take is counted, not listed.
const PICK =
  'The newest first. The one you pick takes the place of the sketch that is open: Undo brings that one back.';
assert.deepEqual(await list(madeUp({}).at), {
  kept: [],
  folder: 'terrace',
  words: 'Nothing is kept yet.',
});
folder.inFolder.set('Küche', { text: 'x', at: 1 });
folder.inFolder.set('a b', { text: 'x', at: folder.inFolder.get('plan').at });
const listed = await list(folder.at);
const ORDER = [
  ['plan', 'folder'],
  ['a b', 'folder'],
  ['second', 'browser'],
  ['plan', 'browser'],
];
assert.deepEqual(
  listed.kept.map(({ name, where: lies }) => [name, lies]),
  ORDER,
);
const unlisted = 'Not listed: 1 of the files there, under a name the pad does not take.';
assert.deepEqual([listed.folder, listed.words], ['terrace', `${PICK} ${unlisted} ${RULE}`]);
const ofFile = madeUp({ way: 'file' });
await keep('one', 'x', ofFile.at);
await keep('two', 'y', ofFile.at);
const fileList = await list(ofFile.at);
assert.deepEqual(
  fileList.kept.map(({ name }) => name),
  ['two', 'one'],
);
assert.deepEqual([fileList.folder, fileList.words], [null, PICK]);
// A folder the browser will not let the page read is asked for leave; refused, the browser's
// sketches alone are listed, and that is said.
const unread = madeUp({ write: false, read: false });
await keep('mine', 'x', unread.at);
assert.deepEqual(await list(unread.at), {
  kept: [{ name: 'mine', at: moment, where: 'browser' }],
  folder: 'terrace',
  words: `The folder terrace may not be read, so the sketches kept in this browser alone are listed. ${PICK}`,
});
const granted = madeUp({ read: false });
granted.inFolder.set('theirs', { text: 'x', at: 1 });
assert.deepEqual((await list(granted.at)).kept, [{ name: 'theirs', at: 1, where: 'folder' }]);
assert.deepEqual(granted.asked, ['plot terrace', 'may terrace']);

// OPENED as "Open file" opens a file: a sketch takes the place of the one there, of whatever
// version the pad wrote - as the pad of now writes it - an old one of one view adds its box,
// and what is none, or is not there, is refused in words. Undo brings back what was.
const HOUSE = golden('made-up');
const sheet = { name: 'Level 817 m', level: 817, blocks: [[20, 14, 32, 26, 3]], lines: [] };
const added = JSON.parse(HOUSE);
added.things.push({ x: [20, 32], y: [14, 26], z: [12, 18], colour: 3 });
const CASES = [
  [
    'one view',
    JSON.stringify({ view: 'top', current: 0, sheets: [{ ...sheet, labels: [] }] }),
    JSON.stringify(added),
  ],
  ['no sketch', '{"space":7,"things":"none","floors":[],"notes":[]}', null],
  ['no JSON', 'not JSON', null],
];
for (const version of [...BEFORE, VERSION]) {
  for (const name of ['made-up', 'every-part']) {
    const now = version === VERSION ? golden(name) : asNow(name, version);
    CASES.push([`${name} ${version}`, golden(name, version), now]);
  }
}
let loads = 0;
for (const [name, text, after] of CASES) {
  for (const lies of ['folder', 'browser']) {
    local.held.clear();
    local.held.set('blockplot/sketch/space', HOUSE);
    await import(`./sketch.js?${(loads += 1)}`);
    const { sketch, legacy } = globalThis;
    const kept = madeUp({});
    if (lies === 'folder') kept.inFolder.set(name, { text, at: 1 });
    else kept.inBrowser.set(`terrace/${name}`, { plot: 'terrace', name, text, at: 1 });
    const why = await open({ name, where: lies }, { ...kept.at, sketch, legacy });
    const says = after === null ? `"${name}.json" is not a sketch: nothing was changed.` : '';
    assert.deepEqual([why, JSON.stringify(sketch.doc)], [says, after ?? HOUSE], `${name}, ${lies}`);
    const step = after === null || after === HOUSE ? [] : [HOUSE];
    assert.ok(JSON.stringify(sketch.past) === JSON.stringify(step), `the step of ${name}`);
    // Kept again as kept.js keeps it: the bytes as the pad of now writes them - a golden file of
    // the version it writes, byte for byte - into the folder, or, its leave withdrawn, the browser.
    if (lies === 'browser') kept.withdraw();
    await keep('again', JSON.stringify(sketch.doc), kept.at);
    const back =
      lies === 'folder' ? kept.inFolder.get('again') : kept.inBrowser.get('terrace/again');
    assert.ok(back?.text === (after ?? HOUSE), `${name} kept again, ${lies}`);
    sketch.step(sketch.past, sketch.future);
    assert.equal(JSON.stringify(sketch.doc), HOUSE, `Undo, after ${name} was opened`);
    const gone = await open({ name: 'nowhere', where: lies }, { ...kept.at, sketch, legacy });
    assert.equal(gone, '"nowhere" was not opened: no sketch is kept under that name.');
  }
}
assert.equal(says.gone, 'no sketch is kept under that name.');

// Of the text: the window asks no machine, and Keep keeps what "Save file" saves (files.js).
const text = (file) => fs.readFileSync(`${import.meta.dirname}/${file}`, 'utf8');
for (const file of ['kept.js', 'kept-ways.js']) assert.ok(!/\bfetch\b/.test(text(file)), file);
assert.ok(
  text('files.js').includes("new Blob([JSON.stringify(sketch.doc)], { type: 'application/json' })"),
);
assert.ok(
  text('kept.js').includes('keptWays.keep(name, JSON.stringify(sketch.doc), await store())'),
);
process.stdout.write(
  "tools/sketch: a sketch is kept once, as it is, in its plot's folder or in this browser, and said where\n",
);
