// The check of the walls under a top that slopes (story ST-026): the rule of walls.js alone, on
// a made-up plot and rooms made up on it, against walls worked out by hand - of a room alone
// its four walls: two with heads that slope, and the high one and the low one, each sloping
// across its own thickness, along the plot and across it; a top that comes down to the floor,
// and where the walls end; a door in a wall along the slope that is lower than the door, a door
// in the low wall, a window that its wall leaves room and one that it leaves none; half a wall
// of two rooms beside a level room, and a door through both halves; a wall under another
// block; a thicker wall under a thicker roof; and a wall across a flight - with nothing amiss
// in any of it. The roofs are roofs.check.js's. Run by tools/sketch/check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';
import { sceneOf } from './scene.js';
import { slabs } from './slabs.js';
import { walls } from './walls.js';

// A made-up plot of 16 m by 8 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 8 - row / 2, and a level 108 - level / 2 metres above sea level. Its ground
// is flat, at 102 m: level 12, on which every room here stands.
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
// Made-up figures, each a sum of halves of halves: a floor's slab ends at 102.375 m, and a
// roof is 0.3125 m thick, measured upright - so a wall ends that far under the top.
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
const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, more) => ({ x, y, z, colour: grey, ...more });
// A top that slopes, as a block says one: the row of a standing view it lies in at the first
// end of the box along an axis, and at the second. And a block as it is with a level top.
const top = (axis, ...rows) => ({ top: { axis, rows } });
const flat = (thing) => Object.fromEntries(Object.entries(thing).filter(([key]) => key !== 'top'));

// A wall by hand, of the thing at a place: a slant over a rectangle seen from above, `[x, y,
// to x, to y]`, from a level foot - the top of the floor's slab, unless it is told - up to its
// head: how high that lies at the lower figure of the rectangle along the extent it slopes
// along, and at the higher. Its box is the box around it.
const PART = { floor: 102 };
const wallOf =
  (thing, along) =>
  (lies, high, foot = 102.375) => ({
    ...PART,
    of: 'wall',
    shape: 'slant',
    min: [lies[0], lies[1], foot],
    max: [lies[2], lies[3], Math.max(...high)],
    along,
    low: [foot, foot],
    high,
    surface: 'plaster',
    thing,
  });
// And what is level: a box of wall, a pane, and the part of an object that opened nothing.
const boxed = (of, surface) => (thing, min, max) => ({
  ...PART,
  of,
  shape: 'box',
  min,
  max,
  surface,
  thing,
});
const [level, glass, plain] = [
  ['wall', 'plaster'],
  ['pane', 'glass'],
  ['piece', 'plain'],
].map((said) => boxed(...said));
// The parts that the rule alone makes of some things, with no rule of a kind, and those of one
// thing: every figure of a wall as it is, to its last place. Where a pane lies across its wall
// and a window's own box are worked out in hundredths and in tenths: those are held to 1e-9.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 : one,
  );
const alone = (things, by = figures) =>
  sceneOf(site, things, by, { blocks: [walls], kinds: {} }).parts;
const wallsOf = (things, thing, by) => alone(things, by).filter((part) => part.thing === thing);

