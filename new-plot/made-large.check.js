// The check of a large plot made (ST-042, Behaviour row 2): `plotMadeOf` of making.js - the
// plot made in the page, since the server's made.js went (T-041.4) - and the stand-in for
// swisstopo for the ground. The order is a paper of 800 m by 600 m in the stand-in's tile
// 2600/1200 - clear of the tile it has none of, and of its cell that has no height. Held: the plot
// is made, in the folder that its name gives; its file is of version 3,
// its ground as squares, and the one reader reads it; at every grid point of its paper the ground
// kept is within squares.js's 5 cm of the height it was made of; the file is 100 000 bytes at the
// most; and it is all done within 20 s. And of `plotOf` alone, by hand: a paper of 120 m by 30 m
// keeps its ground as rows, as every plot of before did, and one of 121 m by 30 m as squares.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import process from 'node:process';
import { read } from '../plot-file.js';
import { groundOf } from '../swisstopo/ground.js';
import { CELL_M, onMap, paperOf } from './frame.js';
import { plotMadeOf } from './making.js';
import { heightAt, plotOf } from './plot.js';

const { squares } = globalThis;
const STARTED = process.hrtime.bigint();
const MOST_MS = 20_000;
const MOST_BYTES = 100_000;

// A case, under its title: where one fails, the title says which.
let cases = 0;
async function it(title, run) {
  cases += 1;
  try {
    await run();
  } catch (error) {
    throw new Error(`${title}: ${error.message}`, { cause: error });
  }
}

// The stand-in, on a port that the system picked: it says its address, and is asked there.
const HERE = import.meta.dirname;
const standIn = spawn(process.execPath, [path.join(HERE, '..', 'swisstopo', 'stand-in.js')], {
  env: { ...process.env, PORT: '' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
process.once('exit', () => standIn.kill());
const soon = { signal: globalThis.AbortSignal.timeout(MOST_MS) };
const says = await once(standIn.stdout, 'data', soon);
const [, AT] = /^The stand-in for swisstopo: (\S+) - /.exec(says);

const ORDER = {
  name: 'Large',
  corners: [
    [2600010, 1200010],
    [2600800, 1200010],
    [2600800, 1200600],
    [2600010, 1200600],
  ],
  side: 0,
  aroundM: 5,
  on: ['cadastral'],
};

await it('makes a plot of 800 m by 600 m, its ground as squares within 5 cm, in 100 000 bytes', async () => {
  const answer = await plotMadeOf(JSON.stringify(ORDER), { origin: AT, day: '2026-10-20' });
  assert.deepEqual(Object.keys(answer), ['folder', 'text'], answer.refused);
  const { folder, text } = answer;
  assert.equal(folder, 'Large');
  assert.ok(Buffer.byteLength(text) <= MOST_BYTES, `${Buffer.byteLength(text)} bytes`);
  assert.equal(JSON.parse(text).version, 3);
  const { site } = read(text);
  assert.ok(site !== undefined, read(text).refused);
  const { xFromM, xToM, yFromM, yToM, originLV95, bearingDeg, ground } = site;
  const [cols, rows] = [(xToM - xFromM) / CELL_M, (yToM - yFromM) / CELL_M];
  assert.deepEqual(
    [cols, rows].sort((one, other) => one - other),
    [1200, 1600],
  );
  assert.deepEqual(Object.keys(ground), ['baseM', 'squares', 'cornersCm']);
  const tree = squares.read(ground, cols, rows);
  // The heights it was made of: the stand-in's ground of the paper's box, read anew.
  const heights = await groundOf(AT, paperOf(ORDER.corners, 0, 5).box);
  const lies = onMap({ origin: originLV95, bearingDeg });
  let worst = 0;
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= cols; column += 1) {
      const place = lies([xFromM + column * CELL_M, yToM - row * CELL_M]);
      const cm = Math.round(heightAt(heights, place) * 100) - ground.baseM * 100;
      worst = Math.max(worst, Math.abs(tree.cmAt(column, row) - cm));
    }
  }
  assert.ok(worst <= squares.TOLERANCE_CM, `${worst} cm off`);
  assert.equal(squares.TOLERANCE_CM, 5);
  standIn.kill();
});

// Of `plotOf` alone: a plot of 110 m by 20 m and one of 111 m, each with 5 m around, on ground
// that falls a centimetre a metre eastward - a plane, so no square is split for its heights.
const E0 = 2_600_000;
const flatOf = (box) => {
  const [west, south] = [box.minE, box.minN].map((edge) => Math.floor(edge / 0.5 - 0.5));
  const [east, north] = [box.maxE, box.maxN].map((edge) => Math.ceil(edge / 0.5 - 0.5));
  const heightsM = Array.from({ length: north - south + 1 }, () =>
    Array.from(
      { length: east - west + 1 },
      (_, column) => 600 - ((west + column) * 0.5 - E0) / 100,
    ),
  );
  return { cells: { west, east, south, north }, heightsM, tiles: [] };
};
const plotOfLong = (metres) => {
  const corners = [
    [E0, 1_200_000],
    [E0 + metres, 1_200_000],
    [E0 + metres, 1_200_020],
    [E0, 1_200_020],
  ];
  const ground = flatOf(paperOf(corners, 0, 5).box);
  const order = { name: 'Long', corners, side: 0, aroundM: 5, on: ['photo'], ground };
  return plotOf({ ...order, day: '2026-10-20' }).site;
};
await it('keeps the ground of a paper of 120 m as rows, and of one of 121 m as squares', () => {
  const [whole, larger] = [plotOfLong(110), plotOfLong(111)];
  assert.deepEqual([whole.xToM - whole.xFromM, whole.yToM - whole.yFromM], [120, 30]);
  assert.deepEqual(Object.keys(whole.ground), ['baseM', 'rowsCm']);
  assert.equal(whole.ground.rowsCm.length, 61);
  assert.deepEqual([larger.xToM - larger.xFromM, larger.yToM - larger.yFromM], [121, 30]);
  assert.deepEqual(Object.keys(larger.ground), ['baseM', 'squares', 'cornersCm']);
  assert.equal(larger.ground.cornersCm.length, 61);
  assert.equal(squares.fault(larger.ground, 242, 60), null);
  const tree = squares.read(larger.ground, 242, 60);
  // Where the two papers lie alike, the squares keep the rows' ground within 5 cm.
  const rowCm = (column, row) => Number(whole.ground.rowsCm[row].split(' ')[column]);
  const apart = (whole.ground.baseM - larger.ground.baseM) * 100;
  for (const [column, row] of [
    [0, 0],
    [100, 30],
    [240, 60],
  ]) {
    assert.ok(Math.abs(tree.cmAt(column, row) - rowCm(column, row) - apart) <= 5);
  }
});

const tookMs = Number(process.hrtime.bigint() - STARTED) / 1e6;
assert.ok(tookMs <= MOST_MS, `${Math.round(tookMs)} ms`);
assert.equal(cases, 2);
process.stdout.write(
  `tools/sketch/new-plot: a plot of 800 m by 600 m is made against the stand-in, as version 3 within 5 cm of its ground in ${Math.round(tookMs)} ms; a paper of 120 m keeps rows, one of 121 m squares: ${cases} cases\n`,
);
