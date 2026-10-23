// The check of what build.js puts on the stage in a way of showing: a made-up scene, built for
// White - where the parts of the house stand in the place of the solids, so no solid is built:
// the land alone, which is earth still and takes the sun's shadows - and built for the volumes,
// where every solid stands in its colour and nothing casts a shadow or takes one. For Materials
// it builds what it builds for White. And the two things a way says here are two: with no
// solids and no sun, and lit by the sun in their colours. No
// browser: what a shadow looks like is the browser test's, tests/e2e/sketch-3d-ways.spec.ts.
// What every way has - where a solid lies, the ground, the outline - is build.check.js's; the
// parts of White as meshes are meshes.check.js's, and how the view stands them there and lights
// a way is sunlit.check.js's. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { sceneOf } from '../scene/scene.js';
import { build, casts } from './build.js';
import { frameOf } from './frame.js';
import { WAYS } from './showing.js';

// The made-up plot of the view's check: 8 m by 4 m in cells of half a metre, on a ground that is
// a plane - 110 m at the uphill edge, x = 0, and 2 m lower at the downhill one.
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
// Five made-up things, as read.js hands them over. A grey house, and downhill of it a green
// court, which is see-through; a window in a wall of the house, 15 cm out of it on either side;
// a tree; and a car, which is a box.
const things = [
  { x: [6, 10], y: [2, 6], z: [16, 22], colour: grey },
  { x: [10, 14], y: [2, 6], z: [18, 22], colour: green },
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
const scene = sceneOf(site, things);
const place = frameOf(scene);
// The ways, as showing.js lists them: what each says of how it is drawn is what is built here.
const [VOLUMES, WHITE, MATERIALS] = WAYS;
assert.deepEqual([VOLUMES.way, WHITE.way, MATERIALS.way], ['volumes', 'white', 'materials']);

const colourOf = (material) => `#${material.color.getHexString()}`;
/** Every shape of a solid that has faces: one of a box, two of a tree. */
const shapesOf = (solid) => {
  const shapes = [];
  solid.traverse((one) => one.isMesh && shapes.push(one));
  return shapes;
};
const linesOf = (solid) => solid.children.filter((one) => one.isLineSegments);
/** Whether a thing of the stage casts a shadow, and whether it takes one. */
const shades = (one) => [one.castShadow, one.receiveShadow];

// Built for White: no solid at all - the parts of the house stand in their place, and the view
// puts them there - so all that is built is the land. Built for the volumes: a solid for each
// thing, in its colour - a grey, a green, a pale blue, two of a pale green and a white.
const [coloured, white] = [build(scene, place, VOLUMES), build(scene, place, WHITE)];
assert.deepEqual(white.solids, []);
assert.deepEqual(white.all.children, [white.land]);
assert.deepEqual(white.land.children, [white.ground, white.outline, white.hill]);
assert.equal(coloured.solids.length, 5);
assert.deepEqual(coloured.all.children, [coloured.land, ...coloured.solids]);
assert.deepEqual(
  coloured.solids.flatMap(shapesOf).map(({ material }) => colourOf(material)),
  ['#8795a1', '#5a9e4b', '#d9ecf7', '#cfe8c5', '#cfe8c5', '#eceff2'],
);
// The land is the same in both: every point of the ground and of the hill where it lies for the
// volumes, and the outline.
for (const name of ['ground', 'hill', 'outline']) {
  assert.deepEqual(
    [...white[name].geometry.getAttribute('position').array],
    [...coloured[name].geometry.getAttribute('position').array],
    name,
  );
}

// The shadows. In White the earth takes them and casts none - the ground, and the walls and the
// base of its hill - and is earth still: the very earth of the volumes. The outline is a line.
assert.deepEqual(scene.solids.map(casts), [true, false, true, true, true]);
for (const earth of [white.ground, white.hill]) assert.deepEqual(shades(earth), [false, true]);
assert.deepEqual(shades(white.outline), [false, false]);
assert.equal(colourOf(white.ground.material), '#cbbfa6');
assert.equal(white.ground.material, coloured.ground.material);
assert.equal(white.hill.material, coloured.hill.material);

// The lines are the volumes': a block has them, and no object has - a window neither.
assert.deepEqual(
  coloured.solids.map((solid) => linesOf(solid).length),
  [1, 1, 0, 0, 0],
);

// For the volumes nothing casts a shadow and nothing takes one: no solid, and no earth - told so,
// or told nothing at all.
for (const built of [coloured, build(scene, place)]) {
  const all = [...built.solids.flatMap(shapesOf), built.ground, built.hill, built.outline];
  for (const one of all) assert.deepEqual(shades(one), [false, false]);
}
// Built for Materials, it is what it is for White: no solid, the same land of the same earth,
// which takes the sun's shadows. In which colour a part is drawn is not said here (meshes.js).
const surfaced = build(scene, place, MATERIALS);
assert.deepEqual([surfaced.solids, surfaced.all.children], [[], [surfaced.land]]);
for (const name of ['ground', 'hill', 'outline']) {
  assert.deepEqual(
    [...surfaced[name].geometry.getAttribute('position').array],
    [...white[name].geometry.getAttribute('position').array],
    name,
  );
  assert.equal(surfaced[name].material, white[name].material, name);
  assert.deepEqual(shades(surfaced[name]), shades(white[name]), name);
}
// And the two things a way says are two. The parts in the place of the solids, with no sun: no
// solid, and no shadow anywhere. Lit by the sun in their own colours: every solid that is not
// see-through casts shadows and takes them, every shape of it - a tree is two - the see-through
// block does neither, the earth takes them, and the lines of a block cast none. One white says
// nothing here: a way that says it alone is built as the volumes are.
assert.equal(build(scene, place, { white: true }).solids.length, 5);
const paper = build(scene, place, { parts: true });
assert.deepEqual(paper.solids, []);
for (const one of [paper.ground, paper.hill]) assert.deepEqual(shades(one), [false, false]);
const sunny = build(scene, place, { sun: true });
assert.deepEqual(
  sunny.solids.map(shades),
  [true, false, true, false, true].map((on) => [on, on]),
);
assert.deepEqual(sunny.solids[3].children.map(shades), [
  [true, true],
  [true, true],
]);
for (const lines of sunny.solids.flatMap(linesOf)) assert.deepEqual(shades(lines), [false, false]);
assert.deepEqual(
  [shades(sunny.ground), shades(sunny.hill)],
  [
    [false, true],
    [false, true],
  ],
);
assert.deepEqual(
  sunny.solids.map((solid) => [colourOf(shapesOf(solid)[0].material), linesOf(solid).length]),
  [
    ['#8795a1', 1],
    ['#5a9e4b', 1],
    ['#d9ecf7', 0],
    ['#cfe8c5', 0],
    ['#eceff2', 0],
  ],
);

process.stdout.write(
  'tools/sketch/view3d: for white and for materials no solid is built and the earth takes the shadows; the volumes stand in their colours and cast none\n',
);
