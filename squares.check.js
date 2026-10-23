// The check of the ground as squares (story ST-042, squares.js): the tree made, read and refused,
// by hand. Small papers whose trees are worked out below; the faces between and beyond their grid
// points; every sentence of `fault`, each on a text also wrong in every way said after it; the
// made-up plot's ground, a plane; `walk`; and Rule 3 at the largest size the pad takes - a
// made-up rough hillside of 1000 m by 1000 m, made here by a rule of its own, held within 5 cm at
// every one of its 4 004 001 grid points. No browser, no server, nothing of a real plot. Run by
// check.js, as every check is, or alone:
//   pnpm exec node tools/sketch/squares.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import './demo-site.js';
import './squares.js';

const { squares, SITE } = globalThis;
assert.deepEqual(Object.keys(squares), ['TOLERANCE_CM', 'make', 'fault', 'read', 'walk']);
assert.equal(squares.TOLERANCE_CM, 5);
/** A height at every grid point of a paper, a row after another, of a rule by column and row. */
const grid = (cols, rows, cm) =>
  Array.from({ length: (cols + 1) * (rows + 1) }, (_, at) =>
    cm(at % (cols + 1), Math.floor(at / (cols + 1))),
  );
const made = (cols, rows, cm) => squares.make(grid(cols, rows, cm), cols, rows);
const tree = (cols, rows, cm) => squares.read({ baseM: 0, ...made(cols, rows, cm) }, cols, rows);

// A paper of 4 by 4 cells, flat at 100 cm: its root, whole.
assert.deepEqual(
  made(4, 4, () => 100),
  {
    squares: 'o',
    cornersCm: ['100 100', '', '', '', '100 100'],
  },
);
// Its middle grid point at 110 cm: each quarter misses the middles of its two inner edges by
// exactly 5 cm - within - and its own middle by 2.5. At 111 cm they miss by 5.5: every quarter
// split, and every grid point a corner.
const MIDDLE = (cm) => (c, r) => (c === 2 && r === 2 ? cm : 100);
assert.deepEqual(made(4, 4, MIDDLE(110)), {
  squares: '+oooo',
  cornersCm: ['100 100 100', '', '100 110 100', '', '100 100 100'],
});
const ALL = '100 100 100 100 100';
assert.deepEqual(made(4, 4, MIDDLE(111)), {
  squares: '++oooo+oooo+oooo+oooo',
  cornersCm: [ALL, ALL, '100 100 111 100 100', ALL, ALL],
});
// A paper of 5 by 3 cells, flat at 0: the root of 8, split where it is partly beyond the paper,
// down to the cells of its last column and its last row.
const FIVE_BY_THREE = '++oo+oo..+oo..++o.o..+o......';
assert.deepEqual(
  made(5, 3, () => 0),
  {
    squares: FIVE_BY_THREE,
    cornersCm: ['0 0 0 0', '0 0', '0 0 0 0 0 0', '0 0 0 0 0 0'],
  },
);

// The faces, on a paper of 4 by 4 cells: a plane, 10 cm a column and 2 a row, and on it 20 cm
// more at (1, 1) and 4 more at (2, 1). The root misses (1, 1); its top left quarter is split into
// its cells, and its top right quarter misses (2, 1) by 4 cm alone: whole.
const BUMPED = (c, r) => 10 * c + 2 * r + (r === 1 ? [0, 20, 4, 0, 0][c] : 0);
assert.deepEqual(made(4, 4, BUMPED), {
  squares: '++ooooooo',
  cornersCm: ['0 10 20 40', '2 32 26', '4 14 24 44', '', '8 28 48'],
});
const bumped = tree(4, 4, BUMPED);
assert.deepEqual([bumped.count, bumped.lowest, bumped.highest], [7, 0, 48]);
// At a corner; in the middle of the top right quarter, the mean of its four; on the line between
// a cell and that quarter, the right one's - 21, where the cell's would be 23; on the paper's right
// edge and its bottom one, the square left of it and above it; beyond each edge, the nearest one.
const PLACES = [
  [1, 1, 32],
  [3, 1, 32],
  [2, 0.5, 21],
  [4, 1, 42],
  [3, 4, 38],
  [-3, 1, 2],
  [2, -5, 20],
  [9, 1, 42],
  [3, 7, 38],
  [99, -9, 40],
];
for (const [c, r, cm] of PLACES) assert.equal(bumped.cmAt(c, r), cm, `${c}, ${r}`);

