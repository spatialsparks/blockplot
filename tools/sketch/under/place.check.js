// The check of where the map lies under the top view (ST-046, T-046.1): under/place.js by hand,
// with no browser and nothing of the real site. On the made-up plot's paper - x from -4 m, y to
// 28 m - and its place, E 2 600 000, N 1 200 000, at four bearings: 0, 90, the made-up plot's 232,
// and the one whose sine is 3/5 and cosine 4/5, which is no quarter. At three zooms, in a window
// of 800 by 600: nearer than the map's nearest level, one where a pixel is a pixel of the map, and
// one far out. Held: the level, the scale, the turn, the box and the place under the window's
// middle; a refusal of each kind; a corner of the plot, from LV95 through what underOf gives, onto
// the screen within a hair of where the top view draws it, by the pad's own paper.js; a far view's
// pictures by hand; and at every rung of the zoom's ladder the level's rule and the bound on the
// number of pictures. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/under/place.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { NEAREST, pictures, pixelOf } from '../map/view.js';
import { onMap } from '../new-plot/frame.js';
import { LEVELS } from '../swisstopo/hosts.js';
import { NO_PLACE, underOf } from './place.js';

// The pad's own top view of the made-up plot: its paper, and the zoom's ladder.
globalThis.location = { hash: '#top' };
await import('../demo-site.js');
await import('../paper.js');
await import('../grid.js');
const { SITE, paper, grid } = globalThis;
assert.equal(paper.VIEW, 'top');
assert.deepEqual([SITE.xFromM, SITE.yToM, SITE.cellM, SITE.bearingDeg], [-4, 28, 0.5, 232]);
assert.deepEqual(SITE.originLV95, [2_600_000, 1_200_000]);

const near = (actual, expected, hair, what) =>
  assert.ok(Math.abs(actual - expected) <= hair, `${what}: ${actual}, not ${expected}`);
const SIZE = { wide: 800, high: 600 };
// The bearing whose sine is 3/5 and cosine 4/5: some 36.87 degrees.
const B345 = (Math.atan2(3, 4) * 180) / Math.PI;
const placeAt = (bearingDeg) => ({ ...SITE, bearingDeg });

// THE THREE ZOOMS, by hand: so many metres a CSS pixel, half a metre over `px`; the level, the
// coarsest of no more metres; the scale, its metres over the view's.
// - Near: 32 px a cell, 1/64 m a pixel - nearer than the nearest, 0.1 m: level 28, scale 6.4.
// - Even: 1 px a cell, 0.5 m a pixel: level 26, scale 1.
// - Far: 0.008 px a cell, 62.5 m a pixel: level 18, 50 m, scale 0.8.
// And where each puts the window's middle, (400, 300): column = 400 / px + left, row = 300 / px
// + top, x = -4 + column / 2, y = 28 - row / 2.
const ZOOMS = {
  near: { zoom: { px: 32, left: 60, top: 0 }, level: 28, scale: 6.4, middle: [32.25, 23.3125] },
  even: { zoom: { px: 1, left: -10, top: -20 }, level: 26, scale: 1, middle: [191, -112] },
  far: {
    zoom: { px: 0.008, left: -50_000, top: -37_500 },
    level: 18,
    scale: 0.8,
    middle: [-4, 28],
  },
};
assert.equal(NEAREST, 28);
for (const [name, { zoom, level, scale }] of Object.entries(ZOOMS)) {
  const under = underOf(SITE, zoom, SIZE);
  assert.equal(under.level, level, name);
  assert.equal(under.view.level, level, name);
  near(under.scale, scale, 1e-12, name);
  assert.deepEqual(under.centre, [400, 300], name);
}

// THE TURN, by hand: 90 - b, clockwise, from 0 to under 360. And the box, by hand: the window
// turned, (800 |cos| + 600 |sin|) by (800 |sin| + 600 |cos|), over the scale, up to a whole pixel.
// At 232 the turn is 218: |cos| = cos 38 = 0.788011, |sin| = sin 38 = 0.615661, 999.81 by 965.34.
// At B345 the turn's cosine is 3/5 and its sine 4/5: 480 + 480 by 640 + 360.
const BOXES = [
  [90, 0, { near: [125, 94], even: [800, 600], far: [1000, 750] }],
  [0, 90, { near: [94, 125], even: [600, 800], far: [750, 1000] }],
  [232, 218, { even: [1000, 966] }],
  [B345, 90 - B345, { near: [150, 157], even: [960, 1000], far: [1200, 1250] }],
];
for (const [bearing, turn, boxes] of BOXES) {
  for (const [name, [wide, high]] of Object.entries(boxes)) {
    const under = underOf(placeAt(bearing), ZOOMS[name].zoom, SIZE);
    near(under.turnDeg, turn, 1e-9, `turn at ${bearing}`);
    assert.deepEqual(under.box, { wide, high }, `box at ${bearing}, ${name}`);
  }
}
assert.equal(underOf(placeAt(270), ZOOMS.even.zoom, SIZE).turnDeg, 180);
assert.equal(underOf(placeAt(359), ZOOMS.even.zoom, SIZE).turnDeg, 91);

