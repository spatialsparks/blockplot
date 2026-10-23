// The directory of a swissALTI3D tile (ST-031): what a GeoTIFF says of itself in its first bytes -
// how many cells it has, where its blocks lie in the file, where its cells lie on the ground. It
// reads the one form that swisstopo publishes and refuses every other with the reason: nothing is
// guessed, and nothing is read that the tile does not state. That form: a little-endian TIFF with
// offsets of four bytes, its cells one 32-bit floating-point number each, packed with LZW and
// without a predictor, in blocks, with its position stated once, for its north-west corner, a
// cell being an area. It is the parked product's reader,
// packages/adapters/src/geodata/terrain/tiff.ts, written anew as the pad's - a module that
// imports nothing - with its limits and its refusals to the word (ADR-0045, ADR-0048, ADR-0052).
// In one thing it is stricter: a text of the tile is repeated quoted and cut, never as it stands.
//
// What a tile states, as `readTileHead` gives it - its first row of cells is the northernmost:
//   columns, rows             how many cells it has from west to east, and from north to south
//   blockColumns, blockRows   how many cells a block has each way; the last block of a row or of
//                             a column is filled up
//   blocks                    each `{ offset, byteCount }`, where its bytes lie in the file: row
//                             by row from the north-west corner, in each row from west to east
//   westE, northN             the outer edges of the north-west cell: an easting and a northing
//   cellWidth, cellHeight     the side of a cell from west to east, and from north to south
//   epsg                      the projected coordinate system of the positions, by its EPSG code
//   noData                    the number that stands where the tile has no height - left out
//                             where it names none

/**
 * The most cells a block may have: 512 by 512, sixteen times the 128 by 128 of a real tile. A
 * block is unpacked whole, four bytes a cell, into the room its directory states - a megabyte at
 * this ceiling, where a block of 8192 by 8192 cells, 200 kB as sent, names 256 MB. A larger block
 * is refused with the directory, before any block is asked for. Why this number: ADR-0048.
 */
export const MAX_BLOCK_CELLS = 512 * 512;

// The fields of the directory that are read, by the tag each has in TIFF 6.0 and in GeoTIFF.
const TAG = Object.freeze({
  columns: 256,
  rows: 257,
  bitsPerCell: 258,
  compression: 259,
  samplesPerCell: 277,
  predictor: 317,
  blockColumns: 322,
  blockRows: 323,
  blockOffsets: 324,
  blockByteCounts: 325,
  sampleFormat: 339,
  cellSize: 33550,
  tiepoint: 33922,
  geoKeys: 34735,
  noData: 42113,
});

// The kinds of value that are read, by their TIFF field type, with the bytes one takes.
const ASCII = 2;
const SHORT = 3;
const LONG = 4;
const DOUBLE = 12;
const BYTES_OF = Object.freeze({ [ASCII]: 1, [SHORT]: 2, [LONG]: 4, [DOUBLE]: 8 });

// What the tile has to be: LZW, one 32-bit floating-point number a cell, a cell being an area.
const LZW = 5;
const FLOATING_POINT = 3;
const RASTER_TYPE_KEY = 1025;
const CELL_IS_AREA = 1;
const PROJECTED_SYSTEM_KEY = 3072;

function refuse(reason) {
  throw new Error(`Not a tile of swissALTI3D as swisstopo publishes it: ${reason}`);
}

// How much of a text of the tile a refusal repeats: "-9999" is 5.
const REPEATED_CHARACTERS = 80;

/**
 * A text of the tile, as a refusal repeats it: its beginning, cut before it is written, and
 * written as JSON writes a text - in quotes, a plain text word for word, and a sign that could
 * steer a terminal by its number. JSON leaves the signs from 127 to 159 as they are, and a byte
 * of a tile can be one: those are written the same way. So no sign of a tile reaches an error of
 * the pad's server as it came - where the parked reader repeats the text as it stands.
 */
