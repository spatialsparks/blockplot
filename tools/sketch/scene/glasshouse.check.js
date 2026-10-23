// The check of glass under a top that slopes (story ST-026): made-up blocks of glass on a
// made-up plot, against the panes and the frames a person worked out by hand - a glasshouse
// alone whose top falls down the plot, every part of it, on a thicker floor too and cut at its
// own level; one whose top falls across the plot; one whose top comes down to its floor; a
// porch against a room, with a face that ends under two tops; two boxes of one block, a top
// each; and a roof over a floor that changes under it. Glass under a level top is
// glass.check.js's. Run by tools/sketch/check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { partsShown } from './cut.js';
import { FRAME_EVERY_M, FRAME_M, glass } from './glass.js';
import { amiss } from './holds.js';
import { PANE_M } from './openings.js';
import { sceneOf } from './scene.js';

// What the rule builds with, and every figure below was worked out with: members 5 cm square,
// a post or a bar every metre at most, and a pane of 4 cm in the middle of a member's depth.
assert.deepEqual([FRAME_M, FRAME_EVERY_M, PANE_M], [0.05, 1, 0.04]);

// The made-up plot of glass.check.js, 12 m by 5 m in cells of half a metre: a column is
// x = column / 2, a row of the top view y = 8 - row / 2, and a level 116 - level / 2 metres
// above sea level. Its ground is flat, at 105 m: level 22.
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
// Made-up figures: a floor of a quarter of a metre, and one of half a metre.
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
const stout = { ...figures, floorSlabM: 0.5 };
const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, more) => ({ x, y, z, colour: grey, as: 'glass', ...more });

// A part by hand: where it lies seen from above, down the plot and across it, and its bottom
// and its top as lines along the slope, each a height at the lower figure of that extent and
// one at the higher. Level above and below it is a box, and else a slant along `along`, in the
// box around it. `thing` is the place of its block, and every block here stands on 105 m.
const byHand = (thing, along) => {
  const part = (of, surface) => (xs, ys, low, high) => {
    const [min, max] = [0, 1].map((end) => [xs[end], ys[end]]);
    const around = { min: [...min, Math.min(...low)], max: [...max, Math.max(...high)] };
    const level = low[0] === low[1] && high[0] === high[1];
    const shape = level ? { shape: 'box' } : { shape: 'slant', along, low, high };
    return { of, ...shape, ...around, surface, thing, floor: 105 };
  };
  return { frame: part('frame', 'metal'), pane: part('pane', 'glass') };
};
const over = (part) => ({ ...part, over: true });
// Two figures that were worked out in two ways - by the rule, and by hand - differ by a hair.
const HAIR_M = 1e-9;
const figuresOf = ({ min, max, low = [], high = [] }) => [...min, ...max, ...low, ...high];
const wordsOf = (part) => ({ ...part, min: 0, max: 0, low: 0, high: 0 });
const alike = (made, hand, what) => {
  assert.equal(made.length, hand.length, `${what}: ${made.length} parts`);
  made.forEach((part, at) => {
    assert.deepEqual(wordsOf(part), wordsOf(hand[at]), `${what}, part ${at}`);
    const [is, should] = [part, hand[at]].map(figuresOf);
    const same = is.every((figure, place) => Math.abs(figure - should[place]) < HAIR_M);
    assert.ok(same, `${what}, part ${at}: ${is}, not ${should}`);
  });
};
// A house as the rule alone builds it. And the three things hold of it, built so and built
// with every rule: each part in its box and under its block's top, no glass in metal or floor.
const built = (things, by = figures) => sceneOf(site, things, by, { blocks: [glass] });
const holds = (things, by = figures) =>
  assert.deepEqual([amiss(built(things, by)), amiss(sceneOf(site, things, by))], [[], []]);

