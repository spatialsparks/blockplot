// The check of the parts on the stage: made-up parts, as meshes, against what a person worked
// out by hand - one part of each shape, lying where the frame puts what the scene says, turned
// and not mirrored; a thousand boxes of three surfaces as three meshes; and in White every part
// white, a see-through surface see-through; no line anywhere; and in the sun, what is not
// see-through casts shadows and takes them; and the house's own floor of wood has its pattern
// put into the shader, and what stands in the house and White have none (patterns.check.js holds
// the patterns). What else a part is drawn with in its own surface is
// materials.check.js's. No browser: three.js makes its shapes without one, and what is
// asked of WebGL is the browser test's, tests/e2e/sketch-3d-parts.spec.ts. What a shape is, by
// hand, is shapes.check.js's. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { Box3, Vector3 } from 'three';
import { SURFACES } from '../scene/surfaces.js';
import { frameOf } from './frame.js';
import { meshesOf, opaque } from './meshes.js';
import { patterned } from './patterns.js';

// A frame, made up: heights count from 108 m, so the plot's [x, y, h] lies on the stage at
// [x, h - 108, -y].
const place = frameOf({ box: { min: [0, 0, 108] } });
assert.deepEqual(place([1, 2, 110]), [1, 2, -2]);

// A point of a mesh is kept to seven figures: what was worked out by hand is compared to a
// tenth of a millimetre.
const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) =>
    assert.ok(Math.abs(value - expected[at]) < 1e-4, `${what}: ${actual} is not ${expected}`),
  );
};
/**
 * Where some meshes reach from, and to, on the stage - by the corners of their triangles, for a
 * point that no triangle has is not drawn - and every point of a mesh is a corner of one.
 */
const reachOf = (...meshes) => {
  const reach = new Box3();
  for (const { geometry } of meshes) {
    const [points, corners] = [geometry.getAttribute('position'), geometry.getIndex()];
    assert.equal(new Set(corners.array).size, points.count, 'a point that no triangle has');
    for (const at of corners.array)
      reach.expandByPoint(new Vector3().fromBufferAttribute(points, at));
  }
  return [...reach.min.toArray(), ...reach.max.toArray()];
};
/** How much a mesh holds, added up from its triangles: more than nothing only where they run against the clock, seen from outside. */
function holds({ geometry }) {
  const [points, corners] = [geometry.getAttribute('position'), geometry.getIndex()];
  const at = (n) => new Vector3().fromBufferAttribute(points, corners.getX(n));
  let sum = 0;
  for (let n = 0; n < corners.count; n += 3) sum += at(n).dot(at(n + 1).cross(at(n + 2))) / 6;
  return sum;
}
const colourOf = (material) => `#${material.color.getHexString()}`;
const shades = (one) => [one.castShadow, one.receiveShadow];
const part = (shape, surface, min, max, more) => ({
  of: 'piece',
  shape,
  surface,
  min,
  max,
  ...more,
});