// Every sentence of `fault`, in its order: each on a ground also wrong in every way after it.
const NO_TREE = "Its ground's squares are no tree of its paper.";
const LACKS = 'Its ground lacks a height:';
const fault = (text, cornersCm, cols = 4, rows = 4) =>
  squares.fault({ baseM: 0, squares: text, cornersCm }, cols, rows);
const FLAT = ['100 100', '', '', '', '100 100'];
assert.equal(fault('o', FLAT), null);
assert.equal(fault('+oooo', made(4, 4, MIDDLE(110)).cornersCm), null);
assert.equal(fault(FIVE_BY_THREE, made(5, 3, () => 0).cornersCm, 5, 3), null);
// No tree: a character but the three; a text that ends before its tree, or goes on after it; a
// square of ground not wholly on the paper; one beyond it that is not wholly so; one partly
// beyond that is not split; a cell split; a square wholly beyond that is split.
const NO_TREES = [
  ['x', 4, 4],
  ['O', 4, 4],
  ['+ooo', 4, 4],
  ['oo', 4, 4],
  ['', 4, 4],
  ['o', 5, 3],
  ['.', 4, 4],
  [FIVE_BY_THREE.replace('+o.o.', 'o'), 5, 3],
  ['+oooo', 1, 1],
  [`${FIVE_BY_THREE.slice(0, 20)}+....${FIVE_BY_THREE.slice(21)}`, 5, 3],
];
for (const [text, cols, rows] of NO_TREES) {
  assert.equal(fault(text, ['x', '1 2 3'], cols, rows), NO_TREE, text);
}
// Another count of texts: a row of grid points of the paper a text, with a row of another count
// and one of no number among them.
const rows = (had) => `${LACKS} 5 rows of corners are needed, and it has ${had}.`;
assert.equal(fault('o', ['100 100', 'x', '', '1 x 3']), rows('4 rows'));
assert.equal(fault('o', ['1 2 3']), rows('1 row'));
assert.equal(fault('o', []), rows('0 rows'));
assert.equal(fault('o', [...FLAT, '']), rows('6 rows'));
// A row of another count, the first, counted from 1 - with a row of no number before it.
const row = (at, corners, heights) =>
  `${LACKS} row ${at} has ${corners} of squares, and ${heights}.`;
assert.equal(fault('o', ['100 x', '', '7', '', '1 2 3']), row(3, '0 corners', '1 height'));
assert.equal(fault('o', ['100', '', '', '', '100 100']), row(1, '2 corners', '1 height'));
assert.equal(fault('+oooo', ['1 2 3', '', '1 2', '', '1 2 3']), row(3, '3 corners', '2 heights'));
// A row that holds what is no number: the first.
const NO_NUMBERS = ['100 x', '1 ', '1 Infinity', '1 \t', ' 1'];
for (const line of NO_NUMBERS) {
  assert.equal(fault('o', ['1 2', '', '', '', line]), `${LACKS} row 5 holds what is no number.`);
}
assert.equal(fault('o', ['1 x', '', '', '', 'y 2']), `${LACKS} row 1 holds what is no number.`);
assert.equal(fault('o', ['99.5 -250', '', '', '', '1e2 0']), null);

// The made-up plot's ground, a plane, 1400 - 10 c - 2 r cm on 92 by 62 cells: 109 squares of
// ground and 172 corners, and every grid point within a hundred-millionth of a centimetre.
const PLANE = SITE.ground.rowsCm.flatMap((line) => line.split(' ').map(Number));
const plane = squares.make(PLANE, 92, 62);
const read = squares.read({ baseM: 806, ...plane }, 92, 62);
assert.equal(squares.fault({ baseM: 806, ...plane }, 92, 62), null);
assert.equal(plane.cornersCm.join(' ').split(' ').filter(Boolean).length, 172);
assert.deepEqual([read.count, read.lowest, read.highest], [109, 356, 1400]);
for (let at = 0; at < PLANE.length; at += 1) {
  const [c, r] = [at % 93, Math.floor(at / 93)];
  assert.ok(Math.abs(read.cmAt(c, r) - (1400 - 10 * c - 2 * r)) < 1e-8, `${c}, ${r}`);
}

