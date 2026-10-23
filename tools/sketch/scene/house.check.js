// The house's check: the rules of blocks as a list, and a made-up house with every rule there
// is. Nothing here is worked out by hand but how far an object is lifted, and how far one that
// was drawn in a wall is moved out of it: what a rule makes is its own check's, and so is
// every odd case. Here the rules are tried together, on one house of an ordinary kind that has
// what they meet - rooms side by side and one over the other, open air on a room and on the
// ground, glass, two boxes of one block, and objects of the pad's own kinds on floors, in
// walls, on a roof and on the ground - so that a rule that is added later is tried against all
// that was there before it. And on that house under three tops that slope (story ST-026) - a
// room's, a block of glass's and open air's - with no place of a thing changed: the rules hold
// together and each alone, a slope changes the parts of its own block and of no other, and open
// air under one is the floor and the railing it was. Run by tools/sketch/check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { RULES } from './house.js';
import { amiss } from './holds.js';
import { sceneOf } from './scene.js';
import { slabs } from './slabs.js';

// The rules of blocks: functions, each once, floors and roofs first.
assert.ok(RULES.length > 0 && RULES.every((rule) => typeof rule === 'function'));
assert.equal(new Set(RULES).size, RULES.length);
assert.equal(RULES[0], slabs);

// A made-up plot of 14 m by 9 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 10 - row / 2, a level 130 - level / 2 metres above sea level. Its ground
// falls 10 cm a column down the plot, from 108 m, and lies the same all the way across.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 14,
  yFromM: 1,
  yToM: 10,
  sideM: [100, 130],
  outline: [
    [0.5, 9.5],
    [13.5, 9.5],
    [0.5, 1.5],
  ],
  ground: {
    baseM: 100,
    rowsCm: Array(19).fill(
      Array.from({ length: 29 }, (point, column) => 800 - 10 * column).join(' '),
    ),
  },
};
// Made-up figures with which this house can be built: a door and a window fit under a ceiling,
// and a railing on its slab into the open air it stands in.
const figures = {
  outerWallM: 0.375,
  innerWallM: 0.25,
  floorSlabM: 0.375,
  roofSlabM: 0.3125,
  railingHighM: 1,
  doorHighM: 2,
  windowHighM: 1.25,
  sillHighM: 0.875,
};

// The house, in cells: its lower storey on level 46, at 107 m - dug into the hill at one end
// and clear of it at the other - and its upper one on level 40, at 110 m. A storey is 3 m.
const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, more) => ({ x, y, z, colour: grey, ...more });
const thing = (kind, x, y, z, floor) => ({ x, y, z, kind, turn: 0, fill: '#b0b0b0', floor });
const things = [
  // 0 to 3: a living room and a kitchen side by side; a bedroom over the one, and open air - a
  // terrace, a metre and a half high - over the other.
  box([2, 12], [2, 8], [40, 46], { name: 'Living room' }),
  box([12, 18], [2, 8], [40, 46], { name: 'Kitchen' }),
  box([2, 12], [2, 8], [34, 40], { name: 'Bedroom' }),
  box([12, 18], [2, 8], [37, 40], { name: 'Terrace', as: 'open' }),
  // 4 to 6: a garage of two boxes side by side, the second lower, and glass on the first.
  box([18, 24], [2, 8], [40, 46], { name: 'Garage', group: 2 }),
  box([24, 26], [4, 8], [42, 46], { group: 2 }),
  box([18, 22], [2, 6], [34, 40], { name: 'Greenhouse', as: 'glass' }),
  // 7: open air on the ground, against the living room's side.
  box([2, 12], [8, 14], [43, 46], { name: 'Garden', as: 'open' }),
  // 8 and 9: a stair tower of two boxes, one over the other, against the kitchen's side.
  box([12, 16], [8, 12], [40, 46], { name: 'Stairs', group: 5 }),
  box([12, 16], [8, 12], [34, 40], { group: 5 }),
  // 10: a bed in the bedroom, on its floor.
  thing('bed', [3, 7], [3, 7], [38, 40], 40),
  // 11 and 12: a door across the face that the living room and the kitchen share, a cell in
  // each, as high as the figure; and a window in the living room's face up the paper, its sill
  // as high over the floor as the figure, and as high as the figure itself.
  thing('door', [11, 13], [4, 6], [42, 46], 46),
  thing('window', [4, 7], [1.7, 2.3], [41.75, 44.25], 46),
  // 13 and 14: a staircase of one storey along the living room's other side, and a spiral one
  // as large as the tower's lower box.
  thing('stairs', [2, 11], [6, 8], [40, 46], 46),
  thing('spiral', [12, 16], [8, 12], [40, 46], 46),
  // 15: a tree on the ground, which lies at 107.5 m under its middle - on level 45.
  thing('tree', [3, 7], [15, 17], [33, 45], 45),
  // 16 and 17: a table on the terrace's floor, and a chair on the bedroom's roof.
  thing('table', [13, 17], [4, 6], [38.5, 40], 40),
  thing('chair', [4, 5], [4, 5], [32.2, 34], 34),
];
// How far each object is lifted, by hand: the floor slab's 0.375 m where it stands on the
// floor of a block - the bed, the door, the window, the two staircases and the table - and
// nothing on the ground and on a roof.
const lifted = [10, 11, 12, 13, 14, 16];
// And how far the two staircases stand from where the sketch has them, each `[dx, dy, dh]`:
// both were drawn in walls, and give way (clear.js). The flight lies in the living room's
// corner, in two outer walls of 0.375 m - the house's edge, and the one toward the garden: it
// is moved out of both, and then ends at the face of the half wall toward the kitchen. The
// spiral one is as large as its tower and is cut to what the walls leave, 1.25 m by 1.5 m: its
// middle moves 0.125 m toward the kitchen, where half a wall of two rooms takes 0.125 m of the
// tower and the outer wall across from it 0.375 m.
const moved = { 13: [0.375, 0.375, 0.375], 14: [0, 0.125, 0.375] };
const lift = (at) => moved[at] ?? (lifted.includes(at) ? 0.375 : 0);

