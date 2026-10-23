// The parts of a scene on the stage: what the house is built of and what stands in it
// (scene/parts.js), as three.js draws them. A sketch gives some thousands of parts, and a thing
// to draw costs more than its triangles do: so the parts of one surface are one mesh, whatever
// their shapes, and a house is as many meshes as it has surfaces - a few. Where each part lies is
// the scene's to say, in metres of the plot, its shape's to turn into points (shapes.js), and the
// frame's to put on the stage (frame.js): nothing is worked out here. A part is drawn in its
// surface - a plain colour, as rough as the surface says (scene/surfaces.js), and on the house's
// own floors, walls and roofs of wood, stone, concrete and grass a pattern worked out in the
// shader, with no image (patterns.js, ST-033) - with what stands in the house a mesh of its own
// for each surface, a step behind the house's own and plain; or, in a way that says so, every
// part in one white, with no pattern. None has a line along an edge: the light tells one face
// from the next (lights.js).
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
} from 'three';
import { SURFACES } from '../scene/surfaces.js';
import { patterned } from './patterns.js';
import { shapeOf } from './shapes.js';

// The one white that every part is drawn in, in White.
const WHITE = '#ffffff';
// White's faces, each made once and never given back: the white that hides all behind it, and
// for each share that a see-through surface hides, a white that hides so much and no more - and
// hides nothing from the depth, so that what stands behind it is drawn (ADR-0066).
const SOLID = new MeshLambertMaterial({ color: WHITE });
const veils = new Map();
function whiteOf(surface) {
  const { hides } = SURFACES[surface];
  if (hides === undefined) return SOLID;
  if (!veils.has(hides)) {
    const veil = { color: WHITE, transparent: true, opacity: hides, depthWrite: false };
    veils.set(hides, new MeshLambertMaterial(veil));
  }
  return veils.get(hides);
}

/**
 * Whether a part hides all that stands behind it: every one does but one of a surface that is
 * see-through - that says how much it `hides` (scene/surfaces.js). In the sun such a part casts
 * a shadow and takes one, and a see-through one does neither.
 */
export const opaque = (part) => SURFACES[part.surface].hides === undefined;

// What a part of an object is, in the words of scene/parts.js: all else is the house's own.
const OF_AN_OBJECT = ['piece', 'step'];
/**
 * Whether a part stands in the house, and is none of it: a piece of an object, or a step of its
 * staircase. A floor, a wall, a roof, a pane, a frame and a railing are the house's own.
 */
export const stands = (part) => OF_AN_OBJECT.includes(part.of);

// What stands in the house lies this much further back in the depth than it is, by the measures
// of WebGL's polygon offset - its factor, for a face seen at a flat angle, and its units: as far
// as an object lies behind its block in the volumes (build.js, ADR-0067). A bed that is drawn
// against the edge of its room stands in the room's wall, and a staircase reaches the floor over
// it: each has a face in one plane with a face of the house. There the house's own part shows,
// and no pattern of the two.
const BEHIND = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 4 };
// The faces of the surfaces, each made once and never given back. One a surface: its colour, as
// rough as it says, and no metal - on three.js's standard material, which a file of the house
// takes as it is - and see-through by the share that the surface does not hide, with nothing
// hidden from the depth. And for a surface that something in the house is made of, one more,
// which differs from the first in one thing: it lies that step behind. The house's own face of a
// surface that has a pattern has it put into three.js's shader as the program is made, one
// program a pattern; the face a step behind stays plain - a bath of stone is no tiled bath.
const surfaced = new Map();
function surfaceOf(surface, behind) {
  const key = `${surface} ${behind}`;
  if (!surfaced.has(key)) {
    const { colour, rough, hides } = SURFACES[surface];
    const veil =
      hides === undefined ? {} : { transparent: true, opacity: hides, depthWrite: false };
    const back = behind ? BEHIND : {};
    const face = { name: surface, color: colour, roughness: rough, metalness: 0, ...veil, ...back };
    const made = new MeshStandardMaterial(face);
    const pattern = behind ? null : patterned(surface);
    if (pattern !== null) {
      made.onBeforeCompile = (shader) => {
        shader.vertexShader = pattern.vertex(shader.vertexShader);
        shader.fragmentShader = pattern.fragment(shader.fragmentShader);
      };
      made.customProgramCacheKey = () => pattern.key;
    }
    surfaced.set(key, made);
  }
  return surfaced.get(key);
}

