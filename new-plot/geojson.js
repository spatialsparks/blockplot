// New plot's reader of a GeoJSON file (ST-045, T-045.4): the text of a file, or of what was
// pasted, read into one outline's corners in LV95, with the line that says what was taken - or
// refused in one sentence. Its coordinates are told apart without guessing (ST-045, rule 2):
// LV95 where the crs says so, or with none where every position is LV95; longitude and latitude
// where the crs says WGS84, or with none where every position lies in Switzerland's longitudes
// and latitudes, longitude first. Those are converted to LV95 here, once, by lv95Of of
// kml/wgs84.js, and nothing of them is kept (rule 3): the marking, the order and the plot never
// see a longitude. The ring - which part, the closing corner, repeats, what was left out - is
// largestOf's of ring.js, and none of this module's (rule 4). Nothing is rounded, moved or turned
// (rule 5). No page, no request, no clock and no global. geojson.check.js holds
// it, on made-up GeoJSON.
import { SHEET_WGS84, lv95Of } from '../kml/wgs84.js';
import { SHEET } from '../swisstopo/hosts.js';
import { isLV95 } from './frame.js';
import { CORNERS_MAX } from './request.js';
import { largestOf } from './ring.js';

/** The most text a file may be, in bytes of UTF-8: 5 MB, the owner's cap (2026-10-23). */
export const FILE_MAX_BYTES = 5_000_000;
/** The most characters of a crs's name that a sentence repeats. */
const NAME_SAID_MAX = 40;
/** What LV03's figures are short of LV95's, east and north. */
const LV03_SHORT = [2_000_000, 1_000_000];

// The frames a crs may name, each name to the letter: thirteen, of three frames.
const LV95 = 'LV95';
const WGS84 = 'WGS84';
const LV03 = 'LV03';
const FRAMES = new Map([
  ['EPSG:2056', LV95],
  ['urn:ogc:def:crs:EPSG::2056', LV95],
  ['http://www.opengis.net/def/crs/EPSG/0/2056', LV95],
  ['urn:ogc:def:crs:OGC:1.3:CRS84', WGS84],
  ['urn:ogc:def:crs:OGC::CRS84', WGS84],
  ['OGC:CRS84', WGS84],
  ['http://www.opengis.net/def/crs/OGC/1.3/CRS84', WGS84],
  ['EPSG:4326', WGS84],
  ['urn:ogc:def:crs:EPSG::4326', WGS84],
  ['http://www.opengis.net/def/crs/EPSG/0/4326', WGS84],
  ['EPSG:21781', LV03],
  ['urn:ogc:def:crs:EPSG::21781', LV03],
  ['http://www.opengis.net/def/crs/EPSG/0/21781', LV03],
]);

// What coordinates may be, of their first two figures, and how a sentence says each.
const NORTH_FIRST = 'LV95, north first';
const LATITUDE_FIRST = 'WGS84, latitude first';
const NO_GRID = 'of no grid';
const FRAME_WORDS = { [LV95]: 'LV95, EPSG:2056', [WGS84]: 'WGS84' };
const KIND_WORDS = {
  [LV95]: 'LV95',
  [NORTH_FIRST]: 'LV95, north first',
  [LV03]: 'LV03',
  [WGS84]: 'longitude and latitude',
  [LATITUDE_FIRST]: 'latitude and longitude, latitude first',
  [NO_GRID]: 'of no grid of Switzerland',
};

// The geometries that are an outline, and those that are none.
const OUTLINES = ['Polygon', 'MultiPolygon'];
const NO_OUTLINES = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'GeometryCollection'];

