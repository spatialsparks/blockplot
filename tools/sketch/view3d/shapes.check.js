// The check of the shapes a part can have: one of each, from a made-up part, against what a
// person worked out by hand - where it lies by its `min` and `max`, a wedge by what it winds
// round and a slant by its two planes - and of every one of them that it is closed, that each
// of its triangles runs against the clock seen from outside, and that each point says which
// way its face looks. No browser, no three.js, and nothing of the site: plain figures in the
// plot's frame. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { SHAPES as OF_A_PART } from '../scene/parts.js';
import { ROUND, SHAPES, shapeOf } from './shapes.js';

const triples = (flat) =>
  Array.from({ length: flat.length / 3 }, (_, at) => flat.slice(3 * at, 3 * at + 3));
const minus = (a, b) => a.map((value, axis) => value - b[axis]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = ([a, b, c], [d, e, f]) => [b * f - c * e, c * d - a * f, a * e - b * d];
// What was worked out by hand has six places after the point.
const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) =>
    assert.ok(Math.abs(value - expected[at]) < 5e-7, `${what}: ${actual} is not ${expected}`),
  );
};
/** The lowest and the highest that some points reach, along x, y and h. */
const reachOf = (points) => [
  [0, 1, 2].map((axis) => Math.min(...points.map((point) => point[axis]))),
  [0, 1, 2].map((axis) => Math.max(...points.map((point) => point[axis]))),
];

/**
 * What holds of every shape, tried - and the shape as points, the way each looks, and how much
 * it holds. Every way a face looks is one long. Every triangle that has a size looks out the way
 * its three points say. And the shape is closed: each edge of such a triangle is the edge of
 * exactly one other, which runs along it the other way - so that no light passes through it,
 * whichever of its sides are drawn. How much it holds is added up from its triangles, each with
 * the point [0, 0, 0]: more than nothing only where they run against the clock seen from outside.
 */
function sound(shape, what) {
  const [points, looks, corners] = [shape.positions, shape.normals, shape.indices].map(triples);
  assert.equal(points.length, looks.length, what);
  for (const way of looks) near([Math.hypot(...way)], [1], `${what}: a way of length one`);
  const edges = new Map();
  const named = (point) => point.map((value) => Math.round(value * 1e6) / 1e6 + 0).join(' ');
  let holds = 0;
  for (const triangle of corners) {
    const [p, q, r] = triangle.map((at) => points[at]);
    const out = cross(minus(q, p), minus(r, p));
    holds += dot(p, out) / 6;
    // At the top of a ball a ring is one point, and a triangle there has no size.
    if (Math.hypot(...out) < 1e-12) continue;
    for (const at of triangle) assert.ok(dot(out, looks[at]) > 0, `${what}: a face looks inward`);
    [
      [p, q],
      [q, r],
      [r, p],
    ].forEach(([from, to]) => {
      const edge = `${named(from)} > ${named(to)}`;
      edges.set(edge, (edges.get(edge) ?? 0) + 1);
    });
  }
  for (const [edge, times] of edges) {
    const [from, to] = edge.split(' > ');
    assert.equal(times, 1, `${what}: the edge ${edge} is two triangles'`);
    assert.equal(edges.get(`${to} > ${from}`), 1, `${what}: open along ${edge}`);
  }
  return { points, looks, holds };
}

// Every shape a part can say has a shape here, and there is no other.
assert.deepEqual([...SHAPES].sort(), [...OF_A_PART].sort());
assert.equal(ROUND, 24);

// A box, by hand: from [1, 2, 10] to [4, 4, 11] - 3 m along the plot, 2 m across it and a metre
// high, 6 cubic metres. Six faces of four points: 24 points and 12 triangles. Every point is a
// corner of the box, each corner three times, once for each face that meets there - and looks
// along one extent, out of the box.
const box = { shape: 'box', min: [1, 2, 10], max: [4, 4, 11] };
const boxed = sound(shapeOf(box), 'a box');
assert.deepEqual([boxed.points.length, shapeOf(box).indices.length], [24, 12 * 3]);
near([boxed.holds], [6], 'what a box holds');
assert.deepEqual(reachOf(boxed.points), [box.min, box.max]);
const seen = new Map();
boxed.points.forEach((point, at) => {
  point.forEach((value, axis) => assert.ok([box.min[axis], box.max[axis]].includes(value)));
  const [way] = [0, 1, 2].filter((axis) => boxed.looks[at][axis] !== 0);
  assert.deepEqual(boxed.looks[at].map(Math.abs).sort(), [0, 0, 1]);
  assert.equal(boxed.looks[at][way], point[way] === box.max[way] ? 1 : -1);
  seen.set(String(point), (seen.get(String(point)) ?? 0) + 1);
});
assert.deepEqual([seen.size, [...new Set(seen.values())]], [8, [3]]);