// With every rule there is, the three things hold of every part of this house, and each part
// is a part (holds.js). And with each rule of blocks alone: a rule that breaks them is named.
const scene = sceneOf(site, things, figures);
assert.deepEqual(amiss(scene, lift), []);
for (const rule of RULES) {
  assert.deepEqual(amiss(sceneOf(site, things, figures, { blocks: [rule] }), lift), [], rule.name);
}

// Every box of a block has a part, the parts come in the order of their things, and they are
// plain data: written down and read again, they are the same.
const places = scene.parts.map((part) => part.thing);
const inOrder = [...places].sort((a, b) => a - b);
assert.deepEqual(places, inOrder);
for (let at = 0; at < 10; at += 1) assert.ok(places.includes(at), `block ${at} has no part`);
assert.deepEqual(JSON.parse(JSON.stringify(scene.parts)), scene.parts);

// THE SAME HOUSE UNDER THREE TOPS THAT SLOPE (story ST-026), with no place of a thing changed.
// Each row: a block, its top as its thing says it - in rows of a standing view, at the first
// end of its box along the slope and at the second - and as its solid is to say it, by hand,
// in metres: a level is 130 - level / 2, and across the plot the rows count the other way
// round than the metres. The bedroom's top falls 2 m down the plot, from 113 m at its uphill
// end to 111 m, a metre over its floor; the terrace's, open air, comes down across the plot
// from 111.5 m at the house's edge to its floor, 110 m; and the greenhouse's falls 2 m across
// the plot, from 113 m at the house's edge to 111 m.
const TOPS = [
  [2, { axis: 'x', rows: [34, 38] }, { along: 0, high: [113, 111] }],
  [3, { axis: 'y', rows: [37, 40] }, { along: 1, high: [110, 111.5] }],
  [6, { axis: 'y', rows: [34, 38] }, { along: 1, high: [111, 113] }],
];
const sloped = things.map((one, at) => {
  const top = TOPS.find(([place]) => place === at)?.[1];
  return top ? { ...one, top } : one;
});
const under = sceneOf(site, sloped, figures);
for (const [at, , said] of TOPS) assert.deepEqual(under.solids[at].top, said, `the top of ${at}`);
// With every rule there is, and with each rule of blocks alone, nothing is amiss of it: no
// roof, no wall, no pane and no frame rises over the top of its block, and all else holds.
assert.deepEqual(amiss(under, lift), []);
for (const rule of RULES) {
  assert.deepEqual(amiss(sceneOf(site, sloped, figures, { blocks: [rule] }), lift), [], rule.name);
}
// A slope is the top of its own block. The room and the glass under one are built anew: what
// closes each from above slopes, all of it. Every other thing of the house has the parts it
// had, to the last figure and in their order - what stands beside a sloping block, under it,
// in it and on it. Open air under a slope is among those: the terrace is the floor and the
// railing it was, though its top comes down to its floor.
const partsOf = (of, at) => of.parts.filter((part) => part.thing === at);
things.forEach((one, at) => {
  if (![2, 6].includes(at)) return assert.deepEqual(partsOf(under, at), partsOf(scene, at));
  const roof = partsOf(under, at).filter((part) => part.over);
  return assert.ok(roof.length > 0 && roof.every((part) => part.shape === 'slant'), `block ${at}`);
});
assert.deepEqual([...new Set(partsOf(under, 3).map((part) => part.of))], ['floor', 'rail']);
assert.deepEqual(JSON.parse(JSON.stringify(under.parts)), under.parts);

process.stdout.write(
  'tools/sketch/scene: with every rule there is, a made-up house holds what holds of every part, under tops that slope too\n',
);
