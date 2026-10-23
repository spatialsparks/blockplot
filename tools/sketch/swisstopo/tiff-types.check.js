// The check of the fields of a tile's directory (ST-031): tiff.js on every field whose type the
// reader checks, stated in every type it knows. In a type it does not read, the field is refused,
// whichever field and whichever type: a check that let one more type through fails a case here.
// In a type it reads, other than the one the made-up tile states, the field is read as the same
// numbers: a check that let one type fewer through fails a case too. And a field that is not as
// it has to be - a position stated twice, a cell size of two numbers, a key that holds its value
// elsewhere. Every case of the parked product's tiff.types.test.ts,
// packages/adapters/src/geodata/terrain/ - the table of fifteen fields, 35 refusals, and three
// readings - and of its tiff.checks.test.ts the cases of a field that is not as it has to be,
// thirteen, each under the title it has there and with the same figures: 51 (ADR-0052). And one
// case of the pad's own, at the end. Nothing runs and nothing is asked. Run by check.js, as
// every check is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { TextEncoder } from 'node:util';
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
const REFUSED = 'Not a tile of swissALTI3D as swisstopo publishes it: ';
/** That a tile is refused in these words, to the letter. */
const refuses = (bytes, reason) =>
  assert.throws(() => readTileHead(bytes), { name: 'Error', message: REFUSED + reason });

// A made-up tile of four blocks: 256 by 256 cells from E 2 600 000, N 1 200 128 south-eastward.
const FLAT = { eastKm: 2600, northKm: 1200, heightAt: () => 520 };
const SMALL = madeUpTile({ ...FLAT, cells: 256, northN: 1_200_128 });
// The field types the reader knows, by their numbers in TIFF 6.0.
const [ASCII, SHORT, LONG, DOUBLE] = [2, 3, 4, 12];
// The fields of one number: width, height, bits per cell, compression, samples, blocks, format.
const ONE_NUMBER = [256, 257, 258, 259, 277, 322, 323, 339];
// Every field whose type is checked: its tag, its name in a refusal, and the types it is read in.
const FIELDS = [
  [256, 'width', [SHORT, LONG]],
  [257, 'height', [SHORT, LONG]],
  [258, 'bits per cell', [SHORT, LONG]],
  [259, 'compression', [SHORT, LONG]],
  [277, 'samples per cell', [SHORT, LONG]],
  [317, 'predictor', [SHORT]],
  [322, 'block width', [SHORT, LONG]],
  [323, 'block height', [SHORT, LONG]],
  [324, 'block offsets', [SHORT, LONG]],
  [325, 'block sizes', [SHORT, LONG]],
  [339, 'sample format', [SHORT, LONG]],
  [33550, 'cell size', [DOUBLE]],
  [33922, 'position', [DOUBLE]],
  [34735, 'coordinate system', [SHORT]],
  [42113, 'value for no height', [ASCII]],
];
// Each field in each type it is not read in: its name, the type, and its tag.
const notReadIn = (types) => [ASCII, SHORT, LONG, DOUBLE].filter((type) => !types.includes(type));
const WRONG = FIELDS.flatMap(([tag, name, types]) =>
  notReadIn(types).map((type) => [name, type, tag]),
);

/** Where the values of a field lie that take more than the four bytes of the field. */
const valuesOf = (view, tag) => view.getUint32(fieldOf(view, tag) + 8, true);
/** A copy of SMALL in which a field is said to be of another type, or to hold this many values. */
const ofType = (tag, type) =>
  changed(SMALL, (view) => view.setUint16(fieldOf(view, tag) + 2, type, true));
const counting = (tag, count) =>
  changed(SMALL, (view) => view.setUint32(fieldOf(view, tag) + 4, count, true));
/** A copy of SMALL whose GeoTIFF key `key` says its value lies elsewhere: in the field `location`. */
const withKeyAt = (key, location) =>
  changed(SMALL, (view) => {
    const keys = valuesOf(view, 34735);
    for (let at = keys + 8; at < keys + 64; at += 8) {
      if (view.getUint16(at, true) === key) view.setUint16(at + 2, location, true);
    }
  });
/** A copy of SMALL that writes these bytes, six of them, where it has no height. */
const noDataWritten = (bytes) =>
  changed(SMALL, (view) => new Uint8Array(view.buffer).set(bytes, valuesOf(view, 42113)));
