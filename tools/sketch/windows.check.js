// The check of the ground in windows (story ST-042, windows.js) and of the pages' ground of a
// plot of any size (paper.js), on made-up papers, by hand. First the windows: around two rects
// 100 m apart, 60 m apart, at an edge, touching, and off the paper; what shapes the ground; the
// boxes moved onto a window's paper. Then the paper on a made-up plot of 200 m by 200 m, which is
// not WHOLE: a block of ground is worked out in one window of 90 m, and the ground outside it is
// the site's own, to the last figure; a second block 100 m away makes a second window. On the
// made-up plot, WHOLE, nothing changes. And the made-up plot as a plot of version 3, its ground as
// squares: the same ground, the same shaped ground, its grid and no fault. And the pages: each
// loads squares.js, and the two that settle the ground windows.js, before paper.js. No browser,
// nothing of a real plot. Run by check.js, as every check is, or alone:
//   pnpm exec node tools/sketch/windows.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import './demo-site.js';

const MADE_UP = globalThis.SITE;
globalThis.location = { hash: '' };
for (const file of ['squares', 'windows', 'categories', 'blocks', 'earth']) {
  await import(`./${file}.js`);
}
const { windows, earth, squares } = globalThis;
assert.deepEqual([windows.REACH_M, windows.WHOLE_M], [40, 120]);
let loads = 0;
/** The pad's paper, loaded anew on a site. */
async function paperOn(site) {
  globalThis.SITE = site;
  loads += 1;
  await import(`./paper.js?${loads}`);
  return globalThis.paper;
}

// AROUND: rects in cells, widened by 40 m - 80 cells - every way. Two blocks of 10 m 100 m apart
// are two windows, 20 m apart; 60 m apart, one; touching, one; at an edge, cut to the paper; off
// it, none - and in the order of their top left corners.
const A = [100, 190, 120, 210];
const REACH = 80;
const PAPER = [0, 0, 400, 400];
assert.deepEqual(windows.around([A, [320, 190, 340, 210]], REACH, PAPER), [
  [20, 110, 200, 290],
  [240, 110, 400, 290],
]);
assert.deepEqual(windows.around([A, [240, 190, 260, 210]], REACH), [[20, 110, 340, 290]]);
assert.deepEqual(windows.around([A, [280, 190, 300, 210]], REACH), [[20, 110, 380, 290]]);
assert.deepEqual(windows.around([[10, 380, 30, 395]], REACH, PAPER), [[0, 300, 110, 400]]);
assert.deepEqual(windows.around([[500, 10, 510, 20]], REACH, PAPER), []);
const ORDER = [
  [300, 300, 310, 310],
  [300, 10, 310, 20],
  [10, 300, 20, 310],
];
assert.deepEqual(windows.around(ORDER, 10), [
  [290, 0, 320, 30],
  [0, 290, 30, 320],
  [290, 290, 320, 320],
]);
// Three that meet only once two of them are one.
assert.deepEqual(
  windows.around(
    [
      [0, 0, 1, 1],
      [5, 0, 6, 1],
      [2, 0, 4, 1],
    ],
    1,
  ),
  [[-1, -1, 7, 2]],
);
assert.deepEqual(windows.around([], REACH, PAPER), []);

