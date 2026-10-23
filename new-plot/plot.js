// The plot of corners and ground (ST-031, rule 7): the one computation. Of an order - a name,
// corners in LV95, the side that the paper lies along, the ground around the plot, what the
// corners were marked on - and of the ground under it, as swissALTI3D has it, a site as the pad
// has one: its frame, its paper, a height at every grid point, its credit and its sources. What
// `write` of plot-file.js takes. No network, disk, page or clock in it: the ground and the day are
// handed over. It imports frame.js, request.js, the name of swisstopo's services of hosts.js, and
// squares.js and windows.js for their effect.
import '../squares.js';
import '../windows.js';
import { GEOPORTAL } from '../swisstopo/hosts.js';
import { CELL_M, onMap, paperOf } from './frame.js';
import { PAPER_MAX_M, SAID } from './request.js';

// What the standing views show beyond the ground, in metres. Under the lowest ground a storey: a
// cellar at the foot of the plot shows.
export const UNDER_M = 3;
// Over the highest ground a house of four storeys of 3 m and a roof of 4 m: one that stands at
// the top of the plot shows whole.
export const OVER_M = 16;
// The cell of swissALTI3D, in metres: it holds a height at the middle of each.
const GROUND_CELL_M = 0.5;
// A height is written in whole centimetres.
const CM = 100;
// How far off the ground a place is read all the same, at the ground's edge, in cells: a
// micrometre. The ground is asked for by the paper's corners with x along the side, and read at
// the paper's corners in the frame that the ground gave, a quarter turn on: the same places, but
// for the last figure of a sum - tenths of a nanometre.
const HAIR = 2e-6;
// Two falls are alike where they differ by no more than this, in metres a metre - a micrometre
// in a kilometre: far more than a sum leaves of dead flat ground, and far less than a fall that
// the heights can say.
const ALIKE = 1e-9;

// What a plot says for good of where its figures came from (ST-031, rule 6): what the corners
// were marked on - the national map where the pad offers no cadastre (T-044.10) - and the
// credits that the services ask for: the cantons' where the corners touch the cadastral map.
const MARKED_ON = {
  national: 'the national map',
  cadastral: 'the cadastral map',
  photo: 'the aerial photo',
};
const SWISSTOPO = '© swisstopo';
const CADASTRAL = '© Cadastral Surveying Switzerland / FL';

/** From `from` at share 0 to `to` at share 1: by two weights, so that both ends are exact. */
const between = (from, to, share) => from * (1 - share) + to * share;

/** Of so many steps along cells, `most` of them at the most: the cell that a place lies in, and its share of the way to the next - on the last middle the last cell, at its far end. */
function inCell(steps, most) {
  const held = Math.min(Math.max(steps, 0), most);
  const cell = Math.min(Math.floor(held), most - 1);
  return [cell, held - cell];
}

/**
 * The height of the ground at a place of LV95, `[east, north]`, in metres above sea level: read
 * between the four middles of cells around it, by two weights each way - at a middle it is that
 * cell's own height. `ground` is `{ cells, heightsM }`: `heightsM[row][column]`, rows from south
 * to north and in a row from west to east, the height of the cell whose middle lies at
 * E = (cells.west + column + 0.5) * 0.5, N = (cells.south + row + 0.5) * 0.5. A place that the
 * ground does not cover is no height, and neither is one beside a cell that holds none: it
 * throws. A height is never continued beyond the ground.
 */
export function heightAt({ cells, heightsM }, [east, north]) {
  const [columns, rows] = [cells.east - cells.west, cells.north - cells.south];
  const across = east / GROUND_CELL_M - 0.5 - cells.west;
  const upward = north / GROUND_CELL_M - 0.5 - cells.south;
  const covered = (steps, most) => steps >= -HAIR && steps <= most + HAIR;
  if (!covered(across, columns) || !covered(upward, rows)) {
    throw new RangeError(`The ground does not cover E ${east}, N ${north}.`);
  }
  const [[column, eastward], [row, northward]] = [inCell(across, columns), inCell(upward, rows)];
  const along = (line) => {
    const [from, to] = [heightsM[line]?.[column], heightsM[line]?.[column + 1]];
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      throw new RangeError(`The ground holds no height beside E ${east}, N ${north}.`);
    }
    return between(from, to, eastward);
  };
  return between(along(row), along(row + 1), northward);
}

/** The ground at every grid point of a paper, in metres above sea level: a row after another from y = yToM down, in a row from x = xFromM on. */
function heightsOf(paper, ground) {
  const { xFromM, xToM, yFromM, yToM } = paper;
  const lies = onMap(paper);
  const [columns, rows] = [(xToM - xFromM) / CELL_M, (yToM - yFromM) / CELL_M];
  return Array.from({ length: rows + 1 }, (_, row) =>
    Array.from({ length: columns + 1 }, (__, column) =>
      heightAt(ground, lies([xFromM + column * CELL_M, yToM - row * CELL_M])),
    ),
  );
}