// THE PLACE UNDER THE WINDOW'S MIDDLE, by hand, from its x and y in the frame: at 90 x is east
// and y north; at 0 x is north and y west; at B345 E = 0.6 x - 0.8 y, N = 0.8 x + 0.6 y; at 232
// E = -0.788011 x + 0.615661 y, N = -0.615661 x - 0.788011 y.
const MIDDLES = [
  [90, 'even', 2_600_191, 1_199_888],
  [90, 'near', 2_600_032.25, 1_200_023.3125],
  [90, 'far', 2_599_996, 1_200_028],
  [0, 'even', 2_600_112, 1_200_191],
  [B345, 'even', 2_600_204.2, 1_200_085.6],
  [232, 'even', 2_599_780.536, 1_199_970.666],
  [232, 'near', 2_599_988.939, 1_199_961.774],
  [232, 'far', 2_600_020.391, 1_199_980.398],
];
for (const [bearing, name, e, n] of MIDDLES) {
  const { view } = underOf(placeAt(bearing), ZOOMS[name].zoom, SIZE);
  near(view.e, e, 1e-3, `east at ${bearing}, ${name}`);
  near(view.n, n, 1e-3, `north at ${bearing}, ${name}`);
}

// THE REFUSALS: no place at all, LV03's figures, east of the sheet, south of it.
for (const originLV95 of [
  undefined,
  null,
  [600_000, 200_000],
  [2_950_000, 1_200_000],
  [2_600_000, 1_020_000],
]) {
  assert.deepEqual(underOf({ ...SITE, originLV95 }, ZOOMS.even.zoom, SIZE), { refused: NO_PLACE });
}
assert.equal(NO_PLACE, "This plot has no place on swisstopo's map.");
assert.deepEqual(underOf(null, ZOOMS.even.zoom, SIZE), { refused: NO_PLACE });
// The sheet's own corner is on it.
assert.equal(
  underOf({ ...SITE, originLV95: [2_420_000, 1_350_000] }, ZOOMS.even.zoom, SIZE).refused,
  undefined,
);

// THE ROUND TRIP. The plot's corner x = 36, y = 23, in LV95 by hand - and by the frame's own
// `onMap`, as New plot's map lays it: at 90 E +36, N +23; at 0 E -23, N +36; at B345 E 21.6 -
// 18.4, N 28.8 + 13.8; at 232 E -28.368387 + 14.160214, N -22.163813 - 18.124247.
const CORNER = [36, 23];
const CORNERS = [
  [90, 2_600_036, 1_200_023],
  [0, 2_599_977, 1_200_036],
  [B345, 2_600_003.2, 1_200_042.6],
  [232, 2_599_985.792, 1_199_959.712],
];
// Where the top view draws it, by paper.js: column 80, row 10 - and on the screen, by hand,
// near (640, 320), even (90, 30), far (400.64, 300.08).
assert.deepEqual(paper.cell(CORNER), [80, 10]);
const DRAWN = { near: [640, 320], even: [90, 30], far: [400.64, 300.08] };
/** Where the top view draws a place of its paper at a zoom: zoom.js's rule, `shown` and all. */
const drawn = ([x, y], { px, left, top }) => {
  const [column, row] = paper.cell([x, y]);
  return [(paper.shown(column) - left) * px, (row - top) * px];
};
/** Where a place of LV95 lies on the screen under the map as underOf lays it. */
function onScreen({ view, box, turnDeg, scale, centre }, [east, north]) {
  const [a, d] = pixelOf(view, box, { e: east, n: north });
  const [da, dd] = [a - box.wide / 2, d - box.high / 2];
  const turn = (turnDeg * Math.PI) / 180;
  const [cos, sin] = [Math.cos(turn), Math.sin(turn)];
  return [centre[0] + scale * (da * cos - dd * sin), centre[1] + scale * (da * sin + dd * cos)];
}
for (const [bearing, east, north] of CORNERS) {
  const [mE, mN] = onMap({ origin: SITE.originLV95, bearingDeg: bearing })(CORNER);
  near(mE, east, 1e-3, `corner's east at ${bearing}`);
  near(mN, north, 1e-3, `corner's north at ${bearing}`);
  for (const [name, { zoom }] of Object.entries(ZOOMS)) {
    const [sx, sy] = drawn(CORNER, zoom);
    near(sx, DRAWN[name][0], 1e-9, name);
    near(sy, DRAWN[name][1], 1e-9, name);
    const [ux, uy] = onScreen(underOf(placeAt(bearing), zoom, SIZE), [mE, mN]);
    // Within one CSS pixel, as the story asks - and in fact within a millionth of one.
    assert.ok(Math.hypot(ux - sx, uy - sy) < 1e-6, `corner at ${bearing}, ${name}: ${ux}, ${uy}`);
  }
}

