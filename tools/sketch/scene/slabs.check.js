// The check of floors and roofs: a made-up house of thirteen boxes on a made-up plot, against
// the slabs a person worked out by hand, each slab of a room its field and its rim of plaster -
// a room alone, a room half under another block, two boxes of one block side by side and one
// over the other, open air and glass, a block lower than its two slabs - and the questions of a
// cell against the same slabs, cell by cell. Rooms that touch, other figures and a floor that is
// open over a staircase are rim.check.js's. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { isDeepStrictEqual } from 'node:util';
import { amiss } from './holds.js';
import { sceneOf } from './scene.js';
import { floorUnder, floorWhole, roofOver, slabs } from './slabs.js';

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
// Made-up figures, each a sum of halves of halves, so that every height below is exact.
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

// The house, in cells. Most of its boxes stand on level 22, at 105 m.
const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, more) => ({ x, y, z, colour: grey, ...more });
const things = [
  // 0: a room alone, two storeys high - 6 m, from level 22 up to level 10.
  box([1, 5], [1, 4], [10, 22], { name: 'Study' }),
  // 1 and 2: a room, and a block that lies over its two columns down the plot and reaches two
  // columns past it.
  box([7, 11], [1, 4], [16, 22], { name: 'Kitchen' }),
  box([9, 13], [1, 4], [10, 16], { name: 'Loft' }),
  // 3 and 4: two boxes of one block side by side, the second a metre lower and without a name.
  box([1, 4], [6, 9], [16, 22], { name: 'Workshop', group: 7 }),
  box([4, 6], [6, 8], [18, 22], { group: 7 }),
  // 5 and 6: two boxes of one block one over the other. The upper leaves a row of the lower
  // open.
  box([8, 10], [6, 9], [16, 22], { name: 'Tower', group: 9 }),
  box([8, 10], [6, 8], [10, 16], { group: 9 }),
  // 7 and 8: open air, a metre high, and glass, two storeys high.
  box([14, 18], [1, 4], [20, 22], { name: 'Terrace', as: 'open' }),
  box([14, 18], [6, 9], [10, 22], { name: 'Greenhouse', as: 'glass' }),
  // 9: a block of one cell's height, half a metre: lower than its two slabs.
  box([20, 22], [1, 3], [21, 22], { name: 'Crawl space' }),
  // 10: open air on all of the workshop's first box.
  box([1, 4], [6, 9], [14, 16], { name: 'Roof garden', as: 'open' }),
  // 11 and 12: a bay of two boxes without a name, 2 m high each, one over the other: the upper
  // lies on all of the lower, and reaches a column past it.
  box([20, 22], [6, 8], [18, 22], { group: 11 }),
  box([20, 23], [6, 8], [14, 18], { group: 11 }),
];

