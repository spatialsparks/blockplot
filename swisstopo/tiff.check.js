// The check of a tile's directory (ST-031): tiff.js on what a real tile states of itself - its
// first 4512 bytes, recorded at the origin of the Swiss grid in Bern - and on made-up tiles in
// which one statement is changed at a time, for everything that has to be refused: where a check
// of the reader is broken, that tile is read, or refused for another reason, and a case fails.
// Every case of the parked product's tiff.test.ts, packages/adapters/src/geodata/terrain/, and of
// its tiff.checks.test.ts the cases of the size of a block and of a file that ends where it
// begins - those of a field that is not as it has to be are tiff-types.check.js's - each under
// the title it has there, on the same bytes and with the same figures: 34. And nine cases of
// the pad's own, at the end. Nothing runs and nothing is asked. Run by check.js, as every check
// is.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { TextEncoder } from 'node:util';
import { changed, fieldOf, madeUpTile } from './made-up-tile.js';
import { MAX_BLOCK_CELLS, readTileHead } from './tiff.js';

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
const REFUSED = 'Not a tile of swissALTI3D as swisstopo publishes it: ';
/** That a tile is refused in these words, to the letter. */
const refuses = (bytes, reason) =>
  assert.throws(() => readTileHead(bytes), { name: 'Error', message: REFUSED + reason });
/** What a head says of the fields that `part` names, held to them. */
const says = (head, part) =>
  assert.deepEqual(Object.fromEntries(Object.keys(part).map((key) => [key, head[key]])), part);

const realHead = () =>
  new Uint8Array(
    fs.readFileSync(path.join(import.meta.dirname, '__fixtures__', 'real', 'head-2600-1200.tif')),
  );
// A made-up tile of four blocks: 256 by 256 cells from E 2 600 000, N 1 200 128 south-eastward.
const FLAT = { eastKm: 2600, northKm: 1200, heightAt: () => 520 };
const SMALL = madeUpTile({ ...FLAT, cells: 256, northN: 1_200_128 });
// A made-up tile of one block of 128 by 128 cells - one block, whatever size it states.
const ONE_BLOCK = madeUpTile({ ...FLAT, cells: 128 });
const [SHORT, LONG] = [3, 4];

/** Where the values of a field lie that take more than the four bytes of the field. */
const valuesOf = (view, tag) => view.getUint32(fieldOf(view, tag) + 8, true);
/** A copy in which the field with this tag states another number: one of 16 bits, in the field. */
const stating = (tag, value) =>
  changed(SMALL, (view) => view.setUint16(fieldOf(view, tag) + 8, value, true));
/** A copy in which the field with this tag says it holds this many numbers. */
const counting = (tag, count) =>
  changed(SMALL, (view) => view.setUint32(fieldOf(view, tag) + 4, count, true));
/** A copy without the field with this tag: it carries a tag that nothing reads. */
const without = (tag) => changed(SMALL, (view) => view.setUint16(fieldOf(view, tag), 65_000, true));
/**
 * A copy whose GeoTIFF key `key` has another value - or, given none, another name, so that the
 * key is gone. The seven keys follow four numbers, and are four numbers each: the name first,
 * the value last.
 */
const withGeoKey = (key, value) =>
  changed(SMALL, (view) => {
    const keys = valuesOf(view, 34735);
    for (let at = keys + 8; at < keys + 64; at += 8) {
      if (view.getUint16(at, true) !== key) continue;
      if (value === undefined) view.setUint16(at, 60_000, true);
      else view.setUint16(at + 6, value, true);
    }
  });
/** A copy of `tile` whose fields with these tags state these numbers, as a SHORT or as a LONG. */
const sized = (tile, numbers) =>
  changed(tile, (view) => {
    for (const [tag, value] of Object.entries(numbers)) {
      const entry = fieldOf(view, Number(tag));
      view.setUint16(entry + 2, value > 0xffff ? LONG : SHORT, true);
      view.setUint32(entry + 8, value, true);
    }
  });

