// The check of the objects' parts: made-up objects in and around a made-up room, against the
// parts a person worked out by hand - a kind with no rule as one box, a tree as a trunk and a
// crown, a bush as a dome - each lifted by the floor's slab where it stands on a block's floor
// or on a level inside the block, and not where it stands on the ground or on a roof; and each
// clear of the walls of its room (clear.js). Run by tools/sketch/check.js, as every
// *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';
import { KINDS } from './objects.js';
import { sceneOf } from './scene.js';

// A made-up plot of 10 m by 4 m, in cells of half a metre: a column is x = column / 2 - 2, a
// row of the top view y = 6 - row / 2, and a level 212 - level / 2 metres above sea level. Its
// ground is flat, at 204.75 m: half a cell under level 14, in row 14.5 of a standing paper.
const site = {
  cellM: 0.5,
  xFromM: -2,
  xToM: 8,
  yFromM: 2,
  yToM: 6,
  sideM: [200, 212],
  outline: [
    [-1, 5],
    [7, 5],
    [-1, 3],
  ],
  ground: { baseM: 200, rowsCm: Array(9).fill(Array(21).fill('475').join(' ')) },
};
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

// A room of 3 m by 2 m, 3 m high, on level 14, at 205 m: its floor slab is 0.375 m thick. A
// low block of half a metre's height beside it: its floor slab is half of that, 0.25 m. And
// thirteen objects. A gnome is a kind that has no rule, and never will have one.
const grey = { name: 'grey', hex: '#8795a1' };
const thing = (kind, x, y, z, floor) => ({ x, y, z, kind, turn: 0, fill: '#b0b0b0', floor });
const things = [
  { x: [2, 8], y: [2, 6], z: [8, 14], colour: grey, name: 'Room' },
  // 1 to 4: a gnome on the room's floor; one on the ground beside the house; one on the room's
  // roof; and one halfway up the room, on a level inside the block, where it has no floor.
  thing('gnome', [3, 5], [3, 4], [12, 14], 14),
  thing('gnome', [10, 11], [3, 4], [12.5, 14.5], 14.5),
  thing('gnome', [3, 4], [3, 4], [6, 8], 8),
  thing('gnome', [6, 7], [3, 4], [9, 11], 11),
  // 5 to 7: a tree of 6 m on the ground, 2 m wide and 1 m deep; a tree of 2 m in the room, on
  // its floor, drawn into its corner down the plot and down the paper; and a bush on the ground.
  thing('tree', [10, 14], [4, 6], [2.5, 14.5], 14.5),
  thing('tree', [6, 8], [4, 6], [10, 14], 14),
  thing('bush', [12, 14], [2, 4], [13.5, 14.5], 14.5),
  // 8 and 9: a pane in a face of the room - an eighth of a cell out of it on either side, its
  // middle on the line between the room and the open - in the side down the top view's paper,
  // and in the side up it. Both stand on the room's floor, a metre over it. The first is off
  // the line by its last figure, as a place is that was worked out: it lies on it all the same.
  thing('gnome', [3, 6], [5.875, 6.125000000001], [10, 12], 14),
  thing('gnome', [3, 6], [1.875, 2.125], [10, 12], 14),
  { x: [16, 18], y: [2, 4], z: [13, 14], colour: grey, name: 'Low' },
  // 11: a gnome on the low block's floor.
  thing('gnome', [16, 17], [2, 3], [12, 14], 14),
  // 12 to 14, each near a floor and on none: a gnome on the ground where the room stands, a
  // quarter of a metre under the room's floor; one that stands a quarter of a metre over that
  // floor, between two levels; and one beside the room, on the level of its floor, its middle
  // half a cell from the room's face.
  thing('gnome', [4, 5], [4, 5], [12.5, 14.5], 14.5),
  thing('gnome', [5, 6], [4, 5], [11.5, 13.5], 13.5),
  thing('gnome', [1, 2], [3, 4], [12, 14], 14),
];

// A figure that a person works out in tenths and one that is worked out in halves of halves
// differ in their last place: both are held to a millionth of a millimetre.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 : one,
  );
