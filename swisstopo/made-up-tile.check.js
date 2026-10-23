// The check of what the checks of this folder stand on (ST-031): the made-up tile of
// made-up-tile.js, and its two helpers that change a tile's directory. What the writer writes
// states the same as a real tile does, field for field - compared with the beginning of a real
// one, recorded at the origin of the Swiss grid in Bern. The cases of the parked product's
// testTile.test.ts, packages/adapters/src/geodata/terrain/, each under the title it has there and
// with the same figures: of `madeUpTile` seven, of the made-up ground one, of `fieldOf` and
// `changed` one. A parked case keeps the parked ground: its rule is written anew below. The
// parked product also holds its writer to four recorded tiles; no tile is copied here, so each
// is held by its length and its SHA-256 - four cases - and written twice, and the short way.
// And three cases of the pad's own, at the end. Nothing runs and nothing is asked.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { decodeLzw } from './lzw.js';
import { changed, fieldOf, madeUpTile } from './made-up-tile.js';
import { readTileHead } from './tiff.js';

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
/** What a head says of the fields that `part` names, held to them. */
const says = (head, part) =>
  assert.deepEqual(Object.fromEntries(Object.keys(part).map((key) => [key, head[key]])), part);
/** The same bytes, said as yes or no: 200 000 bytes that differ are no list to compare. */
const same = (bytes, others) => Buffer.compare(bytes, others) === 0;

// The parked product's made-up ground, at the origin of the Swiss grid: the height at the middle
// of a cell, in metres. Count the cells of 0.5 m from the origin - `east` is 0 for the first
// column east of it and -1 for the first west of it, `north` likewise. Within four cells of the
// origin each way the ground is a slope, 540 + 0.25 east + 2 north; everywhere else each tile is
// flat: 520 m south-west of the origin, 530 m south-east, 550 m north-west, 560 m north-east.
// The stand-in's world is another rule, made-up.js's, with cases of its own.
function madeUpHeightM(e, n) {
  const east = Math.floor((e - 2_600_000) / 0.5);
  const north = Math.floor((n - 1_200_000) / 0.5);
  if (east >= -4 && east < 4 && north >= -4 && north < 4) return 540 + 0.25 * east + 2 * north;
  return (north < 0 ? 520 : 550) + (east < 0 ? 0 : 10);
}

/** The fields of a file's first directory, each as its tag, its type and how many values. */
function fieldsOf(file) {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const directory = view.getUint32(4, true);
  return Array.from({ length: view.getUint16(directory, true) }, (_, index) => {
    const entry = directory + 2 + index * 12;
    const [tag, type] = [view.getUint16(entry, true), view.getUint16(entry + 2, true)];
    return [tag, type, view.getUint32(entry + 4, true)];
  });
}
/** The values of one field that lie outside the directory, as the bytes they are. */
function valueOf(file, tag) {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const index = fieldsOf(file).findIndex((field) => field[0] === tag);
  const [, type, count] = fieldsOf(file)[index];
  const at = view.getUint32(view.getUint32(4, true) + 2 + index * 12 + 8, true);
  return file.subarray(at, at + count * { 2: 1, 3: 2, 4: 4, 12: 8 }[type]);
}
/** The cells of one block of a tile, unpacked: a height by its column and its row in the block. */
function cellsOf(tile, index, [blockColumns, blockRows] = [128, 128]) {
  const { offset, byteCount } = readTileHead(tile).blocks[index];
  const cells = decodeLzw(tile.subarray(offset, offset + byteCount), blockColumns * blockRows * 4);
  const view = new DataView(cells.buffer);
  return (column, row) => view.getFloat32((row * blockColumns + column) * 4, true);
}

// The made-up ground.
it('is a slope within four cells of the origin, and flat in each tile beyond', () => {
  // The first cell north-east of the origin has its middle a quarter metre in, both ways.
  assert.equal(madeUpHeightM(2_600_000.25, 1_200_000.25), 540);
  // A cell east is a quarter metre up, a cell north two metres; west and south count from -1.
  assert.equal(madeUpHeightM(2_600_000.75, 1_200_000.25), 540.25);
  assert.equal(madeUpHeightM(2_600_000.25, 1_200_000.75), 542);
  assert.equal(madeUpHeightM(2_599_999.75, 1_200_000.25), 539.75);
  assert.equal(madeUpHeightM(2_600_000.25, 1_199_999.75), 538);
  // The fourth cell is the last of the slope: 540 + 0.25 * 3 + 2 * 3, and 540 - 0.25 * 4 - 2 * 4.
  assert.equal(madeUpHeightM(2_600_001.75, 1_200_001.75), 546.75);
  assert.equal(madeUpHeightM(2_599_998.25, 1_199_998.25), 531);
  // The fifth is flat ground: 560 m north-east, 550 north-west, 530 south-east, 520 south-west.
  assert.equal(madeUpHeightM(2_600_002.25, 1_200_000.25), 560);
  assert.equal(madeUpHeightM(2_600_000.25, 1_200_002.25), 560);
  assert.equal(madeUpHeightM(2_599_997.75, 1_200_000.25), 550);
  assert.equal(madeUpHeightM(2_600_000.25, 1_199_997.75), 530);
  assert.equal(madeUpHeightM(2_599_999.75, 1_199_997.75), 520);
});

