// The check of New plot's reader of a GeoJSON file (ST-045, T-045.4): outlineOf of made-up
// GeoJSON, built here, no file read and nothing running. The pentagon of trial-slope.json in
// LV95 - as a Feature, a bare Polygon, under each crs of LV95, with heights, left open, a corner
// twice running - and in WGS84, its corners typed in as the exporter turned them (T-045.0's
// trial, to ten decimals), under each crs of WGS84; every refusal in its sentence, to the letter;
// a MultiPolygon, a hole, features passed over. And of geojson.js itself: the six names it
// imports, and no global, clock or request in its code. Run by check.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { TextEncoder } from 'node:util';
import { LV95_ACCURACY_M, SHEET_WGS84, lv95Of } from '../kml/wgs84.js';
import { FILE_MAX_BYTES, SAID, outlineOf } from './geojson.js';

// The pentagon, its corners as the golden plot has them.
const P = [
  [2600020, 1200010],
  [2600038, 1200034],
  [2600028.4, 1200041.2],
  [2600010, 1200030],
  [2600004, 1200022],
];
// The same, in longitude and latitude, typed in.
const W = [
  [7.4388999439, 46.9511710628],
  [7.4391363954, 46.9513869468],
  [7.4390102889, 46.9514517127],
  [7.4387685835, 46.951350967],
  [7.4386897667, 46.9512790055],
];
const closed = (corners) => [...corners, corners[0]];
const polygon = (corners) => ({ type: 'Polygon', coordinates: [closed(corners)] });
const feature = (geometry) => ({ type: 'Feature', properties: { name: 'Made up' }, geometry });
const named = (name, value) => ({ ...value, crs: { type: 'name', properties: { name } } });
const collection = (...features) => ({ type: 'FeatureCollection', features });
// A box of `wide` metres or degrees from its south-west corner, its corners clockwise from there.
const box = (east, north, wide) => [
  [east, north],
  [east, north + wide],
  [east + wide, north + wide],
  [east + wide, north],
];
const reversed = (corners) => corners.map(([a, b]) => [b, a]);
const read = (value) => outlineOf(JSON.stringify(value));
const refused = (value, sentence) =>
  assert.deepEqual(read(value), { refused: sentence }, JSON.stringify(value).slice(0, 200));

const LV95_NAMES = [
  'EPSG:2056',
  'urn:ogc:def:crs:EPSG::2056',
  'http://www.opengis.net/def/crs/EPSG/0/2056',
];
const WGS84_NAMES = [
  'urn:ogc:def:crs:OGC:1.3:CRS84',
  'urn:ogc:def:crs:OGC::CRS84',
  'OGC:CRS84',
  'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
  'EPSG:4326',
  'urn:ogc:def:crs:EPSG::4326',
  'http://www.opengis.net/def/crs/EPSG/0/4326',
];
const LV03_NAMES = [
  'EPSG:21781',
  'urn:ogc:def:crs:EPSG::21781',
  'http://www.opengis.net/def/crs/EPSG/0/21781',
];

// The pentagon in LV95, to the figure, however it comes.
const MARKED = { corners: P, wgs84: false, said: "The file's outline is marked: 5 corners." };
const PENTAGON = feature(polygon(P));
assert.deepEqual(read(PENTAGON), MARKED);
assert.deepEqual(read(polygon(P)), MARKED);
for (const name of [...LV95_NAMES, ' EPSG:2056 '])
  assert.deepEqual(read(named(name, PENTAGON)), MARKED);
assert.deepEqual(read({ ...PENTAGON, crs: null }), MARKED);
assert.deepEqual(read(polygon(P.map(([e, n], at) => [e, n, 512.25 + at]))), MARKED);
assert.deepEqual(read({ type: 'Polygon', coordinates: [P] }), MARKED);
assert.deepEqual(read(polygon([...P.slice(0, 3), P[2], ...P.slice(3)])), MARKED);
// A crs is the top object's: one on a feature of a collection is not read.
assert.deepEqual(read(collection(named('EPSG:21781', PENTAGON))), MARKED);

