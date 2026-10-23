// The check of a roof under a top that slopes (story ST-026): the rule of slabs.js alone, on a
// made-up plot and rooms made up on it, against roofs worked out by hand - a room alone whose
// top falls down the plot, and one whose top falls across it, the other way: each a field and
// four strips of plaster, each a slant; a top that comes down to the floor, falling to it and
// rising from it: where the roof thins out on the floor's slab, and where it ends; two boxes of
// one block, each with a top of its own, side by side and one over the other; a room beside
// another, and one under another block; a thicker roof, and one capped at half its box - and
// the floors of all of them, and the three questions of a cell, as they were. The walls under
// such a roof are gables.check.js's. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';
import { sceneOf } from './scene.js';
import { floorUnder, floorWhole, roofOver, slabs } from './slabs.js';
import { walls } from './walls.js';

// A made-up plot of 16 m by 8 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 8 - row / 2, and a level 108 - level / 2 metres above sea level. Its ground
// is flat, at 102 m: level 12, on which every room here stands but one.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 16,
  yFromM: 0,
  yToM: 8,
  sideM: [100, 108],
  outline: [
    [1, 7],
    [15, 7],
    [1, 1],
  ],
  ground: { baseM: 100, rowsCm: Array(17).fill(Array(33).fill('200').join(' ')) },
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
const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, more) => ({ x, y, z, colour: grey, ...more });
// A top that slopes, as a block says one: the row of a standing view it lies in at the first
// end of the box along an axis, and at the second.
const top = (axis, ...rows) => ({ top: { axis, rows } });

// A part by hand, of the thing at a place: a floor is a box, as it was, and stands at 102 m.
const FLOOR = { of: 'floor', shape: 'box', floor: 102 };
const floor = (thing, min, max, surface = 'plaster') => ({ ...FLOOR, min, max, surface, thing });
// The floor of a room alone, 0.375 m thick from 102 m up: `edge` is the slab and `field` what
// its four walls leave of it, each `[x, y, to x, to y]`. The field, and then a strip of plaster
// under each wall: up the plot, down the plot, up the paper, down the paper.
const floorOf = (thing, edge, field, surface = 'wood') => [
  floor(thing, [field[0], field[1], 102], [field[2], field[3], 102.375], surface),
  floor(thing, [edge[0], edge[1], 102], [field[0], edge[3], 102.375]),
  floor(thing, [field[2], edge[1], 102], [edge[2], edge[3], 102.375]),
  floor(thing, [field[0], field[3], 102], [field[2], edge[3], 102.375]),
  floor(thing, [field[0], edge[1], 102], [field[2], field[1], 102.375]),
];
// A roof by hand: a slant over a rectangle seen from above, `[x, y, to x, to y]` - its bottom
// and its top, each at the lower figure of the rectangle along the extent it slopes along and
// at the higher. Its box is the box around it. A strip is plaster, and says nothing.
const ROOF = { of: 'roof', shape: 'slant', over: true };
const roofOf =
  (thing, along, stands = 102) =>
  (lies, low, high, surface = 'plaster') => {
    const [min, max] = [
      [lies[0], lies[1], Math.min(...low)],
      [lies[2], lies[3], Math.max(...high)],
    ];
    return { ...ROOF, min, max, along, low, high, surface, thing, floor: stands };
  };
// The parts that the rule alone makes of some things; of them the roofs of one; and of some
// roofs how thick each is upright, at either end.
const alone = (things, by = figures) => sceneOf(site, things, by, { blocks: [slabs] });
const roofsOf = (things, thing, by) =>
  alone(things, by).parts.filter((part) => part.of === 'roof' && part.thing === thing);
const upright = (roofs) => roofs.map(({ low, high }) => [high[0] - low[0], high[1] - low[1]]);