const written = (text) => noDataWritten(new TextEncoder().encode(text));
/** SMALL with its one position - 0, 0, 0, E, N, 0 - followed by a second, for cell 1, 1. */
function withTwoPositions() {
  const twice = new Uint8Array(SMALL.length + 12 * 8);
  twice.set(SMALL);
  const view = new DataView(twice.buffer);
  const positions = [0, 0, 0, 2_600_000, 1_200_128, 0, 1, 1, 0, 2_600_000.5, 1_200_127.5, 0];
  positions.forEach((value, index) => view.setFloat64(SMALL.length + index * 8, value, true));
  view.setUint32(fieldOf(view, 33922) + 4, positions.length, true);
  view.setUint32(fieldOf(view, 33922) + 8, SMALL.length, true);
  return twice;
}

// readTileHead, of every field it checks the type of, in every type it knows. The fifteen fields
// of the table: the eight of one number in ASCII and in DOUBLE, five others in three types each,
// and the offsets and the sizes of the blocks in two - 35 cases.
assert.deepEqual([FIELDS.length, WRONG.length], [15, 35]);
for (const [name, type, tag] of WRONG) {
  it(`refuses its ${name} stated as field type ${type}`, () => {
    refuses(ofType(tag, type), `its ${name} is of field type ${type}`);
  });
}

it('reads a number stated as a LONG as it reads a SHORT', () => {
  // A field of one number holds a SHORT in the first two of its four bytes and a LONG in all
  // four. The made-up tile's last two are zero: its type alone makes a SHORT a LONG.
  const asLongs = changed(SMALL, (view) => {
    for (const tag of ONE_NUMBER) view.setUint16(fieldOf(view, tag) + 2, LONG, true);
  });
  assert.deepEqual(readTileHead(asLongs), readTileHead(SMALL));
});

it('reads a SHORT as a number up to 65 535, and a byte of ASCII as one up to 255', () => {
  // The widest a SHORT states, 65 535 cells, in blocks of 128 are 512 a row and 1024 in all:
  // refused for the four the tile lists, in words that hold the number as it is stated.
  const widest = changed(SMALL, (view) => view.setUint16(fieldOf(view, 256) + 8, 65_535, true));
  refuses(
    widest,
    '65535 by 256 cells in blocks of 128 by 128 are 1024 blocks, and it lists 4 offsets and 4 sizes',
  );
  // A byte beyond ASCII where a tile writes its number for no height, 177, is the Latin-1
  // letter it is: "±9999" is no number, and is refused in words that hold it.
  const beyond = noDataWritten([177, ...new TextEncoder().encode('9999'), 0]);
  refuses(beyond, 'what it writes where it has no height is not a number: "±9999"');
});

it('reads the offsets and the sizes of the blocks stated as SHORTs as it reads LONGs', () => {
  // The tile is shorter than 65 536 bytes, so each of its four offsets and four sizes fits a
  // SHORT: written again as SHORTs where the LONGs began, eight bytes, still outside the field.
  assert.ok(SMALL.length < 65_536);
  const asShorts = changed(SMALL, (view) => {
    for (const tag of [324, 325]) {
      const entry = fieldOf(view, tag);
      const at = view.getUint32(entry + 8, true);
      const values = [0, 1, 2, 3].map((index) => view.getUint32(at + index * 4, true));
      values.forEach((value, index) => view.setUint16(at + index * 2, value, true));
      view.setUint16(entry + 2, SHORT, true);
    }
  });
  assert.deepEqual(readTileHead(asShorts), readTileHead(SMALL));
});

// readTileHead, of a field that is not as it has to be.
const NOT_AS_IT_HAS_TO_BE = [
  ['a width of a floating-point type', ofType(256, DOUBLE), 'its width is of field type 12'],
  ['a cell size of whole numbers', ofType(33550, LONG), 'its cell size is of field type 4'],
  ['a predictor of 32 bits', ofType(317, LONG), 'its predictor is of field type 4'],
  ['keys of 32 bits', ofType(34735, LONG), 'its coordinate system is of field type 4'],
  ['no-data as numbers', ofType(42113, SHORT), 'its value for no height is of field type 3'],
  [
    'offsets of a floating-point type',
    ofType(324, DOUBLE),
    'its block offsets is of field type 12',
  ],
];
for (const [what, bytes, reason] of NOT_AS_IT_HAS_TO_BE) {
  it(`refuses ${what}`, () => refuses(bytes, reason));
}