// SHAPERS: the boxes of ground and of cuts - a group asked once, as a block - and no box of the
// house and no object.
const LAWN = { x: [10, 20], y: [5, 9], z: [4, 6], is: 'ground' };
const DIG = { x: [30, 34], y: [5, 9], z: [4, 6], category: 'ground-cut' };
const ROOM = { x: [0, 8], y: [0, 8], z: [0, 6], name: 'Day rooms' };
const BANK = [
  { x: [40, 44], y: [0, 4], z: [2, 6], group: 7, name: 'Bank', is: 'ground' },
  { x: [44, 48], y: [0, 2], z: [2, 6], group: 7, name: 'Bank' },
];
const CAR = { kind: 'car', x: 12, y: 7, floor: 'ground' };
const THINGS = [ROOM, LAWN, CAR, DIG, ...BANK];
assert.deepEqual(windows.shapers(THINGS), [
  [10, 5, 20, 9],
  [30, 5, 34, 9],
  [40, 0, 44, 4],
  [44, 0, 48, 2],
]);
// SHIFTED: every box onto a window's paper, a slope with it; its rows as they were; no object.
const SLOPED = { ...LAWN, slope: { y: [5, 9], z: [4, 5] } };
assert.deepEqual(windows.shifted([CAR, ROOM, SLOPED], [4, 2, 50, 50]), [
  { ...ROOM, x: [-4, 4], y: [-2, 6] },
  { ...SLOPED, x: [6, 16], y: [3, 7], slope: { y: [3, 7], z: [4, 5] } },
]);
assert.deepEqual(
  windows.shifted([{ ...DIG, slope: { x: [30, 34], z: [4, 5] } }], [4, 2])[0].slope,
  {
    x: [26, 30],
    z: [4, 5],
  },
);

// THE PAPER ON A PLOT OF 200 M BY 200 M, a plane over 780 m - 4000 - 2 c - r cm - its outline a
// cell inside the paper all round: not WHOLE. Settled with a block of ground of 10 m whose top is
// 816 m, it is worked out in one window of 90 m, 180 cells each way, and nothing is shaped whole.
const planeCm = (c, r) => 4000 - 2 * c - r;
const WIDE = {
  name: 'Made-up wide plot',
  cellM: 0.5,
  bearingDeg: 0,
  xFromM: 0,
  xToM: 200,
  yFromM: 0,
  yToM: 200,
  sideM: [780, 830],
  outline: [
    [0.5, 0.5],
    [0.5, 199.5],
    [199.5, 199.5],
    [199.5, 0.5],
  ],
  notes: [],
  ground: {
    baseM: 780,
    rowsCm: Array.from({ length: 401 }, (_, r) =>
      Array.from({ length: 401 }, (__, c) => planeCm(c, r)).join(' '),
    ),
  },
  credit: 'A made-up plot, for tests: no real property, no measured ground.',
};
const wide = await paperOn(WIDE);
const BLOCK = { x: [100, 120], y: [190, 210], z: [28, 36], is: 'ground' };
assert.equal(wide.WHOLE, false);
assert.equal(wide.settle([BLOCK]), true);
assert.equal(wide.shaped(), null);
const [one] = wide.settledIn();
assert.deepEqual([wide.settledIn().length, one.rect], [1, [20, 110, 200, 290]]);
assert.deepEqual([one.heights.length, one.heights[0].length], [181, 181]);
// The window's site: its paper the window, in metres, its ground the plot's own texts there.
const window = wide.land(one.rect);
assert.deepEqual([window.xFromM, window.xToM, window.yFromM, window.yToM], [10, 100, 55, 145]);
assert.equal(window.ground.rowsCm[0].split(' ')[0], String(planeCm(20, 110)));
assert.deepEqual(
  [window.outline, window.sideM, window.ground.baseM],
  [WIDE.outline, [780, 830], 780],
);
assert.equal(wide.land(one.rect), window, 'a rectangle is made once');
// Inside the window, earth's ground of that window, number for number; outside it, the site's.
const own = earth.shaped(window, windows.shifted([BLOCK], one.rect)).heights;
assert.deepEqual(one.heights, own);
assert.equal(wide.groundAt(110, 200), 816);
assert.equal(wide.groundAt(60, 150), own[40][40]);
assert.ok(wide.groundAt(130, 200) > wide.realAt(130, 200) + 0.1, 'the ground runs out from it');
const at = (c, r) => 780 + planeCm(c, r) / 100;
for (const [c, r] of [
  [20, 200],
  [200, 290],
  [19, 200],
  [201, 200],
  [300, 300],
  [0, 0],
  [400, 400],
]) {
  assert.ok(Object.is(wide.groundAt(c, r), wide.realAt(c, r)), `${c}, ${r}`);
  assert.equal(wide.realAt(c, r), at(c, r));
}
// A second block 100 m away is a second window; and the same things again work nothing out.
const SECOND = { ...BLOCK, x: [320, 340] };
assert.equal(wide.settle([BLOCK, SECOND]), true);
assert.deepEqual(
  wide.settledIn().map(({ rect }) => rect),
  [
    [20, 110, 200, 290],
    [240, 110, 400, 290],
  ],
);
assert.equal(wide.settle([SECOND, BLOCK]), false);
assert.deepEqual([wide.groundAt(330, 200), wide.grid(), wide.siteFaults()], [816, null, []]);
assert.equal(wide.settle([]), true);
assert.deepEqual(wide.settledIn(), []);