// FOUR ROOMS ALONE, on level 12.
const rooms = [
  // 0: a hall of 4 m by 3 m, 4 m high. Its top falls down the plot, half a metre with every
  // metre: from its own top, 106 m at x = 1, to 104 m at x = 5.
  box([2, 10], [2, 8], [4, 12], { name: 'Hall', ...top('x', 4, 8) }),
  // 1: a den of 3 m by 4 m, as high. Its top falls across the plot, the other way - against the
  // rows: 104 m at its first row, y = 7, and 106 m at its last, y = 3.
  box([14, 20], [2, 10], [4, 12], { name: 'Den', ...top('y', 8, 4) }),
  // 2: a lean-to of 4 m by 3 m, 2 m high, whose top falls to its floor: 104 m at x = 11, and
  // 102 m at x = 15. 3: a store as large, whose top rises from its floor.
  box([22, 30], [2, 8], [8, 12], { name: 'Lean-to', ...top('x', 8, 12) }),
  box([22, 30], [10, 16], [8, 12], { name: 'Store', ...top('x', 12, 8) }),
];
const [hall, den, lean, store] = [roofOf(0, 0), roofOf(1, 1), roofOf(2, 0), roofOf(3, 0)];
const byHand = [
  // The hall. Its floor is the box it was, under its four walls. Its roof lies over the same
  // five rectangles and follows the top: 0.3125 m thick, measured upright, so its bottom lies
  // that far under its top all the way. The strip up the plot, 0.375 m wide, falls from 106 m
  // to 105.8125 m; the field from there to 104.1875 m at x = 4.625, the two strips along the
  // plot beside it; the strip down the plot from there to 104 m.
  ...floorOf(0, [1, 4, 5, 7], [1.375, 4.375, 4.625, 6.625]),
  hall([1.375, 4.375, 4.625, 6.625], [105.5, 103.875], [105.8125, 104.1875], 'concrete'),
  hall([1, 4, 1.375, 7], [105.6875, 105.5], [106, 105.8125]),
  hall([4.625, 4, 5, 7], [103.875, 103.6875], [104.1875, 104]),
  hall([1.375, 6.625, 4.625, 7], [105.5, 103.875], [105.8125, 104.1875]),
  hall([1.375, 4, 4.625, 4.375], [105.5, 103.875], [105.8125, 104.1875]),
  // The den. Across the plot the two strips up and down the plot run the whole slope, from
  // corner to corner: 106 m at y = 3, 104 m at y = 7. The strip up the paper is the low one,
  // at the larger y, and the strip down the paper the high one.
  ...floorOf(1, [7, 3, 10, 7], [7.375, 3.375, 9.625, 6.625]),
  den([7.375, 3.375, 9.625, 6.625], [105.5, 103.875], [105.8125, 104.1875], 'concrete'),
  den([7, 3, 7.375, 7], [105.6875, 103.6875], [106, 104]),
  den([9.625, 3, 10, 7], [105.6875, 103.6875], [106, 104]),
  den([7.375, 6.625, 9.625, 7], [103.875, 103.6875], [104.1875, 104]),
  den([7.375, 3, 9.625, 3.375], [105.6875, 105.5], [106, 105.8125]),
  // The lean-to. Its floor is whole, 102.375 m at its top. The bottom of the roof comes down
  // to that at x = 13.625, where the top lies at 102.6875 m: from there the roof lies on the
  // floor's slab and thins out, until the top meets the slab too, at x = 14.25. There it ends:
  // the field and the strips along the plot are two slants each, the second down to an edge.
  // The strip down the plot, from x = 14.625, is not there, and the floor's edge shows.
  ...floorOf(2, [11, 4, 15, 7], [11.375, 4.375, 14.625, 6.625]),
  lean([11.375, 4.375, 13.625, 6.625], [103.5, 102.375], [103.8125, 102.6875], 'concrete'),
  lean([13.625, 4.375, 14.25, 6.625], [102.375, 102.375], [102.6875, 102.375], 'concrete'),
  lean([11, 4, 11.375, 7], [103.6875, 103.5], [104, 103.8125]),
  lean([11.375, 6.625, 13.625, 7], [103.5, 102.375], [103.8125, 102.6875]),
  lean([13.625, 6.625, 14.25, 7], [102.375, 102.375], [102.6875, 102.375]),
  lean([11.375, 4, 13.625, 4.375], [103.5, 102.375], [103.8125, 102.6875]),
  lean([13.625, 4, 14.25, 4.375], [102.375, 102.375], [102.6875, 102.375]),
  // The store, a floor of concrete. Its top meets the floor's slab first, at x = 11.75, and
  // the bottom of its roof after that, at x = 12.375: the two places where the roof is cut
  // come the other way round, and the piece that thins out is the first.
  ...floorOf(3, [11, 0, 15, 3], [11.375, 0.375, 14.625, 2.625], 'concrete'),
  store([11.75, 0.375, 12.375, 2.625], [102.375, 102.375], [102.375, 102.6875], 'concrete'),
  store([12.375, 0.375, 14.625, 2.625], [102.375, 103.5], [102.6875, 103.8125], 'concrete'),
  store([14.625, 0, 15, 3], [103.5, 103.6875], [103.8125, 104]),
  store([11.75, 2.625, 12.375, 3], [102.375, 102.375], [102.375, 102.6875]),
  store([12.375, 2.625, 14.625, 3], [102.375, 103.5], [102.6875, 103.8125]),
  store([11.75, 0, 12.375, 0.375], [102.375, 102.375], [102.375, 102.6875]),
  store([12.375, 0, 14.625, 0.375], [102.375, 103.5], [102.6875, 103.8125]),
];
// The rule alone gives these, and no other part: of the hall and of the den a roof of five
// slants each, as thick upright as a level roof at either end of every one.
assert.deepEqual(alone(rooms).parts, byHand);
for (const thing of [0, 1]) {
  assert.deepEqual(upright(roofsOf(rooms, thing)), Array(5).fill([0.3125, 0.3125]), `${thing}`);
}

