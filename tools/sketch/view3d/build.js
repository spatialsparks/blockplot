// What stands on the stage: the scene of the sketch, as three.js draws it. A block is a box in
// its colour with thin lines along its edges, and see-through where the scene says so - and
// under a top that slopes, what of its box lies under that top. An object is a box of its size
// in its colour - but a tree is a trunk with a round crown, and a bush a low round one. The
// ground is a hill in one quiet colour: its top, with none where a block stands, and under it
// walls down to a base, so that nothing shows from under it. The parcel's outline lies on it.
// Where each of them lies is the scene's to say, in metres of the plot, and the frame's to turn
// into a place of the stage (frame.js): nothing is worked out here. A way of showing may have
// the parts of the house in the place of the solids (meshes.js) - then no solid is built here -
// and the sun's shadows, cast by what is solid and taken by it and by the earth.
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
} from 'three';
import { landOf } from '../scene/ground.js';
import { shapeOf } from './shapes.js';
import { UNDER } from './stage.js';

// The pad's ink, for the lines along a block's edges and for the outline; and what those lines
// are drawn in on a block too dark for ink to show: of the pad's eleven colours, on ink alone.
const INK = '#1f2933';
const PALE = '#e5e7eb';
// How light a colour is at the least, of 1, for ink to show on it.
const INK_SHOWS_FROM = 0.3;
// The ground: earth, a darker one than the slices fill theirs with, so that a pale object shows
// on it. Quiet beside every colour of a block, and no green: a see-through block is one.
const GROUND = '#cbbfa6';
// The ground beyond the plot's paper (ST-042): that earth made lighter, halfway to white, as the
// slices draw it lighter there.
const BEYOND = '#e5dfd3';
// How much a see-through block hides of what stands behind it: the rest shows.
const HIDES = 0.35;
// The lines along a block's edges lie in the planes of its faces, where the depth cannot tell
// which of the two is the nearer. So a line is drawn nearer to the eye than it lies, by this
// share of how far off it is - along the line of sight, which moves nothing in the picture. A
// thousandth: a centimetre at 10 m. With half of it the lines were whole in every picture tried,
// drawn by a graphics card and in software; with none a part of each is hidden, and in software
// nearly all of it.
const NEARER = 0.001;
// Where three.js's vertex shaders put a point into the picture: after it, a line is drawn nearer.
const PROJECTED = '#include <project_vertex>';
// An object's faces, and the skirts, lie this much further back in the depth than they are, by
// WebGL's polygon offset: its factor, for a face seen at a flat angle, and its units.
const BEHIND = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 4 };
// The walls of the hill, and its base, lie that much nearer in the depth than they are. The wall
// of a pit lies in one plane with the wall of the block that stands in it: where the two are
// seen - by an eye that has come into the hill - the earth shows, and not the room behind it.
const AHEAD = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 };
// The ground is drawn first and the outline next, over it whatever the depth: it lies a hair off
// the mesh inside a cell that is no plane. All else comes after them - the walls and the base of
// the hill, then the solids - so a wall of earth or a block in front of the outline hides it.
const ORDER = { ground: -3, outline: -2, hill: -1 };
// A tree, as the pad's slices draw it: the crown is as wide as the tree and takes the top two
// thirds of its height, and the trunk reaches up into it. Shares of the tree's width and height.
const CROWN_HIGH = 0.68;
const TRUNK = { wide: 0.08, high: 0.45 };
// How many flat pieces a round shape is made of, around it.
const ROUND = 24;

// One shape for each kind of solid, a unit large - a metre along every edge, or across - and
// about its middle: each solid is that shape, as large as its own box. A dome is the upper half
// of a ball, and stands on its middle. A block under a top that slopes alone has none of them:
// its shape is its own, made for its scene (`slopedOf`).
const CUBE = new BoxGeometry(1, 1, 1);
const EDGES = new EdgesGeometry(CUBE);
const BALL = new SphereGeometry(0.5, ROUND, ROUND / 2);
const DOME = new SphereGeometry(0.5, ROUND, ROUND / 4, 0, 2 * Math.PI, 0, Math.PI / 2);
const POST = new CylinderGeometry(0.5, 0.5, 1, ROUND / 2);

