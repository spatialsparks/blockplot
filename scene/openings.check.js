// The check of openings: made-up doors and windows in the walls of made-up rooms, against the
// walls and panes a person worked out by hand - a door in an outer wall and one in a wall of
// two rooms; a window in each of its four turns, and one between two rooms; a door in a corner
// in each of its turns; a door and a window that meet no wall of theirs; an opening that ends
// where its wall ends, lies beside another or in one, or stands on a level its room has no
// floor on; a door in a room as wide as itself; and the same with other figures. The walls
// themselves are walls.check.js's. Run by tools/sketch/check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { amiss } from './holds.js';
import { sceneOf } from './scene.js';
import { walls } from './walls.js';

// A made-up plot of 12 m by 5 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 8 - row / 2, and a level 116 - level / 2 metres above sea level. Its ground
// is flat, at 105 m: level 22, on which every room here stands.
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
// Made-up figures with which a door and a window fit under a ceiling. A room is 3 m high: its
// floor slab ends at 105.375 m, and its roof slab begins at 107.6875 m.
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

// A door and a window, as the pad hands them over: a door on a square of whole cells, a window
// long and thin about a line of the grid, each as high as the figures say - and here as high
// as it is told. A door is 2 m high, on level 22; a window 1.25 m, its sill 0.875 m over it.
const grey = { name: 'grey', hex: '#8795a1' };
const room = (name, x, y) => ({ x, y, z: [16, 22], colour: grey, name });
const thing = (kind, turn, x, y, z) => ({ x, y, z, kind, turn, fill: '#b0b0b0', floor: 22 });
const door = (turn, x, y, high = 4) => thing('door', turn, x, y, [22 - high, 22]);
const pane = (turn, x, y, z = [17.75, 20.25]) => thing('window', turn, x, y, z);
const things = [
  // 0 and 1: a parlour of 4 m by 4 m and a dining room of 3 m by 4 m, side by side.
  room('Parlour', [2, 10], [1, 9]),
  room('Dining', [10, 16], [1, 9]),
  // 2: a door across the parlour's outer wall down the paper - turned by three quarters, as if
  // it closed across the plot: it meets no wall that runs so, and opens the one it stands in.
  door(3, [4, 6], [8, 10]),
  // 3 and 4: in the wall of the two rooms a door, turned by a quarter, a cell in each room, and
  // right beside it a window, its middle on the face they share.
  door(1, [9, 11], [3, 5]),
  pane(1, [9.7, 10.3], [5, 8]),
  // 5 to 8: a window in each turn, exactly on a face: up the paper, down it, up the plot, down it.
  pane(0, [4, 7], [0.7, 1.3]),
  pane(2, [12, 15], [8.7, 9.3]),
  pane(1, [1.7, 2.3], [3, 6]),
  pane(3, [15.7, 16.3], [4, 7]),
  // 9 and 10: a door in the middle of the parlour, and a window that lies across the dining
  // room's wall up the paper and not along it: neither meets a wall of its own.
  door(0, [5, 7], [4, 6]),
  pane(1, [12.7, 13.3], [0, 3]),
];

// Figures worked out in tenths and in halves of halves differ in their last place: held to 1e-9.
const held = (value) =>
  JSON.parse(JSON.stringify(value), (key, one) =>
    typeof one === 'number' ? Math.round(one * 1e9) / 1e9 : one,
  );
