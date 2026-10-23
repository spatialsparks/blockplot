// The check of what of a tile a box needs (ST-031): blocks.js by hand, with nothing running and
// nothing asked - which cells, blocks and bytes, worked out for the tile north-east of the origin
// of the Swiss grid, as a real one states itself: 2000 by 2000 cells of 0.5 m from its north-west
// corner at E 2 600 000, N 1 201 000, in sixteen rows of sixteen blocks. Every case of the parked
// product's blocks.test.ts, packages/adapters/src/geodata/terrain/, under the title it has there
// and with the same figures: fourteen. And one case of the pad's own, at the end. Run by
// check.js, as every check is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { JOINED_WITHIN_BYTES, blocksOf, rangesOf, windowOf } from './blocks.js';
import { MAX_BYTES } from './door.js';

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
const REFUSED = 'The tile is not the one to read: ';
/** That a call refuses in these words, to the letter - or in words that hold these. */
const refuses = (call, reason) => assert.throws(call, { name: 'Error', message: REFUSED + reason });
const refusesWith = (call, part) => assert.throws(call, (error) => error.message.includes(part));
/** What a thing says of the fields that `part` names, held to them. */
const says = (whole, part) =>
  assert.deepEqual(Object.fromEntries(Object.keys(part).map((key) => [key, whole[key]])), part);

// That tile. A block's bytes are made up: block number b lies at byte 1000 b, and is 100 long.
const TILE = {
  columns: 2000,
  rows: 2000,
  blockColumns: 128,
  blockRows: 128,
  blocks: Array.from({ length: 256 }, (_, block) => ({ offset: 1000 * block, byteCount: 100 })),
  westE: 2_600_000,
  northN: 1_201_000,
  cellWidth: 0.5,
  cellHeight: 0.5,
  epsg: 2056,
};
// The part of the parked adapter's box that lies in it: from the tile's west edge 155 cells
// eastward, from its south edge 271 cells northward.
const CELLS = { west: 5_200_000, east: 5_200_154, south: 2_400_000, north: 2_400_270 };

// windowOf.
it('counts columns from the west edge and rows from the north edge', () => {
  // The tile's first column is cell 5 200 000. Its first row is the northernmost: the cell
  // below N 1 201 000 is 2 401 999, so cell 2 400 270 is row 1729 and cell 2 400 000 row 1999.
  assert.deepEqual(windowOf(TILE, CELLS), {
    firstColumn: 0,
    lastColumn: 154,
    firstRow: 1729,
    lastRow: 1999,
    westColumn: 5_200_000,
    northRow: 2_401_999,
  });
});

it('takes a tile to its last cell each way, and no further', () => {
  const whole = { west: 5_200_000, east: 5_201_999, south: 2_400_000, north: 2_401_999 };
  says(windowOf(TILE, whole), { firstColumn: 0, lastColumn: 1999, firstRow: 0, lastRow: 1999 });
  const reach =
    'it reaches from E 2600000 to 2601000, N 1200000 to 1201000, and not over all the ground that was asked of it, ';
  const beyond = (cells, asked) => refuses(() => windowOf(TILE, cells), reach + asked);
  beyond({ ...whole, west: 5_199_999 }, 'E 2599999.5 to 2601000, N 1200000 to 1201000');
  beyond({ ...whole, east: 5_202_000 }, 'E 2600000 to 2601000.5, N 1200000 to 1201000');
  beyond({ ...whole, south: 2_399_999 }, 'E 2600000 to 2601000, N 1199999.5 to 1201000');
  beyond({ ...whole, north: 2_402_000 }, 'E 2600000 to 2601000, N 1200000 to 1201000.5');
});

it('refuses a tile in another coordinate system, whatever its numbers', () => {
  // The same square in LV03, and a tile that only says it is.
  const inLv03 = { ...TILE, epsg: 21781, westE: 600_000, northN: 201_000 };
  const reason = 'it states the coordinate system EPSG:21781 where LV95, EPSG:2056, was asked for';
  refuses(() => windowOf(inLv03, CELLS), reason);
  refuses(() => windowOf({ ...TILE, epsg: 21781 }, CELLS), reason);
  // LV95 by name and LV03 by its numbers: it does not lie where the cells are wanted.
  refusesWith(
    () => windowOf({ ...TILE, westE: 600_000, northN: 201_000 }, CELLS),
    `${REFUSED}it reaches from E 600000 to 601000, N 200000 to 201000, and not over all the ground`,
  );
});

