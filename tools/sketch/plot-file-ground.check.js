// The check of the order of two refusals of a plot's ground (ST-030), by the text of the smallest
// plot with a short row, tests/__fixtures__/plots/ground-short/plot.json, read again by `read` of
// plot-file.js with its rows changed. The ground has 5 rows of 5 heights, and the reader says of
// a ground the first of three faults that holds: the count of rows, then the count of heights in
// each row, then a row that holds what is no number. By hand, two texts of two faults each: the
// first row taken out, so that 4 rows are left and a row of 4 heights is among them, is refused
// for its rows and not for the row; and the second row made of what is no number, before the row
// of 4, is refused for the row of 4 and not for the number - and each fault alone, in its own
// sentence, so that a text holds an order and not one sentence. plot-file.check.js holds every
// sentence of the format's list in its order, but every fault of the ground sits in one field
// there and a later file writes over an earlier: this is where two faults of it are told apart.
// No browser, no server. Run by check.js, as every check is, or alone:
//   pnpm exec node tools/sketch/plot-file-ground.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { read } from './plot-file.js';

const SHORT = path.join(import.meta.dirname, '../../tests/__fixtures__/plots/ground-short');
const FILE = JSON.parse(readFileSync(path.join(SHORT, 'plot.json'), 'utf8'));
const FULL = '100 100 100 100 100';
const [, , FOUR] = FILE.ground.rowsCm;
assert.deepEqual(FILE.ground.rowsCm, [FULL, FULL, '100 100 100 100', FULL, FULL]);

/** What the reader says of the smallest plot with its rows changed to these. */
const said = (rowsCm) => {
  const ground = { ...FILE.ground, rowsCm };
  return read(JSON.stringify({ ...FILE, ground }, null, 2)).refused;
};
const NEEDED = 'Its ground lacks a height: 5 rows of 5 heights are needed, and';
const ROWS = `${NEEDED} it has 4 rows.`;
const ROW = `${NEEDED} row 3 has 4.`;
const NO_NUMBER = 'Its ground lacks a height: row 2 holds what is no number.';

// Each fault alone, in its sentence: a row of 4 heights, 4 rows of 5 heights, and a row that
// holds what is no number.
assert.equal(said([FULL, FULL, FOUR, FULL, FULL]), ROW);
assert.equal(said([FULL, FULL, FULL, FULL]), ROWS);
assert.equal(said([FULL, '100 100 x 100 100', FULL, FULL, FULL]), NO_NUMBER);

// The count of rows is told before the count of heights in a row: 4 rows, the second of 4 heights.
assert.equal(said([FULL, FOUR, FULL, FULL]), ROWS);
// The count of heights in a row is told before a row that holds what is no number: the number in
// row 2, the row of 4 in row 3.
assert.equal(said([FULL, '100 100 x 100 100', FOUR, FULL, FULL]), ROW);

process.stdout.write(
  "tools/sketch: a plot's ground is refused for its count of rows before the count of heights of a row, and for that before a row that holds what is no number\n",
);
