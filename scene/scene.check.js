// The scene's check: a made-up plot and five made-up things on it, against the scene a person
// worked out by hand - every box in metres where the pad's frame puts it, the levels, the ground
// and where it is drawn, the outline on the ground, the box around it all - and the rule on what
// a module of the scene imports. No browser, nothing of the site. Run by tools/sketch/check.js.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { shown } from './cut.js';
import { groundMesh } from './ground.js';
import { sceneOf } from './scene.js';
import { stations } from './stations.js';

// A made-up plot of 4 m by 2.5 m, in cells of half a metre: 8 columns from x = -1 on, 5 rows of
// the top view from y = 2 down, and standing papers of 24 rows from 112 m down. Its ground lies
// at 108 m in the top left corner of the paper, and falls 75 cm a column down the plot and 25 cm
// a row across it - but for one grid point, column 5 of row 1, that lies a metre lower: the four
// cells around it are no planes. The outline is a triangle, each corner in the middle of a cell.
const site = {
  cellM: 0.5,
  xFromM: -1,
  xToM: 3,
  yFromM: -0.5,
  yToM: 2,
  sideM: [100, 112],
  outline: [
    [0.25, 1.75],
    [1.25, 1.75],
    [-0.75, -0.25],
  ],
  ground: {
    baseM: 100,
    rowsCm: [
      '800 725 650 575 500 425 350 275 200',
      '775 700 625 550 475 300 325 250 175',
      '750 675 600 525 450 375 300 225 150',
      '725 650 575 500 425 350 275 200 125',
      '700 625 550 475 400 325 250 175 100',
      '675 600 525 450 375 300 225 150 75',
    ],
  },
};

// Five made-up things, as the pad places them: each a box in cells. A garage of two boxes, one
// block, on a floor at 107 m. A court painted green, dug in to 102 m. A tree on the ground, which
// lies at 102.25 m under its middle: in row 19.5 of a standing paper. And a window over the
// garage, of a storey nobody drew: it stands on the garage's roof, its sill a metre above it.
const grey = { name: 'grey', hex: '#8795a1' };
const green = { name: 'green', hex: '#5a9e4b' };
const things = [
  { x: [1, 3], y: [1, 3], z: [6, 10], colour: grey, name: 'Garage', group: 3 },
  { x: [3, 4], y: [1, 2], z: [8, 10], colour: grey, group: 3 },
  { x: [5, 7], y: [2, 4], z: [16, 20], colour: green, name: 'Court' },
  { x: [7, 8], y: [0, 1], z: [15.5, 19.5], kind: 'tree', turn: 0, fill: '#5a9e4b', floor: 19.5 },
  {
    x: [1.25, 2.75],
    y: [2.875, 3.125],
    z: [2.5, 4],
    kind: 'window',
    turn: 1,
    fill: '#9fc5e8',
    floor: 6,
  },
];
const scene = sceneOf(site, things);