/** How light a colour is, from 0 to 1, as the eye has it: `#rrggbb`, its green weighing most. */
export function lightness(hex) {
  const [red, green, blue] = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
  return (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
}

/** Lines in a colour, drawn nearer to the eye than they lie: three.js's own lines, and one line more in their shader. */
function linesIn(colour) {
  const lines = new LineBasicMaterial({ color: colour });
  lines.onBeforeCompile = (shader) => {
    const share = (1 - NEARER).toFixed(6);
    const nearer = `mvPosition.xyz *= ${share};\n\tgl_Position = projectionMatrix * mvPosition;`;
    shader.vertexShader = shader.vertexShader.replace(PROJECTED, `${PROJECTED}\n\t${nearer}`);
  };
  return lines;
}

// The materials, each made once and never given back: the faces of solids, one for each colour;
// the lines along the edges of blocks, in ink and pale; the earth - of the ground, of the walls
// of the hill and its base, and of the skirts, behind the ground (ST-042): ahead, each drew a
// line on it - which shows from either side, so an eye in the hill sees earth; and the outline.
const faces = new Map();
const LINES = { ink: linesIn(INK), pale: linesIn(PALE) };
const linesOn = (colour) => (lightness(colour) < INK_SHOWS_FROM ? LINES.pale : LINES.ink);
const EARTH = new MeshLambertMaterial({ color: GROUND, side: DoubleSide });
const DUG = new MeshLambertMaterial({ color: GROUND, side: DoubleSide, ...AHEAD });
const SKIRTED = new MeshLambertMaterial({ color: GROUND, side: DoubleSide, ...BEHIND });
// The top of a ground that reaches past the paper: each point in its colour, earth or lighter.
const TINTED = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
const TINTS = [GROUND, BEYOND].map((hex) => new Color(hex).toArray());
const BOUNDARY = new LineBasicMaterial({ color: INK, depthTest: false });

/**
 * The faces of a solid: in its colour and lit, so that each side shows in a shade of its own.
 * Through a see-through block, what stands behind it shows - it hides a part of it, and hides
 * nothing from the depth. An object's faces lie a step behind in the depth: a bed against a wall
 * and a staircase as high as its room have a face in one plane with a face of the block they
 * stand in, and there the block shows, as a solid does, and no pattern of the two.
 */
function faceOf({ colour, see, kind }) {
  const object = kind !== undefined;
  const key = `${colour} ${see} ${object}`;
  if (!faces.has(key)) {
    const glass = { transparent: true, opacity: HIDES, depthWrite: false };
    const [back, through] = [object ? BEHIND : {}, see === 'through' ? glass : {}];
    faces.set(key, new MeshLambertMaterial({ color: colour, ...back, ...through }));
  }
  return faces.get(key);
}

/** Where a solid's box lies on the stage: its middle, and how far it reaches along x, y and z. */
function spanOf({ min, max }, place) {
  const [from, to] = [place(min), place(max)];
  return {
    middle: from.map((low, axis) => (low + to[axis]) / 2),
    size: from.map((low, axis) => Math.abs(to[axis] - low)),
  };
}

/**
 * A box, as large as the solid's: its faces in the solid's colour. A block has thin lines along
 * its edges, which tell two boxes of one colour apart. An object is a box in its fill, and no
 * more: drawn nearer than it lies, a line of it would show through the wall it stands against.
 */
function boxOf(solid, place) {
  const { middle, size } = spanOf(solid, place);
  const box = new Mesh(CUBE, faceOf(solid));
  box.position.set(...middle);
  box.scale.set(...size);
  if (solid.kind === undefined) box.add(new LineSegments(EDGES, linesOn(solid.colour)));
  return box;
}

/** A tree: a trunk, and a round crown as wide as the tree. It stands on the bottom of its box. */
function treeOf(solid, place) {
  const { middle, size } = spanOf(solid, place);
  const [wide, high, deep] = size;
  const leaf = faceOf(solid);
  const trunk = new Mesh(POST, leaf);
  trunk.scale.set(TRUNK.wide * wide, TRUNK.high * high, TRUNK.wide * deep);
  trunk.position.y = (TRUNK.high * high) / 2;
  const crown = new Mesh(BALL, leaf);
  crown.scale.set(wide, CROWN_HIGH * high, deep);
  crown.position.y = high * (1 - CROWN_HIGH / 2);
  const tree = new Group();
  tree.position.set(middle[0], middle[1] - high / 2, middle[2]);
  tree.add(trunk, crown);
  return tree;
}

/** A bush: a low round one - a dome as wide and as high as its box, standing on the box's bottom. */
function bushOf(solid, place) {
  const { middle, size } = spanOf(solid, place);
  const [wide, high, deep] = size;
  const bush = new Mesh(DOME, faceOf(solid));
  bush.position.set(middle[0], middle[1] - high / 2, middle[2]);
  bush.scale.set(wide, 2 * high, deep);
  return bush;
}

/**
 * A shape of the scene's own, as three.js has one: its points - three figures each, in the
 * plot's frame - each where the frame puts it, and its triangles, with the way every face of it
 * looks worked out of them.
 */
function shapeIn({ positions, indices }, place) {
  const placed = [];
  for (let at = 0; at < positions.length; at += 3) {
    placed.push(...place(positions.slice(at, at + 3)));
  }
  const shape = new BufferGeometry();
  shape.setAttribute('position', new Float32BufferAttribute(placed, 3));
  shape.setIndex(indices);
  shape.computeVertexNormals();
  return shape;
}

/**
 * A block under a top that slopes, as what it is: what of its box lies under that top - a slant
 * (shapes.js) from the solid's foot up to its top - in the block's colour and as see-through as
 * a box is, with thin lines along its own edges, as a box has them. Where its top comes down to
 * its foot it ends in an edge. Its two shapes are this solid's alone: `own` takes them.
 */
function slopedOf(solid, place, own) {
  const { min, max, top } = solid;
  const foot = [min[2], min[2]];
  const under = { shape: 'slant', min, max, along: top.along, low: foot, high: top.high };
  const shape = shapeIn(shapeOf(under), place);
  const edges = new EdgesGeometry(shape);
  own.push(shape, edges);
  const block = new Mesh(shape, faceOf(solid));
  block.add(new LineSegments(edges, linesOn(solid.colour)));
  return block;
}

// The kinds of object that are no box. A block has no kind, and is one - or, where its solid
// says `top`, what lies under that.
const SHAPES = { tree: treeOf, bush: bushOf };
/** A solid in its shape, and in its own colour: `own` takes the shapes made for it alone. */
const solidOf = (solid, place, own) =>
  solid.top === undefined
    ? (Object.hasOwn(SHAPES, solid.kind) ? SHAPES[solid.kind] : boxOf)(solid, place)
    : slopedOf(solid, place, own);

/** Whether a solid of a scene casts a shadow in the sun: every one does that is not see-through. */
export const casts = (solid) => solid.see !== 'through';

/** Has every shape of a solid - a tree is two - cast the sun's shadows, and take them. */
function inSun(solid) {
  solid.traverse((shape) => {
    if (shape.isMesh) [shape.castShadow, shape.receiveShadow] = [true, true];
  });
}

/**
 * Earth: a mesh of the scene's - the ground, two triangles a cell and none where a block stands,
 * or the walls and the base that make a hill of it - each point where the frame puts it, in one
 * colour and lit, so that the slope reads and each wall has a shade of its own. `order` says
 * when it is drawn. A shape that says `light` of its points (scene/ground.js, `landOf`) has
 * each in its own: earth, or the lighter earth beyond the plot's paper.
 */
function earthOf(shape, place, earth, order) {
  const mesh = new Mesh(shapeIn(shape, place), shape.light ? TINTED : earth);
  const tints = shape.light?.flatMap((light) => TINTS[light]);
  if (tints) mesh.geometry.setAttribute('color', new Float32BufferAttribute(tints, 3));
  mesh.renderOrder = order;
  return mesh;
}

/** The parcel's outline: the scene's ring of points on the ground, closed, and drawn over the ground. */
function outlineOf(outline, place) {
  const shape = new BufferGeometry();
  shape.setAttribute('position', new Float32BufferAttribute(outline.flatMap(place), 3));
  const line = new LineLoop(shape, BOUNDARY);
  line.renderOrder = ORDER.outline;
  return line;
}

/**
 * What a scene puts on the stage, each thing where `place` - the frame - puts it:
 * - `all`, the one thing to add to the stage, and to take off it again;
 * - `land`, all that is ground, as one thing to show or to hide: `ground`, its top; `outline`,
 *   the parcel's, lying on it; and `hill`, its walls and its base, down from the scene's lowest
 *   point - and as its child, where it has near grids and far squares, their skirts, on `UNDER`;
 * - `solids`, one for each solid of the scene, in the scene's order: each shows, or does not -
 *   and none, where the parts of the house stand in their place;
 * - `dispose()`, which gives back what was made for this scene alone - the shapes of its land,
 *   and of every block of it whose top slopes - once it is off the stage.
 *
 * The third argument is the way it is shown in, as far as it is drawn here (`WAYS` of
 * showing.js). Where `parts` is set, the house is shown as its parts - in white, or each in its
 * surface (meshes.js) - and no solid is built: the land alone, and the earth is earth. Where
 * `sun` is set, a solid that is not see-through casts the sun's shadows and takes them, and the
 * ground and the walls and the base of the hill take them, and cast none. With neither - the
 * volumes - nothing here casts a shadow or takes one.
 */
export function build(scene, place, { parts = false, sun = false } = {}) {
  const { top, hill: dug, skirts } = landOf(scene.ground, scene.box.min[2]);
  const ground = earthOf(top, place, EARTH, ORDER.ground);
  const hill = earthOf(dug, place, DUG, ORDER.hill);
  if (skirts) hill.add(earthOf(skirts, place, SKIRTED, ORDER.hill));
  for (const skirt of hill.children) skirt.layers.set(UNDER);
  const outline = outlineOf(scene.outline, place);
  const own = [];
  const solids = (parts ? [] : scene.solids).map((solid) => {
    const made = solidOf(solid, place, own);
    if (sun && casts(solid)) inSun(made);
    return made;
  });
  if (sun) for (const earth of [ground, hill, ...hill.children]) earth.receiveShadow = true;
  const land = new Group();
  land.add(ground, outline, hill);
  const all = new Group();
  all.add(land, ...solids);
  const dispose = () =>
    [...land.children, ...hill.children, ...own].forEach((one) => (one.geometry ?? one).dispose());
  return { all, land, ground, outline, hill, solids, dispose };
}
