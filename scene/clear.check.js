// The check of what gives way: made-up rooms with objects against their walls, against boxes a
// person worked out by hand - a toilet moved by one wall's thickness, by two in a corner, by
// half an inner wall's; a bed that stands clear; a flight cut in a room as wide as itself; what
// stands in no room, a door and a window, as the sketch has them - and thicker walls. The lift
// (parts.js): a second flight begins where the first ends. The walls (walls.js): a door and a
// window beside an opening lie as high as any. Run by tools/sketch/check.js, as every check is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { LEAST } from './clear.js';
import { amiss } from './holds.js';
import { sceneOf } from './scene.js';
import { steps } from './steps.js';

// A made-up plot of 20 m by 12 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 12 - row / 2, and a level 120 - level / 2 metres above sea level. Its ground
// is flat, at 104.75 m: in row 30.5 of a standing paper.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 20,
  yFromM: 0,
  yToM: 12,
  sideM: [100, 120],
  outline: [
    [1, 11],
    [19, 11],
    [1, 1],
  ],
  ground: { baseM: 100, rowsCm: Array(25).fill(Array(41).fill('475').join(' ')) },
};
// Made-up figures, each a sum of halves of halves, so that every place below is exact: an outer
// wall of 0.375 m, and half an inner one, 0.125 m.
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

// The house, on level 30, at 105 m. A bath of 3 m by 3 m, from x = 1 to 4 and from y = 8 to 11,
// and a bedroom beside it down the plot, to x = 8: a wall of two rooms at x = 4. A stair room
// of 4.5 m by 1 m on its own, from x = 1 to 5.5 and from y = 5 to 6. Open air and glass beside
// the bedroom. And a hall of three boxes: 2 m by 1 m from x = 1 and y = 3; under it on the
// paper 4 m by 2 m, down to y = 1; and under that 2 m by 1 m from x = 3, down to y = 0. Every
// face but the one at x = 4 is an outer wall's.
const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, more) => ({ x, y, z, colour: grey, ...more });
const on = (kind, x, y, z, floor = z[1]) => ({ x, y, z, kind, turn: 0, fill: '#eceff2', floor });
const things = [
  box([2, 8], [2, 8], [24, 30], { name: 'Bath' }),
  box([8, 16], [2, 8], [24, 30], { name: 'Bedroom' }),
  box([2, 11], [12, 14], [24, 30], { name: 'Stair room' }),
  box([16, 20], [2, 8], [28, 30], { name: 'Terrace', as: 'open' }),
  box([16, 20], [8, 12], [24, 30], { name: 'Greenhouse', as: 'glass' }),
  // 5 to 7, toilets of half a metre each way, drawn against the edges of the bath: against its
  // side up the paper; in its corner up the plot and down the paper; against the bedroom.
  on('toilet', [4, 5], [2, 3], [29, 30]),
  on('toilet', [2, 3], [7, 8], [29, 30]),
  on('toilet', [7, 8], [4, 5], [29, 30]),
  // 8: a bed of 2 m by 2 m in the bedroom, half a metre or more from every edge of it.
  on('bed', [10, 14], [3, 7], [29, 30]),
  // 9: a flight of 4.5 m by 1 m, as large as its stair room.
  on('stairs', [2, 11], [12, 14], [24, 30]),
  // 10 to 13, each in no room: on the ground; on the bath's roof, at its very corner; in a
  // corner of the open air and in one of the glass, each an eighth of a metre past the edge.
  on('toilet', [22, 23], [2, 3], [29.5, 30.5]),
  on('toilet', [2, 3], [2, 3], [23, 24]),
  on('toilet', [16, 17], [1.75, 2.75], [29, 30]),
  on('toilet', [16, 17], [11.25, 12.25], [29, 30]),
  // 14 and 15: a door and a window that lie wholly in the bath, in its walls up the plot and up
  // the paper, the window a quarter of a metre deep and a metre over the floor.
  on('door', [2, 4], [5, 7], [26, 30]),
  on('window', [5, 7], [2, 2.5], [25, 28], 30),
  // 16 to 19, the hall and what stands in it: a bed across the line where its two boxes meet;
  // and a toilet beside its inner corner, its middle on the line between the upper box, which
  // ends at x = 3, and the lower, which goes on to x = 5.
  box([2, 6], [16, 18], [24, 30], { name: 'Hall', group: 3 }),
  box([2, 10], [18, 22], [24, 30], { group: 3 }),
  on('bed', [3, 4], [17, 20], [29, 30]),
  on('toilet', [5, 6], [17, 19], [29, 30]),
  // 20: a toilet of a metre across the wall of the bath and the bedroom, half in each.
  on('toilet', [7, 9], [6, 8], [29, 30]),
  // 21: a basin of a metre in the hall's lower box, against its upper edge, its middle on the
  // line at x = 3: half of it under the upper box, half under the wall beside that.
  on('basin', [5, 7], [18, 19], [29, 30]),
  // 22 to 24: a third box of the hall, 2 m by 1 m, under the lower one from x = 3 on - a second
  // inner corner, the other way round. A toilet in the third box against its edge up the plot,
  // its middle on the line at y = 1; and a basin against the lower box's edge down the paper.
  box([6, 10], [22, 24], [24, 30], { group: 3 }),
  on('toilet', [6, 7], [21, 23], [29, 30]),
  on('basin', [5, 7], [21, 22], [29, 30]),
];