// A box of cells comes out in metres where the pad's frame puts it. The garage's first box, by
// hand: columns 1 to 3 are x = -1 + 1 * 0.5 to -1 + 3 * 0.5; rows 1 to 3 of the top view are
// y = 2 - 1 * 0.5 down to 2 - 3 * 0.5; rows 6 to 10 of a standing view are h = 112 - 6 * 0.5 down
// to 112 - 10 * 0.5. A block stands on the bottom of its box, an object on its floor: the window
// on the roof at 112 - 6 * 0.5 = 109 m, a metre under its sill. A block is its group, or a number
// of its own: the first that neither group 3 nor a thing before it has. Only the block that is
// painted green is see-through: the tree is just as green, and solid.
const [garage, wing, court, oak, pane] = scene.solids;
assert.deepEqual(garage, {
  min: [-0.5, 0.5, 107],
  max: [0.5, 1.5, 109],
  colour: '#8795a1',
  name: 'Garage',
  block: 3,
  floor: 107,
  see: 'solid',
});
assert.deepEqual(wing, {
  min: [0.5, 1, 107],
  max: [1, 1.5, 108],
  colour: '#8795a1',
  block: 3,
  floor: 107,
  see: 'solid',
});
assert.deepEqual(court, {
  min: [1.5, 0, 102],
  max: [2.5, 1, 104],
  colour: '#5a9e4b',
  name: 'Court',
  block: 1,
  floor: 102,
  see: 'through',
});
assert.deepEqual(oak, {
  min: [2.5, 1.5, 102.25],
  max: [3, 2, 104.25],
  colour: '#5a9e4b',
  kind: 'tree',
  turn: 0,
  block: 2,
  floor: 102.25,
  see: 'solid',
});
assert.deepEqual(pane, {
  min: [-0.375, 0.4375, 110],
  max: [0.375, 0.5625, 110.75],
  colour: '#9fc5e8',
  kind: 'window',
  turn: 1,
  block: 4,
  floor: 109,
  see: 'solid',
});
assert.equal(scene.solids.length, 5);

// Nothing is mirrored. In the top view the garage lies to the left of the court: at the smaller
// x. The tree lies higher up the top view's paper than the court: at the larger y. And the
// garage lies higher up a standing paper than the court: at the larger h.
assert.ok(garage.max[0] < court.min[0]);
assert.ok(oak.min[1] > court.max[1]);
assert.ok(garage.min[2] > court.max[2]);

// The cell is the site's: on a plot of cells a metre large, the same box is twice as large.
const [large] = sceneOf({ ...site, cellM: 1 }, things.slice(0, 1)).solids;
assert.deepEqual(
  [large.min, large.max],
  [
    [0, -1, 102],
    [2, 1, 106],
  ],
);

// The levels are the floors of blocks alone, from the top down, each once: two boxes stand at
// 107 m, and neither the tree's ground nor the roof under the window is a level.
assert.deepEqual(scene.levels, [107, 102]);

// From the top down however the blocks are listed, and by their rows as figures. Four blocks,
// listed neither from the top down nor from the bottom up: a pit on row 20, a loft on row 8, a
// shed on row 10 and a hut on row 8 again, apart from the loft. Read as text, row 10 comes
// before row 20, and row 20 before row 8. By hand: 112 - 8 * 0.5, 112 - 10 * 0.5 and
// 112 - 20 * 0.5 m - and the floor that the loft and the hut share is one level, not two.
const unordered = [
  { x: [5, 7], y: [2, 4], z: [16, 20], colour: green, name: 'Pit' },
  { x: [0, 2], y: [0, 2], z: [4, 8], colour: grey, name: 'Loft' },
  { x: [2, 4], y: [0, 2], z: [6, 10], colour: grey, name: 'Shed' },
  { x: [6, 8], y: [0, 2], z: [6, 8], colour: grey, name: 'Hut' },
];
assert.deepEqual(sceneOf(site, unordered).levels, [108, 107, 102]);

// The ground: a height at every grid point, in metres, as the site has them - a row of the top
// view's paper after another, each where the frame puts it.
assert.deepEqual(scene.ground.xs, [-1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3]);
assert.deepEqual(scene.ground.ys, [2, 1.5, 1, 0.5, 0, -0.5]);
assert.deepEqual(scene.ground.heights, [
  [108, 107.25, 106.5, 105.75, 105, 104.25, 103.5, 102.75, 102],
  [107.75, 107, 106.25, 105.5, 104.75, 103, 103.25, 102.5, 101.75],
  [107.5, 106.75, 106, 105.25, 104.5, 103.75, 103, 102.25, 101.5],
  [107.25, 106.5, 105.75, 105, 104.25, 103.5, 102.75, 102, 101.25],
  [107, 106.25, 105.5, 104.75, 104, 103.25, 102.5, 101.75, 101],
  [106.75, 106, 105.25, 104.5, 103.75, 103, 102.25, 101.5, 100.75],
]);

