// The check of a station fitted to the window: where the eye stands and what it looks at,
// against what a person worked out by hand - from above, and looking down a slope, where the
// line of sight has to be moved for the box to lie in the middle of the picture - and then, for
// every station of a made-up box in three windows, that the eye looks the way the station looks
// and has the box in the middle of the picture, filling it to its margin and no further. No
// browser, and nothing but made-up figures. Run by tools/sketch/check.js, as every *.check.js
// is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { stations } from '../scene/stations.js';
import { FILLS, fitted } from './fit.js';

const minus = (a, b) => a.map((value, axis) => value - b[axis]);
const dot = (a, b) => a.reduce((sum, value, axis) => sum + value * b[axis], 0);
const cross = (a, b) =>
  [0, 1, 2].map((i) => a[(i + 1) % 3] * b[(i + 2) % 3] - a[(i + 2) % 3] * b[(i + 1) % 3]);
const unit = (a) => a.map((value) => value / Math.hypot(...a));
// What was worked out by hand is compared to the millimetre.
const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) =>
    assert.ok(Math.abs(value - expected[at]) < 1e-3, `${what}: ${actual} is not ${expected}`),
  );
};
assert.equal(FILLS, 0.9);

// The made-up box of the stations' own check: 6 m down the plot, 2 m across it and 3 m up, about
// [13, 21, 401.5].
const box = { min: [10, 20, 400], max: [16, 22, 403] };
const middle = [13, 21, 401.5];

// From above, in a picture twice as wide as high that takes in 90 degrees upright: a place lies
// at the edge of the picture where it is as far beside the line of sight as it is ahead of the
// eye, upright, and twice as far, across. The top of the box reaches 3 m along the plot and 1 m
// across it from its middle: nine tenths of the way to the sides of the picture from
// 3 / (0.9 * 2) = 1.667 m over it, and less far out upright, where 1 / 0.9 = 1.111 m would do.
// The top lies 1.5 m over the middle: the eye stands 3.167 m over the middle, straight above it,
// for the box is the same on either side.
const above = stations({ box }).above;
const down = fitted(above, box, { deg: 90, shape: 2 });
near(down.eye, [13, 21, 401.5 + 3.167], 'the eye above, in a wide window');
near(down.target, middle, 'what it looks at from above');
// In a picture half as wide as high the sides are four times as near: 3 / (0.9 * 0.5) = 6.667 m
// over the top, 8.167 m over the middle.
const narrow = fitted(above, box, { deg: 90, shape: 0.5 });
near(narrow.eye, [13, 21, 401.5 + 8.167], 'the eye above, in a tall window');