// madeUpTile. The tile north-east of the origin, of the parked ground, and the head of the real
// one: a fixture, which lzw.check.js holds to its bytes.
const NORTH_EAST = { eastKm: 2600, northKm: 1200 };
const MADE_UP = madeUpTile({ ...NORTH_EAST, heightAt: madeUpHeightM });
const HEAD = path.join(import.meta.dirname, '__fixtures__', 'real', 'head-2600-1200.tif');
const REAL = new Uint8Array(fs.readFileSync(HEAD));

it('states what a real tile does, field for field', () => {
  // The same nineteen fields in the same order, of the same types and as many values each -
  // but for the metadata, tag 42112, where a real tile adds the statistics of its heights.
  const METADATA = 42112;
  const butForTheMetadata = (file) =>
    fieldsOf(file).map(([tag, type, count]) => [tag, type, tag === METADATA ? 0 : count]);
  assert.deepEqual(butForTheMetadata(MADE_UP), butForTheMetadata(REAL));
  assert.equal(fieldsOf(REAL).length, 19);
  // And they say the same: the size, the position, the coordinate system, the number for no height.
  const { blocks } = readTileHead(MADE_UP);
  assert.deepEqual(readTileHead(MADE_UP), { ...readTileHead(REAL), blocks });
  for (const tag of [33550, 33922, 34735, 34737, 42113]) {
    assert.deepEqual(valueOf(MADE_UP, tag), valueOf(REAL, tag));
  }
});

it('begins as a real tile does, and owns up to being edited', () => {
  const text = (file) => Buffer.from(file.subarray(8, 192)).toString('latin1');
  // The same first eight bytes - the directory begins at byte 192 - and between them and it
  // GDAL's own note on the layout, of which the made-up tile contradicts one word.
  assert.deepEqual(MADE_UP.subarray(0, 8), REAL.subarray(0, 8));
  assert.ok(text(REAL).includes('KNOWN_INCOMPATIBLE_EDITION=NO\n '));
  assert.equal(text(MADE_UP), text(REAL).replace('EDITION=NO\n ', 'EDITION=YES\n'));
});

it('writes every block between its length and its last four bytes again, as a real tile has them', () => {
  const view = new DataView(MADE_UP.buffer);
  for (const { offset, byteCount } of readTileHead(MADE_UP).blocks) {
    const end = offset + byteCount;
    assert.equal(view.getUint32(offset - 4, true), byteCount);
    assert.deepEqual(MADE_UP.subarray(end, end + 4), MADE_UP.subarray(end - 4, end));
  }
});

it('writes blocks of the same heights once, and fills a block up with zeros beyond the tile', () => {
  const tile = madeUpTile({ ...NORTH_EAST, heightAt: () => 560 });
  const { blocks } = readTileHead(tile);
  // A flat tile of 2000 cells in blocks of 128: whole blocks, those cut off at column 2000,
  // those cut off at row 2000, and the one cut off at both.
  assert.equal(blocks.length, 256);
  assert.equal(new Set(blocks.map((block) => block.offset)).size, 4);
  assert.deepEqual(blocks[0], blocks[238]);
  assert.deepEqual(blocks[15], blocks[239]);
  assert.deepEqual(blocks[240], blocks[254]);
  assert.notDeepEqual(blocks[255], blocks[254]);
  // The last block holds 80 by 80 cells of the tile: cell 79 is ground, cell 80 is not.
  const cell = cellsOf(tile, 255);
  const cells = [cell(0, 0), cell(79, 79), cell(80, 79), cell(79, 80), cell(127, 127)];
  assert.deepEqual(cells, [560, 560, 0, 0, 0]);
});

