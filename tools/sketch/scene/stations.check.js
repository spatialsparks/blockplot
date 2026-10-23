// The stations' check: a made-up scene's box, and where the eye stands at each station against
// what a person worked out by hand - that the whole box is in view, that the front is from below
// the house, and that no station shows a mirror image. Run by tools/sketch/check.js, as every
// *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { DOWN_DEG, FIELD_DEG, stations } from './stations.js';

// A made-up scene, as far as a station reads it: a box of 6 m down the plot, 2 m across it and
// 3 m up - 7 m from corner to corner, so the ball around it is 3.5 m in radius about
// [13, 21, 401.5]. Its lowest floor lies a metre above its bottom.
const scene = { box: { min: [10, 20, 400], max: [16, 22, 403] }, levels: [402, 401] };

const minus = (a, b) => a.map((value, axis) => value - b[axis]);
const cross = (a, b) =>
  [0, 1, 2].map((i) => a[(i + 1) % 3] * b[(i + 2) % 3] - a[(i + 2) % 3] * b[(i + 1) % 3]);
const unit = (a) => a.map((value) => value / Math.hypot(...a));
const near = (actual, expected, what) =>
  actual.forEach((value, axis) =>
    assert.ok(Math.abs(value - expected[axis]) < 1e-9, `${what}: ${actual}`),
  );

// By hand, for a view 60 degrees wide and stations that look 30 degrees down: the ball fits into
// 60 degrees from 3.5 / sin 30 = 7 m off. An eye 7 m off and 30 degrees up stands 7 * sin 30 =
// 3.5 m higher than the middle and 7 * cos 30 = 6.062 m beside it: downhill at the front, uphill
// at the back, at the small y on the left, at the large y on the right. Above, it is 7 m up.
const beside = 7 * (Math.sqrt(3) / 2);
const hand = stations(scene, { fieldDeg: 60, downDeg: 30 });
near(hand.front.eye, [13 + beside, 21, 405], 'front');
near(hand.back.eye, [13 - beside, 21, 405], 'back');
near(hand.left.eye, [13, 21 - beside, 405], 'left');
near(hand.right.eye, [13, 21 + beside, 405], 'right');
near(hand.above.eye, [13, 21, 408.5], 'above');
for (const station of Object.values(hand)) assert.deepEqual(station.target, [13, 21, 401.5]);

// As they are without being told: the whole box is in view. From every station, each of the
// box's eight corners lies within half of FIELD_DEG of the line of sight.
const usual = stations(scene);
assert.deepEqual(Object.keys(usual), ['front', 'back', 'left', 'right', 'above']);
const { min, max } = scene.box;
const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((n) =>
  [0, 1, 2].map((axis) => ((n >> axis) & 1 ? max : min)[axis]),
);
for (const [name, { eye, target }] of Object.entries(usual)) {
  const sight = unit(minus(target, eye));
  for (const corner of corners) {
    const to = unit(minus(corner, eye));
    const off =
      (Math.acos(sight.reduce((sum, value, axis) => sum + value * to[axis], 0)) * 180) / Math.PI;
    assert.ok(
      off < FIELD_DEG / 2 + 1e-9,
      `${name}: a corner lies ${off} degrees off the line of sight`,
    );
  }
}

// The front is from below the house: the eye is downhill of the box - x runs downhill - and
// looks up the slope, and a little down on it: DOWN_DEG below level, from higher than the lowest
// floor and than what it looks at.
const { front, above } = usual;
assert.ok(front.eye[0] > max[0] && front.target[0] < front.eye[0]);
assert.ok(front.eye[2] > Math.min(...scene.levels) && front.eye[2] > front.target[2]);
const [ahead, , drop] = unit(minus(front.target, front.eye));
near([(Math.atan2(-drop, -ahead) * 180) / Math.PI], [DOWN_DEG], 'front looks down');
// The back is from uphill, and the sides from beside the box.
assert.ok(usual.back.eye[0] < min[0] && usual.left.eye[1] < min[1] && usual.right.eye[1] > max[1]);

// No station shows a mirror image. What lies to the right on the screen, and what lies up, by
// hand: from the front y runs to the right, as in the pad's front view, and from the back to the
// left; from the left x runs to the right, as in the pad's side view, and from the right to the
// left. From every one of them h runs up. From above x runs to the right and y up, as the top
// view lies.
const screen = ({ eye, target, up }) => {
  const sight = unit(minus(target, eye));
  const right = unit(cross(sight, up));
  return { right, up: cross(right, sight) };
};
const rights = {
  front: [0, 1, 0],
  back: [0, -1, 0],
  left: [1, 0, 0],
  right: [-1, 0, 0],
  above: [1, 0, 0],
};
for (const [name, right] of Object.entries(rights)) {
  near(screen(usual[name]).right, right, `${name}, to the right`);
  if (name !== 'above') assert.ok(screen(usual[name]).up[2] > 0.9, `${name}, up`);
}
near(screen(above).up, [0, 1, 0], 'above, up');
near(minus(above.target, above.eye).slice(0, 2), [0, 0], 'above looks straight down');
assert.ok(above.eye[2] > max[2]);

process.stdout.write(
  'tools/sketch/scene: every station has the whole scene in view, and none mirrors it\n',
);
