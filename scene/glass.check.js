// The check of glass: made-up blocks of glass on a made-up plot, against the panes and the
// frames a person worked out by hand - a glasshouse alone, every part of it; the same with a
// thicker floor, cut at its own level, and on a plot of no round figures; a porch against a
// room and under another; glass of two boxes, one over the other; glass beside glass, beside
// open air and beside a room that is lower than it; a face too low for a frame; and two blocks
// drawn into each other. Run by tools/sketch/check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { partsShown } from './cut.js';
import { FRAME_EVERY_M, FRAME_M, glass } from './glass.js';
import { amiss } from './holds.js';
import { PANE_M } from './openings.js';
import { sceneOf } from './scene.js';

// What the rule builds with, and every figure below was worked out with: members 5 cm square,
// a post or a bar every metre at most, and a pane of 4 cm.
assert.deepEqual([FRAME_M, FRAME_EVERY_M, PANE_M], [0.05, 1, 0.04]);

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
// Made-up figures: a floor of a quarter of a metre.
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

// A member of a frame and a pane, by hand: the place of its thing, the floor that thing stands
// on, and its box. What lies on a top is `over`.
const FRAME = { of: 'frame', shape: 'box', surface: 'metal' };
const PANE = { of: 'pane', shape: 'box', surface: 'glass' };
const frame = (thing, floor, min, max) => ({ ...FRAME, min, max, thing, floor });
const pane = (thing, floor, min, max) => ({ ...PANE, min, max, thing, floor });
const over = (part) => ({ ...part, over: true });
// Two figures that were worked out in two ways - by the rule, and by hand - differ by a hair.
const HAIR_M = 1e-9;
const same = (made, byHand) =>
  [...made.min, ...made.max].every(
    (figure, place) => Math.abs(figure - [...byHand.min, ...byHand.max][place]) < HAIR_M,
  );
const alike = (made, byHand, what) => {
  assert.equal(made.length, byHand.length, `${what}: ${made.length} parts`);
  made.forEach((part, at) => {
    const [{ min, max, ...words }, { min: least, max: most, ...said }] = [part, byHand[at]];
    assert.deepEqual(words, said, `${what}, part ${at}`);
    assert.ok(
      same(part, byHand[at]),
      `${what}, part ${at}: ${min} to ${max}, not ${least} to ${most}`,
    );
  });
};
const partsOf = (scene, thing) => scene.parts.filter((part) => part.thing === thing);