// readTileHead.
it('reads what a real tile states of itself', () => {
  const head = readTileHead(realHead());
  // The square kilometre north-east of the origin: its north-west corner, 2000 cells of 0.5 m
  // each way, in LV95 - and -9999 wherever swisstopo has no height.
  assert.deepEqual(
    { ...head, blocks: head.blocks.length },
    {
      columns: 2000,
      rows: 2000,
      blockColumns: 128,
      blockRows: 128,
      blocks: 256,
      westE: 2_600_000,
      northN: 1_201_000,
      cellWidth: 0.5,
      cellHeight: 0.5,
      epsg: 2056,
      noData: -9999,
    },
  );
  // Sixteen blocks a row, the rows from the north: the first is the north-west corner's, the
  // 241st the south-west corner's - the block the origin lies in - and each of them ends
  // eight bytes before the next begins, the last one four bytes before the end of the file.
  assert.deepEqual(head.blocks[0], { offset: 4_172_466, byteCount: 48_666 });
  assert.deepEqual(head.blocks[1], { offset: 4_172_466 + 48_666 + 8, byteCount: 57_257 });
  assert.deepEqual(head.blocks[240], { offset: 15_493_634, byteCount: 32_810 });
  assert.deepEqual(head.blocks[255], { offset: 15_969_669 - 4 - 20_998, byteCount: 20_998 });
});

it('reads a made-up tile as it was made up, whatever it was made to state', () => {
  const cell = { cellWidth: 0.5, cellHeight: 0.5, epsg: 2056, noData: -9999 };
  const place = { westE: 2_600_000, northN: 1_200_128 };
  says(readTileHead(SMALL), { columns: 256, rows: 256, blockColumns: 128, blockRows: 128 });
  says(readTileHead(SMALL), { ...place, ...cell });
  // Every block of a flat tile is the same one, written once: four names for one place.
  const { blocks } = readTileHead(SMALL);
  assert.equal(blocks.length, 4);
  assert.equal(new Set(blocks.map((block) => block.offset)).size, 1);

  const elsewhere = { eastKm: 600, northKm: 200, epsg: 21781, cellSizeM: 2, heightAt: () => 520 };
  const other = readTileHead(madeUpTile(elsewhere));
  says(other, { columns: 500, rows: 500, westE: 600_000, northN: 201_000 });
  says(other, { cellWidth: 2, cellHeight: 2, epsg: 21781 });
  assert.equal(other.blocks.length, 16);
});

it('reads from the beginning of a file alone, and leaves out a number for no height that is not there', () => {
  // The directory of a real tile ends 3836 bytes in, where the lists of the smaller copies begin.
  const real = realHead();
  assert.deepEqual(readTileHead(real.subarray(0, 3836)), readTileHead(real));
  assert.equal(Object.hasOwn(readTileHead(without(42113)), 'noData'), false);
});

// What three kinds of refusal begin with, and the one that is longer than its line.
const BEGINS = 'it does not begin as one does, with 49 49 2a 00, but with ';
const WITHIN = 'its directory does not lie within its first ';
const NO_CELL = 'a cell is not one 32-bit floating-point number, but ';
const WIDER =
  '4000 by 256 cells in blocks of 128 by 128 are 64 blocks, and it lists 4 offsets and 4 sizes';