// An upright cylinder, by hand: in a box from [2, 0, 5] to [6, 2, 8] it is 4 m wide, 2 m deep
// and 3 m high, about the middle [4, 1]: it fills its box from side to side. Its side is 24
// flat pieces, with a point at every quarter - so it reaches every side of its box - and it has
// a top and a bottom. A round shape of 24 pieces covers twelve times the sine of 15 degrees,
// 3.105829, of the square on its radius, where a circle covers pi: here 3.105829 * 2 * 1 =
// 6.211657 square metres, and so it holds 18.634971 cubic metres.
const post = { shape: 'round', min: [2, 0, 5], max: [6, 2, 8] };
const posted = sound(shapeOf(post), 'a cylinder');
assert.equal(posted.points.length, 4 * ROUND);
near([posted.holds], [18.634971], 'what a cylinder holds');
near(reachOf(posted.points).flat(), [2, 0, 5, 6, 2, 8], 'a cylinder fills its box');
posted.points.forEach(([x, y, h], at) => {
  near([((x - 4) / 2) ** 2 + (y - 1) ** 2], [1], 'a point of a cylinder, seen from above');
  assert.ok(h === 5 || h === 8);
  const [, , up] = posted.looks[at];
  assert.ok(up === 0 || up === (h === 8 ? 1 : -1), 'a top looks up, and a bottom down');
});
// Its side looks straight out at the quarters; an eighth of the way round - at the point
// [4 + 2 * 0.707107, 1 + 0.707107] - a wall twice as far off along x as along y looks half as
// much along x as along y: [1, 2] by its length, 2.236068.
const sideAt = (x, y) =>
  posted.looks.find((way, at) => {
    const [px, py] = posted.points[at];
    return way[2] === 0 && Math.abs(px - x) < 1e-6 && Math.abs(py - y) < 1e-6;
  });
near(sideAt(6, 1), [1, 0, 0], 'the side of a cylinder, down the plot');
near(sideAt(4, 2), [0, 1, 0], 'the side of a cylinder, across the plot');
near(sideAt(5.414214, 1.707107), [0.447214, 0.894427, 0], 'the side of a cylinder, between');

// A ball, by hand: in a box from [0, 0, 0] to [4, 2, 6] it reaches 2 m, 1 m and 3 m from its
// middle, [2, 1, 3], and fills the box: every point lies on it, where the three shares of its
// reach, squared, add up to one. It has 13 rings of 24 points, the lowest and the highest one
// point each. Of flat pieces, it holds a little less than the ball does: four thirds of pi,
// times 2 * 1 * 3, are 25.13 cubic metres.
const ball = { shape: 'ball', min: [0, 0, 0], max: [4, 2, 6] };
const balled = sound(shapeOf(ball), 'a ball');
assert.equal(balled.points.length, (ROUND / 2 + 1) * ROUND);
near(reachOf(balled.points).flat(), [0, 0, 0, 4, 2, 6], 'a ball fills its box');
for (const [x, y, h] of balled.points) {
  near([((x - 2) / 2) ** 2 + (y - 1) ** 2 + ((h - 3) / 3) ** 2], [1], 'a point of a ball');
}
assert.ok(balled.holds > 0.96 * 25.13 && balled.holds < 25.13, String(balled.holds));
// Its top looks up, its foot down, and its side out. Where it is a ball indeed - a metre all
// round, about [1, 1, 1] - every point looks straight away from the middle.
const wayAt = ({ points, looks }, place) =>
  looks[
    points.findIndex((point) => point.every((value, axis) => Math.abs(value - place[axis]) < 1e-6))
  ];
near(wayAt(balled, [2, 1, 6]), [0, 0, 1], 'the top of a ball');
near(wayAt(balled, [2, 1, 0]), [0, 0, -1], 'the foot of a ball');
near(wayAt(balled, [4, 1, 3]), [1, 0, 0], 'the side of a ball');
const even = sound(shapeOf({ shape: 'ball', min: [0, 0, 0], max: [2, 2, 2] }), 'an even ball');
even.points.forEach((point, at) =>
  near(even.looks[at], minus(point, [1, 1, 1]), 'a ball looks away from its middle'),
);
// A ball that is stretched looks another way than an even one, between its top and its sides:
// at each point, the way from the middle to it - each part by the square of how far the ball
// reaches there. By hand, an eighth of the way round and a third of the way up from the middle,
// at [2 + 2 * 0.866025 * 0.707107, 1 + 0.866025 * 0.707107, 3 + 3 * 0.5] = [3.224745, 1.612372,
// 4.5]: 1.224745 by 4, 0.612372 by 1 and 1.5 by 9 are [0.306186, 0.612372, 0.166667], which is
// 0.704647 long - so [0.434524, 0.869048, 0.236525].
near(wayAt(balled, [3.224745, 1.612372, 4.5]), [0.434524, 0.869048, 0.236525], 'a ball, between');
const awayFrom = (middle, reach) => (point) => {
  const way = minus(point, middle).map((part, axis) => part / reach[axis] ** 2);
  return way.map((part) => part / Math.hypot(...way));
};
balled.points.forEach((point, at) =>
  near(balled.looks[at], awayFrom([2, 1, 3], [2, 1, 3])(point), 'the way a stretched ball looks'),
);

