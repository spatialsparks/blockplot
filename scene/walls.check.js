// The check of walls: a made-up house of twelve boxes on a made-up plot, against the walls a
// person worked out by hand - a room alone, dug into the hill; two rooms that touch over a part
// of a face; a room half under another block; open air and glass beside rooms; two boxes of one
// block side by side and one over the other; a box half a metre wide and one half a metre high
// - the question of a cell against the same walls, cell by cell; the same rule with thicker
// walls, and on a plot of no round figures; and two blocks drawn into each other. Doors and
// windows are openings.check.js's. Run by tools/sketch/check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { isDeepStrictEqual } from 'node:util';
import { amiss } from './holds.js';
import { sceneOf } from './scene.js';
import { floorUnder, roofOver } from './slabs.js';
import { wallOn, walls } from './walls.js';

// A made-up plot of 12 m by 5 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 8 - row / 2, and a level 116 - level / 2 metres above sea level. Its ground
// is flat, at 105 m: level 22.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 12,
  yFromM: 3,
  yToM: 8,
  sideM: [100, 116],
  outline: [
    [1, 7],
    [11, 7],
    [1, 4],
  ],
  ground: { baseM: 100, rowsCm: Array(11).fill(Array(25).fill('500').join(' ')) },
};
// Made-up figures, each a sum of halves of halves, so that every figure below is exact.
const figures = {
  outerWallM: 0.375,
  innerWallM: 0.25,
  floorSlabM: 0.375,
  roofSlabM: 0.3125,
  railingHighM: 1,
  doorHighM: 2,
  windowHighM: 1.5,
  sillHighM: 1,
};

// The house, in cells. All but the study and the two upper boxes stand on level 22, at 105 m.
const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, more) => ({ x, y, z, colour: grey, ...more });
const things = [
  // 0: a room alone, 3 m high, dug a metre into the hill: it stands on level 24, at 104 m.
  box([1, 5], [1, 4], [18, 24], { name: 'Study' }),
  // 1 and 2: a hall of 2 m and a kitchen of 3 m side by side. They share a metre of a face:
  // the hall lies a row further down the paper, and ends a metre under the kitchen's top.
  box([7, 10], [2, 5], [18, 22], { name: 'Hall' }),
  box([10, 14], [1, 4], [16, 22], { name: 'Kitchen' }),
  // 3: a loft over the kitchen's two columns down the plot, reaching two columns past it.
  box([12, 16], [1, 4], [10, 16], { name: 'Loft' }),
  // 4 and 5: glass against the kitchen's side down the plot, and open air against the hall's
  // side down the paper.
  box([14, 17], [1, 4], [18, 22], { name: 'Greenhouse', as: 'glass' }),
  box([7, 10], [5, 8], [20, 22], { name: 'Yard', as: 'open' }),
  // 6 and 7: two boxes of one block side by side, the second a row shorter.
  box([18, 21], [1, 4], [16, 22], { name: 'Workshop', group: 7 }),
  box([21, 23], [1, 3], [16, 22], { group: 7 }),
  // 8 and 9: two boxes of one block, one over the other.
  box([18, 20], [6, 9], [16, 22], { name: 'Tower', group: 9 }),
  box([18, 20], [6, 9], [10, 16], { group: 9 }),
  // 10 and 11: a room half a metre wide, and one half a metre high.
  box([21, 22], [6, 9], [16, 22], { name: 'Duct' }),
  box([14, 16], [6, 8], [21, 22], { name: 'Crawl space' }),
];

