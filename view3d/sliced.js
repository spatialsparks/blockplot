// The house opened along a slice of the pad (story ST-033): the plane of three.js that the stage
// is cut by, made of what `openAlong` of ../scene/shows.js works out, and what stands on the
// stage cut by it - every material of it, and so every pass that draws it: the canvas, the
// sun's shadow map, which takes a material's planes for the depth it casts with, and, handed the
// plane by the stage, the shade in corners. Where a mesh that hides what is behind it is cut, one
// sees into it: its inside is drawn dark, as an architect's section draws what is cut. What is
// handed here is what stands - the solids or the parts, and the land - and never the sky, whose
// dome stands on the stage beside it (lights.js): the sky is not cut. Nothing is worked out here
// of where the slice runs, and nothing of it is written into the sketch or a file.
import {
  BackSide,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  Plane,
  Vector3,
} from 'three';

/**
 * The colour of a cut, set by eye on the made-up house: a dark grey, a little lighter than the
 * pad's ink, so that a cut wall, slab or hill reads as solid in White, in Materials and in the
 * Volumes, and its edge against the sky or a white wall stays sharp.
 */
export const POCHE = '#3b4148';

// The dark inside lies a little nearer in the depth than it is, by WebGL's polygon offset - its
// factor, for a face seen at a flat angle, and its units: nearer than the earth's walls, which
// lie a step nearer already (build.js), and than a face of the next part where two touch inside
// a wall. Seen from without, every inside face lies behind an outside one by far more than that.
const AHEAD = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 };
// The dark inside, made once and never given back: a flat colour, lit by nothing, its far
// faces alone - the inside of a closed shape, which shows only where the plane opened it.
const INSIDE = new MeshBasicMaterial({ color: POCHE, side: BackSide, ...AHEAD });

/**
 * The plane of three.js that the house is opened along, from `along` - what `openAlong` gave,
 * `{ axis, at, keeps }` in metres of the plot's frame, or null - and `place`, the frame
 * (frame.js): a `Plane` through the point of the plot whose `axis` is `at`, whose normal points
 * along that axis into the half that is kept, toward the larger x or y where `keeps` is 1 and
 * the smaller where it is -1. three.js keeps what lies on the side its normal points to, and
 * takes away the rest. Null, where `along` is: the house is whole.
 */
export function planeOf(along, place) {
  if (along === null || along === undefined) return null;
  const { axis, at, keeps } = along;
  const [on, toward] = [
    [0, 0, 0],
    [0, 0, 0],
  ];
  [on[axis], toward[axis]] = [at, keeps];
  const origin = place([0, 0, 0]);
  const normal = new Vector3(...place(toward).map((value, of) => value - origin[of]));
  return new Plane().setFromNormalAndCoplanarPoint(normal.normalize(), new Vector3(...place(on)));
}

/**
 * Whether a mesh hides what stands behind it, and has an inside to show: one that is not
 * see-through, and is drawn from its outside alone. The earth is drawn from either side
 * (build.js) - its inside is not told from its outside by the way a face looks - and has a face
 * of its cut instead (`capOf`).
 */
const hides = (mesh) =>
  mesh.isMesh && !mesh.material.transparent && mesh.material.side !== DoubleSide;

// The face of the cut through the earth: the same dark, from either side, and drawn after the
// earth and before all else that stands (build.js, `ORDER`), writing nothing into the depth - so
// a room in a pit, behind it and in front of the earth, is drawn over it, and the earth is not.
const EARTH_CUT = new MeshBasicMaterial({ color: POCHE, side: DoubleSide, depthWrite: false });
const AFTER_THE_EARTH = -0.5;
// How far into the half that is kept the face of the earth's cut lies, in metres: a millimetre,
// which no eye sees on a hill and every graphics card tells from none.
const INTO_M = 0.001;

/** The three corners of each triangle of a shape, as points. */
function* trianglesOf(shape) {
  const [points, index] = [shape.getAttribute('position'), shape.getIndex()];
  const corner = (at) => new Vector3().fromBufferAttribute(points, index ? index.getX(at) : at);
  const count = index ? index.count : points.count;
  for (let at = 0; at < count; at += 3) yield [corner(at), corner(at + 1), corner(at + 2)];
}

