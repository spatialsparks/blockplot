// The check of where the cells of swissALTI3D lie (ST-031): grid.js by hand, with nothing running
// and nothing asked. A cell is half a metre: the cell with the number c reaches from c / 2 to
// (c + 1) / 2, and its middle is at c / 2 + 0.25 - so the first cell east of E 2 600 000 is number
// 5 200 000, with its middle at E 2 600 000.25. Every case of the parked product's grid.test.ts,
// packages/adapters/src/geodata/terrain/, under the title it has there and with the same
// figures: nine - and one of the pad's own, at the end, for what its `tilesOf` refuses and the
// parked one does not. The side of a cell is `CELL_SIZE_M` there, and `CELL_M` here. Run by
// check.js, as every check is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { CELL_M, LV95_EPSG, cellsCovering, cellsIn, middleOf, tilesOf } from './grid.js';

// A case, under its title: where one fails, the title says which.
let cases = 0;
function it(title, run) {
  cases += 1;
  try {
    run();
  } catch (error) {
    throw new Error(`${title}: ${error.message}`, { cause: error });
  }
}

// The box that the parked product's adapter asks for, around the origin of the Swiss grid.
const BOX = { minE: 2_599_912, maxE: 2_600_077, minN: 1_199_902, maxN: 1_200_135 };
// Its cells. A whole metre lies on the edge between two cells, so on every side the grid goes a
// quarter metre further, to the next middle: E 2 599 911.75 is cell 5 199 823, E 2 600 077.25 is
// cell 5 200 154, N 1 199 901.75 is cell 2 399 803, N 1 200 135.25 is cell 2 400 270.
const CELLS = { west: 5_199_823, east: 5_200_154, south: 2_399_803, north: 2_400_270 };

// cellsCovering.
it('goes out to the next middle of a cell beyond every edge', () => {
  assert.deepEqual(cellsCovering(BOX), CELLS);
  const middles = [CELLS.west, CELLS.east, CELLS.south, CELLS.north].map(middleOf);
  assert.deepEqual(middles, [2_599_911.75, 2_600_077.25, 1_199_901.75, 1_200_135.25]);
  // 165.5 m by 233.5 m, both ends counted: 332 grid points by 468.
  assert.deepEqual([CELLS.east - CELLS.west + 1, CELLS.north - CELLS.south + 1], [332, 468]);
});

// A box whose every edge lies on the middle of a cell.
const ON_MIDDLES = {
  minE: 2_600_000.25,
  maxE: 2_600_001.75,
  minN: 1_200_000.25,
  maxN: 1_200_000.75,
};

it('stops at a middle that lies on the edge itself', () => {
  const cells = { west: 5_200_000, east: 5_200_003, south: 2_400_000, north: 2_400_001 };
  assert.deepEqual(cellsCovering(ON_MIDDLES), cells);
});

it('takes one cell more for an edge a hair beyond a middle, and none for one a hair before', () => {
  const box = ON_MIDDLES;
  // West of the middle of cell 5 200 000: the cell before it is needed. East of it: it is not.
  assert.equal(cellsCovering({ ...box, minE: 2_600_000.24 }).west, 5_199_999);
  assert.equal(cellsCovering({ ...box, minE: 2_600_000.26 }).west, 5_200_000);
  assert.equal(cellsCovering({ ...box, maxE: 2_600_001.76 }).east, 5_200_004);
  assert.equal(cellsCovering({ ...box, maxE: 2_600_001.74 }).east, 5_200_003);
  assert.equal(cellsCovering({ ...box, minN: 1_200_000.24 }).south, 2_399_999);
  assert.equal(cellsCovering({ ...box, maxN: 1_200_000.76 }).north, 2_400_002);
});

it('gives two cells each way at least, so that the grid points enclose ground', () => {
  // A millimetre of ground between two middles: the cell before it and the cell after it.
  const sliver = { minE: 2_600_000.4, maxE: 2_600_000.401, minN: 1_200_000.4, maxN: 1_200_000.401 };
  const cells = { west: 5_200_000, east: 5_200_001, south: 2_400_000, north: 2_400_001 };
  assert.deepEqual(cellsCovering(sliver), cells);
});

// middleOf.
it('is a quarter metre into the cell, exactly', () => {
  assert.equal(CELL_M, 0.5);
  assert.equal(middleOf(5_200_000), 2_600_000.25);
  assert.equal(middleOf(5_199_999), 2_599_999.75);
  assert.equal(middleOf(2_400_000), 1_200_000.25);
});

// tilesOf.
it('lists the tiles from south to north, and west to east in each row', () => {
  // 2000 cells a kilometre: cell 5 199 999 is the last of kilometre 2599, 5 200 000 the first
  // of 2600 - and the box at the origin lies in all four tiles that meet there.
  assert.deepEqual(tilesOf(CELLS), [
    { eastKm: 2599, northKm: 1199 },
    { eastKm: 2600, northKm: 1199 },
    { eastKm: 2599, northKm: 1200 },
    { eastKm: 2600, northKm: 1200 },
  ]);
});

it('is one tile for cells that end at its edge, and two from the first cell beyond it', () => {
  const inOne = { west: 5_200_000, east: 5_201_999, south: 2_400_000, north: 2_401_999 };
  assert.deepEqual(tilesOf(inOne), [{ eastKm: 2600, northKm: 1200 }]);
  assert.deepEqual(tilesOf({ ...inOne, west: 5_199_999 }), [
    { eastKm: 2599, northKm: 1200 },
    { eastKm: 2600, northKm: 1200 },
  ]);
  assert.deepEqual(tilesOf({ ...inOne, north: 2_402_000 }), [
    { eastKm: 2600, northKm: 1200 },
    { eastKm: 2600, northKm: 1201 },
  ]);
});