const XML = new TextEncoder().encode('<?xml version="1.0"?><Error/>');
const HIGH_FIRST = Uint8Array.of(0x4d, 0x4d, 0, 42, 0, 0, 0, 8);
const EIGHT_BYTES = Uint8Array.of(0x49, 0x49, 43, 0, 8, 0, 0, 0);
const REFUSED_FILES = [
  ['is an XML document', XML, `${BEGINS}3c 3f 78 6d`],
  ['is nothing', new Uint8Array(), `${BEGINS}nothing`],
  ['has its numbers high byte first', HIGH_FIRST, `${BEGINS}4d 4d 00 2a`],
  ['has offsets of eight bytes', EIGHT_BYTES, `${BEGINS}49 49 2b 00`],
  ['is cut off in its directory', SMALL.subarray(0, 300), `${WITHIN}300 bytes`],
  ['is cut off in its list of blocks', SMALL.subarray(0, 600), `${WITHIN}600 bytes`],
  ['is packed another way', stating(259, 8), 'it is packed by method 8, and only LZW, 5, is read'],
  ['stores differences', stating(317, 3), 'its cells are stored as differences, by predictor 3'],
  ['has cells of 64 bits', stating(258, 64), `${NO_CELL}1 of 64 bits in sample format 3`],
  ['has whole numbers for cells', stating(339, 1), `${NO_CELL}1 of 32 bits in sample format 1`],
  ['has three numbers a cell', stating(277, 3), `${NO_CELL}3 of 32 bits in sample format 3`],
  ['is wider than its blocks account for', stating(256, 4000), WIDER],
  ['states two widths', counting(256, 2), 'it states 2 numbers as its width, where one is read'],
  [
    'states a compression of no number',
    counting(259, 0),
    'it states 0 numbers as its compression, where one is read',
  ],
  ['is not stored in blocks', without(322), 'it states no block width'],
  ['states no position', without(33922), 'it states no position'],
  ['states no cell size', without(33550), 'it states no cell size'],
  ['states no coordinate system at all', without(34735), 'it states no coordinate system'],
  [
    'states no projected coordinate system',
    withGeoKey(3072),
    'it states no projected coordinate system',
  ],
  ['has a cell for a point', withGeoKey(1025, 2), 'it does not state that a cell is an area'],
  ['does not say what a cell is', withGeoKey(1025), 'it does not state that a cell is an area'],
];
for (const [what, bytes, reason] of REFUSED_FILES) {
  it(`refuses a file that ${what}`, () => refuses(bytes, reason));
}

it('refuses a position that is not the north-west corner’s, and a number for no height that is none', () => {
  const elsewhere = changed(SMALL, (view) => view.setFloat64(valuesOf(view, 33922), 1, true));
  const stated = '1, 0, 0, 2600000, 1200128, 0';
  refuses(elsewhere, `its position is not stated once, for its north-west corner: ${stated}`);
  const noNumber = changed(SMALL, (view) => {
    new Uint8Array(view.buffer).set(new TextEncoder().encode('none\0\0'), valuesOf(view, 42113));
  });
  refuses(noNumber, 'what it writes where it has no height is not a number: "none"');
});

// readTileHead, of the size of a block.
it('reads a block of MAX_BLOCK_CELLS cells, square or not', () => {
  assert.equal(MAX_BLOCK_CELLS, 512 * 512);
  for (const [blockColumns, blockRows] of [
    [512, 512],
    [2048, 128],
    [128, 2048],
  ]) {
    const head = readTileHead(sized(ONE_BLOCK, { 322: blockColumns, 323: blockRows }));
    says(head, { columns: 128, rows: 128, blockColumns, blockRows });
    assert.equal(head.blocks.length, 1);
  }
});

const TOO_LARGE = [
  ['one cell more than the ceiling', 512, 513],
  ['one cell more, the other way round', 513, 512],
  ['8192 by 8192 cells, 256 MB unpacked', 8192, 8192],
  ['four thousand million cells each way', 4_000_000_000, 4_000_000_000],
];
for (const [what, blockColumns, blockRows] of TOO_LARGE) {
  it(`refuses a block of ${what}, before it is asked for`, () => {
    // 128 by 128 cells are one block of any of these sizes, and the directory lists one: nothing
    // but the size of the block is wrong.
    const tile = sized(ONE_BLOCK, { 322: blockColumns, 323: blockRows });
    const size = `${blockColumns} by ${blockRows}`;
    refuses(
      tile,
      `it states blocks of ${size} cells, and a block of more than 262144 cells is not read`,
    );
  });
}

it('says that a block of no cells holds none, not that a tile is infinitely many', () => {
  refuses(sized(SMALL, { 322: 0 }), 'it states blocks of 0 by 128 cells, which hold none');
  refuses(sized(SMALL, { 323: 0 }), 'it states blocks of 128 by 0 cells, which hold none');
});

// readTileHead, of a file that ends where it begins.
const endsAfter = (count) =>
  `it ends after ${count} bytes, before it says where its directory lies`;
