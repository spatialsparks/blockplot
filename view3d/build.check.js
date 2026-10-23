// The check of what stands on the stage: a made-up scene, built, against what a person worked
// out by hand - every solid drawn once and where the scene puts it, in its colour; the green
// block see-through; lines along the edges of blocks, drawn nearer than they lie; the tree a
// trunk and a crown, the bush a dome; the ground with no triangle where a block stands; the
// outline closed, and drawn over the ground. The walls and the base that make a hill of the
// ground are hill.check.js's, and a block under a top that slopes is tops.check.js's. three.js
// makes its shapes without a browser: what is asked of WebGL is the browser test's,
// tests/e2e/sketch-3d*.spec.ts. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { Box3, DoubleSide, ShaderLib } from 'three';
import { sceneOf } from '../scene/scene.js';
import { build, lightness } from './build.js';
import { frameOf } from './frame.js';

// The made-up plot of the scene's own check: 4 m by 2.5 m in cells of half a metre, 8 columns
// from x = -1 on and 5 rows of the top view from y = 2 down, on standing papers from 112 m down.
// Its ground is lowest in the bottom right corner of the paper, at 100.75 m.
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
// Six made-up things, as read.js hands them over: three blocks - grey, ink and the green that is
// see-through - and three objects: a tree, a bush, and a car, which is a box.
const [grey, ink, green] = [
  { name: 'grey', hex: '#8795a1' },
  { name: 'ink', hex: '#1f2933' },
  { name: 'green', hex: '#5a9e4b' },
];
const leaf = '#cfe8c5';
const things = [
  { x: [1, 3], y: [1, 3], z: [6, 10], colour: grey, name: 'Garage' },
  { x: [3, 4], y: [1, 2], z: [8, 10], colour: ink },
  { x: [5, 7], y: [2, 4], z: [16, 20], colour: green, name: 'Court' },
  { x: [7, 8], y: [0, 1], z: [15.5, 19.5], kind: 'tree', turn: 0, fill: leaf, floor: 19.5 },
  { x: [0, 1], y: [3, 5], z: [10, 12], kind: 'bush', turn: 0, fill: leaf, floor: 12 },
  { x: [4, 5], y: [3, 4], z: [13, 14], kind: 'car', turn: 1, fill: '#eceff2', floor: 14 },
];
const scene = sceneOf(site, things);
const place = frameOf(scene);
const built = build(scene, place);

const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) =>
    assert.ok(Math.abs(value - expected[at]) < 1e-6, `${what}: ${actual} is not ${expected}`),
  );
};
const colourOf = (material) => `#${material.color.getHexString()}`;
/** The box around what was built for a solid: where it reaches from, and to, on the stage. */
const reachOf = (object) => {
  const { min, max } = new Box3().setFromObject(object);
  return [min.toArray(), max.toArray()];
};

// One thing to put on the stage, which holds the land and a solid for each solid of the scene,
// in the scene's order - each once. The land is one thing too, to show or to hide: the ground,
// the outline, and the walls and the base of the hill.
const [garage, dark, court, tree, bush, car] = built.solids;
assert.equal(built.solids.length, 6);
assert.deepEqual(built.all.children, [built.land, ...built.solids]);
assert.deepEqual(built.land.children, [built.ground, built.outline, built.hill]);

// The garage, by hand: columns 1 to 3 are x = -0.5 to 0.5; rows 1 to 3 of the top view are
// y = 1.5 down to 0.5, on the stage z = -1.5 to -0.5; rows 6 to 10 of a standing view are 109 m
// down to 107 m, over the lowest point at 100.75 m: y = 6.25 to 8.25. A box about its middle, a
// metre along the plot, two high and a metre across.
near(garage.position.toArray(), [0, 7.25, -1], 'the middle of the garage');
near(garage.scale.toArray(), [1, 2, 1], 'the size of the garage');
near(reachOf(garage).flat(), [-0.5, 6.25, -1.5, 0.5, 8.25, -0.5], 'the garage');
// Every solid reaches as far as the scene's box of it reaches, and no further: the frame puts
// the scene's two corners on the stage, and what was built lies between them. So for a block,
// and so for a tree's crown and trunk together, a bush's dome and a car's box.
scene.solids.forEach((solid, at) => {
  const corners = [place(solid.min), place(solid.max)];
  const from = [0, 1, 2].map((axis) => Math.min(corners[0][axis], corners[1][axis]));
  const to = [0, 1, 2].map((axis) => Math.max(corners[0][axis], corners[1][axis]));
  near(reachOf(built.solids[at]).flat(), [...from, ...to], `solid ${at}`);
});