// THE MADE-UP PLOT, WHOLE: no window, and the grid that earth.js works out of the site itself.
const TERRACE = { x: [40, 50], y: [20, 30], z: [16, 20], colour: 9, is: 'ground' };
const madeUp = await paperOn(MADE_UP);
assert.deepEqual([madeUp.WHOLE, madeUp.land([0, 0, 92, 62]), madeUp.grid()], [true, MADE_UP, null]);
assert.equal(madeUp.settle([TERRACE]), true);
assert.deepEqual(madeUp.settledIn(), []);
assert.deepEqual(madeUp.shaped(), earth.shaped(MADE_UP, [TERRACE]).heights);
const rowsOf = madeUp.shaped();

// THE MADE-UP PLOT AS A PLOT OF VERSION 3: its ground as squares. The site's own ground is the
// made-up plot's at every grid point, to a millionth of a metre; the terrace settles to the same
// grid, to a tenth of a millimetre; `grid()` is that ground; and no fault.
const PLANE = MADE_UP.ground.rowsCm.flatMap((line) => line.split(' ').map(Number));
const ground = { baseM: 806, ...squares.make(PLANE, 92, 62) };
const tree = await paperOn({ ...MADE_UP, ground });
const hill = (c, r) => 820 - 0.1 * c - 0.02 * r;
const grid = tree.grid();
assert.deepEqual([grid.length, grid[0].length, tree.grid()], [63, 93, grid]);
for (let r = 0; r <= 62; r += 1) {
  for (let c = 0; c <= 92; c += 1) {
    assert.ok(Math.abs(tree.realAt(c, r) - hill(c, r)) < 1e-6, `${c}, ${r}`);
    assert.ok(Math.abs(grid[r][c] - hill(c, r)) < 1e-6, `${c}, ${r}`);
  }
}
assert.equal(tree.settle([TERRACE]), true);
tree.shaped().forEach((line, r) => {
  line.forEach((height, c) => assert.ok(Math.abs(height - rowsOf[r][c]) < 1e-4, `${c}, ${r}`));
});
assert.deepEqual(tree.siteFaults(), []);
assert.deepEqual((await paperOn({ ...MADE_UP, ground, sideM: [815, 826] })).siteFaults(), [
  'the ground lacks a height',
]);

// THE PAGES, by their text: squares.js before paper.js on all three, and windows.js between the
// two on the two pages that settle the ground.
const scripts = (page) => {
  const text = readFileSync(path.join(import.meta.dirname, page), 'utf8');
  return [...text.matchAll(/<script src="([^"]+)"><\/script>/g)].map(([, name]) => name);
};
for (const [page, before] of [
  ['index.html', ['squares.js', 'windows.js', 'paper.js']],
  ['3d.html', ['squares.js', 'windows.js', 'paper.js']],
  ['info.html', ['squares.js', 'paper.js']],
]) {
  const names = scripts(page);
  const first = names.indexOf(before[0]);
  assert.deepEqual(names.slice(first, first + before.length), before, page);
}

process.stdout.write(
  'tools/sketch: the ground of a paper over 120 m is worked out in windows of 40 m around what shapes it, the site its own outside them - and a plot of version 3 is the same ground as its plot of version 2\n',
);