// The walls, by hand. An outer wall is 0.375 m thick and half an inner one 0.125 m, each on its
// face and inward of it. A floor slab is 0.375 m thick and a roof slab 0.3125 m: a wall stands
// between them. Each has the place of its thing, and the floor that thing stands on. They come
// face by face: up the plot, down the plot, up the paper, down the paper.
const WALL = { of: 'wall', shape: 'box', surface: 'plaster' };
const wall = (thing, floor, min, max) => ({ ...WALL, min, max, thing, floor });
const byHand = [
  // The study, 2 m by 1.5 m: four outer walls inside its edge, from its floor slab at 104.375 m
  // to its roof slab at 106.6875 m - against the earth and over it alike.
  wall(0, 104, [0.5, 6, 104.375], [0.875, 7.5, 106.6875]),
  wall(0, 104, [2.125, 6, 104.375], [2.5, 7.5, 106.6875]),
  wall(0, 104, [0.5, 7.125, 104.375], [2.5, 7.5, 106.6875]),
  wall(0, 104, [0.5, 6, 104.375], [2.5, 6.375, 106.6875]),
  // The hall. Down the plot it has half an inner wall over the metre it shares with the
  // kitchen, and an outer wall beside it. Toward the yard its wall is an outer one.
  wall(1, 105, [3.5, 5.5, 105.375], [3.875, 7, 106.6875]),
  wall(1, 105, [4.875, 6, 105.375], [5, 7, 106.6875]),
  wall(1, 105, [4.625, 5.5, 105.375], [5, 6, 106.6875]),
  wall(1, 105, [3.5, 6.625, 105.375], [5, 7, 106.6875]),
  wall(1, 105, [3.5, 5.5, 105.375], [5, 5.875, 106.6875]),
  // The kitchen. Up the plot: an outer wall over the hall's top, up to the roof slab; an outer
  // wall beside the hall; and its half of the inner wall, as high as the hall. Down the plot,
  // toward glass, an outer wall - under the loft, so it reaches the loft's floor at 108 m. Up
  // and down the paper a wall in two: under its own roof slab, and under the loft.
  wall(2, 105, [5, 6, 107], [5.375, 7.5, 107.6875]),
  wall(2, 105, [5, 7, 105.375], [5.375, 7.5, 107]),
  wall(2, 105, [5, 6, 105.375], [5.125, 7, 107]),
  wall(2, 105, [6.625, 6, 105.375], [7, 7.5, 108]),
  wall(2, 105, [5, 7.125, 105.375], [6, 7.5, 107.6875]),
  wall(2, 105, [6, 7.125, 105.375], [7, 7.5, 108]),
  wall(2, 105, [5, 6, 105.375], [6, 6.375, 107.6875]),
  wall(2, 105, [6, 6, 105.375], [7, 6.375, 108]),
  // The loft: on its own floor slab, over the kitchen and past it.
  wall(3, 108, [6, 6, 108.375], [6.375, 7.5, 110.6875]),
  wall(3, 108, [7.625, 6, 108.375], [8, 7.5, 110.6875]),
  wall(3, 108, [6, 7.125, 108.375], [8, 7.5, 110.6875]),
  wall(3, 108, [6, 6, 108.375], [8, 6.375, 110.6875]),
  // The workshop: no wall between its two boxes. The first has one down the plot only along
  // the row that the second leaves open, and the second has none up the plot.
  wall(6, 105, [9, 6, 105.375], [9.375, 7.5, 107.6875]),
  wall(6, 105, [10.125, 6, 105.375], [10.5, 6.5, 107.6875]),
  wall(6, 105, [9, 7.125, 105.375], [10.5, 7.5, 107.6875]),
  wall(6, 105, [9, 6, 105.375], [10.5, 6.375, 107.6875]),
  wall(7, 105, [11.125, 6.5, 105.375], [11.5, 7.5, 107.6875]),
  wall(7, 105, [10.5, 7.125, 105.375], [11.5, 7.5, 107.6875]),
  wall(7, 105, [10.5, 6.5, 105.375], [11.5, 6.875, 107.6875]),
  // The tower: the walls of the lower box run to its top, at 108 m, and those of the upper
  // begin there, with no floor between: they run through.
  wall(8, 105, [9, 3.5, 105.375], [9.375, 5, 108]),
  wall(8, 105, [9.625, 3.5, 105.375], [10, 5, 108]),
  wall(8, 105, [9, 4.625, 105.375], [10, 5, 108]),
  wall(8, 105, [9, 3.5, 105.375], [10, 3.875, 108]),
  wall(9, 108, [9, 3.5, 108], [9.375, 5, 110.6875]),
  wall(9, 108, [9.625, 3.5, 108], [10, 5, 110.6875]),
  wall(9, 108, [9, 4.625, 108], [10, 5, 110.6875]),
  wall(9, 108, [9, 3.5, 108], [10, 3.875, 110.6875]),
  // The duct, half a metre wide: its two long walls are half of that each, and meet.
  wall(10, 105, [10.5, 3.5, 105.375], [10.75, 5, 107.6875]),
  wall(10, 105, [10.75, 3.5, 105.375], [11, 5, 107.6875]),
  wall(10, 105, [10.5, 4.625, 105.375], [11, 5, 107.6875]),
  wall(10, 105, [10.5, 3.5, 105.375], [11, 3.875, 107.6875]),
];

// The rule alone gives these walls, and no other part: none of glass, none of open air, and
// none of the crawl space, whose two slabs meet and leave no room for a wall. The house's own
// rules give them too, among whatever they give.
const alone = sceneOf(site, things, figures, { blocks: [walls] });
assert.deepEqual(alone.parts, byHand);
const whole = sceneOf(site, things, figures);
for (const part of byHand) {
  const made = whole.parts.some((one) => isDeepStrictEqual(one, part));
  assert.ok(made, `the house lacks a wall of thing ${part.thing}`);
}
// The three things hold of this house, with the rule alone and with every rule there is: each
// wall within the box of its block, and none in a slab.
assert.deepEqual(amiss(alone), []);
assert.deepEqual(amiss(whole), []);

