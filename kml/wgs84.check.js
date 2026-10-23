// The check of wgs84.js: the conversions from LV95 to WGS84 and back held against published
// reference points. Every reference value below says where it came from. It asks nobody: it runs
// behind the pad's gate, and what swisstopo's REFRAME gave was asked by hand, once, and typed in.
import assert from 'node:assert/strict';
import process from 'node:process';
import { SHEET } from '../swisstopo/hosts.js';
import {
  ACCURACY_M,
  EARTH_RADIUS_M,
  LV95_ACCURACY_M,
  SECOND_M,
  SHEET_WGS84,
  STATED_SECONDS,
  lv95Of,
  wgs84Of,
} from './wgs84.js';

/** Degrees, minutes and seconds as one figure of degrees. */
const degrees = (whole, minutes, seconds) => whole + minutes / 60 + seconds / 3600;
/** The gap between two places of WGS84, `[longitude, latitude]` in degrees, in metres on a sphere of `EARTH_RADIUS_M`. */
function gapM([lon1, lat1], [lon2, lat2]) {
  const rad = (value) => (value * Math.PI) / 180;
  const half = (from, to) => Math.sin((rad(to) - rad(from)) / 2) ** 2;
  const a = half(lat1, lat2) + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * half(lon1, lon2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

// The document's own worked example: section 2, point 4, page 4 of "Näherungsformeln für die
// Transformation zwischen Schweizer Projektionskoordinaten und WGS84", swisstopo, December
// 2016. Given E = 2 700 000 m, N = 1 100 000 m, it prints lambda = 8° 43' 49.80" and phi =
// 46° 02' 38.86" - what the formulas give, not its "Sollwerte" - and the formula is held to
// that within half its last figure, 0.005".
const EXAMPLE = wgs84Of([2_700_000, 1_100_000]);
const PRINTED = [degrees(8, 43, 49.8), degrees(46, 2, 38.86)];
const HALF_LAST_DEG = 0.005 / 3600;
EXAMPLE.forEach((value, at) => {
  const off = Math.abs(value - PRINTED[at]);
  assert.ok(off <= HALF_LAST_DEG, `${['longitude', 'latitude'][at]}: ${off * 3600}" off`);
});

// The zero of the grid, E 2 600 000 / N 1 200 000, Bern: y' and x' are 0, and the formulas'
// constant terms give it alone - 2.6779094 and 16.9023892 units of 10 000", times 100 / 36.
const ZERO = wgs84Of([2_600_000, 1_200_000]);
assert.ok(Math.abs(ZERO[0] - (2.6779094 * 100) / 36) < 1e-12, `${ZERO[0]}`);
assert.ok(Math.abs(ZERO[1] - (16.9023892 * 100) / 36) < 1e-12, `${ZERO[1]}`);

// Three points of round figures far apart in Switzerland - its west, its east and its south -
// whose exact WGS84 was asked of swisstopo's REFRAME, its service lv95towgs84, by hand on
// 2026-10-15, and typed in as it answered - at an altitude of 0, which changes nothing of a
// place: each within ACCURACY_M of what the formulas give. Where the service lies is said in
// docs/sketch/kml.md: a script names no host of swisstopo's but hosts.js.
const REFRAME = [
  { where: 'west', lv95: [2_500_000, 1_140_000], wgs84: [6.138223141631496, 46.40388361955845] },
  { where: 'east', lv95: [2_830_000, 1_170_000], wgs84: [10.443368223332653, 46.64160014338527] },
  { where: 'south', lv95: [2_720_000, 1_080_000], wgs84: [8.983717369047156, 45.860998352561644] },
];
for (const { where, lv95, wgs84 } of REFRAME) {
  const gap = gapM(wgs84Of(lv95), wgs84);
  assert.ok(gap <= ACCURACY_M, `${where}: ${gap} m from REFRAME, more than ${ACCURACY_M} m`);
}

// The gap itself, by hand: a second of arc along a meridian is SECOND_M; a hundredth of a
// degree of longitude on the equator is 36 of them.
assert.ok(Math.abs(SECOND_M - 30.887) < 0.001, `${SECOND_M}`);
assert.ok(Math.abs(gapM([0, 0], [0, 1 / 3600]) - SECOND_M) < 1e-6);
assert.ok(Math.abs(gapM([0, 0], [0.01, 0]) - 36 * SECOND_M) < 1e-6);
// The accuracy the page states, 0.12" and 0.08", in metres: their hypotenuse, 0.1442", 4.45 m.
assert.deepEqual(STATED_SECONDS, { longitude: 0.12, latitude: 0.08 });
assert.ok(Math.abs(ACCURACY_M - 4.4547) < 0.0001, `${ACCURACY_M}`);

// And the other way, section 1 of the same document, page 3. The gap between two places of LV95
// is the length between them, in metres.
const gapLV95 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Its worked example: given phi = 46° 02' 38.87" and lambda = 8° 43' 49.79", it prints
// E = 2 699 999.76 m and N = 1 099 999.97 m - what the formulas give, not its "Sollwerte" - and
// the formula is held to that within half its last figure, 0.005 m.
const BACK = lv95Of([degrees(8, 43, 49.79), degrees(46, 2, 38.87)]);
const PRINTED_LV95 = [2_699_999.76, 1_099_999.97];
BACK.forEach((value, at) => {
  const off = Math.abs(value - PRINTED_LV95[at]);
  assert.ok(off <= 0.005, `${['east', 'north'][at]}: ${off} m off`);
});

// Bern, longitude 26 782.5" and latitude 169 028.66": lambda' and phi' are 0, and the formulas'
// constant terms give it alone - E 2 600 072.37, N 1 200 147.07.
const BERN = lv95Of([26_782.5 / 3600, 169_028.66 / 3600]);
assert.ok(Math.abs(BERN[0] - 2_600_072.37) < 1e-6, `${BERN[0]}`);
assert.ok(Math.abs(BERN[1] - 1_200_147.07) < 1e-6, `${BERN[1]}`);

// The page states "besser als 1 Meter in der Lage", under section 1's example.
assert.equal(LV95_ACCURACY_M, 1);
// The three points of REFRAME, the other way: each exact WGS84 within LV95_ACCURACY_M of its LV95.
for (const { where, lv95, wgs84 } of REFRAME) {
  const gap = gapLV95(lv95Of(wgs84), lv95);
  assert.ok(gap <= LV95_ACCURACY_M, `${where}: ${gap} m from its LV95, more than a metre`);
}
// A round trip, lv95Of(wgs84Of(p)): the made-up pentagon's five corners, each within
// LV95_ACCURACY_M, and the three places of REFRAME within the two accuracies together.
const PENTAGON = [
  [2_600_020, 1_200_010],
  [2_600_038, 1_200_034],
  [2_600_028.4, 1_200_041.2],
  [2_600_010, 1_200_030],
  [2_600_004, 1_200_022],
];
for (const corner of PENTAGON) {
  const gap = gapLV95(lv95Of(wgs84Of(corner)), corner);
  assert.ok(gap <= LV95_ACCURACY_M, `${corner}: ${gap} m after a round trip`);
}
for (const { where, lv95 } of REFRAME) {
  const gap = gapLV95(lv95Of(wgs84Of(lv95)), lv95);
  assert.ok(gap <= ACCURACY_M + LV95_ACCURACY_M, `${where}: ${gap} m after a round trip`);
}

// SHEET_WGS84: every wgs84Of of the sheet's four sides, every 10 km, lies inside it, each of its
// figures is the farthest rounded outward to a tenth of a degree, and its east lies under its
// south - no longitude of it can be a latitude of it.
const SIDES = [];
for (let east = SHEET.west; east <= SHEET.east; east += 10_000)
  SIDES.push([east, SHEET.south], [east, SHEET.north]);
for (let north = SHEET.south; north <= SHEET.north; north += 10_000)
  SIDES.push([SHEET.west, north], [SHEET.east, north]);
const ON_SIDES = SIDES.map(wgs84Of);
const longitudes = ON_SIDES.map(([longitude]) => longitude);
const latitudes = ON_SIDES.map(([, latitude]) => latitude);
const outward = (value, round) => round(value * 10) / 10;
assert.deepEqual(SHEET_WGS84, {
  west: outward(Math.min(...longitudes), Math.floor),
  east: outward(Math.max(...longitudes), Math.ceil),
  south: outward(Math.min(...latitudes), Math.floor),
  north: outward(Math.max(...latitudes), Math.ceil),
});
for (const [longitude, latitude] of ON_SIDES) {
  assert.ok(longitude >= SHEET_WGS84.west && longitude <= SHEET_WGS84.east, `${longitude}`);
  assert.ok(latitude >= SHEET_WGS84.south && latitude <= SHEET_WGS84.north, `${latitude}`);
}
assert.ok(SHEET_WGS84.east < SHEET_WGS84.south);

process.stdout.write(
  `tools/sketch/kml: LV95 to WGS84 meets swisstopo's worked example to its printed figures, and three points of REFRAME within ${ACCURACY_M.toFixed(2)} m; WGS84 to LV95 meets its own, Bern's constants, REFRAME within ${LV95_ACCURACY_M} m and two round trips; the sheet lies in SHEET_WGS84\n`,
);
