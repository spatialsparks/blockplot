// The check of the one ground that every view asks (paper.js, story ST-027), and of what the
// rule that shapes it costs (earth.js): what earth.check.js had no room for. The pad's own
// scripts on the made-up plot, by hand. Until the paper is told to settle, with no earth.js
// loaded and with no block of ground, its ground is the site's own, to the last figure, on the
// grid, between its lines and off the paper. Settled, it is the shaped one, with the site's own
// beside it - and along the outline of the plot the two are one, under a block of ground that
// reaches over every edge. The paper works the ground out anew when a box of ground or of the
// house changed, and not otherwise: what says so is a text (`earth.shapedBy`). Then what the
// rule costs, in sweeps, on the made-up plot and on a plot of ten thousand grid points - on
// which a box that reaches off the paper is read as far as the paper goes; and the two pages,
// by their text: each loads earth.js after blocks.js. No browser, and nothing of the real
// site: site.js is never read. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/earth-paper.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

globalThis.location = { hash: '' };
for (const file of ['demo-site', 'paper']) await import(`./${file}.js`);
const { paper } = globalThis;

// The made-up plot, by hand: its ground lies at 820 - 0.1 c - 0.02 r m at column c and row r of
// the top view's paper, which has 92 columns and 62 rows; a height h lies in row 2 (826 - h) of
// a standing paper. Off the paper the ground is as high as at the paper's edge.
const hill = (c, r) => 820 - 0.1 * c - 0.02 * r;
const near = (a, b, most = 1e-9) => assert.ok(Math.abs(a - b) < most, `${a} is not ${b}`);
/** Places, each said as 'column,row'. */
const places = (text) => text.split(' ').map((place) => place.split(',').map(Number));
// Places on the grid, between its lines, and off the paper on every side of it.
const ON = places('0,0 45,25 16,27 92,62 79,23');
const BETWEEN = places('45.25,25.75 44.5,20 50,29.5 78.9,23.1');
const OFF = places('-3,20 100,70 45,-1 50.5,63');
near(paper.realAt(45, 25), 815);
near(paper.realAt(45.25, 25.75), hill(45.25, 25.75));
near(paper.realAt(-3, 20), hill(0, 20));
near(paper.realAt(100, 70), 809.56);
near(paper.realRow(45, 25), 22);
/** Whether the one ground is the site's own at some places, to the last figure - as a height and as a row. */
const real = (...list) =>
  list.every(
    ([c, r]) =>
      Object.is(paper.groundAt(c, r), paper.realAt(c, r)) &&
      Object.is(paper.groundRow(c, r), paper.realRow(c, r)),
  );

const TREE = { kind: 'tree', x: 70, y: 26, floor: 'ground' };
// A terrace of 5 m by 5 m, its top in row 16 of a standing view: 826 - 8 = 818 m. And a shed
// beside it, a block of the house.
const TERRACE = { x: [40, 50], y: [20, 30], z: [16, 20], colour: 9, is: 'ground' };
const SHED = { x: [52, 60], y: [20, 30], z: [14, 20], colour: 2, name: 'Shed' };
const FIRST = [TERRACE, SHED, TREE];

// BEFORE ANY SETTLE the ground is the site's own. And where no earth.js was loaded, nothing is
// shaped: told a terrace, the paper says no, and its ground is the site's still.
const unshaped = () => paper.shaped() === null && real(...ON, ...BETWEEN, ...OFF);
assert.ok(unshaped());
assert.equal(paper.settle(FIRST), false);
assert.ok(unshaped());
for (const file of ['categories', 'blocks', 'earth']) await import(`./${file}.js`);
const { earth } = globalThis;
// Every time the rule is asked is counted: so it is said what the paper worked out, and when.
const rule = earth.shaped;
let asked = 0;
earth.shaped = (...told) => {
  asked += 1;
  return rule(...told);
};
// WITH NO BLOCK OF GROUND nothing is worked out, and a box of the house that moved changes
// nothing: the paper says no each time.
for (const none of [[], [SHED, TREE], [{ ...SHED, x: [53, 61] }, TREE]]) {
  assert.equal(paper.settle(none), false);
  assert.ok(unshaped());
}
assert.equal(asked, 0);