// What is said, each sentence written here once.
const SAID_FRAMES = 'LV95, EPSG:2056, or longitude and latitude, WGS84.';
export const SAID = Object.freeze({
  blank: 'Choose a GeoJSON file, or paste one into the box.',
  large: 'The file is larger than 5 MB: give the outline of your plot alone.',
  noJson: 'It is no JSON: a GeoJSON file is JSON text.',
  several: (count) =>
    `The file holds ${count} outlines: keep the one of your plot, and give it again.`,
  noOutline: 'It holds no outline: no Polygon or MultiPolygon.',
  noGeoJson: 'It is no GeoJSON: no Feature, FeatureCollection or geometry.',
  noCoordinates: "Its outline's coordinates are none: two figures for each corner, or three.",
  crsNamed: (name) => `Its crs, ${name}, is none that the pad takes: ${SAID_FRAMES}`,
  crsUnread: `Its crs says no frame that the pad can read: ${SAID_FRAMES}`,
  latitudeFirst:
    'Its coordinates give the latitude before the longitude: GeoJSON gives the longitude first.',
  northFirst: 'Its coordinates give the north before the east: GeoJSON gives the east first.',
  lv03: 'This file is in LV03, the old Swiss grid: export it again in LV95, EPSG:2056.',
  noGrid: ([a, b]) =>
    `Its coordinates are of no grid of Switzerland: the first corner is ${a}, ${b}.`,
  crsAgainst: (frame, kind) =>
    `Its crs says ${FRAME_WORDS[frame]}, and its coordinates are ${KIND_WORDS[kind]}.`,
  offMap: 'A corner lies off the map of Switzerland: New plot makes plots in Switzerland alone.',
  few: 'The outline has fewer than three corners: it encloses nothing.',
  many: (count) => `The outline has ${count} corners, and a plot has ${CORNERS_MAX} at the most.`,
  marked: (count) => `The file's outline is marked: ${count} corners.`,
  converted:
    'The file gives longitude and latitude (WGS84): its corners are converted to LV95, good to about a metre.',
  passed: (count) =>
    count === 1
      ? 'One feature that is no outline was passed over.'
      : `${count} features that are no outline were passed over.`,
});

// With no crs, what each kind of coordinates comes to: a frame taken, or a refusal.
const UNNAMED = {
  [LV95]: { as: LV95 },
  [WGS84]: { as: WGS84 },
  [LATITUDE_FIRST]: { refused: SAID.latitudeFirst },
  [NORTH_FIRST]: { refused: SAID.northFirst },
  [LV03]: { refused: SAID.lv03 },
};

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const reversed = ([a, b]) => [b, a];
const onSheet = ([east, north]) =>
  east >= SHEET.west && east <= SHEET.east && north >= SHEET.south && north <= SHEET.north;
const inLongitudes = ([longitude, latitude]) =>
  longitude >= SHEET_WGS84.west &&
  longitude <= SHEET_WGS84.east &&
  latitude >= SHEET_WGS84.south &&
  latitude <= SHEET_WGS84.north;
// Each kind, and what holds of every position that is one. They cannot overlap: no longitude or
// LV03 figure is two million, and no LV95 or LV03 figure is that small.
const KINDS = [
  [LV95, isLV95],
  [NORTH_FIRST, (place) => isLV95(reversed(place))],
  [LV03, ([east, north]) => onSheet([east + LV03_SHORT[0], north + LV03_SHORT[1]])],
  [WGS84, inLongitudes],
  [LATITUDE_FIRST, (place) => inLongitudes(reversed(place))],
];

/** The polygon of the GeoJSON read - `{ geometry, passed }`, the features passed over - or `{ refused }`. */
function geometryOf(value) {
  if (!isObject(value)) return { refused: SAID.noGeoJson };
  if (OUTLINES.includes(value.type)) return { geometry: value, passed: 0 };
  if (NO_OUTLINES.includes(value.type)) return { refused: SAID.noOutline };
  if (value.type === 'Feature') {
    const { geometry } = value;
    return OUTLINES.includes(geometry?.type)
      ? { geometry, passed: 0 }
      : { refused: SAID.noOutline };
  }
  if (value.type !== 'FeatureCollection' || !Array.isArray(value.features))
    return { refused: SAID.noGeoJson };
  const outlines = value.features.filter((feature) => OUTLINES.includes(feature?.geometry?.type));
  if (outlines.length > 1) return { refused: SAID.several(outlines.length) };
  if (outlines.length === 0) return { refused: SAID.noOutline };
  return { geometry: outlines[0].geometry, passed: value.features.length - 1 };
}

