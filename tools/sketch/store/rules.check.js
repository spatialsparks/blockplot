// The check of the browser's store of plots (ST-040, T-040.1): every rule of rules.js, by hand -
// its names and values, the keys of a plot's sketch, the plot to show, the id of a folder and of
// a file, a held plot's record, the two orders, a folder's sketches and the day. And of the text:
// no module of the store asks a machine, held.js takes nothing away, and plot-file.js and the
// four modules it loads, squares.js among them, import nothing of Node - so a page loads them -
// with the equality that took the place of Node's holding what Node's held. Run by check.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import vm from 'node:vm';
import { read, write } from '../plot-file.js';
import * as rules from './rules.js';

const { BASE, BASE_VERSION, PLOTS, KEPT, STORES, TAB, LAST, WAYS, REFUSED } = rules;
const { keyOf, shownOf, folderId, fileId, recordOf, heldOrder, keptOrder } = rules;
const { sketchesOf, fileOf, dayOf } = rules;
const here = import.meta.dirname;
const pad = path.join(here, '..');

// The names and their values.
assert.deepEqual([BASE, BASE_VERSION, PLOTS, KEPT], ['blockplot', 1, 'plots', 'kept']);
assert.deepEqual(STORES, {
  plots: { keyPath: 'id' },
  kept: { keyPath: ['plot', 'name'], index: 'plot' },
});
assert.deepEqual([TAB, LAST], ['blockplot/plot/tab', 'blockplot/plot/last']);
assert.deepEqual(WAYS, { folder: 'folder', file: 'file', example: 'example' });
assert.deepEqual(REFUSED, {
  name: 'Its folder has a name that the pad does not take.',
  file: 'It holds no plot.json.',
});
// The names moved in from routes.js as Keep left the server (T-040.5); the rule of a kept
// sketch's name, and so of a plot's folder, is kept.check.js's.
const { EXAMPLE, OWN, SPACE, KEPT_ENDING, KEPT_NAME_MAX, plotName, keptName } = rules;
assert.deepEqual([EXAMPLE, OWN, SPACE], ['example', 'home', 'blockplot/sketch/space']);
assert.deepEqual(
  [KEPT_ENDING, KEPT_NAME_MAX, plotName('a (1)'), plotName('My plot')],
  ['.json', 80, false, true],
);
assert.ok(
  ['', 'a/b', 'Küche', 'plan', 'n'.repeat(81)].every((one) => plotName(one) === keptName(one)),
);

// The key of a plot's sketch: the first key for home alone, the example's its own.
assert.deepEqual(['home', 'example', 'terrace', 'My plot'].map(keyOf), [
  'blockplot/sketch/space',
  'blockplot/sketch/plot/example/space',
  'blockplot/sketch/plot/terrace/space',
  'blockplot/sketch/plot/My plot/space',
]);

// The plot to show: the tab's note, else the last, else none. A note that is none, empty or no
// text is none - nine pairs of none, empty and an id, and two that are no text.
const NOTES = [null, '', 'id'];
const shown = NOTES.flatMap((tab) => NOTES.map((last) => shownOf(tab && `${tab}-tab`, last)));
assert.deepEqual(shown, [null, null, 'id', null, null, 'id', 'id-tab', 'id-tab', 'id-tab']);
assert.deepEqual([shownOf(7, 'terrace'), shownOf(undefined, ['home'])], ['terrace', null]);

// A folder's id is its name, where the rule of an id takes it and it is not the example's.
const FOLDERS = ['home', 'Terrace', 'My plot', 'a (1)', 'example', 'Example', ''];
FOLDERS.push('a'.repeat(80), 'a'.repeat(81));
const no = { refused: REFUSED.name };
assert.deepEqual(FOLDERS.map(folderId), [
  { id: 'home' },
  { id: 'Terrace' },
  { id: 'My plot' },
  no,
  no,
  no,
  no,
  { id: 'a'.repeat(80) },
  no,
]);