// A block is in its colour, and an object in its fill. A block has thin lines along its edges:
// one line object, of the twelve edges of a box, in ink - and pale on the block that is ink
// itself. An object is a box and no more: the car has none.
assert.deepEqual(
  [garage, dark, court, car].map((box) => colourOf(box.material)),
  ['#8795a1', '#1f2933', '#5a9e4b', '#eceff2'],
);
for (const box of [garage, dark, court]) {
  assert.equal(box.children.length, 1);
  const [lines] = box.children;
  assert.ok(lines.isLineSegments);
  assert.equal(lines.geometry.getAttribute('position').count, 12 * 2);
  assert.equal(colourOf(lines.material), box === dark ? '#e5e7eb' : '#1f2933');
}
assert.ok(car.isMesh);
assert.equal(car.children.length, 0);
// A line is drawn nearer to the eye than it lies, or the face it lies in would hide half of it:
// by a line more in three.js's own shader for lines, after the place where that puts a point
// into the picture. The place is there in the three.js that is installed, once, and what comes
// after it moves the point along the line of sight by a thousandth and puts it there anew.
const POINT = '#include <project_vertex>';
const { vertexShader: own } = ShaderLib.basic;
assert.equal(own.split(POINT).length, 2, 'three.js puts a point into the picture elsewhere now');
const shader = { vertexShader: own };
garage.children[0].material.onBeforeCompile(shader);
const [before, after] = shader.vertexShader.split(POINT);
assert.equal(before, own.split(POINT)[0]);
assert.match(
  after,
  /^\s*mvPosition\.xyz \*= 0\.999000;\s*gl_Position = projectionMatrix \* mvPosition;/,
);
assert.ok(after.endsWith(own.split(POINT)[1]));
// An object's faces lie a step behind in the depth, so that a block's face shows where the two
// lie in one plane - a bed against a wall, a staircase as high as its room. A block's lie where
// they are, and so does the ground.
assert.deepEqual(
  [garage, dark, court, built.ground].map((one) => one.material.polygonOffset),
  [false, false, false, false],
);
for (const { material } of [car, bush, tree.children[0]]) {
  assert.ok(material.polygonOffset && material.polygonOffsetFactor > 0);
  assert.ok(material.polygonOffsetUnits > 0);
}
// Of the pad's eleven colours, ink alone is too dark for ink to show on it.
const PALETTE = ['#d9482b', '#f08c00', '#e6c229', '#5a9e4b', '#1f9e8f', '#2f7ed8'];
const REST = ['#8a63d2', '#e0719f', '#9c6b43', '#8795a1'];
assert.ok(lightness('#1f2933') < 0.3);
for (const colour of [...PALETTE, ...REST]) assert.ok(lightness(colour) >= 0.3, colour);
// How light: black is 0, white is 1, and green weighs most - 0.587 of the three.
near([lightness('#000000'), lightness('#ffffff'), lightness('#00ff00')], [0, 1, 0.587], 'light');

// The green block is see-through: it hides a part of what stands behind it, and nothing from the
// depth, so what stands behind it is drawn. Its lines are as solid as any. The others hide all.
assert.deepEqual(
  [court.material.transparent, court.material.depthWrite, court.material.opacity < 1],
  [true, false, true],
);
assert.ok(court.material.opacity > 0);
assert.equal(court.children[0].material.transparent, false);
for (const box of [garage, dark, car]) {
  const { transparent, depthWrite, opacity } = box.material;
  assert.deepEqual([transparent, depthWrite, opacity], [false, true, 1]);
}
// A tree is as green as the court, and solid: only a block is see-through.
assert.equal(tree.children[0].material.transparent, false);

// A tree is two shapes: a trunk that stands on the bottom of its box, and a crown that reaches
// its top and is as wide as the box - half a metre here - while the trunk is thin. The crown
// begins under the top of the trunk, so they are one tree. Both are in the tree's fill.
assert.equal(tree.children.length, 2);
const [trunk, crown] = tree.children.map(reachOf);
const [low, high] = [place(scene.solids[3].min)[1], place(scene.solids[3].max)[1]];
near([trunk[0][1], crown[1][1]], [low, high], 'the foot and the top of the tree');
near([crown[1][0] - crown[0][0], crown[1][2] - crown[0][2]], [0.5, 0.5], 'the width of the crown');
assert.ok(trunk[1][0] - trunk[0][0] < 0.1);
assert.ok(crown[0][1] < trunk[1][1] && crown[0][1] > low);
assert.deepEqual(
  tree.children.map((part) => colourOf(part.material)),
  [leaf, leaf],
);
// A bush is one round shape in its fill: a dome, the upper half of a ball, which stands on its
// middle. A tree is a post and a ball, and a car a box.
assert.ok(bush.isMesh);
assert.equal(bush.children.length, 0);
assert.equal(colourOf(bush.material), leaf);
bush.geometry.computeBoundingBox();
const { min: foot, max: top } = bush.geometry.boundingBox;
near([foot.y, top.y, top.x - foot.x], [0, 0.5, 1], 'the dome of a bush');
assert.deepEqual(
  [bush, ...tree.children, car].map((part) => part.geometry.type),
  ['SphereGeometry', 'CylinderGeometry', 'SphereGeometry', 'BoxGeometry'],
);