// The box that the rule of a kind gets, asked with no rule at all: an object whose kind has
// none is one plain box, its own, lifted by the floor's slab - 0.375 m - where it stands on one.
const alone = { blocks: [], kinds: {} };
const scene = sceneOf(site, things, figures, alone);
const part = (thing, floor, min, max) => ({
  of: 'piece',
  shape: 'box',
  min,
  max,
  surface: 'plain',
  thing,
  floor,
});
assert.equal(LEAST, 0.5);
assert.deepEqual(scene.parts, [
  // Against one outer wall, whose face lies at y = 11 - 0.375: moved by 0.375 m, and as large.
  part(5, 105, [2, 10.125, 105.375], [2.5, 10.625, 105.875]),
  // In a corner of two, whose faces lie at x = 1.375 and at y = 8.375: moved by both.
  part(6, 105, [1.375, 8.375, 105.375], [1.875, 8.875, 105.875]),
  // Against the wall of two rooms, whose half in the bath ends at x = 4 - 0.125: by that half.
  part(7, 105, [3.375, 9.5, 105.375], [3.875, 10, 105.875]),
  // The bed, clear of the bedroom's walls - their faces at x = 4.125 and 7.625, y = 8.375 and
  // 10.625: where the sketch has it.
  part(8, 105, [5, 8.5, 105.375], [7, 10.5, 105.875]),
  // The flight. Along it the stair room is 4.5 - 0.75 = 3.75 m clear, which is more than half
  // the flight: cut to that, from x = 1.375 to 5.125. Across it 0.25 m is clear, less than
  // half the flight's metre: it keeps 0.5 m about y = 5.5, and stands 0.125 m in either wall.
  part(9, 105, [1.375, 5.25, 105.375], [5.125, 5.75, 108.375]),
  // In no room: on the ground, and on the roof at 108 m, not lifted either; in open air and in
  // glass, on their floors' slabs, and past the edges at y = 11 and y = 6 as the sketch put them.
  part(10, 104.75, [11, 10.5, 104.75], [11.5, 11, 105.25]),
  part(11, 108, [1, 10.5, 108], [1.5, 11, 108.5]),
  part(12, 105, [8, 10.625, 105.375], [8.5, 11.125, 105.875]),
  part(13, 105, [8, 5.875, 105.375], [8.5, 6.375, 105.875]),
  // The door and the window: in their walls, where they were drawn.
  part(14, 105, [1, 8.5, 105.375], [2, 9.5, 107.375]),
  part(15, 105, [2.5, 10.75, 106.375], [3.5, 11, 107.875]),
  // In the hall, the bed lies from y = 2 to 3.5, across the line at y = 3 where the two boxes
  // meet: one room, with no wall there, clear from y = 1.375 to 3.625. Where it was drawn.
  part(18, 105, [1.5, 2, 105.375], [2, 3.5, 105.875]),
  // The toilet reaches from x = 2.5 to 3. Its middle lies on the line at y = 3: over it the
  // upper box ends at x = 3, with a wall to 2.625, and under it the lower box goes on. The
  // nearer wall holds: moved to end at 2.625.
  part(19, 105, [2.125, 2.5, 105.375], [2.625, 3.5, 105.875]),
  // Half in the bath and half in the bedroom, its middle on the edge between them: it stands
  // in no one room, and stays in the wall where it was drawn.
  part(20, 105, [3.5, 8, 105.375], [4.5, 9, 105.875]),
  // The basin reaches from y = 2.5 to 3. Up the plot of its middle the hall goes on to y = 4;
  // down the plot of it the lower box ends at y = 3, with a wall to 2.625: moved to end there.
  part(21, 105, [2.5, 2.125, 105.375], [3.5, 2.625, 105.875]),
  // At the second corner the nearer wall is the one that begins: the third box's at x = 3, to
  // 3.375, for the toilet; and the lower box's at y = 1, to 1.375, for the basin.
  part(23, 105, [3.375, 0.5, 105.375], [3.875, 1.5, 105.875]),
  part(24, 105, [2.5, 1.375, 105.375], [3.5, 1.875, 105.875]),
]);
// Their kind keeps a door and a window there: a toilet in the door's box is moved out of the
// wall to x = 1.375, and one in the window's box to end at y = 10.625.
const swap = (thing) => (/door|window/.test(thing.kind) ? { ...thing, kind: 'toilet' } : thing);
const swapped = sceneOf(site, things.map(swap), figures, alone).parts;
const [inDoor, inWindow] = [14, 15].map((at) => swapped.find((one) => one.thing === at));
assert.deepEqual([...inDoor.min, ...inDoor.max], [1.375, 8.5, 105.375, 2.375, 9.5, 107.375]);
assert.deepEqual([...inWindow.min, ...inWindow.max], [2.5, 10.375, 106.375, 3.5, 10.625, 107.875]);