// The slabs, by hand. A floor is 0.375 m thick, from the bottom of its box up; a roof 0.3125 m,
// down from the top of its box, and `over`. A slab of a room is its field, of the surface that
// is said here - a roof's is concrete - and after it a strip of plaster where an outer wall
// stands on it, 0.375 m wide as the wall is thick: up the plot, down the plot, up the paper,
// down the paper. Each part has the place of its thing, and the floor that thing stands on.
const slab = (of, thing, stands, min, max, surface = 'plaster') => ({
  of,
  shape: 'box',
  min,
  max,
  surface,
  thing,
  floor: stands,
});
const floor = (...its) => slab('floor', ...its);
const roof = (...its) => ({ ...slab('roof', ...its), over: true });
const byHand = [
  // The study, 2 m by 1.5 m, a room alone. Its floor of wood lies inside its four walls, and
  // under each wall a strip: the two across the plot from corner to corner, the two along it
  // between them. No floor halfway up. Its roof, at 111 - 0.3125 m, is cut alike.
  floor(0, 105, [0.875, 6.375, 105], [2.125, 7.125, 105.375], 'wood'),
  floor(0, 105, [0.5, 6, 105], [0.875, 7.5, 105.375]),
  floor(0, 105, [2.125, 6, 105], [2.5, 7.5, 105.375]),
  floor(0, 105, [0.875, 7.125, 105], [2.125, 7.5, 105.375]),
  floor(0, 105, [0.875, 6, 105], [2.125, 6.375, 105.375]),
  roof(0, 105, [0.875, 6.375, 110.6875], [2.125, 7.125, 111], 'concrete'),
  roof(0, 105, [0.5, 6, 110.6875], [0.875, 7.5, 111]),
  roof(0, 105, [2.125, 6, 110.6875], [2.5, 7.5, 111]),
  roof(0, 105, [0.875, 7.125, 110.6875], [2.125, 7.5, 111]),
  roof(0, 105, [0.875, 6, 110.6875], [2.125, 6.375, 111]),
  // The kitchen: a floor of stone under all of it. Its roof lies over its two columns up the
  // plot alone - under the loft, the loft's floor is its ceiling - and ends there in concrete,
  // at x = 4.5, with no strip: no wall stands at that edge.
  floor(1, 105, [3.875, 6.375, 105], [5.125, 7.125, 105.375], 'stone'),
  floor(1, 105, [3.5, 6, 105], [3.875, 7.5, 105.375]),
  floor(1, 105, [5.125, 6, 105], [5.5, 7.5, 105.375]),
  floor(1, 105, [3.875, 7.125, 105], [5.125, 7.5, 105.375]),
  floor(1, 105, [3.875, 6, 105], [5.125, 6.375, 105.375]),
  roof(1, 105, [3.875, 6.375, 107.6875], [4.5, 7.125, 108], 'concrete'),
  roof(1, 105, [3.5, 6, 107.6875], [3.875, 7.5, 108]),
  roof(1, 105, [3.875, 7.125, 107.6875], [4.5, 7.5, 108]),
  roof(1, 105, [3.875, 6, 107.6875], [4.5, 6.375, 108]),
  // The loft: a floor under all of it, over the kitchen and past it, and a roof.
  floor(2, 108, [4.875, 6.375, 108], [6.125, 7.125, 108.375], 'wood'),
  floor(2, 108, [4.5, 6, 108], [4.875, 7.5, 108.375]),
  floor(2, 108, [6.125, 6, 108], [6.5, 7.5, 108.375]),
  floor(2, 108, [4.875, 7.125, 108], [6.125, 7.5, 108.375]),
  floor(2, 108, [4.875, 6, 108], [6.125, 6.375, 108.375]),
  roof(2, 108, [4.875, 6.375, 110.6875], [6.125, 7.125, 111], 'concrete'),
  roof(2, 108, [4.5, 6, 110.6875], [4.875, 7.5, 111]),
  roof(2, 108, [6.125, 6, 110.6875], [6.5, 7.5, 111]),
  roof(2, 108, [4.875, 7.125, 110.6875], [6.125, 7.5, 111]),
  roof(2, 108, [4.875, 6, 110.6875], [6.125, 6.375, 111]),
  // The workshop: a floor under each box, both of concrete - the second box has its block's
  // name. Between the two no wall stands and no strip lies: the first box has one down the plot
  // only along the row that the second leaves open, so its field is two boxes, and the second
  // has none up the plot. The first lies under the roof garden; the second has its roof at 107 m.
  floor(3, 105, [0.875, 4, 105], [2, 4.625, 105.375], 'concrete'),
  floor(3, 105, [0.875, 3.875, 105], [1.625, 4, 105.375], 'concrete'),
  floor(3, 105, [0.5, 3.5, 105], [0.875, 5, 105.375]),
  floor(3, 105, [1.625, 3.5, 105], [2, 4, 105.375]),
  floor(3, 105, [0.875, 4.625, 105], [2, 5, 105.375]),
  floor(3, 105, [0.875, 3.5, 105], [1.625, 3.875, 105.375]),
  floor(4, 105, [2, 4.375, 105], [2.625, 4.625, 105.375], 'concrete'),
  floor(4, 105, [2.625, 4, 105], [3, 5, 105.375]),
  floor(4, 105, [2, 4.625, 105], [2.625, 5, 105.375]),
  floor(4, 105, [2, 4, 105], [2.625, 4.375, 105.375]),
  roof(4, 105, [2, 4.375, 106.6875], [2.625, 4.625, 107], 'concrete'),
  roof(4, 105, [2.625, 4, 106.6875], [3, 5, 107]),
  roof(4, 105, [2, 4.625, 106.6875], [2.625, 5, 107]),
  roof(4, 105, [2, 4, 106.6875], [2.625, 4.375, 107]),
  // The tower, a metre wide: one floor, at its bottom, and none between its boxes. A roof on
  // the row of the lower box that the upper leaves open - no strip toward the upper box, where
  // no face of the lower is - and on all of the upper.
  floor(5, 105, [4.375, 3.875, 105], [4.625, 4.625, 105.375], 'wood'),
  floor(5, 105, [4, 3.5, 105], [4.375, 5, 105.375]),
  floor(5, 105, [4.625, 3.5, 105], [5, 5, 105.375]),
  floor(5, 105, [4.375, 4.625, 105], [4.625, 5, 105.375]),
  floor(5, 105, [4.375, 3.5, 105], [4.625, 3.875, 105.375]),
  roof(5, 105, [4.375, 3.875, 107.6875], [4.625, 4, 108], 'concrete'),
  roof(5, 105, [4, 3.5, 107.6875], [4.375, 4, 108]),
  roof(5, 105, [4.625, 3.5, 107.6875], [5, 4, 108]),
  roof(5, 105, [4.375, 3.5, 107.6875], [4.625, 3.875, 108]),
  roof(6, 108, [4.375, 4.375, 110.6875], [4.625, 4.625, 111], 'concrete'),
  roof(6, 108, [4, 4, 110.6875], [4.375, 5, 111]),
  roof(6, 108, [4.625, 4, 110.6875], [5, 5, 111]),
  roof(6, 108, [4.375, 4.625, 110.6875], [4.625, 5, 111]),
  roof(6, 108, [4.375, 4, 110.6875], [4.625, 4.375, 111]),
  // Open air and glass: a floor, of stone to its edge, and no roof.
  floor(7, 105, [7, 6, 105], [9, 7.5, 105.375], 'stone'),
  floor(8, 105, [7, 3.5, 105], [9, 5, 105.375], 'stone'),
  // The crawl space, half a metre high: neither slab is thicker than half of that, so the two
  // meet in its middle, at 105.25 m - each with its rim, though no wall has room between them.
  floor(9, 105, [10.375, 6.875, 105], [10.625, 7.125, 105.25], 'wood'),
  floor(9, 105, [10, 6.5, 105], [10.375, 7.5, 105.25]),
  floor(9, 105, [10.625, 6.5, 105], [11, 7.5, 105.25]),
  floor(9, 105, [10.375, 7.125, 105], [10.625, 7.5, 105.25]),
  floor(9, 105, [10.375, 6.5, 105], [10.625, 6.875, 105.25]),
  roof(9, 105, [10.375, 6.875, 105.25], [10.625, 7.125, 105.5], 'concrete'),
  roof(9, 105, [10, 6.5, 105.25], [10.375, 7.5, 105.5]),
  roof(9, 105, [10.625, 6.5, 105.25], [11, 7.5, 105.5]),
  roof(9, 105, [10.375, 7.125, 105.25], [10.625, 7.5, 105.5]),
  roof(9, 105, [10.375, 6.5, 105.25], [10.625, 6.875, 105.5]),
  // The roof garden: a floor of grass, the workshop's ceiling, and no roof.
  floor(10, 108, [0.5, 3.5, 108], [2, 5, 108.375], 'grass'),
  // The bay, a room without a name: floors of wood. The lower box has its floor and no roof.
  // The upper has a floor under the one column that no box of its block lies under, half a
  // metre wide - with no strip up the plot, where it ends at no face - and a roof over all of it.
  floor(11, 105, [10.375, 4.375, 105], [10.625, 4.625, 105.375], 'wood'),
  floor(11, 105, [10, 4, 105], [10.375, 5, 105.375]),
  floor(11, 105, [10.625, 4, 105], [11, 5, 105.375]),
  floor(11, 105, [10.375, 4.625, 105], [10.625, 5, 105.375]),
  floor(11, 105, [10.375, 4, 105], [10.625, 4.375, 105.375]),
  floor(12, 107, [11, 4.375, 107], [11.125, 4.625, 107.375], 'wood'),
  floor(12, 107, [11.125, 4, 107], [11.5, 5, 107.375]),
  floor(12, 107, [11, 4.625, 107], [11.125, 5, 107.375]),
  floor(12, 107, [11, 4, 107], [11.125, 4.375, 107.375]),
  roof(12, 107, [10.375, 4.375, 108.6875], [11.125, 4.625, 109], 'concrete'),
  roof(12, 107, [10, 4, 108.6875], [10.375, 5, 109]),
  roof(12, 107, [11.125, 4, 108.6875], [11.5, 5, 109]),
  roof(12, 107, [10.375, 4.625, 108.6875], [11.125, 5, 109]),
  roof(12, 107, [10.375, 4, 108.6875], [11.125, 4.375, 109]),
];