// `walk`: every square, depth first; a split square's quarters only where the visit says so.
const seen = [];
squares.walk(
  tree(5, 3, () => 0),
  (...square) => (seen.push(square.join(' ')), true),
);
assert.equal(seen.length, FIVE_BY_THREE.length);
assert.deepEqual(
  seen.slice(0, 5),
  ['0 0 8 false', '0 0 4 false', '0 0 2 true', '2 0 2 true'].concat('0 2 2 false'),
);
assert.deepEqual(seen.slice(14, 16), ['4 0 4 false', '4 0 2 false']);
const tops = [];
squares.walk(
  tree(5, 3, () => 0),
  (column, row, size) => (tops.push(size), size > 4),
);
assert.deepEqual(tops, [8, 4, 4, 4, 4]);

// RULE 3 AT THE LARGEST SIZE: a made-up rough hillside of 1000 m by 1000 m, 2000 cells each way,
// by this check's own rule - falling 0.45 m a metre down the plot; value noise of 6 octaves from
// 64 m down to 2 m, 4 m high at the first and half as high at each next; a bank of 1.5 m over a
// metre every 30 m down the slope, winding 8 m across; a ravine 8 m deep and 24 m wide every
// 260 m across; micro-relief of 3 cm either way; heights to the whole centimetre.
const SIDE = 2000;
const WIDE = SIDE + 1;
/** A number from 0 to under 1 of three whole numbers, the same on every machine. */
function hash(i, j, octave) {
  let h = Math.imul(i, 0x27d4eb2d) ^ Math.imul(j, 0x165667b1) ^ Math.imul(octave + 1, 0x3c6ef372);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32;
}
const smooth = (f) => f * f * (3 - 2 * f);
/** Value noise of one octave at a place: a height every `stepM` metres, from 0 to `highCm`. */
function noise(xM, yM, stepM, highCm, octave) {
  const [gx, gy] = [xM / stepM, yM / stepM];
  const [i, j] = [Math.floor(gx), Math.floor(gy)];
  const [u, v] = [smooth(gx - i), smooth(gy - j)];
  const [a, b] = [hash(i, j, octave), hash(i + 1, j, octave)];
  const [c, d] = [hash(i, j + 1, octave), hash(i + 1, j + 1, octave)];
  const top = a + (b - a) * u;
  return (top + (c + (d - c) * u - top) * v) * highCm;
}
function hillCm(column, row) {
  const [xM, yM] = [column / 2, row / 2];
  let cm = 60_000 - 45 * xM;
  for (let octave = 0; octave < 6; octave += 1) {
    cm += noise(xM, yM, 64 / 2 ** octave, 400 / 2 ** octave, octave);
  }
  const along = xM - 8 * Math.sin((2 * Math.PI * yM) / 120);
  const banks = Math.floor(along / 30);
  cm -= 150 * (banks + Math.min(1, along - 30 * banks));
  const off = Math.abs(yM - 260 * Math.round(yM / 260));
  if (off < 12) cm -= 800 * (1 - (off / 12) ** 2);
  return Math.round(cm + (hash(column, row, 99) - 0.5) * 6);
}
const hill = new Float64Array(WIDE * WIDE);
for (let at = 0; at < hill.length; at += 1) hill[at] = hillCm(at % WIDE, Math.floor(at / WIDE));
const rough = { baseM: 0, ...squares.make(hill, SIDE, SIDE) };
assert.equal(squares.fault(rough, SIDE, SIDE), null);
const kept = squares.read(rough, SIDE, SIDE);
let worst = 0;
for (let at = 0; at < hill.length; at += 1) {
  const cm = kept.cmAt(at % WIDE, Math.floor(at / WIDE));
  worst = Math.max(worst, Math.abs(cm - hill[at]));
}
assert.ok(worst <= squares.TOLERANCE_CM, `the rough hillside is kept within ${worst} cm`);
// The tree saves: fewer squares than a quarter of the cells, and the file is smaller.
assert.ok(kept.count < (SIDE * SIDE) / 4, `${kept.count} squares`);

process.stdout.write(
  `tools/sketch: a plot's ground as squares is made within 5 cm, read face for face and refused in its sentences - on the made-up plot, and on a kilometre of rough hillside in ${kept.count} squares\n`,
);