// SETTLED with the terrace and the shed, the ground is 818 m over the terrace - in row 16, the
// row of its top - on the grid and between its lines; the site's own says the hill there:
// 820 - 4.5 - 0.5 = 815 m, row 22. It is the grid that the rule gives.
assert.equal(paper.settle(FIRST), true);
const grid = paper.shaped();
assert.deepEqual(grid, rule(globalThis.SITE, FIRST).heights);
assert.deepEqual([grid.length, grid[0].length, grid[25][45]], [63, 93, 818]);
for (const [c, r] of places('45,25 40,20 50,30 45.25,25.75 44.5,20 50,29.5')) {
  assert.deepEqual([paper.groundAt(c, r), paper.groundRow(c, r)], [818, 16]);
  near(paper.realAt(c, r), hill(c, r));
  near(paper.realRow(c, r), 2 * (826 - hill(c, r)));
}
// Beside the terrace the ground is on its way to the hill, over it, and under 818 m; outside
// the plot and off the paper it is the site's own; and the page's check of its site asks the
// site's own, as it did.
assert.ok(paper.groundAt(39, 25) > paper.realAt(39, 25) + 1 && paper.groundAt(39, 25) < 818);
assert.ok(real(...places('0,0 92,62 5,5 85,30'), ...OFF));
assert.deepEqual(paper.siteFaults(), []);

// TOLD THE SAME THINGS AGAIN, the paper says no and works out nothing: the same things; with
// an object more, an object moved and none; in another colour; under a name that changes
// nothing; the shed higher, which stands in the same cells; in another order; and as another
// sketch that holds the same - as Undo makes one.
assert.equal(asked, 1);
for (const same of [
  FIRST,
  [...FIRST, { kind: 'car', x: 16, y: 27.5, floor: 'ground', turn: 1 }],
  [TERRACE, SHED, { ...TREE, x: 30 }],
  [TERRACE, SHED],
  [{ ...TERRACE, colour: 3 }, { ...SHED, colour: 7 }, TREE],
  [{ ...TERRACE, name: 'Lawn' }, { ...SHED, name: 'Workshop' }, TREE],
  [TERRACE, { ...SHED, z: [10, 22] }, TREE],
  [TREE, SHED, TERRACE],
  JSON.parse(JSON.stringify(FIRST)),
]) {
  assert.equal(paper.settle(same), false);
  assert.equal(paper.shaped(), grid);
}
assert.equal(asked, 1);

// TOLD WHAT SHAPES THE GROUND ANEW, it says yes each time, and has worked the ground out: the
// shed moved a cell down the plot; the terrace's top edge moved up two rows, to 819 m; its top
// sloped; the terrace set to a room - no block of ground is left, and the ground is the site's
// own - and to ground again by a name.
const MOVED = { ...SHED, x: [53, 61] };
assert.equal(paper.settle([TERRACE, MOVED, TREE]), true);
assert.deepEqual([asked, paper.groundAt(45, 25)], [2, 818]);
assert.notEqual(paper.shaped(), grid);
assert.equal(paper.settle([{ ...TERRACE, z: [14, 20] }, MOVED, TREE]), true);
assert.deepEqual([asked, paper.groundAt(45, 25), paper.groundRow(45, 25)], [3, 819, 14]);
const SLOPED = { ...TERRACE, slope: { x: [40, 50], z: [16, 20] } };
assert.equal(paper.settle([SLOPED, MOVED, TREE]), true);
assert.deepEqual([asked, paper.groundAt(45, 25), paper.groundAt(50, 25)], [4, 817, 816]);
near(paper.groundAt(47.5, 25.5), 816.5);
assert.equal(paper.settle([{ ...TERRACE, is: 'room' }, MOVED, TREE]), true);
assert.equal(asked, 5);
assert.ok(unshaped());
assert.equal(paper.settle([{ ...TERRACE, is: undefined, name: 'Ground fill' }, MOVED, TREE]), true);
assert.deepEqual([asked, paper.groundAt(45, 25)], [6, 818]);
// Told the first things again, the grid has the numbers it had.
assert.equal(paper.settle(FIRST), true);
assert.deepEqual(paper.shaped(), grid);
assert.notEqual(paper.shaped(), grid);
// And a block of ground that shapes nothing - off the plot - is worked out, and the ground is
// the site's own; with no block of ground after it, a box of the house moved works out nothing.
assert.equal(paper.settle([{ ...TERRACE, x: [82, 90] }, SHED]), true);
assert.ok(unshaped());
assert.equal(paper.settle([SHED]), true);
assert.equal(asked, 9);
assert.equal(paper.settle([MOVED]), false);
assert.equal(asked, 9);