// The rule alone gives these slabs, and no other part. The house's own rules give them too,
// among whatever they give.
const alone = sceneOf(site, things, figures, { blocks: [slabs] });
assert.deepEqual(alone.parts, byHand);
// So a block of two boxes one over the other has one floor, the lower box's - and the upper has
// one only where it reaches past the lower.
const floored = alone.parts.filter((part) => part.of === 'floor').map((part) => part.thing);
assert.deepEqual([floored.includes(5), floored.includes(6)], [true, false]);
assert.deepEqual([floored.includes(11), floored.includes(12)], [true, true]);
const whole = sceneOf(site, things, figures);
for (const part of byHand) {
  const made = whole.parts.some((one) => isDeepStrictEqual(one, part));
  assert.ok(made, `the house lacks the ${part.of} of thing ${part.thing}`);
}

// The three things hold of this house, with the rule alone and with every rule there is: each
// slab within the box of its block, and no two of different surfaces in each other - the two of
// the crawl space touch.
assert.deepEqual(amiss(alone), []);
assert.deepEqual(amiss(whole), []);
// And of one surface too, which `amiss` does not ask: a corner is one strip's, and they touch.
const apart = (a, b) => [0, 1, 2].some((w) => a.max[w] <= b.min[w] || b.max[w] <= a.min[w]);
const lapped = alone.parts.filter((a, nth) => alone.parts.slice(nth + 1).some((b) => !apart(a, b)));
assert.deepEqual(lapped, []);