// 1. A GLASSHOUSE ALONE, 2 m by 1.5 m and 2 m high, on the ground: x = 1 to 3, y = 5.5 to 7,
// 105 m to 107 m. Its top falls down the plot: from 107 m at x = 1 to 106 m at x = 3, at
// 107.5 - x / 2 between. By hand, with the top of its floor slab at `foot` and the top of the
// member on it at `sill`. A head hangs 5 cm deep under the top, and a post and a pane end
// where it begins: 5 cm under the top over them.
const down = [box([2, 6], [2, 5], [18, 22], { top: { axis: 'x', rows: [18, 20] } })];
const fallen = (foot, sill) => {
  const { frame, pane } = byHand(0, 0);
  const [onFoot, onSill] = [foot, sill].map((height) => [height, height]);
  // A face across the slope: a foot; a head, which slopes across its own 5 cm of depth; under
  // it three posts - two bays of 0.75 m - and two panes, half a centimetre inside the frame.
  const end = (xs, glassXs, top, under, glazed) => [
    frame(xs, [5.5, 7], onFoot, onSill),
    frame(xs, [5.5, 7], under, top),
    ...[5.5, 6.225, 6.95].map((y) => frame(xs, [y, y + 0.05], onSill, under)),
    pane(glassXs, [5.55, 6.225], onSill, glazed),
    pane(glassXs, [6.275, 6.95], onSill, glazed),
  ];
  // A face along the slope: a level foot; a head that follows the top all the way; posts at
  // x = 1, astride x = 2 - under 106.5125 m and 106.4875 m - and at x = 3; a pane a bay.
  const side = (ys, glassYs) => [
    frame([1, 3], ys, onFoot, onSill),
    frame([1, 3], ys, [106.95, 105.95], [107, 106]),
    frame([1, 1.05], ys, onSill, [106.95, 106.925]),
    frame([1.975, 2.025], ys, onSill, [106.4625, 106.4375]),
    frame([2.95, 3], ys, onSill, [105.975, 105.95]),
    pane([1.05, 1.975], glassYs, onSill, [106.925, 106.4625]),
    pane([2.025, 2.95], glassYs, onSill, [106.4375, 105.975]),
  ];
  return [
    // The face at the high end, x = 1, as high as the top is there, and the one at the low end.
    ...end([1, 1.05], [1.005, 1.045], [107, 106.975], [106.95, 106.925], [106.9475, 106.9275]),
    ...end([2.95, 3], [2.955, 2.995], [106.025, 106], [105.975, 105.95], [105.9725, 105.9525]),
    // The face up the paper, y = 7, and the one down the paper, each inward of its face.
    ...side([6.95, 7], [6.955, 6.995]),
    ...side([5.5, 5.55], [5.505, 5.545]),
    // The roof, `over`: its long members, each the head of the face under it once more; three
    // bars down the slope between them; a pane a bay, 4.5 cm to half a centimetre under the top.
    over(frame([1, 1.05], [5.5, 7], [106.95, 106.925], [107, 106.975])),
    over(frame([2.95, 3], [5.5, 7], [105.975, 105.95], [106.025, 106])),
    ...[5.5, 6.225, 6.95].map((y) =>
      over(frame([1.05, 2.95], [y, y + 0.05], [106.925, 105.975], [106.975, 106.025])),
    ),
    over(pane([1.05, 2.95], [5.55, 6.225], [106.93, 105.98], [106.97, 106.02])),
    over(pane([1.05, 2.95], [6.275, 6.95], [106.93, 105.98], [106.97, 106.02])),
  ];
};
// The rule alone gives these 35 parts, and the house's own rules give them among theirs. A cut
// at its level takes the roof off and leaves the faces whole. A thicker floor moves the feet.
alike(built(down).parts, fallen(105.25, 105.3), 'a top that falls down the plot');
const glazed = sceneOf(site, down, figures).parts.filter((part) => part.of !== 'floor');
alike(glazed, fallen(105.25, 105.3), 'the same, with every rule');
alike(partsShown(built(down), 105), fallen(105.25, 105.3).slice(0, 28), 'cut at its level');
alike(built(down, stout).parts, fallen(105.5, 105.55), 'the same, on a thicker floor');
[figures, stout].forEach((by) => holds(down, by));

// 2. ACROSS THE PLOT. A glasshouse of 2 m by 2 m, y = 5 to 7, whose top falls across the plot:
// from 107 m at y = 7 to 106 m at y = 5, at 103.5 + y / 2 between. The bars of its roof run
// down the plot still: each lies level and slopes across its own 5 cm, and the two long
// members slope all the way. Of its 35 parts, by hand:
const across = [box([2, 6], [2, 6], [18, 22], { top: { axis: 'y', rows: [18, 20] } })];
const turned = (() => {
  const { frame, pane } = byHand(0, 1);
  return [
    // Of the face up the plot, x = 1, along the slope: the post astride y = 6, and the pane
    // before it. Of the faces at the high end, y = 7, and at the low end: the head of each.
    frame([1, 1.05], [5.975, 6.025], [105.3, 105.3], [106.4375, 106.4625]),
    pane([1.005, 1.045], [5.05, 5.975], [105.3, 105.3], [105.975, 106.4375]),
    frame([1, 3], [6.95, 7], [106.925, 106.95], [106.975, 107]),
    frame([1, 3], [5, 5.05], [105.95, 105.975], [106, 106.025]),
    // The roof: two long members, three bars and two panes.
    over(frame([1, 1.05], [5, 7], [105.95, 106.95], [106, 107])),
    over(frame([2.95, 3], [5, 7], [105.95, 106.95], [106, 107])),
    over(frame([1.05, 2.95], [5, 5.05], [105.95, 105.975], [106, 106.025])),
    over(frame([1.05, 2.95], [5.975, 6.025], [106.4375, 106.4625], [106.4875, 106.5125])),
    over(frame([1.05, 2.95], [6.95, 7], [106.925, 106.95], [106.975, 107])),
    over(pane([1.05, 2.95], [5.05, 5.975], [105.98, 106.4425], [106.02, 106.4825])),
    over(pane([1.05, 2.95], [6.025, 6.95], [106.4675, 106.93], [106.5075, 106.97])),
  ];
})();
const crossed = built(across).parts;
const picked = [3, 5, 15, 22, 28, 29, 30, 31, 32, 33, 34].map((at) => crossed[at]);
alike(picked, turned, 'a top that falls across the plot');
assert.equal(crossed.length, 35);
holds(across);

