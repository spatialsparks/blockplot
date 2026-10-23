// The check of the view in White at a cut, on a made-up stage: the parts that the cut shows
// stand there (scene/cut.js) - what stands higher is gone, and the storey the cut stops at has
// no roof - as a few meshes, each where a person worked out by hand that it lies; another cut
// builds the meshes anew and gives the old ones' shapes back, and nothing else does: not the
// same cut again, not the ground, not the shadows; the land is built once for a scene; and in
// the volumes no part stands there, whatever the cut. No browser: what is drawn is the browser
// test's, tests/e2e/sketch-3d-parts.spec.ts. How White is lit is sunlit.check.js's. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { Scene } from 'three';
import { partsShown } from '../scene/cut.js';
import { sceneOf } from '../scene/scene.js';
import { openView } from './view.js';

// The made-up plot of the view's check: 8 m by 4 m in cells of half a metre, on a ground that is
// a plane - 110 m at the uphill edge, x = 0, and 2 m lower at the downhill one. A column lies at
// half its number, a row of the top view at 4 m less half its number, a row of a standing view
// at 120 m less half its number.
const row = Array.from({ length: 17 }, (_, column) => 1000 - 12.5 * column).join(' ');
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 8,
  yFromM: 0,
  yToM: 4,
  sideM: [100, 120],
  outline: [
    [1, 1],
    [7, 1],
    [7, 3],
    [1, 3],
  ],
  ground: { baseM: 100, rowsCm: Array(9).fill(row) },
};
const grey = { name: 'grey', hex: '#8795a1' };
// A house of 2 m by 2 m, from 109 m up to 112 m, and downhill of it a court of 2 m by 2 m and
// 2 m high, which counts as glass: both stand at 109 m. A window in a wall of the house, 0.9 m
// over its floor; a tree of 3 m at the uphill corner of the plot, on the ground at 109.875 m;
// and a car, a box of 2 m by 1 m and 1 m high, on the ground at 108.375 m.
const things = [
  { x: [6, 10], y: [2, 6], z: [16, 22], colour: grey },
  { x: [10, 14], y: [2, 6], z: [18, 22], colour: grey, as: 'glass' },
  {
    x: [7, 10],
    y: [5.7, 6.3],
    z: [17.2, 20.2],
    kind: 'window',
    turn: 0,
    fill: '#d9ecf7',
    floor: 22,
  },
  { x: [0, 2], y: [6, 8], z: [14.25, 20.25], kind: 'tree', turn: 0, fill: '#cfe8c5', floor: 20.25 },
  {
    x: [11, 15],
    y: [0, 2],
    z: [21.25, 23.25],
    kind: 'car',
    turn: 0,
    fill: '#eceff2',
    floor: 23.25,
  },
];
// The parts, by rules of this check's own, so that nothing here is counted that a later rule of
// the house changes. A block is two boxes: its walls, as wide as the block and all of its height
// but the top half metre, and that half metre over them, a roof that closes it - of plaster, or
// of glass where the block counts as glass. An object is one box of its size, of whatever kind.
// Of the figures these rules ask none: but what stands on a block's floor is lifted onto its
// slab, of 0.3 m.
const boxes = ({ things: all, space, boxOf }, at) => {
  const { min, max } = boxOf(all[at]);
  const surface = space.asOf(at) === 'glass' ? 'glass' : 'plaster';
  const under = max[2] - 0.5;
  return [
    { of: 'wall', shape: 'box', min, max: [max[0], max[1], under], surface },
    { of: 'roof', shape: 'box', min: [min[0], min[1], under], max, surface, over: true },
  ];
};
const sceneWith = (all) => sceneOf(site, all, { floorSlabM: 0.3 }, { blocks: [boxes], kinds: {} });
const full = sceneWith(things);
assert.deepEqual([full.parts.length, full.levels, full.box.min[2]], [7, [109], 108]);

// A made-up stage: what stands on it, and how often it was asked to draw.
const asked = { drawn: 0 };
const stage = {
  scene: new Scene(),
  field: () => ({ deg: 60, shape: 1 }),
  stand() {},
  looking: () => null,
  light() {},
  draw: () => (asked.drawn += 1),
};
// What was worked out by hand is compared to a tenth of a millimetre: a point of a mesh is kept
// to seven figures.
const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) =>
    assert.ok(Math.abs(value - expected[at]) < 1e-4, `${what}: ${actual} is not ${expected}`),
  );
};
/** The meshes of the parts that stand there: each by its surface, and how many parts it is. */
const meshed = (standing) => standing.parts.map((mesh) => [mesh.name, mesh.userData.parts]);
/** Where a mesh reaches from, and to, on the stage. */
const reachOf = (mesh) => {
  mesh.geometry.computeBoundingBox();
  return [...mesh.geometry.boundingBox.min.toArray(), ...mesh.geometry.boundingBox.max.toArray()];
};
/** Notes when the shapes of some meshes are given back. */
function givenBack(meshes) {
  const gone = { shapes: 0 };
  for (const mesh of meshes) mesh.geometry.addEventListener('dispose', () => (gone.shapes += 1));
  return gone;
}