// One part of each shape, each of a surface of its own, so that each is a mesh of its own. By
// hand, on the stage:
// - a box from [1, 2, 110] to [4, 4, 111 m]: from x = 1 to 4, 2 m to 3 m over the floor, and
//   from z = -4 to -2. It holds 6 cubic metres;
// - a cylinder in a box from [2, 0, 113] to [6, 2, 116]: x from 2 to 6, 5 m to 8 m up, z from
//   -2 to 0. Of 24 flat pieces, it holds 18.634971 cubic metres (shapes.check.js);
// - a ball in a box from [0, 0, 108] to [4, 2, 114]: x from 0 to 4, the floor to 6 m, z -2 to 0;
// - a dome in a box from [10, 10, 108] to [14, 12, 109.5]: x from 10 to 14, the floor to 1.5 m,
//   z from -12 to -10;
// - a wedge about [5, 5], from the plot's x a quarter round towards its y, 1 m to 2 m off, from
//   118 m up to 118.2 m: x from 5 to 7, 10 m to 10.2 m up, and - the plot's y from 5 to 7 - z
//   from -7 to -5. It holds 0.465874 cubic metres;
// - a slant over the rectangle from [0, 1] to [4, 3], whose top falls down the plot from 113 m
//   to 110 m and its bottom from 112 m to 110 m: x from 0 to 4, 2 m to 5 m up, z from -3 to
//   -1. It holds 4 cubic metres (shapes.check.js).
const winds = { about: [5, 5], from: 0, to: 90, inner: 1, outer: 2 };
const slopes = { along: 0, low: [112, 110], high: [113, 110] };
const SIX = [
  [part('box', 'plaster', [1, 2, 110], [4, 4, 111]), [1, 2, -4, 4, 3, -2], 6],
  [part('round', 'wood', [2, 0, 113], [6, 2, 116]), [2, 5, -2, 6, 8, 0], 18.634971],
  [part('ball', 'leaf', [0, 0, 108], [4, 2, 114]), [0, 0, -2, 4, 6, 0], null],
  [part('dome', 'grass', [10, 10, 108], [14, 12, 109.5]), [10, 0, -12, 14, 1.5, -10], null],
  [part('wedge', 'stone', [5, 5, 118], [7, 7, 118.2], winds), [5, 10, -7, 7, 10.2, -5], 0.465874],
  [part('slant', 'concrete', [0, 1, 110], [4, 3, 113], slopes), [0, 2, -3, 4, 5, -1], 4],
];
const six = meshesOf(
  SIX.map(([one]) => one),
  place,
);
assert.equal(six.all.children.length, 6);
SIX.forEach(([one, reach, held], at) => {
  const mesh = six.all.children[at];
  assert.deepEqual([mesh.isMesh, mesh.name, mesh.userData.parts], [true, one.surface, 1]);
  near(reachOf(mesh), reach, `a ${one.shape} on the stage`);
  // Turned and not mirrored: seen from outside, its triangles run against the clock still.
  if (held === null) assert.ok(holds(mesh) > 0, `a ${one.shape} is inside out`);
  else near([holds(mesh)], [held], `what a ${one.shape} holds, on the stage`);
});
// And the way a face looks is turned as its place is: the top of the box looks up the stage's
// y; its face that looks along the plot's y, at y = 4, lies at z = -4 and looks against z.
const [boxed] = six.all.children;
const [points, looks] = ['position', 'normal'].map((name) => boxed.geometry.getAttribute(name));
const faces = new Set();
for (let at = 0; at < points.count; at += 1) {
  const way = [looks.getX(at), looks.getY(at), looks.getZ(at)].map((value) => value + 0);
  const lies = [points.getX(at), points.getY(at), points.getZ(at)];
  if (way[1] === 1) assert.equal(lies[1], 3, 'the top of the box');
  if (way[2] === -1) assert.equal(lies[2], -4, 'the far side of the box');
  faces.add(way.join(' '));
}
assert.deepEqual([...faces].sort(), ['-1 0 0', '0 -1 0', '0 0 -1', '0 0 1', '0 1 0', '1 0 0']);

// A thousand boxes of three surfaces are three meshes - and not a thousand: the boxes of one
// surface are one, in the order the surfaces first come. By hand: the boxes stand in rows of
// forty, a metre apart, each half a metre square and 0.3 m high. Every seventh is of concrete,
// from the first on: 143 of a thousand. Of the others the even ones are of plaster - 500 less
// the 72 that are a seventh too, 428 - and the odd ones of wood, 429. Each mesh says how many
// parts it is, and has 24 points and 12 triangles a box.
const THREE = ['plaster', 'wood', 'concrete'];
const thousand = Array.from({ length: 1000 }, (_, at) => {
  const [x, y] = [at % 40, Math.floor(at / 40)];
  return part('box', THREE[at % 7 === 0 ? 2 : at % 2], [x, y, 108], [x + 0.5, y + 0.5, 108.3]);
});
const many = meshesOf(thousand, place);
assert.deepEqual(
  many.all.children.map((mesh) => [mesh.name, mesh.userData.parts]),
  [
    ['concrete', 143],
    ['wood', 429],
    ['plaster', 428],
  ],
);
for (const mesh of many.all.children) {
  const { parts } = mesh.userData;
  assert.equal(mesh.geometry.getAttribute('position').count, 24 * parts);
  assert.equal(mesh.geometry.getAttribute('normal').count, 24 * parts);
  assert.equal(mesh.geometry.getIndex().count, 36 * parts);
  // Every box of it is there, and whole: 0.5 * 0.5 * 0.3 = 0.075 cubic metres each - to a
  // tenth of a box, for a point of a mesh is kept to seven figures.
  assert.ok(Math.abs(holds(mesh) - 0.075 * parts) < 0.0075, `the mesh of ${mesh.name}`);
}
// And they lie where they were put: from the first, at the plot's [0, 0], to the last one of
// row 24, in column 39 - 39.5 m along the plot and 24.5 m across it, which is z = -24.5.
near(reachOf(...many.all.children), [0, 0, -24.5, 39.5, 0.3, 0], 'where the thousand lie');
// The concrete alone ends with its 143rd box, the 995th of all: in column 34 of row 24, so its
// last row reaches to x = 34.5 - but an earlier one stands in column 39, the 120th of all.
near(reachOf(many.all.children[0]), [0, 0, -24.5, 39.5, 0.3, 0], 'where the concrete lies');

