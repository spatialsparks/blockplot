// The check of the parts in their surfaces - the way Materials - on made-up parts: every surface
// has one face, in the colour it was given and as rough as it says, on three.js's standard
// material, with no metal and no image; a see-through surface is see-through by the share it
// does not hide, and hides nothing from the depth; what stands in the house - a piece of an
// object, a step - has a face of its own for each surface, which is the house's but for one
// thing: it lies a step behind in the depth, so that a bed drawn into a wall does not show on
// the wall; and in White all of it is as it was. No colour is held here: a face has the colour
// that scene/surfaces.js says, whatever that is. No browser: what is drawn is the browser
// test's, tests/e2e/sketch-3d-materials.spec.ts. How the view stands the parts there and lights
// them is materials-view.check.js's. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { OF } from '../scene/parts.js';
import { SURFACES } from '../scene/surfaces.js';
import { frameOf } from './frame.js';
import { meshesOf, stands } from './meshes.js';

const place = frameOf({ box: { min: [0, 0, 108] } });
const colourOf = (material) => `#${material.color.getHexString()}`;
const shades = (one) => [one.castShadow, one.receiveShadow];
const part = (of, surface, at = 0) => ({
  of,
  shape: 'box',
  surface,
  min: [at, 0, 108],
  max: [at + 1, 1, 109],
});
// Every surface there is, however many: which they are is scene/surfaces.check.js's to say.
const NAMES = Object.keys(SURFACES);
assert.ok(NAMES.length > 1 && NAMES.includes('glass'));

// A wall of each surface, side by side: as many meshes, a surface each, in the order they come.
// Each has the face of its surface: three.js's standard material, in the colour the surface was
// given, as rough as it says, with no metal in it, under the surface's name - and with nothing
// in any place where three.js would take an image: whatever it calls a map is empty.
const walls = meshesOf(
  NAMES.map((name, at) => part('wall', name, at)),
  place,
  { sun: true },
);
assert.deepEqual(
  walls.all.children.map((mesh) => [mesh.name, mesh.userData.parts]),
  NAMES.map((name) => [name, 1]),
);
const faces = new Map(walls.all.children.map((mesh) => [mesh.name, mesh.material]));
for (const [name, { colour, rough, hides }] of Object.entries(SURFACES)) {
  const face = faces.get(name);
  assert.ok(face.isMeshStandardMaterial && !face.isMeshPhysicalMaterial, name);
  assert.deepEqual(
    [colourOf(face), face.roughness, face.metalness, face.name],
    [colour, rough, 0, name],
  );
  const images = Object.keys(face).filter((key) => /^(map|matcap)$|Map$/.test(key));
  assert.ok(images.includes('map') && images.includes('roughnessMap'), name);
  for (const key of images) assert.equal(face[key], null, `${name} has an image for its ${key}`);
  // What hides all behind it is drawn as any solid thing; a see-through one hides the share its
  // surface says, and writes nothing into the depth: what stands behind it is drawn, and shows.
  const veiled = hides !== undefined;
  assert.deepEqual(
    [face.transparent, face.opacity, face.depthWrite],
    [veiled, veiled ? hides : 1, !veiled],
    name,
  );
  // The house's own lies where it lies.
  assert.equal(face.polygonOffset, false, name);
}
// Glass is see-through, and so far nothing else.
assert.ok(faces.get('glass').transparent && SURFACES.glass.hides < 1);
// One face a surface: as many faces as there are surfaces, made once - a second wall has the
// face of the first, and so has the next house.
assert.equal(new Set(faces.values()).size, NAMES.length);
const again = meshesOf(
  [part('roof', 'wood'), part('floor', 'wood', 2), part('rail', 'metal', 4)],
  place,
);
assert.deepEqual(
  again.all.children.map((mesh) => [mesh.name, mesh.userData.parts, mesh.material]),
  [
    ['wood', 2, faces.get('wood')],
    ['metal', 1, faces.get('metal')],
  ],
);
// In the sun what is not see-through casts shadows and takes them, and glass does neither; out
// of the sun nothing does.
assert.deepEqual(
  walls.all.children.map(shades),
  NAMES.map((name) => (name === 'glass' ? [false, false] : [true, true])),
);
for (const mesh of again.all.children) assert.deepEqual(shades(mesh), [false, false]);