// White, cut at 109 m, where the house and the court stand: their walls and not their roofs -
// the storey the cut stops at is open - with the window and the car, and not the tree, which
// stands on the ground higher up. Four parts of seven, in three meshes: the house's walls of
// plaster, the court's of glass, and the two objects, plain. No solid stands there.
const view = openView(stage, null, [0.48, 0.36, 0.8]);
const standing = view.show(full, { way: 'white', cut: 109 });
assert.deepEqual(meshed(standing), [
  ['plaster', 1],
  ['glass', 1],
  ['plain', 2],
]);
assert.equal(partsShown(full, 109).length, 4);
assert.deepEqual([standing.solids, asked.drawn], [[], 1]);
assert.deepEqual(standing.all.children, [standing.land, standing.parts[0].parent]);
assert.deepEqual(standing.parts[0].parent.children, standing.parts);
// By hand, on the stage, where the plot's [x, y, h] lies at [x, h - 108, -y]. Without its roof
// the house ends at 111.5 m, 3.5 m over the floor, and the court at 110.5 m, 2.5 m. The window
// reaches from x = 3.5 to 5, across the plot from 0.85 to 1.15, and - lifted onto the slab -
// from 110.2 m to 111.7 m; the car from x = 5.5 to 7.5, across the plot from 3 to 4, and from
// 108.375 m to 109.375 m: together from the car's foot, 0.375 m, to the window's top, 3.7 m.
near(reachOf(standing.parts[0]), [3, 1, -3, 5, 3.5, -1], 'the plaster at 109 m');
near(reachOf(standing.parts[1]), [5, 1, -3, 7, 2.5, -1], 'the glass at 109 m');
near(reachOf(standing.parts[2]), [3.5, 0.375, -4, 7.5, 3.7, -0.85], 'what is plain at 109 m');

// The same cut again builds nothing, and neither do the ground and the shadows, off and on: the
// meshes that stood there stand there. Each time, one drawing.
const [atLevel, land] = [[...standing.parts], standing.ground.geometry];
const first = givenBack(atLevel);
for (const how of [{}, { ground: false }, { shadows: false }, { ground: true, shadows: true }]) {
  assert.equal(view.show(full, { way: 'white', cut: 109, ...how }), standing);
  assert.deepEqual(standing.parts, atLevel);
}
assert.deepEqual([first.shapes, asked.drawn, standing.land.visible], [0, 5, true]);
// Another cut builds the meshes anew - the ones that stood there are off the stage, and their
// shapes given back - and the land stays as it was built. All of it: the house with its roof,
// 4 m over the floor, and with the tree, whose top is at 112.875 m, the plain parts reach from
// the plot's first column on, across all of it, and 4.875 m up.
assert.equal(view.show(full, { way: 'white' }), standing);
assert.deepEqual(meshed(standing), [
  ['plaster', 2],
  ['glass', 2],
  ['plain', 3],
]);
assert.deepEqual(
  [first.shapes, atLevel[0].parent.parent, standing.ground.geometry],
  [3, null, land],
);
assert.deepEqual(standing.all.children, [standing.land, standing.parts[0].parent]);
near(reachOf(standing.parts[0]), [3, 1, -3, 5, 4, -1], 'the plaster, whole');
near(reachOf(standing.parts[1]), [5, 1, -3, 7, 3, -1], 'the glass, whole');
near(reachOf(standing.parts[2]), [0, 0.375, -4, 7.5, 4.875, 0], 'what is plain, whole');
// And back down, the storey is open again: what stood there whole is given back in its turn.
const whole = givenBack(standing.parts);
view.show(full, { way: 'white', cut: 109 });
assert.deepEqual([meshed(standing)[0], whole.shapes, asked.drawn], [['plaster', 1], 3, 7]);

// The volumes at that cut: the solids stand there, each showing or not, and no part - and a
// cut builds nothing, there. Back in White the parts are built for the cut that is shown.
const open = givenBack(standing.parts);
const coloured = view.show(full, { cut: 109 });
assert.deepEqual([coloured.parts, open.shapes, coloured.solids.length], [[], 3, 5]);
assert.deepEqual(
  coloured.solids.map((solid) => solid.visible),
  [true, true, true, false, true],
);
assert.equal(view.show(full, { cut: 'all' }), coloured);
assert.deepEqual([coloured.parts, coloured.all.children.length], [[], 1 + 5]);
const again = view.show(full, { way: 'white', cut: 109 });
assert.deepEqual([meshed(again).map(([, parts]) => parts), again.solids], [[1, 1, 2], []]);
// A scene with nothing drawn has no part to stand there: its land alone - the ground, the
// outline and the hill - and beside it nothing.
const bare = view.show(sceneWith([]), { way: 'white' });
assert.deepEqual([bare.parts, bare.solids], [[], []]);
assert.deepEqual(
  bare.all.children.map((one) => one.children.length),
  [3, 0],
);

process.stdout.write(
  'tools/sketch/view3d: in white a cut shows the parts it shows, the storey it stops at open, as meshes built anew for another cut and for nothing else\n',
);