// FOUR ROOMS ALONE, those of roofs.check.js. 0: a hall of 4 m by 3 m, 4 m high, whose top falls
// down the plot from 106 m at x = 1 to 104 m at x = 5. 1: a den of 3 m by 4 m, whose top falls
// across the plot against the rows, from 106 m at y = 3 to 104 m at y = 7. 2: a lean-to of 2 m,
// whose top falls to its floor, from 104 m at x = 11 to 102 m at x = 15. 3: a store whose top
// rises from its floor the same way.
const rooms = [
  box([2, 10], [2, 8], [4, 12], { name: 'Hall', ...top('x', 4, 8) }),
  box([14, 20], [2, 10], [4, 12], { name: 'Den', ...top('y', 8, 4) }),
  box([22, 30], [2, 8], [8, 12], { name: 'Lean-to', ...top('x', 8, 12) }),
  box([22, 30], [10, 16], [8, 12], { name: 'Store', ...top('x', 12, 8) }),
];
const [hall, den, lean, store] = [wallOf(0, 0), wallOf(1, 1), wallOf(2, 0), wallOf(3, 0)];
assert.deepEqual(alone(rooms), [
  // The hall. Under its roof a wall ends at 105.6875 m at x = 1, and at 103.6875 m at x = 5.
  // The wall up the plot is the high one: its head falls across its 0.375 m, to 105.5 m. The
  // wall down the plot is the low one, from 103.875 m at x = 4.625. The two along the plot run
  // from corner to corner, under the whole slope.
  hall([1, 4, 1.375, 7], [105.6875, 105.5]),
  hall([4.625, 4, 5, 7], [103.875, 103.6875]),
  hall([1, 6.625, 5, 7], [105.6875, 103.6875]),
  hall([1, 4, 5, 4.375], [105.6875, 103.6875]),
  // The den. The walls up and down the plot have the heads that slope: 105.6875 m at y = 3,
  // 103.6875 m at y = 7. The wall up the paper, at the larger y, is the low one, and the wall
  // down the paper the high one.
  den([7, 3, 7.375, 7], [105.6875, 103.6875]),
  den([9.625, 3, 10, 7], [105.6875, 103.6875]),
  den([7, 6.625, 10, 7], [103.875, 103.6875]),
  den([7, 3, 10, 3.375], [105.6875, 105.5]),
  // The lean-to: its high wall, under 103.6875 m. The two along the plot come down to the
  // floor's slab at x = 13.625, where the bottom of the roof meets it, and end there in an
  // edge. Beyond that no wall has height: the low wall is not there.
  lean([11, 4, 11.375, 7], [103.6875, 103.5]),
  lean([11, 6.625, 13.625, 7], [103.6875, 102.375]),
  lean([11, 4, 13.625, 4.375], [103.6875, 102.375]),
  // The store, the other way round: no wall up the plot, the high wall down the plot, and the
  // two along it from x = 12.375 on.
  store([14.625, 0, 15, 3], [103.5, 103.6875]),
  store([12.375, 2.625, 15, 3], [102.375, 103.6875]),
  store([12.375, 0, 15, 0.375], [102.375, 103.6875]),
]);

// DOORS AND WINDOWS, as the pad hands them over, on level 12: a door of 2 m on a square of
// whole cells, open from 102.375 m to 104.375 m where its wall lets it; a window of 1.25 m about
// a line of the grid, its sill 0.875 m over the floor's slab: from 103.25 m to 104.5 m.
const thing = (kind, turn, x, y, z) => ({ x, y, z, kind, turn, fill: '#b0b0b0', floor: 12 });
const door = (turn, x, y) => thing('door', turn, x, y, [8, 12]);
const pane = (x, y) => thing('window', 0, x, y, [7.75, 10.25]);
const opened = [
  rooms[0],
  rooms[2],
  // 2: a door across the hall's wall down the paper, in its corner down the plot, from x = 4 to
  // 5: there the wall's head falls from 104.1875 m, lower than the door. 3: a door across its
  // low wall, from y = 5 to 6. 4: a window in its wall up the paper, from x = 1.5 to 3, where the
  // head falls from 105.4375 m to 104.6875 m. 5: the same window in the lean-to's wall up the
  // paper, from x = 12.5 to 14, where the head falls from 102.9375 m to the floor: under the sill.
  door(0, [8, 10], [7, 9]),
  door(1, [9, 11], [4, 6]),
  pane([3, 6], [1.7, 2.3]),
  pane([25, 28], [1.7, 2.3]),
];
const leaning = wallOf(1, 0);
const walled = alone(opened).map((part) => (part.of === 'wall' ? part : held(part)));
assert.deepEqual(walled, [
  hall([1, 4, 1.375, 7], [105.6875, 105.5]),
  // The low wall. An opening is a box: it ends at the lowest place of the head along its
  // width, and across this wall that is the face, at 103.6875 m. Over it lies a lintel that is
  // 0.1875 m high at the room's side and nothing at the face.
  hall([4.625, 4, 5, 5], [103.875, 103.6875]),
  hall([4.625, 5, 5, 6], [103.875, 103.6875], 103.6875),
  hall([4.625, 6, 5, 7], [103.875, 103.6875]),
  // The wall up the paper: beside the window the wall with its own head; under it a box; over
  // it a lintel from 104.5 m up to the head; and the pane, the box of its opening, in the middle
  // of the wall's 0.375 m.
  hall([1, 6.625, 1.5, 7], [105.6875, 105.4375]),
  level(0, [1.5, 6.625, 102.375], [3, 7, 103.25]),
  hall([1.5, 6.625, 3, 7], [105.4375, 104.6875], 104.5),
  hall([3, 6.625, 5, 7], [104.6875, 103.6875]),
  glass(0, [1.5, 6.7925, 103.25], [3, 6.8325, 104.5]),
  // The wall down the paper: the door's opening ends at the low wall, a wall's thickness in at
  // x = 4.625, and is as high as the head leaves it along what is left of its width: to
  // 103.875 m, and not to 103.6875 m, where the head lies in the corner itself. Over it lies a
  // lintel that ends where the two meet.
  hall([1, 4, 4, 4.375], [105.6875, 104.1875]),
  hall([4, 4, 4.625, 4.375], [104.1875, 103.875], 103.875),
  hall([4.625, 4, 5, 4.375], [103.875, 103.6875]),
  // The lean-to's walls are whole: the window there opens nothing, and keeps the part an
  // object has - it was not taken. The two doors and the first window were, and give none.
  leaning([11, 4, 11.375, 7], [103.6875, 103.5]),
  leaning([11, 6.625, 13.625, 7], [103.6875, 102.375]),
  leaning([11, 4, 13.625, 4.375], [103.6875, 102.375]),
  plain(5, [12.5, 6.85, 103.25], [14, 7.15, 104.5]),
]);

