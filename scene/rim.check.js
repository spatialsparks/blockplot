// The check of the rim, the second of slabs.js: slabs whose walls are not the same all round,
// against parts worked out by hand - two rooms that touch over a part of a face, with glass and
// open air beside them; walls thicker than a cell, walls capped at half their box and a floor
// under a part of a wall alone; two blocks drawn into each other; and a floor that is open over
// a staircase. A room alone and every slab of a house are slabs.check.js's; faces.check.js tries
// every part of a house with every rule. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';
import { sceneOf } from './scene.js';
import { floorUnder, floorWhole, slabs } from './slabs.js';

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
const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, more) => ({ x, y, z, colour: grey, ...more });

// A part by hand: with the place of its thing, and the floor that thing stands on. A strip is
// plaster, and says nothing; a field says its surface. Of a slab the field comes first, and
// then its strips: up the plot, down the plot, up the paper, down the paper.
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
// A slab with an outer wall all round, by hand, between two heights: `edge` is the slab, and
// `field` what its four walls leave of it, each `[x, y, to x, to y]`. The two strips across the
// plot run from corner to corner, and the two along it between them.
const ring = (make, thing, stands, [low, high], surface, edge, field) => [
  make(thing, stands, [field[0], field[1], low], [field[2], field[3], high], surface),
  make(thing, stands, [edge[0], edge[1], low], [field[0], edge[3], high]),
  make(thing, stands, [field[2], edge[1], low], [edge[2], edge[3], high]),
  make(thing, stands, [field[0], field[3], low], [field[2], edge[3], high]),
  make(thing, stands, [field[0], edge[1], low], [field[2], field[1], high]),
];
// The parts that the rule alone makes of some things, by the figures above or by others.
const alone = (things, by = figures) => sceneOf(site, things, by, { blocks: [slabs] });

// TWO ROOMS THAT TOUCH over a part of a face. A hall of 2 m and a kitchen of 3 m side by side:
// they share a metre of a face - the hall lies a row further down the paper, and ends a metre
// under the kitchen's top. Glass stands against the kitchen's side down the plot, and open air
// against the hall's side down the paper: toward both a room has an outer wall.
const touching = [
  box([7, 10], [2, 5], [18, 22], { name: 'Hall' }),
  box([10, 14], [1, 4], [16, 22], { name: 'Kitchen' }),
  box([14, 17], [1, 4], [18, 22], { name: 'Greenhouse', as: 'glass' }),
  box([7, 10], [5, 8], [20, 22], { name: 'Yard', as: 'open' }),
];
assert.deepEqual(alone(touching).parts, [
  // The hall, from x = 3.5 to 5 and from y = 5.5 to 7. Down the plot it has no strip along the
  // metre it shares with the kitchen - its floor is wood to that edge - and one beside it, half a
  // metre long, so its field is two boxes. Its roof, at 107 m, is as high as the shared metre
  // reaches, and is cut alike.
  floor(0, 105, [3.875, 6, 105], [5, 6.625, 105.375], 'wood'),
  floor(0, 105, [3.875, 5.875, 105], [4.625, 6, 105.375], 'wood'),
  floor(0, 105, [3.5, 5.5, 105], [3.875, 7, 105.375]),
  floor(0, 105, [4.625, 5.5, 105], [5, 6, 105.375]),
  floor(0, 105, [3.875, 6.625, 105], [5, 7, 105.375]),
  floor(0, 105, [3.875, 5.5, 105], [4.625, 5.875, 105.375]),
  roof(0, 105, [3.875, 6, 106.6875], [5, 6.625, 107], 'concrete'),
  roof(0, 105, [3.875, 5.875, 106.6875], [4.625, 6, 107], 'concrete'),
  roof(0, 105, [3.5, 5.5, 106.6875], [3.875, 7, 107]),
  roof(0, 105, [4.625, 5.5, 106.6875], [5, 6, 107]),
  roof(0, 105, [3.875, 6.625, 106.6875], [5, 7, 107]),
  roof(0, 105, [3.875, 5.5, 106.6875], [4.625, 5.875, 107]),
  // The kitchen, from x = 5 to 7 and from y = 6 to 7.5. Up the plot its floor has a strip beside
  // the hall alone, along its first half metre, and is stone to the edge they share. Its roof
  // lies over the hall's top, where nothing is beyond that face: a rim all round.
  floor(1, 105, [5.375, 7, 105], [6.625, 7.125, 105.375], 'stone'),
  floor(1, 105, [5, 6.375, 105], [6.625, 7, 105.375], 'stone'),
  floor(1, 105, [5, 7, 105], [5.375, 7.5, 105.375]),
  floor(1, 105, [6.625, 6, 105], [7, 7.5, 105.375]),
  floor(1, 105, [5.375, 7.125, 105], [6.625, 7.5, 105.375]),
  floor(1, 105, [5, 6, 105], [6.625, 6.375, 105.375]),
  ...ring(roof, 1, 105, [107.6875, 108], 'concrete', [5, 6, 7, 7.5], [5.375, 6.375, 6.625, 7.125]),
  // Glass and open air have no wall: their floors are stone to every edge.
  floor(2, 105, [7, 6, 105], [8.5, 7.5, 105.375], 'stone'),
  floor(3, 105, [3.5, 4, 105], [5, 5.5, 105.375], 'stone'),
]);
assert.deepEqual(amiss(alone(touching)), []);
assert.deepEqual(amiss(sceneOf(site, touching, figures)), []);

