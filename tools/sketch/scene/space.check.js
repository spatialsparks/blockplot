// The space's check: made-up boxes in cells, and what the space says of them against what a
// person read off them by hand - who holds a cell, which boxes are one block, what a block
// counts as and is called, a box of cells in metres, and the faces of a box cut into pieces.
// Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { GLASS, OPEN, ROOM, isBlock, metres, pieces, spaceOf } from './space.js';

// Eight made-up things. A hall of 4 columns, 3 rows and 4 levels. A wing against its end down
// the plot, half as high and a row narrower, and a porch against the wing: two boxes of one
// block, of which the second alone has a name and says what the block counts as. A tree on the
// hall's roof. A shed against the hall's side, along half of it. A niche drawn into a corner of
// the hall, which says a word that is none of the three. And two boxes of one more block: the
// first says that it is a room and has an empty name, the second that it is glass.
const things = [
  { x: [2, 6], y: [1, 4], z: [4, 8], name: 'Hall' },
  { x: [6, 8], y: [2, 4], z: [6, 8], group: 4 },
  { x: [8, 9], y: [2, 3], z: [7, 8], group: 4, name: 'Wing', as: 'open' },
  { x: [3, 4], y: [2, 3], z: [0, 4], kind: 'tree', turn: 0, fill: '#5a9e4b', floor: 4 },
  { x: [4, 8], y: [4, 6], z: [4, 8], name: 'Shed', as: 'glass' },
  { x: [2, 3], y: [1, 2], z: [7, 8], name: 'Niche', as: 'cave' },
  { x: [11, 12], y: [1, 2], z: [7, 8], group: 6, name: '', as: 'room' },
  { x: [12, 13], y: [1, 2], z: [7, 8], group: 6, name: 'Second', as: 'glass' },
];
assert.deepEqual(things.map(isBlock), [true, true, true, false, true, true, true, true]);
const { who, same, asOf, nameOf } = spaceOf(things);

// A cell is named by its first column, its first row and its first level: the hall holds the
// columns 2 to 5, the rows 1 to 3 and the levels 4 to 7, and nothing beside them, over them or
// under them. A cell is whole: no box holds half of one.
assert.equal(who(2, 1, 4), 0);
assert.equal(who(5, 3, 7), 0);
for (const [column, row, level] of [
  [1, 1, 4],
  [6, 1, 4],
  [2, 0, 4],
  [2, 4, 4],
  [2, 1, 3],
  [2, 1, 8],
  [2.5, 1, 4],
]) {
  assert.equal(who(column, row, level), -1, `cell ${column}, ${row}, ${level}`);
}
assert.deepEqual([who(6, 2, 6), who(7, 3, 7), who(8, 2, 7), who(4, 4, 4)], [1, 1, 2, 4]);
// An object holds no cell: the tree's box is nobody's. And of two boxes that hold one cell, the
// later holds it: the niche its one cell, and the hall the cell over it.
assert.equal(who(3, 2, 3), -1);
assert.deepEqual([who(2, 1, 7), who(2, 1, 6), who(3, 1, 7)], [5, 0, 0]);

// Two boxes are one block as one thing, or as two of one group - and two things that have no
// group are two blocks. Where no block is, nothing is the same.
assert.deepEqual([same(0, 0), same(1, 2), same(2, 1), same(6, 7)], [true, true, true, true]);
assert.deepEqual([same(0, 1), same(1, 4), same(0, 5), same(2, 6)], [false, false, false, false]);
assert.deepEqual([same(-1, -1), same(0, -1), same(-1, 0)], [false, false, false]);

// What a block counts as: a room where it says nothing, or a word that is none of the three.
// Of a block's boxes the first that says one of the three speaks for all - the porch for the
// wing, which says nothing, and the box that says room before the one that says glass. And
// nothing where no block is: at an object, and at nobody's place.
assert.deepEqual([0, 1, 2, 4, 5, 6, 7].map(asOf), [ROOM, OPEN, OPEN, GLASS, ROOM, ROOM, ROOM]);
assert.deepEqual([asOf(3), asOf(-1), asOf(8)], [null, null, null]);
assert.deepEqual([ROOM, OPEN, GLASS], ['room', 'open', 'glass']);
// A block's name is the first that one of its boxes has: an empty one is none.
assert.deepEqual([0, 1, 2, 4, 5, 6, 7].map(nameOf), [
  'Hall',
  'Wing',
  'Wing',
  'Shed',
  'Niche',
  'Second',
  'Second',
]);
assert.deepEqual([nameOf(3), nameOf(-1)], ['', '']);

// A box of cells in metres, on a made-up plot of half-metre cells: columns from x = -1 on, rows
// of the top view from y = 2 down, levels from 112 m down. By hand, columns 1 to 3 are x = -0.5
// to 0.5, rows 1 to 3 are y = 1.5 down to 0.5, and levels 6 to 10 are 109 m down to 107 m: the
// second row is the lower figure. A flat box - a piece of a face - comes out flat.
const frame = {
  xOf: (column) => -1 + column * 0.5,
  yOf: (row) => 2 - row * 0.5,
  hOf: (level) => 112 - level * 0.5,
};
assert.deepEqual(metres(frame, { x: [1, 3], y: [1, 3], z: [6, 10] }), {
  min: [-0.5, 0.5, 107],
  max: [0.5, 1.5, 109],
});
assert.deepEqual(metres(frame, { x: [1, 3], y: [1.5, 3], z: [10, 10] }), {
  min: [-0.5, 0.5, 107],
  max: [0.5, 1.25, 107],
});