// A part of the thing at a place, which stands on level 22: a box of a surface.
const BOX = { shape: 'box', floor: 105 };
const made = (of, surface) => (thing, min, max) => ({ ...BOX, of, min, max, surface, thing });
const wall = made('wall', 'plaster');
const glass = made('pane', 'glass');
const plain = made('piece', 'plain');
const only = (parts, word) => parts.filter((part) => part.of === word);
// By hand. An opening is as wide and as high as its object, raised by the floor slab: a door's
// from 105.375 m to 107.375 m, a window's from 106.25 m to 107.5 m. Its wall is cut where it
// begins and ends: a box beside, those under and over, a box beside - and then comes the pane.
const byHand = [
  // The parlour, up the plot: a window, and its pane in the middle of the wall's 0.375 m.
  wall(0, [1, 3.5, 105.375], [1.375, 5, 107.6875]),
  wall(0, [1, 5, 105.375], [1.375, 6.5, 106.25]),
  wall(0, [1, 5, 107.5], [1.375, 6.5, 107.6875]),
  wall(0, [1, 6.5, 105.375], [1.375, 7.5, 107.6875]),
  glass(0, [1.1675, 5, 106.25], [1.2075, 6.5, 107.5]),
  // Its half of the wall of two rooms: the window, and beside it the door, with nothing under
  // it and nothing between the two. No pane: one pane to a wall, and it is the dining room's.
  wall(0, [4.875, 3.5, 105.375], [5, 4, 107.6875]),
  wall(0, [4.875, 4, 105.375], [5, 5.5, 106.25]),
  wall(0, [4.875, 4, 107.5], [5, 5.5, 107.6875]),
  wall(0, [4.875, 5.5, 107.375], [5, 6.5, 107.6875]),
  wall(0, [4.875, 6.5, 105.375], [5, 7.5, 107.6875]),
  // Up the paper, a window; down the paper, the door in the outer wall.
  wall(0, [1, 7.125, 105.375], [2, 7.5, 107.6875]),
  wall(0, [2, 7.125, 105.375], [3.5, 7.5, 106.25]),
  wall(0, [2, 7.125, 107.5], [3.5, 7.5, 107.6875]),
  wall(0, [3.5, 7.125, 105.375], [5, 7.5, 107.6875]),
  glass(0, [2, 7.2925, 106.25], [3.5, 7.3325, 107.5]),
  wall(0, [1, 3.5, 105.375], [2, 3.875, 107.6875]),
  wall(0, [2, 3.5, 107.375], [3, 3.875, 107.6875]),
  wall(0, [3, 3.5, 105.375], [5, 3.875, 107.6875]),
  // The dining room's half of the wall of two rooms: opened as the parlour's, with the one
  // pane, against the face that the two share.
  wall(1, [5, 3.5, 105.375], [5.125, 4, 107.6875]),
  wall(1, [5, 4, 105.375], [5.125, 5.5, 106.25]),
  wall(1, [5, 4, 107.5], [5.125, 5.5, 107.6875]),
  wall(1, [5, 5.5, 107.375], [5.125, 6.5, 107.6875]),
  wall(1, [5, 6.5, 105.375], [5.125, 7.5, 107.6875]),
  glass(1, [5, 4, 106.25], [5.04, 5.5, 107.5]),
  // Down the plot, a window. Up the paper the wall is whole: the window across it opens
  // nothing. Down the paper, a window.
  wall(1, [7.625, 3.5, 105.375], [8, 4.5, 107.6875]),
  wall(1, [7.625, 4.5, 105.375], [8, 6, 106.25]),
  wall(1, [7.625, 4.5, 107.5], [8, 6, 107.6875]),
  wall(1, [7.625, 6, 105.375], [8, 7.5, 107.6875]),
  glass(1, [7.7925, 4.5, 106.25], [7.8325, 6, 107.5]),
  wall(1, [5, 7.125, 105.375], [8, 7.5, 107.6875]),
  wall(1, [5, 3.5, 105.375], [6, 3.875, 107.6875]),
  wall(1, [6, 3.5, 105.375], [7.5, 3.875, 106.25]),
  wall(1, [6, 3.5, 107.5], [7.5, 3.875, 107.6875]),
  wall(1, [7.5, 3.5, 105.375], [8, 3.875, 107.6875]),
  glass(1, [6, 3.6675, 106.25], [7.5, 3.7075, 107.5]),
  // The door and the window that open nothing keep the part an object has, a box of its size
  // on the floor slab: they were not taken. The seven that open a wall give no part.
  plain(9, [2.5, 5, 105.375], [3.5, 6, 107.375]),
  plain(10, [6.35, 6.5, 106.25], [6.65, 8, 107.5]),
];
const ALONE = { blocks: [walls], kinds: {} }; // the walls' rule alone, and no kind's
const alone = sceneOf(site, things, figures, ALONE);
assert.deepEqual(held(alone.parts), byHand);
// The three things hold, alone and with every rule: only the two that kept a part need a lift.
const lift = (at) => ({ 9: 0.375, 10: 0.375 })[at];
assert.deepEqual(amiss(alone, lift), []);
assert.deepEqual(amiss(sceneOf(site, things, figures), lift), []);

