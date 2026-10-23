// The made-up world that the stand-in serves in the place of swisstopo (ST-031, rule 3): rules,
// and no file. It lies at the origin of the Swiss grid in Bern, E 2 600 000 / N 1 200 000, where
// four tiles of swissALTI3D meet, and is no ground, no map and no place that exists: a height, a
// place and a picture are each worked out from what is asked. Nothing here listens, asks or
// reads a file - stand-in.js does the answering, and stand-in.check.js holds every rule by hand,
// through it. Test support: no script of a page and no module of the server imports it.
//
// No address is built here: an answer that names one takes it from hosts.js, on the origin that
// it is handed - the stand-in's own, where a real answer names swisstopo's.
import { Buffer } from 'node:buffer';
import { LAYERS, TILE_PX, collectionAddress, fileAddress, itemsAddress } from './hosts.js';
import { tileName } from './hosts.js';
import { madeUpTile } from './made-up-tile.js';

// The origin of the Swiss grid: the corner that the four tiles share.
const ORIGIN_E = 2_600_000;
const ORIGIN_N = 1_200_000;
// How far the slope reaches from the origin each way, in metres: 256 cells, two blocks of a tile.
const SLOPE_M = 128;
// The box that the ground is a slope in, and flat outside of: `{ minE, maxE, minN, maxN }`.
const SLOPE = Object.freeze({
  minE: ORIGIN_E - SLOPE_M,
  maxE: ORIGIN_E + SLOPE_M,
  minN: ORIGIN_N - SLOPE_M,
  maxN: ORIGIN_N + SLOPE_M,
});
// What swissALTI3D writes where it has no height, and the middle of the one cell that has none.
const NO_HEIGHT = -9999;
const NO_HEIGHT_AT = Object.freeze({ e: ORIGIN_E - 100.25, n: ORIGIN_N - 100.25 });

/**
 * The height of the made-up ground at the middle of a cell, in metres above sea level, as the
 * 32-bit number that a tile holds. `e` and `n` are LV95; with `east` and `north` the metres from
 * the origin: within 128 m of it each way the slope, `560 - 0.076 east - 0.068 north` - it falls
 * 0.1 m a metre along the bearing of 3 east for 4 north, and rises 0.02 m a metre to the left of
 * that line. Elsewhere flat, a height a tile: 520 m south-west of the origin, 530 m south-east,
 * 550 m north-west, 560 m north-east. And one cell has no height.
 */
export function heightAt(e, n) {
  if (e === NO_HEIGHT_AT.e && n === NO_HEIGHT_AT.n) return NO_HEIGHT;
  const [east, north] = [e - ORIGIN_E, n - ORIGIN_N];
  const onSlope = e >= SLOPE.minE && e < SLOPE.maxE && n >= SLOPE.minN && n < SLOPE.maxN;
  if (onSlope) return Math.fround(560 - 0.076 * east - 0.068 * north);
  return (north < 0 ? 520 : 550) + (east < 0 ? 0 : 10);
}

// What the one file says that is no tile: the newest state of the tile north of the first.
const NO_TILE = 'A made-up answer that is no tile.';
/**
 * The tiles there are, each by the kilometre of its south-west corner, with the years it has a
 * state of. The file of a tile's newest state is the made-up tile - or, of one, a text - and the
 * file of an older state is not there: a reader that took it would fail. One tile is of another
 * year than its neighbours.
 */
export const TILES = Object.freeze([
  { eastKm: 2600, northKm: 1200, years: [2019, 2025] },
  { eastKm: 2599, northKm: 1200, years: [2019, 2021] },
  { eastKm: 2600, northKm: 1199, years: [2019, 2025] },
  { eastKm: 2599, northKm: 1199, years: [2019, 2025] },
  { eastKm: 2600, northKm: 1201, years: [2025], text: NO_TILE },
]);
/** The span of time that the collection states: every state of a tile is of a year in it. */
export const SPAN = Object.freeze(['2019-01-01T00:00:00Z', '2026-01-01T00:00:00Z']);

// Every state of every tile, by its name: its tile, its year, and whether it is the newest.
const STATES = new Map(
  TILES.flatMap((tile) =>
    tile.years.map((year) => [
      tileName(year, tile.eastKm, tile.northKm),
      { tile, year, newest: year === Math.max(...tile.years) },
    ]),
  ),
);
// What stands last in an address, after its last slash.
const lastOf = (address) => address.slice(address.lastIndexOf('/') + 1);

/** The collection, as the catalogue answers: the fields of the real one that a reader reads. */
export const collection = (origin) => ({
  stac_version: '1.0.0',
  id: lastOf(collectionAddress(origin)),
  type: 'Collection',
  extent: { temporal: { interval: [[...SPAN]] } },
});

/** The type that a tile's file comes with, and that an item says of it. */
export const FILE_TYPE = 'image/tiff; application=geotiff; profile=cloud-optimized';
// One file of an item: what a real one says of it, with the side of its cells in metres.
const asset = (href, gsd) => ({ type: FILE_TYPE, href, gsd, 'proj:epsg': 2056 });
// Where the catalogue is asked for tiles, without what is asked of it: an answer says it of itself.
const asksAt = (origin) => itemsAddress(origin, [STATES.keys().next().value]).split('?')[0];

