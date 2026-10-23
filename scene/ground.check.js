// The ground meshes' check: a made-up ground of three cells by two, with a block standing in one
// of them, against the points and triangles a person worked out by hand - its top, and the walls
// and the base that make a hill of it. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { BASE_BELOW_M, SKIRT_M, drawnBox, groundMesh, hillMesh, landOf } from './ground.js';

// Four columns of grid points and three rows of them, half a metre apart: the top row of the
// paper lies at y = 1. No two points are equally high, and no ground is drawn in the middle cell
// of the bottom row.
const ground = {
  xs: [0, 0.5, 1, 1.5],
  ys: [1, 0.5, 0],
  heights: [
    [10, 9, 8, 7],
    [10.5, 9.5, 8.5, 7.5],
    [11.25, 10.25, 9.25, 8.25],
  ],
  drawn: [
    [true, true, true],
    [true, false, true],
  ],
};
const { positions, indices } = groundMesh(ground);

// Every grid point, three numbers a point - x, y, h - a row after another: points 0 to 3 are the
// top row, 4 to 7 the middle one, 8 to 11 the bottom one.
assert.deepEqual(
  positions,
  [
    [0, 1, 10, 0.5, 1, 9, 1, 1, 8, 1.5, 1, 7],
    [0, 0.5, 10.5, 0.5, 0.5, 9.5, 1, 0.5, 8.5, 1.5, 0.5, 7.5],
    [0, 0, 11.25, 0.5, 0, 10.25, 1, 0, 9.25, 1.5, 0, 8.25],
  ].flat(),
);

// Two triangles for every cell where ground is drawn, and none for the one where it is not. Of
// the first cell, by hand: its corners are the points 0 and 1 above 4 and 5; one triangle goes
// from the top left down and then to the right, the other from the top left to the bottom right
// and up.
assert.deepEqual(
  indices,
  [
    [0, 4, 5, 0, 5, 1],
    [1, 5, 6, 1, 6, 2],
    [2, 6, 7, 2, 7, 3],
    [4, 8, 9, 4, 9, 5],
    [6, 10, 11, 6, 11, 7],
  ].flat(),
);

