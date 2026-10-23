// The check of the grid that follows the zoom (story ST-042, T-042.2), against figures worked out
// by hand: of every rung of the zoom's ladder the step the grid shows and how far apart its lines
// stand, and none at the last; the rung at or under a number, and the next one at both ends; and
// on the made-up plot the line of the grid shown at or before a place and the nearest, from
// above, in the front view - whose columns run the other way - and in the side view, up it. The
// pad's own paper.js and grid.js on the made-up plot, once a view: no browser, nothing of the
// real site. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/grid.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

/** paper.js and grid.js as a view of the made-up plot loads them: its grid. */
async function gridOf(view) {
  globalThis.location = { hash: `#${view}` };
  await import(`./paper.js?${view}`);
  await import(`./grid.js?${view}`);
  assert.equal(globalThis.paper.VIEW, view);
  return globalThis.grid;
}
await import('./demo-site.js');
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const grid = await gridOf('top');

// THE RUNGS AND THE GRID (T-042.0, Do 3), by hand: at `px` screen pixels a cell of half a metre,
// the finest step whose lines stand 8 pixels apart or more - `px × step / 0.5` - and how far.
const TABLE = [
  [32, 0.5, 32],
  [24, 0.5, 24],
  [20, 0.5, 20],
  [16, 0.5, 16],
  [12, 0.5, 12],
  [10, 0.5, 10],
  [8, 0.5, 8],
  [6, 1, 12],
  [4, 1, 8],
  [3, 2, 12],
  [2, 2, 8],
  [1.5, 5, 15],
  [1, 5, 10],
  [0.8, 5, 8],
  [0.6, 10, 12],
  [0.4, 10, 8],
  [0.3, 20, 12],
  [0.2, 20, 8],
  [0.15, 50, 15],
  [0.1, 50, 10],
  [0.08, 50, 8],
  [0.06, 100, 12],
  [0.04, 100, 8],
  [0.03, 200, 12],
  [0.02, 200, 8],
  [0.015, 500, 15],
  [0.01, 500, 10],
  [0.008, 500, 8],
];
assert.deepEqual(grid.STEPS_M, [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]);
assert.deepEqual([grid.APART_PX, grid.STRONG], [8, 5]);
assert.deepEqual(
  [...TABLE.map(([px]) => px), 0.006],
  [...grid.LADDER].reverse(),
  'the table has every rung',
);
for (const [px, step, apart] of TABLE) {
  assert.equal(grid.stepAt(px), step, `at ${px} px a cell`);
  assert.equal(Number(((px * step) / 0.5).toFixed(9)), apart, `${step} m at ${px} px`);
}
// At the last rung even 500 m would stand 6 pixels apart: no grid.
assert.equal(grid.stepAt(0.006), null);
// The browser tests' window opens the made-up plot at 8, exactly at the threshold: 0.5 m.
assert.equal(grid.stepAt(8), 0.5);
assert.equal(grid.stepAt(7.99), 1);

// THE LADDER: the rung at or under a number - the first under the first - and the next, held.
assert.deepEqual([13, 40, 0.007, 0.001, 10, 1.7].map(grid.rung), [12, 32, 0.006, 0.006, 10, 1.5]);
assert.deepEqual(
  [grid.next(32, 1), grid.next(0.006, -1), grid.next(10, -1), grid.next(10, 1), grid.next(13, -1)],
  [32, 0.006, 8, 12, 10],
);
assert.equal(grid.next(0.008, -1), 0.006);
assert.equal(grid.next(24, 1), 32);

// ON THE MADE-UP PLOT (demo-site.js: xFromM -4, yToM 28, sideM [806, 826]). Until the paper is
// drawn the grid shown is the finest: every whole cell is a line of it.
assert.equal(grid.shown, 0.5);
const along = (g, places, axis, how = 'floor') => places.map((place) => g[how](place, axis));
assert.deepEqual(along(grid, [150.3, 12.9, -0.2, 0], 0), [150, 12, -1, 0]);
assert.deepEqual(along(grid, [150.3, 12.9, 12.4, -0.2], 1, 'round'), [150, 13, 12, 0]);
// From above at 5 m: x = -4 + c/2 is a multiple of 5 at columns 8, 18, 28 ..., y = 28 - r/2 at
// rows 6, 16, 26 ...
grid.shown = 5;
assert.deepEqual(along(grid, [150.3, 8, 17.9, 18, 3], 0), [148, 8, 8, 18, -2]);
assert.deepEqual(along(grid, [39.7, 6, 15.99, 16, 0], 1), [36, 6, 6, 16, -4]);
assert.deepEqual(along(grid, [12.9, 13.1, 150.3], 0, 'round'), [8, 18, 148]);
assert.deepEqual(along(grid, [20.4, 39.7], 1, 'round'), [16, 36]);
// Each line found lies on a whole number of steps of the plot's frame.
const { metres } = globalThis.paper;
assert.deepEqual(
  [metres([148, 36]), metres([8, 6])],
  [
    [70, 10],
    [0, 25],
  ],
);

// THE FRONT VIEW, flipped, whose columns run from y = 28 the other way - y = 28 - c/2 - at 5 m:
// columns 6, 16 ...; its rows are heights, 826 - r/2, a multiple of 5 at rows 2, 12 ...
const front = await gridOf('front');
front.shown = 5;
assert.deepEqual(along(front, [150.3, 6, 15.9, 16], 0), [146, 6, 6, 16]);
assert.deepEqual(along(front, [12.9], 0, 'round'), [16]);
assert.deepEqual(along(front, [39.7, 2, 11.9], 1), [32, 2, 2]);
assert.deepEqual(globalThis.paper.metres([146, 32]), [-45, 810]);
// THE SIDE VIEW: along as from above, columns 8, 18 ...; up it rows 2, 12 ...
const side = await gridOf('side');
side.shown = 5;
assert.deepEqual(along(side, [150.3, 12.9], 0), [148, 8]);
assert.deepEqual(along(side, [39.7, 1.9, 2], 1), [32, -8, 2]);
assert.deepEqual(along(side, [6.9, 7.1], 1, 'round'), [2, 12]);
// At 0.5 m every whole cell, in every view; never -0.
for (const g of [front, side]) {
  g.shown = 0.5;
  assert.deepEqual(along(g, [150.3, 12.9, 39.7], 0), [150, 12, 39]);
  assert.deepEqual(along(g, [150.3, 12.6, -0.2], 1, 'round'), [150, 13, 0]);
  assert.ok(!Object.is(g.round(-0.2, 0), -0), 'never -0');
}
// At 2 m in the side view: x = -4 + c/2 a multiple of 2 at columns 0, 4, 8 ...
side.shown = 2;
assert.deepEqual(along(side, [150.3, 3.9], 0), [148, 0]);

process.stdout.write(
  'tools/sketch: the grid shows the finest step whose lines stand 8 pixels apart, at every rung of the zoom and none at the last, and its lines lie on whole multiples of the step in every view\n',
);
