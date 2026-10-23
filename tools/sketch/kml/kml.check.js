// The check of kml.js: the text of a KML file, read back by hand. On a made-up place - the zero
// of the Swiss grid, bearing 90, where x runs east and y north - a level box, a slant that comes
// down to an edge, a slant whose foot and top slope along y, a see-through box, a name with each
// of the five signs, plain styles, the outline, and every refusal. It asks nobody, and holds
// nothing of a real plot.
import assert from 'node:assert/strict';
import process from 'node:process';
import { kmlOf } from './kml.js';
import { wgs84Of } from './wgs84.js';

const [E0, N0] = [2_600_000, 1_200_000];
const PLACE = { originLV95: [E0, N0], bearingDeg: 90 };
const RAISE_M = -2.5;
const LEVEL = {
  min: [0, 0, 500],
  max: [10, 4, 506],
  colour: '#FF8000',
  see: 'solid',
  name: 'Hall',
};
// A slant along x, as the scene's parts have one (scene/parts.js): its foot level at 10 m, its
// top 11 m where x is 0 and 10 m where x is 2 - it comes down to an edge there. No name.
const EDGED = { shape: 'slant', min: [0, 0, 10], max: [2, 1, 11], colour: '#ff8000', see: 'solid' };
Object.assign(EDGED, { along: 0, low: [10, 10], high: [11, 10] });
// A slant along y whose foot slopes too: 10 m where y is 0 and 9 m where it is 2, its top 12 m
// and 11 m.
const SLOPED = { shape: 'slant', min: [4, 0, 9], max: [6, 2, 12], colour: '#ff8000', see: 'solid' };
Object.assign(SLOPED, { along: 1, low: [10, 9], high: [12, 11], name: 'Ramp' });
const NAMED = `Tom & "Jerry's" <box>`;
const GLASS = {
  min: [0, 10, 500],
  max: [4, 14, 503],
  colour: '#3366cc',
  see: 'through',
  name: NAMED,
};
const OUTLINE = [
  [-2, -2],
  [30, -2],
  [30, 20],
  [-2, 20],
];
const ABOUT = ['A made-up file.', 'Raised by -2.5 m: tuned by nobody yet & <nowhere>.'];
const file = {
  name: NAMED,
  about: ABOUT,
  place: PLACE,
  raiseM: RAISE_M,
  boxes: [LEVEL, EDGED, SLOPED, GLASS],
  outline: OUTLINE,
};
const text = kmlOf(file);

/** The Placemarks of the text, each its own text. */
const placemarks = text.split('<Placemark>').slice(1);
/** The rings of a Placemark: each a list of points `[longitude, latitude, altitude]`. */
const ringsOf = (mark) =>
  [...mark.matchAll(/<coordinates>([^<]*)<\/coordinates>/g)].map(([, points]) =>
    points.split(' ').map((point) => point.split(',').map(Number)),
  );
/** A point as the file writes it, of a place of LV95 worked out by hand and a height. */
const at = (east, north, h) => {
  const [longitude, latitude] = wgs84Of([east, north]);
  return [Number(longitude.toFixed(7)), Number(latitude.toFixed(7)), h];
};