// TWO BOXES OF ONE BLOCK, each with a top of its own. A barn of two boxes of 2 m side by side:
// the top of the first rises a metre with every metre, from 104 m to a ridge at 106 m over the
// line between the two, x = 3, and the top of the second falls from it. No wall stands
// between them and no strip lies there: each field reaches the ridge, and the two meet in it.
const barn = [
  box([2, 6], [2, 8], [4, 12], { name: 'Barn', group: 3, ...top('x', 8, 4) }),
  box([6, 10], [2, 8], [4, 12], { group: 3, ...top('x', 4, 8) }),
];
const [rising, falling] = [roofOf(0, 0), roofOf(1, 0)];
assert.deepEqual(
  [...roofsOf(barn, 0), ...roofsOf(barn, 1)],
  [
    rising([1.375, 4.375, 3, 6.625], [104.0625, 105.6875], [104.375, 106], 'concrete'),
    rising([1, 4, 1.375, 7], [103.6875, 104.0625], [104, 104.375]),
    rising([1.375, 6.625, 3, 7], [104.0625, 105.6875], [104.375, 106]),
    rising([1.375, 4, 3, 4.375], [104.0625, 105.6875], [104.375, 106]),
    falling([3, 4.375, 4.625, 6.625], [105.6875, 104.0625], [106, 104.375], 'concrete'),
    falling([4.625, 4, 5, 7], [104.0625, 103.6875], [104.375, 104]),
    falling([3, 6.625, 4.625, 7], [105.6875, 104.0625], [106, 104.375]),
    falling([3, 4, 4.625, 4.375], [105.6875, 104.0625], [106, 104.375]),
  ],
);
// And one over the other: a tower whose lower box is 3 m long and 2 m high, and whose upper
// box, on level 8 at 104 m, reaches a metre past it down the plot, with a top that falls from
// 106 m at x = 1 to its own foot at x = 5. The upper box has a floor only where it reaches
// past the lower, from x = 4. Over the lower box nothing lies under its roof: the bottom of
// the roof runs down to 104.1875 m at x = 4. From there it lies on its floor, whose top is at
// 104.375 m, and ends at x = 4.25, where the top meets it: the roof is parted at x = 4.
const tower = [
  box([2, 8], [2, 8], [8, 12], { name: 'Tower', group: 5 }),
  box([2, 10], [2, 8], [4, 8], { group: 5, ...top('x', 4, 8) }),
];
const upper = roofOf(1, 0, 104);
assert.deepEqual(roofsOf(tower, 1), [
  upper([1.375, 4.375, 4, 6.625], [105.5, 104.1875], [105.8125, 104.5], 'concrete'),
  upper([4, 4.375, 4.25, 6.625], [104.375, 104.375], [104.5, 104.375], 'concrete'),
  upper([1, 4, 1.375, 7], [105.6875, 105.5], [106, 105.8125]),
  upper([1.375, 6.625, 4, 7], [105.5, 104.1875], [105.8125, 104.5]),
  upper([4, 6.625, 4.25, 7], [104.375, 104.375], [104.5, 104.375]),
  upper([1.375, 4, 4, 4.375], [105.5, 104.1875], [105.8125, 104.5]),
  upper([4, 4, 4.25, 4.375], [104.375, 104.375], [104.5, 104.375]),
]);

