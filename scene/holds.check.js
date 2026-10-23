// The check of what holds of every part: a made-up scene in which all of it holds, and then the
// same scene with one thing wrong at a time - a part outside its block, outside its lifted
// object, two surfaces in each other, a part that is no part - each of which `amiss` has to
// find, and say in words. And objects that were moved clear of a wall: within their moved
// boxes, and found outside them. And what is asked of a part under a top that slopes. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';

// A made-up scene, as far as the question reads it: six solids, and the parts made of them. Two
// rooms side by side, 4 m by 3 m and 3 m high, on a floor at 100 m. A bed that the sketch puts
// into the wall of the first, and a rug under it and past it: both stand on the floor slab, a
// quarter of a metre up. A spiral staircase and a tree in the second room, which nothing lifts.
const solids = [
  { min: [0, 0, 100], max: [4, 3, 103], floor: 100 },
  { min: [4, 0, 100], max: [8, 3, 103], floor: 100 },
  { min: [0, 1, 100], max: [2, 2, 101], kind: 'bed', floor: 100 },
  { min: [1, 1, 100], max: [3, 2.5, 100.125], kind: 'rug', floor: 100 },
  { min: [6, 1, 100], max: [7, 2, 103], kind: 'spiral', floor: 100 },
  { min: [5, 1, 100], max: [6, 2, 102], kind: 'tree', floor: 100 },
];
const lifted = (at) => ({ 2: 0.25, 3: 0.25 })[at] ?? 0;
const part = (thing, of, shape, min, max, surface, more) => ({
  of,
  shape,
  min,
  max,
  surface,
  thing,
  floor: 100,
  ...more,
});
const winding = { about: [6.5, 1.5], from: 0, to: 30, inner: 0.125, outer: 0.5 };
const parts = [
  // 0 to 2, of the first room: its floor, and two walls that stand on the floor and lie in each
  // other at their corner - of one surface, which may.
  part(0, 'floor', 'box', [0, 0, 100], [4, 3, 100.25], 'wood'),
  part(0, 'wall', 'box', [0, 0, 100.25], [0.25, 3, 103], 'plaster'),
  part(0, 'wall', 'box', [0, 0, 100.25], [4, 0.25, 103], 'plaster'),
  // 3 and 4, of the second: a floor of another surface, which touches the first, and a roof.
  part(1, 'floor', 'box', [4, 0, 100], [8, 3, 100.25], 'stone'),
  part(1, 'roof', 'box', [4, 0, 102.75], [8, 3, 103], 'concrete', { over: true }),
  // 5 and 6, the bed: a frame, which lies in the first room's wall, and a mattress on it.
  part(2, 'piece', 'box', [0, 1, 100.25], [2, 2, 100.75], 'wood'),
  part(2, 'piece', 'box', [0, 1, 100.75], [2, 2, 101.25], 'fabric'),
  // 7, the rug, which lies in the bed's frame: two objects are not asked of each other.
  part(3, 'piece', 'box', [1, 1, 100.25], [3, 2.5, 100.375], 'fabric'),
  // 8, a tread of the staircase, which lies in the second room's floor: an object and a block
  // are not asked of each other either.
  part(4, 'step', 'wedge', [6.5, 1.5, 100], [7, 1.75, 100.25], 'wood', winding),
  // 9 and 10, the tree: a trunk that ends where the box of its crown begins.
  part(5, 'piece', 'round', [5.46, 1.46, 100], [5.54, 1.54, 100.64], 'wood'),
  part(5, 'piece', 'ball', [5, 1, 100.64], [6, 2, 102], 'leaf'),
];
// The scene with some parts changed, and what is amiss of it: `changes` has, under the place of
// a part, what that part is to say instead.
const scene = (changes = {}) => ({
  solids,
  parts: parts.map((one, at) => ({ ...one, ...changes[at] })),
});
const said = (changes) => amiss(scene(changes), lifted);

// All of it holds, as it is made up.
assert.deepEqual(said(), []);

// 1. A part of a block lies within the box of its block: a wall a millimetre out of its room
// and a roof half a metre over it are found - and a figure that is off by less than a hair,
// as one is that was worked out in another way, is not.
assert.deepEqual(said({ 1: { min: [-0.001, 0, 100.25] } }), [
  'part 1, a wall of thing 0, does not lie within the box of its block',
]);
assert.deepEqual(said({ 4: { max: [8, 3, 103.5] } }), [
  'part 4, a roof of thing 1, does not lie within the box of its block',
]);
assert.deepEqual(said({ 1: { min: [-1e-12, 0, 100.25] } }), []);

