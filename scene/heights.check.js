// The check of a ground that is said as heights (story ST-027): a made-up plot that hands the
// scene its ground as a grid, in metres, with no `rowsCm` at all - a plane, but for one grid
// point a metre higher - against what a person worked out by hand. The scene's ground is that
// very grid, and nothing is written into it; the outline lies on it, the box round it all ends
// at it, the hill's top has it, and a rule made up here gets it as `groundAt`, at a grid point
// and between four. The same plot said as text, with `rowsCm` and no `heights`, gives the same
// scene; and said both ways at once, as the 3D view hands a plot whose ground a sketch has
// shaped, `heights` is the ground. No script of the pad, no browser, nothing of the site. Run
// by tools/sketch/check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { groundMesh } from './ground.js';
import { sceneOf } from './scene.js';

// A made-up plot of 4 m by 2.5 m, in cells of half a metre, as scene.check.js makes one: 8
// columns from x = -1 on, 5 rows of the top view from y = 2 down, and standing papers of 24 rows
// from 112 m down. A column is x = column / 2 - 1, and a row of the top view y = 2 - row / 2.
// The outline is a triangle, each corner in the middle of a cell: the cells of column 1 in row
// 0, of column 3 in row 2 and of column 1 in row 2.
const plot = {
  cellM: 0.5,
  xFromM: -1,
  xToM: 3,
  yFromM: -0.5,
  yToM: 2,
  sideM: [100, 112],
  outline: [
    [-0.25, 1.75],
    [0.75, 0.75],
    [-0.25, 0.75],
  ],
};
// Its ground, as a grid: a height in metres above sea level at each of its 9 by 6 grid points,
// a row of the top view's paper after another, the top one first. A plane, 108 m in the top
// left corner of the paper, a quarter of a metre lower with every column down the plot and
// with every row across it: 108 - (column + row) / 4 at a column and a row. But for one grid
// point, column 2 of row 1: on the plane it would lie at 107.25 m, and it lies a metre higher,
// at 108.25 m - the highest point of the plot.
const GRID = [
  [108, 107.75, 107.5, 107.25, 107, 106.75, 106.5, 106.25, 106],
  [107.75, 107.5, 108.25, 107, 106.75, 106.5, 106.25, 106, 105.75],
  [107.5, 107.25, 107, 106.75, 106.5, 106.25, 106, 105.75, 105.5],
  [107.25, 107, 106.75, 106.5, 106.25, 106, 105.75, 105.5, 105.25],
  [107, 106.75, 106.5, 106.25, 106, 105.75, 105.5, 105.25, 105],
  [106.75, 106.5, 106.25, 106, 105.75, 105.5, 105.25, 105, 104.75],
];
// The grid is another's - on the 3D page the paper's own, by which the slices are drawn: the
// scene writes nothing into it. Here it cannot: whoever tries is refused, and the check fails.
for (const held of [...GRID, GRID]) Object.freeze(held);

// One made-up block, so that a rule is asked: a shed of 1 m by 1 m and 2 m high, on a floor at
// 112 - 14 / 2 = 105 m. And figures, without which a scene has no parts and asks no rule.
const grey = { name: 'grey', hex: '#8795a1' };
const things = [{ x: [5, 7], y: [2, 4], z: [10, 14], colour: grey, name: 'Shed' }];
const figures = {
  outerWallM: 0.375,
  innerWallM: 0.25,
  floorSlabM: 0.25,
  roofSlabM: 0.25,
  railingHighM: 1,
  doorHighM: 2,
  windowHighM: 1.5,
  sillHighM: 1,
};
// A rule made up here: it builds nothing, and asks the ground at four places of the top view's
// paper, each a column and a row, as a rule of the house asks it (house.js).
const PLACES = [
  // The raised grid point itself.
  [2, 1],
  // The middle of the cell below it and to its right on the paper: the mean of that cell's four
  // grid points, (108.25 + 107 + 107 + 106.75) / 4 - a quarter of the metre over the plane.
  [2.5, 1.5],
  // In that cell, a quarter of a cell to the right of the point and half a cell below it: the
  // plane lies at 108 - 3.75 / 4 = 107.0625 m there, and of the metre 3 / 4 * 1 / 2 are left.
  [2.25, 1.5],
  // And a grid point of the plane, far from it: 108 - (6 + 4) / 4.
  [6, 4],
];
const BY_HAND = [108.25, 107.25, 107.4375, 105.5];
const told = [];
const asks = (context) => {
  told.push(PLACES.map(([column, row]) => context.groundAt(column, row)));
  return [];
};
/** The scene of the plot on a ground, as a site says one: of the shed, with that rule alone. */
const sceneOn = (ground) => sceneOf({ ...plot, ground }, things, figures, { blocks: [asks] });