// The pentagon in WGS84: converted by lv95Of, once, each corner within the formulas' accuracy.
const CONVERTED = {
  corners: W.map((place) => lv95Of(place)),
  wgs84: true,
  said: "The file's outline is marked: 5 corners. The file gives longitude and latitude (WGS84): its corners are converted to LV95, good to about a metre.",
};
const IN_WGS84 = feature(polygon(W));
assert.deepEqual(read(IN_WGS84), CONVERTED);
for (const name of WGS84_NAMES) assert.deepEqual(read(named(name, IN_WGS84)), CONVERTED);
for (const [at, [e, n]] of read(IN_WGS84).corners.entries()) {
  const gap = Math.hypot(e - P[at][0], n - P[at][1]);
  assert.ok(gap <= LV95_ACCURACY_M, `corner ${at}: ${gap} m`);
}

// The coordinates that are refused, with no crs and against one.
const LV03 = P.map(([e, n]) => [e - 2_000_000, n - 1_000_000]);
const SAID_LV03 = 'This file is in LV03, the old Swiss grid: export it again in LV95, EPSG:2056.';
refused(
  polygon(reversed(W)),
  'Its coordinates give the latitude before the longitude: GeoJSON gives the longitude first.',
);
refused(
  polygon(reversed(P)),
  'Its coordinates give the north before the east: GeoJSON gives the east first.',
);
refused(polygon(LV03), SAID_LV03);
for (const name of LV03_NAMES) refused(named(name, PENTAGON), SAID_LV03);
refused(named('EPSG:21781', polygon(LV03)), SAID_LV03);
const against = (frame, kind) => `Its crs says ${frame}, and its coordinates are ${kind}.`;
const BY_LV95 = (corners) => named('EPSG:2056', polygon(corners));
refused(BY_LV95(W), against('LV95, EPSG:2056', 'longitude and latitude'));
refused(BY_LV95(reversed(P)), against('LV95, EPSG:2056', 'LV95, north first'));
refused(BY_LV95(LV03), against('LV95, EPSG:2056', 'LV03'));
refused(BY_LV95(reversed(W)), against('LV95, EPSG:2056', 'latitude and longitude, latitude first'));
refused(named('OGC:CRS84', polygon(P)), against('WGS84', 'LV95'));
const NO_GRID = box(0, 0, 1);
refused(named('EPSG:4326', polygon(NO_GRID)), against('WGS84', 'of no grid of Switzerland'));
refused(
  polygon(NO_GRID),
  'Its coordinates are of no grid of Switzerland: the first corner is 0, 0.',
);
// LV95 and WGS84 alike in one ring are of no grid.
refused(
  polygon([...P.slice(0, 2), ...W.slice(2)]),
  'Its coordinates are of no grid of Switzerland: the first corner is 2600020, 1200010.',
);

// A crs that the pad does not take.
const FRAMES = 'LV95, EPSG:2056, or longitude and latitude, WGS84.';
const UNREAD = `Its crs says no frame that the pad can read: ${FRAMES}`;
refused(named('EPSG:3857', PENTAGON), `Its crs, EPSG:3857, is none that the pad takes: ${FRAMES}`);
refused(named('epsg:2056', PENTAGON), `Its crs, epsg:2056, is none that the pad takes: ${FRAMES}`);
refused(
  named(` ${'x'.repeat(50)} `, PENTAGON),
  `Its crs, ${'x'.repeat(40)}, is none that the pad takes: ${FRAMES}`,
);
refused({ ...PENTAGON, crs: { type: 'name', properties: {} } }, UNREAD);
refused({ ...PENTAGON, crs: { type: 'name', properties: { name: 2056 } } }, UNREAD);
refused({ ...PENTAGON, crs: 'EPSG:2056' }, UNREAD);
refused(named('  ', PENTAGON), UNREAD);

// Off the map, and too few or too many corners.
const OFF_MAP =
  'A corner lies off the map of Switzerland: New plot makes plots in Switzerland alone.';