// No ground is drawn in a cell under a block - the garage's two boxes, which stand clear of the
// slope, and the court, which is dug into it - and it is drawn in every other: under the tree
// and under the window too.
const drawn = (ground) =>
  ground.drawn.map((row) => row.map((there) => (there ? '#' : '.')).join(''));
assert.deepEqual(drawn(scene.ground), ['########', '#...####', '#..##..#', '#####..#', '########']);

// The outline lies on the ground: a point where each edge starts and wherever it crosses a line
// of the grid, as high as the ground is there, between the four grid points around it.
assert.deepEqual(scene.outline, [
  // Along the middle of row 0. The corner lies in the middle of a cell, at the mean of its four
  // grid points: (106.5 + 105.75 + 106.25 + 105.5) / 4. On a line of the grid, a point lies
  // between two of them: (105.75 + 105.5) / 2.
  [0.25, 1.75, 106],
  [0.5, 1.75, 105.625],
  [1, 1.75, 104.875],
  // From the middle of the cell that is no plane, (105 + 104.25 + 104.75 + 103) / 4 - neither
  // diagonal of it is as high there - through four grid points: one point each, not two.
  [1.25, 1.75, 104.25],
  [1, 1.5, 104.75],
  [0.5, 1, 105.25],
  [0, 0.5, 105.75],
  [-0.5, 0, 106.25],
  // Back up, across rows and columns in turn: (107 + 106.25 + 106.75 + 106) / 4, then on row 4
  // three quarters of the way from 107 to 106.25, on column 1 halfway from 106.5 to 106.25.
  [-0.75, -0.25, 106.5],
  [-0.625, 0, 106.4375],
  [-0.5, 0.25, 106.375],
  [-0.375, 0.5, 106.3125],
  [-0.125, 1, 106.1875],
  [0, 1.25, 106.125],
  [0.125, 1.5, 106.0625],
]);

// At least one point for every cell along each edge: an edge is walked in a thousand steps, and
// wherever it is, a point of the outline lies in that cell or on its border.
const cellOf = ([x, y]) => [(x - site.xFromM) / site.cellM, (site.yToM - y) / site.cellM];
const points = scene.outline.map(cellOf);
site.outline.forEach((from, index) => {
  const to = site.outline[(index + 1) % site.outline.length];
  for (let step = 0; step <= 1000; step += 1) {
    const at = [0, 1].map((axis) => from[axis] + (step / 1000) * (to[axis] - from[axis]));
    const [column, row] = cellOf(at).map(Math.floor);
    const inside = ([c, r]) => c >= column && c <= column + 1 && r >= row && r <= row + 1;
    assert.ok(points.some(inside), `no point of the outline in cell ${column}, ${row}`);
  }
});

// An outline whose corners are grid points, so that its edges run along lines of the grid, and
// that reaches off the paper all round: 16 cells by 8. It has a point at every grid point it runs
// through, each once - a corner is no two points. Off the paper, a point is as high as the
// ground is at the paper's edge, nearest to it. And the box holds the outline too.
const corners = [
  [-3, 2.5],
  [5, 2.5],
  [5, -1.5],
  [-3, -1.5],
];
const round = sceneOf({ ...site, outline: corners }, []);
assert.equal(round.outline.length, 2 * (16 + 8));
assert.equal(new Set(round.outline.map(String)).size, round.outline.length);
const onPaper = (value, most) => Math.min(Math.max(value, 0), most);
for (const [x, y, h] of round.outline) {
  const [column, row] = cellOf([x, y]);
  assert.equal(h, round.ground.heights[onPaper(row, 5)][onPaper(column, 8)], `at ${x}, ${y}`);
}
assert.deepEqual(round.box, { min: [-3, -1.5, 100.75], max: [5, 2.5, 108] });

// The box holds all of it: the ground reaches furthest along the plot, across it and down, and
// the window furthest up.
assert.deepEqual(scene.box, { min: [-1, -0.5, 100.75], max: [3, 2, 110.75] });

