// The check of a plot's file of version 3 (story ST-042): its ground as squares, read by `read`
// of plot-file.js and written by `write`, as the format says (docs/STORAGE_FORMAT.md, "The plot
// file - version 3"). The golden files of tests/__fixtures__/squares are made again here - each a
// site whose ground `squares.make` made, written by `write` - and are those files, byte for byte,
// and read and written back so. Then the sentences of version 3 to the letter and in their order,
// each on a file also wrong in every way said after it; a field of the one version in a file of
// the other; and the version that the writer writes of each kind of site. No browser, no server,
// nothing of a real plot. Run by check.js, as every check is, or alone:
//   pnpm exec node tools/sketch/plot-squares.check.js
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import './demo-site.js';
import { read, write } from './plot-file.js';

const { squares, SITE } = globalThis;
const FIXTURES = path.join(import.meta.dirname, '..', '..', 'tests', '__fixtures__', 'squares');
const golden = (name) => readFileSync(path.join(FIXTURES, `${name}.json`), 'utf8');
const FOR_TESTS = 'A made-up plot, for tests: no real property, no measured ground.';

// The smallest plot of the format, flat at 100 cm over 100 m on four cells each way, its ground
// as one square: a file of version 3 that says no place.
const FLAT = Array.from({ length: 25 }, () => 100);
const CORNER = {
  name: 'Made-up corner',
  cellM: 0.5,
  bearingDeg: 0,
  xFromM: 0,
  xToM: 2,
  yFromM: 0,
  yToM: 2,
  sideM: [100, 102],
  outline: [
    [0, 0],
    [0, 2],
    [2, 2],
  ],
  notes: [],
  ground: { baseM: 100, ...squares.make(FLAT, 4, 4) },
  credit: FOR_TESTS,
};
assert.deepEqual(CORNER.ground, {
  baseM: 100,
  squares: 'o',
  cornersCm: ['100 100', '', '', '', '100 100'],
});
// The made-up plot, its ground the plane of demo-site.js as squares: a file of version 3 that
// says its place.
const PLANE = SITE.ground.rowsCm.flatMap((line) => line.split(' ').map(Number));
const MADE_UP = { ...SITE, ground: { baseM: 806, ...squares.make(PLANE, 92, 62) } };

// Each golden file is what `write` makes of its site, byte for byte, and reads back as that site;
// what is read, written, is the file again.
assert.deepEqual(readdirSync(FIXTURES).sort(), ['corner.json', 'made-up.json']);
for (const [name, site] of [
  ['corner', CORNER],
  ['made-up', MADE_UP],
]) {
  const text = golden(name);
  assert.equal(write(site).text, text, name);
  assert.deepEqual(read(text).site, site, name);
  assert.equal(write(read(text).site).text, text, name);
  assert.ok(text.startsWith('{\n  "format": "blockplot/plot",\n  "version": 3,\n'), name);
}
const lines = golden('corner').split('\n');
assert.deepEqual([lines.length - 1, lines.at(-1)], [42, '']);
assert.deepEqual(lines.slice(29, 39), [
  '  "ground": {',
  '    "baseM": 100,',
  '    "squares": "o",',
  '    "cornersCm": [',
  '      "100 100",',
  '      "",',
  '      "",',
  '      "",',
  '      "100 100"',
  '    ]',
]);
assert.ok(golden('made-up').includes('  "originLV95": [\n    2600000,\n    1200000\n  ],\n'));

// The writer writes the oldest version that holds a site: 3 where its ground says squares, else
// 2 where it says where it lies, else 1 - so a plot of version 1 or 2 is written as it was.
const versionOf = (site) => JSON.parse(write(site).text).version;
const ROWS = Array.from({ length: 5 }, () => '100 100 100 100 100');
const ROWED = { ...CORNER, ground: { baseM: 100, rowsCm: ROWS } };
const PLACED = { originLV95: [2_600_000, 1_200_000] };
assert.deepEqual([versionOf(CORNER), versionOf({ ...CORNER, ...PLACED })], [3, 3]);
assert.deepEqual([versionOf(ROWED), versionOf({ ...ROWED, ...PLACED })], [1, 2]);
assert.equal(versionOf(SITE), 2);

// The sentences of version 3, in their order: each said of the smallest plot of version 3 with
// one thing wrong, and with every fault after it too - a credit and sources that are none.
const LACKS = 'Its ground lacks a height:';
const SAID = {
  version: 'It is a plot of version 4, and this pad reads versions 1 to 3.',
  rowsCm: 'It holds "ground.rowsCm", which no plot of version 3 has.',
  squares: 'It holds "ground.squares", which no plot of version 2 has.',
  ground: 'It has no ground.',
  tree: "Its ground's squares are no tree of its paper.",
  rows: `${LACKS} 5 rows of corners are needed, and it has 4 rows.`,
  row: `${LACKS} row 3 has 0 corners of squares, and 1 height.`,
  number: `${LACKS} row 5 holds what is no number.`,
  credit: 'It does not say where its figures came from.',
};
const fileOf = (version, change, ground) => {
  const site = { ...CORNER, ...change, ground: { ...CORNER.ground, ...ground } };
  return JSON.stringify({ format: 'blockplot/plot', version, ...site });
};
const WORSE = { credit: 7, sources: 'none' };
const said = (version, ground, change = WORSE) => read(fileOf(version, change, ground)).refused;
const NO_TREE = { squares: '+oooo+', cornersCm: ['1 2', '', '', ''] };
assert.equal(said(4, { rowsCm: ROWS, squares: 'x' }, { ...WORSE, name: '' }), SAID.version);
assert.equal(said(3, { rowsCm: ROWS, ...NO_TREE }, { ...WORSE, cellM: 1 }), SAID.rowsCm);
assert.equal(said(2, { rowsCm: ROWS, squares: 'o' }, { ...WORSE, name: '' }), SAID.squares);
for (const ground of [{ baseM: '100' }, { squares: 7 }, { cornersCm: 'o' }, { cornersCm: [1] }]) {
  assert.equal(said(3, { ...NO_TREE, ...ground }), SAID.ground, JSON.stringify(ground));
}
assert.equal(read(fileOf(3, WORSE, {}).replace(/"ground":\{[^}]*\},/, '')).refused, SAID.ground);
assert.equal(said(3, NO_TREE), SAID.tree);
assert.equal(said(3, { cornersCm: ['1 2', '', '7', 'x'] }), SAID.rows);
assert.equal(said(3, { cornersCm: ['1 2', '', '7', '', '1 x'] }), SAID.row);
assert.equal(said(3, { cornersCm: ['1 2', '', '', '', '1 x'] }), SAID.number);
assert.equal(said(3, {}, { credit: 7 }), SAID.credit);
// What `write` refuses of a site whose ground is no tree, it refuses in the reader's words.
assert.deepEqual(write({ ...CORNER, ground: { ...CORNER.ground, squares: '+' } }), {
  refused: SAID.tree,
});

process.stdout.write(
  "tools/sketch: a plot's file of version 3 keeps its ground as squares, is read and written back byte for byte, and is refused in its sentences in their order\n",
);
