// The check of where a plot lies (ST-016, T-016.2): `originLV95` of a plot's file, the field that
// version 2 added - where x = 0, y = 0 of the plot's frame lies in LV95. With nothing running, and
// no plot read but made-up ones. A site that says it is written as version 2, the field after
// `bearingDeg`, and read back as it was; one that does not, as version 1, as before; a file of
// version 2 that does not say it is read, and written as version 1; a file of version 1 that says
// it holds a field too many. Each place that is no place of LV95 is refused in its sentence, after
// the bearing and before the paper. And the made-up plot says the zero of the Swiss grid, in the
// script and in its file. Run by check.js, as every check is.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import './demo-site.js';
import { read, write } from './plot-file.js';

const NO_PLACE =
  'Its place in LV95 is none: an east of 2 000 000 to under 3 000 000 and a north of 1 000 000 to under 2 000 000, in metres.';
const NOT_BACK = 'It does not read back as it was written.';
const BERN = [2_600_000, 1_200_000];

// The smallest plot of plot-file.check.js: a corner of 2 m², on a paper of four cells each way.
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
  ground: { baseM: 100, rowsCm: Array.from({ length: 5 }, () => '100 100 100 100 100') },
  credit: 'A made-up plot, for tests: no real property, no measured ground.',
};
/** The corner with its place, the field in the table's order: after the bearing. */
const { name, cellM, bearingDeg, ...paper } = CORNER;
const PLACED = { name, cellM, bearingDeg, originLV95: BERN, ...paper };
const fileOf = (version, site) => JSON.stringify({ format: 'blockplot/plot', version, ...site });

// Written: a site that says where it lies is version 2, its place after its bearing, two figures
// on lines of their own - whatever order it was handed over in - and is read back as it was.
const placed = write({ originLV95: BERN, ...CORNER }).text;
assert.ok(placed.startsWith('{\n  "format": "blockplot/plot",\n  "version": 2,\n'), placed);
const FRAME =
  '  "bearingDeg": 0,\n  "originLV95": [\n    2600000,\n    1200000\n  ],\n  "xFromM": 0,\n';
assert.ok(placed.includes(FRAME), placed);
assert.deepEqual(read(placed).site, PLACED);
assert.deepEqual(Object.keys(read(placed).site), Object.keys(PLACED));
// One that does not is version 1, the text it was before version 2: that text with the place
// taken out and its version alone changed.
const smallest = write(CORNER).text;
assert.ok(smallest.startsWith('{\n  "format": "blockplot/plot",\n  "version": 1,\n'));
const without = FRAME.replace('  "originLV95": [\n    2600000,\n    1200000\n  ],\n', '');
assert.equal(smallest, placed.replace(FRAME, without).replace('"version": 2', '"version": 1'));
// A file of version 2 that says no place is read, and written as version 1.
assert.deepEqual(read(fileOf(2, CORNER)).site, CORNER);
assert.equal(write(read(fileOf(2, CORNER)).site).text, smallest);
// A file of version 1 that says a place holds a field too many, in the file's own version; a
// field that no plot has, in a file of version 2, is said in version 2.
const holds = (field, version) => `It holds "${field}", which no plot of version ${version} has.`;
assert.equal(read(fileOf(1, PLACED)).refused, holds('originLV95', 1));
assert.equal(
  read(fileOf(2, { ...PLACED, parcelNumber: 'none' })).refused,
  holds('parcelNumber', 2),
);

// What is no place of LV95: of LV03's figures, one figure, three, a text, null, and the edges -
// an east of 3 000 000, a north of 2 000 000, a figure under the least. Each is refused in its
// sentence by the reader, and by the writer in the reader's words.
const NONE = [[600_000, 200_000], [2_600_000], [...BERN, 500], ['2600000', 1_200_000], null];
NONE.push([3_000_000, 1_200_000], [2_600_000, 2_000_000], [1_999_999.99, 1_200_000], 'Bern');
NONE.push([2_600_000, 999_999.99], { east: 2_600_000, north: 1_200_000 });
for (const place of NONE) {
  const site = { ...CORNER, originLV95: place };
  assert.equal(read(fileOf(2, site)).refused, NO_PLACE, JSON.stringify(place));
  assert.deepEqual(write(site), { refused: NO_PLACE }, JSON.stringify(place));
}
// What JSON cannot hold does not read back as it was written: a place that is not a number.
for (const place of [
  [2_600_000, Number.NaN],
  [Infinity, 1_200_000],
  [2_600_000, undefined],
]) {
  assert.deepEqual(write({ ...CORNER, originLV95: place }), { refused: NOT_BACK });
}
// The edges that are places: the least of each, and the most to the centimetre.
for (const place of [
  [2_000_000, 1_000_000],
  [2_999_999.99, 1_999_999.99],
  [2_600_020, 1_200_010],
]) {
  const site = { ...CORNER, originLV95: place };
  assert.deepEqual(read(write(site).text).site, { ...PLACED, originLV95: place });
}

// The order: a bearing that is none is said before a place that is none, and a place that is
// none before a paper that is none - and a version that is none, or a field too many, before all.
const BEARING = 'Its bearing is no bearing: degrees from 0 to under 360.';
const PAPER =
  'Its paper is none: from a metre to a larger one, in whole cells, down the plot, across it and up.';
const nowhere = { ...CORNER, originLV95: [600_000, 200_000] };
assert.equal(read(fileOf(2, { ...nowhere, bearingDeg: 360 })).refused, BEARING);
assert.equal(read(fileOf(2, { ...nowhere, xToM: 0 })).refused, NO_PLACE);
assert.equal(read(fileOf(2, { ...CORNER, xToM: 0 })).refused, PAPER);
const VERSION_4 = 'It is a plot of version 4, and this pad reads versions 1 to 3.';
assert.equal(read(fileOf(4, nowhere)).refused, VERSION_4);
assert.equal(read(fileOf(1, { ...nowhere, bearingDeg: 360 })).refused, holds('originLV95', 1));

// The made-up plot says the zero of the Swiss grid, the old observatory of Bern: in the script,
// and in its file - which plot-file.check.js holds to be the site that the script gives - after
// its bearing, in a file of version 2.
assert.deepEqual(globalThis.SITE.originLV95, BERN);
const example = readFileSync(path.join(import.meta.dirname, 'example', 'plot.json'), 'utf8');
const { site } = read(example);
assert.deepEqual([site.originLV95, JSON.parse(example).version], [BERN, 2]);
const keys = Object.keys(site);
assert.equal(keys[keys.indexOf('bearingDeg') + 1], 'originLV95');

process.stdout.write(
  "tools/sketch: a plot's file says where it lies in LV95, as version 2, or says nothing of it, as version 1 - and the made-up plot lies at the zero of the Swiss grid\n",
);