// The head: XML, KML's name, one Document, its name and its lines escaped.
assert.ok(text.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n'));
assert.ok(text.includes('<kml xmlns="http://www.opengis.net/kml/2.2">'));
assert.equal(text.split('<Document>').length, 2);
const ESCAPED = 'Tom &amp; &quot;Jerry&apos;s&quot; &lt;box&gt;';
assert.ok(text.includes(`    <name>${ESCAPED}</name>\n`), 'the name, escaped');
assert.ok(
  text.includes(
    '<description>A made-up file.\nRaised by -2.5 m: tuned by nobody yet &amp; &lt;nowhere&gt;.</description>',
  ),
);
// Five Placemarks: the four boxes in their order, then the outline.
assert.equal(placemarks.length, 5);
const names = placemarks.map((mark) => /<name>([^<]*)<\/name>/.exec(mark)[1]);
assert.deepEqual(names, ['Hall', 'Block', 'Ramp', ESCAPED, 'Plot outline']);

// A box, and a slant of no edge: six polygons, each absolute, of five points, closed.
for (const mark of [placemarks[0], placemarks[2], placemarks[3]]) {
  assert.equal(mark.split('<Polygon>').length, 7);
  assert.equal(mark.split('<altitudeMode>absolute</altitudeMode>').length, 7);
  for (const ring of ringsOf(mark)) {
    assert.equal(ring.length, 5);
    assert.deepEqual(ring[4], ring[0]);
  }
}
// No ring of the file holds a point twice running, but its first again at its end.
for (const ring of placemarks.slice(0, 4).flatMap(ringsOf)) {
  ring.slice(1).forEach((point, index) => assert.notDeepEqual(point, ring[index]));
}
// The level box: its foot at 500 m and its top at 506 m, both raised by -2.5 m, at its four
// corners - x east, y north - whatever the order of a ring.
const sorted = (points) => points.map((point) => point.join()).sort();
const cornersAt = (h) => [
  at(E0, N0, h),
  at(E0 + 10, N0, h),
  at(E0 + 10, N0 + 4, h),
  at(E0, N0 + 4, h),
];
const [foot, top, ...sides] = ringsOf(placemarks[0]);
assert.deepEqual(sorted(foot.slice(0, 4)), sorted(cornersAt(497.5)));
assert.deepEqual(sorted(top.slice(0, 4)), sorted(cornersAt(503.5)));
// Each side is two corners of the foot and two of the top: every one of the eight in two sides.
const EIGHT = [...cornersAt(497.5), ...cornersAt(503.5)];
assert.deepEqual(sorted(sides.flatMap((side) => side.slice(0, 4))), sorted([...EIGHT, ...EIGHT]));
// The slant that comes down to an edge, BY HAND, raised by -2.5 m: its foot level at 7.5 m; its
// top 8.5 m along x = 0 and 7.5 m along x = 2; its side at x = 2 has no height and is no face;
// its sides along y are triangles; its end at x = 0 is whole. Five faces, each closed.
const ends = (ring) => sorted(ring.slice(0, -1));
const EDGED_FACES = [
  [at(E0, N0, 7.5), at(E0 + 2, N0, 7.5), at(E0 + 2, N0 + 1, 7.5), at(E0, N0 + 1, 7.5)],
  [at(E0, N0, 8.5), at(E0 + 2, N0, 7.5), at(E0 + 2, N0 + 1, 7.5), at(E0, N0 + 1, 8.5)],
  [at(E0, N0, 7.5), at(E0 + 2, N0, 7.5), at(E0, N0, 8.5)],
  [at(E0, N0 + 1, 7.5), at(E0, N0 + 1, 8.5), at(E0 + 2, N0 + 1, 7.5)],
  [at(E0, N0 + 1, 7.5), at(E0, N0, 7.5), at(E0, N0, 8.5), at(E0, N0 + 1, 8.5)],
];
const edged = ringsOf(placemarks[1]);
assert.deepEqual(edged.map(ends), EDGED_FACES.map(sorted));
assert.deepEqual(
  edged.map((ring) => ring.length),
  [5, 5, 4, 4, 5],
);
assert.ok(edged.every((ring) => String(ring.at(-1)) === String(ring[0])));
// The slant along y: its foot 7.5 m along y = 0 and 6.5 m along y = 2, its top 9.5 m and 8.5 m.
const [slopedFoot, slopedTop] = ringsOf(placemarks[2]);
const along = (h0, h2) => [at(E0 + 4, N0, h0), at(E0 + 6, N0, h0), at(E0 + 6, N0 + 2, h2)];
assert.deepEqual(ends(slopedFoot), sorted([...along(7.5, 6.5), at(E0 + 4, N0 + 2, 6.5)]));
assert.deepEqual(ends(slopedTop), sorted([...along(9.5, 8.5), at(E0 + 4, N0 + 2, 8.5)]));

// The styles: the level box and the two slants share one, opaque; the see-through box's alpha is
// HIDES of view3d/build.js, 0.35 of 255 - 89, 0x59. KML writes aabbggrr. Each is plain: its
// faces not outlined, and no edge drawn.
assert.equal(text.split('<Style id=').length, 3);
assert.ok(text.includes('<PolyStyle><color>ff0080ff</color><outline>0</outline></PolyStyle>'));
assert.ok(text.includes('<PolyStyle><color>59cc6633</color><outline>0</outline></PolyStyle>'));
assert.ok(!text.includes('<LineStyle>') && !text.includes('<outline>1'), 'no edge is drawn');
assert.ok(!text.includes('innerBoundaryIs'), 'no face has a hole');
assert.equal(text.split('<styleUrl>#box-ff0080ff</styleUrl>').length, 4);
assert.equal(text.split('<styleUrl>#box-59cc6633</styleUrl>').length, 2);

// The outline: clamped to the ground, its corners and the first again, each at altitude 0.
const outline = placemarks[4];
assert.ok(outline.includes('<tessellate>1</tessellate>'));
assert.ok(outline.includes('<altitudeMode>clampToGround</altitudeMode>'));
const OUTLINED = [
  [-2, -2],
  [30, -2],
  [30, 20],
  [-2, 20],
  [-2, -2],
].map(([x, y]) => at(E0 + x, N0 + y, 0));
assert.deepEqual(ringsOf(outline), [OUTLINED]);
// A point: 7 decimals, 2 for the altitude, no blank inside it.
assert.match(text, /<coordinates>-?\d+\.\d{7},\d+\.\d{7},\d+\.\d{2} /);
// No figure of LV95 is in the file.
assert.ok(!text.includes('2600000') && !text.includes('1200000'));
// A box alone and an outline alone each make a file.
assert.equal(kmlOf({ ...file, boxes: [] }).split('<Placemark>').length, 2);
assert.equal(kmlOf({ ...file, outline: [] }).split('<Placemark>').length, 5);

// Each refusal, in one sentence.
const PLACE_SAID =
  'The place is no place of LV95: an east from 2 000 000 to under 3 000 000 and a north from 1 000 000 to under 2 000 000.';
const refusals = [
  [{ place: { originLV95: [600_000, 200_000], bearingDeg: 90 } }, PLACE_SAID],
  [{ place: { bearingDeg: 90 } }, PLACE_SAID],
  [{ place: undefined }, PLACE_SAID],
  [{ place: { originLV95: [E0, N0], bearingDeg: NaN } }, 'The bearing is no finite number.'],
  [{ place: { originLV95: [E0, N0], bearingDeg: '90' } }, 'The bearing is no finite number.'],
  [{ raiseM: '1' }, 'The raise is no finite number.'],
  [{ raiseM: Infinity }, 'The raise is no finite number.'],
  [{ boxes: [], outline: [] }, 'There is nothing to write: no box and no outline.'],
];
for (const [change, said] of refusals) {
  assert.throws(() => kmlOf({ ...file, ...change }), { message: said }, said);
}

process.stdout.write(
  'tools/sketch/kml: a box is six closed faces at its heights and the raise, a slant slopes and one that comes down to an edge has five, every face plain, glass is as see-through as the Volumes, a name is escaped, the outline lies on the ground, and a file that cannot be is refused\n',
);