// WHAT SHAPES THE GROUND, as a text, by hand: where each box of ground lies and the rows of its
// top at its two ends, and after them where the boxes of the house lie. Empty where no block is
// ground, whatever the house.
assert.equal(earth.shapedBy(FIRST), '40,50,20,30,x,16,16|52,60,20,30');
assert.equal(
  earth.shapedBy([SLOPED, MOVED, TERRACE]),
  '40,50,20,30,x,16,16;40,50,20,30,x,16,20|53,61,20,30',
);
assert.equal(
  earth.shapedBy([{ ...TERRACE, slope: { y: [20, 40], z: [16, 20] } }]),
  '40,50,20,30,y,16,18|',
);
assert.deepEqual([[], [SHED, TREE], [MOVED]].map(earth.shapedBy), ['', '', '']);

// THE OUTLINE, in cells: (12, 44), (12, 10), (80, 10), (80, 38), (66, 50), (32, 50). Along it -
// at its six corners, at the middle of each side, a third and two thirds of the way along each,
// and at forty places more on each - the one ground is the site's own, to the last figure,
// under a block of ground that reaches over an edge of the plot: over its downhill side; over
// its side along row 50 and the two sides askew; and over every edge, and off the paper. Each
// is 822 m, its top in row 8, over the whole hill.
const OUTLINE = places('12,44 12,10 80,10 80,38 66,50 32,50');
const along = OUTLINE.flatMap(([c, r], index) => {
  const [toC, toR] = OUTLINE[(index + 1) % OUTLINE.length];
  const shares = [0, 1 / 2, 1 / 3, 2 / 3, ...Array.from({ length: 40 }, (_, step) => step / 40)];
  return shares.map((share) => [c + (toC - c) * share, r + (toR - r) * share]);
});
// A third of the way along the two sides that run askew lies on a line of the grid, between
// two of its points: at column 75 and a third of row 42, and at column 25 and a third of row 48.
const [third, other] = [along[3 * 44 + 2], along[5 * 44 + 2]];
assert.deepEqual([third[1], other[1]], [42, 48]);
near(third[0], 75 + 1 / 3);
near(other[0], 25 + 1 / 3);
const OVER_EDGE = { '70,86,20,26': [72, 24], '20,70,40,62': [40, 45], '-4,96,-4,66': [79, 24] };
for (const [lies, [c, r]] of Object.entries(OVER_EDGE)) {
  const [x0, x1, y0, y1] = lies.split(',').map(Number);
  assert.equal(paper.settle([{ ...TERRACE, x: [x0, x1], y: [y0, y1], z: [8, 12] }]), true);
  // Inside the plot the ground is the block's top, far over the hill; on the outline, the hill.
  assert.equal(paper.groundAt(c, r), 822);
  assert.ok(paper.realAt(c, r) < 816 && real(...along), `the outline is changed under ${lies}`);
}
// The step is one cell wide: a cell inside the downhill side 822 m, and on it the site's own.
assert.deepEqual([paper.groundAt(79, 24), paper.groundAt(80, 24)], [822, paper.realAt(80, 24)]);