// What stands in the house, in the words of a part - written again from scene/parts.js, so that
// a word which is added there is said here too: a piece of an object and a step of its staircase
// stand in it, and all else is the house's own.
assert.deepEqual(OF, ['floor', 'roof', 'wall', 'pane', 'frame', 'rail', 'step', 'piece']);
assert.deepEqual(
  OF.filter((of) => stands({ of })),
  ['step', 'piece'],
);
// A floor of wood, a table and a step of wood on it, and a pane with a shower's glass beside it:
// the house's wood and the wood that stands in it are a mesh each, under one name - and so are
// the two of glass. What stands has a face of its own, the same for a piece and for a step.
const room = [
  part('floor', 'wood'),
  part('piece', 'wood', 2),
  part('pane', 'glass', 4),
  part('step', 'wood', 6),
  part('piece', 'glass', 8),
];
const furnished = meshesOf(room, place, { sun: true });
assert.deepEqual(
  furnished.all.children.map((mesh) => [mesh.name, mesh.userData.parts]),
  [
    ['wood', 1],
    ['wood', 2],
    ['glass', 1],
    ['glass', 1],
  ],
);
const [floor, table, pane, shower] = furnished.all.children.map((mesh) => mesh.material);
assert.deepEqual([floor, pane], [faces.get('wood'), faces.get('glass')]);
// That face is the surface's own in all that shows: its colour, how rough it is, how much it
// hides. It differs in one thing. It lies behind in the depth, by WebGL's polygon offset - one
// for a face seen at a flat angle and four units, both away from the eye, as an object lies
// behind its block in the volumes (ADR-0067). So where a piece lies in one plane with a wall or
// a floor - a bed drawn against the edge of its room stands in the wall - the house's own part
// is the nearer of the two, and shows.
for (const [stood, own] of [
  [table, floor],
  [shower, pane],
]) {
  assert.notEqual(stood, own);
  assert.ok(stood.isMeshStandardMaterial);
  for (const key of ['name', 'roughness', 'metalness', 'transparent', 'opacity', 'depthWrite']) {
    assert.equal(stood[key], own[key], key);
  }
  assert.equal(colourOf(stood), colourOf(own));
  assert.deepEqual(
    [stood.polygonOffset, stood.polygonOffsetFactor, stood.polygonOffsetUnits],
    [true, 1, 4],
  );
  assert.deepEqual([own.polygonOffset, own.depthTest, stood.depthTest], [false, true, true]);
}
// Made once, too: a chair in the next house has the table's face. And what stands casts its
// shadow as the house does, or - being glass - casts none.
assert.equal(meshesOf([part('piece', 'wood')], place).all.children[0].material, table);
assert.deepEqual(furnished.all.children.map(shades), [
  [true, true],
  [true, true],
  [false, false],
  [false, false],
]);

// In White nothing of this is so: the same room is a mesh a surface, whatever stands, in the one
// white that is no surface's face - three.js's plainer material, as it was - and nothing lies
// behind anything.
const inWhite = meshesOf(room, place, { sun: true, white: true });
assert.deepEqual(
  inWhite.all.children.map((mesh) => [mesh.name, mesh.userData.parts]),
  [
    ['wood', 3],
    ['glass', 2],
  ],
);
const [white, veil] = inWhite.all.children.map((mesh) => mesh.material);
for (const face of [white, veil]) {
  assert.ok(face.isMeshLambertMaterial && !face.polygonOffset);
  assert.equal(colourOf(face), '#ffffff');
  assert.ok(![...faces.values(), table, shower].includes(face));
}
assert.deepEqual(
  [white.transparent, veil.transparent, veil.opacity],
  [false, true, SURFACES.glass.hides],
);

process.stdout.write(
  'tools/sketch/view3d: in its surfaces a part has the one face of its surface - its colour, how rough it is, and no image - see-through where the surface is, and what stands in the house lies a step behind it\n',
);