it('refuses a tile of another cell size, in either direction', () => {
  const twoMetres = { ...TILE, columns: 500, rows: 500, cellWidth: 2, cellHeight: 2 };
  refuses(() => windowOf(twoMetres, CELLS), 'its cells are 2 m by 2 m where 0.5 m was asked for');
  const flatter = () => windowOf({ ...TILE, cellHeight: 0.25 }, CELLS);
  refusesWith(flatter, 'its cells are 0.5 m by 0.25 m where');
  const narrower = () => windowOf({ ...TILE, cellWidth: 0.25 }, CELLS);
  refusesWith(narrower, 'its cells are 0.25 m by 0.5 m where');
});

it('refuses a tile whose cells lie across the grid’s', () => {
  refuses(
    () => windowOf({ ...TILE, westE: 2_600_000.25 }, CELLS),
    'its cells lie across the cells of 0.5 m counted from zero: its north-west corner is at E 2600000.25, N 1201000',
  );
  const north = (northN) => () => windowOf({ ...TILE, northN }, CELLS);
  refusesWith(north(1_201_000.1), 'is at E 2600000, N 1201000.1');
  refusesWith(north(Number.NaN), 'is at E 2600000, N NaN');
});

// blocksOf.
it('lists the blocks that hold the cells, row by row, each with the cells it begins at', () => {
  // Columns 0 to 154 lie in the first two blocks of a row, rows 1729 to 1999 in the block rows
  // that begin at 1664, 1792 and 1920: the 14th, 15th and 16th, so blocks 208, 224 and 240 on.
  assert.deepEqual(blocksOf(TILE, windowOf(TILE, CELLS)), [
    { offset: 208_000, byteCount: 100, firstColumn: 0, firstRow: 1664 },
    { offset: 209_000, byteCount: 100, firstColumn: 128, firstRow: 1664 },
    { offset: 224_000, byteCount: 100, firstColumn: 0, firstRow: 1792 },
    { offset: 225_000, byteCount: 100, firstColumn: 128, firstRow: 1792 },
    { offset: 240_000, byteCount: 100, firstColumn: 0, firstRow: 1920 },
    { offset: 241_000, byteCount: 100, firstColumn: 128, firstRow: 1920 },
  ]);
});

it('is one block for cells within one, up to its last cell and from its first', () => {
  const one = (cells) => blocksOf(TILE, windowOf(TILE, cells)).map((block) => block.offset);
  // The block in the south-west corner holds columns 0 to 127 and rows 1920 to 1999.
  const corner = { west: 5_200_000, east: 5_200_127, south: 2_400_000, north: 2_400_079 };
  assert.deepEqual(one(corner), [240_000]);
  assert.deepEqual(one({ ...corner, east: 5_200_128 }), [240_000, 241_000]);
  assert.deepEqual(one({ ...corner, north: 2_400_080 }), [224_000, 240_000]);
  // And the last block of the tile is its south-east corner's: column 1920 on, row 1920 on.
  const last = { west: 5_201_920, east: 5_201_999, south: 2_400_000, north: 2_400_079 };
  assert.deepEqual(one(last), [255_000]);
});

it('refuses a tile that has no bytes for a block that is needed', () => {
  const empty = (block, index) => (index === 225 ? { ...block, byteCount: 0 } : block);
  const blocks = TILE.blocks.map(empty);
  refuses(
    () => blocksOf({ ...TILE, blocks }, windowOf(TILE, CELLS)),
    'its block 2 of row 15 holds no bytes',
  );
  refuses(
    () => blocksOf({ ...TILE, blocks: TILE.blocks.slice(0, 240) }, windowOf(TILE, CELLS)),
    'its block 1 of row 16 holds no bytes',
  );
});