// A ROOM BESIDE ANOTHER, AND ONE UNDER ANOTHER BLOCK. The hall with a side room against its
// face down the paper, as high as the hall's box: toward a room a roof has no strip, and the
// hall's field reaches that edge, y = 4. And the side room, whose top is level, is the room it
// would be beside a level hall: every part of it, in its place.
const [sloping] = rooms;
const flat = (thing) => Object.fromEntries(Object.entries(thing).filter(([key]) => key !== 'top'));
const beside = [sloping, box([2, 10], [8, 12], [4, 12], { name: 'Side room' })];
assert.deepEqual(roofsOf(beside, 0), [
  hall([1.375, 4, 4.625, 6.625], [105.5, 103.875], [105.8125, 104.1875], 'concrete'),
  hall([1, 4, 1.375, 7], [105.6875, 105.5], [106, 105.8125]),
  hall([4.625, 4, 5, 7], [103.875, 103.6875], [104.1875, 104]),
  hall([1.375, 6.625, 4.625, 7], [105.5, 103.875], [105.8125, 104.1875]),
]);
const ofSide = (things) => alone(things).parts.filter((part) => part.thing === 1);
assert.deepEqual([ofSide(beside).length, ofSide(beside)], [8, ofSide(beside.map(flat))]);
// The hall with a loft over its two metres down the plot, from x = 3: under another block a
// room has no roof, as before. Its roof lies over its first two metres and ends at x = 3 in
// concrete, 105 m high there, with no strip: no wall stands at that edge. Under a loft that
// lies over all of it, it has none at all.
const loft = (x) => box(x, [2, 8], [0, 4], { name: 'Loft' });
assert.deepEqual(roofsOf([sloping, loft([6, 14])], 0), [
  hall([1.375, 4.375, 3, 6.625], [105.5, 104.6875], [105.8125, 105], 'concrete'),
  hall([1, 4, 1.375, 7], [105.6875, 105.5], [106, 105.8125]),
  hall([1.375, 6.625, 3, 7], [105.5, 104.6875], [105.8125, 105]),
  hall([1.375, 4, 3, 4.375], [105.5, 104.6875], [105.8125, 105]),
]);
assert.deepEqual(roofsOf([sloping, loft([2, 10])], 0), []);