// What a rule gets, taken by a rule of the check's own: to ask the question of a cell.
const seen = [];
const probe = (context) => {
  seen.push(context);
  return [];
};
sceneOf(site, things, figures, { blocks: [probe] });
const [context] = seen;

// How thick a wall stands on a face of a cell? By hand, for a cell of each case.
for (const [cell, face, thick, why] of [
  [[1, 1, 23], 'x0', 0.375, 'the study, up the plot'],
  [[1, 1, 23], 'y0', 0.375, 'the same cell, up the paper'],
  [[1, 1, 23], 'x1', 0, 'the same cell, toward the cell beside it in the study'],
  [[0, 1, 23], 'x1', 0, 'the cell beside the study: no room holds it'],
  [[9, 2, 19], 'x1', 0.125, 'the hall toward the kitchen: half an inner wall'],
  [[10, 2, 19], 'x0', 0.125, 'the kitchen toward the hall: the other half'],
  [[10, 2, 16], 'x0', 0.375, 'the kitchen over the hall'],
  [[9, 4, 19], 'x1', 0.375, 'the hall beside the kitchen'],
  [[13, 1, 19], 'x1', 0.375, 'the kitchen toward the greenhouse: glass is no room'],
  [[14, 1, 19], 'x0', 0, 'the greenhouse: glass has no wall'],
  [[7, 4, 21], 'y1', 0.375, 'the hall toward the yard: open air is no room'],
  [[7, 5, 21], 'y0', 0, 'the yard: open air has no wall'],
  [[20, 1, 19], 'x1', 0, 'the workshop, toward its second box'],
  [[20, 3, 19], 'x1', 0.375, 'the workshop, beside its second box'],
  [[18, 6, 16], 'y0', 0.375, 'the tower, at the top of its lower box'],
  [[21, 6, 19], 'x0', 0.25, 'the duct: half of what it is wide'],
  [[21, 6, 19], 'y0', 0.375, 'the duct, at its end'],
]) {
  assert.equal(wallOn(context, cell, face), thick, why);
}

// And cell by cell, the question says what the walls are: for every cell of the paper from
// level 8 down to level 25 and each of its four faces, the wall it tells of is as thick as the
// wall that stands on that face of the cell, along all of it - and none where none stands. It
// says how thick, not how high: of a cell that its slabs fill, as the crawl space's, it tells
// of a wall that has no height.
const standsOn = ([column, row, level], face) => {
  const least = [column / 2, 8 - (row + 1) / 2, 116 - (level + 1) / 2];
  const most = [column / 2 + 0.5, 8 - row / 2, 116 - level / 2];
  const [axis, run] = face[0] === 'x' ? [0, 1] : [1, 0];
  const side = face === 'x0' || face === 'y1' ? 'min' : 'max';
  const plane = (side === 'min' ? least : most)[axis];
  const found = alone.parts.find(
    (part) =>
      part[side][axis] === plane &&
      part.min[run] <= least[run] &&
      most[run] <= part.max[run] &&
      part.min[2] < most[2] &&
      least[2] < part.max[2],
  );
  return found ? found.max[axis] - found.min[axis] : 0;
};
let asked = 0;
for (let column = 0; column < 24; column += 1) {
  for (let row = 0; row < 10; row += 1) {
    for (let level = 8; level < 26; level += 1) {
      const cell = [column, row, level];
      const room = floorUnder(context, cell) + roofOver(context, cell) < 0.5;
      for (const face of ['x0', 'x1', 'y0', 'y1']) {
        const told = room ? wallOn(context, cell, face) : 0;
        assert.equal(told, standsOn(cell, face), `the ${face} of ${cell}`);
        asked += 1;
      }
    }
  }
}
assert.equal(asked, 24 * 10 * 18 * 4);
assert.equal(wallOn(context, [14, 6, 21], 'x0'), 0.375, 'the crawl space');