// 3. DOWN TO THE FLOOR. The first glasshouse under a top that rises down the plot, a metre a
// metre: from the bottom of its box at x = 1, 105 m, to 107 m at x = 3, at 104 + x between.
// Its floor slab is as it was, level and `foot` high, and nothing of glass lies in it: the top
// meets the slab at x = foot - 104, and what hangs 5 cm under the top meets it 5 cm on.
const wedge = [box([2, 6], [2, 5], [18, 22], { top: { axis: 'x', rows: [22, 18] } })];
const landed = (foot, sill) => {
  const { frame, pane } = byHand(0, 0);
  const [onFoot, onSill] = [foot, sill].map((height) => [height, height]);
  const [meets, clears] = [foot - 104, sill - 104];
  // What a member is where the top comes down onto the slab: a wedge, 5 cm long.
  const toe = (ys) => frame([meets, clears], ys, onFoot, [foot, sill]);
  // A face along the slope. Its foot is that wedge and then the member it was; its head the
  // wedge once more - there it lies in the foot - and then 5 cm deep under the top. No post
  // at x = 1, under the slab, and the first pane begins where the head clears the sill.
  const side = (ys, glassYs) => [
    toe(ys),
    frame([clears, 3], ys, onFoot, onSill),
    toe(ys),
    frame([clears, 3], ys, [foot, 106.95], [sill, 107]),
    frame([1.975, 2.025], ys, onSill, [105.925, 105.975]),
    frame([2.95, 3], ys, onSill, [106.9, 106.95]),
    pane([clears + 0.05, 1.975], glassYs, onSill, [sill, 105.925]),
    pane([2.025, 2.95], glassYs, onSill, [105.975, 106.9]),
  ];
  return [
    // At the low end, x = 1, stands nothing. The face at the high end, x = 3, is whole.
    frame([2.95, 3], [5.5, 7], onFoot, onSill),
    frame([2.95, 3], [5.5, 7], [106.9, 106.95], [106.95, 107]),
    ...[5.5, 6.225, 6.95].map((y) => frame([2.95, 3], [y, y + 0.05], onSill, [106.9, 106.95])),
    pane([2.955, 2.995], [5.55, 6.225], onSill, [106.905, 106.945]),
    pane([2.955, 2.995], [6.275, 6.95], onSill, [106.905, 106.945]),
    ...side([6.95, 7], [6.955, 6.995]),
    ...side([5.5, 5.55], [5.505, 5.545]),
    // The roof has no member along its low end. Its bars and its panes end on the slab: a bar
    // as the head of a face does, a pane 4 cm thick between half a centimetre and 4.5 cm on.
    over(frame([2.95, 3], [5.5, 7], [106.9, 106.95], [106.95, 107])),
    ...[5.5, 6.225, 6.95].flatMap((y) => [
      over(toe([y, y + 0.05])),
      over(frame([clears, 2.95], [y, y + 0.05], [foot, 106.9], [sill, 106.95])),
    ]),
    ...[5.55, 6.275].flatMap((y) => [
      over(pane([meets + 0.005, meets + 0.045], [y, y + 0.675], onFoot, [foot, foot + 0.04])),
      over(pane([meets + 0.045, 2.95], [y, y + 0.675], [foot, 106.905], [foot + 0.04, 106.945])),
    ]),
  ];
};
alike(built(wedge).parts, landed(105.25, 105.3), 'a top that comes down to its floor');
alike(built(wedge, stout).parts, landed(105.5, 105.55), 'the same, on a thicker floor');
[figures, stout].forEach((by) => holds(wedge, by));
// And a top that ends 2 cm over the slab: its frame, 5 cm deep, would lie in the slab.
holds([box([2, 6], [2, 5], [18, 22], { top: { axis: 'x', rows: [18, 21.46] } })]);