const piece = (place, stands, shape, min, max, surface) => ({
  of: 'piece',
  shape,
  min,
  max,
  surface,
  thing: place,
  floor: stands,
});
const byHand = [
  // On the room's floor: lifted by the slab, 0.375 m - and its `floor` is the room's still.
  piece(1, 205, 'box', [-0.5, 4, 205.375], [0.5, 4.5, 206.375], 'plain'),
  // On the ground, and on the roof at 208 m: where they are. Halfway up the room, at 206.5 m:
  // lifted by the room's floor slab, as what stands on its floor is - its `floor` is its own.
  piece(2, 204.75, 'box', [3, 4, 204.75], [3.5, 4.5, 205.75], 'plain'),
  piece(3, 208, 'box', [-0.5, 4, 208], [0, 4.5, 209], 'plain'),
  piece(4, 206.5, 'box', [1, 4, 206.875], [1.5, 4.5, 207.875], 'plain'),
  // The tree on the ground, 6 m high about x = 4, y = 3.5. Its crown is as wide as the tree and
  // takes 0.68 of its height: from 210.75 - 4.08 m up. Its trunk is 0.08 of the tree's width
  // and of its depth - 0.16 m by 0.08 m - and ends where the crown begins.
  piece(5, 204.75, 'round', [3.92, 3.46, 204.75], [4.08, 3.54, 206.67], 'wood'),
  piece(5, 204.75, 'ball', [3, 3, 206.67], [5, 4, 210.75], 'leaf'),
  // The tree in the room, 2 m high. The sketch has it about x = 1.5, y = 3.5, in two outer
  // walls of 0.375 m, whose faces lie at x = 1.625 and y = 3.375: it is moved out of both, and
  // stands about x = 1.125, y = 3.875. The crown from 207 - 1.36 m up, the trunk 0.08 m across
  // - and both lifted by the slab.
  piece(6, 205, 'round', [1.085, 3.835, 205.375], [1.165, 3.915, 206.015], 'wood'),
  piece(6, 205, 'ball', [0.625, 3.375, 206.015], [1.625, 4.375, 207.375], 'leaf'),
  // The bush: a dome as wide and as high as its box.
  piece(7, 204.75, 'dome', [4, 4, 204.75], [5, 5, 205.25], 'leaf'),
  // The two panes, about y = 3 and about y = 5: lifted alike, in whichever face.
  piece(8, 205, 'box', [-0.5, 2.9375, 206.375], [1, 3.0625, 207.375], 'plain'),
  piece(9, 205, 'box', [-0.5, 4.9375, 206.375], [1, 5.0625, 207.375], 'plain'),
  // On the low block's floor: lifted by that slab, 0.25 m. The block is a metre each way, and
  // its outer walls leave a quarter of a metre clear, from 6.375 and from 4.375: the gnome,
  // half a metre each way and drawn into its corner, is cut to that - half of itself.
  piece(11, 205, 'box', [6.375, 4.375, 205.25], [6.625, 4.625, 206.25], 'plain'),
  // Near a floor and on none - under the room, over its floor, beside it: each where it is.
  piece(12, 204.75, 'box', [0, 3.5, 204.75], [0.5, 4, 205.75], 'plain'),
  piece(13, 205.25, 'box', [0.5, 3.5, 205.25], [1, 4, 206.25], 'plain'),
  piece(14, 205, 'box', [-1.5, 4, 205], [-1, 4.5, 206], 'plain'),
];
const scene = sceneOf(site, things, figures);
const ofObjects = (parts) => parts.filter((part) => things[part.thing].kind !== undefined);
assert.deepEqual(held(ofObjects(scene.parts)), held(byHand));
// A tree and a bush have a rule, and a gnome has none.
assert.deepEqual(
  [typeof KINDS.tree, typeof KINDS.bush, typeof KINDS.gnome],
  ['function', 'function', 'undefined'],
);

// How far each is lifted, by hand: asked of what a rule gets, which a rule of the check's own
// takes. A block is lifted by nothing. And how far the middle of the two has moved that were
// drawn in walls, along the plot and across it: the tree out of its corner, and the gnome on
// the low block to the middle of that block.
const lifts = [0, 0.375, 0, 0, 0.375, 0, 0.375, 0, 0.375, 0.375, 0, 0.25, 0, 0, 0];
const moves = { 6: [-0.375, 0.375], 11: [0.25, -0.25] };
const byHandLifted = (at) => (moves[at] ? [...moves[at], lifts[at]] : lifts[at]);
const seen = [];
const probe = (context) => {
  seen.push(context);
  return [];
};
sceneOf(site, things, figures, { blocks: [probe] });
const lifted = things.map((one, at) => seen[0].lift(at));
assert.deepEqual(lifted, lifts);

// The three things hold: every part within the box of its object, lifted and moved as the hand
// says, and the trunk of a tree and its crown touch, and do not lie in each other. Told of no
// lift, the same question finds every object that is lifted, by the part that reaches its top
// - of the tree in the room the crown: the lift is no figure of speech.
assert.deepEqual(amiss(scene, byHandLifted), []);
const found = /^part \d+, a piece of thing (\d+), does not lie within the box of its object/;
const outside = amiss(scene).map((words) => found.exec(words)?.[1]);
assert.deepEqual(outside, ['1', '4', '6', '8', '9', '11']);

// A rule for a kind, told by the check: a gnome in two halves, one on the other. It gets what
// a rule of blocks gets and the place of its object, every part it gives is lifted, and the
// trees, whose kind has no rule among those told, are a plain box each.
const halved = (context, at) => {
  const { min, max } = context.boxOf(context.things[at]);
  const half = (min[2] + max[2]) / 2;
  return [
    { of: 'piece', shape: 'box', min, max: [max[0], max[1], half], surface: 'wood' },
    { of: 'piece', shape: 'box', min: [min[0], min[1], half], max, surface: 'fabric' },
  ];
};
const told = sceneOf(site, things, figures, { kinds: { gnome: halved } });
assert.deepEqual(held(ofObjects(told.parts).slice(0, 2)), [
  piece(1, 205, 'box', [-0.5, 4, 205.375], [0.5, 4.5, 205.875], 'wood'),
  piece(1, 205, 'box', [-0.5, 4, 205.875], [0.5, 4.5, 206.375], 'fabric'),
]);
assert.deepEqual(
  held(told.parts.filter((part) => part.thing === 5)),
  held([piece(5, 204.75, 'box', [3, 3, 204.75], [5, 4, 210.75], 'plain')]),
);
assert.deepEqual(amiss(told, byHandLifted), []);

// A kind is looked up among the rules alone: one that is named as something every list has is
// a kind with no rule, and a plain box.
const odd = sceneOf(site, [thing('constructor', [1, 2], [1, 2], [12.5, 14.5], 14.5)], figures);
assert.deepEqual(odd.parts, [
  piece(0, 204.75, 'box', [-1.5, 5, 204.75], [-1, 5.5, 205.75], 'plain'),
]);

process.stdout.write(
  'tools/sketch/scene: an object is the shape of its kind, and stands on the slab of its floor\n',
);
