// The check of the view in the way Materials, on a made-up stage that has the stage's own
// lights: the parts of the scene stand there in the place of its solids, as White has them, each
// in its surface now, and what stands in the house a step behind; the sun is White's own sun -
// where it stood, with the shadows it cast - and the stage is told that the house stands in its
// surfaces, so it is lit by the softer strengths, under the sky - the dome, which is no part of
// the house, and which White and the volumes do not show; a way picked is built anew and
// drawn once, and so is a cut; the shadows and the ground build nothing; and White and the
// volumes come back as they were. No browser: what is drawn is the browser test's,
// tests/e2e/sketch-3d-materials.spec.ts. What a face is made of is materials.check.js's, and the
// light by figures surfaced.check.js's. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { Scene } from 'three';
import { sceneOf } from '../scene/scene.js';
import { SURFACES } from '../scene/surfaces.js';
import { BACKDROP, SURFACED, openLights } from './lights.js';
import { openView } from './view.js';

// The made-up plot of the view's check - 8 m by 4 m in cells of half a metre, on a ground that
// falls from 110 m to 108 m - with a house of 2 m by 2 m, from 109 m up to 112 m, downhill of it
// a court that counts as glass, and uphill a car: a box of 2 m by 1 m and 1 m high on the
// ground, at 109.75 m. The parts by rules of this check's own, as in sunlit.check.js: a block is
// its walls and a roof over them - plaster, or glass where the block counts as glass - and an
// object one box, plain.
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
const car = { x: [0, 4], y: [0, 2], z: [18.5, 20.5], kind: 'car', turn: 0, floor: 20.5 };
const things = [
  { x: [6, 10], y: [2, 6], z: [16, 22], colour: grey },
  { x: [10, 14], y: [2, 6], z: [18, 22], colour: grey, as: 'glass' },
  { ...car, fill: '#eceff2' },
];
const boxes = ({ things: all, space, boxOf }, at) => {
  const { min, max } = boxOf(all[at]);
  const surface = space.asOf(at) === 'glass' ? 'glass' : 'plaster';
  const under = max[2] - 0.5;
  return [
    { of: 'wall', shape: 'box', min, max: [max[0], max[1], under], surface },
    { of: 'roof', shape: 'box', min: [min[0], min[1], under], max, surface, over: true },
  ];
};
const scene = sceneOf(site, things, { floorSlabM: 0.3 }, { blocks: [boxes], kinds: {} });
assert.deepEqual([scene.parts.length, scene.levels], [5, [109]]);

// A made-up stage, with the stage's own lights: how it was asked to be lit - and lit so - how
// often it was asked to draw, and how often to stand the camera somewhere.
const asked = { lit: [], drawn: 0, stood: 0 };
const { lights, shine, backdrop, sky } = openLights();
const [soft, side] = lights;
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
const TOWARD = [0.48, 0.36, 0.8];
const hexOf = (colour) => `#${colour.getHexString()}`;
const colours = (standing) => standing.parts.map((mesh) => hexOf(mesh.material.color));
const shades = (one) => [one.castShadow, one.receiveShadow];
const meshed = (standing) => standing.parts.map((mesh) => [mesh.name, mesh.userData.parts]);
const WHOLE = [
  ['plaster', 2],
  ['glass', 2],
  ['plain', 1],
];
const WHITE = ['#ffffff', '#ffffff', '#ffffff'];
const view = openView(stage, null, TOWARD);

// White first, so that there is something to hold the materials against: the parts, white, lit
// for a white house.
const whitened = view.show(scene, { way: 'white' });
const [inSun] = asked.lit;
assert.deepEqual([meshed(whitened), colours(whitened)], [WHOLE, WHITE]);
assert.deepEqual([inSun.surfaces, inSun.shadows, side.castShadow], [false, true, true]);
assert.equal(sky.visible, false);
// What casts a shadow is told by what a part is made of: the house and the car, and not the
// court of glass, though it was painted grey. By hand: the box around the two reaches from the
// car at x = 0 to the house at x = 5, across the plot from 1 to 4, and from the house's floor at
// 109 m up to its roof at 112 m - 5 m by 3 m by 3 m about [2.5, 2.5, 110.5 m], and
// sqrt(25 + 9 + 9) = 6.5574 m from corner to corner. On the stage, where heights count from
// 108 m and the plot's y is -z, the sun shines at [2.5, 2.5, -2.5]. With the court, the box
// would reach to x = 7.
const near = (actual, expected, what) =>
  actual.forEach((value, at) => assert.ok(Math.abs(value - expected[at]) < 1e-4, what));