// WHAT IT COSTS, in sweeps, which are the same on every machine. The terrace alone and the
// made-up house with a block of ground before its porch settle in under 400. And a plot of the
// size of a real one - a plane of 124 cells by 80, 125 grid points by 81, its outline a cell
// inside the paper all round, and a block of ground of four cells by four in its middle, 2 m
// over the plane - in under 500. None reaches SWEEPS_MOST.
const HOUSE = [
  { x: [30, 50], y: [22, 38], z: [18, 24], name: 'Day rooms' },
  { x: [50, 58], y: [24, 36], z: [18, 24], name: 'Glass porch', is: 'glass' },
  { x: [22, 30], y: [24, 32], z: [20, 24], name: 'Store' },
  { x: [30, 50], y: [22, 30], z: [12, 18], group: 1, name: 'Night rooms' },
  { x: [30, 40], y: [30, 38], z: [12, 18], group: 1, name: 'Night rooms' },
  { x: [40, 44], y: [30, 38], z: [12, 18], name: 'Bath' },
  { x: [44, 50], y: [30, 38], z: [12, 18], name: 'Roof terrace' },
  { x: [50, 58], y: [36, 44], z: [22, 24], name: 'Garden' },
];
const LAWN = { x: [58, 72], y: [24, 36], z: [24, 28], colour: 9, is: 'ground' };
const madeUp = [[TERRACE], [...HOUSE, LAWN]].map((things) => rule(globalThis.SITE, things).sweeps);
assert.ok(
  madeUp.every((sweeps) => sweeps < 400),
  `${madeUp} sweeps`,
);
const flat = (c, r) => 780 + (4000 - 10 * c - 2 * r) / 100;
const PLANE = {
  cellM: 0.5,
  xFromM: 0,
  yToM: 40,
  sideM: [780, 830],
  outline: places('0.5,0.5 0.5,39.5 61.5,39.5 61.5,0.5'),
  ground: {
    baseM: 780,
    rowsCm: Array.from({ length: 81 }, (_, r) =>
      Array.from({ length: 125 }, (__, c) => 4000 - 10 * c - 2 * r).join(' '),
    ),
  },
};
const wide = rule(PLANE, [{ ...TERRACE, x: [60, 64], y: [38, 42], z: [30, 34] }]);
assert.deepEqual([wide.heights.length, wide.heights[0].length], [81, 125]);
assert.ok(wide.sweeps < 500 && wide.sweeps < earth.SWEEPS_MOST, `${wide.sweeps} sweeps`);
// The block is 830 - 15 = 815 m, on a plane of 813 m in its middle and 2.24 m over it at its
// downhill corner. From it the ground runs out to the outline, where it is the plane: the
// outline runs along lines of the grid here, column 1 and column 123, row 1 and row 79.
assert.deepEqual(
  [wide.heights[40][62], wide.heights[38][60], wide.heights[42][64]],
  [815, 815, 815],
);
near(flat(62, 40), 813);
near(815 - flat(64, 42), 2.24);
wide.heights.forEach((line, r) => {
  line.forEach((height, c) => {
    const lies = height - flat(c, r);
    if (c < 2 || c > 122 || r < 2 || r > 78)
      assert.equal(lies, 0, `the edge is changed at ${c}, ${r}`);
    else
      assert.ok(lies > 0 && lies < 2.25, `at ${c}, ${r} the ground lies ${lies} m over the plane`);
  });
});
// A box that reaches off the paper, as a file may hold one, is read as far as the paper goes,
// and nothing of it comes back in at the paper's other edge: a box of the house over the uphill
// edge, columns -6 to 4 of rows 20 to 24, and a block of ground over the downhill one, columns
// 118 to 130 of rows 10 to 12. The block is 815 m from column 118 to column 122, and on the
// outline, column 123, the ground is the plane. Inside the box of the house, at column 2 of row
// 22, there is no ground. At column 121 of row 21, near the block and far from that box, the
// ground lies half a metre over the plane; at column 3 of row 13, far from the block, a
// millimetre.
const off = rule(PLANE, [
  { ...SHED, x: [-6, 4], y: [20, 24] },
  { ...TERRACE, x: [118, 130], y: [10, 12], z: [30, 34] },
]).heights;
const above = (c, r) => off[r][c] - flat(c, r);
assert.deepEqual(off[11].slice(118, 124), [815, 815, 815, 815, 815, flat(123, 11)]);
assert.ok(above(2, 22) === 0 && above(121, 21) > 0.4 && above(3, 13) > 0 && above(3, 13) < 0.01);

// THE PAGES, by their text: each loads earth.js in the line after blocks.js.
for (const page of ['index.html', '3d.html']) {
  const text = readFileSync(path.join(import.meta.dirname, page), 'utf8');
  const lines = text.split('\n').map((line) => line.trim());
  const at = lines.indexOf('<script src="blocks.js"></script>');
  assert.ok(at > 0, `${page} does not load blocks.js`);
  assert.equal(lines[at + 1], '<script src="earth.js"></script>', page);
}

process.stdout.write(
  'tools/sketch: the paper holds the one ground - the site until it is settled, the shaped one after, the site along the outline - and works it out anew only when a box of ground or of the house changed\n',
);
