// What of a tile a box needs (ST-031): which of its cells, which of its blocks, and which bytes
// of the file to ask for. All of it is worked out from what the tile states of itself, as
// `readTileHead` of tiff.js gives it, and a tile that is not in LV95, not of 0.5 m cells or not
// where the cells are wanted is refused here. It is the parked product's
// packages/adapters/src/geodata/terrain/blocks.ts, written anew as the pad's, with its refusals
// to the word. blocks.check.js holds it by hand.
//
// A window is a rectangle of a tile's own cells - columns from its west edge, rows from its north
// edge: `{ firstColumn, lastColumn, firstRow, lastRow, westColumn, northRow }`, the last two the
// column of grid.js's cells that its column 0 is, and the row of those cells that its row 0 is. A
// wanted block is a block of the tile that holds wanted cells, with the cells of the tile it
// begins at: `{ offset, byteCount, firstColumn, firstRow }`. A part of the file is
// `{ first, last }`, two bytes counted from 0 and both included.
import { MAX_BYTES } from './door.js';
import { CELL_M, LV95_EPSG } from './grid.js';

/**
 * How far apart two blocks may lie in the file and still be asked for in one request. In a tile
 * as swisstopo writes it the blocks of a row follow each other eight bytes apart, and the next
 * row lies some hundred thousand further on: a row is one request, and a gap is never bought.
 */
export const JOINED_WITHIN_BYTES = 4096;

function refuse(reason) {
  throw new Error(`The tile is not the one to read: ${reason}`);
}

/**
 * Where `cells` lie in the tile - or the reason the tile is not the one to read them from: it
 * states another coordinate system than LV95, cells of another size than 0.5 m, cells that lie
 * across the grid's, or it does not reach as far as the cells that are wanted.
 */
export function windowOf(tile, cells) {
  if (tile.epsg !== LV95_EPSG) {
    refuse(
      `it states the coordinate system EPSG:${tile.epsg} where LV95, EPSG:${LV95_EPSG}, was asked for`,
    );
  }
  if (tile.cellWidth !== CELL_M || tile.cellHeight !== CELL_M) {
    refuse(
      `its cells are ${tile.cellWidth} m by ${tile.cellHeight} m where ${CELL_M} m was asked for`,
    );
  }
  const westColumn = tile.westE / CELL_M;
  const northRow = tile.northN / CELL_M - 1;
  if (!Number.isInteger(westColumn) || !Number.isInteger(northRow)) {
    refuse(
      `its cells lie across the cells of ${CELL_M} m counted from zero: its north-west corner is at E ${tile.westE}, N ${tile.northN}`,
    );
  }
  const window = {
    firstColumn: cells.west - westColumn,
    lastColumn: cells.east - westColumn,
    firstRow: northRow - cells.north,
    lastRow: northRow - cells.south,
    westColumn,
    northRow,
  };
  if (
    window.firstColumn < 0 ||
    window.firstRow < 0 ||
    window.lastColumn >= tile.columns ||
    window.lastRow >= tile.rows
  ) {
    const eastE = tile.westE + tile.columns * CELL_M;
    const southN = tile.northN - tile.rows * CELL_M;
    refuse(
      `it reaches from E ${tile.westE} to ${eastE}, N ${southN} to ${tile.northN}, and not over all the ground that was asked of it, E ${cells.west * CELL_M} to ${(cells.east + 1) * CELL_M}, N ${cells.south * CELL_M} to ${(cells.north + 1) * CELL_M}`,
    );
  }
  return window;
}

/** The blocks that hold the cells of `window`, row by row. A block without bytes is refused. */
export function blocksOf(tile, window) {
  const across = Math.ceil(tile.columns / tile.blockColumns);
  const wanted = [];
  const lastDown = Math.floor(window.lastRow / tile.blockRows);
  const lastAcross = Math.floor(window.lastColumn / tile.blockColumns);
  for (let down = Math.floor(window.firstRow / tile.blockRows); down <= lastDown; down += 1) {
    for (
      let along = Math.floor(window.firstColumn / tile.blockColumns);
      along <= lastAcross;
      along += 1
    ) {
      const block = tile.blocks[down * across + along];
      if (block === undefined || block.byteCount === 0) {
        refuse(`its block ${along + 1} of row ${down + 1} holds no bytes`);
      }
      wanted.push({
        ...block,
        firstColumn: along * tile.blockColumns,
        firstRow: down * tile.blockRows,
      });
    }
  }
  return wanted;
}

/**
 * The parts of the file to ask for, so that every block is in one of them: the blocks in the
 * order they lie in the file, those that touch, overlap or lie within `JOINED_WITHIN_BYTES` of
 * each other taken together - while the part stays within the door's `MAX_BYTES`. A row of
 * sixteen blocks of 64 kB, as a box across a whole tile needs, is two parts.
 */
export function rangesOf(blocks) {
  const ranges = [];
  for (const block of [...blocks].sort((one, other) => one.offset - other.offset)) {
    const last = block.offset + block.byteCount - 1;
    const open = ranges.at(-1);
    const near = open !== undefined && block.offset - open.last - 1 <= JOINED_WITHIN_BYTES;
    if (near && Math.max(open.last, last) - open.first + 1 <= MAX_BYTES) {
      open.last = Math.max(open.last, last);
    } else {
      ranges.push({ first: block.offset, last });
    }
  }
  return ranges;
}