/**
 * What the catalogue answers when it is asked for tiles by their names: of the names asked, in
 * their order, an item for each that is a state of a tile, and `links` with no `next`. An item
 * lists its file of 2 m cells beside the one of 0.5 m, as a real one does - under the name of the
 * first with a 2 where that says 0.5: a reader has to pass it over, and the stand-in has no such
 * file.
 */
export function itemsOf(origin, names) {
  const item = (name) => {
    const half = fileAddress(origin, name);
    const two = half.replace('_0.5_', '_2_');
    return {
      id: name,
      collection: lastOf(collectionAddress(origin)),
      type: 'Feature',
      stac_version: '1.0.0',
      properties: { datetime: `${STATES.get(name).year}-01-01T00:00:00Z` },
      assets: { [lastOf(half)]: asset(half, 0.5), [lastOf(two)]: asset(two, 2) },
    };
  };
  const features = names.filter((name) => STATES.has(name)).map(item);
  return { type: 'FeatureCollection', features, links: [{ rel: 'self', href: asksAt(origin) }] };
}

/**
 * The bytes of a tile's file, by the name of its state - or null: no state of a tile, or an
 * older one. A tile is written when it is asked for, the short way, in some milliseconds.
 */
export function fileOf(name) {
  const state = STATES.get(name);
  if (state === undefined || !state.newest) return null;
  const { eastKm, northKm, text } = state.tile;
  if (text !== undefined) return new Uint8Array(Buffer.from(text));
  return madeUpTile({ eastKm, northKm, heightAt, flatOutside: SLOPE });
}

// A place as the search answers one: in `attrs`, `y` is the easting and `x` the northing, as the
// real search has them. What no reader of the pad reads is made up to match - and a made-up place
// lies nowhere on the globe: its `lat` and `lon` are 0.
const place = (label, y, x, index) => ({
  attrs: {
    detail: label.replace(/<[^>]*>/g, '').toLowerCase(),
    featureId: `made-up_${index}`,
    geom_st_box2d: `BOX(${y} ${x},${y} ${x})`,
    label,
    lat: 0,
    lon: 0,
    num: index + 1,
    origin: 'address',
    rank: 7,
    x,
    y,
    zoomlevel: 10,
  },
  id: index + 1,
  weight: 7,
});
/**
 * The four places that the search finds: one whose name has markup in it, as the real ones have;
 * one whose name would run a script if a page took it for markup; one with a name too long to
 * show; and one that lies off the map.
 */
export const PLACES = Object.freeze(
  [
    ['Made-up lane 1 <b>0000 Madeupville</b>', 2_600_020, 1_200_010],
    [
      '<img src="x" onerror="globalThis.RAN = 1">Made-up <i>square</i> <b>0000 Madeupville</b>',
      2_600_038,
      1_200_034,
    ],
    [`Made-up place with a long name${' long'.repeat(60)}`, 2_600_300, 1_200_300],
    ['Made-up place off the map', 0, 0],
  ].map((one, index) => place(...one, index)),
);
// The three words that the search does not answer with places, and what it says where it fails.
const FAILED = 'A made-up failure of the search <b>with markup</b>';
const [JSON_TYPE, TEXT_TYPE] = ['application/json', 'text/plain; charset=utf-8'];

/**
 * What the search answers to the words it is asked - `{ status, type, body }`. Words that hold
 * `nowhere` find nothing; `fails` is a failure, in a text with markup; `garbage` is an answer
 * that says it is JSON and is none; every other finds the four places, as many of them as
 * `limit` allows.
 */
export function placesFor(words, limit) {
  const found = (results) => ({ status: 200, type: JSON_TYPE, body: JSON.stringify({ results }) });
  if (words.includes('nowhere')) return found([]);
  if (words.includes('fails')) return { status: 500, type: TEXT_TYPE, body: FAILED };
  if (words.includes('garbage')) return { status: 200, type: JSON_TYPE, body: 'no JSON at all' };
  return found(PLACES.slice(0, limit));
}

// A picture's ground and its ink, by layer: three tints that are told apart at a glance - a pale
// green for the national map, a pale yellow for the cadastral map, and a dark green for the
// aerial photo, with white words on it.
const TINTS = Object.freeze({
  national: ['#cfe3b8', '#1f2a1c'],
  cadastral: ['#fff3c4', '#1f2a1c'],
  photo: ['#40503a', '#ffffff'],
});

/**
 * The picture of one tile of the map, as the text of an SVG of 256 by 256: of what its address
 * says, and of nothing else - its layer, its level, its column and its row in words, a line
 * along its edge, and a ground of the layer's own tint. `layer` is a name of `LAYERS`.
 */
export function pictureOf(layer, level, column, row) {
  const [ground, ink] = TINTS[layer];
  const words = [layer, LAYERS[layer].id, `level ${level}`, `column ${column}`, `row ${row}`];
  const lines = words.map((word, index) => `<text x="12" y="${28 + 22 * index}">${word}</text>`);
  const edge = `<rect x="0.5" y="0.5" width="${TILE_PX - 1}" height="${TILE_PX - 1}" fill="none" stroke="${ink}"/>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_PX}" height="${TILE_PX}" viewBox="0 0 ${TILE_PX} ${TILE_PX}">`,
    `<rect width="${TILE_PX}" height="${TILE_PX}" fill="${ground}"/>`,
    edge,
    `<g fill="${ink}" font-family="sans-serif" font-size="14">${lines.join('')}</g>`,
    '</svg>',
  ].join('');
}
