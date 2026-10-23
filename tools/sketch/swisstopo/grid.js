// Where the cells of swissALTI3D lie, and which of them a box needs (ST-031). A cell is a square
// of ground with one height, stated for its middle, so the grid points of a ground are the
// middles of cells. Cells are counted from the zero of LV95 - column 0 begins at E 0, row 0 at
// N 0 - eastward and northward: the way a ground runs, and the other way up from the rows of a
// tile. It is the parked product's packages/adapters/src/geodata/terrain/grid.ts, written anew
// as the pad's: a module that imports nothing - and stricter in one thing, for `tilesOf` refuses
// cells that it cannot count. grid.check.js holds it by hand.
//
// A box is `{ minE, maxE, minN, maxN }`, metres in LV95. Cells are `{ west, east, south, north }`:
// a rectangle of cells by the numbers of its outermost columns and rows, all four included. A
// tile is `{ eastKm, northKm }`, the kilometre its south-west corner lies at: 2600 and 1200 for
// the tile north-east of the origin of the Swiss grid.

/**
 * The side of a cell, in metres: the finer of the two grids that swissALTI3D is published in, and
 * the one that a plot's ground is read off - a height every half metre (ST-031). A tile that
 * states another is refused. The parked product has it as `CELL_SIZE_M`.
 */
export const CELL_M = 0.5;

/** LV95 by its EPSG code: the coordinate system a tile has to state (directive 35). */
export const LV95_EPSG = 2056;

// The side of a tile, in metres: swissALTI3D comes in squares of one kilometre, each named after
// the kilometre of its south-west corner - so a tile is 2000 cells each way.
const TILE_M = 1000;
const CELLS_PER_TILE = TILE_M / CELL_M;

/**
 * The cells a ground of `box` is made of: on every side out to the nearest cell whose middle
 * lies on the edge of the box or beyond it, so that the grid points cover the box whole. It is
 * at least two cells each way. Halving and doubling are exact, so no edge is misjudged.
 */
export function cellsCovering(box) {
  return {
    west: Math.floor(box.minE / CELL_M - 0.5),
    east: Math.ceil(box.maxE / CELL_M - 0.5),
    south: Math.floor(box.minN / CELL_M - 0.5),
    north: Math.ceil(box.maxN / CELL_M - 0.5),
  };
}

/** The middle of a column of cells, as an easting in metres - or of a row, as a northing. */
export function middleOf(columnOrRow) {
  return (columnOrRow + 0.5) * CELL_M;
}

// The kilometres that a tile's name can hold: four figures each way, as `tileName` of hosts.js
// takes them - said once more here, in a module that imports nothing.
const FIRST_KM = 1000;
const LAST_KM = 9999;

/**
 * The tiles that `cells` lie in, from south to north and in each row from west to east. Refused
 * with a RangeError, before a tile is counted: cells that are no whole numbers that count
 * exactly, and cells that lie where no tile's name can hold them. Beyond the numbers that count
 * exactly a step of one kilometre changes nothing, and the count would never end: here the pad's
 * reader is stricter than the parked one, whose caller holds a box to LV95 first.
 */
export function tilesOf(cells) {
  const ends = [cells.west, cells.east, cells.south, cells.north];
  if (!ends.every(Number.isSafeInteger)) {
    throw new RangeError(
      `Not cells that count exactly: columns ${cells.west} to ${cells.east}, rows ${cells.south} to ${cells.north}.`,
    );
  }
  const [westKm, eastKm, southKm, northKm] = ends.map((end) => Math.floor(end / CELLS_PER_TILE));
  if ([westKm, eastKm, southKm, northKm].some((km) => km < FIRST_KM || km > LAST_KM)) {
    throw new RangeError(
      `No tile has a name where the cells lie, at the kilometres E ${westKm} to ${eastKm}, N ${southKm} to ${northKm}: a name holds four figures each way.`,
    );
  }
  const tiles = [];
  for (let north = southKm; north <= northKm; north += 1) {
    for (let east = westKm; east <= eastKm; east += 1) tiles.push({ eastKm: east, northKm: north });
  }
  return tiles;
}

/** The part of `cells` that lies in one tile. Asked only of a tile of `tilesOf(cells)`. */
export function cellsIn(tile, cells) {
  const west = tile.eastKm * CELLS_PER_TILE;
  const south = tile.northKm * CELLS_PER_TILE;
  return {
    west: Math.max(cells.west, west),
    east: Math.min(cells.east, west + CELLS_PER_TILE - 1),
    south: Math.max(cells.south, south),
    north: Math.min(cells.north, south + CELLS_PER_TILE - 1),
  };
}