// OTHER FIGURES: every number follows. Outer walls and inner walls of 0.75 m, a floor slab of
// 0.5 m and a roof slab of 0.25 m. A den of 3 m by 2 m with a nook of half a metre beside it;
// and a bay of two boxes, the lower one column wide and a metre high, the upper lying on it and
// reaching three columns past it.
const stout = { ...figures, outerWallM: 0.75, innerWallM: 0.75, floorSlabM: 0.5, roofSlabM: 0.25 };
const deep = [
  box([1, 7], [1, 5], [16, 22], { name: 'Den' }),
  box([7, 8], [1, 5], [16, 22], { name: 'Nook' }),
  box([12, 13], [1, 5], [20, 22], { name: 'Bay', group: 3 }),
  box([12, 16], [1, 5], [16, 20], { group: 3 }),
];
assert.deepEqual(alone(deep, stout).parts, [
  // The den: strips of 0.75 m, a cell and a half wide, each still one box - and none toward the
  // nook, where its field reaches the edge. Its roof is cut alike.
  floor(0, 105, [1.25, 6.25, 105], [3.5, 6.75, 105.5], 'wood'),
  floor(0, 105, [0.5, 5.5, 105], [1.25, 7.5, 105.5]),
  floor(0, 105, [1.25, 6.75, 105], [3.5, 7.5, 105.5]),
  floor(0, 105, [1.25, 5.5, 105], [3.5, 6.25, 105.5]),
  roof(0, 105, [1.25, 6.25, 107.75], [3.5, 6.75, 108], 'concrete'),
  roof(0, 105, [0.5, 5.5, 107.75], [1.25, 7.5, 108]),
  roof(0, 105, [1.25, 6.75, 107.75], [3.5, 7.5, 108]),
  roof(0, 105, [1.25, 5.5, 107.75], [3.5, 6.25, 108]),
  // The nook, half a metre wide: its outer wall down the plot is capped at a quarter of a metre,
  // half of what the nook is wide, and so is the strip. The strips along the plot are 0.75 m.
  floor(1, 105, [3.5, 6.25, 105], [3.75, 6.75, 105.5], 'wood'),
  floor(1, 105, [3.75, 5.5, 105], [4, 7.5, 105.5]),
  floor(1, 105, [3.5, 6.75, 105], [3.75, 7.5, 105.5]),
  floor(1, 105, [3.5, 5.5, 105], [3.75, 6.25, 105.5]),
  roof(1, 105, [3.5, 6.25, 107.75], [3.75, 6.75, 108], 'concrete'),
  roof(1, 105, [3.75, 5.5, 107.75], [4, 7.5, 108]),
  roof(1, 105, [3.5, 6.75, 107.75], [3.75, 7.5, 108]),
  roof(1, 105, [3.5, 5.5, 107.75], [3.75, 6.25, 108]),
  // The bay's lower box, half a metre wide, is all wall across the plot: its two walls meet in
  // its middle, and its floor - half of its height thick - is two strips and no field.
  floor(2, 105, [6, 5.5, 105], [6.25, 7.5, 105.5]),
  floor(2, 105, [6.25, 5.5, 105], [6.5, 7.5, 105.5]),
  // Its upper box has a floor where it reaches past the lower, from x = 6.5 on. Up the plot its
  // wall stands over both, 0.75 m from x = 6: the strip is the quarter of it that the floor
  // lies under. Its roof lies over all of it, with a rim all round.
  floor(3, 106, [6.75, 6.25, 106], [7.25, 6.75, 106.5], 'wood'),
  floor(3, 106, [6.5, 5.5, 106], [6.75, 7.5, 106.5]),
  floor(3, 106, [7.25, 5.5, 106], [8, 7.5, 106.5]),
  floor(3, 106, [6.75, 6.75, 106], [7.25, 7.5, 106.5]),
  floor(3, 106, [6.75, 5.5, 106], [7.25, 6.25, 106.5]),
  ...ring(roof, 3, 106, [107.75, 108], 'concrete', [6, 5.5, 8, 7.5], [6.75, 6.25, 7.25, 6.75]),
]);
assert.deepEqual(amiss(alone(deep, stout)), []);
assert.deepEqual(amiss(sceneOf(site, deep, stout)), []);
// Thickness is the figure's: where a box is high enough for its slabs, nothing holds them
// back. A room of 3 m takes a floor of 1.25 m, field and strips alike.
const thicker = { ...figures, floorSlabM: 1.25, roofSlabM: 0.5 };
const tall = alone([box([7, 11], [1, 4], [16, 22], { name: 'Kitchen' })], thicker);
const between = (of) =>
  tall.parts.filter((part) => part.of === of).map((part) => [part.min[2], part.max[2]]);
