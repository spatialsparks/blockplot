// The check of the house opened along a slice (story ST-033), by hand, with three.js and no
// browser: the plane made of what `openAlong` gives, through a made-up frame - a point of the
// stage on either side of it, kept or taken away, as a person worked it out first; that every
// material of what stands gets the plane, and casts its shadows cut by it; that a mesh that hides
// what is behind it gets a dark inside, and a see-through one and a line none; that opened again
// leaves the insides of that call alone, and with no plane none and no plane at all. And the
// view: a house shown opened has its plane on every material, the stage is handed it for the
// shade in corners - once, until it moves - the sky beside it is not cut, the file's meshes
// hold no inside, the earth is closed by a dark face whose size a person worked out, and no
// camera moves; shown with none, it is whole again. What it looks like is a look's. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import {
  BackSide,
  BoxGeometry,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Scene,
  Vector3,
} from 'three';
import { sceneOf } from '../scene/scene.js';
import { frameOf } from './frame.js';
import { POCHE, capOf, opened, planeOf } from './sliced.js';
import { openView } from './view.js';

// A frame, made up: heights count from 108 m, so the plot's [x, y, h] lies on the stage at
// [x, h - 108, -y].
const place = frameOf({ box: { min: [0, 0, 108] } });
assert.deepEqual(place([1, 2, 110]), [1, 2, -2]);
const kept = (plane, point) => plane.distanceToPoint(new Vector3(...point));

// Opened along x = 12 m, keeping the smaller x - as the front view opens it: the stage's x is the
// plot's, so the plane's normal is -x, and three.js keeps what lies on its side: -x + 12 >= 0.
// A point at x = 11 m lies 1 m inside what is kept, one at 13 m 1 m outside, whatever its height
// and its y; one at 12 m lies on the plane.
const front = planeOf({ axis: 0, at: 12, keeps: -1 }, place);
assert.deepEqual([...front.normal.toArray(), front.constant], [-1, 0, 0, 12]);
assert.equal(kept(front, [11, 3, -2]), 1);
assert.equal(kept(front, [13, 0.5, -7]), -1);
assert.equal(kept(front, [12, 40, 9]), 0);
// Opened along y = 3 m, keeping the larger y - as the side view opens it, from the small y: the
// plot's y is the stage's -z, so the normal is -z, and what is kept is -z - 3 >= 0. Plot y = 4 m
// is stage z = -4: 1 m kept; plot y = 2 m is z = -2: 1 m taken away.
const side = planeOf({ axis: 1, at: 3, keeps: 1 }, place);
assert.deepEqual([side.normal.x, side.normal.y, side.normal.z, side.constant], [0, 0, -1, -3]);
assert.equal(kept(side, place([5, 4, 109])), 1);
assert.equal(kept(side, place([5, 2, 109])), -1);
// And the other way round, keeping the smaller y: the far side's slice.
assert.equal(kept(planeOf({ axis: 1, at: 3, keeps: -1 }, place), place([5, 2, 109])), 1);
// None, where the house opens along nothing.
assert.equal(planeOf(null, place), null);

// A group as build.js makes one: a solid with its line along its edges, a see-through solid,
// and a line alone - each with a material of its own.
const solid = new Mesh(new BoxGeometry(2, 3, 2), new MeshLambertMaterial());
const edges = new LineSegments(new EdgesGeometry(solid.geometry), new LineBasicMaterial());
solid.add(edges);
const glass = new Mesh(new BoxGeometry(2, 3, 2), new MeshLambertMaterial({ transparent: true }));
const outline = new LineSegments(new EdgesGeometry(solid.geometry), new LineBasicMaterial());
const group = new Group();
group.add(solid, glass, outline);
const insidesOf = (what) => {
  const found = [];
  what.traverse((one) => one.name === 'inside' && found.push(one));
  return found;
};
/** Of every material of the group but the insides': its planes, and whether it casts its shadows cut. */
const cutOf = () =>
  [solid, edges, glass, outline].map(({ material }) => [
    material.clippingPlanes,
    material.clipShadows,
  ]);

// Opened: every material has the plane, and casts cut; the solid alone has a dark inside - its
// own shape, its far faces in POCHE, lit by nothing, cut by the same plane, casting no shadow.
assert.equal(opened(group, front), 1);
assert.deepEqual(cutOf(), Array(4).fill([[front], true]));
const [inside] = insidesOf(group);
assert.equal(inside.parent, solid);
assert.equal(inside.geometry, solid.geometry);
assert.ok(inside.material instanceof MeshBasicMaterial);
assert.equal(inside.material.side, BackSide);
assert.equal(`#${inside.material.color.getHexString()}`, POCHE);
assert.deepEqual(inside.material.clippingPlanes, [front]);
assert.deepEqual([inside.castShadow, inside.receiveShadow], [false, false]);
assert.deepEqual([insidesOf(glass), insidesOf(outline)], [[], []]);
// Opened again, along another slice: the plane is the new one, and each mesh has one inside.
assert.equal(opened(group, side), 1);
assert.deepEqual(cutOf(), Array(4).fill([[side], true]));
assert.equal(insidesOf(group).length, 1);
assert.deepEqual(insidesOf(group)[0].material.clippingPlanes, [side]);
// Closed: no plane, no shadow cut, no inside.
assert.equal(opened(group, null), 0);
assert.deepEqual(cutOf(), Array(4).fill([null, false]));
assert.deepEqual(insidesOf(group), []);