// HALF A WALL OF TWO ROOMS, beside a level room: a side room of 3 m against the hall's face
// down the paper, up to 105 m. Beside it the hall has its half of an inner wall, 0.125 m thick,
// and over it an outer wall. The hall's head passes 105 m at x = 2.375: up to there the half is
// a box as high as the side room, and the outer wall over it ends in an edge; from there on
// the half has the head that slopes. The side room's walls are the walls it had.
const beside = [rooms[0], box([2, 10], [8, 12], [6, 12], { name: 'Side room' })];
assert.deepEqual(wallsOf(beside, 0).slice(3), [
  hall([1, 4, 2.375, 4.375], [105.6875, 105], 105),
  level(0, [1, 4, 102.375], [2.375, 4.125, 105]),
  hall([2.375, 4, 5, 4.125], [105, 103.6875]),
]);
assert.deepEqual(wallsOf(beside, 1), wallsOf(beside.map(flat), 1));
assert.deepEqual(wallsOf(beside, 1)[2], level(1, [1, 3.875, 102.375], [5, 4, 104.6875]));
// A door through both halves, from x = 3.5 to 4.5, is opened at two heights: as high as it is
// in the side room's half, to 104.375 m, and to 103.9375 m in the hall's.
const through = [...beside, door(0, [7, 9], [7, 9])];
const lintels = (at) => wallsOf(through, at).filter(({ min }) => min[0] === 3.5);
assert.deepEqual(lintels(0), [hall([3.5, 4, 4.5, 4.125], [104.4375, 103.9375], 103.9375)]);
assert.deepEqual(lintels(1), [level(1, [3.5, 3.875, 104.375], [4.5, 4, 104.6875])]);