const quoted = (text) =>
  JSON.stringify(text.slice(0, REPEATED_CHARACTERS)).replace(
    /[\x7f-\x9f]/g,
    (sign) => `\\u${sign.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );

/**
 * The keys of GeoTIFF that hold their value themselves: after a header of four numbers, each key
 * is four - its id, where its value lies (0: right here), how many, and the value.
 */
function geoKeys(directory) {
  const keys = new Map();
  for (let at = 4; at + 3 < directory.length; at += 4) {
    const [id, location, , value] = directory.slice(at, at + 4);
    if (location === 0) keys.set(id, value);
  }
  return keys;
}

/** The number GDAL writes as text for "no height here", as "-9999" - or that there is none. */
function noDataOf(characters) {
  if (characters === undefined) return undefined;
  const text = String.fromCharCode(...characters).replace(/\0+$/, '');
  const value = Number(text);
  if (text.trim() === '' || Number.isNaN(value)) {
    refuse(`what it writes where it has no height is not a number: ${quoted(text)}`);
  }
  return value;
}

/**
 * Reads the directory of a tile from its first bytes - `bytes` is the beginning of the file, as
 * much of it as was asked for. A tile whose directory reaches further is refused, and so is one
 * whose blocks have more than `MAX_BLOCK_CELLS` cells.
 */
export function readTileHead(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const within = (at, byteCount) => {
    if (at + byteCount > bytes.length) {
      refuse(`its directory does not lie within its first ${bytes.length} bytes`);
    }
    return at;
  };
  // "II" and 42: a TIFF with its numbers low byte first and its offsets in four bytes.
  if (bytes.length < 4 || view.getUint32(0, true) !== 0x002a4949) {
    const begins = Array.from(bytes.subarray(0, 4), (byte) => byte.toString(16).padStart(2, '0'));
    refuse(
      `it does not begin as one does, with 49 49 2a 00, but with ${begins.join(' ') || 'nothing'}`,
    );
  }
  if (bytes.length < 8) {
    refuse(`it ends after ${bytes.length} bytes, before it says where its directory lies`);
  }

  // A field is twelve bytes: its tag, its type, how many values, and the values themselves where
  // they fit into four bytes - or else where they lie.
  const directory = view.getUint32(4, true);
  const entries = view.getUint16(within(directory, 2), true);
  within(directory + 2, entries * 12);
  const fields = new Map();
  for (let entry = directory + 2; entry < directory + 2 + entries * 12; entry += 12) {
    const type = view.getUint16(entry + 2, true);
    const count = view.getUint32(entry + 4, true);
    const inDirectory = (BYTES_OF[type] ?? Infinity) * count <= 4;
    const at = inDirectory ? entry + 8 : view.getUint32(entry + 8, true);
    fields.set(view.getUint16(entry, true), { type, count, at });
  }

  // The numbers of a field, or `undefined` where the tile has none of that tag.
  const numbers = (tag, name, kinds) => {
    const field = fields.get(tag);
    if (field === undefined) return undefined;
    if (!kinds.includes(field.type)) refuse(`its ${name} is of field type ${field.type}`);
    const size = BYTES_OF[field.type];
    within(field.at, size * field.count);
    return Array.from({ length: field.count }, (_, index) => {
      const at = field.at + index * size;
      if (field.type === DOUBLE) return view.getFloat64(at, true);
      if (field.type === LONG) return view.getUint32(at, true);
      return field.type === SHORT ? view.getUint16(at, true) : view.getUint8(at);
    });
  };
  const all = (tag, name, kinds) => numbers(tag, name, kinds) ?? refuse(`it states no ${name}`);
  const one = (tag, name) => {
    const values = all(tag, name, [SHORT, LONG]);
    if (values.length !== 1) {
      refuse(`it states ${values.length} numbers as its ${name}, where one is read`);
    }
    return values[0];
  };

  const bits = one(TAG.bitsPerCell, 'bits per cell');
  const format = one(TAG.sampleFormat, 'sample format');
  const samples = one(TAG.samplesPerCell, 'samples per cell');
  if (bits !== 32 || format !== FLOATING_POINT || samples !== 1) {
    refuse(
      `a cell is not one 32-bit floating-point number, but ${samples} of ${bits} bits in sample format ${format}`,
    );
  }
  const compression = one(TAG.compression, 'compression');
  if (compression !== LZW) {
    refuse(`it is packed by method ${compression}, and only LZW, 5, is read`);
  }
  const predictor = numbers(TAG.predictor, 'predictor', [SHORT])?.[0] ?? 1;
  if (predictor !== 1) refuse(`its cells are stored as differences, by predictor ${predictor}`);

  const columns = one(TAG.columns, 'width');
  const rows = one(TAG.rows, 'height');
  const blockColumns = one(TAG.blockColumns, 'block width');
  const blockRows = one(TAG.blockRows, 'block height');
  if (blockColumns === 0 || blockRows === 0) {
    refuse(`it states blocks of ${blockColumns} by ${blockRows} cells, which hold none`);
  }
  if (blockColumns * blockRows > MAX_BLOCK_CELLS) {
    refuse(
      `it states blocks of ${blockColumns} by ${blockRows} cells, and a block of more than ${MAX_BLOCK_CELLS} cells is not read`,
    );
  }
  const offsets = all(TAG.blockOffsets, 'block offsets', [SHORT, LONG]);
  const byteCounts = all(TAG.blockByteCounts, 'block sizes', [SHORT, LONG]);
  const expected = Math.ceil(columns / blockColumns) * Math.ceil(rows / blockRows);
  if (!(expected > 0) || offsets.length !== expected || byteCounts.length !== expected) {
    refuse(
      `${columns} by ${rows} cells in blocks of ${blockColumns} by ${blockRows} are ${expected} blocks, and it lists ${offsets.length} offsets and ${byteCounts.length} sizes`,
    );
  }

  const cellSize = all(TAG.cellSize, 'cell size', [DOUBLE]);
  const tiepoint = all(TAG.tiepoint, 'position', [DOUBLE]);
  const [cellWidth, cellHeight] = cellSize;
  const [column, row, , westE, northN] = tiepoint;
  if (cellSize.length !== 3) refuse(`its cell size is ${cellSize.length} numbers, not 3`);
  if (tiepoint.length !== 6 || column !== 0 || row !== 0) {
    refuse(`its position is not stated once, for its north-west corner: ${tiepoint.join(', ')}`);
  }

  const keys = geoKeys(all(TAG.geoKeys, 'coordinate system', [SHORT]));
  if (keys.get(RASTER_TYPE_KEY) !== CELL_IS_AREA) {
    refuse('it does not state that a cell is an area');
  }
  const epsg = keys.get(PROJECTED_SYSTEM_KEY) ?? refuse('it states no projected coordinate system');
  const noData = noDataOf(numbers(TAG.noData, 'value for no height', [ASCII]));

  return {
    columns,
    rows,
    blockColumns,
    blockRows,
    blocks: offsets.map((offset, index) => ({ offset, byteCount: byteCounts[index] })),
    westE,
    northN,
    cellWidth,
    cellHeight,
    epsg,
    ...(noData === undefined ? {} : { noData }),
  };
}