// A glasshouse alone, 2 m by 1.5 m and 2 m high, on the ground: from x = 1 to 3, y = 5.5 to 7,
// 105 m to 107 m. By hand, with the top of its floor slab at `foot` and the top of the member
// that lies on it at `sill`, 5 cm higher. A frame lies inside the box, 5 cm deep, and the
// glass in the middle of that depth: half a centimetre in, 4 cm thick.
const alone = [box([2, 6], [2, 5], [18, 22], { name: 'Glasshouse', as: 'glass' })];
const byHand = (foot, sill) => [
  // The face up the plot, at x = 1. It is 1.5 m wide: two bays of 0.75 m, and a post astride
  // the line between them, at y = 6.25. The member at its foot and the one at its head; the
  // three posts between those two; and a pane in each bay, between the members.
  frame(0, 105, [1, 5.5, foot], [1.05, 7, sill]),
  frame(0, 105, [1, 5.5, 106.95], [1.05, 7, 107]),
  frame(0, 105, [1, 5.5, sill], [1.05, 5.55, 106.95]),
  frame(0, 105, [1, 6.225, sill], [1.05, 6.275, 106.95]),
  frame(0, 105, [1, 6.95, sill], [1.05, 7, 106.95]),
  pane(0, 105, [1.005, 5.55, sill], [1.045, 6.225, 106.95]),
  pane(0, 105, [1.005, 6.275, sill], [1.045, 6.95, 106.95]),
  // The face down the plot, at x = 3: the same, inward of that face.
  frame(0, 105, [2.95, 5.5, foot], [3, 7, sill]),
  frame(0, 105, [2.95, 5.5, 106.95], [3, 7, 107]),
  frame(0, 105, [2.95, 5.5, sill], [3, 5.55, 106.95]),
  frame(0, 105, [2.95, 6.225, sill], [3, 6.275, 106.95]),
  frame(0, 105, [2.95, 6.95, sill], [3, 7, 106.95]),
  pane(0, 105, [2.955, 5.55, sill], [2.995, 6.225, 106.95]),
  pane(0, 105, [2.955, 6.275, sill], [2.995, 6.95, 106.95]),
  // The face up the paper, at y = 7. It is 2 m wide: two bays of a metre, the post between
  // them astride x = 2.
  frame(0, 105, [1, 6.95, foot], [3, 7, sill]),
  frame(0, 105, [1, 6.95, 106.95], [3, 7, 107]),
  frame(0, 105, [1, 6.95, sill], [1.05, 7, 106.95]),
  frame(0, 105, [1.975, 6.95, sill], [2.025, 7, 106.95]),
  frame(0, 105, [2.95, 6.95, sill], [3, 7, 106.95]),
  pane(0, 105, [1.05, 6.955, sill], [1.975, 6.995, 106.95]),
  pane(0, 105, [2.025, 6.955, sill], [2.95, 6.995, 106.95]),
  // The face down the paper, at y = 5.5.
  frame(0, 105, [1, 5.5, foot], [3, 5.55, sill]),
  frame(0, 105, [1, 5.5, 106.95], [3, 5.55, 107]),
  frame(0, 105, [1, 5.5, sill], [1.05, 5.55, 106.95]),
  frame(0, 105, [1.975, 5.5, sill], [2.025, 5.55, 106.95]),
  frame(0, 105, [2.95, 5.5, sill], [3, 5.55, 106.95]),
  pane(0, 105, [1.05, 5.505, sill], [1.975, 5.545, 106.95]),
  pane(0, 105, [2.025, 5.505, sill], [2.95, 5.545, 106.95]),
  // The top, all of it `over`: the members along its edges up the plot and down it; between
  // them the bars, which run down the plot - one at either edge, and one astride y = 6.25, over
  // the middle posts of the faces up the plot and down it; and a pane in each of the two bays,
  // lying in the middle of the members' depth.
  over(frame(0, 105, [1, 5.5, 106.95], [1.05, 7, 107])),
  over(frame(0, 105, [2.95, 5.5, 106.95], [3, 7, 107])),
  over(frame(0, 105, [1.05, 5.5, 106.95], [2.95, 5.55, 107])),
  over(frame(0, 105, [1.05, 6.225, 106.95], [2.95, 6.275, 107])),
  over(frame(0, 105, [1.05, 6.95, 106.95], [2.95, 7, 107])),
  over(pane(0, 105, [1.05, 5.55, 106.955], [2.95, 6.225, 106.995])),
  over(pane(0, 105, [1.05, 6.275, 106.955], [2.95, 6.95, 106.995])),
];

// The rule alone gives these parts, and no other; the house's own rules give them too, among
// whatever they give. The three things hold, with the rule alone and with every rule there is:
// each part within its box, and no glass in a member or in the floor. And at its own level a
// cut leaves the roof of glass out, and the four faces stand whole: the storey is looked into.
const lone = sceneOf(site, alone, figures, { blocks: [glass] });
alike(lone.parts, byHand(105.25, 105.3), 'a glasshouse alone');
const whole = sceneOf(site, alone, figures);
const glazed = (scene) => scene.parts.filter((part) => part.of !== 'floor');
alike(glazed(whole), byHand(105.25, 105.3), 'a glasshouse, with every rule');
assert.deepEqual([amiss(lone), amiss(whole)], [[], []]);
alike(partsShown(lone, 'all'), byHand(105.25, 105.3), 'a glasshouse, not cut');
alike(partsShown(lone, 105), byHand(105.25, 105.3).slice(0, 28), 'a glasshouse, cut at its level');
// With a floor of half a metre every number follows: the frames stand on 105.5 m.
const stout = { ...figures, floorSlabM: 0.5 };
alike(
  sceneOf(site, alone, stout, { blocks: [glass] }).parts,
  byHand(105.5, 105.55),
  'a thicker floor',
);
assert.deepEqual(amiss(sceneOf(site, alone, stout)), []);
// On a plot whose lines are no round figures - a column at x = 0.4 + column / 2, worked out to
// its last place - the same glasshouse, moved two columns, is a hair more than 2 m long. Its
// faces along the plot are two bays all the same, and not three: 35 parts, as before.
const odd = { ...site, xFromM: 0.4, xToM: 12.4 };
const moved = alone.map((one) => ({ ...one, x: [4, 8] }));
assert.ok(0.4 + 8 / 2 - (0.4 + 4 / 2) > 2);
assert.equal(sceneOf(odd, moved, figures, { blocks: [glass] }).parts.length, 35);
assert.deepEqual(amiss(sceneOf(odd, moved, figures)), []);