// One colour, one material, made once: the two green things here, and the same again the next
// time the scene is built.
assert.equal(tree.children[0].material, bush.material);
const again = build(scene, place);
assert.equal(again.solids[0].material, garage.material);
assert.notEqual(again.ground.geometry, built.ground.geometry);

// The ground: every grid point of the paper, 9 by 6, each where the frame puts it - the first
// one, the paper's top left corner at 108 m, is 7.25 m over the lowest - and two triangles for
// each of the 31 cells where no block stands.
const points = built.ground.geometry.getAttribute('position');
const corner = (at) => [points.getX(at), points.getY(at), points.getZ(at)];
assert.equal(points.count, 9 * 6);
near(corner(0), [-1, 7.25, -2], 'the first point of the ground');
near(corner(53), [3, 0, 0.5], 'the last point of the ground');
const triangles = built.ground.geometry.getIndex();
assert.equal(triangles.count, 31 * 2 * 3);
// No triangle lies under a block: the middle of each lies outside the three blocks' boxes, seen
// from above. On the stage, x is the plot's and z is its y the other way round.
const blocks = scene.solids.slice(0, 3);
for (let at = 0; at < triangles.count; at += 3) {
  const three = [0, 1, 2].map((k) => corner(triangles.getX(at + k)));
  const [x, , z] = [0, 1, 2].map((axis) => (three[0][axis] + three[1][axis] + three[2][axis]) / 3);
  const under = ({ min, max }) => x > min[0] && x < max[0] && -z > min[1] && -z < max[1];
  assert.ok(!blocks.some(under), `a triangle of the ground under a block, at ${x}, ${-z}`);
}
// It faces up, so that the light falls on it: at every grid point that a triangle takes, the
// ground's own direction points upward. And it shows from below too, in one colour.
const normals = built.ground.geometry.getAttribute('normal');
const taken = new Set(triangles.array);
assert.ok(taken.size > 40);
for (const at of taken) assert.ok(normals.getY(at) > 0, `the ground faces down at point ${at}`);
assert.equal(built.ground.material.side, DoubleSide);
assert.equal(built.ground.material.transparent, false);

// Under it lie the walls and the base that make a hill of it: hill.check.js has them.

// The outline: the scene's ring of points, each where the frame puts it, and closed - the last
// point joined to the first. The first lies in the middle of a cell, at 106 m: 5.25 m up.
const ring = built.outline.geometry.getAttribute('position');
assert.ok(built.outline.isLineLoop);
assert.equal(ring.count, scene.outline.length);
near([ring.getX(0), ring.getY(0), ring.getZ(0)], [0.25, 5.25, -1.75], 'the outline begins');
// It is drawn over the ground, whatever the depth says - it lies a hair off the mesh - and
// before all else: first the ground, then the outline, then the walls of the hill, which hide
// the outline behind them as the depth says, then the solids.
assert.equal(built.outline.material.depthTest, false);
assert.ok(built.ground.renderOrder < built.outline.renderOrder);
assert.ok(built.outline.renderOrder < built.hill.renderOrder);
assert.ok(built.solids.every((solid) => solid.renderOrder > built.hill.renderOrder));
assert.equal(built.ground.material.depthTest, true);

// What was made for one scene alone is given back with it: the shapes of its ground, of its
// outline and of its hill. The shape of a box is every scene's, and stays.
const gone = [];
for (const [name, shape] of [
  ['ground', built.ground.geometry],
  ['outline', built.outline.geometry],
  ['hill', built.hill.geometry],
  ['box', garage.geometry],
]) {
  shape.addEventListener('dispose', () => gone.push(name));
}
built.dispose();
assert.deepEqual(gone, ['ground', 'outline', 'hill']);

// Nothing drawn yet: the ground whole, the outline, the walls round the paper, and no solid.
const bare = sceneOf(site, []);
const empty = build(bare, frameOf(bare));
assert.deepEqual(empty.solids, []);
assert.equal(empty.ground.geometry.getIndex().count, 40 * 2 * 3);
assert.equal(empty.hill.geometry.getIndex().count, (26 + 1) * 2 * 3);
assert.deepEqual(empty.all.children, [empty.land]);

process.stdout.write(
  'tools/sketch/view3d: every solid is built once, where the scene puts it, on a ground with its hole\n',
);