// 2. A part of an object lies within the box of its object, lifted as the object is: a
// mattress that reaches over the lifted bed is found, and a frame that begins under it, on
// the floor's own height. Told of no lift, the mattress and the rug are found, which reach
// over the boxes that the sketch has.
assert.deepEqual(said({ 6: { max: [2, 2, 101.3] } }), [
  'part 6, a piece of thing 2, does not lie within the box of its object, lifted as it is',
]);
assert.deepEqual(said({ 5: { min: [0, 1, 100] } }), [
  'part 5, a piece of thing 2, does not lie within the box of its object, lifted as it is',
]);
assert.deepEqual(amiss(scene()), [
  'part 6, a piece of thing 2, does not lie within the box of its object, lifted as it is',
  'part 7, a piece of thing 3, does not lie within the box of its object, lifted as it is',
]);
// A lift is an object's: told that every place is lifted, the question finds the tread and the
// trunk, which stand where nothing lifts them, and no part of a block - a block is not lifted.
assert.deepEqual(
  amiss(scene(), () => 0.25),
  [
    'part 8, a step of thing 4, does not lie within the box of its object, lifted as it is',
    'part 9, a piece of thing 5, does not lie within the box of its object, lifted as it is',
  ],
);
// A check that gives no number for an object that has parts is told so, once for the object,
// however many parts it has. A trunk that stands two metres beside its tree is found by a check
// that says how far the tree is lifted. Compared with what is no number it would pass: so the
// object is named instead, whether it is given nothing at all or what is no figure - and its
// parts are still asked of each other, which needs no lift.
const strayed = { 9: { min: [3.46, 1.46, 100], max: [3.54, 1.54, 100.64] } };
assert.deepEqual(said(strayed), [
  'part 9, a piece of thing 5, does not lie within the box of its object, lifted as it is',
]);
for (const untold of [undefined, Number.NaN, null]) {
  const told = (at) => ({ 2: 0.25, 3: 0.25, 4: 0, 5: untold })[at];
  assert.deepEqual(amiss(scene(strayed), told), [
    'thing 5, a tree that has parts, was given no lift',
  ]);
}
assert.deepEqual(
  amiss(scene({ 9: { max: [5.54, 1.54, 100.9] } }), (at) => ({ 2: 0.25, 3: 0.25 })[at]),
  [
    'thing 4, a spiral that has parts, was given no lift',
    'thing 5, a tree that has parts, was given no lift',
    'part 9, a piece of thing 5, of wood, and part 10, a piece of thing 5, of leaf, lie in each other',
  ],
);
// An object that has no part needs no lift, and neither does a block: nothing is said of them.
assert.deepEqual(
  amiss({ solids, parts: parts.slice(0, 5) }, () => undefined),
  [],
);

// 3. No two parts of different surfaces lie in each other. Among the parts of the blocks: a
// wall that begins at the bottom of its room lies in the floor; a floor that reaches into the
// room beside it lies in that room's floor, and is outside its own block too.
assert.deepEqual(said({ 1: { min: [0, 0, 100] } }), [
  'part 0, a floor of thing 0, of wood, and part 1, a wall of thing 0, of plaster, lie in each other',
]);
assert.deepEqual(said({ 3: { min: [3.5, 0, 100] } }), [
  'part 3, a floor of thing 1, does not lie within the box of its block',
  'part 0, a floor of thing 0, of wood, and part 3, a floor of thing 1, of stone, lie in each other',
]);
// Among the parts of one object: a mattress that begins in its frame. Of one surface, the two
// may lie in each other, as the two walls do.
assert.deepEqual(said({ 6: { min: [0, 1, 100.5] } }), [
  'part 5, a piece of thing 2, of wood, and part 6, a piece of thing 2, of fabric, lie in each other',
]);
assert.deepEqual(said({ 6: { min: [0, 1, 100.5], surface: 'wood' } }), []);
// What is round is asked by the box around it: a trunk that reaches up into its crown, to 0.45
// of the tree's height, as the 3D view draws a tree, lies in it.
assert.deepEqual(said({ 9: { max: [5.54, 1.54, 100.9] } }), [
  'part 9, a piece of thing 5, of wood, and part 10, a piece of thing 5, of leaf, lie in each other',
]);