/** The ground at every grid point of a paper to the whole centimetre, in one array as `heightsOf` orders it, with the lowest and the highest: a paper of a kilometre has four million. */
function centimetresOf(paper, ground) {
  const { xFromM, xToM, yFromM, yToM } = paper;
  const [lies, cols, rows] = [onMap(paper), (xToM - xFromM) / CELL_M, (yToM - yFromM) / CELL_M];
  const cm = new Int32Array((cols + 1) * (rows + 1));
  let [low, high] = [Infinity, -Infinity];
  for (let row = 0, at = 0; row <= rows; row += 1) {
    for (let column = 0; column <= cols; column += 1, at += 1) {
      const place = lies([xFromM + column * CELL_M, yToM - row * CELL_M]);
      cm[at] = Math.round(heightAt(ground, place) * CM);
      [low, high] = [Math.min(low, cm[at]), Math.max(high, cm[at])];
    }
  }
  return { cm, cols, rows, low, high };
}

/** A site's ground, its heights over `baseM`: as rows (version 2) where the paper is `windows.WHOLE_M` each way at the most, else as squares (version 3). */
function groundOf({ cm, cols, rows }, baseM) {
  const over = cm.map((height) => height - baseM * CM);
  if (Math.max(cols, rows) * CELL_M > globalThis.windows.WHOLE_M) {
    return { baseM, ...globalThis.squares.make(over, cols, rows) };
  }
  const row = (line) => Array.from(over.subarray(line * (cols + 1), (line + 1) * (cols + 1)));
  return { baseM, rowsCm: Array.from({ length: rows + 1 }, (_, line) => row(line).join(' ')) };
}

/**
 * How the ground falls over a paper, in metres a metre, down x and down y: of the plane that
 * fits the heights best, by least squares. `heights[row][column]` are the heights at the paper's
 * grid points, rows from the largest y down. On a grid the two falls are worked out apart: each
 * height is weighted by how far its column, or its row, lies from the middle one.
 */
export function fallOf(heights) {
  const [midRow, midColumn] = [(heights.length - 1) / 2, (heights[0].length - 1) / 2];
  let [byColumn, byRow, columnsApart, rowsApart] = [0, 0, 0, 0];
  heights.forEach((line, row) => {
    line.forEach((height, column) => {
      byColumn += (column - midColumn) * height;
      byRow += (midRow - row) * height;
      columnsApart += (column - midColumn) ** 2;
      rowsApart += (midRow - row) ** 2;
    });
  });
  // A column is a cell on, and a row a cell down y; and a fall is the slope's other sign.
  return { downX: -byColumn / columnsApart / CELL_M, downY: -byRow / rowsApart / CELL_M };
}

/**
 * Which way x runs, of the four of `paperOf`: the one that the ground falls most along - 0 along
 * the side, 1 to its right, which is down -y, 2 back along it, 3 to its left. Of two that fall
 * alike, the first of that order: so on ground that is dead flat x runs along the side as it was
 * marked.
 */
export function quarterOf({ downX, downY }) {
  const falls = [downX, -downY, -downX, downY];
  return falls.reduce((most, fall, quarter) => (fall > falls[most] + ALIKE ? quarter : most), 0);
}

/** The outline's words of a parcel of the official survey (ST-043): in the credit, and as a source - as given, or changed by hand since. */
function parcelWords({ egrid, number, canton, asGiven }, day) {
  const its = `parcel ${number} (${canton}), EGRID ${egrid}, of the official survey`;
  const given = `as ${GEOPORTAL} gives it`;
  if (asGiven) {
    return {
      credit: `Outline: ${its} ${given}.`,
      source: `Outline: ${its} ${given} in the cadastral map, read on ${day}, its corners unchanged. No extract of the land register: it has no legal effect.`,
    };
  }
  return {
    credit: `Outline: after ${its}, changed by hand.`,
    source: `Outline: after ${its} ${given} in the cadastral map, read on ${day}, and changed by hand since. No survey, and no extract of the land register: it has no legal effect.`,
  };
}

// What a file's source says after its first sentence: that the page cannot know where it came from.
const UNRECORDED =
  'Where the file came from, and on what terms, is not recorded. No survey: it has no legal effect.';

/** The outline's words of a GeoJSON file the person gave (ST-045): in the credit, and as a source - as given or changed by hand since, converted from WGS84 or not. Nothing of the file but its corners. */
function fileWords({ wgs84, asGiven }, day) {
  // The words whole, for a script's word `from` before a quote reads as an import (making.check.js).
  const [file, geojson] = asGiven
    ? ['from a file', 'from a GeoJSON file']
    : ['after a file', 'after a GeoJSON file'];
  const converted = wgs84 ? ', converted from WGS84 to about a metre' : '';
  const changed = asGiven ? '' : ', changed by hand';
  const read = wgs84
    ? ` in longitude and latitude (WGS84), read on ${day} and converted to LV95 by swisstopo's approximate formulas, good to about a metre, ${asGiven ? 'its corners unchanged since' : 'and changed by hand since'}`
    : `, read on ${day}, ${asGiven ? 'its corners unchanged' : 'and changed by hand since'}`;
  return {
    credit: `Outline: ${file} you gave${converted}${changed}, no survey.`,
    source: `Outline: ${geojson} you gave${read}. ${UNRECORDED}`,
  };
}

