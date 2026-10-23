// The frame's check: a place of the plot lies on the stage where the frame says, heights are
// drawn from the scene's lowest point, nothing is mirrored, and the way back leads back - worked
// out by hand, with no browser and no three.js. Run by tools/sketch/check.js, as every
// *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { frameOf } from './frame.js';

// A made-up scene, of which the frame takes the box alone: its lowest point lies 800.5 m above
// sea level.
const place = frameOf({ box: { min: [-4, -3, 800.5], max: [42, 28, 826] } });

// The plot's x stays x, its height becomes y, counted from the lowest point, and its y becomes
// -z: 11 m down the plot, 9 m across it and 814.25 m up is 13.75 m over the floor of the stage.
assert.deepEqual(place([11, 9, 814.25]), [11, 13.75, -9]);
// The lowest point of the scene lies on the floor, and nothing lies under it.
assert.equal(place([42, -3, 800.5])[1], 0);
assert.equal(place([-4, 28, 826])[1], 25.5);

// Nothing is mirrored: a step down the plot, a step across it and a step up are on the stage
// what they are on the plot, a right-handed three. Down the plot crossed with across it is up.
const from = place([0, 0, 800.5]);
const step = (to) => place(to).map((value, axis) => value - from[axis]);
const [down, across, up] = [step([1, 0, 800.5]), step([0, 1, 800.5]), step([0, 0, 801.5])];
// A nought is a nought here, with whatever sign the arithmetic left it.
const cross = ([a, b, c], [d, e, f]) =>
  [b * f - c * e, c * d - a * f, a * e - b * d].map((value) => value + 0);
assert.deepEqual(
  [down, across, up],
  [
    [1, 0, 0],
    [0, 0, -1],
    [0, 1, 0],
  ],
);
assert.deepEqual(cross(down, across), up);
// And from above the stage shows the top view: one who looks down three.js's y with its x to the
// right has -z running up the picture, and that is the plot's y.
assert.deepEqual(across, [0, 0, -1]);

// The way back: a place of the stage is a place of the plot again. 13.75 m over the floor of the
// stage is 814.25 m above sea level, and 9 m towards the eye of one who looks down from above
// with x to the right - three.js's z - is 9 m back across the plot.
assert.deepEqual(place.back([11, 13.75, -9]), [11, 9, 814.25]);
assert.deepEqual(place.back([-4, 0, 3]), [-4, -3, 800.5]);
// There and back is where it was, for places that the frame's own arithmetic keeps whole.
for (const at of [
  [11, 9, 814.25],
  [42, -3, 800.5],
  [-4, 28, 826],
]) {
  assert.deepEqual(place.back(place(at)), at);
}

process.stdout.write(
  'tools/sketch/view3d: the frame puts the plot on the stage, from its lowest point up, unmirrored, and back\n',
);
