// The check of the view in its ways of showing, on a made-up stage that has the stage's own
// lights: for the volumes it is lit as it always was; in White the parts of the scene stand
// there in the place of its solids, as a few white meshes, lit by the sun - which stands where
// it is told, put on the stage by the frame, with its shadows worked out for what casts one; the
// shadows are switched off and on with nothing built anew; and the volumes come back as they
// were. No browser: what is drawn is the browser test's, tests/e2e/sketch-3d-ways.spec.ts and
// sketch-3d-parts.spec.ts. The view in the volumes alone - where it stands, the cut, the ground
// - is view.check.js's, a cut in White opened.check.js's, and the view in Materials
// materials.check.js's. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { Scene, Vector3 } from 'three';
import { BASE_BELOW_M } from '../scene/ground.js';
import { sceneOf } from '../scene/scene.js';
import { openLights } from './lights.js';
import { opaque } from './meshes.js';
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
const [grey, green] = [
  { name: 'grey', hex: '#8795a1' },
  { name: 'green', hex: '#5a9e4b' },
];
// A grey house of 2 m by 2 m, from 109 m up to 112 m, about [4, 2, 110.5 m]; and downhill of it a
// green court of 2 m by 2 m and 2 m high, which counts as glass.
const house = { x: [6, 10], y: [2, 6], z: [16, 22], colour: grey };
const court = { x: [10, 14], y: [2, 6], z: [18, 22], colour: green, as: 'glass' };
// A window in the wall of the house that looks to the small y, 0.9 m over its floor: 1.5 m wide,
// 1.5 m high, and 15 cm out of the wall on either side. A tree of 1 m by 1 m and 3 m high at the
// uphill corner of the plot, and a car - a box - of 2 m by 1 m and 1 m high at the far edge.
const pane = { x: [7, 10], y: [5.7, 6.3], z: [17.2, 20.2], kind: 'window', turn: 0, floor: 22 };
const tree = { x: [0, 2], y: [6, 8], z: [14.25, 20.25], kind: 'tree', turn: 0, floor: 20.25 };
const car = { x: [11, 15], y: [0, 2], z: [21.25, 23.25], kind: 'car', turn: 0, floor: 23.25 };
const things = [
  house,
  court,
  { ...pane, fill: '#d9ecf7' },
  { ...tree, fill: '#cfe8c5' },
  { ...car, fill: '#eceff2' },
];
// The parts, by rules of this check's own, so that nothing here is counted that a later rule of
// the house changes. A block is two boxes: its walls, as wide as the block and all of its height
// but the top half metre, and that half metre over them, a roof that closes it - of plaster, or
// of glass where the block counts as glass. An object is one box of its size, of whatever kind.
const boxes = ({ things: all, space, boxOf }, at) => {
  const { min, max } = boxOf(all[at]);
  const surface = space.asOf(at) === 'glass' ? 'glass' : 'plaster';
  const under = max[2] - 0.5;
  return [
    { of: 'wall', shape: 'box', min, max: [max[0], max[1], under], surface },
    { of: 'roof', shape: 'box', min: [min[0], min[1], under], max, surface, over: true },
  ];
};
const RULES = { blocks: [boxes], kinds: {} };
// Of the figures of the house, these rules ask none: but what stands on a block's floor is
// lifted onto its slab, of 0.3 m.
const sceneWith = (all) => sceneOf(site, all, { floorSlabM: 0.3 }, RULES);
const [alone, full] = [sceneWith([house, court]), sceneWith(things)];
assert.deepEqual([alone.parts.length, full.parts.length], [4, 7]);

/**
 * A made-up stage, with the stage's own lights: what stands on it, how it was asked to be lit -
 * and lit so - how often it was asked to draw, and how often to stand the camera somewhere.
 */
function madeUp() {
  const asked = { lit: [], drawn: 0, stood: 0 };
  const { lights, shine } = openLights();
  const stage = {
    scene: new Scene(),
    field: () => ({ deg: 60, shape: 1 }),
    stand: () => (asked.stood += 1),
    looking: () => null,
    light(sun) {
      asked.lit.push(sun);
      shine(sun);
    },
    draw: () => (asked.drawn += 1),
  };
  stage.scene.add(...lights);
  return { stage, asked, lights };
}
// What was worked out by hand has four places after the point.
const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) =>
    assert.ok(Math.abs(value - expected[at]) < 1e-4, `${what}: ${actual} is not ${expected}`),
  );
};
const colourOf = (material) => `#${material.color.getHexString()}`;
const shades = (one) => [one.castShadow, one.receiveShadow];
/** The meshes of the parts that stand there: each by its surface, and how many parts it is. */
const meshed = (standing) => standing.parts.map((mesh) => [mesh.name, mesh.userData.parts]);