// The view, on a made-up stage that notes what it is asked: a plot of 8 m by 4 m, with a house
// from x = 3 m to 5 m, as view.check.js has it, and a sky beside what stands.
const row = Array.from({ length: 17 }, (_, column) => 1000 - 12.5 * column).join(' ');
const site = {
  ...{ cellM: 0.5, xFromM: 0, xToM: 8, yFromM: 0, yToM: 4, sideM: [100, 120] },
  outline: [
    [1, 1],
    [7, 1],
    [7, 3],
    [1, 3],
  ],
  ground: { baseM: 100, rowsCm: Array(9).fill(row) },
};
const house = { x: [6, 10], y: [2, 6], z: [16, 22], colour: { name: 'grey', hex: '#8795a1' } };
const scene = sceneOf(site, [house]);
const asked = { stood: 0, cut: [] };
const stage = {
  scene: new Scene(),
  field: () => ({ deg: 60, shape: 1 }),
  stand: () => (asked.stood += 1),
  looking: () => null,
  light: () => {},
  draw: () => {},
  cut: (plane) => asked.cut.push(plane),
};
const sky = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
stage.scene.add(sky);
const view = openView(stage, null, [0.48, 0.36, 0.8]);
const whole = view.show(scene, { way: 'white' });
const parts = whole.parts.length;
assert.deepEqual([asked.cut, insidesOf(whole.all)], [[], []]);
// Opened along x = 4 m, through the middle of the house, keeping the uphill half: the plane of
// that frame, on every material of what stands - the parts and the land - and handed to the stage.
const along = { axis: 0, at: 4, keeps: -1 };
const shown = view.show(scene, { way: 'white', along });
const plane = planeOf(along, frameOf(scene));
assert.equal(asked.cut.length, 1);
assert.deepEqual([asked.cut[0].normal, asked.cut[0].constant], [plane.normal, plane.constant]);
shown.all.traverse(({ name, material }) => {
  if (material !== undefined && name !== 'earth cut') {
    assert.deepEqual(material.clippingPlanes, [asked.cut[0]]);
  }
});
assert.equal(sky.material.clippingPlanes, null);
// The earth is closed where it is cut, by a dark face of the ground's: the ground lies at 109 m
// at x = 4 m - 110 m at x = 0, 2 m lower at 8 m - which is 1 m on the stage, and the hill's base
// 2 m under the scene's lowest point, 108 m: -2 m. Across the plot, y = 0 to 4 m, it is 3 m high,
// and straight across the house's pit from y = 1 m to 3 m: 12 m2, a millimetre into what is kept.
const [earthCut] = shown.ground.children;
assert.deepEqual(
  [earthCut.name, earthCut.castShadow, earthCut.material.clippingPlanes],
  ['earth cut', false, null],
);
const faces = earthCut.geometry.getAttribute('position');
const corners = Array.from({ length: faces.count }, (_, at) =>
  new Vector3().fromBufferAttribute(faces, at),
);
assert.ok(corners.every(({ x }) => Math.abs(x - 3.999) < 1e-6));
assert.deepEqual(
  [Math.min(...corners.map(({ y }) => y)), Math.max(...corners.map(({ y }) => y))],
  [-2, 1],
);
let area = 0;
for (let at = 0; at < corners.length; at += 3) {
  const [one, two, three] = corners.slice(at, at + 3);
  area += two.clone().sub(one).cross(three.clone().sub(one)).length() / 2;
}
assert.ok(Math.abs(area - 12) < 1e-4, `${area} m2`);
// A plane that misses the ground - at x = 20 m, off the plot - closes nothing.
assert.equal(
  capOf(shown.ground, planeOf({ axis: 0, at: 20, keeps: -1 }, frameOf(scene)), -2),
  null,
);
// The parts are the parts as they were, the file's meshes: an inside is a child of one, no part.
assert.equal(shown.parts.length, parts);
assert.ok(shown.parts.every((mesh) => mesh.name !== 'inside'));
assert.ok(insidesOf(shown.all).length >= parts);
// The same slice again is no new plane for the stage; a slice moved is.
view.show(scene, { way: 'white', along });
assert.equal(asked.cut.length, 1);
const moved = view.show(scene, { way: 'materials', along: { ...along, at: 4.5 } });
moved.all.traverse(({ name, material }) => {
  if (material !== undefined && name !== 'earth cut') {
    assert.deepEqual(material.clippingPlanes, [asked.cut[1]]);
  }
});
view.show(scene, { way: 'materials', along: { ...along, at: 4.5 } });
assert.equal(moved.ground.children.length, 1);
assert.equal(asked.cut.length, 2);
assert.equal(asked.cut[1].constant, 4.5);
// Closed: the stage is told so, and nothing of what stands is cut or dark inside - nor of the
// earth, built as it was. No camera moved but at the first scene.
const closed = view.show(scene, { way: 'materials' });
assert.equal(closed, moved);
assert.equal(asked.cut.at(-1), null);
closed.all.traverse(({ material }) => {
  if (material !== undefined) assert.equal(material.clippingPlanes, null);
});
assert.deepEqual([insidesOf(closed.all), closed.ground.children, asked.stood], [[], [], 1]);

process.stdout.write(
  'tools/sketch/view3d: the house opens along a slice by a plane that keeps the half worked out by hand, every material of what stands cut and the shadows with it, a dark inside for what hides and none for glass or a line, the stage handed the plane, the sky whole, the file without an inside\n',
);