near([...inSun.at, inSun.reach], [2.5, 2.5, -2.5, 3.2787], 'where the sun shines, in White');
// Then Materials: built anew in White's place - whose meshes are off the stage, their shapes
// given back - and drawn once. The camera is stood nowhere for it. The same parts stand there,
// and no solid: each in its surface now, and the car, which stands, a step behind.
let gone = 0;
for (const mesh of whitened.parts) mesh.geometry.addEventListener('dispose', () => (gone += 1));
const [was] = whitened.parts;
const surfaced = view.show(scene, { way: 'materials' });
assert.notEqual(surfaced, whitened);
assert.deepEqual([gone, was.parent.parent, asked.drawn, asked.stood], [3, null, 2, 1]);
assert.deepEqual([surfaced.solids, meshed(surfaced)], [[], WHOLE]);
assert.deepEqual(stage.scene.children, [...lights, surfaced.all]);
assert.deepEqual(surfaced.all.children, [surfaced.land, surfaced.parts[0].parent]);
const OF_THEIR_OWN = ['plaster', 'glass', 'plain'].map((name) => SURFACES[name].colour);
assert.deepEqual(colours(surfaced), OF_THEIR_OWN);
assert.equal(new Set(OF_THEIR_OWN).size, 3);
assert.deepEqual(
  surfaced.parts.map((mesh) => mesh.material.polygonOffset),
  [false, false, true],
);
assert.deepEqual(surfaced.parts.map(shades), [
  [true, true],
  [false, false],
  [true, true],
]);
// The sun is White's own: it stands where it stood, shines where it shone and casts the shadows
// it cast. But the stage is told that the house stands in its surfaces, and is lit so: by the
// softer strengths, before the sky.
assert.deepEqual(asked.lit.at(-1), { ...inSun, surfaces: true });
assert.deepEqual([soft.intensity, side.intensity], [SURFACED.soft, SURFACED.side]);
assert.deepEqual([hexOf(backdrop), side.castShadow], [BACKDROP.surfaced, true]);
// The sky shows, and it is none of the parts: the page counts none of it, and the file saves none.
assert.deepEqual(
  [sky.visible, surfaced.parts.includes(sky), sky.parent],
  [true, false, stage.scene],
);
// The shadows off and on, and the ground off and on: nothing is built anew - the meshes that
// stood there stand there - and each is one drawing.
const stood = [...surfaced.parts];
for (const how of [{ shadows: false }, { shadows: true }, { ground: false }, {}]) {
  assert.equal(view.show(scene, { way: 'materials', ...how }), surfaced);
  assert.deepEqual(surfaced.parts, stood);
}
assert.deepEqual(
  asked.lit.slice(-4).map((sun) => [sun.shadows, sun.surfaces]),
  [false, true, true, true].map((on) => [on, true]),
);
assert.deepEqual([asked.drawn, side.castShadow, surfaced.land.visible], [6, true, true]);
assert.equal(sky.visible, true);
// A cut builds the meshes anew, as in White: at 109 m the storey is open - the walls of the
// house and of the court, and no roof - the car, which stands on the ground higher up, is gone,
// and what stood there whole is given back.
let whole = 0;
for (const mesh of stood) mesh.geometry.addEventListener('dispose', () => (whole += 1));
assert.equal(view.show(scene, { way: 'materials', cut: 109 }), surfaced);
const OPEN = [
  ['plaster', 1],
  ['glass', 1],
];
assert.deepEqual(
  [meshed(surfaced), colours(surfaced), whole, asked.drawn],
  [OPEN, OF_THEIR_OWN.slice(0, 2), 3, 7],
);
// Back in White the house is white again, lit for a white house, at the cut it was shown at; and
// in the volumes the solids stand there in their colours, with no part, lit as the stage always
// was. Each is built anew and drawn once, and the camera stays.
const back = view.show(scene, { way: 'white', cut: 109 });
assert.deepEqual([meshed(back), colours(back)], [OPEN, WHITE.slice(0, 2)]);
assert.deepEqual([asked.lit.at(-1), soft.intensity, hexOf(backdrop)], [inSun, 1, BACKDROP.sunlit]);
assert.equal(sky.visible, false);
const coloured = view.show(scene, { way: 'volumes' });
assert.deepEqual([coloured.parts, coloured.solids.length, asked.lit.at(-1)], [[], 3, null]);
assert.deepEqual([hexOf(backdrop), asked.drawn, asked.stood], [BACKDROP.volumes, 9, 1]);
assert.equal(sky.visible, false);

// A tab that kept the materials opens in them: the first scene stands there in its surfaces at
// once, with its shadows off as they were kept, seen from the front - one drawing.
const kept = { lit: [], drawn: 0, stood: 0 };
const another = {
  ...stage,
  scene: new Scene(),
  stand: () => (kept.stood += 1),
  light: (sun) => kept.lit.push(sun),
  draw: () => (kept.drawn += 1),
};
const opened = openView(another, null, TOWARD).show(scene, { way: 'materials', shadows: false });
assert.deepEqual([kept.drawn, kept.stood], [1, 1]);
assert.deepEqual(kept.lit, [{ ...inSun, surfaces: true, shadows: false }]);
assert.deepEqual([meshed(opened), colours(opened)], [WHOLE, OF_THEIR_OWN]);

process.stdout.write(
  'tools/sketch/view3d: in materials the parts stand on the stage in their surfaces, lit by the sun of white with softer lights before the sky, built anew for the way and for a cut and drawn once\n',
);