// A THICKER ROOF, and every number follows. Half a metre thick, the hall's roof lies half a
// metre under its top at either end of all five slants. The bottom of the lean-to's meets the
// floor sooner, at x = 13.25, where the top lies at 102.875 m; it ends where it ended. And a
// roof is never thicker than half its box: of 1.25 m, the lean-to's, 2 m high, is 1 m thick.
const thicker = (roofSlabM) => ({ ...figures, roofSlabM });
assert.deepEqual(upright(roofsOf(rooms, 0, thicker(0.5))), Array(5).fill([0.5, 0.5]));
assert.deepEqual(roofsOf(rooms, 2, thicker(0.5)).slice(0, 2), [
  lean([11.375, 4.375, 13.25, 6.625], [103.3125, 102.375], [103.8125, 102.875], 'concrete'),
  lean([13.25, 4.375, 14.25, 6.625], [102.375, 102.375], [102.875, 102.375], 'concrete'),
]);
const capped = roofsOf(rooms, 2, thicker(1.25))[2];
assert.deepEqual(capped, lean([11, 4, 11.375, 7], [103, 102.8125], [104, 103.8125]));

// THE FLOORS AND THE QUESTIONS OF A CELL are the box's. What a rule gets, taken by a rule of
// the check's own: to ask the questions of a cell, of things as they are and with level tops.
const contextOf = (things) => {
  const seen = [];
  sceneOf(site, things, figures, { blocks: [(context) => seen.push(context) && []] });
  return seen[0];
};
const floorsOf = (things) => alone(things).parts.filter((part) => part.of === 'floor');
const HOUSES = [rooms, barn, tower, beside, [sloping, loft([6, 14])], [sloping, loft([2, 10])]];
let asked = 0;
for (const things of HOUSES) {
  // Every floor is the box it was, in its place: a floor is level under a slope.
  assert.deepEqual(floorsOf(things), floorsOf(things.map(flat)));
  // And cell by cell, on every level of the paper, each question answers as for the box.
  const [now, before] = [contextOf(things), contextOf(things.map(flat))];
  for (let column = 0; column < 32; column += 1) {
    for (let row = 0; row < 16; row += 1) {
      for (let level = 0; level < 16; level += 1) {
        const cell = [column, row, level];
        for (const question of [floorUnder, floorWhole, roofOver]) {
          assert.equal(question(now, cell), question(before, cell), `${question.name} ${cell}`);
          asked += 1;
        }
      }
    }
  }
}
assert.equal(asked, HOUSES.length * 32 * 16 * 16 * 3);
// By hand, of the hall: the roof is over the cell at the top of its box, at its low end too,
// where the roof lies a metre and a half under that cell - and over no cell that it lies in
// there. And of the lean-to: its floor lies under the cell at its low end, over which its top
// has come down to nothing.
const asking = contextOf(rooms);
for (const [question, cell, thick, why] of [
  [roofOver, [2, 3, 4], 0.3125, 'the top of the box at the high end'],
  [roofOver, [9, 3, 4], 0.3125, 'the top of the box at the low end'],
  [roofOver, [9, 3, 8], 0, 'the cell that the roof lies in at the low end'],
  [roofOver, [9, 3, 3], 0, 'over the box'],
  [floorUnder, [29, 3, 11], 0.375, 'the floor at the low end of the lean-to'],
  [floorWhole, [29, 3, 11], 0.375, 'and taken whole'],
]) {
  assert.equal(question(asking, cell), thick, why);
}

// NOTHING IS AMISS in any of it: with the rule alone, with the walls beside it, and with every
// rule there is - no roof rises over the top of its block, lies in its floor or in a wall.
for (const things of HOUSES) {
  for (const by of [figures, thicker(0.5), thicker(1.25)]) {
    for (const blocks of [[slabs], [slabs, walls], undefined]) {
      const rules = blocks && { blocks };
      assert.deepEqual(amiss(sceneOf(site, things, by, rules)), [], `${things.length} things`);
    }
  }
}

process.stdout.write(
  'tools/sketch/scene: under a top that slopes a room has a roof that follows it, as thick upright as it was, thinning out on the floor where the top comes down to it\n',
);
