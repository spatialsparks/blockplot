// A made-up tile in the form that swisstopo publishes swissALTI3D in (ST-031), and what packs and
// changes one. Test support: no script of a page and no module of the server imports it - the
// checks do, and the made-up world of the stand-in, made-up.js. It is the parked product's
// testLzw.ts, testTile.ts and testDirectory.ts of packages/adapters/src/geodata/terrain/, written
// anew as the pad's: it imports one thing, of Node's own.
//
// The tile has the same beginning and the same directory as a real tile's first image, field for
// field, its cells in blocks of 128 by 128 - or of a size a check asks for - packed with LZW, each
// block between its length and its last four bytes again. Three things a real tile has it has
// not: the statistics of its heights, the three smaller copies of the image, which no reader
// reads, and a block of its own for every square - blocks that hold the same heights are written
// once and named as often as they are needed. That keeps a flat tile to a few kilobytes, and the
// tile says so where GDAL leaves its note on the layout: KNOWN_INCOMPATIBLE_EDITION=YES. No
// service sent it.
import { createHash } from 'node:crypto';

// The two codes that TIFF's LZW sets aside - to empty the table, and for the end of a block - the
// first that a block makes up, and the bits a code is written with at first: as lzw.js reads them.
const [CLEAR, END, FIRST_OWN_CODE, NARROWEST_BITS] = [256, 257, 258, 9];
// libtiff empties its table once the next code to make would be this one.
const TABLE_IS_FULL_AT = 4094;

/**
 * Packs bytes into one block of TIFF's LZW, the other way round from `decodeLzw` and the way
 * libtiff does, so that a made-up tile is packed like a real one: a code to empty the table, then
 * a code for every longest run that is in the table already - each making the run and its next
 * byte a new code - and the code for the end. Codes are written from the highest bit down, nine
 * bits wide at first and a bit wider as soon as the table would outgrow the width. The reader is
 * proved on what libtiff itself wrote, not on this alone.
 */
export function packLzw(bytes) {
  const packed = [];
  let [held, heldBits, bits] = [0, 0, NARROWEST_BITS];
  const write = (code) => {
    held = (held << bits) | code;
    heldBits += bits;
    while (heldBits >= 8) {
      heldBits -= 8;
      packed.push((held >>> heldBits) & 0xff);
    }
    held &= (1 << heldBits) - 1;
  };
  // After every code but the first, the reader makes a new one: the width follows its table.
  let [nextCode, codeOf] = [FIRST_OWN_CODE, new Map()];
  const count = () => {
    nextCode += 1;
    if (nextCode === TABLE_IS_FULL_AT) {
      write(CLEAR);
      codeOf = new Map();
      nextCode = FIRST_OWN_CODE;
      bits = NARROWEST_BITS;
    } else if (nextCode === 1 << bits) {
      bits += 1;
    }
  };

  write(CLEAR);
  // The code of the run read so far.
  let run;
  for (let at = 0; at < bytes.length; at += 1) {
    const byte = bytes[at];
    if (run === undefined) {
      run = byte;
      continue;
    }
    // A run and its next byte, as one number: the run's code above the byte's eight bits.
    const longer = (run << 8) | byte;
    const known = codeOf.get(longer);
    if (known !== undefined) {
      run = known;
      continue;
    }
    write(run);
    codeOf.set(longer, nextCode);
    count();
    run = byte;
  }
  if (run !== undefined) {
    write(run);
    count();
  }
  write(END);
  if (heldBits > 0) packed.push((held << (8 - heldBits)) & 0xff);
  return Uint8Array.from(packed);
}

// The cells of a real tile's block each way, and what a real tile writes where it has no height.
const BLOCK_CELLS = 128;
const NO_DATA = '-9999';
// How a real tile begins after its first eight bytes, but for the last word: there it says NO.
const LAYOUT =
  'GDAL_STRUCTURAL_METADATA_SIZE=000140 bytes\nLAYOUT=IFDS_BEFORE_DATA\nBLOCK_ORDER=ROW_MAJOR\n' +
  'BLOCK_LEADER=SIZE_AS_UINT4\nBLOCK_TRAILER=LAST_4_BYTES_REPEATED\n' +
  'KNOWN_INCOMPATIBLE_EDITION=YES\n\0';
// What a real tile says of its numbers, without the statistics it adds: those would be false.
const METADATA =
  '<GDALMetadata>\n  <Item name="UNITTYPE" sample="0" role="unittype">metre</Item>\n</GDALMetadata>\n\0';
// The types of a field, by their numbers in TIFF 6.0.
const [ASCII, SHORT, LONG, DOUBLE] = [2, 3, 4, 12];