// Looking down a slope of 3 in 4 from far off downhill, at a box of 10 m by 1 m by 5 m about
// [0, 0, 0], in a square picture that takes in 90 degrees: for every metre, the line of sight
// runs 0.8 m up the plot and 0.6 m down. Of the box's four edges across the plot, how far ahead
// of the middle each lies along that line, and how far above it:
//   foot of the near face, x = 5, h = -2.5:   -4 + 1.5 = -2.5 ahead,   -3 - 2 = -5 above
//   top of the near face,  x = 5, h = 2.5:    -4 - 1.5 = -5.5 ahead,   -3 + 2 = -1 above
//   top of the far face,   x = -5, h = 2.5:    4 - 1.5 = 2.5 ahead,     3 + 2 = 5 above
//   foot of the far face,  x = -5, h = -2.5:   4 + 1.5 = 5.5 ahead,     3 - 2 = 1 above
// An edge is nine tenths of the way to the top of the picture where the eye stands its height
// above the line / 0.9, less what it lies ahead, from the middle: the top of the near face asks
// for the most, -1 / 0.9 + 5.5 = 4.389 m. At the bottom its foot does, 5 / 0.9 + 2.5 = 8.056 m.
// Through the middle of the box, the line of sight would have the eye 8.056 m off and the box
// low in the picture. It is moved down until both ask the same: by 0.9 * (8.056 - 4.389) / 2 =
// 1.65 m, to (8.056 + 4.389) / 2 = 6.222 m. Down is 0.6 m down the plot and 0.8 m lower for
// every metre: the view looks at [0.99, 0, -1.32], from 6.222 m back along its line of sight.
const sloping = { eye: [80, 0, 60], target: [0, 0, 0], up: [0, 0, 1] };
const square = { deg: 90, shape: 1 };
const thin = fitted(sloping, { min: [-5, -0.5, -2.5], max: [5, 0.5, 2.5] }, square);
near(thin.target, [0.99, 0, -1.32], 'what the eye looks at, down a slope');
near(thin.eye, [0.99 + 0.8 * 6.222, 0, -1.32 + 0.6 * 6.222], 'the eye that looks down a slope');
// The box is 1 m wide: its sides ask for less, 0.5 / 0.9 + 5.5 = 6.056 m. Were it 4 m wide they
// would ask for more - 2 / 0.9 + 5.5 = 7.722 m - and the eye would stand that far back. Seen
// from there, the top of the far face lies 5 m above the line through the middle and
// 2.5 + 7.722 = 10.222 m ahead of the eye, the foot of the near face 5 m below it and
// 7.722 - 2.5 = 5.222 m ahead. The two take the most of the picture between them, and show
// equally far out on either side of a line that runs (5 * 5.222 - 5 * 10.222) / (10.222 + 5.222)
// = -1.619 m above the middle - 1.619 m below it: the view looks at [0.971, 0, -1.295].
const broad = fitted(sloping, { min: [-5, -2, -2.5], max: [5, 2, 2.5] }, square);
near(broad.target, [0.6 * 1.619, 0, -0.8 * 1.619], 'what the eye looks at, at a broad box');
near(broad.eye, [0.971 + 0.8 * 7.722, 0, -1.295 + 0.6 * 7.722], 'the eye at a broad box');

// Every station of the box, in a wide window, a square one and a tall one, as the stage's camera
// has them: 45 degrees upright. Where each corner shows in the picture is worked out here anew:
// how far from the middle of the picture to its edge, across and upright - 1 is the edge.
const cornersOf = ({ min, max }) =>
  [0, 1, 2, 3, 4, 5, 6, 7].map((n) => [0, 1, 2].map((axis) => ((n >> axis) & 1 ? max : min)[axis]));
function shares({ eye, target, up }, { deg, shape }, corner) {
  const sight = unit(minus(target, eye));
  const right = unit(cross(sight, up));
  const [from, edge] = [minus(corner, eye), Math.tan((deg * Math.PI) / 360)];
  const ahead = dot(from, sight);
  assert.ok(ahead > 0, 'a corner lies behind the eye');
  return [
    dot(from, right) / (ahead * edge * shape),
    dot(from, cross(right, sight)) / (ahead * edge),
  ];
}
for (const shape of [1440 / 861, 1, 0.5]) {
  const field = { deg: 45, shape };
  for (const [name, station] of Object.entries(stations({ box }))) {
    const what = `${name}, in a window ${shape} wide for its height`;
    const { eye, target } = fitted(station, box, field);
    // It looks the way the station looks - from the same side, and no mirror image - and at
    // the place on that line that is nearest to the middle of the box.
    const sight = unit(minus(target, eye));
    near(sight, unit(minus(station.target, station.eye)), what);
    near([dot(minus(target, middle), sight)], [0], what);
    // The box lies in the middle of the picture: it reaches as far out to the left as to the
    // right, and to the top as to the bottom. One way it reaches nine tenths of the way to the
    // edges, and the other way no further: no nearer eye would have it whole, with its margin.
    const seen = { eye, target, up: station.up };
    const out = cornersOf(box).map((corner) => shares(seen, field, corner));
    const reach = [0, 1].map((way) => Math.max(...out.map((share) => share[way])));
    const other = [0, 1].map((way) => Math.min(...out.map((share) => share[way])));
    reach.forEach((most, way) =>
      assert.ok(Math.abs(most + other[way]) < 1e-9, `${what}: ${other[way]} to ${most}`),
    );
    assert.ok(Math.abs(Math.max(...reach) - FILLS) < 1e-9, `${what}: the box reaches ${reach}`);
  }
}

process.stdout.write(
  'tools/sketch/view3d: a stand looks the way its station looks, with the box in the middle of the picture and filling it\n',
);