refused(polygon([...P.slice(0, 4), [2950000, 1200022]]), OFF_MAP);
refused(polygon(box(5.05, 45.35, 0.05)), OFF_MAP);
// The box of longitudes and latitudes, to its edge: one corner on an edge is longitude and
// latitude, converted off the sheet; past it, the file is of no grid.
const { west, east, south, north } = SHEET_WGS84;
const EDGES = [
  [west, 46.95, -0.01, 0],
  [east, 46.95, 0.01, 0],
  [7.44, south, 0, -0.01],
  [7.44, north, 0, 0.01],
];
for (const [longitude, latitude, de, dn] of EDGES) {
  refused(polygon([...W.slice(0, 4), [longitude, latitude]]), OFF_MAP);
  const past = [longitude + de, latitude + dn];
  refused(
    polygon([...W.slice(0, 4), past]),
    `Its coordinates are of no grid of Switzerland: the first corner is ${W[0][0]}, ${W[0][1]}.`,
  );
}
// A corner on the sheet's edge is taken.
const EDGE = box(2420000, 1030000, 10);
assert.deepEqual(read(polygon(EDGE)).corners, EDGE);
refused(polygon(P.slice(0, 2)), 'The outline has fewer than three corners: it encloses nothing.');
const round = (count) =>
  Array.from({ length: count }, (_, at) => {
    const angle = (2 * Math.PI * at) / count;
    return [2600020 + 15 * Math.cos(angle), 1200020 + 15 * Math.sin(angle)];
  });
refused(polygon(round(1001)), 'The outline has 1001 corners, and a plot has 1000 at the most.');
assert.deepEqual(read(polygon(round(1000))).corners, round(1000));
assert.equal(read(polygon(round(1000))).said, "The file's outline is marked: 1000 corners.");

// What is no outline, no GeoJSON or no JSON.
const NO_OUTLINE = 'It holds no outline: no Polygon or MultiPolygon.';
const NO_GEOJSON = 'It is no GeoJSON: no Feature, FeatureCollection or geometry.';
const POINT = { type: 'Point', coordinates: P[0] };
const LINE = { type: 'LineString', coordinates: P };
const MULTI = [
  { type: 'MultiPoint', coordinates: P },
  { type: 'MultiLineString', coordinates: [P] },
];
const ALL = { type: 'GeometryCollection', geometries: [polygon(P)] };
const NO_GEOMETRY = [feature(null), feature(POINT), { type: 'Feature', properties: {} }];
for (const value of [POINT, LINE, ...MULTI, ALL, ...NO_GEOMETRY, collection(feature(LINE))]) {
  refused(value, NO_OUTLINE);
}
refused(collection(), NO_OUTLINE);
for (const value of [{}, [], 'text', null, 7, { type: 'FeatureCollection' }, { type: 'Ring' }]) {
  refused(value, NO_GEOJSON);
}
refused(
  collection(
    PENTAGON,
    feature(POINT),
    feature({ type: 'MultiPolygon', coordinates: [[closed(P)]] }),
  ),
  'The file holds 2 outlines: keep the one of your plot, and give it again.',
);
const NO_TEXT = 'Choose a GeoJSON file, or paste one into the box.';
for (const text of ['', '  \n\t ', undefined, null, 42]) {
  assert.deepEqual(outlineOf(text), { refused: NO_TEXT });
}
for (const text of ['{"type":', 'Polygon', "{'type':'Polygon'}"]) {
  assert.deepEqual(outlineOf(text), { refused: 'It is no JSON: a GeoJSON file is JSON text.' });
}
// 6 MB; and 5 MB to the byte taken, a byte more refused, of characters of one byte, two, three
// and four, and a lone surrogate, which UTF-8 writes in three - each counted as Node's encoder
// counts it, the pad typed into the text as it stands.
const LARGE = { refused: 'The file is larger than 5 MB: give the outline of your plot alone.' };
const GEOMETRY = JSON.stringify(polygon(P));
const padded = (pad) => `{"type":"Feature","properties":{"pad":"${pad}"},"geometry":${GEOMETRY}}`;
const bytes = (text) => new TextEncoder().encode(text).length;
assert.equal(FILE_MAX_BYTES, 5_000_000);
assert.deepEqual(outlineOf(padded('x'.repeat(6_000_000))), LARGE);
for (const character of ['x', '\u007F', 'é', '߿', '€', '￿', '😀', '\uD800']) {
  const many = Math.floor((FILE_MAX_BYTES - bytes(padded(''))) / bytes(character));
  const rest = FILE_MAX_BYTES - bytes(padded(character.repeat(many)));
  const full = `${character.repeat(many)}${'x'.repeat(rest)}`;
  assert.equal(bytes(padded(full)), FILE_MAX_BYTES, character);
  assert.deepEqual(outlineOf(padded(full)), MARKED, character);
  assert.deepEqual(outlineOf(padded(`${full}x`)), LARGE, character);
}