// Numbers as the bytes of a file, low byte first: by how many bytes one takes, how it is written.
const WRITTEN_BY = { 2: 'setUint16', 4: 'setUint32', 8: 'setFloat64' };
const numbers = (size, values) => {
  const bytes = new Uint8Array(values.length * size);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => view[WRITTEN_BY[size]](index * size, value, true));
  return bytes;
};
const shorts = (...values) => numbers(2, values);
const longs = (values) => numbers(4, values);
const doubles = (...values) => numbers(8, values);
const ascii = (text) => Uint8Array.from(text, (character) => character.charCodeAt(0));
// A height by the 32 bits that hold it: 0 and -0 are two, where a comparison takes them for one.
const bitsOf = (height) => new Uint32Array(Float32Array.of(height).buffer)[0];

/** The keys of GeoTIFF a real tile states, with the coordinate system in the one before last. */
const geoKeys = (epsg) =>
  shorts(
    ...[1, 1, 0, 7],
    ...[1024, 0, 1, 1],
    ...[1025, 0, 1, 1],
    ...[1026, 34737, 15, 0],
    ...[2049, 34737, 8, 15],
    ...[2054, 0, 1, 9102],
    ...[3072, 0, 1, epsg],
    ...[3076, 0, 1, 9001],
  );

/**
 * The made-up tile as the bytes of its file: a square kilometre of 2000 by 2000 cells, unless it
 * says otherwise. `tile` says `eastKm` and `northKm`, the kilometre its south-west corner lies at,
 * and `heightAt(e, n)`, the height of the cell whose middle lies there, in metres: a number that
 * 32 bits can hold. And, each in place of what a real tile has, for a tile that is to be refused
 * or is not square: `epsg`, `cellSizeM`, `cells` - and `columns` and `rows`, each in place of
 * `cells` in its own direction - `westE` and `northN`, its north-west corner, and `blockColumns`
 * and `blockRows`, the cells of a block.
 *
 * It takes one thing more, `flatOutside`: a box `{ minE, maxE, minN, maxN }` outside of which the
 * tile says that its ground is flat. A block that holds no ground of the box is then not worked
 * out cell by cell: its cells all get the height of its first one, which is asked for once. So a
 * tile of four million cells is written in some milliseconds, and its bytes are what the slow way
 * writes - of a tile that says what is so.
 */
