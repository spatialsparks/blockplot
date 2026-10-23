// The check of a plot's file (ST-030): the format `blockplot/plot`, its one reader and its
// writer, plot-file.js - with nothing running, and no plot read but made-up ones. The example,
// example/plot.json, is the site that demo-site.js gives, figure for figure and in its order of
// fields, and that site written is the file, byte for byte: the made-up plot lies in the pad's
// folder twice, and here the two are held to be one. Of the made-up plots of
// tests/__fixtures__/plots two are read, held by hand and written back byte for byte, and five
// are refused, each the smallest plot with one thing wrong. Then every sentence of the format's
// list, on files made up here, alone and before all that the list says after it; what is read
// all the same; what the writer refuses; and a plot's area. The script that a page loads of a
// plot is plot-routes.check.js's, with the key that it says. Run by check.js, as every check is.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import './demo-site.js';
import { FORMAT, VERSION, areaOf, read, write } from './plot-file.js';

assert.deepEqual([FORMAT, VERSION], ['blockplot/plot', 3]);
const here = (...parts) => path.join(import.meta.dirname, ...parts);
const fixture = (...parts) => here('..', '..', 'tests', '__fixtures__', 'plots', ...parts);
/** A file as its bytes, and what the reader makes of them. */
const taken = (file) => ({ bytes: readFileSync(file), ...read(readFileSync(file, 'utf8')) });
/** A site as the bytes of its file - none where the writer refuses it. */
const written = (site) => Buffer.from(write(site).text ?? '');
const keysOf = (site) => [Object.keys(site), Object.keys(site.ground)];
const textOf = (file) => JSON.stringify(file);

// A plot by hand. Places, two figures each; a paper - its bearing, then metres down the plot,
// across it and up; and a ground of so many rows of so many heights, each by its column and row.
const places = (...flat) => flat.flatMap((x, at) => (at % 2 === 0 ? [[x, flat[at + 1]]] : []));
const paper = (bearingDeg, xFromM, xToM, yFromM, yToM, ...sideM) => {
  return { cellM: 0.5, bearingDeg, xFromM, xToM, yFromM, yToM, sideM };
};
const rowsOf = (rows, columns, cm) =>
  Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (__, column) => cm(column, row)).join(' '),
  );
const FOR_TESTS = 'A made-up plot, for tests: no real property, no measured ground.';
const HOME = {
  name: 'Made-up orchard plot',
  officialAreaM2: 300,
  ...paper(40, -2, 22, -2, 16, 500, 512),
  outline: places(0, 0, 0, 15, 20, 15, 20, 0),
  notes: [[-1, 7, 'lane']],
  house: [5, 10],
  ground: { baseM: 500, rowsCm: rowsOf(37, 49, (column) => 800 - 5 * column) },
  credit: FOR_TESTS,
  sources: ['Outline: made up, for the tests.', 'Ground: a plane, worked out by hand.'],
};
const TERRACE = {
  name: 'Made-up terrace, by the lake / north',
  ...paper(315, 0, 30, 0, 20, 430, 446),
  outline: places(3, 2, 3, 18, 27, 18, 27, 10, 15, 2),
  notes: [],
  ground: { baseM: 430, rowsCm: rowsOf(41, 61, (column, row) => 1000 - 7.5 * column - 2.5 * row) },
  credit: FOR_TESTS,
};
// The smallest plot: a corner of 2 m², on a paper of four cells each way.
const CORNER = {
  name: 'Made-up corner',
  ...paper(0, 0, 2, 0, 2, 100, 102),
  outline: places(0, 0, 0, 2, 2, 2),
  notes: [],
  ground: { baseM: 100, rowsCm: rowsOf(5, 5, () => 100) },
  credit: FOR_TESTS,
};

// The golden files. Each is read as its site - the example's the one that the script gives, the
// two others typed in above - figure for figure and in its order of fields, and that site
// written is the file, byte for byte. By hand: its paper in cells, down the plot, across it and
// up, with a height at every grid point; its outline's own area, which `areaOf` gives; two heights.
const heightAt = ({ ground }, column, row) =>
  ground.baseM + Number(ground.rowsCm[row].split(' ')[column]) / 100;
const cellsOf = ({ cellM, sideM, ...site }) =>
  [site.xToM - site.xFromM, site.yToM - site.yFromM, sideM[1] - sideM[0]].map((m) => m / cellM);