// Every triangle faces up: seen from above, with x to the right and y up, it runs anticlockwise,
// and it covers half a cell.
const corner = (index) => positions.slice(index * 3, index * 3 + 2);
for (let first = 0; first < indices.length; first += 3) {
  const [[ax, ay], [bx, by], [cx, cy]] = indices.slice(first, first + 3).map(corner);
  assert.equal(((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2, 0.5 ** 2 / 2);
}

// Ground everywhere is two triangles a cell, and ground nowhere is none: the points stay.
const everywhere = { ...ground, drawn: ground.drawn.map((row) => row.map(() => true)) };
const nowhere = { ...ground, drawn: ground.drawn.map((row) => row.map(() => false)) };
const [all, none] = [groundMesh(everywhere), groundMesh(nowhere)];
assert.deepEqual([all.indices.length, none.indices.length], [6 * 2 * 3, 0]);
assert.deepEqual(none.positions, positions);

// The same ground as a hill. A cellar stands in the hole and reaches down to 6 m, a metre under
// the lowest ground: that is the lowest point of the scene, and the base lies 2 m under it.
assert.equal(BASE_BELOW_M, 2);
const BASE = 4;
const hill = hillMesh(ground, 6);
const minus = (a, b) => a.map((value, axis) => value - b[axis]);
const cross = (a, b) =>
  [0, 1, 2].map((i) => a[(i + 1) % 3] * b[(i + 2) % 3] - a[(i + 2) % 3] * b[(i + 1) % 3]);
/** Which way a triangle faces, a unit long: seen from there, its points run anticlockwise. */
const facing = (a, b, c) => {
  const across = cross(minus(b, a), minus(c, a));
  return across.map((value) => value / Math.hypot(...across) + 0);
};
/** The fours of a hill: four points one after another in `positions`, and two triangles of them. */
function foursOf(mesh) {
  const fours = [];
  for (let at = 0; at < mesh.indices.length; at += 6) {
    const first = (at / 6) * 4;
    const two = [first, first + 1, first + 2, first, first + 2, first + 3];
    assert.deepEqual(mesh.indices.slice(at, at + 6), two);
    const points = [first, first + 1, first + 2, first + 3];
    fours.push(points.map((point) => mesh.positions.slice(point * 3, point * 3 + 3)));
  }
  assert.equal(mesh.positions.length, fours.length * 4 * 3);
  return fours;
}
const fours = foursOf(hill);
const [base, walls] = [fours.at(-1), fours.slice(0, -1)];

// A wall, in words: where it stands - from the left to the right of one who looks at it - which
// way it faces, and how high the ground lies at its two ends. It is upright: each of its tops
// lies over a foot, both feet lie on the base, and its two triangles face one way.
const WAYS = { '1,0,0': '+x', '-1,0,0': '-x', '0,1,0': '+y', '0,-1,0': '-y' };
const said = walls.map(([footA, footB, topB, topA]) => {
  assert.deepEqual([topA.slice(0, 2), topB.slice(0, 2)], [footA.slice(0, 2), footB.slice(0, 2)]);
  assert.deepEqual([footA[2], footB[2]], [BASE, BASE]);
  const faces = facing(footA, footB, topB);
  assert.deepEqual(facing(footA, topB, topA), faces);
  const [from, to] = [footA.slice(0, 2), footB.slice(0, 2)];
  return `${from} to ${to} facing ${WAYS[faces]}, ${topA[2]} to ${topB[2]} m`;
});
// By hand: a wall along every edge of the paper where ground is drawn - not under the hole, at
// the bottom of the paper: there the pit is open to the side - and three around the hole, which
// face into it. Twelve walls, and no other.
const byHand = [
  // Along the top of the paper, y = 1, facing the larger y: seen from there, x runs to the left.
  '0.5,1 to 0,1 facing +y, 9 to 10 m',
  '1,1 to 0.5,1 facing +y, 8 to 9 m',
  '1.5,1 to 1,1 facing +y, 7 to 8 m',
  // Down its left edge, x = 0, facing the smaller x.
  '0,1 to 0,0.5 facing -x, 10 to 10.5 m',
  '0,0.5 to 0,0 facing -x, 10.5 to 11.25 m',
  // Along its bottom, y = 0, facing the smaller y: left and right of the hole, not under it.
  '0,0 to 0.5,0 facing -y, 11.25 to 10.25 m',
  '1,0 to 1.5,0 facing -y, 9.25 to 8.25 m',
  // Up its right edge, x = 1.5, facing the larger x.
  '1.5,0 to 1.5,0.5 facing +x, 8.25 to 7.5 m',
  '1.5,0.5 to 1.5,1 facing +x, 7.5 to 7 m',
  // Around the hole, each facing into it: on its left, over it and on its right.
  '0.5,0 to 0.5,0.5 facing +x, 10.25 to 9.5 m',
  '0.5,0.5 to 1,0.5 facing -y, 9.5 to 8.5 m',
  '1,0.5 to 1,0 facing -x, 8.5 to 9.25 m',
];
assert.deepEqual([...said].sort(), [...byHand].sort());

// The hill is closed. The rim of the ground - every edge of its top that one triangle alone has
// - is the top of one wall, and no wall has another top: the two meet point for point.
const edgeOf = (one, other) => [String(one), String(other)].sort().join(' | ');
const taking = new Map();
for (let first = 0; first < indices.length; first += 3) {
  const three = indices.slice(first, first + 3).map((at) => positions.slice(at * 3, at * 3 + 3));
  three.forEach((from, nth) => {
    const edge = edgeOf(from, three[(nth + 1) % 3]);
    taking.set(edge, [...(taking.get(edge) ?? []), three]);
  });
}
const rim = [...taking].filter(([, triangles]) => triangles.length === 1);
const tops = new Map(walls.map((wall) => [edgeOf(wall[3], wall[2]), wall]));
assert.equal(rim.length, 12);
assert.deepEqual([...tops.keys()].sort(), rim.map(([edge]) => edge).sort());
// And each wall faces away from the earth it holds: the triangle of ground at its top lies
// behind it.
for (const [edge, [triangle]] of rim) {
  const [footA, footB, topB, topA] = tops.get(edge);
  const middle = [0, 1].map((axis) => (topA[axis] + topB[axis]) / 2);
  const earth = [0, 1].map((axis) => triangle.reduce((sum, point) => sum + point[axis], 0) / 3);
  const [x, y] = facing(footA, footB, topB);
  assert.ok((middle[0] - earth[0]) * x + (middle[1] - earth[1]) * y > 0, `the wall at ${edge}`);
}

// The base: one flat rectangle under the whole paper, 2 m under the cellar, facing up - its
// corners run anticlockwise seen from above, as a cell of the ground does.
assert.deepEqual(base, [
  [0, 1, BASE],
  [0, 0, BASE],
  [1.5, 0, BASE],
  [1.5, 1, BASE],
]);
assert.deepEqual(
  [facing(base[0], base[1], base[2]), facing(base[0], base[2], base[3])],
  [
    [0, 0, 1],
    [0, 0, 1],
  ],
);
// With no cellar the lowest point is the ground's, 7 m, and the base lies 2 m under that.
assert.deepEqual(
  foursOf(hillMesh(ground, 7)).map((four) => four[0][2]),
  Array(13).fill(5),
);
// Ground everywhere: the ten edges of the paper, and the base. Ground nowhere: the base alone.
assert.deepEqual(
  [hillMesh(everywhere, 7), hillMesh(nowhere, 7)].map((mesh) => foursOf(mesh).length),
  [10 + 1, 1],
);

// NEAR AND FAR (ST-042). Of a ground of one grid, `landOf` is the two meshes above, as they were.
assert.deepEqual(landOf(ground, 6), { top: groundMesh(ground), hill: hillMesh(ground, 6) });
// A near grid of one cell, x 0 to 1 and y 1 down to 0, level at 10 m; a far square of a metre
// beside it on the paper, rising to 11 m along x; and one of 2 m beyond the paper - which ends at
// x 2 - from 11 to 13 m. The scene's lowest is 10 m, and so is the far squares': the base at 8 m,
// under all that is drawn, x 0 to 4 and y -1 to 1.
const reaching = {
  near: [
    {
      xs: [0, 1],
      ys: [1, 0],
      heights: [
        [10, 10],
        [10, 10],
      ],
      drawn: [[true]],
    },
  ],
  far: [
    [1, 1, 2, 0, 10, 11, 10, 11],
    [2, 1, 4, -1, 11, 13, 11, 13],
  ],
  paper: { min: [0, 0], max: [2, 1] },
};
const land = landOf(reaching, 10);
// The top: the grid's four points and two triangles, then four points and two triangles a far
// square, as a cell's run; earth on the paper, lighter for the far square beyond it.
assert.deepEqual(land.top, {
  positions: [
    [0, 1, 10, 1, 1, 10, 0, 0, 10, 1, 0, 10],
    [1, 1, 10, 2, 1, 11, 1, 0, 10, 2, 0, 11],
    [2, 1, 11, 4, 1, 13, 2, -1, 11, 4, -1, 13],
  ].flat(),
  indices: [0, 2, 3, 0, 3, 1, 4, 6, 7, 4, 7, 5, 8, 10, 11, 8, 11, 9],
  light: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
});
// The hill: the base alone, for no block stands in the grid. The skirts, drawn behind the ground
// as the hill is drawn ahead of it: the grid's four walls along its own edge, to the base; a
// skirt from each edge of a far square, a metre down - half the side of either is no more - but
// to the base on the rim of what is drawn.
assert.equal(SKIRT_M, 1);
const written = (mesh) =>
  foursOf(mesh).map((four) => four.map((point) => point.join(' ')).join(', '));
assert.deepEqual(written(land.hill), ['0 1 8, 0 -1 8, 4 -1 8, 4 1 8']);
assert.deepEqual(written(land.skirts), [
  '0 1 8, 0 0 8, 0 0 10, 0 1 10',
  '0 0 8, 1 0 8, 1 0 10, 0 0 10',
  '1 0 8, 1 1 8, 1 1 10, 1 0 10',
  '1 1 8, 0 1 8, 0 1 10, 1 1 10',
  '1 1 9, 1 0 9, 1 0 10, 1 1 10',
  '1 0 9, 2 0 10, 2 0 11, 1 0 10',
  '2 0 10, 2 1 10, 2 1 11, 2 0 11',
  '2 1 8, 1 1 8, 1 1 10, 2 1 11',
  '2 1 10, 2 -1 10, 2 -1 11, 2 1 11',
  '2 -1 8, 4 -1 8, 4 -1 13, 2 -1 11',
  '4 -1 8, 4 1 8, 4 1 13, 4 -1 13',
  '4 1 8, 2 1 8, 2 1 11, 4 1 13',
]);
// A near grid of two cells, x 0 to 2, level at 10 m, a block standing in the second: the wall
// of its pit, at x 1, is the hill's, drawn ahead; the grid's three walls along its own edge are
// skirts. The base lies 2 m under it, x 0 to 2 and y 0 to 1.
const pit = { xs: [0, 1, 2], ys: [1, 0], heights: [Array(3).fill(10), Array(3).fill(10)] };
const dug = landOf(
  { near: [{ ...pit, drawn: [[true, false]] }], far: [], paper: reaching.paper },
  10,
);
assert.deepEqual(written(dug.hill), ['1 0 8, 1 1 8, 1 1 10, 1 0 10', '0 1 8, 0 0 8, 2 0 8, 2 1 8']);
assert.deepEqual(written(dug.skirts), [
  '0 1 8, 0 0 8, 0 0 10, 0 1 10',
  '0 0 8, 1 0 8, 1 0 10, 0 0 10',
  '1 1 8, 0 1 8, 0 1 10, 1 1 10',
]);
// All that is drawn, for the camera's sight: the scene's box and the far squares.
const box = { min: [0, 0, 10], max: [1, 1, 10] };
assert.deepEqual(drawnBox(reaching, box), { min: [0, -1, 10], max: [4, 1, 13] });
assert.deepEqual(drawnBox(ground, box), box);

process.stdout.write(
  'tools/sketch/scene: the ground is two triangles a cell and none under a block, and a closed hill with its walls and its base\n',
);