const SHORT_FILES = [
  ['seven bytes', SMALL.subarray(0, 7), endsAfter(7)],
  ['four bytes', SMALL.subarray(0, 4), endsAfter(4)],
  ['three bytes', SMALL.subarray(0, 3), `${BEGINS}49 49 2a`],
];
for (const [what, bytes, reason] of SHORT_FILES) {
  it(`says what is the case of a tile of ${what}`, () => refuses(bytes, reason));
}

// And seven cases that the parked product has not: with the reader broken one thing at a time,
// each of seven breaks passed all of the cases above - a bound that is a byte off, or is held to
// fewer bytes than a list takes; a count and a place read as two bytes where they are four; and
// what a tile is taken to say of a predictor where it says nothing.
const CUT = [
  ['ends where its directory begins', EIGHT_BYTES.with(2, 42), 8],
  ['is cut off in its list of fields', SMALL.subarray(0, 400), 400],
  ['is cut off within its list of blocks', SMALL.subarray(0, 700), 700],
  ['is cut off a byte before its directory ends', realHead().subarray(0, 3835), 3835],
  ['states 65 537 widths, and holds none of them', counting(256, 65_537), SMALL.length],
];
for (const [what, bytes, length] of CUT) {
  it(`refuses a file that ${what}`, () => refuses(bytes, `${WITHIN}${length} bytes`));
}

it('reads a tile that states no predictor: none is what a TIFF has then', () => {
  assert.deepEqual(readTileHead(without(317)), readTileHead(SMALL));
});

it('reads where its directory lies as a number of four bytes', () => {
  // The tile again, with its directory - nineteen fields, 234 bytes from byte 192 - moved 65 536
  // bytes on, and nothing left where it lay. The values that the fields name lie where they lay.
  const [lay, ends, on] = [192, 192 + 2 + 19 * 12 + 4, 65_536];
  const far = new Uint8Array(on + SMALL.length);
  far.set(SMALL);
  far.copyWithin(on + lay, lay, ends).fill(0, lay, ends);
  new DataView(far.buffer).setUint32(4, on + lay, true);
  assert.deepEqual(readTileHead(far), readTileHead(SMALL));
});

// And two where the pad's reader is stricter than the parked one (T-031.4): a text of the tile
// is repeated as JSON writes a text, and cut to eighty characters before it is written.
const NO_NUMBER = 'what it writes where it has no height is not a number: ';
it('writes out a sign of a tile that could steer a terminal, and a quote', () => {
  // ESC [ 2 J, which clears a screen; and the sign 155, which begins the same order alone, with
  // a quote and the sign 127 after it. Each is written by its number, as JSON writes one.
  const ESCAPE = [[0x1b, 0x5b, 0x32, 0x4a, 0x78, 0], '"\\u001b[2Jx"'];
  const ALONE = [[0x9b, 0x32, 0x4a, 0x22, 0x7f, 0], '"\\u009b2J\\"\\u007f"'];
  for (const [bytes, written] of [ESCAPE, ALONE]) {
    const text = (view) => new Uint8Array(view.buffer).set(bytes, valuesOf(view, 42113));
    refuses(changed(SMALL, text), NO_NUMBER + written);
  }
});

it('repeats eighty characters of a text of a tile, cut before they are written', () => {
  // A hundred characters where the tile has six, after its last byte: 79 letters, then ESC -
  // the eightieth, written whole - and twenty more, of which none is repeated.
  const long = new Uint8Array(SMALL.length + 100).fill(0x78);
  long.set(SMALL);
  long[SMALL.length + 79] = 0x1b;
  const view = new DataView(long.buffer);
  view.setUint32(fieldOf(view, 42113) + 4, 100, true);
  view.setUint32(fieldOf(view, 42113) + 8, SMALL.length, true);
  refuses(long, `${NO_NUMBER}"${'x'.repeat(79)}\\u001b"`);
});

assert.equal(cases, 43);
process.stdout.write(
  `tools/sketch/swisstopo: a tile's directory is read as a real tile states it - 2000 by 2000 cells in 256 blocks of 128 by 128, from E 2 600 000, N 1 201 000, of 0.5 m, in EPSG 2056, with -9999 for no height - and every other form is refused with why: ${cases} cases\n`,
);