const GOLDEN = [
  [here('example', 'plot.json'), globalThis.SITE, [92, 62, 40], 644, [0, 0, 820], [92, 62, 809.56]],
  [fixture('home', 'plot.json'), HOME, [48, 36, 24], 300, [0, 36, 508], [48, 0, 505.6]],
  [fixture('terrace', 'plot.json'), TERRACE, [60, 40, 32], 336, [10, 4, 439.15], [60, 40, 434.5]],
];
const [example, home, terrace] = GOLDEN.map(([file, site, inCells, area, ...heights]) => {
  const plot = taken(file);
  assert.equal(plot.refused, undefined, file);
  assert.deepEqual([plot.site, keysOf(plot.site)], [site, keysOf(site)], file);
  assert.ok(written(site).equals(plot.bytes) && written(plot.site).equals(plot.bytes), file);
  const { rowsCm } = plot.site.ground;
  const grid = [rowsCm.length, ...new Set(rowsCm.map((row) => row.split(' ').length))];
  assert.deepEqual([cellsOf(plot.site), grid], [inCells, [inCells[1] + 1, inCells[0] + 1]], file);
  assert.deepEqual([areaOf(plot.site), areaOf({ outline: plot.site.outline })], [area, area], file);
  for (const [column, row, m] of heights) assert.equal(heightAt(plot.site, column, row), m, file);
  return plot;
});
// Version 1's order, on the plot that says all of it - the terrace has no house and no sources.
const FIELDS = ['name', 'officialAreaM2', 'cellM', 'bearingDeg', 'xFromM', 'xToM', 'yFromM'];
FIELDS.push('yToM', 'sideM', 'outline', 'notes', 'house', 'ground', 'credit', 'sources');
assert.deepEqual(keysOf(home.site), [FIELDS, ['baseM', 'rowsCm']]);
assert.deepEqual([home.site.house, home.site.sources.length], [[5, 10], 2]);
assert.ok(!Object.hasOwn(terrace.site, 'house') && !Object.hasOwn(terrace.site, 'sources'));
// The example by hand: its name, its area, its bearing, its six corners, its two notes, and its
// ground - at each of its 63 by 93 grid points 1400 - 10 c - 2 r cm over 806 m.
const { name, officialAreaM2, bearingDeg, outline, notes } = example.site;
assert.deepEqual([name, officialAreaM2, bearingDeg], ['Made-up hillside plot', 644, 232]);
assert.deepEqual(outline, places(2, 6, 2, 23, 36, 23, 36, 9, 29, 3, 12, 3));
assert.deepEqual(notes.flat(), [-1, 14, 'road', 39, 16, 'meadow']);
const PLANE = rowsOf(63, 93, (column, row) => 1400 - 10 * column - 2 * row);
assert.deepEqual(example.site.ground, { baseM: 806, rowsCm: PLANE });
assert.deepEqual(readdirSync(here('example')).sort(), ['CLAUDE.md', 'own.check.js', 'plot.json']);
// The canonical form, by hand: so many bytes but the format's name (T-044.13: renamed) on so many
// lines, one line end at the end and no other; no BOM; a corner on four lines, a ground row on one.
const lines = example.bytes.toString().split('\n');
const besides = example.bytes.length - FORMAT.length;
assert.deepEqual([besides, lines.length - 1, lines.at(-1)], [26_914, 127, '']);
assert.ok(example.bytes[0] === 0x7b && !example.bytes.includes('\r'));
assert.deepEqual(lines.slice(0, 3), ['{', '  "format": "blockplot/plot",', '  "version": 2,']);
assert.deepEqual(lines.slice(19, 24), ['  "outline": [', '    [', '      2,', '      6', '    ],']);
assert.equal(lines.filter((line) => /^ {6}"\d+( \d+){92}",?$/.test(line)).length, 63);