// No solid is moved: the scene's solids are what they are without any figure, and the toilet
// in the corner still lies in it. And what a rule is handed for a block, for a door, for a
// window and for what stands in no room or clear of its walls is the box of its solid.
assert.deepEqual(scene.solids, sceneOf(site, things).solids);
assert.deepEqual([...scene.solids[6].min, ...scene.solids[6].max], [1, 8, 105, 1.5, 8.5, 105.5]);
const seen = [];
sceneOf(site, things, figures, { blocks: [(context) => seen.push(context) && []] });
const GAVE_WAY = [5, 6, 7, 9, 19, 21, 23, 24];
things.forEach((thing, at) => {
  const { min, max } = scene.solids[at];
  const handed = JSON.stringify(seen[0].boxOf(thing));
  assert.equal(handed === JSON.stringify({ min, max }), !GAVE_WAY.includes(at), `thing ${at}`);
});

// How far each stands from where the sketch has it, by hand: seven that were moved, and are
// lifted, `[dx, dy, dh]`; the flight cut about its own middle, and so lifted alone. Nothing is
// amiss - with no rule, and with the house's rules of blocks and the steps of a staircase.
const MOVED = {
  5: [0, -0.375, 0.375],
  6: [0.375, 0.375, 0.375],
  7: [-0.125, 0, 0.375],
  19: [-0.375, 0, 0.375],
  21: [0, -0.375, 0.375],
  23: [0.375, 0, 0.375],
  24: [0, 0.375, 0.375],
};
const moved = (at) => MOVED[at] ?? ([10, 11].includes(at) ? 0 : 0.375);
const built = sceneOf(site, things, figures, { kinds: steps });
assert.deepEqual([amiss(scene, moved), amiss(built, moved)], [[], []]);
// Told the lift alone, the question finds the seven: moved is no figure of speech.
const found = /^part \d+, a piece of thing (\d+), does not lie within the box of its object/;
const lifted = (at) => [moved(at)].flat().at(-1);
assert.deepEqual(
  amiss(scene, lifted).map((words) => found.exec(words)?.[1]),
  ['5', '6', '7', '19', '21', '23', '24'],
);
// The flight stays a flight: sixteen steps, each as wide as what it was cut to, which together
// reach from one end of the clear space to the other.
const flight = built.parts.filter((one) => one.thing === 9);
assert.deepEqual([flight.length, flight[0].min[0], flight[15].max[0]], [16, 1.375, 5.125]);
for (const step of flight) assert.deepEqual([step.min[1], step.max[1]], [5.25, 5.75]);

// WITH OTHER FIGURES every number follows: an outer wall of 0.5 m, half an inner one of 0.25 m,
// and a floor of 0.5 m. The toilets are moved by those walls, and the bed still stands clear.
// Along the flight 3.5 m are clear; across it the two walls meet in the middle of the stair
// room, nothing is clear, and it keeps its half metre about that middle. Each as x, x, y, y.
const stout = { ...figures, outerWallM: 0.5, innerWallM: 0.5, floorSlabM: 0.5 };
const reach = ({ min, max }) => [min[0], max[0], min[1], max[1]].join(' ');
assert.deepEqual(sceneOf(site, things, stout, alone).parts.slice(0, 5).map(reach), [
  '2 2.5 10 10.5',
  '1.5 2 8.5 9',
  '3.25 3.75 9.5 10',
  '5 7 8.5 10.5',
  '1.5 5 5.25 5.75',
]);

