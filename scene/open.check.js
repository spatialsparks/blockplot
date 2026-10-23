// The check of railings: a made-up house of eight boxes on a made-up plot whose ground falls
// down the plot, against the railings a person worked out by hand - a balcony high over the
// ground, beside a room and beside another open floor; a deck lower than its floor and a
// railing together; a planted roof of two boxes, half a metre high, beside bare roof and
// beside glass; a garden that the ground meets at one end and leaves at the other, so that
// the cell where its railing begins is worked out; and a lawn whose edge alone lies over a
// drop. The same with a thicker floor and a higher railing; a box that lies on a box of its
// own block; and two blocks drawn into each other. Run by tools/sketch/check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';
import { RAIL_M, STEP_M, railings } from './open.js';
import { sceneOf } from './scene.js';

// What the rule builds with, and every figure below was worked out with: a step of half a
// metre, and a railing 5 cm thick.
assert.deepEqual([STEP_M, RAIL_M], [0.5, 0.05]);

// A made-up plot of 12 m by 8 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 8 - row / 2, and a level 116 - level / 2 metres above sea level. Its ground
// falls 10 cm a column down the plot, from 108 m, and lies the same all the way across: at the
// middle of a cell's edge that runs down the plot it lies at 107.95 m, less 10 cm a column.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 12,
  yFromM: 0,
  yToM: 8,
  sideM: [100, 116],
  outline: [
    [1, 7],
    [11, 7],
    [1, 1],
  ],
  ground: {
    baseM: 100,
    rowsCm: Array(17).fill(
      Array.from({ length: 25 }, (point, column) => 800 - 10 * column).join(' '),
    ),
  },
};
// Made-up figures: a floor of a quarter of a metre, and a railing of a metre.
const figures = {
  outerWallM: 0.375,
  innerWallM: 0.25,
  floorSlabM: 0.25,
  roofSlabM: 0.3125,
  railingHighM: 1,
  doorHighM: 2,
  windowHighM: 1.5,
  sillHighM: 1,
};

const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, more) => ({ x, y, z, colour: grey, ...more });
const things = [
  // 0: a hall of two storeys, 3 m by 3 m, on level 18, at 107 m: its roof lies at 113 m.
  box([2, 8], [2, 8], [6, 18], { name: 'Hall' }),
  // 1: a balcony at the hall's side down the plot, 2 m by 3 m and 2 m high, its floor at 110 m:
  // three metres over the ground. 2: a deck that goes on beside the balcony's last three rows,
  // 2 m by 1.5 m and a metre high - lower than its floor and a railing together.
  box([8, 12], [2, 8], [8, 12], { name: 'Balcony', as: 'open' }),
  box([12, 16], [5, 8], [10, 12], { name: 'Deck', as: 'open' }),
  // 3 and 4: a planted roof on the hall, half a metre high - two boxes of one block side by
  // side, the second three rows shorter. 5: a lantern of glass, a metre square, in the corner
  // that they leave: between it and the second box, one row of the hall's roof is bare.
  box([2, 6], [2, 8], [5, 6], { name: 'Planted roof', as: 'open', group: 4 }),
  box([6, 8], [2, 5], [5, 6], { group: 4 }),
  box([6, 8], [6, 8], [2, 6], { name: 'Lantern', as: 'glass' }),
  // 6: a garden on the ground, 8 m by 2 m and 2 m high, its floor at 107 m: at its end up the
  // plot the ground lies at 107.6 m, and at its end down the plot at 106 m. 7: a lawn that
  // goes on beside it down the paper, on the same floor, 2 m by 1 m and a metre high, from
  // column 9 to column 13.
  box([4, 20], [10, 14], [14, 18], { name: 'Garden', as: 'open' }),
  box([9, 13], [14, 16], [16, 18], { name: 'Lawn', as: 'open' }),
];

// A railing, by hand: the place of its thing, the floor that thing stands on, and its box.
const RAIL = { of: 'rail', shape: 'box', surface: 'metal' };
const rail = (thing, floor, min, max) => ({ ...RAIL, min, max, thing, floor });
// Two figures that were worked out in two ways - by the rule, and by hand - differ by a hair.
const HAIR_M = 1e-9;
const alike = (made, byHand, what) => {
  assert.equal(made.length, byHand.length, `${what}: ${made.length} parts`);
  made.forEach(({ min, max, ...words }, at) => {
    const { min: least, max: most, ...said } = byHand[at];
    assert.deepEqual(words, said, `${what}, part ${at}`);
    const off = [...min, ...max].some(
      (figure, place) => !(Math.abs(figure - [...least, ...most][place]) < HAIR_M),
    );
    assert.ok(!off, `${what}, part ${at}: from ${min} to ${max}`);
  });
};