// And a part is what the contract says a part is. One thing wrong at a time, each said in a
// sentence of its own, and of such a part nothing more is asked.
for (const [change, words] of [
  [{ of: 'ceiling' }, 'part 2, a ceiling of thing 0, is of nothing the scene knows: ceiling'],
  [
    { shape: 'cylinder' },
    'part 2, a wall of thing 0, has a shape the scene does not know: cylinder',
  ],
  [{ surface: 'timber' }, 'part 2, a wall of thing 0, is of no surface: timber'],
  [{ surface: 'constructor' }, 'part 2, a wall of thing 0, is of no surface: constructor'],
  [{ thing: 9 }, 'part 2, a wall of thing 9, is made of no thing: 9'],
  [{ floor: 101 }, 'part 2, a wall of thing 0, does not stand on the floor of its thing'],
  [{ min: [0, 0] }, 'part 2, a wall of thing 0, has no box'],
  [{ max: [4, 0.25, Number.NaN] }, 'part 2, a wall of thing 0, has no box'],
  [{ max: [4, 0, 103] }, 'part 2, a wall of thing 0, has no size'],
  [{ over: false }, 'part 2, a wall of thing 0, says over, and not true'],
  [{ min: [-1, 0, 100], surface: 'timber' }, 'part 2, a wall of thing 0, is of no surface: timber'],
]) {
  assert.deepEqual(said({ 2: change }), [words]);
}
// A wedge says what it winds round, from where to where, and how far out - and no other shape
// says any of it.
const wedge =
  /^part \d+, a \w+ of thing \d, says of a wedge what it should not, or not what it should/;
for (const changes of [
  { 8: { about: [6.5] } },
  { 8: { outer: undefined } },
  { 8: { shape: 'box' } },
  { 2: { inner: 0.125 } },
]) {
  const [words, ...more] = said(changes);
  assert.match(words, wedge);
  assert.deepEqual(more, []);
}

// AN OBJECT THAT WAS MOVED clear of a wall (clear.js) is told as `[dx, dy, dh]`: how far its
// middle moved along the plot and across it, and how far it is lifted. A second made-up scene:
// a room, a toilet that the sketch has in its corner, and a flight of a metre's width against
// its edge. Their parts stand where they give way to: the toilet 0.375 m out of either wall,
// as large as it was; the flight cut to half its width, about a middle 0.375 m further in.
const drawn = [
  { min: [0, 0, 100], max: [4, 3, 103], floor: 100 },
  { min: [0, 0, 100], max: [0.5, 0.5, 100.5], kind: 'toilet', floor: 100 },
  { min: [1, 0, 100], max: [3, 1, 103], kind: 'stairs', floor: 100 },
];
const stood = [
  part(1, 'piece', 'box', [0.375, 0.375, 100.25], [0.875, 0.875, 100.75], 'plain'),
  part(2, 'step', 'box', [1, 0.625, 100.25], [3, 1.125, 103.25], 'concrete'),
];
const movedBy = (at) => ({ 1: [0.375, 0.375, 0.25], 2: [0, 0.375, 0.25] })[at];
const ofMoved = (liftOf, changes = {}) =>
  amiss({ solids: drawn, parts: stood.map((one, at) => ({ ...one, ...changes[at] })) }, liftOf);
const beyond = (at, of, thing, how) =>
  `part ${at}, a ${of} of thing ${thing}, does not lie within the box of its object, ${how} as it is`;
// Told how far each moved, both lie within their boxes - the flight as it is, cut: it is
// narrower than its box, about the middle that the box was moved to.
assert.deepEqual(ofMoved(movedBy), []);
// A part outside its moved box is still found: a millimetre past it, along the plot, across
// it and up; and where the sketch has the object, which is no longer where its box is.
for (const max of [
  [0.876, 0.875, 100.75],
  [0.875, 0.876, 100.75],
  [0.875, 0.875, 100.751],
]) {
  assert.deepEqual(ofMoved(movedBy, { 0: { max } }), [beyond(0, 'piece', 1, 'moved and lifted')]);
}
const unmoved = { min: [0, 0, 100.25], max: [0.5, 0.5, 100.75] };
assert.deepEqual(ofMoved(movedBy, { 0: unmoved }), [beyond(0, 'piece', 1, 'moved and lifted')]);
// Told the lift alone, as a number, both are found: the toilet past its box as it was drawn,
// and the flight too - cut, it reaches past the edge of the box that it was moved from.
assert.deepEqual(
  ofMoved(() => 0.25),
  [beyond(0, 'piece', 1, 'lifted'), beyond(1, 'step', 2, 'lifted')],
);
// The two writings say one thing of an object that was not moved: in the first scene, every
// lift as `[0, 0, dh]` finds nothing, and finds the mattress that reaches over its bed.
const written = (at) => [0, 0, lifted(at)];
assert.deepEqual(amiss(scene(), written), []);
assert.deepEqual(amiss(scene({ 6: { max: [2, 2, 101.3] } }), written), [
  beyond(6, 'piece', 2, 'moved and lifted'),
]);
// And what is neither writing is no lift: two figures, a figure that is none, a word.
for (const untold of [[0.375, 0.375], [0.375, Number.NaN, 0.25], '0.25', {}]) {
  assert.deepEqual(
    ofMoved((at) => (at === 1 ? untold : movedBy(at))),
    ['thing 1, a toilet that has parts, was given no lift'],
  );
}