// rangesOf.
it('asks for blocks that follow each other as one part, and for others apart', () => {
  // As a real tile lies: the blocks of a row eight bytes apart, the next row far on.
  const [first, second] = [
    { offset: 1000, byteCount: 500 },
    { offset: 1508, byteCount: 400 },
  ];
  const nextRow = { offset: 90_000, byteCount: 300 };
  const parts = [
    { first: 1000, last: 1907 },
    { first: 90_000, last: 90_299 },
  ];
  assert.deepEqual(rangesOf([first, second, nextRow]), parts);
});

it('goes by where the blocks lie in the file, not by the order they are listed in', () => {
  const [last, second] = [
    { offset: 90_000, byteCount: 300 },
    { offset: 1508, byteCount: 400 },
  ];
  const parts = [
    { first: 1000, last: 1907 },
    { first: 90_000, last: 90_299 },
  ];
  assert.deepEqual(rangesOf([last, second, { offset: 1000, byteCount: 500 }]), parts);
});

it('asks once for a block that is named twice, or that lies within another', () => {
  const block = { offset: 1000, byteCount: 500 };
  const within = { offset: 1100, byteCount: 10 };
  assert.deepEqual(rangesOf([block, block, within]), [{ first: 1000, last: 1499 }]);
  assert.deepEqual(rangesOf([]), []);
});

it('joins across a gap of JOINED_WITHIN_BYTES, and not across one byte more', () => {
  assert.equal(JOINED_WITHIN_BYTES, 4096);
  const first = { offset: 1000, byteCount: 500 };
  // The first block ends at byte 1499: 4096 bytes of gap end at 5595.
  const joined = rangesOf([first, { offset: 5596, byteCount: 10 }]);
  assert.deepEqual(joined, [{ first: 1000, last: 5605 }]);
  const apart = rangesOf([first, { offset: 5597, byteCount: 10 }]);
  assert.deepEqual(apart, [
    { first: 1000, last: 1499 },
    { first: 5597, last: 5606 },
  ]);
});

it('asks a row of blocks in parts that the door takes: a megabyte at the most', () => {
  // A row of sixteen blocks, eight bytes apart, as a box across a whole tile needs. Of 64 kB
  // each, fifteen are 15 * 65 536 + 14 * 8 = 983 152 bytes, and sixteen 120 bytes over a
  // megabyte: the sixteenth is a part of its own. Of 30 000 bytes, the row is one part.
  const row = (bytes) =>
    Array.from({ length: 16 }, (_, at) => ({ offset: 1000 + at * (bytes + 8), byteCount: bytes }));
  assert.equal(MAX_BYTES, 1_048_576);
  const parts = [
    { first: 1000, last: 984_151 },
    { first: 984_160, last: 1_049_695 },
  ];
  assert.deepEqual(rangesOf(row(65_536)), parts);
  assert.ok(parts.every(({ first, last }) => last - first + 1 <= MAX_BYTES));
  assert.deepEqual(rangesOf(row(30_000)), [{ first: 1000, last: 481_119 }]);
});

// blocksOf, of blocks that are not square. Two blocks each way from within the tile: a block's
// columns and its rows taken for each other name other blocks, or other cells for a block to
// begin at.
it('counts blocks across by their columns and down by their rows, either way round', () => {
  // 256 cells wide and 64 high, 8 to a row: columns 300 to 600 lie in blocks 1 and 2 of a row,
  // rows 100 to 150 in rows of blocks 1 and 2 - blocks 9, 10, 17 and 18.
  const wide = { ...TILE, blockColumns: 256, blockRows: 64 };
  const across = { west: 5_200_300, east: 5_200_600, south: 2_401_849, north: 2_401_899 };
  assert.deepEqual(blocksOf(wide, windowOf(wide, across)), [
    { offset: 9000, byteCount: 100, firstColumn: 256, firstRow: 64 },
    { offset: 10_000, byteCount: 100, firstColumn: 512, firstRow: 64 },
    { offset: 17_000, byteCount: 100, firstColumn: 256, firstRow: 128 },
    { offset: 18_000, byteCount: 100, firstColumn: 512, firstRow: 128 },
  ]);
  // 64 cells wide and 256 high, 32 to a row: columns 100 to 150 lie in blocks 1 and 2 of a row,
  // rows 300 to 600 in rows of blocks 1 and 2 - blocks 33, 34, 65 and 66.
  const high = { ...TILE, blockColumns: 64, blockRows: 256 };
  const down = { west: 5_200_100, east: 5_200_150, south: 2_401_399, north: 2_401_699 };
  assert.deepEqual(blocksOf(high, windowOf(high, down)), [
    { offset: 33_000, byteCount: 100, firstColumn: 64, firstRow: 256 },
    { offset: 34_000, byteCount: 100, firstColumn: 128, firstRow: 256 },
    { offset: 65_000, byteCount: 100, firstColumn: 64, firstRow: 512 },
    { offset: 66_000, byteCount: 100, firstColumn: 128, firstRow: 512 },
  ]);
});