// A dome, by hand: the upper half of a ball, as high as its box and standing on the bottom of
// it. In a box from [10, 10, 100] to [14, 12, 101.5] it reaches 2 m and 1 m from the middle of
// its foot, [12, 11, 100 m], and 1.5 m up. Seven rings of 24 points, the highest one point, and
// under it a bottom of 24 points that looks down: a shell alone would let the sun through.
const dome = { shape: 'dome', min: [10, 10, 100], max: [14, 12, 101.5] };
const domed = sound(shapeOf(dome), 'a dome');
assert.equal(domed.points.length, (ROUND / 4 + 1) * ROUND + ROUND);
near(reachOf(domed.points).flat(), [10, 10, 100, 14, 12, 101.5], 'a dome fills its box');
domed.points.forEach(([x, y, h], at) => {
  const shares = ((x - 12) / 2) ** 2 + (y - 11) ** 2 + ((h - 100) / 1.5) ** 2;
  near([shares], [1], 'a point of a dome');
  assert.ok(h >= 100, 'a dome reaches under its foot');
  // Its bottom looks down; its shell looks as the ball does that it is the upper half of.
  if (domed.looks[at][2] < 0) assert.deepEqual([h, domed.looks[at]], [100, [0, 0, -1]]);
  else near(domed.looks[at], awayFrom([12, 11, 100], [2, 1, 1.5])([x, y, h]), 'a dome looks');
});
near(wayAt(domed, [12, 11, 101.5]), [0, 0, 1], 'the top of a dome');
assert.equal(domed.looks.filter((way) => way[2] === -1).length, ROUND);
// Half of what the whole ball would hold, and a little less: two thirds of pi, times
// 2 * 1 * 1.5, are 6.28 cubic metres.
assert.ok(domed.holds > 0.96 * 6.28 && domed.holds < 6.28, String(domed.holds));

// A wedge, by hand: a slice of a ring about [5, 5], from the plot's x a quarter round towards
// its y - 0 to 90 degrees - from 1 m to 2 m off, and 0.2 m high from 10 m up: a tread. Its
// corners lie at [6, 5] and [7, 5], and at [5, 6] and [5, 7]. A quarter is six pieces of a
// 24th: seven points along either bend. Seen from above it covers half of 2 * 2 - 1 * 1, times
// six times the sine of 15 degrees: 1.5 * 6 * 0.258819 = 2.329371 square metres, and so it
// holds 0.465874 cubic metres.
const tread = { shape: 'wedge', about: [5, 5], from: 0, to: 90, inner: 1, outer: 2 };
const wedge = { ...tread, min: [5, 5, 10], max: [7, 7, 10.2] };
const wedged = sound(shapeOf(wedge), 'a wedge');
assert.equal(wedged.points.length, 4 * 2 * 7 + 2 * 4);
near([wedged.holds], [0.465874], 'what a wedge holds');
near(reachOf(wedged.points).flat(), [5, 5, 10, 7, 7, 10.2], 'a wedge lies where it winds');
for (const [x, y, h] of wedged.points) {
  const far = Math.hypot(x - 5, y - 5);
  assert.ok(Math.abs(far - 1) < 1e-9 || Math.abs(far - 2) < 1e-9, `a point ${far} m off`);
  assert.ok(x >= 5 - 1e-9 && y >= 5 - 1e-9 && (h === 10 || h === 10.2));
}
// Its faces: the two bends look away from the middle and towards it; the end it begins at
// looks back against the turn - against y - and the end it stops at on along it, against x.
const waysAt = ({ points, looks }, place) =>
  looks
    .filter((way, at) => points[at].every((value, axis) => Math.abs(value - place[axis]) < 1e-6))
    .map((way) => way.map((value) => Math.round(value * 1e6) / 1e6 + 0));