// A house of glass beside other things.
const things = [
  // 0 to 2: a kitchen of 3 m by 3 m; a porch of glass against its side down the plot, 1 m by
  // 1.5 m and 2 m high; and a loft over the porch.
  box([2, 8], [2, 8], [16, 22], { name: 'Kitchen' }),
  box([8, 10], [2, 5], [18, 22], { name: 'Porch', as: 'glass' }),
  box([8, 10], [2, 5], [14, 18], { name: 'Loft' }),
  // 3 and 4: a winter garden of two boxes of one block, one over the other, each 2 m by 2 m
  // and 2 m high. 5: a terrace, a metre high, at the lower one's side down the plot.
  box([14, 18], [2, 6], [18, 22], { name: 'Winter garden', as: 'glass', group: 6 }),
  box([14, 18], [2, 6], [14, 18], { group: 6 }),
  box([18, 22], [2, 6], [20, 22], { name: 'Terrace', as: 'open' }),
  // 6: a greenhouse, another block of glass, against the winter garden's side down the paper,
  // 2 m by 1.5 m and 2 m high. 7: a shed, a metre high, at its side down the plot.
  box([14, 18], [6, 9], [18, 22], { name: 'Greenhouse', as: 'glass' }),
  box([18, 22], [6, 9], [20, 22], { name: 'Shed' }),
];
const house = sceneOf(site, things, figures, { blocks: [glass] });
// The porch, from x = 4 to 5 and y = 5.5 to 7, by hand. Against the kitchen it has no pane:
// the room has its wall there. Under the loft it has none on top. Its face down the plot has
// two bays; the two along the plot are a metre wide, one bay, with a post at either end.
alike(
  partsOf(house, 1),
  [
    frame(1, 105, [4.95, 5.5, 105.25], [5, 7, 105.3]),
    frame(1, 105, [4.95, 5.5, 106.95], [5, 7, 107]),
    frame(1, 105, [4.95, 5.5, 105.3], [5, 5.55, 106.95]),
    frame(1, 105, [4.95, 6.225, 105.3], [5, 6.275, 106.95]),
    frame(1, 105, [4.95, 6.95, 105.3], [5, 7, 106.95]),
    pane(1, 105, [4.955, 5.55, 105.3], [4.995, 6.225, 106.95]),
    pane(1, 105, [4.955, 6.275, 105.3], [4.995, 6.95, 106.95]),
    frame(1, 105, [4, 6.95, 105.25], [5, 7, 105.3]),
    frame(1, 105, [4, 6.95, 106.95], [5, 7, 107]),
    frame(1, 105, [4, 6.95, 105.3], [4.05, 7, 106.95]),
    frame(1, 105, [4.95, 6.95, 105.3], [5, 7, 106.95]),
    pane(1, 105, [4.05, 6.955, 105.3], [4.95, 6.995, 106.95]),
    frame(1, 105, [4, 5.5, 105.25], [5, 5.55, 105.3]),
    frame(1, 105, [4, 5.5, 106.95], [5, 5.55, 107]),
    frame(1, 105, [4, 5.5, 105.3], [4.05, 5.55, 106.95]),
    frame(1, 105, [4.95, 5.5, 105.3], [5, 5.55, 106.95]),
    pane(1, 105, [4.05, 5.505, 105.3], [4.95, 5.545, 106.95]),
  ],
  'a porch against a room and under another',
);
// The others, by what each has: how many parts, and how many panes that stand across the plot,
// that stand along it, and that lie. A rectangle of two bays is seven parts, two of them panes.
// - The lower box of the winter garden: three faces. Toward the greenhouse it has none, for
//   glass beside glass is one house of glass; and none on top, where its own block goes on.
//   Toward the terrace it has one rectangle, as toward nothing: open air is closed off.
// - Its upper box: four faces and a top. It has no floor - it lies on the lower box - and its
//   frames stand on its bottom, at 107 m.
// - The greenhouse: none toward the winter garden. Toward the shed, which is a metre high, a
//   pane over the shed alone, in a frame whose foot lies on 106 m. And a top.
const thin = (scene, thing, axis) =>
  partsOf(scene, thing).filter(
    (part) => part.of === 'pane' && part.max[axis] - part.min[axis] < FRAME_M,
  );