// windowOf, of a tile that is not square.
it('takes it to its last column and its last row, and says how far it reaches', () => {
  // 500 cells wide and 300 high from E 2 600 000, N 1 200 150 - and turned, 300 wide and 500
  // high from N 1 200 250. Each is taken whole, and refused one cell beyond its east edge or
  // its south edge: its width is counted in columns, its height in rows.
  const wide = { ...TILE, columns: 500, rows: 300, northN: 1_200_150 };
  const high = { ...TILE, columns: 300, rows: 500, northN: 1_200_250 };
  const wideCells = { west: 5_200_000, east: 5_200_499, south: 2_400_000, north: 2_400_299 };
  const highCells = { west: 5_200_000, east: 5_200_299, south: 2_400_000, north: 2_400_499 };
  says(windowOf(wide, wideCells), { lastColumn: 499, lastRow: 299 });
  says(windowOf(high, highCells), { lastColumn: 299, lastRow: 499 });
  refuses(
    () => windowOf(wide, { ...wideCells, east: 5_200_500 }),
    'it reaches from E 2600000 to 2600250, N 1200000 to 1200150, and not over all the ground that was asked of it, E 2600000 to 2600250.5, N 1200000 to 1200150',
  );
  refuses(
    () => windowOf(high, { ...highCells, south: 2_399_999 }),
    'it reaches from E 2600000 to 2600150, N 1200000 to 1200250, and not over all the ground that was asked of it, E 2600000 to 2600150, N 1199999.5 to 1200250',
  );
});

// blocksOf, of a tile that is not square: a case that the parked product holds where it reads a
// whole tile through its client, and that no case above holds - the first of the four breaks of
// ADR-0052, the blocks of a row counted by the tile's rows.
it('counts the blocks of a row by the columns of a tile that is not square', () => {
  // 500 cells wide and 300 high in blocks of 128 by 64: four to a row. The cell in column 400
  // and row 150 lies in block 3 of the row of blocks 2, which is block 11 - and block 9, were
  // the three blocks that 300 rows make counted to a row.
  const wide = {
    ...TILE,
    columns: 500,
    rows: 300,
    northN: 1_200_150,
    blockColumns: 128,
    blockRows: 64,
  };
  const inWide = { west: 5_200_400, east: 5_200_400, south: 2_400_149, north: 2_400_149 };
  const eleventh = { offset: 11_000, byteCount: 100 };
  assert.deepEqual(blocksOf(wide, windowOf(wide, inWide)), [
    { ...eleventh, firstColumn: 384, firstRow: 128 },
  ]);
  // And turned, 300 wide and 500 high in blocks of 64 by 128: five to a row. The cell in column
  // 100 and row 300 lies in block 1 of the row of blocks 2: block 11 again, and not block 17.
  const high = {
    ...TILE,
    columns: 300,
    rows: 500,
    northN: 1_200_250,
    blockColumns: 64,
    blockRows: 128,
  };
  const inHigh = { west: 5_200_100, east: 5_200_100, south: 2_400_199, north: 2_400_199 };
  assert.deepEqual(blocksOf(high, windowOf(high, inHigh)), [
    { ...eleventh, firstColumn: 64, firstRow: 256 },
  ]);
});

assert.equal(cases, 16);
process.stdout.write(
  `tools/sketch/swisstopo: of a tile a box gets its window of cells, the blocks that hold them and the parts of the file to ask for, and a tile that is not the one to read is refused in its words: ${cases} cases\n`,
);
