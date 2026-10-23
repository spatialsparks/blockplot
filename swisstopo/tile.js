// The heights of one tile of swissALTI3D, read in parts (ST-031): first the beginning of its
// file, which holds its directory, then the blocks that hold the cells of a box - never the whole
// tile, which is some sixteen megabytes. The file is asked for through the pad's door, at the
// address that hosts.js builds for the tile's name; what the tile states of itself is read by
// tiff.js, which of its blocks a box needs is worked out by blocks.js, and a block is unpacked by
// lzw.js. It is the parked product's packages/adapters/src/geodata/terrain/tile.ts, written anew
// as the pad's, with its refusals to the word (ADR-0045, ADR-0048). ground-parts.check.js and
// ground-refused.check.js hold it, on tiles that they make up.
import { blocksOf, rangesOf, windowOf } from './blocks.js';
import { getBytes } from './door.js';
import { middleOf } from './grid.js';
import { fileAddress } from './hosts.js';
import { decodeLzw } from './lzw.js';
import { readTileHead } from './tiff.js';

/**
 * How much of a tile is asked for first. A cloud-optimised GeoTIFF begins with its directory:
 * that of a tile of swissALTI3D, 2000 by 2000 cells in blocks of 128, ends 4512 bytes in. A
 * directory that reaches beyond what was asked for is refused, never asked for again.
 */
export const HEAD_BYTES = 16_384;

// A cell is a 32-bit floating-point number: four bytes, the lowest first.
const BYTES_OF_A_CELL = 4;

// What swissALTI3D writes where it has no height, as a real tile states it. A cell that holds it
// is no height even in a tile that names no such number, or another: no ground lies 9999 m below
// the sea, and a plot that is refused is made again, where a wrong height is kept (ADR-0048).
const NO_HEIGHT = -9999;

/** Whether a block lies in a part of the file, `{ first, last }`, with all its bytes. */
const liesIn = (block, range) =>
  block.offset >= range.first && block.offset + block.byteCount - 1 <= range.last;

/** The cells of one block as its bytes, the compression undone. */
function unpack(packed, tile, block) {
  try {
    const bytes = decodeLzw(packed, tile.blockColumns * tile.blockRows * BYTES_OF_A_CELL);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  } catch (cause) {
    throw new Error(
      `The tile's block from column ${block.firstColumn}, row ${block.firstRow} cannot be read: ${cause.message}`,
      { cause },
    );
  }
}

/**
 * Copies the wanted cells of one block into `heights`, turned the way a ground runs: the tile's
 * rows run from north to south, a ground's from south to north. A cell without a height - the
 * tile's number for none, swissALTI3D's -9999 whatever the tile names, or no finite number at
 * all - is refused, never handed on as a height.
 */
function copyCells(heights, cells, tile, window, block, unpacked) {
  const firstRow = Math.max(window.firstRow, block.firstRow);
  const lastRow = Math.min(window.lastRow, block.firstRow + tile.blockRows - 1);
  const firstColumn = Math.max(window.firstColumn, block.firstColumn);
  const lastColumn = Math.min(window.lastColumn, block.firstColumn + tile.blockColumns - 1);
  for (let row = firstRow; row <= lastRow; row += 1) {
    const northward = window.northRow - row;
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const at = (row - block.firstRow) * tile.blockColumns + (column - block.firstColumn);
      const height = unpacked.getFloat32(at * BYTES_OF_A_CELL, true);
      const eastward = window.westColumn + column;
      if (height === tile.noData || height === NO_HEIGHT || !Number.isFinite(height)) {
        throw new Error(
          `swissALTI3D states no height at E ${middleOf(eastward)}, N ${middleOf(northward)}`,
        );
      }
      heights[northward - cells.south][eastward - cells.west] = height;
    }
  }
}

/**
 * The heights of `cells` out of the tile of the name `name`, at the service at `origin`, in
 * metres above sea level: a row after another from south to north, and in a row from west to
 * east, each the 32-bit number that the tile holds. `cells` are `{ west, east, south, north }`, as
 * grid.js counts them, and lie in that tile.
 *
 * It asks for the file's first `HEAD_BYTES` and then for the blocks that hold the cells, those
 * that lie within `JOINED_WITHIN_BYTES` of each other in one request - one after the other. A
 * tile that is not the one to read, a block that does not unpack to what its directory says, a
 * part that ends short and a cell without a height are errors that end with the tile's address.
 */
export async function readTile(origin, name, cells) {
  const address = fileAddress(origin, name);
  if (address === null) {
    throw new Error(
      `No file of a tile at a host that the pad asks, so nothing was asked: ${JSON.stringify(name)} at ${JSON.stringify(origin)}`,
    );
  }
  const target = address.slice(origin.length);
  const refusing = (read) => {
    try {
      return read();
    } catch (cause) {
      throw new Error(`${cause.message}: ${address}`, { cause });
    }
  };

  const head = await getBytes(origin, target, { range: { first: 0, last: HEAD_BYTES - 1 } });
  const { tile, window, blocks } = refusing(() => {
    const read = readTileHead(head);
    const found = windowOf(read, cells);
    return { tile: read, window: found, blocks: blocksOf(read, found) };
  });

  // A row for every row of cells, each filled cell by cell as its blocks are read.
  const heights = Array.from({ length: cells.north - cells.south + 1 }, () => []);
  for (const range of rangesOf(blocks)) {
    const part = await getBytes(origin, target, { range });
    refusing(() => {
      const named = range.last - range.first + 1;
      if (part.length !== named) {
        throw new Error(
          `The tile ends ${part.length} bytes into the ${named} its directory names from byte ${range.first} on`,
        );
      }
      for (const block of blocks.filter((wanted) => liesIn(wanted, range))) {
        const from = block.offset - range.first;
        const packed = part.subarray(from, from + block.byteCount);
        copyCells(heights, cells, tile, window, block, unpack(packed, tile, block));
      }
    });
  }
  return heights;
}