it('writes blocks of the size it is asked for, each row by row from its north-west cell', () => {
  // 256 cells each way in blocks of 64 wide and 32 high: four to a row, eight rows. A cell's
  // height tells its place: 1000, its column, and its row from the north in 1024ths.
  const [westE, northN] = [2_600_000, 1_200_128];
  const heightAt = (e, n) => 1000 + (e - westE) / 0.5 - 0.5 + ((northN - n) / 0.5 - 0.5) / 1024;
  const size = { blockColumns: 64, blockRows: 32 };
  const tile = madeUpTile({ ...NORTH_EAST, cells: 256, northN, ...size, heightAt });
  says(readTileHead(tile), size);
  assert.equal(readTileHead(tile).blocks.length, 32);
  // Block 5 is the second of the second row: columns 64 to 127, rows 32 to 63.
  const cell = cellsOf(tile, 5, [64, 32]);
  const [north, south] = [1000 + 32 / 1024, 1000 + 63 / 1024];
  const corners = [cell(0, 0), cell(63, 0), cell(0, 31), cell(63, 31)];
  assert.deepEqual(corners, [north + 64, north + 127, south + 64, south + 127]);
});

it('writes as many columns and rows as it is asked for, square or not, and zeros beyond them', () => {
  // A flat tile 200 cells wide and 100 high, in blocks of 128: two blocks side by side, the
  // second holding columns 128 to 199 of rows 0 to 99. And one 100 wide and 200 high: two
  // blocks one above the other, the second holding rows 128 to 199 of columns 0 to 99.
  const flat = { ...NORTH_EAST, heightAt: () => 560 };
  const wide = madeUpTile({ ...flat, columns: 200, rows: 100 });
  says(readTileHead(wide), { columns: 200, rows: 100 });
  assert.equal(readTileHead(wide).blocks.length, 2);
  const east = cellsOf(wide, 1);
  assert.deepEqual([east(0, 0), east(71, 99), east(72, 99), east(71, 100)], [560, 560, 0, 0]);

  const high = madeUpTile({ ...flat, columns: 100, rows: 200 });
  says(readTileHead(high), { columns: 100, rows: 200 });
  assert.equal(readTileHead(high).blocks.length, 2);
  const south = cellsOf(high, 1);
  assert.deepEqual([south(0, 0), south(99, 71), south(100, 71), south(99, 72)], [560, 560, 0, 0]);

  // Each in place of `cells` in its own direction, where `cells` still sets the other.
  const wider = readTileHead(madeUpTile({ ...flat, cells: 64, columns: 200 }));
  says(wider, { columns: 200, rows: 64 });
  const higher = readTileHead(madeUpTile({ ...flat, cells: 64, rows: 200 }));
  says(higher, { columns: 64, rows: 200 });
});

it('refuses a height that 32 bits cannot hold as it is', () => {
  const words = 'A made-up height has to fit 32 bits exactly, and 520.1 does not.';
  const tile = { ...NORTH_EAST, cells: 128, heightAt: () => 520.1 };
  assert.throws(() => madeUpTile(tile), { name: 'RangeError', message: words });
});

// fieldOf and changed, which change a made-up tile one statement at a time.
it('find a field by its tag, and change a copy of the tile, never the tile', () => {
  const tile = madeUpTile({ ...NORTH_EAST, cells: 128, heightAt: () => 520 });
  const view = new DataView(tile.buffer);
  // The directory begins at byte 192 with how many fields it has: the width is the first of the
  // nineteen, twelve bytes each, and the number for no height the last.
  assert.equal(fieldOf(view, 256), 194);
  assert.equal(fieldOf(view, 42113), 194 + 18 * 12);
  assert.throws(() => fieldOf(view, 65_000), { message: 'The tile has no field 65000.' });
  const narrower = changed(tile, (copy) => copy.setUint16(fieldOf(copy, 256) + 8, 64, true));
  assert.deepEqual([readTileHead(narrower).columns, readTileHead(tile).columns], [64, 128]);
});

// The recorded tiles: the four that meet at the origin, of the parked ground. None is copied
// here - but each is the parked product's recorded tile to the byte, by its length and its
// SHA-256 - written twice, and the short way: flat outside the two metres of its slope.
const AROUND = { minE: 2_599_998, maxE: 2_600_002, minN: 1_199_998, maxN: 1_200_002 };
const RECORDED = [
  [2599, 1199, 8069, 'b9e6dfbb3a17d0d1e17f8048d0fb65acb356e58b4ba07581e380f91c7378b4dc'],
  [2600, 1199, 7766, '523219109c07fb6cf05613b1b164f1944c03a0a1518143a12acd4af0606240fa'],
  [2599, 1200, 6885, '3676d815f2153cda9f2eee3cdda4f655110a2e64e35656ab11fcd848ba033989'],
  [2600, 1200, 7840, '984c100fdb3ee0dc4da6cee1daf434352e80fbb108f7d8e2fc9978ec1ab1d416'],
];
for (const [eastKm, northKm, length, sha256] of RECORDED) {
  const tile = { eastKm, northKm, heightAt: madeUpHeightM };
  it(`tile-${eastKm}-${northKm} is what the writer writes for the made-up ground`, () => {
    const written = madeUpTile(tile);
    const hash = createHash('sha256').update(written).digest('hex');
    assert.deepEqual([written.length, hash], [length, sha256]);
    assert.equal(same(madeUpTile(tile), written), true);
    assert.equal(same(madeUpTile({ ...tile, flatOutside: AROUND }), written), true);
  });
}