export function madeUpTile(tile) {
  const cellSizeM = tile.cellSizeM ?? 0.5;
  const columns = tile.columns ?? tile.cells ?? 1000 / cellSizeM;
  const rows = tile.rows ?? tile.cells ?? 1000 / cellSizeM;
  const westE = tile.westE ?? tile.eastKm * 1000;
  const northN = tile.northN ?? (tile.northKm + 1) * 1000;
  const blockColumns = tile.blockColumns ?? BLOCK_CELLS;
  const blockRows = tile.blockRows ?? BLOCK_CELLS;
  const [across, down] = [Math.ceil(columns / blockColumns), Math.ceil(rows / blockRows)];
  const heightOf = (column, row) => {
    const e = westE + (column + 0.5) * cellSizeM;
    const height = tile.heightAt(e, northN - (row + 0.5) * cellSizeM);
    // NaN is a number 32 bits hold, though it equals nothing - itself neither.
    if (!Object.is(Math.fround(height), height)) {
      throw new RangeError(`A made-up height has to fit 32 bits exactly, and ${height} does not.`);
    }
    return height;
  };
  // Whether a block holds no ground of the box that the tile is flat outside of: a block by the
  // cell of the tile it begins at, and by how many columns and rows of the tile lie in it.
  const outside = ([column, row], [columnCount, rowCount], box = tile.flatOutside) => {
    if (box === undefined) return false;
    const [west, north] = [westE + column * cellSizeM, northN - row * cellSizeM];
    const [east, south] = [west + columnCount * cellSizeM, north - rowCount * cellSizeM];
    return east <= box.minE || west >= box.maxE || north <= box.minN || south >= box.maxN;
  };
  // The cells of a block as its bytes, row by row from its north-west cell: each by its own
  // height - or all by the one height `flat`. Beyond the last column and the last row of the
  // tile a block is filled up with zeros.
  const bytesOf = ([column, row], [columnCount, rowCount], flat) => {
    const bytes = new Uint8Array(blockColumns * blockRows * 4);
    const view = new DataView(bytes.buffer);
    for (let at = 0; at < columnCount * rowCount; at += 1) {
      const [along, below] = [at % columnCount, Math.floor(at / columnCount)];
      const height = flat ?? heightOf(column + along, row + below);
      view.setFloat32((below * blockColumns + along) * 4, height, true);
    }
    return bytes;
  };
  // Every block of cells, row by row, packed - but a block that holds the same heights as one
  // before it is that one again: `placed` says which of the packed blocks a block's bytes are.
  const packed = [];
  const [packedAs, flatAs] = [new Map(), new Map()];
  const placed = (bytes) => {
    const key = createHash('sha256').update(bytes).digest('hex');
    if (!packedAs.has(key)) packedAs.set(key, packed.push(packLzw(bytes)) - 1);
    return packedAs.get(key);
  };
  const blockIs = [];
  for (let block = 0; block < across * down; block += 1) {
    const from = [(block % across) * blockColumns, Math.floor(block / across) * blockRows];
    const holds = [Math.min(blockColumns, columns - from[0]), Math.min(blockRows, rows - from[1])];
    if (!outside(from, holds)) {
      blockIs.push(placed(bytesOf(from, holds)));
      continue;
    }
    // The short way: one height, asked for once - and a block of that height and of as many
    // cells of the tile was worked out before, or is now.
    const height = heightOf(...from);
    const flat = [bitsOf(height), ...holds].join();
    if (!flatAs.has(flat)) flatAs.set(flat, placed(bytesOf(from, holds, height)));
    blockIs.push(flatAs.get(flat));
  }

  // The directory's fields in the order of their tags, as a real tile has them, and then where
  // everything lies: the directory at byte 192, its longer values after it, the blocks last.
  const offsets = new Uint8Array(blockIs.length * 4);
  const byteCounts = new Uint8Array(blockIs.length * 4);
  const fields = [
    [256, SHORT, 1, shorts(columns)],
    [257, SHORT, 1, shorts(rows)],
    [258, SHORT, 1, shorts(32)],
    [259, SHORT, 1, shorts(5)],
    [262, SHORT, 1, shorts(1)],
    [277, SHORT, 1, shorts(1)],
    [284, SHORT, 1, shorts(1)],
    [317, SHORT, 1, shorts(1)],
    [322, SHORT, 1, shorts(blockColumns)],
    [323, SHORT, 1, shorts(blockRows)],
    [324, LONG, blockIs.length, offsets],
    [325, LONG, blockIs.length, byteCounts],
    [339, SHORT, 1, shorts(3)],
    [33550, DOUBLE, 3, doubles(cellSizeM, cellSizeM, 0)],
    [33922, DOUBLE, 6, doubles(0, 0, 0, westE, northN, 0)],
    [34735, SHORT, 32, geoKeys(tile.epsg ?? 2056)],
    [34737, ASCII, 24, ascii('CH1903+ / LV95|CH1903+|\0')],
    [42112, ASCII, METADATA.length, ascii(METADATA)],
    [42113, ASCII, NO_DATA.length + 1, ascii(`${NO_DATA}\0`)],
  ];
  const directory = 8 + LAYOUT.length;
  let end = directory + 2 + fields.length * 12 + 4;
  const lies = new Map();
  // A real tile puts its metadata first and its two lists of blocks last; each on an even byte.
  for (const tag of [42112, 42113, 33550, 33922, 34735, 34737, 324, 325]) {
    const value = fields.find((field) => field[0] === tag)[3];
    if (value.length <= 4) continue;
    end += end % 2;
    lies.set(tag, end);
    end += value.length;
  }
  const dataLies = packed.map((block) => {
    const at = end + 4;
    end += 4 + block.length + 4;
    return at;
  });
  offsets.set(longs(blockIs.map((index) => dataLies[index])));
  byteCounts.set(longs(blockIs.map((index) => packed[index].length)));

  const file = new Uint8Array(end);
  const view = new DataView(file.buffer);
  file.set(ascii('II'));
  view.setUint16(2, 42, true);
  view.setUint32(4, directory, true);
  file.set(ascii(LAYOUT), 8);
  view.setUint16(directory, fields.length, true);
  fields.forEach(([tag, type, count, value], index) => {
    const entry = directory + 2 + index * 12;
    view.setUint16(entry, tag, true);
    view.setUint16(entry + 2, type, true);
    view.setUint32(entry + 4, count, true);
    const at = lies.get(tag) ?? entry + 8;
    if (lies.has(tag)) view.setUint32(entry + 8, at, true);
    file.set(value, at);
  });
  packed.forEach((block, index) => {
    const at = dataLies[index];
    view.setUint32(at - 4, block.length, true);
    file.set(block, at);
    file.set(block.subarray(-4), at + block.length);
  });
  return file;
}

/**
 * Where the field with this tag begins in the tile's first directory - for a made-up tile with
 * one statement changed, in the checks of what the reader refuses. A field is twelve bytes: its
 * tag, its type, how many values, and the values themselves where they fit into four bytes, or
 * else where they lie.
 */
export function fieldOf(view, tag) {
  const directory = view.getUint32(4, true);
  for (let index = 0; index < view.getUint16(directory, true); index += 1) {
    const entry = directory + 2 + index * 12;
    if (view.getUint16(entry, true) === tag) return entry;
  }
  throw new Error(`The tile has no field ${tag}.`);
}

/** A copy of `tile` that a change was made to: the tile itself stays as it was. */
export function changed(tile, change) {
  const copy = tile.slice();
  change(new DataView(copy.buffer));
  return copy;
}