// The ground said as heights, and as nothing else: the site has no `rowsCm` to read, and no
// `baseM`. The scene's ground is that very grid - no copy of it - and each line of it lies
// where the frame puts it.
const scene = sceneOn({ heights: GRID });
assert.equal(scene.ground.heights, GRID);
assert.deepEqual(scene.ground.xs, [-1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3]);
assert.deepEqual(scene.ground.ys, [2, 1.5, 1, 0.5, 0, -0.5]);
// The rule was asked once, for the one box, and got that ground at every place.
assert.deepEqual(told, [BY_HAND]);

// The outline lies on it: a point where each edge starts and wherever it crosses a line of the
// grid, as high as the grid says between the four grid points round it.
assert.deepEqual(scene.outline, [
  // From the middle of the cell above the raised point and to its left on the paper - the mean
  // of its four grid points, (107.75 + 107.5 + 107.5 + 108.25) / 4, a quarter of the metre over
  // the plane - through the raised point itself, and on through a grid point of the plane.
  [-0.25, 1.75, 107.75],
  [0, 1.5, 108.25],
  [0.5, 1, 106.75],
  // Up the plot along the middle of row 2, all on the plane: from the middle of a cell, across
  // two lines of the grid, each halfway between two grid points.
  [0.75, 0.75, 106.5],
  [0.5, 0.75, 106.625],
  [0, 0.75, 106.875],
  // And back up the paper along the middle of column 1: on the plane, until it crosses the line
  // of row 1 halfway between a grid point of the plane, 107.5 m, and the raised one - half of
  // the metre over the plane.
  [-0.25, 0.75, 107],
  [-0.25, 1, 107.125],
  [-0.25, 1.5, 107.875],
]);
// The box round it all ends at the raised point: no other ground lies as high, and the shed's
// roof lies at 107 m. The lowest is the paper's far corner, 108 - (8 + 5) / 4.
assert.deepEqual(scene.box, { min: [-1, -0.5, 104.75], max: [3, 2, 108.25] });
// The hill's top has it: the mesh holds every grid point, three figures a point, a row of nine
// after another - the raised one is the third of the second row.
assert.deepEqual(groundMesh(scene.ground).positions.slice(33, 36), [0, 1.5, 108.25]);
// All else is as of any site: the shed on its floor, and ground drawn in every cell but its four.
assert.deepEqual([scene.solids.length, scene.levels, scene.parts], [1, [105], []]);
assert.deepEqual(
  scene.ground.drawn.map((row) => row.map((there) => (there ? '#' : '.')).join('')),
  ['########', '########', '#####..#', '#####..#', '########'],
);

// The same ground said as text, as a site says it: centimetres over 100 m, a row a line, the
// raised point 825 where the plane has 725. With `rowsCm` and no `heights` the scene is the
// scene it was, number for number - and its grid is its own, read off the text.
const ROWS_CM = [
  '800 775 750 725 700 675 650 625 600',
  '775 750 825 700 675 650 625 600 575',
  '750 725 700 675 650 625 600 575 550',
  '725 700 675 650 625 600 575 550 525',
  '700 675 650 625 600 575 550 525 500',
  '675 650 625 600 575 550 525 500 475',
];
const asText = sceneOn({ baseM: 100, rowsCm: ROWS_CM });
assert.deepEqual(asText, scene);
assert.notEqual(asText.ground.heights, GRID);

// The plane alone, as text: without the raised point the outline lies a quarter of a metre, a
// metre and half a metre lower at the three points it lifts, and where it lay at the six others.
const PLANE_CM = ROWS_CM.with(1, '775 750 725 700 675 650 625 600 575');
const plane = sceneOn({ baseM: 100, rowsCm: PLANE_CM });
const lower = { 0: 0.25, 1: 1, 8: 0.5 };
assert.deepEqual(
  plane.outline,
  scene.outline.map(([x, y, h], at) => [x, y, h - (lower[at] ?? 0)]),
);
// Said both ways at once - the plot as the 3D view hands it once a sketch has shaped its
// ground, the site's own `rowsCm` beside the grid (view3d/read.js) - `heights` is the ground,
// that very grid again, and the text beside it is not read: here it says the plane.
const shaped = sceneOn({ baseM: 100, rowsCm: PLANE_CM, heights: GRID });
assert.equal(shaped.ground.heights, GRID);
assert.deepEqual(shaped, scene);
// And the rule was asked each time, of the ground of its scene: on the plane alone, the plane.
assert.deepEqual(told, [BY_HAND, BY_HAND, [107.25, 107, 107.0625, 105.5], BY_HAND]);

process.stdout.write(
  'tools/sketch/scene: a ground that is said as heights is the ground of the scene, the very grid, with the outline on it and a rule asking it, and said as text it is the same scene\n',
);