// A cabin of 3 m by 2.5 m alone: its four walls whole, by hand, and then the one that is opened.
const builtOf = (all, by = figures) => held(sceneOf(site, all, by, ALONE).parts);
const cabin = room('Cabin', [2, 8], [2, 7]);
const built = (objects, by) => builtOf([cabin, ...objects], by);
const [upPlot, downPlot, upPaper, downPaper] = [
  wall(0, [1, 4.5, 105.375], [1.375, 7, 107.6875]),
  wall(0, [3.625, 4.5, 105.375], [4, 7, 107.6875]),
  wall(0, [1, 6.625, 105.375], [4, 7, 107.6875]),
  wall(0, [1, 4.5, 105.375], [4, 4.875, 107.6875]),
];
assert.deepEqual(built([]), [upPlot, downPlot, upPaper, downPaper]);
// A door in a corner, with a wall along two edges of its square, opens the one that runs the
// way it closes - along the plot while it is not turned or turned by a half, across it by a
// quarter and by three. Its opening ends where the wall across begins, 0.375 m from the corner.
const cornered = (turn) => built([door(turn, [2, 4], [2, 4])]);
assert.deepEqual(cornered(0), [
  upPlot,
  downPlot,
  wall(0, [1, 6.625, 105.375], [1.375, 7, 107.6875]),
  wall(0, [1.375, 6.625, 107.375], [2, 7, 107.6875]),
  wall(0, [2, 6.625, 105.375], [4, 7, 107.6875]),
  downPaper,
]);
assert.deepEqual(cornered(1), [
  wall(0, [1, 4.5, 105.375], [1.375, 6, 107.6875]),
  wall(0, [1, 6, 107.375], [1.375, 6.625, 107.6875]),
  wall(0, [1, 6.625, 105.375], [1.375, 7, 107.6875]),
  downPlot,
  upPaper,
  downPaper,
]);
assert.deepEqual([cornered(2), cornered(3)], [cornered(0), cornered(1)]);

// An opening ends where its wall ends. A window of 1.75 m that reaches half a metre past the
// cabin's corner ends at the wall across it and under the roof slab, and its pane with it; and
// a door of 2.5 m, higher than the wall, has nothing over it.
const long = pane(0, [6, 9], [6.7, 7.3], [16.75, 20.25]);
assert.deepEqual(built([long, door(0, [4, 6], [1, 3], 5)]), [
  upPlot,
  downPlot,
  wall(0, [1, 6.625, 105.375], [2, 7, 107.6875]),
  wall(0, [3, 6.625, 105.375], [4, 7, 107.6875]),
  wall(0, [1, 4.5, 105.375], [3, 4.875, 107.6875]),
  wall(0, [3, 4.5, 105.375], [3.625, 4.875, 106.25]),
  wall(0, [3.625, 4.5, 105.375], [4, 4.875, 107.6875]),
  glass(0, [3, 4.6675, 106.25], [3.625, 4.7075, 107.6875]),
]);
// A face that runs along the edge of a window's thin box opens as one that runs through it.
assert.deepEqual(built([pane(0, [3, 6], [7, 7.6])]), built([pane(0, [3, 6], [6.7, 7.3])]));
// Two windows side by side are two holes that touch: under them the wall is one box, and over
// them one. They fill the wall's length, and end at the walls across it.
const twins = built([pane(0, [2, 5], [1.7, 2.3]), pane(0, [5, 8], [1.7, 2.3])]);
assert.deepEqual(only(twins, 'wall').slice(2, 6), [
  wall(0, [1, 6.625, 105.375], [1.375, 7, 107.6875]),
  wall(0, [1.375, 6.625, 105.375], [3.625, 7, 106.25]),
  wall(0, [1.375, 6.625, 107.5], [3.625, 7, 107.6875]),
  wall(0, [3.625, 6.625, 105.375], [4, 7, 107.6875]),
]);
assert.equal(only(twins, 'pane').length, 2);
// Holes may lie in each other, and what any of them opens is open: a door, and a low window
// drawn over it that reaches half a metre past it. Over the door the wall begins where the
// door ends, at 107.375 m, and not where the window does.
const nested = built([door(0, [4, 6], [1, 3]), pane(0, [4, 7], [1.7, 2.3], [18.75, 20.25])]);
assert.deepEqual(only(nested, 'wall').slice(2, 7), [
  wall(0, [1, 6.625, 105.375], [2, 7, 107.6875]),
  wall(0, [2, 6.625, 107.375], [3, 7, 107.6875]),
  wall(0, [3, 6.625, 105.375], [3.5, 7, 106.25]),
  wall(0, [3, 6.625, 107], [3.5, 7, 107.6875]),
  wall(0, [3.5, 6.625, 105.375], [4, 7, 107.6875]),
]);