const tally = (at) =>
  [partsOf(house, at).length, ...[0, 1, 2].map((axis) => thin(house, at, axis).length)].join(' ');
assert.deepEqual([3, 4, 6].map(tally), ['21 4 2 0', '35 4 4 2', '28 4 2 2']);
// The panes along the plot of the two that touch stand on the faces they turn away from each
// other: the winter garden's at y = 7, the greenhouse's at y = 3.5.
assert.ok(thin(house, 3, 1).every((part) => part.min[1] > 6.9));
assert.ok(thin(house, 6, 1).every((part) => part.max[1] < 3.6));
const has = (byHand) => house.parts.some((part) => part.of === byHand.of && same(part, byHand));
assert.ok(has(pane(3, 105, [8.955, 5.05, 105.3], [8.995, 5.975, 106.95])), 'toward the terrace');
assert.ok(has(frame(4, 107, [7, 5, 107], [7.05, 7, 107.05])), 'the upper box, on its bottom');
assert.ok(has(frame(6, 105, [8.95, 3.5, 106], [9, 5, 106.05])), 'a foot over the shed');
assert.ok(has(pane(6, 105, [8.955, 3.55, 106.05], [8.995, 4.225, 106.95])), 'a pane over it');
// A room and open air get none.
assert.equal([0, 2, 5, 7].flatMap((at) => partsOf(house, at)).length, 0);
// What is `over` is taken off by the cut at its own level, and stays under a cut higher up.
const overAt = (cut) => partsShown(house, cut).filter((part) => part.over === true).length;
assert.deepEqual(['all', 107, 105].map(overAt), [14, 7, 0]);
assert.deepEqual([amiss(house), amiss(sceneOf(site, things, figures))], [[], []]);

// A face too low for a frame. An orangery of 2 m by 2 m and 2 m high, and beside it, down the
// plot, a den that stands half a metre higher: under the den's floor the orangery's face is
// open to nothing, half a metre high. With a floor of a quarter of a metre a frame of two bays
// stands in the quarter that is left: seven parts. With a floor of 0.45 m, 5 cm are left: the
// two members meet in the middle, 2.5 cm each, with no post and no pane. With a floor of half
// a metre nothing is left, and nothing stands there.
const split = [
  box([2, 6], [2, 6], [18, 22], { name: 'Orangery', as: 'glass' }),
  box([6, 10], [2, 6], [17, 21], { name: 'Den' }),
];
const lowOf = (floorSlabM) => {
  const scene = sceneOf(site, split, { ...figures, floorSlabM });
  assert.deepEqual(amiss(scene), [], `a floor of ${floorSlabM} m`);
  return partsOf(scene, 0).filter((part) => part.min[0] > 2.9 && part.max[2] < 105.6);
};
assert.deepEqual([lowOf(0.25).length, lowOf(0.5).length], [7, 0]);
alike(
  lowOf(0.45),
  [
    frame(0, 105, [2.95, 5, 105.45], [3, 7, 105.475]),
    frame(0, 105, [2.95, 5, 105.475], [3, 7, 105.5]),
  ],
  'a face too low for a frame',
);

// Two blocks drawn into each other: a glasshouse of 2 m by 2 m, and a hut drawn later into its
// last two columns. The later one holds the cells they share, and a box has glass only on the
// cells it holds: a face up the plot of two bays, two along the plot of one bay, a metre wide,
// and a top of two bays - 7, 5, 5 and 7 parts. Nothing lies in the hut's floor or walls.
const drawnIn = [
  box([2, 6], [2, 6], [18, 22], { name: 'Glasshouse', as: 'glass' }),
  box([4, 8], [2, 6], [18, 22], { name: 'Hut' }),
];
const shared = sceneOf(site, drawnIn, figures);
assert.equal(partsOf(shared, 0).filter((part) => part.of !== 'floor').length, 24);
assert.ok(partsOf(shared, 0).every((part) => part.max[0] < 2 + HAIR_M));
assert.deepEqual(amiss(shared), []);

process.stdout.write(
  'tools/sketch/scene: glass is panes in thin frames on every face that no room and no glass lies beyond, and on a top that no block lies over\n',
);