// cellsIn.
it('cuts the cells at the edges of a tile, and every cell lies in one tile', () => {
  const parts = tilesOf(CELLS).map((tile) => cellsIn(tile, CELLS));
  assert.deepEqual(parts, [
    { west: 5_199_823, east: 5_199_999, south: 2_399_803, north: 2_399_999 },
    { west: 5_200_000, east: 5_200_154, south: 2_399_803, north: 2_399_999 },
    { west: 5_199_823, east: 5_199_999, south: 2_400_000, north: 2_400_270 },
    { west: 5_200_000, east: 5_200_154, south: 2_400_000, north: 2_400_270 },
  ]);
  // 177 and 155 columns, 197 and 271 rows: together the 332 by 468 of the whole.
  const count = (part) => (part.east - part.west + 1) * (part.north - part.south + 1);
  assert.deepEqual(parts.map(count), [177 * 197, 155 * 197, 177 * 271, 155 * 271]);
  assert.equal(
    parts.map(count).reduce((sum, cells) => sum + cells),
    332 * 468,
  );
});

it('is all of the cells where they lie in one tile', () => {
  const inOne = { west: 5_200_000, east: 5_200_003, south: 2_400_000, north: 2_400_001 };
  assert.deepEqual(cellsIn({ eastKm: 2600, northKm: 1200 }, inOne), inOne);
});

// tilesOf, where the pad's reader is stricter than the parked one (T-031.4): a case that the
// parked product has not. Cells that cannot be counted are refused before a tile is - a box with
// an edge at 1e300 was counted for ever, a kilometre at a time, where a step of one changes nothing.
it('refuses cells that it cannot count, and cells that no tile’s name can hold', () => {
  const uncounted = (cells, columns, rows) => {
    const message = `Not cells that count exactly: columns ${columns}, rows ${rows}.`;
    assert.throws(() => tilesOf(cells), { name: 'RangeError', message });
  };
  // What is no number, no whole one, or a text - and then what would be counted for ever: a cell
  // beyond the numbers that count exactly, one at no end, and the box with its edge at 1e300.
  const [COLUMNS, ROWS] = ['5199823 to 5200154', '2399803 to 2400270'];
  uncounted({ ...CELLS, south: Number.NaN }, COLUMNS, 'NaN to 2400270');
  uncounted({ ...CELLS, west: 5_199_823.5 }, '5199823.5 to 5200154', ROWS);
  uncounted({ ...CELLS, west: '5199823' }, COLUMNS, ROWS);
  uncounted({ ...CELLS, east: 2 ** 53 }, '5199823 to 9007199254740992', ROWS);
  uncounted({ ...CELLS, north: Infinity }, COLUMNS, '2399803 to Infinity');
  const endless = cellsCovering({ ...BOX, maxE: 1e300 });
  assert.deepEqual(endless, { ...CELLS, east: 2e300 });
  uncounted(endless, '5199823 to 2e+300', ROWS);
  // A name holds four figures each way: kilometre 1000 is the first, and 9999 the last - 9000
  // tiles in a row and in a column, and none where a cell lies a kilometre beyond either end, or
  // in the frame of old.
  const nameless = (cells, kilometres) => {
    const message = `No tile has a name where the cells lie, at the kilometres ${kilometres}: a name holds four figures each way.`;
    assert.throws(() => tilesOf(cells), { name: 'RangeError', message });
  };
  const row = { west: 2_000_000, east: 19_999_999, south: 19_998_000, north: 19_999_999 };
  const column = { west: 19_998_000, east: 19_999_999, south: 2_000_000, north: 19_999_999 };
  const ends = (tiles) => [tiles.length, tiles[0], tiles.at(-1)];
  const last = { eastKm: 9999, northKm: 9999 };
  assert.deepEqual(ends(tilesOf(row)), [9000, { eastKm: 1000, northKm: 9999 }, last]);
  assert.deepEqual(ends(tilesOf(column)), [9000, { eastKm: 9999, northKm: 1000 }, last]);
  nameless({ ...row, west: 1_999_999 }, 'E 999 to 9999, N 9999 to 9999');
  nameless({ ...row, east: 20_000_000 }, 'E 1000 to 10000, N 9999 to 9999');
  nameless({ ...column, south: 1_999_999 }, 'E 9999 to 9999, N 999 to 9999');
  nameless({ ...column, north: 20_000_000 }, 'E 9999 to 9999, N 1000 to 10000');
  const old = cellsCovering({
    minE: 600_000.25,
    maxE: 600_001.25,
    minN: 200_000.25,
    maxN: 200_001,
  });
  nameless(old, 'E 600 to 600, N 200 to 200');
  nameless({ west: -1, east: 0, south: -4001, north: 0 }, 'E -1 to 0, N -3 to 0');
});

// And what no parked case states by itself: LV95, by its number.
assert.equal(LV95_EPSG, 2056);
assert.equal(cases, 10);
process.stdout.write(
  `tools/sketch/swisstopo: the cells of a box are counted from the zero of LV95, out to the next middle beyond every edge, and cut at the edges of the tiles that they lie in: ${cases} cases\n`,
);