// What a rule gets, taken by a rule of the check's own: to ask the two questions of a cell.
const seen = [];
const probe = (context) => {
  seen.push(context);
  return [];
};
sceneOf(site, things, figures, { blocks: [probe] });
const [context] = seen;

// Is a floor slab under a cell, and how thick? By hand, for a cell of each case.
for (const [cell, thick, why] of [
  [[1, 1, 21], 0.375, 'the lowest cell of the study'],
  [[1, 1, 20], 0, 'the cell over it'],
  [[1, 1, 15], 0, 'halfway up the study'],
  [[1, 1, 22], 0, 'under the study, where no block is'],
  [[0, 1, 21], 0, 'beside the study'],
  [[9, 1, 15], 0.375, 'the loft over the kitchen: another block is no reason for none'],
  [[12, 1, 15], 0.375, 'the loft past the kitchen'],
  [[4, 6, 21], 0.375, 'the second box of the workshop'],
  [[8, 6, 15], 0, 'the upper box of the tower on the lower: one block'],
  [[20, 6, 17], 0, 'the upper box of the bay on the lower'],
  [[22, 6, 17], 0.375, 'the upper box of the bay past the lower'],
  [[14, 1, 21], 0.375, 'the terrace'],
  [[14, 6, 21], 0.375, 'the greenhouse'],
  [[20, 1, 21], 0.25, 'the crawl space: half its height'],
  [[1, 6, 15], 0.375, 'the roof garden'],
]) {
  assert.equal(floorUnder(context, cell), thick, why);
}
// Is a roof slab over a cell, and how thick?
for (const [cell, thick, why] of [
  [[1, 1, 10], 0.3125, 'the highest cell of the study'],
  [[1, 1, 11], 0, 'the cell under it'],
  [[1, 1, 9], 0, 'over the study, where no block is'],
  [[7, 1, 16], 0.3125, 'the kitchen beside the loft'],
  [[9, 1, 16], 0, 'the kitchen under the loft'],
  [[1, 6, 16], 0, 'the workshop under the roof garden'],
  [[4, 6, 18], 0.3125, 'the second box of the workshop'],
  [[8, 8, 16], 0.3125, 'the lower box of the tower beside the upper'],
  [[8, 6, 16], 0, 'the lower box of the tower under the upper'],
  [[20, 6, 18], 0, 'the lower box of the bay under the upper'],
  [[14, 1, 20], 0, 'the terrace: open air has no roof'],
  [[1, 6, 14], 0, 'the roof garden'],
  [[14, 6, 10], 0, 'the greenhouse: the roof of glass is no slab'],
  [[20, 1, 21], 0.25, 'the crawl space: half its height'],
]) {
  assert.equal(roofOver(context, cell), thick, why);
}

// And cell by cell, the questions say what the slabs are: for every cell of the paper from
// level 8 down to level 23, the floor slab under it is as thick as the floor that lies under
// its square, from the cell's bottom up - and none where none lies - and so the roof over it.
const slabAt = (of, [column, row, level]) => {
  const [x, y] = [column / 2 + 0.25, 8 - row / 2 - 0.25];
  const [side, h] = of === 'floor' ? ['min', 116 - (level + 1) / 2] : ['max', 116 - level / 2];
  const lies = ({ min, max }) => min[0] < x && x < max[0] && min[1] < y && y < max[1];
  const slab = alone.parts.find((part) => part.of === of && part[side][2] === h && lies(part));
  return slab ? slab.max[2] - slab.min[2] : 0;
};
let asked = 0;
for (let column = 0; column < 24; column += 1) {
  for (let row = 0; row < 10; row += 1) {
    for (let level = 8; level < 24; level += 1) {
      const cell = [column, row, level];
      assert.equal(floorUnder(context, cell), slabAt('floor', cell), `floor under ${cell}`);
      assert.equal(roofOver(context, cell), slabAt('roof', cell), `roof over ${cell}`);
      // No staircase stands in this house: a floor taken whole is the slab that lies there.
      assert.equal(floorWhole(context, cell), floorUnder(context, cell), `whole under ${cell}`);
      asked += 1;
    }
  }
}
assert.equal(asked, 24 * 10 * 16);

process.stdout.write(
  'tools/sketch/scene: a floor lies under every block and a roof on every room, each inside its box, its edge of plaster where an outer wall stands on it\n',
);