// Coordinates that are none.
const NONE = "Its outline's coordinates are none: two figures for each corner, or three.";
for (const coordinates of [
  undefined,
  [],
  [[]],
  [closed(P), []],
  [[P[0], [2600038]]],
  [[P[0], [2600038, 1200034, 512, 1]]],
  [[P[0], ['2600038', 1200034]]],
  [[P[0], [2600038, null]]],
  'P',
]) {
  refused({ type: 'Polygon', coordinates }, NONE);
}
// A figure too large to be one, as JSON text alone can give it.
const BEYOND =
  '{"type":"Polygon","coordinates":[[[2600020,1200010],[2600038,1e400],[2600010,1200030]]]}';
assert.deepEqual(outlineOf(BEYOND), { refused: NONE });
refused({ type: 'MultiPolygon', coordinates: [] }, NONE);
refused({ type: 'MultiPolygon', coordinates: [[closed(P)], []] }, NONE);

// A MultiPolygon, a hole, and features passed over: the line says what was left out.
const marked = (...more) => ({ ...MARKED, said: [MARKED.said, ...more].join(' ') });
const SQUARE = closed(box(2600050, 1200010, 3));
assert.deepEqual(
  read({ type: 'MultiPolygon', coordinates: [[SQUARE], [closed(P)]] }),
  marked('The largest of its 2 parts is marked; the other, 9 m², is left out.'),
);
const HOLE = closed(box(2600014, 1200020, 2));
assert.deepEqual(
  read(feature({ type: 'Polygon', coordinates: [closed(P), HOLE] })),
  marked('Its hole of 4 m² is not left out of the plot.'),
);
assert.deepEqual(
  read(collection(feature(POINT), PENTAGON, feature(POINT))),
  marked('2 features that are no outline were passed over.'),
);
assert.deepEqual(
  read(collection(PENTAGON, feature(LINE))),
  marked('One feature that is no outline was passed over.'),
);
assert.ok(Object.isFrozen(SAID));

// geojson.js itself: the six names it imports, of the five modules, and no global, clock or
// request in its code.
const code = fs
  .readFileSync(path.join(import.meta.dirname, 'geojson.js'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const WORDS = ['globalThis', 'TextEncoder', 'fetch', 'document', 'Date', 'window', 'import('];
for (const word of [...WORDS, 'require(']) {
  assert.equal(code.includes(word), false, word);
}
const IMPORTS = [...code.matchAll(/^import\s*\{([^}]*)\}\s*from\s*'([^']+)';$/gm)];
assert.equal(IMPORTS.length, [...code.matchAll(/\bimport\b/g)].length);
assert.deepEqual(
  IMPORTS.map(([, names, from]) => [from, names.split(',').map((name) => name.trim())]),
  [
    ['../kml/wgs84.js', ['SHEET_WGS84', 'lv95Of']],
    ['../swisstopo/hosts.js', ['SHEET']],
    ['./frame.js', ['isLV95']],
    ['./request.js', ['CORNERS_MAX']],
    ['./ring.js', ['largestOf']],
  ],
);

process.stdout.write(
  'tools/sketch/new-plot: a GeoJSON read into the corners of one outline in LV95 - its frame told apart without guessing, WGS84 converted - or refused in one sentence, each to the letter\n',
);