// A sun that stands [0.48, 0.36, 0.8] from the plot - one long: 0.2304 + 0.1296 + 0.64 - down
// the plot, towards the large y, and 53 degrees high. The volumes first: lit as the stage always
// was, with nothing told of a sun - the solids stand there, and no part.
const TOWARD = [0.48, 0.36, 0.8];
const { stage, asked, lights } = madeUp();
const [, side, aim] = lights;
const view = openView(stage, null, TOWARD);
const inColour = view.show(alone);
assert.deepEqual([asked.lit, asked.drawn, side.castShadow], [[null], 1, false]);
assert.deepEqual([inColour.solids.length, inColour.parts], [2, []]);
assert.deepEqual(inColour.all.children, [inColour.land, ...inColour.solids]);
// White: built anew, in the place of the volumes - whose own shapes are given back - lit by the
// sun, and drawn once. The camera is stood nowhere for it. No solid stands there: the parts do,
// as two meshes - the house's two of plaster, and the court's two of glass - beside the land.
let gone = 0;
inColour.ground.geometry.addEventListener('dispose', () => (gone += 1));
const inWhite = view.show(alone, { way: 'white' });
assert.notEqual(inWhite, inColour);
assert.deepEqual(stage.scene.children, [...lights, inWhite.all]);
assert.deepEqual([inColour.all.parent, gone, asked.drawn, asked.stood], [null, 1, 2, 1]);
assert.deepEqual(inWhite.solids, []);
assert.deepEqual(meshed(inWhite), [
  ['plaster', 2],
  ['glass', 2],
]);
assert.deepEqual(inWhite.all.children, [inWhite.land, inWhite.parts[0].parent]);
assert.deepEqual(inWhite.parts[0].parent.children, inWhite.parts);
// Every part is white; what is not see-through casts the sun's shadows and takes them, and the
// glass does neither.
for (const mesh of inWhite.parts) assert.equal(colourOf(mesh.material), '#ffffff');
assert.deepEqual(inWhite.parts.map(shades), [
  [true, true],
  [false, false],
]);
// Where the sun stands, by hand. What casts a shadow is the house alone - the court is
// see-through: a box of 2 m by 2 m by 3 m about [4, 2, 110.5 m], sqrt(4 + 4 + 9) = 4.1231 m from
// corner to corner, so it reaches 2.0616 m from its middle. The scene is 8 m by 4 m, from 108 m
// up to 112 m: sqrt(64 + 16 + 16) = 9.7980 m from corner to corner, and the base of its hill
// lies 2 m under it. So the sun stands 11.7980 m off, 5.6630 m down the plot, 4.2473 m towards
// the large y and 9.4384 m higher: at [9.6630, 6.2473, 119.9384 m]. On the stage, where heights
// count from 108 m and the plot's y is -z, that is [9.6630, 11.9384, -6.2473], and what it
// shines at [4, 2.5, -2].
const [, sun] = asked.lit;
near(sun.from, [9.663, 11.9384, -6.2473], 'where the sun stands');
near(sun.at, [4, 2.5, -2], 'what the sun shines at');
near([sun.reach], [2.0616], 'how far the shadows are worked out');
assert.deepEqual([sun.shadows, side.castShadow, BASE_BELOW_M], [true, true, 2]);
// The shadows switched off, and on: the same sun, nothing built anew - the meshes that stood
// there stand there - and one drawing each.
const stood = [...inWhite.parts];
assert.equal(view.show(alone, { way: 'white', shadows: false }), inWhite);
assert.deepEqual([asked.lit.at(-1), side.castShadow], [{ ...sun, shadows: false }, false]);
assert.equal(view.show(alone, { way: 'white', shadows: true }), inWhite);
assert.deepEqual([asked.lit.at(-1), side.castShadow, asked.drawn], [sun, true, 4]);
assert.deepEqual(inWhite.parts, stood);
// Back to the volumes, and to a way that this pad has not, which is the volumes: built anew
// once, lit as the stage always was - whatever is said of the shadows - and in their colours.
// The meshes of the parts are off the stage, and their shapes given back.
let shapes = 0;
for (const mesh of stood) mesh.geometry.addEventListener('dispose', () => (shapes += 1));
const back = view.show(alone, { way: 'volumes', shadows: true });
assert.notEqual(back, inWhite);
assert.equal(view.show(alone, { way: 'wireframe' }), back);
assert.deepEqual([asked.lit.slice(-2), side.castShadow], [[null, null], false]);
assert.deepEqual(
  [side.position.toArray(), aim.position.toArray()],
  [
    [5.5, 7.8, 3],
    [0, 0, 0],
  ],
);
assert.deepEqual(
  [colourOf(back.solids[0].material), shades(back.solids[0])],
  ['#8795a1', [false, false]],
);
assert.deepEqual([asked.drawn, asked.stood], [6, 1]);
assert.deepEqual([back.parts, shapes, stood[0].parent.parent], [[], 2, null]);
assert.deepEqual(stage.scene.children, [...lights, back.all]);