// A tile made up for the short way, small enough to count its cells: 300 cells wide and 200
// high from E 2 600 000, N 1 200 100, in blocks of 64 by 32 - 32 m by 16 m, five to a row and
// seven rows, the last of each cut off. In a box, every cell has a height of its own; outside
// it the ground is flat, 700 m in the first four rows of blocks and 710 m below them.
const shaped = (box, asked) => ({
  ...NORTH_EAST,
  columns: 300,
  rows: 200,
  northN: 1_200_100,
  blockColumns: 64,
  blockRows: 32,
  flatOutside: box,
  heightAt: (e, n) => {
    asked.push([e, n]);
    const inBox = e > box.minE && e < box.maxE && n > box.minN && n < box.maxN;
    if (inBox) return 600 + (e - 2_600_000) / 4 + (n - 1_200_000) / 1024;
    return n > 1_200_036 ? 700 : 710;
  },
});
const INSIDE = { minE: 2_600_030, maxE: 2_600_090, minN: 1_200_020, maxN: 1_200_070 };
const ON_EDGES = { minE: 2_600_032, maxE: 2_600_096, minN: 1_200_030, maxN: 1_200_068 };

it('writes a tile that is flat outside a box the short way, to the bytes of the slow way', () => {
  // The slow way asks for every cell. The short way asks cell by cell for the blocks that hold
  // ground of the box, and for one cell of each other of the 35. The first box ends inside
  // blocks on three sides and on a block's edge to the south: columns 60 to 179, rows 60 to 159,
  // in twelve blocks. The second the other way round: columns 64 to 191, rows 64 to 139, in six.
  const written = (box, blocks) => {
    const [slowly, shortly] = [[], []];
    const slow = madeUpTile({ ...shaped(box, slowly), flatOutside: undefined });
    assert.equal(same(madeUpTile(shaped(box, shortly)), slow), true);
    assert.deepEqual([slowly.length, shortly.length], [300 * 200, blocks * 64 * 32 + 35 - blocks]);
    return slow;
  };
  written(ON_EDGES, 6);
  const slow = written(INSIDE, 12);
  // And a tile that says what is not so is written as it says: told a box that ends a block
  // short of the heights, at column 128, the short way writes other bytes than the slow way.
  const told = { ...shaped(INSIDE, []), flatOutside: { ...INSIDE, maxE: 2_600_064 } };
  assert.equal(same(madeUpTile(told), slow), false);
});

it('tells a flat block from another by the bits of its height: 0 and -0 are two blocks', () => {
  // Two blocks side by side, the first of 0 m and the second of -0 m, which is other bytes.
  const heightAt = (e) => (e < 2_600_064 ? 0 : -0);
  const zeros = { ...NORTH_EAST, columns: 256, rows: 128, heightAt };
  const slow = madeUpTile(zeros);
  const [first, second] = readTileHead(slow).blocks;
  assert.notEqual(first.offset, second.offset);
  assert.deepEqual([cellsOf(slow, 0)(0, 0), cellsOf(slow, 1)(0, 0)], [0, -0]);
  assert.equal(same(madeUpTile({ ...zeros, flatOutside: AROUND }), slow), true);
});

it('writes the place of one block into the field itself, and finds no field between two', () => {
  // A tile of one block: where it lies and how long it is are one number each, which a field
  // holds itself. And the tile has the fields 262 and 277, and none between them.
  const tile = madeUpTile({ ...NORTH_EAST, cells: 128, heightAt: () => 520 });
  assert.deepEqual([cellsOf(tile, 0)(0, 0), cellsOf(tile, 0)(127, 127)], [520, 520]);
  const between = () => fieldOf(new DataView(tile.buffer), 270);
  assert.throws(between, { message: 'The tile has no field 270.' });
});

assert.equal(cases, 16);
process.stdout.write(
  `tools/sketch/swisstopo: a made-up tile states what a real tile does, field for field, and is the same bytes written twice and written the short way, cell by cell where it is not flat and nowhere else: ${cases} cases\n`,
);