// An opening is raised by the floor slab of the room whose wall it is, where that room has one
// there. A window 3 m up the wall of a hall two storeys high, on a level where the hall has no
// floor, lies as it was drawn: its sill 0.875 m over that level, at 108.875 m.
const hall = { ...room('Hall', [2, 8], [2, 7]), z: [10, 22] };
const upper = { ...pane(0, [3, 6], [1.7, 2.3], [11.75, 14.25]), floor: 16 };
const high = only(builtOf([hall, upper]), 'pane');
assert.deepEqual(high, [glass(0, [1.5, 6.7925, 108.875], [3, 6.8325, 110.125])]);
// In a wall of two rooms that runs along the plot the one pane is the room's that begins at
// the wall, down the paper, and lies against the face they share, at 5.5 m. It is never thicker
// than the half it lies in: with an inner wall of 0.0625 m, half of that.
const north = room('North', [2, 8], [2, 5]);
const pair = [north, room('South', [2, 8], [5, 8]), pane(0, [3, 6], [4.7, 5.3])];
const between = (by) => only(builtOf(pair, by), 'pane');
assert.deepEqual(between(), [glass(1, [1.5, 5.46, 106.25], [3, 5.5, 107.5])]);
const thin = between({ ...figures, innerWallM: 0.0625 });
assert.deepEqual(thin, [glass(1, [1.5, 5.46875, 106.25], [3, 5.5, 107.5])]);

// Walls of 0.75 m, on slabs of 0.5 m and 0.25 m. Up the plot the upper box of a bay stands half
// a metre on its lower box and a quarter on its own floor slab, in two boxes of wall: a window
// there opens both, and its one pane lies in the box that holds the wall's middle. A closet of
// 1 m by 1 m is filled by its walls: its door finds nothing to open, and keeps its part.
const stout = { ...figures, outerWallM: 0.75, floorSlabM: 0.5, roofSlabM: 0.25 };
const bay = [
  { ...room('Bay', [12, 13], [1, 5]), z: [20, 22], group: 3 },
  { ...room('Bay', [12, 16], [1, 5]), z: [16, 20], group: 3 },
  { ...pane(1, [11.7, 12.3], [2, 5], [17, 18]), floor: 20 },
  room('Closet', [2, 4], [2, 4]),
  door(0, [2, 4], [1, 3]),
];
const thick = builtOf(bay, stout);
const inBay = glass(1, [6.355, 6.25, 107], [6.395, 6.75, 107.5]);
assert.deepEqual(only(thick, 'pane'), [{ ...inBay, floor: 106 }]);
assert.deepEqual(only(thick, 'piece'), [plain(4, [1, 6.5, 105.5], [2, 7.5, 107.5])]);