// Thickness is the figure's: with other figures - outer and inner walls of 0.75 m, a floor slab
// of 0.5 m and a roof slab of 0.25 m - every number follows. A den of 3 m by 2 m with a nook
// of half a metre beside it; and a bay of two boxes, the lower one column wide and a metre
// high, the upper lying on it and reaching three columns past it.
const stout = { ...figures, outerWallM: 0.75, innerWallM: 0.75, floorSlabM: 0.5, roofSlabM: 0.25 };
const deep = [
  box([1, 7], [1, 5], [16, 22], { name: 'Den' }),
  box([7, 8], [1, 5], [16, 22], { name: 'Nook' }),
  box([12, 13], [1, 5], [20, 22], { name: 'Bay', group: 3 }),
  box([12, 16], [1, 5], [16, 20], { group: 3 }),
];
const thick = sceneOf(site, deep, stout, { blocks: [walls] });
assert.deepEqual(thick.parts, [
  // The den: outer walls of 0.75 m, a cell and a half deep, each still one box; and 0.375 m,
  // its half of the inner wall, toward the nook.
  wall(0, 105, [0.5, 5.5, 105.5], [1.25, 7.5, 107.75]),
  wall(0, 105, [3.125, 5.5, 105.5], [3.5, 7.5, 107.75]),
  wall(0, 105, [0.5, 6.75, 105.5], [3.5, 7.5, 107.75]),
  wall(0, 105, [0.5, 5.5, 105.5], [3.5, 6.25, 107.75]),
  // The nook, half a metre wide: its half of the inner wall and its outer wall are a quarter
  // of a metre each, half of what it is wide, and no more.
  wall(1, 105, [3.5, 5.5, 105.5], [3.75, 7.5, 107.75]),
  wall(1, 105, [3.75, 5.5, 105.5], [4, 7.5, 107.75]),
  wall(1, 105, [3.5, 6.75, 105.5], [4, 7.5, 107.75]),
  wall(1, 105, [3.5, 5.5, 105.5], [4, 6.25, 107.75]),
  // The bay's lower box, half a metre wide and a metre high: its floor slab is half of its
  // height, and its walls stand on that, up to its top.
  wall(2, 105, [6, 5.5, 105.5], [6.25, 7.5, 106]),
  wall(2, 105, [6.25, 5.5, 105.5], [6.5, 7.5, 106]),
  wall(2, 105, [6, 6.75, 105.5], [6.5, 7.5, 106]),
  wall(2, 105, [6, 5.5, 105.5], [6.5, 6.25, 106]),
  // Its upper box has a floor slab where it reaches past the lower, and none on it. Up the
  // plot its wall stands over both: the half metre over the lower box runs down to 106 m, and
  // the quarter over the slab stands on it, at 106.5 m - two boxes of one wall. Up and down
  // the paper the wall is cut where the slab begins.
  wall(3, 106, [6, 5.5, 106], [6.5, 7.5, 107.75]),
  wall(3, 106, [6.5, 5.5, 106.5], [6.75, 7.5, 107.75]),
  wall(3, 106, [7.25, 5.5, 106.5], [8, 7.5, 107.75]),
  wall(3, 106, [6, 6.75, 106], [6.5, 7.5, 107.75]),
  wall(3, 106, [6.5, 6.75, 106.5], [8, 7.5, 107.75]),
  wall(3, 106, [6, 5.5, 106], [6.5, 6.25, 107.75]),
  wall(3, 106, [6.5, 5.5, 106.5], [8, 6.25, 107.75]),
]);
// So no wall of the bay stands in its floor: with every rule there is, the three things hold.
assert.deepEqual(amiss(thick), []);
assert.deepEqual(amiss(sceneOf(site, deep, stout)), []);
// On a plot whose lines are no round figures - a column at x = 0.1 + column / 2, worked out to
// its last place - a cell is a hair more than half a metre wide, or a hair less. A wall as
// thick as a cell still stands in one cell, and not with a hair of it in the next: the bay,
// moved to where a cell is a hair short, has no wall of a hair's width on its floor slab.
const odd = { ...site, xFromM: 0.1, xToM: 12.1 };
const moved = deep.slice(2).map((one) => ({ ...one, x: [7, one.x[1] - 5] }));
assert.ok(0.1 + 8 / 2 - (0.1 + 7 / 2) < 0.5);
assert.deepEqual(amiss(sceneOf(odd, moved, { ...stout, outerWallM: 0.5 })), []);

// Two blocks drawn into each other, each a metre high: a hut of three columns, and a shed drawn
// later that begins in the hut's last column. The later one holds the cells they share, and a
// box has a wall only on the cells it holds: the hut has none down the plot, and three walls;
// the shed has its four, and no wall of the one lies in a slab of the other.
const drawnIn = [
  box([1, 4], [1, 3], [20, 22], { name: 'Hut' }),
  box([3, 6], [1, 3], [20, 22], { name: 'Bath shed' }),
];
const shared = sceneOf(site, drawnIn, figures);
const wallsOf = (at) => shared.parts.filter((part) => part.of === 'wall' && part.thing === at);
assert.deepEqual([wallsOf(0).length, wallsOf(1).length], [3, 4]);
assert.deepEqual(amiss(shared), []);

process.stdout.write(
  'tools/sketch/scene: a room has an outer wall inside its edge and half an inner one toward a room, between its slabs\n',
);
