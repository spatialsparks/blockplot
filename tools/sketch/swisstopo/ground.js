// The ground of a box (ST-031): the heights of swissALTI3D under a box in LV95, read out of the
// tiles that the box lies in - the catalogue asked by the tiles' names, each tile's newest state
// asked for its head and its blocks, never a tile whole, and every request through the pad's
// door, one after the other (rule 9). For a plot of a house that is five to ten requests; for
// the largest paper that the pad takes, a kilometre on nine tiles, some eighty. It is the parked
// product's packages/adapters/src/geodata/terrain/fetchTerrain.ts, written anew as the pad's:
// what it gives is what `plotOf` of ../new-plot/plot.js takes, with no source and no licence in
// it - a plot's file says those. `plotMadeOf` of ../new-plot/making.js calls it, for an order that
// the map's page makes (T-031.6, T-041.3). ground.check.js, ground-parts.check.js and ground-refused.check.js hold it.
import { namesOf, readNewest, readYears } from './catalogue.js';
import { getJson } from './door.js';
import { cellsCovering, cellsIn, tilesOf } from './grid.js';
import { collectionAddress, itemsAddress, mayAsk } from './hosts.js';
import { readTile } from './tile.js';

/**
 * How many tiles a box may lie in. A tile is a square kilometre, and the largest paper that the
 * pad takes is 1 000 m each way (PAPER_MAX_M): turned 45 degrees, its box is 1 414.2 m each way,
 * which lies in three tiles along and three across at the most. A box that reaches into more is
 * refused before anything is asked: every tile is a file to ask for in parts, and a box that
 * large is no paper of the pad's.
 */
export const MAX_TILES = 9;

/**
 * Refuses what makes no sense before anything is asked, and gives the cells of the box: an origin
 * that the pad does not ask, a box that is no four numbers or holds no ground, one whose cells
 * are no numbers that count exactly, and one that lies in more than `MAX_TILES` tiles. A box
 * that lies where no tile's name of four figures can hold it is refused as early by grid.js, in
 * its own words: no owner meets it, for an order's corners are held to the sheet of the map. The
 * tiles are counted by the two that the outermost cells lie in, and none is listed for it: a
 * box of a thousand kilometres lists none.
 */
function check(origin, box) {
  if (!mayAsk(origin)) {
    throw new Error(
      `Not a host that the pad asks, so nothing was asked: ${JSON.stringify(origin)}`,
    );
  }
  const { minE, maxE, minN, maxN } = box ?? {};
  if (![minE, maxE, minN, maxN].every(Number.isFinite)) {
    throw new RangeError('The box is no four numbers, so nothing was asked.');
  }
  const lies = `E ${minE} to ${maxE}, N ${minN} to ${maxN}`;
  if (!(minE < maxE && minN < maxN)) throw new RangeError(`The box holds no ground: ${lies}.`);
  const cells = cellsCovering(box);
  if (!Object.values(cells).every(Number.isSafeInteger)) {
    throw new RangeError(`The box lies where swissALTI3D names no tile: ${lies}.`);
  }
  const tileOf = (column, row) =>
    tilesOf({ west: column, east: column, south: row, north: row })[0];
  const [first, last] = [tileOf(cells.west, cells.south), tileOf(cells.east, cells.north)];
  const tiles = (last.eastKm - first.eastKm + 1) * (last.northKm - first.northKm + 1);
  if (tiles > MAX_TILES) {
    throw new RangeError(
      `The box lies in ${tiles} tiles of a square kilometre, and ${MAX_TILES} are read at most.`,
    );
  }
  return cells;
}

/**
 * Asks the catalogue at an address that hosts.js built on `origin`, and reads its answer. What
 * the reader refuses of it is an error that says so, and ends with the address that was asked.
 */
async function ask(origin, address, read) {
  const answer = await getJson(origin, address.slice(origin.length));
  try {
    return read(answer);
  } catch (cause) {
    throw new Error(`The download service's answer was refused: ${cause.message}: ${address}`, {
      cause,
    });
  }
}

/**
 * swissALTI3D under a box in LV95, from the downloads at `origin` - `{ cells, heightsM, tiles }`.
 * `box` is `{ minE, maxE, minN, maxN }`, metres, on whole metres or not. `cells` are the cells
 * that cover it, `{ west, east, south, north }` as grid.js counts them: every cell of 0.5 m whose
 * middle lies in the box, and the next beyond each edge that no middle lies on. `heightsM[row]
 * [column]` is the height of a cell in metres above sea level, the tile's own 32-bit number,
 * rows from south to north and in a row from west to east. `tiles` are the tiles that it was
 * read from, from south to north and west to east, each `{ name, year }`: tiles of one box may
 * be of different years.
 *
 * It asks the collection for the years that its tiles are of, the catalogue for the tiles of the
 * box in those years, and then tile by tile the newest state's file for its head and the blocks
 * that the box needs. A service that fails, an answer that cannot be read, a tile in another
 * form and a cell without a height are errors that end with the address that was asked - never a
 * ground with a gap.
 */
export async function groundOf(origin, box) {
  const cells = check(origin, box);
  const tiles = tilesOf(cells);
  const years = await ask(origin, collectionAddress(origin), readYears);
  const items = itemsAddress(origin, namesOf(tiles, years));
  const newest = await ask(origin, items, (answer) => readNewest(answer, tiles, years));

  // A row for every row of cells, put together of its tiles' parts as the tiles come: from west
  // to east. One tile after the other: the services are free, and ask for moderation.
  const heightsM = Array.from({ length: cells.north - cells.south + 1 }, () => []);
  for (const { tile, name } of newest) {
    const part = cellsIn(tile, cells);
    const heights = await readTile(origin, name, part);
    heights.forEach((row, index) => heightsM[part.south - cells.south + index].push(...row));
  }
  return { cells, heightsM, tiles: newest.map(({ name, year }) => ({ name, year })) };
}