const NOT_ONCE = 'its position is not stated once, for its north-west corner: ';
it('refuses a position stated twice, or for a cell of another row', () => {
  const twice = '0, 0, 0, 2600000, 1200128, 0, 1, 1, 0, 2600000.5, 1200127.5, 0';
  refuses(withTwoPositions(), NOT_ONCE + twice);
  const rowOne = changed(SMALL, (view) => view.setFloat64(valuesOf(view, 33922) + 8, 1, true));
  refuses(rowOne, `${NOT_ONCE}0, 1, 0, 2600000, 1200128, 0`);
});

it('refuses a cell size of two numbers or of four', () => {
  refuses(counting(33550, 2), 'its cell size is 2 numbers, not 3');
  refuses(counting(33550, 4), 'its cell size is 4 numbers, not 3');
});

it('reads the width of a cell first, and its height second', () => {
  // Cells of 0.5 m from west to east and of 0.25 m from north to south are read as stated, so
  // that `windowOf` refuses the tile in words that have the two in their places.
  const flatter = changed(SMALL, (view) => view.setFloat64(valuesOf(view, 33550) + 8, 0.25, true));
  const { cellWidth, cellHeight } = readTileHead(flatter);
  assert.deepEqual({ cellWidth, cellHeight }, { cellWidth: 0.5, cellHeight: 0.25 });
});

it('counts the offsets and the sizes of the blocks each on its own', () => {
  const blocks = '256 by 256 cells in blocks of 128 by 128 are 4 blocks, and it lists';
  refuses(counting(324, 3), `${blocks} 3 offsets and 4 sizes`);
  refuses(counting(325, 3), `${blocks} 4 offsets and 3 sizes`);
});

it('counts the blocks of a tile that is not square, in blocks that are not square', () => {
  // 500 cells wide and 300 high in blocks of 128 by 64: 4 to a row and 5 rows, 20 blocks -
  // where its columns counted by the block's rows and its rows by the block's columns make 8
  // by 3. One offset fewer is refused with each of the four numbers in its place.
  const shape = { columns: 500, rows: 300, blockColumns: 128, blockRows: 64 };
  const tile = madeUpTile({ ...FLAT, ...shape, northN: 1_200_150 });
  const head = readTileHead(tile);
  assert.deepEqual(Object.fromEntries(Object.keys(shape).map((key) => [key, head[key]])), shape);
  assert.equal(head.blocks.length, 20);
  const fewer = changed(tile, (view) => view.setUint32(fieldOf(view, 324) + 4, 19, true));
  refuses(
    fewer,
    '500 by 300 cells in blocks of 128 by 64 are 20 blocks, and it lists 19 offsets and 20 sizes',
  );
});

it('reads a key only where it holds its value itself', () => {
  refuses(withKeyAt(3072, 34736), 'it states no projected coordinate system');
  refuses(withKeyAt(1025, 34736), 'it does not state that a cell is an area');
});

it('refuses a number for no height that is no text at all, or blanks', () => {
  // Read as a number, an empty text is 0: every cell at sea level would be no height.
  const noNumber = 'what it writes where it has no height is not a number: ';
  refuses(written('\0\0\0\0\0\0'), `${noNumber}""`);
  refuses(written('  \0\0\0\0'), `${noNumber}"  "`);
});

// And a case that the parked product has not: with the reader broken one thing at a time, one
// that left the last key of the list unread passed all of the cases above.
it('reads the last key of the list too', () => {
  // The seven keys follow four numbers, eight bytes each: the made-up tile states its projected
  // coordinate system in the sixth, and here in the seventh, the two keys having changed places.
  const swapped = changed(SMALL, (view) => {
    const [sixth, seventh] = [valuesOf(view, 34735) + 48, valuesOf(view, 34735) + 56];
    for (let at = 0; at < 8; at += 2) {
      const [one, other] = [view.getUint16(sixth + at, true), view.getUint16(seventh + at, true)];
      view.setUint16(sixth + at, other, true);
      view.setUint16(seventh + at, one, true);
    }
  });
  const view = new DataView(swapped.buffer);
  assert.equal(view.getUint16(valuesOf(view, 34735) + 56, true), 3072);
  assert.deepEqual(readTileHead(swapped), readTileHead(SMALL));
});

assert.equal(cases, 52);
process.stdout.write(
  `tools/sketch/swisstopo: of a tile's directory each of fifteen fields is refused in every type that it is not read in, 35 refusals, and read in every type that it is; and a field that is not as it has to be is refused in its words: ${cases} cases\n`,
);
