// Between LV95 and WGS84, by swisstopo's approximate formulas: where WGS84 exists in the pad
// (directive 35, ST-016, ST-045) - for the Google Earth file, which wgs84Of turns LV95 into, and
// at New plot's reader of a GeoJSON file, which lv95Of turns a file's WGS84 into as it reads the
// file, and keeps none of it. No file of the pad outside kml/ names this module or what it gives
// but those two of the reader - own.check.js holds that.
//
// The formulas are swisstopo's approximate ones, as its document gives them: "Näherungsformeln
// für die Transformation zwischen Schweizer Projektionskoordinaten und WGS84" ("Approximate
// formulas for the transformation between Swiss projection coordinates and WGS84"), Bundesamt
// für Landestopografie swisstopo, Geodäsie, version of December 2016. wgs84Of is its section 2,
// "Näherungsformeln für die Umrechnung von Schweizer Projektionskoordinaten in ellipsoidische
// WGS84-Koordinaten", on page 4: U. Marti's of May 1999, after Bolliger, 1967. lv95Of is its
// section 1, "Näherungsformeln für die Umrechnung von ellipsoidischen WGS84-Koordinaten in
// Schweizer Projektionskoordinaten", on page 3: after H. Dupraz, EPFL, 1992, its parameters
// computed anew by U. Marti in May 1999. Every coefficient below is a figure of those pages,
// typed in as it stands, and read twice. Where the document lies is said in docs/sketch/kml.md:
// a script names no address.
//
// Heights are not converted. Google Earth's altitudes are taken as metres above sea level, and
// the raise takes up the difference, tuned by eye (the story's ADR, Decision 4). It imports
// nothing: a page and Node load it alike. wgs84.check.js proves it.

// Section 2, step 1: E and N into the civil system, Bern = 0 / 0, in units of 1000 km.
const BERN = [2_600_000, 1_200_000];
const UNIT_M = 1_000_000;

// Section 2, step 2: longitude and latitude in units of 10 000", each a sum of terms - a
// coefficient times y' and x' to the powers that follow it. Latitude's last is -0.0140 on the
// page: the format check writes a figure with no zero at its end.
const LONGITUDE = [
  [2.6779094, 0, 0],
  [4.728982, 1, 0],
  [0.791484, 1, 1],
  [0.1306, 1, 2],
  [-0.0436, 3, 0],
];
const LATITUDE = [
  [16.9023892, 0, 0],
  [3.238272, 0, 1],
  [-0.270978, 2, 0],
  [-0.002528, 0, 2],
  [-0.0447, 2, 1],
  [-0.014, 0, 3],
];

// Section 2, step 3: of 10 000" to degrees, times 100 / 36.
const DEGREES = 100 / 36;

/**
 * The accuracy the page states of these formulas, all over Switzerland: better than 0.12" in
 * longitude and 0.08" in latitude (section 2, point 4, page 4). The page says it in seconds of
 * arc; in metres it is worked out here, on a sphere of `EARTH_RADIUS_M`, where a second of
 * latitude is `EARTH_RADIUS_M` times pi / 648 000, 30.89 m, and a second of longitude no longer,
 * anywhere: so the two together lie within their hypotenuse, 4.45 m. An upper bound - a second
 * of longitude in Switzerland is some 21 m - and the gap a point of the file may have, at most.
 */
export const STATED_SECONDS = { longitude: 0.12, latitude: 0.08 };
/** The Earth's mean radius, in metres, of the sphere that a gap is worked out on. */
export const EARTH_RADIUS_M = 6_371_000;
/** Metres of one second of arc along a great circle of that sphere. */
export const SECOND_M = (EARTH_RADIUS_M * Math.PI) / 648_000;
export const ACCURACY_M = Math.hypot(STATED_SECONDS.longitude, STATED_SECONDS.latitude) * SECOND_M;

/** A sum of terms of two figures, each term a coefficient and the powers of the first and second. */
const sum = (terms, y, x) =>
  terms.reduce((total, [coefficient, ofY, ofX]) => total + coefficient * y ** ofY * x ** ofX, 0);

/**
 * Of a place of LV95, `[east, north]` in metres, `[longitude, latitude]` of WGS84 in degrees, by
 * swisstopo's approximate formulas. It takes any two numbers, and is good within `ACCURACY_M` in
 * Switzerland alone: whether a place is one of LV95 is `isLV95`'s to say (new-plot/frame.js).
 */
export function wgs84Of([east, north]) {
  const y = (east - BERN[0]) / UNIT_M;
  const x = (north - BERN[1]) / UNIT_M;
  return [sum(LONGITUDE, y, x) * DEGREES, sum(LATITUDE, y, x) * DEGREES];
}

// Section 1, step 1: latitude and longitude in seconds of arc. Step 2: their differences from
// Bern, latitude 169 028.66" and longitude 26 782.5", in units of 10 000".
const SECONDS = 3600;
const BERN_SECONDS = { longitude: 26782.5, latitude: 169028.66 };
const UNIT_SECONDS = 10_000;

// Section 1, step 3, in LV95: E and N in metres, each a sum of terms - a coefficient times
// lambda' and phi' to the powers that follow it.
const EAST = [
  [2600072.37, 0, 0],
  [211455.93, 1, 0],
  [-10938.51, 1, 1],
  [-0.36, 1, 2],
  [-44.54, 3, 0],
];
const NORTH = [
  [1200147.07, 0, 0],
  [308807.95, 0, 1],
  [3745.25, 2, 0],
  [76.63, 0, 2],
  [-194.56, 2, 1],
  [119.79, 0, 3],
];

/**
 * The accuracy the page states of section 1, in metres: "besser als 1 Meter in der Lage" -
 * better than a metre in position, all over Switzerland (section 1, point 4, page 3, under its
 * worked example; its heading says "Genauigkeit im 1-Meter-Bereich").
 */
export const LV95_ACCURACY_M = 1;

/**
 * The box of longitudes and latitudes, in degrees, that holds the map's sheet - `SHEET` of
 * swisstopo/hosts.js, every 10 km of its four sides turned by `wgs84Of` - rounded outward to a
 * tenth of a degree. Its longitudes all lie under its latitudes: the one fact that tells a
 * longitude-first pair from a latitude-first one.
 */
export const SHEET_WGS84 = Object.freeze({ west: 5.0, east: 11.5, south: 45.3, north: 48.4 });

/**
 * Of a place of WGS84, `[longitude, latitude]` in degrees, `[east, north]` of LV95 in metres, by
 * swisstopo's approximate formulas. It takes any two numbers, and is good within
 * `LV95_ACCURACY_M` in Switzerland alone: whether a place lies on the sheet is its caller's to say.
 */
export function lv95Of([longitude, latitude]) {
  const lambda = (longitude * SECONDS - BERN_SECONDS.longitude) / UNIT_SECONDS;
  const phi = (latitude * SECONDS - BERN_SECONDS.latitude) / UNIT_SECONDS;
  return [sum(EAST, lambda, phi), sum(NORTH, lambda, phi)];
}