// A WALL UNDER ANOTHER BLOCK ends at the top itself: there its box has no roof. Under a loft
// that lies over all of the hall, its four walls end at 106 m at x = 1 and at 104 m at x = 5.
// Under one that lies over its two metres down the plot, the walls along the plot are in two:
// under the hall's own roof to x = 3, and from there under its top, 0.3125 m higher.
const loft = (x) => box(x, [2, 8], [0, 4], { name: 'Loft' });
const [under, half] = [
  [rooms[0], loft([2, 10])],
  [rooms[0], loft([6, 14])],
];
assert.deepEqual(wallsOf(under, 0), [
  hall([1, 4, 1.375, 7], [106, 105.8125]),
  hall([4.625, 4, 5, 7], [104.1875, 104]),
  hall([1, 6.625, 5, 7], [106, 104]),
  hall([1, 4, 5, 4.375], [106, 104]),
]);
assert.deepEqual(wallsOf(half, 0), [
  hall([1, 4, 1.375, 7], [105.6875, 105.5]),
  hall([4.625, 4, 5, 7], [104.1875, 104]),
  hall([1, 6.625, 3, 7], [105.6875, 104.6875]),
  hall([3, 6.625, 5, 7], [105, 104]),
  hall([1, 4, 3, 4.375], [105.6875, 104.6875]),
  hall([3, 4, 5, 4.375], [105, 104]),
]);

// A THICKER WALL UNDER A THICKER ROOF, and every number follows: outer walls of 0.75 m under a
// roof of half a metre. The hall's walls end half a metre under its top, and the high one and
// the low one slope across three quarters of a metre.
const stout = { ...figures, outerWallM: 0.75, roofSlabM: 0.5 };
assert.deepEqual(wallsOf(rooms, 0, stout), [
  hall([1, 4, 1.75, 7], [105.5, 105.125]),
  hall([4.25, 4, 5, 7], [103.875, 103.5]),
  hall([1, 6.25, 5, 7], [105.5, 103.5]),
  hall([1, 4, 5, 4.75], [105.5, 103.5]),
]);

// A WALL ACROSS A FLIGHT, under a slope: the lower of the two ends it. The house of
// flights.check.js, on this plot: a stair room from x = 1 to 4 and after it a storage to
// x = 6.5, both a metre wide from y = 1, 3 m high; a hall beside them up the paper; and a
// flight of 4.5 m from x = 2, fitted from y = 1.375 to 1.875, its foot in the stair room. The
// flight is the storage's ceiling: the storage has no roof. Its half of the wall across,
// 0.125 m thick from x = 4, ends under the step over it at 103.75 m. Now the storage's top
// falls up the paper, two metres with every metre: 105 m at y = 1 and 103 m at y = 2. Beside
// the flight the wall ends under that top. Under the flight the step ends it as far as the top
// is higher - to y = 1.625, where the top passes 103.75 m - and from there the top does.
const stairs = [
  box([2, 8], [12, 14], [6, 12], { name: 'Staircase' }),
  box([8, 13], [12, 14], [6, 12], { name: 'Storage', ...top('y', 10, 6) }),
  box([2, 13], [6, 12], [6, 12], { name: 'Hall' }),
  { ...thing('stairs', 0, [4, 13], [12, 14], [6, 12]), fill: '#eceff2' },
];
const storage = wallOf(1, 1);
const across = wallsOf(stairs, 1).filter(({ max }) => max[0] === 4.125);
assert.deepEqual(across, [
  storage([4, 1, 4.125, 1.375], [105, 104.25]),
  level(1, [4, 1.375, 102.375], [4.125, 1.625, 103.75]),
  storage([4, 1.625, 4.125, 1.875], [103.75, 103.25]),
  storage([4, 1.875, 4.125, 2], [103.25, 103]),
]);

// NOTHING IS AMISS in any of it: with the rule alone, with the slabs under it and over it, and
// with every rule there is - no wall rises over the top of its block or lies in its roof. By
// hand, how far an object is lifted that has parts: a window by its floor's slab, and the
// flight moved clear of its walls as flights.check.js has it.
const MOVED = [-0.375, 0.125, 0.375];
for (const [things, lift, by] of [
  [rooms],
  [opened, 0.375],
  [beside],
  [through],
  [under],
  [half],
  [rooms, 0, stout],
  [stairs, MOVED],
]) {
  for (const blocks of [[walls], [slabs, walls], undefined]) {
    const wrong = amiss(
      sceneOf(site, things, by ?? figures, blocks && { blocks }),
      () => lift ?? 0,
    );
    assert.deepEqual(wrong, [], `${things.length} things`);
  }
}

process.stdout.write(
  'tools/sketch/scene: under a top that slopes a wall ends under the roof, with a head that slopes along it or across it, and a door and a window end under that head\n',
);