// The format's list, after what is no JSON and what is no object: every sentence in its order,
// to the letter, as it is said of the smallest plot.
const NEEDED = 'Its ground lacks a height: 5 rows of 5 heights are needed, and';
const SAID = {
  format: 'It is no plot: its format is not "blockplot/plot".',
  version: 'It is a plot of version 4, and this pad reads versions 1 to 3.',
  field: 'It holds "parcelNumber", which no plot of version 1 has.',
  name: 'It has no name.',
  area: 'Its area of the land register is no area.',
  cell: 'Its cell is not half a metre: the pad draws on no other.',
  bearing: 'Its bearing is no bearing: degrees from 0 to under 360.',
  paper:
    'Its paper is none: from a metre to a larger one, in whole cells, down the plot, across it and up.',
  outline: 'It has no outline: three corners at the least, each two numbers.',
  flat: 'Its outline encloses no area.',
  notes: 'Its notes are none: each is a place and its words.',
  house: 'Its point of a house is no place.',
  ground: 'It has no ground.',
  rows: `${NEEDED} it has 4 rows.`,
  row: `${NEEDED} row 3 has 4.`,
  number: 'Its ground lacks a height: row 2 holds what is no number.',
  credit: 'It does not say where its figures came from.',
  sources: 'Its sources are none: each is a text.',
};
const [NO_JSON, NO_OBJECT] = ['It is no JSON.', "It is no plot: a plot's file is one object."];
const NOT_BACK = 'It does not read back as it was written.';

// The five that are refused, each in its sentence - and each the smallest plot, as it is
// written, with one thing of its text changed: what is changed stands in that text once.
const smallest = write(CORNER).text;
const changed = (from, to) => (smallest.split(from).length === 2 ? smallest.replace(from, to) : '');
const ROW = '      "100 100 100 100 100"';
const five = (third) => [ROW, ROW, third, ROW, ROW].join(',\n');
const [OUTLINE, CREDIT] = ['"outline": [', `"credit": ${JSON.stringify(FOR_TESTS)}`];
const REFUSED = [
  ['no-outline', SAID.outline, changed('    ],\n    [\n      2,\n      2\n    ]\n', '    ]\n')],
  ['ground-short', SAID.row, changed(five(ROW), five('      "100 100 100 100"'))],
  ['of-version-4', SAID.version, changed('"version": 1', '"version": 4')],
  ['one-field-more', SAID.field, changed(`${CREDIT}\n`, `${CREDIT},\n  "parcelNumber": "none"\n`)],
  ['no-json', NO_JSON, smallest.slice(0, smallest.indexOf(OUTLINE) + OUTLINE.length)],
];
const FOLDERS = ['home', 'terrace', ...REFUSED.map(([id]) => id)];
assert.deepEqual(readdirSync(fixture()).sort(), FOLDERS.toSorted());
for (const id of FOLDERS) assert.deepEqual(readdirSync(fixture(id)), ['plot.json']);
for (const [id, refused, text] of REFUSED) {
  const plot = taken(fixture(id, 'plot.json'));
  assert.deepEqual([plot.refused, plot.site, read(text).refused], [refused, undefined, refused]);
  assert.ok(text !== '' && Buffer.from(text).equals(plot.bytes), id);
}

