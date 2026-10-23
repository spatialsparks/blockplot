// The arithmetic of a view of the map (ST-031): which place lies under which pixel, which
// pictures a view has and where each of them lies, and what a view becomes when it is brought
// nearer, taken further or moved. A view is a level of the map service's ladder and the place at
// its middle - `{ level, e, n }`, LV95 in metres - shown in a place of so many pixels,
// `{ wide, high }`. Nothing here knows a page, an address or a request: map.js lays the pictures
// and asks for them. view.check.js holds every figure by hand.
import { CADASTRAL_FROM, LAYERS, LEVELS, SHEET, TILE_PX, matrixOf } from '../swisstopo/hosts.js';

// The nearest level that the map has: a tenth of a metre a pixel.
export const NEAREST = LEVELS.length - 1;
// A view's corner is taken to this part of a pixel before its pictures are counted. A sum of
// metres and pixels leaves a hair beside a whole pixel, and a view whose edge lies on the edge of
// a picture would else have, now and then, a row of pictures more of which nothing shows.
const PARTS_OF_A_PIXEL = 1000;
const settled = (pixels) => Math.round(pixels * PARTS_OF_A_PIXEL) / PARTS_OF_A_PIXEL;

/**
 * The place under a pixel of a view - `{ e, n }`, in LV95. `x` and `y` count the pixels from the
 * top left corner of the place that the view shows in: east lies to the right, north upward.
 */
export function placeAt({ level, e, n }, { wide, high }, [x, y]) {
  const metres = LEVELS[level];
  return { e: e + (x - wide / 2) * metres, n: n - (y - high / 2) * metres };
}

/** The pixel of a place, the other way round - `[x, y]`, which may lie beside what shows. */
export function pixelOf({ level, e, n }, { wide, high }, place) {
  const metres = LEVELS[level];
  return [(place.e - e) / metres + wide / 2, (n - place.n) / metres + high / 2];
}

/**
 * The first view: all of the sheet, the sheet's middle at its own - E 2 660 000, N 1 190 000 -
 * at the nearest level at which the sheet shows whole in the place. Where no level shows it
 * whole, in a place of very few pixels, it is the furthest.
 */
export function first({ wide, high }) {
  const [across, down] = [SHEET.east - SHEET.west, SHEET.north - SHEET.south];
  const whole = (metres) => metres * wide >= across && metres * high >= down;
  // The levels run from afar to near: the last of them that shows the sheet whole.
  const level = Math.max(LEVELS.findLastIndex(whole), 0);
  return { level, e: (SHEET.west + SHEET.east) / 2, n: (SHEET.south + SHEET.north) / 2 };
}

/**
 * A view, held to the sheet: its middle never leaves `SHEET`, and its level goes from the first
 * view's to the nearest. What lies beside the sheet is no ground of the map, and shows plain.
 */
export function held({ level, e, n }, size) {
  const between = (figure, least, most) => Math.min(Math.max(figure, least), most);
  return {
    level: between(level, first(size).level, NEAREST),
    e: between(e, SHEET.west, SHEET.east),
    n: between(n, SHEET.south, SHEET.north),
  };
}

/**
 * A view one level nearer, `by` 1, or further, -1, with the place under a pixel kept under it -
 * the pixel of the pointer, or the middle of the place - or null: there is no such level, beyond
 * the nearest or before the first view's. Where the sheet holds the middle back, at its edge, the
 * place is not kept.
 */
export function stepped(view, size, by, [x, y]) {
  const level = view.level + by;
  if (level < first(size).level || level > NEAREST) return null;
  const under = placeAt(view, size, [x, y]);
  const metres = LEVELS[level];
  const e = under.e - (x - size.wide / 2) * metres;
  const n = under.n + (y - size.high / 2) * metres;
  return held({ level, e, n }, size);
}

/**
 * A view whose ground was moved by so many pixels, to the right and down, as a drag moves it:
 * its middle goes as far the other way, and is held to the sheet.
 */
export function moved({ level, e, n }, size, [right, down]) {
  const metres = LEVELS[level];
  return held({ level, e: e - right * metres, n: n + down * metres }, size);
}

/**
 * The pictures of a view: every tile of its level of which the view shows ground, and no other -
 * each `{ column, row, left, top }`: where it stands in the level, and where its top left corner
 * lies in the place, in pixels from the place's own; a row after another. Column `c` covers the
 * east from the sheet's west edge plus `c` pictures of the level on, row `r` the north down from
 * the sheet's north edge. A level has the columns and rows of `matrixOf` and no picture beyond
 * them: a view at the sheet's edge has pictures of the sheet alone.
 */
export function pictures({ level, e, n }, { wide, high }) {
  if (!(wide > 0 && high > 0)) return [];
  const metres = LEVELS[level];
  const { columns, rows } = matrixOf(level);
  // Where the place's top left corner lies in the level, in pixels from the sheet's own.
  const west = settled((e - SHEET.west) / metres - wide / 2);
  const north = settled((SHEET.north - n) / metres - high / 2);
  // The tiles of which a stretch of pixels shows something: the first and the one after the last.
  const span = (from, length, count) => [
    Math.max(Math.floor(from / TILE_PX), 0),
    Math.min(Math.ceil((from + length) / TILE_PX), count),
  ];
  const [firstColumn, columnsEnd] = span(west, wide, columns);
  const [firstRow, rowsEnd] = span(north, high, rows);
  const all = [];
  for (let row = firstRow; row < rowsEnd; row += 1) {
    for (let column = firstColumn; column < columnsEnd; column += 1) {
      all.push({ column, row, left: column * TILE_PX - west, top: row * TILE_PX - north });
    }
  }
  return all;
}

/**
 * Which layer shows, a name of `LAYERS`: one at a time. The aerial photo at every level, where the
 * switch says so. Else, from afar, the national map; from `from` on - `CADASTRAL_FROM`, where the
 * pad offers the cadastre - the cadastral map, and the national map no longer. Where `from` is
 * null, no cadastre (docs/sketch/cadastre.md): the national map to its last level,
 * `LAYERS.national.to`, 27, and the photo beyond it, at 28, whatever the switch says.
 */
export const showing = (level, photo, from = CADASTRAL_FROM) => {
  if (photo) return 'photo';
  if (from !== null) return level < from ? 'national' : 'cadastral';
  return level <= LAYERS.national.to ? 'national' : 'photo';
};