// Nothing drawn yet: the ground and the outline alone, with ground in every cell.
const empty = sceneOf(site, []);
assert.deepEqual([empty.solids, empty.levels], [[], []]);
assert.deepEqual(drawn(empty.ground), Array(5).fill('########'));
assert.deepEqual(empty.outline, scene.outline);
assert.deepEqual(empty.box, { min: [-1, -0.5, 100.75], max: [3, 2, 108] });

// The scene is what the other three take. Its ground makes a mesh of two triangles for each of
// the 31 cells where ground is drawn. Its own levels cut it: at 107 m all but the window on the
// roof show, at 102 m the court alone. And its front station stands downhill of its box, higher
// than its lowest floor.
assert.equal(groundMesh(scene.ground).indices.length, 31 * 2 * 3);
assert.deepEqual(shown(scene, 107), [garage, wing, court, oak]);
assert.deepEqual(shown(scene, 102), [court]);
const { eye } = stations(scene).front;
assert.ok(eye[0] > scene.box.max[0] && eye[2] > Math.min(...scene.levels));

// A module of the scene imports its neighbours, and nothing else - `./<name>.js`, a module of
// this folder - and names no global: all else comes as arguments. The linter knows no global
// here but the language's own, and this refuses the one name it lets by. `alien` gives what a
// text names that it may not, or nothing. It reads the words too: none has `from` before a quote.
const modules = readdirSync(import.meta.dirname).filter((name) => /(?<!\.check)\.js$/.test(name));
const alien = (text, neighbours) =>
  /\bglobalThis\b|\bimport\s*\(/.exec(text)?.[0] ??
  [...text.matchAll(/(?:\bfrom|^\s*import)\s*(['"])(.*?)\1/gm)]
    .map((found) => found[2])
    .find((name) => !name.startsWith('./') || !neighbours.includes(name.slice(2)));
assert.ok(
  ['cut.js', 'ground.js', 'scene.js', 'stations.js'].every((name) => modules.includes(name)),
);
const textOf = (name) => readFileSync(`${import.meta.dirname}/${name}`, 'utf8');
for (const name of modules) assert.equal(alien(textOf(name), modules), undefined, name);
// The rule on made-up lines, beside two made-up neighbours. A neighbour is let by, however the
// line is written. Refused: the pad, the 3D view, three.js - its name is put into the line here,
// for view3d/rules.check.js reads this file and lets nobody else import it - Node, a named global,
// an import as it runs, a neighbour that is not there, a check, a folder deeper, what is handed on.
const beside = ['space.js', 'slabs.js'];
for (const [line, named] of [
  ["import { spaceOf } from './space.js';", undefined],
  ['import { slabs } from "./slabs.js";\nexport { pieces } from \'./space.js\';', undefined],
  ["import './space.js';\nimport {\n  floorUnder,\n  slabs,\n} from './slabs.js';", undefined],
  ["import { minus } from '../blocks.js';", '../blocks.js'],
  ["import '../sketch.js';", '../sketch.js'],
  ["import { read } from '../view3d/read.js';", '../view3d/read.js'],
  [`import { Mesh } from '${'three'}';`, 'three'],
  ["import { readFileSync } from 'node:fs';", 'node:fs'],
  ['const { SITE } = globalThis;', 'globalThis'],
  ["const space = await import('./space.js');", 'import('],
  ["import { walls } from './walls.js';", './walls.js'],
  ["import { sceneOf } from './scene.check.js';", './scene.check.js'],
  ["import { pieces } from './deeper/space.js';", './deeper/space.js'],
  ["export {\n  COLOURS,\n} from '../paper.js';", '../paper.js'],
]) {
  assert.equal(alien(line, beside), named, line);
}

process.stdout.write(
  'tools/sketch/scene: five made-up things come out in metres, where the pad has them, and a module imports its neighbours alone\n',
);