assert.deepEqual(between('floor'), Array(5).fill([105, 106.25]));
assert.deepEqual(between('roof'), Array(5).fill([107.5, 108]));
assert.deepEqual(amiss(tall), []);
// On a plot whose lines are no round figures - a column at x = 0.1 + column / 2, worked out to
// its last place - the two walls of a passage a metre wide, each half of that, end a hair apart,
// on the line between its two columns. Each slab is two strips all the same, and no field a
// hair wide between them: a wall that ends on a line of the grid, to a hair, ends on it.
const odd = { ...site, xFromM: 0.1, xToM: 12.1 };
const [from, to] = [0.1, 0.1 + 2 / 2];
assert.ok(from + (to - from) / 2 < to - (to - from) / 2);
const passage = sceneOf(odd, [box([0, 2], [1, 5], [16, 22])], stout, { blocks: [slabs] });
const made = passage.parts.map((part) => `${part.of} ${part.surface}`).join(', ');
assert.equal(made, 'floor plaster, floor plaster, roof plaster, roof plaster');
assert.deepEqual(amiss(passage), []);

// TWO BLOCKS DRAWN INTO EACH OTHER, each a metre high: a hut of three columns, and a shed drawn
// later that begins in the hut's last column. The later one holds the cells they share, and has
// the slabs there: the hut's floor and its roof end where the shed begins, at x = 1.5, with no
// strip - the hut has no wall on a cell that it does not hold - and the shed's begin there
// with none: the hut is a room. No two slabs of the two lie in each other.
const drawnIn = [
  box([1, 4], [1, 3], [20, 22], { name: 'Hut' }),
  box([3, 6], [1, 3], [20, 22], { name: 'Bath shed' }),
];
assert.deepEqual(alone(drawnIn).parts, [
  floor(0, 105, [0.875, 6.875, 105], [1.5, 7.125, 105.375], 'wood'),
  floor(0, 105, [0.5, 6.5, 105], [0.875, 7.5, 105.375]),
  floor(0, 105, [0.875, 7.125, 105], [1.5, 7.5, 105.375]),
  floor(0, 105, [0.875, 6.5, 105], [1.5, 6.875, 105.375]),
  roof(0, 105, [0.875, 6.875, 105.6875], [1.5, 7.125, 106], 'concrete'),
  roof(0, 105, [0.5, 6.5, 105.6875], [0.875, 7.5, 106]),
  roof(0, 105, [0.875, 7.125, 105.6875], [1.5, 7.5, 106]),
  roof(0, 105, [0.875, 6.5, 105.6875], [1.5, 6.875, 106]),
  floor(1, 105, [1.5, 6.875, 105], [2.625, 7.125, 105.375], 'stone'),
  floor(1, 105, [2.625, 6.5, 105], [3, 7.5, 105.375]),
  floor(1, 105, [1.5, 7.125, 105], [2.625, 7.5, 105.375]),
  floor(1, 105, [1.5, 6.5, 105], [2.625, 6.875, 105.375]),
  roof(1, 105, [1.5, 6.875, 105.6875], [2.625, 7.125, 106], 'concrete'),
  roof(1, 105, [2.625, 6.5, 105.6875], [3, 7.5, 106]),
  roof(1, 105, [1.5, 7.125, 105.6875], [2.625, 7.5, 106]),
  roof(1, 105, [1.5, 6.5, 105.6875], [2.625, 6.875, 106]),
]);
assert.deepEqual(amiss(alone(drawnIn)), []);
// And a wall stands on no cell that its box does not hold, so none reaches in over one. With
// walls of 0.75 m and the shed open air, the hut - a metre across the plot, and all wall there -
// has its strip up the plot, 0.75 m of it, the two along the plot in its last quarter metre, and
// none down the plot, where its edge is the shed's.
const porch = alone([drawnIn[0], { ...drawnIn[1], as: 'open' }], stout);
const under = porch.parts.filter((part) => part.thing === 0 && part.of === 'floor');
assert.deepEqual(under, [
  floor(0, 105, [0.5, 6.5, 105], [1.25, 7.5, 105.5]),
  floor(0, 105, [1.25, 7, 105], [1.5, 7.5, 105.5]),
  floor(0, 105, [1.25, 6.5, 105], [1.5, 7, 105.5]),
]);
assert.deepEqual(amiss(porch), []);