// In White every part is white, and has no line along an edge: all that stands there is meshes.
// One white, made once, for every surface that hides what stands behind it - and the same the
// next time.
const mixed = [
  part('box', 'plaster', [0, 0, 108], [1, 1, 109]),
  part('box', 'glass', [1, 0, 108], [2, 1, 109]),
  part('ball', 'leaf', [2, 0, 108], [3, 1, 109]),
  part('box', 'glass', [3, 0, 108], [4, 1, 109]),
  part('box', 'metal', [4, 0, 108], [5, 1, 109]),
];
const WHITE = { white: true };
const lit = meshesOf(mixed, place, { sun: true, ...WHITE });
const [wall, pane, crown, post] = lit.all.children;
assert.deepEqual(
  lit.all.children.map((mesh) => [mesh.name, mesh.userData.parts]),
  [
    ['plaster', 1],
    ['glass', 2],
    ['leaf', 1],
    ['metal', 1],
  ],
);
lit.all.traverse((one) => assert.ok(one === lit.all || one.isMesh, 'something that is no mesh'));
for (const mesh of lit.all.children) assert.equal(colourOf(mesh.material), '#ffffff');
assert.equal(wall.material, crown.material);
assert.equal(wall.material, post.material);
assert.equal(wall.material, meshesOf(thousand, place, WHITE).all.children[0].material);
assert.deepEqual([wall.material.transparent, wall.material.opacity], [false, 1]);
assert.equal(wall.material.depthWrite, true);
// A see-through surface is see-through: it hides the share its surface says - a share, more
// than nothing and less than all, whatever it is set to - and nothing from the depth, so that
// what stands behind it is drawn. A surface is see-through where it says how much it hides,
// and nowhere else: glass is.
const { hides } = SURFACES.glass;
assert.ok(hides > 0 && hides < 1, `glass hides ${hides}`);
for (const [surface, { hides: share }] of Object.entries(SURFACES)) {
  assert.equal(opaque({ surface }), share === undefined, surface);
}
const veil = pane.material;
assert.deepEqual([veil.transparent, veil.opacity, veil.depthWrite], [true, hides, false]);
assert.notEqual(veil, wall.material);
assert.equal(meshesOf(mixed, place, WHITE).all.children[1].material, veil);
// In the sun, what is not see-through casts shadows and takes them, and what is see-through
// does neither. Out of the sun - told so, or told nothing - nothing does.
assert.deepEqual(
  lit.all.children.map(shades),
  [true, false, true, true].map((on) => [on, on]),
);
for (const dull of [
  meshesOf(mixed, place, WHITE),
  meshesOf(mixed, place, { sun: false, ...WHITE }),
]) {
  for (const mesh of dull.all.children) assert.deepEqual(shades(mesh), [false, false]);
}

// In its surfaces, the house's own floor of wood has its pattern put into three.js's shader as
// the program is made, under the key of its pattern (patterns.js); a piece of wood that stands
// in the house - its face a step behind - has none, nor has the floor in White, nor a pane.
const shaded = (face) => Object.hasOwn(face, 'onBeforeCompile');
const floored = [part('box', 'wood', [0, 0, 108], [1, 1, 108.2], { of: 'floor' })];
const [planked, stood, glazed] = meshesOf(
  [...floored, part('box', 'wood', [0, 0, 108.2], [1, 1, 109]), mixed[1]],
  place,
).all.children.map((mesh) => mesh.material);
assert.deepEqual([shaded(planked), shaded(stood), shaded(glazed)], [true, false, false]);
assert.equal(planked.customProgramCacheKey(), patterned('wood').key);
const shader = { vertexShader: 'void main() {}', fragmentShader: 'void main() {}' };
assert.throws(() => planked.onBeforeCompile(shader), /three\.js has changed/);
assert.equal(shaded(meshesOf(floored, place, WHITE).all.children[0].material), false);

// What was made for these parts alone is given back with them: the shape of every mesh.
let gone = 0;
for (const mesh of lit.all.children) mesh.geometry.addEventListener('dispose', () => (gone += 1));
lit.dispose();
assert.equal(gone, 4);
// And no part, no mesh.
assert.deepEqual(meshesOf([], place).all.children, []);

process.stdout.write(
  'tools/sketch/view3d: the parts of one surface are one mesh, each part where the frame puts it - in White white, and see-through where its surface is\n',
);