// A row is a sentence of the list, a field, and what that field holds in files of which the
// sentence holds: the smallest plot's file with that one field changed - left out, where it is
// undefined. Each is refused in that sentence alone, and - the first of the list that holds -
// together with one fault of every sentence after it.
const FILE = { format: FORMAT, version: 1, ...CORNER };
const ROWS = CORNER.ground.rowsCm;
const ground = (rowsCm, more) => ({ baseM: 100, rowsCm, ...more });
const said = (...changes) => read(textOf(Object.assign({}, FILE, ...changes))).refused;
const TWO = places(0, 0, 0, 2);
const NO_NUMBER = ['100 100 x 100 100', '100 100  100 100', '1 2 3 4 Infinity', '1 2 3 4 \t'];
const NO_NUMBERS = NO_NUMBER.map((row) => ground(ROWS.with(1, row).with(3, 'a b c d e')));
const CASES = [
  ['format', 'format', 'blockplot/site', undefined, 1],
  ['version', 'version', 4],
  ['field', 'parcelNumber', 'none'],
  ['name', 'name', undefined, '', ' \t', 7],
  ['area', 'officialAreaM2', 0, -2, '2', null],
  ['cell', 'cellM', 1, undefined, '0.5'],
  ['bearing', 'bearingDeg', 360, -1, undefined, '0'],
  ['paper', 'xToM', 0, 2.25, '2'],
  ['paper', 'yFromM', 2, undefined],
  ['paper', 'sideM', [102, 100], [100, 102, 104], [100, 102.2], 100, undefined],
  ['outline', 'outline', undefined, 'none', TWO, [...TWO, [2, 2, 2]], [...TWO, [2, '2']]],
  ['outline', 'outline', [...TWO, { x: 2, y: 2 }]],
  ['flat', 'outline', places(0, 0, 1, 1, 2, 2), places(0, 0, 2, 2, 0, 0, 2, 2)],
  ['notes', 'notes', undefined, 'none', [[0, 0]], [[0, 0, 7]], [['0', 0, 'lane']]],
  ['house', 'house', [1], [1, '2'], [1, 2, 3], null],
  ['ground', 'ground', undefined, [1], 'no', ground(), ground(ROWS, { baseM: '1' }), ground('no')],
  ['ground', 'ground', ground(ROWS.with(4, 100))],
  ['rows', 'ground', ground(ROWS.slice(1))],
  ['row', 'ground', ground(ROWS.with(2, '100 100 100 100').with(3, '100'))],
  ['number', 'ground', ...NO_NUMBERS],
  ['credit', 'credit', undefined, 7, null],
  ['sources', 'sources', 'a text', ['a text', 7], null],
];
const ORDER = Object.keys(SAID);
assert.deepEqual([...new Set(CASES.map(([row]) => row))], ORDER);
const filesOf = ([row, field, ...held]) => [row, held.map((value) => ({ [field]: value }))];
const FILES = CASES.map(filesOf);
for (const [row, files] of FILES) {
  const later = FILES.filter(([other]) => ORDER.indexOf(other) > ORDER.indexOf(row));
  const after = later.map(([, [file]]) => file).toReversed();
  for (const file of files) {
    assert.equal(said(file), SAID[row], textOf(file));
    assert.equal(said(...after, file), SAID[row], textOf(file));
  }
}
// Before them all, what is no JSON and what is no object - and what is no text is no JSON.
const NONE = ['', '{', 'plot', "{'format': 1}", `${textOf(FILE)}}`, undefined, null, 7, FILE];
for (const no of NONE) assert.equal(read(no).refused, NO_JSON);
const LISTS = ['[]', 'null', '7', '"plot"', 'true', `[${textOf(FILE)}]`];
for (const no of LISTS) assert.equal(read(no).refused, NO_OBJECT);
// The version as the file writes it, and a file that writes none. The first field that no plot
// has, in the file's order: one of `ground` under that name, and a name as JSON writes it.
const versionSaid = (version) => said({ version });
const asWritten = (of) => SAID.version.replace('version 4', of);
const WRITTEN = ['version "1"', 'version 1.5', 'version null', 'no version'].map(asWritten);
assert.deepEqual(['1', 1.5, null, undefined].map(versionSaid), WRITTEN);
const holds = (field) => SAID.field.replace('"parcelNumber"', field);
const HEIGHTS = { ground: ground(ROWS, { heights: [] }) };
assert.equal(read(textOf({ first: 1, ...FILE, ...HEIGHTS, last: 2 })).refused, holds('"first"'));
for (const more of [{}, { last: 2 }]) assert.equal(said(HEIGHTS, more), holds('"ground.heights"'));
assert.equal(said({ 'a "b"': 1 }), holds(String.raw`"a \"b\""`));
assert.equal(said({ toString: 1 }), holds('"toString"'));
assert.equal(read(textOf(FILE).replace('{', '{"__proto__":{},')).refused, holds('"__proto__"'));
// Rows of the ground, counted from 1: the first of another count, an empty row, one row alone,
// none, one too many, a count before what is no number - and the made-up plot's own counts.
const lacks = (rowsCm) => said({ ground: ground(rowsCm) }).replace(`${NEEDED} `, '');
const GROUNDS = [ROWS.with(1, '1 2 3 4 5 6').with(2, '1'), ROWS.with(4, ''), ROWS.slice(4), []];
GROUNDS.push([...ROWS, ROWS[0]], ROWS.with(0, 'a b c d e').with(4, '1 2 3 4'));
const LACKING = ['row 2 has 6.', 'row 5 has 0.', 'it has 1 row.', 'it has 0 rows.'];
assert.deepEqual(GROUNDS.map(lacks), [...LACKING, 'it has 6 rows.', 'row 5 has 4.']);
const MADE_UP = { format: FORMAT, version: 2, ...globalThis.SITE };
const cut = (rowsCm) => read(textOf({ ...MADE_UP, ground: { baseM: 806, rowsCm } })).refused;
const WANTED = 'Its ground lacks a height: 63 rows of 93 heights are needed, and';
assert.equal(cut(PLANE.slice(1)), `${WANTED} it has 62 rows.`);
assert.equal(cut(PLANE.with(11, PLANE[11].slice(5))), `${WANTED} row 12 has 92.`);
// A number that JSON holds, and that is none: one too large to be finite.
const far = (change) => read(textOf({ ...FILE, ...change }).replace('"far"', '1e999')).refused;
assert.equal(far({ bearingDeg: 'far' }), SAID.bearing);
assert.equal(far({ ground: ground(ROWS, { baseM: 'far' }) }), SAID.ground);