// THE LIFT. Three shafts of 6 m by 2 m and 6 m high, each with a flight on level 30 and a
// second one straight over it on level 24, both a cell clear of every edge: a shaft that is
// one block of two storeys; one of two boxes of one block; and one of two blocks, a storey
// each, where the lower flight comes up to the upper block's floor and opens it.
const shaft = (rows, lower, upper) => [
  box([2, 14], rows, lower.z, lower.more),
  ...(upper ? [box([2, 14], rows, [18, 24], upper)] : []),
  on('stairs', [3, 12], [rows[0] + 1, rows[1] - 1], [24, 30]),
  on('stairs', [3, 12], [rows[0] + 1, rows[1] - 1], [18, 24]),
];
const shafts = [
  ...shaft([2, 6], { z: [18, 30], more: { name: 'One block' } }),
  ...shaft([8, 12], { z: [24, 30], more: { name: 'Two boxes', group: 7 } }, { group: 7 }),
  ...shaft([14, 18], { z: [24, 30], more: { name: 'Two blocks' } }, { name: 'Over it' }),
];
// By hand: the shaft's floor is 0.375 m thick, so the lower flight stands on 105.375 m and
// ends 3 m higher, at 108.375 m. There the upper one begins, in every shaft: lifted by the
// floor of its block, whether that lies a storey under it or is open under it. Neither is
// moved or cut: from x = 1.5 to 6, and a metre wide.
const plainly = sceneOf(site, shafts, figures, alone);
const stepped = sceneOf(site, shafts, figures, { kinds: steps });
const ofThing = (all, at) => all.parts.filter((one) => one.thing === at);
for (const [lower, upper, y] of [
  [1, 2, 9.5],
  [5, 6, 6.5],
  [9, 10, 3.5],
]) {
  const [[first], [second]] = [ofThing(plainly, lower), ofThing(plainly, upper)];
  const boxed = (one) => [...one.min, ...one.max].join(' ');
  assert.equal(boxed(first), `1.5 ${y} 105.375 6 ${y + 1} 108.375`, `flight ${lower}`);
  assert.equal(boxed(second), `1.5 ${y} 108.375 6 ${y + 1} 111.375`, `flight ${upper}`);
  const [below, above] = [ofThing(stepped, lower), ofThing(stepped, upper)];
  assert.deepEqual([below.length, above.length], [16, 16]);
  assert.equal(above[0].min[2], below[15].max[2], `flight ${upper} begins where ${lower} ends`);
}
// In the shaft of two blocks the floor of the upper block is open under the upper flight: it
// has a floor, and none of it lies under the flight's middle, at x = 3.75 and y = 4.
const floors = ofThing(stepped, 8).filter((one) => one.of === 'floor');
const under = ({ min, max }) => min[0] < 3.75 && 3.75 < max[0] && min[1] < 4 && 4 < max[1];
assert.deepEqual([floors.length > 0, floors.some(under)], [true, false]);
// Nothing is amiss, every flight lifted by 0.375 m - and by 0.5 m where the floors are as thick.
assert.deepEqual([amiss(plainly, () => 0.375), amiss(stepped, () => 0.375)], [[], []]);
assert.deepEqual([amiss(sceneOf(site, shafts, stout, alone), () => 0.5)], [[]]);

// A DOOR AND A WINDOW BESIDE AN OPENING (walls.js). A stair room of 4.5 m by 1 m and its flight;
// a stair room over it whose floor is all opening, and which goes on for 1.5 m over a box of its
// own block, with no floor at all; a corridor beside that one. On level 24, at 108 m, a door
// across the wall of the two and a window in an outer wall of each, 1 m over the floor and 1 m
// high. By hand, the floor 0.375 m thick: the door opens both halves from 108.375 to 110.375 m,
// both panes lie from 109.375 m, and under them the stair room's walls run down to 108 m.
const landing = [
  box([2, 11], [4, 6], [24, 30]),
  box([2, 14], [4, 6], [18, 24], { group: 9 }),
  box([2, 14], [6, 10], [18, 24]),
  on('stairs', [2, 11], [4, 6], [24, 30]),
  on('door', [8, 10], [5, 7], [20, 24]),
  on('window', [4, 6], [3.7, 4.3], [20, 22], 24),
  on('window', [4, 6], [9.7, 10.3], [20, 22], 24),
  box([11, 14], [4, 6], [24, 30], { group: 9 }),
];
const beside = sceneOf(site, landing, figures, { kinds: {} });
const told = (x) =>
  beside.parts
    .filter((one) => one.of !== 'piece' && one.min[0] === x && one.max[0] === x + 1)
    .map((one) => `${one.thing} ${one.of} ${one.min[2]} ${one.max[2]}`);
assert.deepEqual(told(4), [
  '1 wall 108 108.375',
  '1 wall 110.375 110.6875',
  '2 wall 110.375 110.6875',
]);
assert.deepEqual(told(2), [
  '1 wall 108 109.375',
  '1 wall 110.375 110.6875',
  '1 pane 109.375 110.375',
  '2 wall 108.375 109.375',
  '2 wall 110.375 110.6875',
  '2 pane 109.375 110.375',
]);
assert.deepEqual([amiss(beside, () => 0.375)], [[]]);

process.stdout.write(
  'tools/sketch/scene: an object stands clear of the walls of its room, moved before it is cut, and a second flight begins where the first ends\n',
);
