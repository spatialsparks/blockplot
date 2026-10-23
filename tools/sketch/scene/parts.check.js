// The check of the scene's parts, as a contract: none without figures, and the scene as it was;
// with figures, the parts of every thing in the order of the things, each with its thing and
// its floor; the rules of blocks before any object, and an object that one of them took gives
// nothing; and what a rule gets, against a made-up plot worked out by hand. The rules here are
// the check's own. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { OF, SHAPES } from './parts.js';
import { sceneOf } from './scene.js';

// A made-up plot of 9 m by 6 m, in cells of a whole metre - the cell is the site's: a column
// is x = 10 + column, a row of the top view y = 50 - row, a level 320 - level metres above sea
// level. Its ground is a plane: 310 m at the top left corner of the paper, half a metre lower
// with every column and a quarter with every row.
const site = {
  cellM: 1,
  xFromM: 10,
  xToM: 19,
  yFromM: 44,
  yToM: 50,
  sideM: [300, 320],
  outline: [
    [11, 49],
    [18, 49],
    [11, 45],
  ],
  ground: {
    baseM: 300,
    rowsCm: Array.from({ length: 7 }, (line, row) =>
      Array.from({ length: 10 }, (point, column) => 1000 - 50 * column - 25 * row).join(' '),
    ),
  },
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

// Five made-up things, an object first. A gnome on the ground, which lies at 305.875 m under
// its middle: in row 14.125 of a standing paper. A room of 2 m by 2 m, 4 m high, on level 12,
// at 308 m. A tree of 6 m on the ground, which lies at 305 m under its middle: on level 15,
// where no block stands. A second room, 2 m high. And a gnome on the first room's floor.
const grey = { name: 'grey', hex: '#8795a1' };
const thing = (kind, x, y, z, floor) => ({ x, y, z, kind, turn: 0, fill: '#b0b0b0', floor });
const things = [
  thing('gnome', [7, 8], [1, 2], [12.125, 14.125], 14.125),
  { x: [1, 3], y: [1, 3], z: [8, 12], colour: grey, name: 'First' },
  thing('tree', [7, 9], [3, 5], [9, 15], 15),
  { x: [4, 6], y: [1, 3], z: [10, 12], colour: grey, name: 'Second' },
  thing('gnome', [1, 2], [1, 2], [10, 12], 12),
];

// Without figures the scene is the scene it was, and has no part: no rule is asked. With
// figures it has parts, and all else is the same.
const asked = [];
const bare = sceneOf(site, things, undefined, { blocks: [(context, at) => asked.push(at)] });
assert.deepEqual([bare.parts, asked], [[], []]);
assert.deepEqual(sceneOf(site, things).parts, []);
const scene = sceneOf(site, things, figures);
assert.ok(scene.parts.length > 0);
for (const key of ['solids', 'levels', 'ground', 'outline', 'box']) {
  assert.deepEqual(scene[key], bare[key], key);
}
assert.deepEqual(Object.keys(scene).sort(), 'box ground levels outline parts solids'.split(' '));
// The house's own rules and the objects' own are the ones asked unless others are told: the
// first room has a floor, and the tree a trunk and a crown.
const made = (parts) => parts.map((part) => `${part.thing} ${part.of} ${part.shape}`);
assert.ok(made(scene.parts).includes('1 floor box'));
assert.deepEqual(
  made(scene.parts).filter((words) => words.startsWith('2 ')),
  ['2 piece round', '2 piece ball'],
);
// Nothing drawn, nothing made - and objects alone are parts too.
assert.deepEqual(sceneOf(site, [], figures).parts, []);
assert.deepEqual(made(sceneOf(site, [things[2]], figures).parts), [
  '0 piece round',
  '0 piece ball',
]);

// What a part can be, and the shapes it can have: the words of the contract.
assert.deepEqual(OF, ['floor', 'roof', 'wall', 'pane', 'frame', 'rail', 'step', 'piece']);
assert.deepEqual(SHAPES, ['box', 'round', 'ball', 'dome', 'wedge', 'slant']);

// Two rules of the check's own: each makes of a box one part as large as the box, in a surface
// of its own. They say when they are asked, and for which box.
const calls = [];
const walled = (surface) => (context, at) => {
  calls.push(`${surface} ${at}`);
  return [
    Object.freeze({ of: 'wall', shape: 'box', ...context.boxOf(context.things[at]), surface }),
  ];
};
const blocks = [walled('plaster'), walled('paint')];
const gnome = (context, at) => {
  calls.push(`gnome ${at}`);
  return [{ of: 'piece', shape: 'box', ...context.boxOf(context.things[at]), surface: 'plain' }];
};
const told = sceneOf(site, things, figures, { blocks, kinds: { gnome } });

// The rules of blocks are asked first - each for every box, in the order of the things, the
// rules of one box in their own order - and the objects after them.
assert.deepEqual(calls, ['plaster 1', 'paint 1', 'plaster 3', 'paint 3', 'gnome 0', 'gnome 4']);
// The parts come in the order of their things, and of one thing as its rules give them. Each
// has the place of its thing and the floor that thing stands on - the solid's. By hand: the
// gnome on the ground where it is; the rooms' boxes, 308 m to 312 m and to 310 m; the tree as
// a plain box, for no rule is told for its kind; and the gnome in the room lifted by the
// room's floor slab, 0.375 m, whether or not a rule makes that slab - and moved out of the
// room's corner, where the sketch has it in two outer walls of 0.375 m, whether or not a rule
// makes those walls: from x = 11 to 11.375, and from y = 49 down to 48.625 (clear.js).
const part = (place, stands, of, min, max, surface) => ({
  of,
  shape: 'box',
  min,
  max,
  surface,
  thing: place,
  floor: stands,
});
assert.deepEqual(told.parts, [
  part(0, 305.875, 'piece', [17, 48, 305.875], [18, 49, 307.875], 'plain'),
  part(1, 308, 'wall', [11, 47, 308], [13, 49, 312], 'plaster'),
  part(1, 308, 'wall', [11, 47, 308], [13, 49, 312], 'paint'),
  part(2, 305, 'piece', [17, 45, 305], [19, 47, 311], 'plain'),
  part(3, 308, 'wall', [14, 47, 308], [16, 49, 310], 'plaster'),
  part(3, 308, 'wall', [14, 47, 308], [16, 49, 310], 'paint'),
  part(4, 308, 'piece', [11.375, 47.625, 308.375], [12.375, 48.625, 310.375], 'plain'),
]);
told.parts.forEach((one) => assert.equal(one.floor, told.solids[one.thing].floor));

// A rule of blocks takes objects: the gnome that stands before its box in the list, and - twice
// - the one after. Neither gives a part, and the rule of their kind is not asked. The tree,
// which nobody took, gives its own. A block cannot be taken: its parts are made.
calls.length = 0;
const taker = (context, at) => {
  if (at === 3) [0, 4, 4, 1].forEach((place) => context.take(place));
  return [];
};
const taken = sceneOf(site, things, figures, { blocks: [taker, blocks[0]], kinds: { gnome } });
assert.deepEqual(made(taken.parts), ['1 wall box', '2 piece box', '3 wall box']);
assert.deepEqual(calls, ['plaster 1', 'plaster 3']);

// What a rule gets, taken by a rule of the check's own: one and the same for every box.
const seen = [];
const probe = (context) => {
  seen.push(context);
  return [];
};
sceneOf(site, things, figures, { blocks: [probe] });
const [context] = seen;
assert.ok(seen.length === 2 && seen[1] === context);
assert.deepEqual(
  Object.keys(context).sort(),
  'boxOf figures groundAt hOf lift space take taken things xOf yOf'.split(' '),
);
assert.ok(context.things === things && context.figures === figures);
// The frame, by hand: column 3 is x = 13, row 2 of the top view y = 48, level 12 is 308 m. A
// box of cells in metres is the box of its solid - for every thing but the gnome in the first
// room's corner, whose box is its own moved clear of the room's walls - and the first room's
// is 11 to 13 along the plot, 47 to 49 across it, 308 m to 312 m.
assert.deepEqual([context.xOf(3), context.yOf(2), context.hOf(12)], [13, 48, 308]);
assert.deepEqual(context.boxOf(things[1]), { min: [11, 47, 308], max: [13, 49, 312] });
const inItsRoom = { min: [11.375, 47.625, 308], max: [12.375, 48.625, 310] };
things.forEach((one, at) => {
  const { min, max } = scene.solids[at];
  assert.deepEqual(context.boxOf(one), at === 4 ? inItsRoom : { min, max }, `thing ${at}`);
});
// The ground at a place of the top view's paper, by hand: 310 m less half a metre a column and
// a quarter a row - between the lines of the grid too, and off the paper as high as at its edge.
assert.equal(context.groundAt(0, 0), 310);
assert.equal(context.groundAt(2.5, 1.5), 310 - 1.25 - 0.375);
assert.equal(context.groundAt(9, 6), 304);
assert.deepEqual([context.groundAt(-3, 0), context.groundAt(12, 9)], [310, 304]);
// The space is the things': the first room holds the cell of column 1, row 1, level 11.
assert.deepEqual([context.space.who(1, 1, 11), context.space.who(1, 1, 12)], [1, -1]);
assert.equal(context.space.nameOf(3), 'Second');
// The lift, and what was taken: nothing, until a rule takes it.
assert.deepEqual([context.lift(4), context.lift(0), context.lift(2)], [0.375, 0, 0]);
assert.deepEqual([context.taken(4), context.take(4), context.taken(4)], [false, undefined, true]);

// A part is handed over as its rule made it, with its thing and its floor and nothing else
// changed: what a wedge says of itself stays, and an object's part is lifted - its box, and
// not what it winds round. A rule's own part is not written on: the walls above were frozen.
const tread = { shape: 'wedge', about: [11.5, 48.5], from: 0, to: 30, inner: 0.125, outer: 0.5 };
const spiral = () => [
  { of: 'step', min: [11.5, 48.5, 308], max: [12, 48.75, 308.25], surface: 'wood', ...tread },
];
const stair = { blocks: [], kinds: { gnome: spiral } };
assert.deepEqual(sceneOf(site, [things[1], things[4]], figures, stair).parts, [
  { ...part(1, 308, 'step', [11.5, 48.5, 308.375], [12, 48.75, 308.625], 'wood'), ...tread },
]);

process.stdout.write(
  'tools/sketch/scene: the parts come by rules, in the order of their things, each with its thing and its floor\n',
);