// What is read. A file in another form - on one line, with other line ends and blanks, behind a
// byte-order mark, its fields the other way round - as its own object, and written in the table's.
const turned = Object.fromEntries(Object.entries(FILE).toReversed());
turned.ground = { rowsCm: ROWS, baseM: 100 };
const BOM = String.fromCodePoint(0xfeff);
const FORMS = [textOf(FILE), smallest.replaceAll('\n', '\r\n'), BOM + smallest, textOf(turned)];
FORMS.push(JSON.stringify(FILE, null, '\t'), smallest.replace('"version": 1', '"version": 1.0'));
for (const text of FORMS) {
  assert.deepEqual([read(text).site, written(read(text).site).toString()], [CORNER, smallest]);
}
const other = read(textOf(turned)).site;
assert.deepEqual(keysOf(other), [Object.keys(CORNER).toReversed(), ['rowsCm', 'baseM']]);
// A field that a plot may leave out, sources that are none, an outline that repeats its first
// corner, heights with decimals and under the base - and what the page says in red as it opens.
const READ = [{ officialAreaM2: 99 }, { house: [1, 1.5] }, { sources: [] }, { credit: '' }];
READ.push({ name: 'a, b / c' }, { bearingDeg: 359.9 }, { notes: [[0.5, -1, '']] });
READ.push({ outline: [...TWO, [2, 2], TWO[0]] }, { xFromM: -0.5, xToM: 1.5 });
READ.push({ ground: ground(ROWS.with(0, '9999 -250 99.5 1e2 0')) });
for (const change of READ) {
  const { site } = read(textOf({ ...FILE, ...change }));
  assert.deepEqual([site, read(write(site).text).site], [{ ...CORNER, ...change }, site]);
}

// The writer. What it gives, the reader takes: every site above. It lays the fields in the
// table's order, and changes nothing of what it was given. What the reader refuses of a text
// that holds the site - a field that no plot has - it refuses in the reader's words; what a
// file does not hold, and what is no site at all, does not read back as it was written.
const before = textOf(other);
assert.deepEqual([write(other).text, textOf(other)], [smallest, before]);
assert.deepEqual(write({ ...CORNER, parcelNumber: 'none' }), { refused: SAID.field });
assert.deepEqual(write({ ...CORNER, cellM: 1 }), { refused: SAID.cell });
assert.deepEqual(write({ ...CORNER, ground: ground(ROWS.slice(1)) }), { refused: SAID.rows });
const [holed, ring] = [places(0, 0), { ...CORNER }];
holed[2] = [2, 2];
ring.ring = ring;
const NOT_HELD = [{ bearingDeg: Number.NaN }, { bearingDeg: -0 }, { xToM: Infinity }, ring];
NOT_HELD.push({ outline: holed }, { house: undefined }, { sources: [undefined] }, { version: 3 });
const NO_SITES = NOT_HELD.map((change) => ({ ...CORNER, ...change }));
NO_SITES.push({ ...CORNER, bearingDeg: 0n }, FILE, [CORNER], [], 'plot', 7, null, undefined);
for (const no of NO_SITES) assert.deepEqual(write(no), { refused: NOT_BACK });

// A plot's area: the one it states, not rounded, and where it states none, what its outline
// encloses, either way round.
assert.deepEqual([areaOf({ ...HOME, officialAreaM2: 299.25 }), areaOf(CORNER)], [299.25, 2]);
const WEDGES = [places(0, 0, 0, 1, 1.5, 1), places(1.5, 1, 0, 1, 0, 0)];
for (const wedge of WEDGES) assert.equal(areaOf({ outline: wedge }), 0.75);

process.stdout.write(
  "tools/sketch: a plot's file is read whole or refused in one sentence, the example is the made-up site, and what is written is read back\n",
);
