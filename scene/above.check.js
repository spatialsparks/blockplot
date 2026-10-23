// The check of what stands above the ground (story ST-016): a ground made up by hand and solids
// made up as the scene makes them, each case with its figures worked out beside it. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { aboveGround } from './above.js';

// A ground of grid points a metre apart: five columns at x 0 to 4, four rows at y 3 down to 0, a
// row of the paper after another from the top one. It falls a metre a column along x, and runs
// level across: 110 m at x 0, 109 at x 1, 108 at x 2, 107 at x 3, 106 at x 4.
const xs = [0, 1, 2, 3, 4];
const ys = [3, 2, 1, 0];
const ground = { xs, ys, heights: ys.map(() => xs.map((x) => 110 - x)), drawn: [] };

// A solid as the scene makes one (`solidsOf`, scene.js): a block has no `kind`, an object has.
const block = (name, [x0, x1], [y0, y1], [bottom, top], slope) => ({
  min: [x0, y0, bottom],
  max: [x1, y1, top],
  ...(slope === undefined ? {} : { top: { along: 0, high: slope } }),
  colour: '#888888',
  name,
  block: 1,
  floor: bottom,
  see: 'solid',
});
const object = (name, kind, [bottom, top]) => ({
  ...block(name, [1, 3], [2, 3], [bottom, top]),
  kind,
  turn: 0,
});

/** Whether a scene of this one solid on that ground keeps it, and how many it leaves out. */
const one = (solid) => aboveGround({ solids: [solid], ground });

// The cellars all lie on x 1 to 3 and y 2 to 3: on their footprint, edges and all, the grid
// points of x 1, 2 and 3 in the rows of y 3 and y 2 - 109, 108 and 107 m. The lowest is 107 m,
// at the downhill edge, x 3. Asked without its edges, along y no grid point would lie on it.
const deep = block('deep cellar', [1, 3], [2, 3], [103, 106.5]); // 106.5 is 0.5 m under 107
const flush = block('flush cellar', [1, 3], [2, 3], [104, 107]); // 107 is exactly at 107
const peeping = block('peeping', [1, 3], [2, 3], [104, 107.01]); // 107.01 is over 107, at x 3

assert.deepEqual(one(deep), { boxes: [], under: 1 }, 'a cellar 0.5 m under the ground is kept');
assert.deepEqual(
  one(flush),
  { boxes: [], under: 1 },
  'a cellar whose top is at the ground is kept',
);
assert.deepEqual(
  one(peeping),
  { boxes: [peeping], under: 0 },
  'a box over one grid point of its downhill edge is left out: it stands partly out, and is kept whole',
);

// Tops that slope along x, on the same footprint, under the lowest ground point, 107 m. The box
// of each reaches 107.5 m, its outer size; its top is asked, at its higher end.
// - rising: 106 m at x 1, 107.5 at x 3 - its higher end is 0.5 m over 107: kept;
// - falling: 107.5 m at x 1, 106 at x 3 - the same, the other way round: kept;
// - sunk: 106.8 m at x 1, 106.2 at x 3 - both ends under 107, though its box reaches 107.5: left out.
const rising = block('rising', [1, 3], [2, 3], [104, 107.5], [106, 107.5]);
const falling = block('falling', [1, 3], [2, 3], [104, 107.5], [107.5, 106]);
const sunk = block('sunk', [1, 3], [2, 3], [104, 107.5], [106.8, 106.2]);
assert.deepEqual(
  one(rising),
  { boxes: [rising], under: 0 },
  'a top that rises over the ground at its second end is left out',
);
assert.deepEqual(
  one(falling),
  { boxes: [falling], under: 0 },
  'a top that rises over the ground at its first end is left out',
);
assert.deepEqual(
  one(sunk),
  { boxes: [], under: 1 },
  'a top under the ground at both ends is kept, for its box reaches over it',
);

// Off the paper: x 6 to 8 lies past the last column, x 4, and y 5 to 6 over the first row, y 3.
// No grid point lies on either, so nothing says they are under the ground, however low.
const beyond = block('beyond', [6, 8], [0, 1], [90, 91]);
const across = block('across', [1, 3], [5, 6], [90, 91]);
assert.deepEqual(
  one(beyond),
  { boxes: [beyond], under: 0 },
  'a box past the paper along x is left out',
);
assert.deepEqual(
  one(across),
  { boxes: [across], under: 0 },
  'a box past the paper across x is left out',
);

// Objects are in neither list, and not counted: one wholly under the ground, its top at 100 m,
// and one wholly over it, from 115 to 120 m - both on the cellars' footprint.
const buried = object('buried', 'sofa', [99, 100]);
const flying = object('flying', 'tree', [115, 120]);
assert.deepEqual(
  one(buried),
  { boxes: [], under: 0 },
  'an object under the ground is kept or counted',
);
assert.deepEqual(
  one(flying),
  { boxes: [], under: 0 },
  'an object over the ground is kept or counted',
);

// A scene of all of them, objects among the blocks: the kept boxes in the scene's order, each the
// scene's own object, and under 3 - the deep cellar, the flush one and the sunk top.
const solids = [buried, beyond, deep, rising, flying, flush, peeping, sunk, falling, across];
const all = aboveGround({ solids, ground });
const kept = [beyond, rising, peeping, falling, across];
assert.equal(all.under, 3, 'the cellars of a scene are miscounted, or an object is counted');
assert.deepEqual(
  all.boxes.map((box) => box.name),
  kept.map((box) => box.name),
  "the kept boxes are not the scene's, in its order",
);
assert.ok(
  all.boxes.every((box, at) => box === kept[at]),
  "a kept box is a copy of the scene's, and not its own object",
);

// A ground of near grids (ST-042): the grid above, and one far off - two columns at x 100 and
// 101, two rows at y 3 and 2, level at 50 m. A cellar on each is under its own grid - the deep
// one 0.5 m under 107, the far one at 49.5 m under 50 - and a block between them, on no grid
// point of either, is kept.
const far = {
  xs: [100, 101],
  ys: [3, 2],
  heights: [
    [50, 50],
    [50, 50],
  ],
  drawn: [[true]],
};
const near = { near: [ground, far], far: [], paper: { min: [0, 0], max: [4, 3] } };
const farCellar = block('far cellar', [100, 101], [2, 3], [45, 49.5]);
const between = block('between', [50, 51], [2, 3], [10, 11]);
const grids = aboveGround({ solids: [deep, farCellar, between], ground: near });
assert.deepEqual([grids.boxes, grids.under], [[between], 2], 'a near grid is not asked');

process.stdout.write(
  'tools/sketch/scene: of the solids, the boxes of the house stand above the ground, and the cellars are counted\n',
);