// The railings, by hand: 5 cm thick, on the edge and inward of it, from the top of the floor
// slab - a quarter of a metre over the bottom of the box - a metre up. They come box by box,
// and of a box edge by edge: up the plot, down the plot, up the paper, down the paper.
const byHand = [
  // The balcony, its floor slab's top at 110.25 m. None toward the hall. Down the plot along
  // its first three rows, from y = 5.5 to 7, and none where the deck goes on. Up and down the
  // paper along the whole edge.
  rail(1, 110, [5.95, 5.5, 110.25], [6, 7, 111.25]),
  rail(1, 110, [4, 6.95, 110.25], [6, 7, 111.25]),
  rail(1, 110, [4, 4, 110.25], [6, 4.05, 111.25]),
  // The deck: none toward the balcony, and three that end at the top of its box, at 111 m - a
  // quarter of a metre under where a railing of a metre would end.
  rail(2, 110, [7.95, 4, 110.25], [8, 5.5, 111]),
  rail(2, 110, [6, 5.45, 110.25], [8, 5.5, 111]),
  rail(2, 110, [6, 4, 110.25], [8, 4.05, 111]),
  // The planted roof, half a metre high: its floor is half of that, and a rim of a quarter of
  // a metre is left, from 113.25 m to its top. Its first box has none toward the second, none
  // toward the lantern, and half a metre of rim toward the bare roof between them, from y = 5
  // to 5.5 - the ground lies six metres under that row.
  rail(3, 113, [1, 4, 113.25], [1.05, 7, 113.5]),
  rail(3, 113, [2.95, 5, 113.25], [3, 5.5, 113.5]),
  rail(3, 113, [1, 6.95, 113.25], [3, 7, 113.5]),
  rail(3, 113, [1, 4, 113.25], [3, 4.05, 113.5]),
  // Its second box: none toward the first, and a rim on its three other edges - down the plot
  // over the balcony, which lies lower, and down the paper toward the bare roof.
  rail(4, 113, [3.95, 5.5, 113.25], [4, 7, 113.5]),
  rail(4, 113, [3, 6.95, 113.25], [4, 7, 113.5]),
  rail(4, 113, [3, 5.5, 113.25], [4, 5.55, 113.5]),
  // The lantern is glass, and has none. The garden, its floor slab's top at 107.25 m. Up the
  // plot the ground lies over it: none. Down the plot it lies 1.25 m under it: a railing. Along
  // the plot the ground lies 0.1 m a column further under the floor: at the middle of column 12
  // at 106.75 m, a step under it and no more - none; at the middle of column 13 at 106.65 m -
  // a railing, which begins there, at x = 6.5, and nowhere before.
  rail(6, 107, [9.95, 1, 107.25], [10, 3, 108.25]),
  rail(6, 107, [6.5, 2.95, 107.25], [10, 3, 108.25]),
  rail(6, 107, [6.5, 1, 107.25], [10, 1.05, 108.25]),
  // The lawn. Toward the garden it has none, and none down the paper: up to the middle of its
  // last column, 12, the ground lies a step under it and no more. The ground is asked at the
  // edge, not at the middle of a cell: at its edge down the plot, on column 13, it lies at
  // 106.7 m, 0.55 m under the floor - a railing, which ends at the top of its box, at 108 m.
  rail(7, 107, [6.45, 0, 107.25], [6.5, 1, 108]),
];

// The rule alone gives these railings, and no other part; the house's own rules give them too,
// among whatever they give. And the three things hold of this house, with the rule alone and
// with every rule there is: each railing within the box of its block, and none in a slab, in
// a wall or in a pane.
const alone = sceneOf(site, things, figures, { blocks: [railings] });
alike(alone.parts, byHand, 'the railings');
const whole = sceneOf(site, things, figures);
const railsOf = (scene) => scene.parts.filter((part) => part.of === 'rail');
alike(railsOf(whole), byHand, 'the railings of the whole house');
assert.deepEqual(amiss(alone), []);
assert.deepEqual(amiss(whole), []);