// A FLOOR IS OPEN OVER A STAIRCASE that comes up to it. Three rooms without a name, each with
// a staircase of 3 m: a flight against two edges of the first, under a loft; a spiral one that
// ends a metre short of the attic over its room of 4 m; and a spiral one under the open sky.
// Beside the flight a small one that ends 0.2 m under the loft, on no line of the grid. Asked
// of the rule alone, with a rule of the check's own for the staircases, which gives no part.
const stair = (kind, x, y) => ({ x, y, z: [16, 22], kind, turn: 0, fill: '#eceff2', floor: 22 });
const stairwell = [
  box([1, 12], [1, 5], [16, 22]),
  box([1, 12], [1, 5], [10, 16]),
  stair('stairs', [1, 10], [1, 3]),
  { ...stair('spiral', [10, 11], [3, 4]), z: [16.4, 22] },
  box([14, 18], [1, 5], [14, 22]),
  box([14, 18], [1, 5], [8, 14]),
  stair('spiral', [14, 18], [1, 5]),
  box([20, 24], [1, 5], [16, 22]),
  stair('spiral', [20, 24], [1, 5]),
];
const none = { stairs: () => [], spiral: () => [] };
// The three rooms, each as its edge and as the field its four walls leave: `[x, y, to x, to y]`.
const wide = [0.5, 5.5, 6, 7.5];
const inWide = [0.875, 5.875, 5.625, 7.125];
const mid = [7, 5.5, 9, 7.5];
const inMid = [7.375, 5.875, 8.625, 7.125];
const far = [10, 5.5, 12, 7.5];
const inFar = [10.375, 5.875, 11.625, 7.125];
assert.deepEqual(sceneOf(site, stairwell, figures, { blocks: [slabs], kinds: none }).parts, [
  ...ring(floor, 0, 105, [105, 105.375], 'wood', wide, inWide),
  // The loft's floor is open over the flight as the sketch has it, from x = 0.5 to 5 and from
  // y = 6.5 to 7.5, and whole beside it - over the small staircase too, which ends short of it.
  // Along the opening it has no strip, though the walls stand there, and it ends in wood: its
  // strip up the plot is a metre long, and the one up the paper begins at x = 5.
  floor(1, 108, [5, 6.5, 108], [5.625, 7.125, 108.375], 'wood'),
  floor(1, 108, [0.875, 5.875, 108], [5.625, 6.5, 108.375], 'wood'),
  floor(1, 108, [0.5, 5.5, 108], [0.875, 6.5, 108.375]),
  floor(1, 108, [5.625, 5.5, 108], [6, 7.5, 108.375]),
  floor(1, 108, [5, 7.125, 108], [5.625, 7.5, 108.375]),
  floor(1, 108, [0.875, 5.5, 108], [5.625, 5.875, 108.375]),
  ...ring(roof, 1, 108, [110.6875, 111], 'concrete', wide, inWide),
  // The attic's floor, a metre over the top of its staircase, is whole. And the roof over the
  // last staircase stays: a roof is never opened.
  ...ring(floor, 4, 105, [105, 105.375], 'wood', mid, inMid),
  ...ring(floor, 5, 109, [109, 109.375], 'wood', mid, inMid),
  ...ring(roof, 5, 109, [111.6875, 112], 'concrete', mid, inMid),
  ...ring(floor, 7, 105, [105, 105.375], 'wood', far, inFar),
  ...ring(roof, 7, 105, [107.6875, 108], 'concrete', far, inFar),
]);
// What a rule gets, taken by a rule of the check's own: to ask the questions of a cell. Of a
// cell: the slab that lies under it, and its floor taken whole, which lifts (parts.js).
const seen = [];
const probe = (context) => {
  seen.push(context);
  return [];
};
sceneOf(site, stairwell, figures, { blocks: [probe] });
const well = seen.at(-1);
for (const [cell, lies, whole, why] of [
  [[9, 2, 15], 0, 0.375, 'over the flight'],
  [[10, 2, 15], 0.375, 0.375, 'beside the flight, down the plot'],
  [[10, 3, 15], 0.375, 0.375, 'beside the flight, over the small staircase'],
  [[14, 1, 15], 0, 0, 'over the staircase of the second room, inside that room'],
]) {
  assert.deepEqual([floorUnder(well, cell), floorWhole(well, cell)], [lies, whole], why);
}
// With every rule there is, a wall of the loft beside the opening runs down to 108 m, the bottom
// of its box, and nothing is amiss - the flight 0.375 m out of the two walls it was drawn in.
const lifts = (at) => (at === 2 ? [0.375, -0.375, 0.375] : 0.375);
const built = sceneOf(site, stairwell, figures);
const feet = built.parts.filter((part) => part.thing === 1 && part.of === 'wall');
assert.deepEqual([...new Set(feet.map((part) => part.min[2]))].sort(), [108, 108.375]);
assert.deepEqual(amiss(built, lifts), []);

process.stdout.write(
  'tools/sketch/scene: a slab has a strip of plaster under each outer wall, as wide as the wall is thick, and none toward a room, over a staircase or of open air\n',
);