// UNDER A TOP THAT SLOPES (story ST-026) a part is asked by what it fills. A third made-up
// scene: a room of 4 m by 3 m whose top falls down the plot, from 103 m to 101 m, and a block
// of glass whose top rises across it, from 101 m to 103 m over 4 m. The room has a floor, a
// wall up to its top and beside that a roof under it, a quarter of a metre thick; the glass a
// pane that ends under a sloping bar an eighth thick, whose box lies in the pane's own. Under
// the roof stands an inner wall of 2 m, a box of 101.5 m, and over its lower half a railing,
// level from 102 m up, where the roof begins to fall away under it: both in the roof's box.
const sloping = [
  { min: [0, 0, 100], max: [4, 3, 103], floor: 100, top: { along: 0, high: [103, 101] } },
  { min: [4, 0, 100], max: [8, 4, 103], floor: 100, top: { along: 1, high: [101, 103] } },
];
const slant = (thing, of, min, max, surface, along, low, high) =>
  part(thing, of, 'slant', min, max, surface, { along, low, high });
const under = [
  part(0, 'floor', 'box', [0, 0, 100], [4, 3, 100.25], 'wood'),
  slant(0, 'wall', [0, 0, 100.25], [4, 0.25, 103], 'plaster', 0, [100.25, 100.25], [103, 101]),
  slant(0, 'roof', [0, 0.25, 100.75], [4, 3, 103], 'concrete', 0, [102.75, 100.75], [103, 101]),
  slant(1, 'pane', [4, 0, 100], [4.125, 4, 102.875], 'glass', 1, [100, 100], [100.875, 102.875]),
  slant(1, 'frame', [4, 0, 100.875], [4.25, 4, 103], 'metal', 1, [100.875, 102.875], [101, 103]),
  part(0, 'wall', 'box', [0, 1, 100.25], [2, 1.25, 101.5], 'plaster'),
  part(0, 'rail', 'box', [2, 1, 102], [4, 1.25, 103], 'metal'),
];
const sloped = (changes = {}) =>
  amiss({ solids: sloping, parts: under.map((one, at) => ({ ...one, ...changes[at] })) });
const who = (at) => `part ${at}, a ${under[at].of} of thing ${under[at].thing},`;
const rises = (at) => `${who(at)} rises over the top of its block`;
const meet = (a, b) =>
  `${who(a)} of ${under[a].surface}, and ${who(b)} of ${under[b].surface}, lie in each other`;
assert.deepEqual(sloped(), []);
// Within its block is under its top: a wall a millimetre over it at its low end is found, and
// one a hair over it is not. A floor and a railing are not asked that - the railing above
// stands over the top. Where the top comes down to the floor of its block, the floor's slab
// stands over it, level as it was: found only where it is said to be a roof, a wall, a pane
// or a frame.
assert.deepEqual(sloped({ 1: { high: [103, 101.001] } }), [rises(1)]);
assert.deepEqual(sloped({ 1: { high: [103, 101 + 1e-12] } }), []);
const low = [{ ...sloping[0], top: { along: 0, high: [103, 100] } }];
const slab = (of) => amiss({ solids: low, parts: [{ ...under[0], of }] }).length;
assert.deepEqual(['floor', 'rail', 'roof', 'wall', 'pane', 'frame'].map(slab), [0, 0, 1, 1, 1, 1]);
// Two surfaces lie in each other where what both fill is something: a roof that reaches over
// the wall beside it, a pane that rises into its bar, a floor raised into the wall - a box and
// a slant. Over the inner wall the top comes down to 102 m and the roof's bottom to 101.75 m:
// at 102 m that wall lies in the roof, and as the rules of before make it, a box as high as
// its block, over the top as well. The railing, lowered by a quarter, lies in the roof where
// the roof is highest under it. What a slant is by itself, and how one is asked that slopes
// along another extent than its block's top or than another slant, is tops.check.js's.
assert.deepEqual(sloped({ 2: { min: [0, 0, 100.75] } }), [meet(1, 2)]);
assert.deepEqual(sloped({ 3: { high: [101, 103], max: [4.125, 4, 103] } }), [meet(3, 4)]);
assert.deepEqual(sloped({ 0: { max: [4, 3, 100.5] } }), [meet(0, 1), meet(0, 5)]);
assert.deepEqual(sloped({ 5: { max: [2, 1.25, 102] } }), [meet(2, 5)]);
assert.deepEqual(sloped({ 5: { max: [2, 1.25, 103] } }), [rises(5), meet(2, 5)]);
assert.deepEqual(sloped({ 6: { min: [2, 1, 101.75] } }), [meet(2, 6)]);

process.stdout.write(
  'tools/sketch/scene: what holds of every part is found where it does not hold, and only there\n',
);