// A file's id: a held plot of this very text is that plot, whatever the name says; else what
// New plot gives the name - never home or example, -2 and on where taken.
const HELD = [
  { id: 'home', text: 'A' },
  { id: 'terrace', text: 'B' },
];
assert.equal(fileId('A', 'Terrace', HELD), 'home');
assert.equal(fileId('B', 'home', HELD), 'terrace');
assert.equal(fileId('C', 'Terrace', HELD), 'Terrace-2');
assert.equal(fileId('C', 'terrace', [...HELD, { id: 'terrace-2', text: 'D' }]), 'terrace-3');
assert.equal(fileId('C', 'Home', []), 'Home-2');
assert.equal(fileId('C', ' example. ', []), 'example-2');
assert.equal(fileId('C', 'Hügel am Hang', []), 'Hugel am Hang');
assert.equal(fileId('A', '', []), 'plot');

// A held plot's record, field by field and in order: an area stated, and one its outline
// encloses - 4 m by 3 m, 12 m2. No folder is null.
const site = { name: 'Terrace', officialAreaM2: 612.5, outline: [] };
const handle = { kind: 'directory', name: 'terrace' };
const record = recordOf({
  id: 'terrace',
  site,
  text: 'T',
  way: 'folder',
  folder: handle,
  day: 'd',
});
assert.deepEqual(Object.keys(record), ['id', 'name', 'areaM2', 'text', 'way', 'folder', 'opened']);
assert.deepEqual(Object.values(record), ['terrace', 'Terrace', 612.5, 'T', 'folder', handle, 'd']);
assert.equal(record.folder, handle);
const square = {
  name: 'Square',
  outline: [
    [0, 0],
    [4, 0],
    [4, 3],
    [0, 3],
  ],
};
const filed = recordOf({ id: 'Square', site: square, text: 'S', way: 'file', day: '2026-10-20' });
assert.deepEqual(filed, {
  id: 'Square',
  name: 'Square',
  areaM2: 12,
  text: 'S',
  way: 'file',
  folder: null,
  opened: '2026-10-20',
});

// The two orders, over ties, and neither changes what it is given.
const records = [
  { id: 'b', opened: '2026-10-19' },
  { id: 'c', opened: '2026-10-20' },
  { id: 'a', opened: '2026-10-20' },
  { id: 'A', opened: '2026-10-19' },
  { id: 'z', opened: '2025-12-31' },
];
const ids = (list) => list.map((one) => one.id ?? one.name);
assert.deepEqual(ids(heldOrder(records)), ['a', 'c', 'A', 'b', 'z']);
assert.deepEqual(ids(records), ['b', 'c', 'a', 'A', 'z']);
const sketches = [
  { name: 'a', at: 1000 },
  { name: 'B', at: 1000 },
  { name: 'old', at: 5 },
  { name: 'b', at: 1000 },
  { name: 'new', at: 2000 },
];
assert.deepEqual(ids(keptOrder(sketches)), ['new', 'b', 'a', 'B', 'old']);
assert.deepEqual(ids(sketches), ['a', 'B', 'old', 'b', 'new']);

// A folder's sketches: a name the rule takes is listed, one it refuses counted, and another
// ending is neither.
const FILES = ['plan.json', 'Plan B.json', '.hidden.json', 'a (1).json', 'notes.txt', 'x.JSON'];
FILES.push(`${'a'.repeat(81)}.json`, '.json');
assert.deepEqual(sketchesOf(FILES), { names: ['plan', 'Plan B'], other: 4 });
assert.deepEqual(sketchesOf([]), { names: [], other: 0 });
assert.equal(fileOf('Plan B'), 'Plan B.json');

// The day, in local time: just before and just after midnight, and at a year's turn.
const moments = [
  new Date(2026, 9, 20, 23, 59, 59, 999),
  new Date(2026, 9, 21, 0, 0, 0, 0),
  new Date(2025, 11, 31, 23, 59, 59, 999),
  new Date(2026, 0, 1, 0, 0, 0, 0),
];
assert.deepEqual(moments.map(dayOf), ['2026-10-20', '2026-10-21', '2025-12-31', '2026-01-01']);