// The figures are the house's: with a floor of half a metre and a railing of 1.25 m, every
// number follows. The balcony's railings stand on 110.5 m and end at 111.75 m; the deck's stand
// on 110.5 m and still end at the top of their box. The planted roof is as it was: its floor is
// half of its box, and no thicker. The garden's floor and the lawn's lie a quarter of a metre
// higher over the ground, and a railing begins three columns earlier: at the middle of column
// 9 the ground lies 0.45 m under them, and at the middle of column 10, at x = 5, 0.55 m. So
// the garden's begins there up the paper - and down the paper where the lawn ends, at x = 6.5,
// as before; and the lawn now has one down the paper too, on its last three columns.
const other = { ...figures, floorSlabM: 0.5, railingHighM: 1.25 };
const followed = [
  rail(1, 110, [5.95, 5.5, 110.5], [6, 7, 111.75]),
  rail(1, 110, [4, 6.95, 110.5], [6, 7, 111.75]),
  rail(1, 110, [4, 4, 110.5], [6, 4.05, 111.75]),
  rail(2, 110, [7.95, 4, 110.5], [8, 5.5, 111]),
  rail(2, 110, [6, 5.45, 110.5], [8, 5.5, 111]),
  rail(2, 110, [6, 4, 110.5], [8, 4.05, 111]),
  ...byHand.slice(6, 13),
  rail(6, 107, [9.95, 1, 107.5], [10, 3, 108.75]),
  rail(6, 107, [5, 2.95, 107.5], [10, 3, 108.75]),
  rail(6, 107, [6.5, 1, 107.5], [10, 1.05, 108.75]),
  rail(7, 107, [6.45, 0, 107.5], [6.5, 1, 108]),
  rail(7, 107, [5, 0, 107.5], [6.5, 0.05, 108]),
];
alike(sceneOf(site, things, other, { blocks: [railings] }).parts, followed, 'other figures');
assert.deepEqual(amiss(sceneOf(site, things, other)), []);

// Boxes of one block that lie on each other are one floor. A sun deck of two boxes, each a
// metre high, the upper one a column shorter down the plot, its floor at 110 m. The railing is
// a metre high all the same, from 110.25 m to 111.25 m: three quarters of it in the lower box,
// up to its top, and the last quarter in the upper, which has no floor of its own. Where the
// upper box ends over the floor it has none - the floor goes on there - and where the lower
// has nothing of its block over it, down the plot, its railing ends at its top.
const stacked = [
  box([2, 6], [2, 6], [10, 12], { name: 'Sun deck', as: 'open', group: 1 }),
  box([2, 5], [2, 6], [8, 10], { group: 1 }),
];
alike(
  sceneOf(site, stacked, figures, { blocks: [railings] }).parts,
  [
    rail(0, 110, [1, 5, 110.25], [1.05, 7, 111]),
    rail(0, 110, [2.95, 5, 110.25], [3, 7, 111]),
    rail(0, 110, [1, 6.95, 110.25], [3, 7, 111]),
    rail(0, 110, [1, 5, 110.25], [3, 5.05, 111]),
    rail(1, 111, [1, 5, 111], [1.05, 7, 111.25]),
    rail(1, 111, [1, 6.95, 111], [2.5, 7, 111.25]),
    rail(1, 111, [1, 5, 111], [2.5, 5.05, 111.25]),
  ],
  'two boxes, one over the other',
);
assert.deepEqual(amiss(sceneOf(site, stacked, figures)), []);
// A railing of half a metre ends within the lower box, at 110.75 m: the upper box has none.
const low = sceneOf(site, stacked, { ...figures, railingHighM: 0.5 }, { blocks: [railings] });
assert.deepEqual(
  low.parts.map((part) => [part.thing, part.max[2]]),
  Array(4).fill([0, 110.75]),
);

// Two blocks drawn into each other: a terrace of 3 m by 2 m, a metre high, and a hut drawn later
// into its last two columns. The later one holds the cells they share, and a box has a railing
// only on the cells it holds: the terrace has none down the plot, and those along the plot end
// where the hut begins, at x = 3. No railing lies in the hut's floor or in its walls.
const drawnIn = [
  box([2, 8], [2, 6], [10, 12], { name: 'Terrace', as: 'open' }),
  box([6, 10], [2, 6], [6, 12], { name: 'Hut' }),
];
alike(
  sceneOf(site, drawnIn, figures, { blocks: [railings] }).parts,
  [
    rail(0, 110, [1, 5, 110.25], [1.05, 7, 111]),
    rail(0, 110, [1, 6.95, 110.25], [3, 7, 111]),
    rail(0, 110, [1, 5, 110.25], [3, 5.05, 111]),
  ],
  'two blocks drawn into each other',
);
assert.deepEqual(amiss(sceneOf(site, drawnIn, figures)), []);

process.stdout.write(
  'tools/sketch/scene: open air has a railing along every edge of its floor that has a drop beside it, and none beside a block or where the ground meets the floor\n',
);