// A door in a room as wide as itself, a passage of 1 m, has a wall along two opposite edges of
// its square and none through it. It opens the one its leaf closes on - up the plot when it is
// turned by a quarter, down the plot by three - and leaves the other whole. Not turned, or by
// a half, it closes across the two and meets no wall its way: it opens both, as walls across.
// In a lane of 1 m along the plot it closes down the paper while it is not turned and up it by
// a half: one lintel, in the one wall or in the other. And where a wall runs through its square
// too - two closets of half a metre under one door - it opens all four that it meets.
const narrow = (turn) => [room('Passage', [2, 4], [2, 8]), door(turn, [2, 4], [4, 6])];
const [, , ...ends] = builtOf(narrow(0).slice(0, 1));
const whole = (x, to) => [wall(0, [x, 4, 105.375], [to, 7, 107.6875])];
const open = (x, to) => [
  wall(0, [x, 4, 105.375], [to, 5, 107.6875]),
  wall(0, [x, 5, 107.375], [to, 6, 107.6875]),
  wall(0, [x, 6, 105.375], [to, 7, 107.6875]),
];
assert.deepEqual(builtOf(narrow(1)), [...open(1, 1.375), ...whole(1.625, 2), ...ends]);
assert.deepEqual(builtOf(narrow(3)), [...whole(1, 1.375), ...open(1.625, 2), ...ends]);
assert.deepEqual(builtOf(narrow(0)), [...open(1, 1.375), ...open(1.625, 2), ...ends]);
assert.deepEqual(builtOf(narrow(2)), builtOf(narrow(0)));
assert.deepEqual(amiss(sceneOf(site, narrow(1), figures)), []);
const over = (all) => builtOf(all).filter((part) => part.min[2] === 107.375);
const lane = (turn) => [room('Lane', [2, 8], [2, 4]), door(turn, [4, 6], [2, 4])];
assert.deepEqual(over(lane(0)), [wall(0, [2, 6, 107.375], [3, 6.375, 107.6875])]);
assert.deepEqual(over(lane(2)), [wall(0, [2, 6.625, 107.375], [3, 7, 107.6875])]);
const twin = [room('A', [2, 3], [2, 8]), room('B', [3, 4], [2, 8]), door(1, [2, 4], [4, 6])];
assert.equal(over(twin).length, 4);

// With other figures every number follows: an outer wall of 0.5 m, slabs of 0.25 m, a door of
// 2.25 m, a window of 1 m with its sill at 1.25 m. The cabin stands from 105.25 m to 107.75 m;
// its door is open up to 107.5 m, its window from 106.5 m, the pane in the middle of the wall.
const slim = { outerWallM: 0.5, floorSlabM: 0.25, roofSlabM: 0.25 };
const other = { ...figures, ...slim, doorHighM: 2.25, windowHighM: 1, sillHighM: 1.25 };
const others = [door(0, [4, 6], [6, 8], 4.5), pane(3, [7.7, 8.3], [3, 6], [17.5, 19.5])];
assert.deepEqual(built(others, other), [
  wall(0, [1, 4.5, 105.25], [1.5, 7, 107.75]),
  wall(0, [3.5, 4.5, 105.25], [4, 5, 107.75]),
  wall(0, [3.5, 5, 105.25], [4, 6.5, 106.5]),
  wall(0, [3.5, 5, 107.5], [4, 6.5, 107.75]),
  wall(0, [3.5, 6.5, 105.25], [4, 7, 107.75]),
  glass(0, [3.73, 5, 106.5], [3.77, 6.5, 107.5]),
  wall(0, [1, 6.5, 105.25], [4, 7, 107.75]),
  wall(0, [1, 4.5, 105.25], [2, 5, 107.75]),
  wall(0, [2, 4.5, 107.5], [3, 5, 107.75]),
  wall(0, [3, 4.5, 105.25], [4, 5, 107.75]),
]);
assert.deepEqual(amiss(sceneOf(site, [cabin, ...others], other)), []);

process.stdout.write(
  'tools/sketch/scene: a door opens the wall it stands in and a window opens it with a pane, each as far as the wall reaches\n',
);