assert.deepEqual(waysAt(wedged, [7, 5, 10.2]), [
  [1, 0, 0],
  [0, 0, 1],
  [0, -1, 0],
]);
assert.deepEqual(waysAt(wedged, [6, 5, 10]), [
  [-1, 0, 0],
  [0, 0, -1],
  [0, -1, 0],
]);
assert.deepEqual(waysAt(wedged, [5, 7, 10.2]), [
  [0, 1, 0],
  [0, 0, 1],
  [-1, 0, 0],
]);
// Said the other way round, it is the same slice; and a slice of 20 degrees is two pieces, for
// one would be more than a 24th of a turn.
const back = sound(shapeOf({ ...wedge, from: 90, to: 0 }), 'a wedge, said backwards');
near([back.holds, ...reachOf(back.points).flat()], [0.465874, 5, 5, 10, 7, 7, 10.2], 'the same');
const slim = { ...wedge, from: 30, to: 50 };
assert.equal(sound(shapeOf(slim), 'a slim wedge').points.length, 4 * 2 * 3 + 2 * 4);
// From the middle itself it is a slice of a round plate, and closed too: a quarter of one of
// 2 m is half of 2 * 2 times 1.552914, and 0.2 m high: 0.621166 cubic metres.
near([sound(shapeOf({ ...wedge, inner: 0 }), 'a slice').holds], [0.621166], 'a slice of a plate');

// A slant, by hand: a roof slab over the rectangle from [0, 1] to [4, 3], 4 m along the plot
// and 2 m across it. Its top falls down the plot from 13 m to 10 m and its bottom from 12 m to
// 10 m: a metre thick at its high end, and down to an edge at x = 4. Eight corners and six
// faces of four points, as a box has them: 24 points and 12 triangles. The face at the edge
// has no size - its points, and all others at x = 4, lie in two places. It holds
// 4 * 2 * (1 + 0) / 2 = 4 cubic metres.
const slant = (min, max, along, low, high) => ({ shape: 'slant', min, max, along, low, high });
const slab = slant([0, 1, 10], [4, 3, 13], 0, [12, 10], [13, 10]);
const slabbed = sound(shapeOf(slab), 'a slant');
assert.deepEqual([slabbed.points.length, shapeOf(slab).indices.length], [24, 12 * 3]);
near([slabbed.holds], [4], 'what a slant holds');
assert.deepEqual(reachOf(slabbed.points), [slab.min, slab.max]);
const edge = slabbed.points.filter(([x]) => x === 4);
assert.deepEqual([edge.length, new Set(edge.map(String)).size], [12, 2]);
// Its top looks square off its own plane, which falls 3 m in 4 m - [3, 0, 4] by its length, 5 -
// and its bottom square off its own, which falls 2 m in 4 m: [-2, 0, -4] by 4.472136. Its high
// end looks back up the plot, and its sides across it.
const looksAt = (shape, place) => waysAt(shape, place).map(String);
assert.deepEqual(looksAt(slabbed, [0, 1, 13]), ['0.6,0,0.8', '-1,0,0', '0,-1,0']);
assert.deepEqual(looksAt(slabbed, [0, 3, 12]), ['-0.447214,0,-0.894427', '-1,0,0', '0,1,0']);
// A wall under a sloping head, across the plot: over 4 m by 2 m its top rises along y from
// 11 m to 13 m, over a level foot at 10 m - 1 m high and 3 m, 2 m on the mean: 16 cubic
// metres. It is the mirror image of one along the plot, and as closed. Its top looks against y
// and up, [0, -1, 1] by 1.414214; its high end looks along y, and its side up the plot.
const wall = slant([1, 2, 10], [5, 4, 13], 1, [10, 10], [11, 13]);
const walled = sound(shapeOf(wall), 'a slant across the plot');
near([walled.holds], [16], 'what a slant across the plot holds');
assert.deepEqual(reachOf(walled.points), [wall.min, wall.max]);
assert.deepEqual(looksAt(walled, [1, 4, 13]), ['0,-0.707107,0.707107', '0,1,0', '-1,0,0']);
// Whichever way it slopes, and where both its planes slope and never meet - a beam a metre
// thick that follows a slope - it is closed, looks outward, and holds its floor of 8 square
// metres by its mean height.
for (const [along, low, high, held] of [
  [0, [10, 10], [13, 11], 16],
  [1, [10, 10], [13, 11], 16],
  [0, [10, 12], [11, 13], 8],
  [1, [12, 10], [13, 11], 8],
]) {
  const one = slant([1, 2, 10], [5, 4, 13], along, low, high);
  near([sound(shapeOf(one), `a slant along ${along}`).holds], [held], 'what a slant holds');
}

process.stdout.write(
  'tools/sketch/view3d: a box, a cylinder, a ball, a dome, a wedge and a slant lie where their parts put them, closed, and look outward\n',
);