// 4. AGAINST A ROOM, AND UNDER TWO TOPS. A kitchen whose top is level; against its side down
// the plot a porch of glass, x = 3 to 5, whose top falls from the kitchen's 107 m to its own
// floor, at 110 - x; and beside the porch, down the paper, a den that stands a metre higher.
// The porch's face toward the den, y = 5.5, has glass under the den alone, up to 106 m: it
// ends under its own top as far as x = 4, where the block's top crosses it, and under that
// from there on. By hand:
const things = [
  box([2, 6], [2, 5], [18, 22], { name: 'Kitchen', as: 'room' }),
  box([6, 10], [2, 5], [18, 22], { name: 'Porch', top: { axis: 'x', rows: [18, 22] } }),
  box([6, 10], [5, 8], [16, 20], { name: 'Den', as: 'room' }),
];
const underDen = (() => {
  const { frame, pane } = byHand(1, 0);
  const ys = [5.5, 5.55];
  const [onFoot, onSill, lintel] = [105.25, 105.3, 105.95].map((height) => [height, height]);
  return [
    // The foot, with its wedge where the top comes down to it, between x = 4.7 and 4.75.
    frame([3, 4.7], ys, onFoot, onSill),
    frame([4.7, 4.75], ys, onFoot, [105.3, 105.25]),
    // The head: level under 106 m, then under the top, and the wedge once more.
    frame([3, 4], ys, lintel, [106, 106]),
    frame([4, 4.7], ys, [105.95, 105.25], [106, 105.3]),
    frame([4.7, 4.75], ys, onFoot, [105.3, 105.25]),
    // The posts: at x = 3; astride x = 4, cut where the two tops cross; and none at x = 5.
    frame([3, 3.05], ys, onSill, lintel),
    frame([3.975, 4], ys, onSill, lintel),
    frame([4, 4.025], ys, onSill, [105.95, 105.925]),
    // The panes: a box, and a slant that ends where the head's underside meets the sill.
    pane([3.05, 3.975], [5.505, 5.545], onSill, lintel),
    pane([4.025, 4.65], [5.505, 5.545], onSill, [105.925, 105.3]),
  ];
})();
const porch = built(things).parts;
alike(porch.slice(8, 18), underDen, 'a face under two tops');
// The rooms get none, and the porch 29: nothing toward the kitchen and nothing at its low end
// - no pane stands across the plot - eight on the face up the paper, these ten, a roof of 11.
const crosswise = (part) => part.of === 'pane' && !part.over && part.max[0] - part.min[0] < FRAME_M;
const tally = (parts) => [parts.length, parts.filter(crosswise).length];
const roofOf = (parts) => parts.filter((part) => part.over);
assert.ok(porch.every((part) => part.thing === 1));
assert.deepEqual([...tally(porch), roofOf(porch).length], [29, 0, 11]);
holds(things);

// 5. TWO BOXES OF ONE BLOCK, A TOP EACH: side by side down the plot, the first rising to 107 m
// at x = 3 and the second falling from there - a ridge. Between them stands nothing, for glass
// beside glass is one house of glass: each has its low end, two faces along its slope and a
// roof - 28 parts, two of them panes across the plot - and at the ridge two long members meet.
const ridge = [
  box([2, 6], [2, 5], [18, 22], { group: 4, top: { axis: 'x', rows: [20, 18] } }),
  box([6, 10], [2, 5], [18, 22], { group: 4, top: { axis: 'x', rows: [18, 20] } }),
];
const halves = [0, 1].map((thing) => built(ridge).parts.filter((part) => part.thing === thing));
assert.deepEqual(halves.flatMap(tally), [28, 2, 28, 2]);
const meeting = [
  over(byHand(0, 0).frame([2.95, 3], [5.5, 7], [106.925, 106.95], [106.975, 107])),
  over(byHand(1, 0).frame([3, 3.05], [5.5, 7], [106.95, 106.925], [107, 106.975])),
];
alike([halves[0][22], halves[1][21]], meeting, 'the two members at a ridge');
holds(ridge);

// 6. A ROOF AND ITS FLOOR. An upper box of glass on a lower one of its block, a metre longer
// down the plot: it has a floor under that metre alone. Its roof is one rectangle, 7 parts,
// under a level top and under one that slopes high over it - and two, 19 parts, cut where the
// floor begins, under a top that comes down to its foot: it ends on what lies under it.
const lower = box([2, 6], [2, 5], [18, 22], { group: 4 });
const stack = (top) => [lower, box([2, 8], [2, 5], [14, 18], { group: 4, ...top })];
const TOPS = [{}, { top: { axis: 'x', rows: [16, 14] } }, { top: { axis: 'x', rows: [18, 14] } }];
const roofs = TOPS.map((top) => roofOf(built(stack(top)).parts).length);
assert.deepEqual(roofs, [7, 7, 19]);
TOPS.forEach((top) => holds(stack(top)));

process.stdout.write(
  'tools/sketch/scene: under a top that slopes glass is a roof of panes in frames that follow it, on faces that end under it, and none of it lies in the floor\n',
);