/** The outline's words of corners marked by hand, on the maps that `on` names. */
function handWords(on, day) {
  const maps = on.map((map) => MARKED_ON[map]).join(' and ');
  return {
    credit: `Outline: marked by hand on ${maps}, no survey.`,
    source: `Outline: marked by hand on ${maps}, on ${day}. No survey: a corner is good to a few decimetres, and is no boundary of the land register.`,
  };
}

/** Where a plot's figures came from: its credit and its sources, to the letter - what the corners were marked on, by `on`, or the parcel or the file that they are, each tile of the ground, the day and the frame. With a parcel the credits are both: its boundary is the cadastral map's. */
function whereFrom({ on, parcel, file }, tiles, day, { origin, bearingDeg }) {
  const both = parcel !== undefined || on.includes('cadastral');
  const credits = both ? `${SWISSTOPO}, ${CADASTRAL}` : SWISSTOPO;
  const [east, north] = origin.map((metres) => metres.toFixed(2));
  const ground = ({ name, year }) =>
    `Ground: swissALTI3D of swisstopo, the tile ${name} in its state of ${year}, read on ${day}: a height every ${CELL_M} m, read between the four cells around it, in whole centimetres. ${SWISSTOPO}`;
  let outline = handWords(on, day);
  if (parcel !== undefined) outline = parcelWords(parcel, day);
  if (file !== undefined) outline = fileWords(file, day);
  return {
    credit: `${outline.credit} Ground: swissALTI3D. ${credits}`,
    sources: [
      `${outline.source} ${credits}`,
      ...tiles.map(ground),
      `Frame: x = 0, y = 0 lies at E ${east}, N ${north} in LV95; x runs at ${bearingDeg} degrees from north, clockwise, and y to its left. Heights are metres above sea level, LN02.`,
    ],
  };
}

/**
 * The plot of an order and the ground under it: `{ site }`, a site as the pad has one and as
 * `write` of plot-file.js takes it - or `{ refused }`, one sentence of `SAID`. `name`, `corners`,
 * `side`, `aroundM`, `on`, and `parcel` or `file`, where it has one, are an order's (`orderOf` of request.js); `ground` is
 * `{ cells, heightsM, tiles }`, the ground of the box that `paperOf` gives of the order
 * (`heightAt`), with the tiles it was read from, each `{ name, year }`; `day` is the day, as
 * `2026-10-13`. By this rule, and in this order:
 *
 * - The paper with x along the side (`paperOf`), and the ground at every grid point of it.
 * - Which way x runs: the way that the plane which fits those heights best falls most along
 *   (`fallOf`, `quarterOf`).
 * - The paper again, in that frame, and a height at every grid point of it, each taken to the
 *   whole centimetre. `baseM` is the lowest of them, down to a whole metre, and a height is
 *   written in centimetres over it: in rows to `windows.WHOLE_M` each way, beyond as squares.
 * - `sideM`: from `UNDER_M` under `baseM` to `OVER_M` over the highest, up to a whole metre -
 *   every height lies inside it, at neither end. Refused with `steep` where that is more than
 *   `PAPER_MAX_M` high.
 * - The site, its fields in the order of the format's table, with no area of the land register
 *   and no point of a house: a plot made here states neither. It says where it lies:
 *   `originLV95`, the frame's `origin` - the first corner of the side, to the centimetre.
 */
export function plotOf({ name, corners, side, aroundM, on, parcel, file, ground, day }) {
  const along = paperOf(corners, side, aroundM);
  const runs = () => quarterOf(fallOf(heightsOf(along, ground)));
  const paper = along.refused === undefined ? paperOf(corners, side, aroundM, runs()) : along;
  if (paper.refused !== undefined) return { refused: paper.refused };
  const heights = centimetresOf(paper, ground);
  // A base at nought is a plain nought: of a height a hair under it, the centimetre makes a
  // nought with a minus before it.
  const baseM = Math.floor(heights.low / CM) + 0;
  const sideM = [baseM - UNDER_M, Math.ceil(heights.high / CM) + OVER_M];
  if (sideM[1] - sideM[0] > PAPER_MAX_M) return { refused: SAID.steep(...sideM) };
  const { origin: originLV95, bearingDeg, xFromM, xToM, yFromM, yToM, outline } = paper;
  const paperM = { xFromM, xToM, yFromM, yToM, sideM };
  const drawn = { bearingDeg, originLV95, ...paperM, outline, notes: [] };
  const from = whereFrom({ on, parcel, file }, ground.tiles, day, paper);
  return { site: { name, cellM: CELL_M, ...drawn, ground: groundOf(heights, baseM), ...from } };
}