// Of the text. A module of the store names no way to ask a machine; held.js no way to take
// anything away. Each rule is proven to find what it is for: one that matches nothing passes for
// ever (directive 9). The checks are left out: this one names the words. Of the five ways to ask,
// the pad's scripts may say `fetch(` in four files, and none of them here: the store says the
// word nowhere, not even without its bracket. The four others no file of the pad says - not
// this one either - and swisstopo/named.check.js holds that over every file of this folder.
const ASKS = /\bfetch\b/;
const TAKES = /\b(?:delete|clear|deleteDatabase)\b/;
assert.deepEqual(
  ['globalThis.fetch(url)', 'const { fetch } = globalThis;', 'fetched', 'prefetch(u)'].map((text) =>
    ASKS.test(text),
  ),
  [true, true, false, false],
);
assert.deepEqual(
  ['store.delete(id)', 'store.clear()', 'indexedDB.deleteDatabase(n)', 'deleted'].map((text) =>
    TAKES.test(text),
  ),
  [true, true, true, false],
);
const modules = fs.readdirSync(here).filter((name) => /^[^.]+\.js$/.test(name));
assert.deepEqual(modules.toSorted(), ['held.js', 'rules.js', 'ways.js']);
const textOf = (file) => fs.readFileSync(path.join(here, file), 'utf8');
for (const name of modules) assert.ok(!ASKS.test(textOf(name)), `store/${name} asks a machine`);
assert.ok(!TAKES.test(textOf('held.js')), 'store/held.js takes something away');

// plot-file.js and what it loads, and the store's own modules, import nothing of Node: every
// module they name, found where it is written, is the pad's own.
const IMPORT = /(?:\bfrom|\bimport)\s*\(?\s*(['"])([^'"]+)\1/g;
const imports = (text) => [...text.matchAll(IMPORT)].map(([, , from]) => from);
assert.deepEqual(imports("import a from 'node:fs';\nimport('node:vm');\nimport './b.js';"), [
  'node:fs',
  'node:vm',
  './b.js',
]);
const LOADED = {
  'plot-file.js': ['./new-plot/frame.js', './squares.js'],
  'squares.js': [],
  'new-plot/frame.js': ['./request.js'],
  'new-plot/request.js': [],
  'routes.js': [],
  'store/rules.js': ['../new-plot/request.js', '../plot-file.js'],
  'store/held.js': ['./rules.js'],
  'store/ways.js': ['../routes.js', './rules.js'],
};
for (const [file, from] of Object.entries(LOADED)) {
  assert.deepEqual(imports(fs.readFileSync(path.join(pad, file), 'utf8')), from, file);
}

// The equality that took the place of Node's in `write`: what it held, it holds. A site writes
// back whatever the order of its keys; one of another context, one with a date for a text, one
// with a key that JSON drops and one of no prototype do not read back.
const example = fs.readFileSync(path.join(pad, 'example', 'plot.json'), 'utf8');
const ground = read(example).site;
const NOT_BACK = { refused: 'It does not read back as it was written.' };
assert.equal(write(ground).text, example);
assert.equal(write(Object.fromEntries(Object.entries(ground).toReversed())).text, example);
const foreign = vm.runInNewContext('JSON.parse(text)', { text: JSON.stringify(ground) });
const NOT_HELD = [foreign, { ...ground, credit: new Date(0) }, { ...ground, [Symbol('a')]: 1 }];
NOT_HELD.push(Object.assign(Object.create(null), ground));
for (const no of NOT_HELD) assert.deepEqual(write(no), NOT_BACK);

process.stdout.write(
  "tools/sketch: the browser's store has its names, its keys and its rules, asks no machine and takes nothing away, and a plot's file is read with nothing of Node\n",
);