// THE PICTURES OF A FAR VIEW, by hand: at 90 and far, level 18, 50 m a pixel, middle E 2 599 996,
// N 1 200 028, a box of 1000 by 750. Its west edge lies (2 599 996 - 2 420 000) / 50 - 500 =
// 3099.92 pixels from the sheet's, in column 12 (3072); its east edge at 4099.92, in column 16.
// Its north edge (1 350 000 - 1 200 028) / 50 - 375 = 2624.44, in row 10 (2560); its south edge
// at 3374.44, in row 13. Five columns by four rows: twenty, the first 27.92 and 64.44 over the edge.
const farUnder = underOf(placeAt(90), ZOOMS.far.zoom, SIZE);
const twenty = pictures(farUnder.view, farUnder.box);
assert.equal(twenty.length, 20);
assert.deepEqual(
  [twenty[0].column, twenty[0].row, twenty.at(-1).column, twenty.at(-1).row],
  [12, 10, 16, 13],
);
near(twenty[0].left, -27.92, 1e-6, 'left');
near(twenty[0].top, -64.44, 1e-6, 'top');

// EVERY RUNG OF THE LADDER. The level's rule: of no more metres than the view's, and the one
// before it of more - or the nearest, nearer than 0.1 m a pixel. Two levels are at most 2.5 apart.
const ratios = LEVELS.slice(1).map((metres, at) => LEVELS[at] / metres);
assert.equal(Math.max(...ratios), 2.5);
const BY_HAND = { 32: 28, 4: 28, 2: 27, 1: 26, 0.6: 26, 0.1: 21, 0.01: 18, 0.006: 18 };
for (const [px, level] of Object.entries(BY_HAND)) {
  assert.equal(underOf(SITE, { px: Number(px), left: 0, top: 0 }, SIZE).level, level, `rung ${px}`);
}
// And the bound on the pictures: (ceil((2.5 D + 1) / 256) + 1)², D the window's diagonal - 529 at
// 1920 by 1080 - at every rung, at turns of every kind, in windows wide, tall, small and large,
// with the window's middle on the plot and far beside it.
const most = ({ wide, high }) => (Math.ceil((2.5 * Math.hypot(wide, high) + 1) / 256) + 1) ** 2;
assert.equal(most({ wide: 1920, high: 1080 }), 529);
const WINDOWS = [
  SIZE,
  { wide: 1920, high: 1080 },
  { wide: 300, high: 2000 },
  { wide: 1, high: 1 },
  { wide: 3840, high: 2160 },
];
for (const px of grid.LADDER) {
  for (const bearing of [0, 15, 45, 90, 137, 232, 359.9]) {
    for (const size of WINDOWS) {
      for (const [left, top] of [
        [0, 0],
        [-size.wide / px / 2, -size.high / px / 2],
        [12_345, -6789],
      ]) {
        const under = underOf(placeAt(bearing), { px, left, top }, size);
        const metres = 0.5 / px;
        const at = under.level;
        assert.ok(LEVELS[at] <= metres || at === NEAREST, `level at ${px}`);
        assert.ok(at === 0 || LEVELS[at - 1] > metres, `coarsest at ${px}`);
        assert.ok(under.scale <= 1 || metres < LEVELS[NEAREST], `scale at ${px}`);
        assert.ok(under.scale >= 0.4, `scale at ${px}`);
        const count = pictures(under.view, under.box).length;
        assert.ok(count <= most(size), `${count} pictures at ${px}, ${bearing}, ${size.wide}`);
      }
    }
  }
}

process.stdout.write('under/place.js holds: the map lies under the top view true to the plot\n');
