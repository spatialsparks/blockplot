// The check of the hill on the stage: of a made-up scene, built, the walls and the base under
// the ground against what a person worked out by hand - how many, where the frame puts them,
// which way they face - and how they are drawn: in the ground's earth, from either side, a step
// nearer in the depth than the walls of the blocks that stand against them, and after the
// outline. What the scene gives for a hill is tools/sketch/scene/ground.check.js's. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { DoubleSide } from 'three';
import { BASE_BELOW_M } from '../scene/ground.js';
import { sceneOf } from '../scene/scene.js';
import { build } from './build.js';
import { frameOf } from './frame.js';

// The made-up plot of the scene's own check: 4 m by 2.5 m in cells of half a metre, 8 columns
// from x = -1 on and 5 rows of the top view from y = 2 down. Its ground is lowest in the bottom
// right corner of the paper, at 100.75 m, and no block reaches lower: that is the floor of the
// stage.
const site = {
  cellM: 0.5,
  xFromM: -1,
  xToM: 3,
  yFromM: -0.5,
  yToM: 2,
  sideM: [100, 112],
  outline: [
    [0.25, 1.75],
    [1.25, 1.75],
    [-0.75, -0.25],
  ],
  ground: {
    baseM: 100,
    rowsCm: [
      '800 725 650 575 500 425 350 275 200',
      '775 700 625 550 475 300 325 250 175',
      '750 675 600 525 450 375 300 225 150',
      '725 650 575 500 425 350 275 200 125',
      '700 625 550 475 400 325 250 175 100',
      '675 600 525 450 375 300 225 150 75',
    ],
  },
};
// Three blocks: a garage of two cells by two, a dark one of one cell beside it, and a court of
// two cells by two, dug in.
const grey = { name: 'grey', hex: '#8795a1' };
const things = [
  { x: [1, 3], y: [1, 3], z: [6, 10], colour: grey },
  { x: [3, 4], y: [1, 2], z: [8, 10], colour: grey },
  { x: [5, 7], y: [2, 4], z: [16, 20], colour: grey },
];
const scene = sceneOf(site, things);
const built = build(scene, frameOf(scene));
assert.equal(scene.box.min[2], 100.75);
const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) =>
    assert.ok(Math.abs(value - expected[at]) < 1e-6, `${what}: ${actual} is not ${expected}`),
  );
};

// Four points and two triangles for each wall and for the base. By hand: a wall along each of
// the 2 * (8 + 5) edges of the paper, where ground is drawn all round; ten around the garage and
// the dark block beside it, five cells in a row of three over a row of two; and eight around the
// court.
const WALLS = 26 + 10 + 8;
const earth = built.hill.geometry.getAttribute('position');
assert.equal(earth.count, (WALLS + 1) * 4);
assert.equal(built.hill.geometry.getIndex().count, (WALLS + 1) * 2 * 3);
// Its base lies BASE_BELOW_M under the lowest point of the scene - under the floor of the stage -
// and no point of it lies lower. The base is the last four points: the corners of the paper,
// from x = -1 to 3 and from y = 2 down to -0.5, on the stage z = -2 to 0.5. It faces up, and a
// wall stands upright: it faces neither up nor down.
const B = -BASE_BELOW_M;
const facing = built.hill.geometry.getAttribute('normal');
const point = (at) => [earth.getX(at), earth.getY(at), earth.getZ(at)];
const lowest = Math.min(...Array.from({ length: earth.count }, (_, at) => earth.getY(at)));
assert.equal(lowest, B);
near(
  [0, 1, 2, 3].flatMap((nth) => point(WALLS * 4 + nth)),
  [-1, B, -2, -1, B, 0.5, 3, B, 0.5, 3, B, -2],
  'the base',
);
for (let at = 0; at < earth.count; at += 1) {
  near([facing.getY(at)], [at < WALLS * 4 ? 0 : 1], `the hill faces wrongly at point ${at}`);
}
// The first wall is the paper's left edge beside its top left cell, from the ground - 108 m and
// 107.75 m, over the floor 7.25 m and 7 m - down to the base: it faces the smaller x, outward.
near(
  [0, 1, 2, 3].flatMap(point),
  [-1, B, -2, -1, B, -1.5, -1, 7, -1.5, -1, 7.25, -2],
  'the first wall',
);
near([facing.getX(0), facing.getZ(0)], [-1, 0], 'the first wall faces outward');

// It is the ground's earth, in the ground's colour, and shows from either side: an eye that has
// come into the hill sees earth. Its walls lie a step nearer in the depth than they are, by both
// measures of the depth's offset: the wall of a pit lies in one plane with the wall of the block
// that stands in it, and there the earth shows. The ground itself lies where it is.
const [hill, ground] = [built.hill.material, built.ground.material];
assert.equal(hill.color.getHexString(), ground.color.getHexString());
assert.deepEqual([hill.side, hill.transparent, hill.depthTest], [DoubleSide, false, true]);
assert.ok(hill.polygonOffset && hill.polygonOffsetFactor < 0 && hill.polygonOffsetUnits < 0);
assert.equal(ground.polygonOffset, false);
assert.ok(built.solids.every((solid) => solid.material.polygonOffset === false));
// It is drawn after the outline, which is drawn with no test of depth: a wall that stands in
// front of the outline hides it. And before the solids.
assert.ok(built.outline.renderOrder < built.hill.renderOrder);
assert.ok(built.solids.every((solid) => solid.renderOrder > built.hill.renderOrder));
// It is a part of the land, to show and to hide with the ground.
assert.deepEqual(built.land.children, [built.ground, built.outline, built.hill]);

process.stdout.write(
  'tools/sketch/view3d: the hill is built with a wall at every rim and a base, of earth that hides the rooms against it\n',
);