// With a window, a tree and a car, the shadows are worked out for all that casts one, and not
// for the house alone: by hand, the box around the four reaches from the tree at x = 0 to the car
// at x = 7.5, across the plot from 0 to 4, and from the car's foot at 108.375 m up to the tree's
// top at 112.875 m. It is 7.5 m by 4 m by 4.5 m about [3.75, 2, 110.625 m]:
// sqrt(56.25 + 16 + 20.25) = 9.6177 m from corner to corner. The frame is the first scene's.
// The window stands on the house's floor, and so on its slab, 0.3 m higher than it was drawn:
// within that box still.
view.show(full, { way: 'white', cut: 109 });
const wide = asked.lit.at(-1);
near(wide.at, [3.75, 2.625, -2], 'what the sun shines at, with a tree and a car');
near([wide.reach], [4.8088], 'how far the shadows are worked out, with a tree and a car');
// The way to the sun is the same, put on the stage by the frame: the plot's x, h and -y.
const way = wide.from.map((value, axis) => value - wide.at[axis]);
const long = Math.hypot(...way);
near(
  way.map((value) => value / long),
  [0.48, 0.8, -0.36],
  'the way to the sun',
);
// The sun stands where it stood, whatever is cut: the shadows are worked out for the scene, and
// what a cut takes off casts none, for it is not there (opened.check.js).
view.show(full, { way: 'white' });
assert.deepEqual(asked.lit.at(-1), wide);
// What the sun sees, as three.js works it out when it draws: every corner of every part that
// casts a shadow lies on the map, and every corner of the scene - down to the base of its hill,
// 2 m under its lowest point - lies within the map's depth, so that a shadow can fall on it.
side.updateMatrixWorld(true);
aim.updateMatrixWorld(true);
side.shadow.updateMatrices(side);
const lowest = full.box.min[2];
const onMap = ([x, y, h]) =>
  new Vector3(x, h - lowest, -y).applyMatrix4(side.shadow.matrix).toArray();
assert.equal(lowest, 108);
const cornersOf = ({ min, max }) =>
  [0, 1, 2, 3, 4, 5, 6, 7].map((n) => [0, 1, 2].map((axis) => ((n >> axis) & 1 ? max : min)[axis]));
const within = (share) => share >= 0 && share <= 1;
assert.equal(full.parts.filter(opaque).length, 5);
for (const corner of full.parts.filter(opaque).flatMap(cornersOf)) {
  assert.ok(onMap(corner).every(within), `${corner} is off the map`);
}
const { min, max } = full.box;
for (const corner of cornersOf({ min: [min[0], min[1], lowest - BASE_BELOW_M], max })) {
  assert.ok(within(onMap(corner)[2]), `${corner} is not within the depth of the map`);
}
// What casts is told by what a part is made of, and not by the colour its block was painted in.
// Glass does not widen the box, however large and though it is painted grey: a court over the
// whole plot. And a block that is painted green - which is see-through as a volume - and counts
// as a room casts as any room does: one at the downhill edge, from x = 6 to 8, widens the box
// to 8 m by 4 m by 4.5 m about [4, 2, 110.625 m] - sqrt(64 + 16 + 20.25) = 10.0125 m from
// corner to corner.
view.show(sceneWith([...things, { ...court, colour: grey, x: [0, 16], y: [0, 8] }]), {
  way: 'white',
});
near([asked.lit.at(-1).reach, ...asked.lit.at(-1).at], [wide.reach, ...wide.at], 'a large court');
view.show(sceneWith([...things, { ...house, colour: green, x: [12, 16] }]), { way: 'white' });
near([asked.lit.at(-1).reach, ...asked.lit.at(-1).at], [5.0062, 4, 2.625, -2], 'a green room');
// And with nothing drawn, nothing casts: the sun shines at the middle of the ground.
const bare = view.show(sceneWith([]), { way: 'white' });
near(asked.lit.at(-1).at, [4, 1, -2], 'what the sun shines at, with nothing drawn');
assert.deepEqual([bare.solids, bare.parts], [[], []]);

// A tab that kept white opens white: the first scene is lit by the sun at once, with its shadows
// off as they were kept, and seen from the front.
const kept = madeUp();
const opened = openView(kept.stage, null, TOWARD).show(alone, { way: 'white', shadows: false });
assert.deepEqual([kept.asked.lit.length, kept.asked.drawn, kept.asked.stood], [1, 1, 1]);
near(kept.asked.lit[0].from, sun.from, 'where the sun stands as the page opens');
assert.deepEqual([kept.asked.lit[0].shadows, kept.lights[1].castShadow], [false, false]);
assert.equal(colourOf(opened.parts[0].material), '#ffffff');
assert.deepEqual([opened.solids, meshed(opened)[0]], [[], ['plaster', 2]]);

process.stdout.write(
  'tools/sketch/view3d: in white the parts stand on the stage as a few meshes, lit by the sun, which stands where the frame puts it and sees all that casts a shadow; the volumes are lit as they were\n',
);