const isPosition = (place) =>
  Array.isArray(place) &&
  (place.length === 2 || place.length === 3) &&
  place.every(Number.isFinite);
const isListOf = (list, isOne) => Array.isArray(list) && list.length > 0 && list.every(isOne);

/** A polygon's parts, each a list of rings, each ring of its positions' first two figures - or null. */
function partsOf({ type, coordinates }) {
  const parts = type === 'Polygon' ? [coordinates] : coordinates;
  const read = isListOf(parts, (part) => isListOf(part, (ring) => isListOf(ring, isPosition)));
  return read ? parts.map((part) => part.map((ring) => ring.map(([a, b]) => [a, b]))) : null;
}

/** The frame that the top object's crs names - `{ frame }`, null where it has none - or `{ refused }`. */
function frameOf(crs) {
  if (crs === undefined || crs === null) return { frame: null };
  const name = isObject(crs) && isObject(crs.properties) ? crs.properties.name : undefined;
  if (typeof name !== 'string' || name.trim() === '') return { refused: SAID.crsUnread };
  const frame = FRAMES.get(name.trim());
  return frame ? { frame } : { refused: SAID.crsNamed(name.trim().slice(0, NAME_SAID_MAX)) };
}

/** What every position is, of `KINDS`: the one whose rule holds of them all, or of no grid. */
function kindOf(places) {
  const found = KINDS.find(([, holds]) => places.every(holds));
  return found ? found[0] : NO_GRID;
}

/** The frame the coordinates are taken in - `{ as }`, LV95 or WGS84 - or `{ refused }`. */
function takenAs(frame, kind, first) {
  if (frame === LV03) return { refused: SAID.lv03 };
  if (frame !== null)
    return kind === frame ? { as: frame } : { refused: SAID.crsAgainst(frame, kind) };
  return UNNAMED[kind] ?? { refused: SAID.noGrid(first) };
}

/**
 * The bytes of a text in UTF-8, by its code points: one under U+0080, two under U+0800, three
 * under U+10000 - a lone surrogate among them, which UTF-8 writes as U+FFFD - and four above.
 * Counted here as TextEncoder counts them, which is a global the module does without.
 */
function bytesOf(text) {
  let bytes = 0;
  for (const character of text) {
    const point = character.codePointAt(0);
    bytes += point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4;
  }
  return bytes;
}

/**
 * The text of a GeoJSON file, or of what was pasted, as one outline: `{ corners, wgs84, said }` -
 * `corners` each `[e, n]` in LV95 as `largestOf` gives them, `wgs84` whether they were converted
 * from longitude and latitude, and `said`, the line - or `{ refused }`, one sentence of `SAID`.
 */
export function outlineOf(text) {
  if (typeof text !== 'string' || text.trim() === '') return { refused: SAID.blank };
  if (bytesOf(text) > FILE_MAX_BYTES) return { refused: SAID.large };
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return { refused: SAID.noJson };
  }
  const found = geometryOf(value);
  if (found.refused) return { refused: found.refused };
  const given = partsOf(found.geometry);
  if (given === null) return { refused: SAID.noCoordinates };
  const framed = frameOf(value.crs);
  if (framed.refused) return { refused: framed.refused };
  const places = given.flat(2);
  const taken = takenAs(framed.frame, kindOf(places), places[0]);
  if (taken.refused) return { refused: taken.refused };
  const wgs84 = taken.as === WGS84;
  const parts = wgs84
    ? given.map((part) => part.map((ring) => ring.map((place) => lv95Of(place))))
    : given;
  if (!parts.flat(2).every(onSheet)) return { refused: SAID.offMap };
  const { corners, left } = largestOf(parts);
  if (corners.length < 3) return { refused: SAID.few };
  if (corners.length > CORNERS_MAX) return { refused: SAID.many(corners.length) };
  const said = [
    SAID.marked(corners.length),
    wgs84 ? SAID.converted : '',
    left,
    found.passed > 0 ? SAID.passed(found.passed) : '',
  ];
  return { corners, wgs84, said: said.filter((sentence) => sentence !== '').join(' ') };
}