/**
 * The face of the cut through the earth, in the plane: of `ground`, the top of the hill as
 * build.js makes it - its points the stage's - the line where the plane runs through it, from
 * one end of the hill to the other, and from each point of that line straight down to `base`, the
 * height of the hill's base on the stage. Where the line has a gap - a pit, where a block stands
 * and the ground has no top - it runs straight across it, and the face covers the pit too: what
 * stands in the pit is drawn over it. A shape of three.js, or null where the plane misses the
 * ground.
 */
export function capOf(ground, plane, base) {
  const across = new Vector3(-plane.normal.z, 0, plane.normal.x);
  const line = new Map();
  for (const three of trianglesOf(ground.geometry)) {
    const off = three.map((point) => plane.distanceToPoint(point));
    for (const [from, to] of [
      [0, 1],
      [1, 2],
      [2, 0],
    ]) {
      if (off[from] * off[to] > 0 || off[from] === off[to]) continue;
      const point = three[from].clone().lerp(three[to], off[from] / (off[from] - off[to]));
      line.set(point.dot(across).toFixed(4), point);
    }
  }
  if (line.size < 2) return null;
  const along = [...line.values()].sort((one, other) => one.dot(across) - other.dot(across));
  // A hair into what is kept: a face that lies in the plane is cut by it here and not there, and
  // the shade in corners, which draws the depth cut by that plane (stage.js), would find holes.
  const into = plane.normal.clone().multiplyScalar(INTO_M);
  for (const point of along) point.add(into);
  const flat = along.slice(1).flatMap((to, at) => {
    const from = along[at];
    const [under, below] = [from, to].map(({ x, z }) => new Vector3(x, base, z));
    return [from, under, below, from, below, to].flatMap((point) => point.toArray());
  });
  const shape = new BufferGeometry();
  shape.setAttribute('position', new Float32BufferAttribute(flat, 3));
  // Each triangle runs so that it faces the half taken away: the shade in corners asks which
  // way a face looks, and from there it sees this one.
  shape.computeVertexNormals();
  return shape;
}

/** A mesh of what is cut: marked so, casting no shadow and taking none. */
function insideOf(shape, material, name) {
  const inside = new Mesh(shape, material);
  Object.assign(inside, { name, castShadow: false, receiveShadow: false });
  if (material === EARTH_CUT) inside.renderOrder = AFTER_THE_EARTH;
  inside.userData.inside = true;
  return inside;
}

/**
 * Cuts all that `what` holds by `plane`, or by none where it is null, and gives how many meshes
 * got a dark inside. Every material of it - of a mesh, a line, the outline - gets the plane as its
 * one plane, and casts its shadows cut by it too; with null, it has none, as before. A mesh that
 * hides what is behind it gets, while the plane is there, a second mesh of its shape as a child
 * of its own: its inside faces, in `POCHE`, cut by the same plane, casting no shadow and taking
 * none - so it shows and hides with its mesh, and is no mesh that a file of the house holds
 * (file.js takes the meshes, not their children). A see-through one, and a line, gets none. Of
 * `land` - `{ ground, hill }` of build.js, where `what` has them - the ground gets, as its
 * child, the face of the cut through the earth (`capOf`), down to the hill's base: it shows and
 * hides with the ground. The insides of an earlier call are taken away first: called again on
 * what stands - built anew, or with a plane moved, or none - `what` has this call's alone.
 */
export function opened(what, plane, land = null) {
  const [insides, cut] = [[], []];
  what.traverse((one) => {
    if (one.userData.inside === true) insides.push(one);
    else if (one.material !== undefined) {
      Object.assign(one.material, {
        clippingPlanes: plane && [plane],
        clipShadows: plane !== null,
      });
      if (plane !== null && hides(one)) cut.push(one);
    }
  });
  for (const inside of insides) {
    inside.removeFromParent();
    if (inside.material === EARTH_CUT) inside.geometry.dispose();
  }
  INSIDE.clippingPlanes = plane && [plane];
  for (const mesh of cut) mesh.add(insideOf(mesh.geometry, INSIDE, 'inside'));
  if (plane !== null && land !== null) {
    land.hill.geometry.computeBoundingBox();
    const face = capOf(land.ground, plane, land.hill.geometry.boundingBox.min.y);
    if (face !== null) land.ground.add(insideOf(face, EARTH_CUT, 'earth cut'));
  }
  return cut.length;
}