/**
 * The frame as figures: where the plot's own [0, 0, 0] lies on the stage, and which way of the
 * stage its x, its y and its h point. The frame is a turn and a shift, so these four say all of
 * it - and a way a face looks is turned as a place is, and not shifted.
 */
function turnOf(place) {
  const origin = place([0, 0, 0]);
  const way = (unit) => place(unit).map((value, axis) => value - origin[axis]);
  return { origin, ways: [way([1, 0, 0]), way([0, 1, 0]), way([0, 0, 1])] };
}

/** The shapes of some parts as one: every point where the frame puts it, and every triangle. */
function merged(parts, { origin, ways }) {
  const shapes = parts.map(shapeOf);
  const count = (key) => shapes.reduce((sum, shape) => sum + shape[key].length, 0);
  const positions = new Float32Array(count('positions'));
  const normals = new Float32Array(count('normals'));
  const indices = new Uint32Array(count('indices'));
  let [at, corner] = [0, 0];
  for (const shape of shapes) {
    const first = at / 3;
    for (let point = 0; point < shape.positions.length; point += 3) {
      for (let axis = 0; axis < 3; axis += 1) {
        let [where, looks] = [origin[axis], 0];
        for (let along = 0; along < 3; along += 1) {
          where += shape.positions[point + along] * ways[along][axis];
          looks += shape.normals[point + along] * ways[along][axis];
        }
        positions[at + axis] = where;
        normals[at + axis] = looks;
      }
      at += 3;
    }
    for (const index of shape.indices) {
      indices[corner] = first + index;
      corner += 1;
    }
  }
  const one = new BufferGeometry();
  one.setAttribute('position', new BufferAttribute(positions, 3));
  one.setAttribute('normal', new BufferAttribute(normals, 3));
  one.setIndex(new BufferAttribute(indices, 1));
  return one;
}

/**
 * Some parts of a scene as meshes, each point where `place` - the frame - puts it:
 * `{ all, dispose }`. `all` is the one thing to add to the stage: it holds a mesh for each
 * surface that a part is of, in the order the surfaces first come - its `name` the surface's,
 * and `userData.parts` how many parts it is. `dispose()` gives the meshes' shapes back, once
 * they are off the stage.
 *
 * A part is drawn in its surface: in the colour of it, and as rough as it says - the house's own
 * part with the surface's pattern, where it has one (patterns.js). What stands in
 * the house (`stands`) is then a mesh of its own for each of its surfaces, beside the house's
 * mesh of that surface and under the same name, with a face that lies a step behind in the
 * depth: where it lies in one plane with a wall or a floor, that shows. Where `white` is set,
 * every part is white instead, and a surface is one mesh, whatever stands.
 *
 * Either way, a part of a see-through surface is see-through - it hides the share that its
 * surface says - and writes nothing into the depth. Where `sun` is set, a mesh that is not
 * see-through casts the sun's shadows and takes them; a see-through one does neither, and
 * without `sun` none does.
 */
export function meshesOf(parts, place, { sun = false, white = false } = {}) {
  const frame = turnOf(place);
  const drawn = new Map();
  for (const part of parts) {
    const behind = !white && stands(part);
    const key = `${part.surface} ${behind}`;
    if (!drawn.has(key)) drawn.set(key, { surface: part.surface, behind, of: [] });
    drawn.get(key).of.push(part);
  }
  const all = new Group();
  for (const { surface, behind, of } of drawn.values()) {
    const mesh = new Mesh(merged(of, frame), white ? whiteOf(surface) : surfaceOf(surface, behind));
    mesh.name = surface;
    mesh.userData.parts = of.length;
    if (sun && opaque(of[0])) [mesh.castShadow, mesh.receiveShadow] = [true, true];
    all.add(mesh);
  }
  const dispose = () => all.children.forEach((mesh) => mesh.geometry.dispose());
  return { all, dispose };
}