// The six faces of a box of two cells: for each, the cell inside the box at every square, the
// cell beyond the face, and the one piece that a single word makes of it - flat across the
// face, at the first or the second figure of that extent.
const two = { x: [3, 5], y: [1, 2], z: [7, 8] };
const asked = (face) => {
  const cells = [];
  const made = pieces(two, face, (within, beyond) => {
    cells.push([within, beyond]);
    return 'all';
  });
  return { cells, made };
};
const inside = [
  [3, 1, 7],
  [4, 1, 7],
];
const byHand = {
  x0: [[[inside[0], [2, 1, 7]]], { x: [3, 3], y: [1, 2], z: [7, 8] }],
  x1: [[[inside[1], [5, 1, 7]]], { x: [5, 5], y: [1, 2], z: [7, 8] }],
  y0: [inside.map((cell, at) => [cell, [3 + at, 0, 7]]), { x: [3, 5], y: [1, 1], z: [7, 8] }],
  y1: [inside.map((cell, at) => [cell, [3 + at, 2, 7]]), { x: [3, 5], y: [2, 2], z: [7, 8] }],
  z0: [inside.map((cell, at) => [cell, [3 + at, 1, 6]]), { x: [3, 5], y: [1, 2], z: [7, 7] }],
  z1: [inside.map((cell, at) => [cell, [3 + at, 1, 8]]), { x: [3, 5], y: [1, 2], z: [8, 8] }],
};
for (const [face, [cells, piece]] of Object.entries(byHand)) {
  assert.deepEqual(asked(face), { cells, made: [{ word: 'all', ...piece }] }, face);
}

// A face by what lies beyond it: open where no block does, shared where one does. The hall's
// end down the plot is 3 rows by 4 levels. The wing lies against its two lower levels, and not
// against its first row: two levels are open from side to side and are one piece, and below
// them a row is open and two are shared - a run a level, and equal runs in levels next to each
// other are one.
const beyond = (within, cell) => (who(...cell) < 0 ? 'open' : 'shared');
assert.deepEqual(pieces(things[0], 'x1', beyond), [
  { word: 'open', x: [6, 6], y: [1, 4], z: [4, 6] },
  { word: 'open', x: [6, 6], y: [1, 2], z: [6, 8] },
  { word: 'shared', x: [6, 6], y: [2, 4], z: [6, 8] },
]);
// The hall's side lies half against the shed: 4 columns by 4 levels, and the shed stands
// against the two columns down the plot, as high as the hall. Two pieces, each half the face.
assert.deepEqual(pieces(things[0], 'y1', beyond), [
  { word: 'open', x: [2, 4], y: [4, 4], z: [4, 8] },
  { word: 'shared', x: [4, 6], y: [4, 4], z: [4, 8] },
]);
// A face is the box's own, wherever the box stands: the porch's top is open, one square.
assert.deepEqual(pieces(things[2], 'z0', beyond), [
  { word: 'open', x: [8, 9], y: [2, 3], z: [7, 7] },
]);

// The pieces of a made-up floor, 4 columns by 5 rows, drawn here as its squares: a letter is a
// word, a dot is no piece. A run ends at a dot and at another word. Runs are one piece where
// they are equal in rows next to each other - the first two rows of `a`, and the two of `b` -
// and not where a row lies between them, or where one is longer than the other. They come in
// the order they begin: row by row, and along a row.
const drawn = ['aa.a', 'aa.b', '...b', 'aaa.', 'aa..'];
const floor = { x: [10, 14], y: [20, 25], z: [30, 31] };
const letter = ([column, row]) => {
  const word = drawn[row - 20][column - 10];
  return word === '.' ? null : word;
};
assert.deepEqual(pieces(floor, 'z1', letter), [
  { word: 'a', x: [10, 12], y: [20, 22], z: [31, 31] },
  { word: 'a', x: [13, 14], y: [20, 21], z: [31, 31] },
  { word: 'b', x: [13, 14], y: [21, 23], z: [31, 31] },
  { word: 'a', x: [10, 13], y: [23, 24], z: [31, 31] },
  { word: 'a', x: [10, 12], y: [24, 25], z: [31, 31] },
]);
// Where nothing is told there is no piece - null, or nothing at all - and a piece is a new
// thing each time: what is done to one changes no other.
assert.deepEqual(
  pieces(floor, 'z1', () => null),
  [],
);
assert.deepEqual(
  pieces(floor, 'x0', () => undefined),
  [],
);
const [first] = pieces(floor, 'z1', letter);
first.y[1] = 99;
assert.deepEqual(pieces(floor, 'z1', letter)[0].y, [20, 22]);

process.stdout.write(
  'tools/sketch/scene: a cell has one block, and a face is cut into pieces by what lies beyond it\n',
);
