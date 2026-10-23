// The check of the rule that shapes the ground (earth.js, story ST-027), on the made-up plot and
// against figures worked out by hand: what shapes nothing; a terrace alone, level over its top
// and running out by the mean of the neighbours; the edge of the plot, where the site's ground
// holds; a strip between two walls of the house, where the ground runs out in a straight line;
// a place the house closes in; tops - the higher of two, sloping, cut and fill; the made-up
// house with a block of ground before its porch; and the same ground from the things in another
// order. A height that a sweep made is held to a tenth of a millimetre, every other to the last
// figure. What the rule costs and what the paper holds of it is earth-paper.check.js's. No
// browser, and nothing of the real site: site.js is never read. Run by tools/sketch/check.js,
// or alone:
//   pnpm exec node tools/sketch/earth.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

for (const file of ['demo-site', 'categories', 'blocks', 'earth']) await import(`./${file}.js`);
const { SITE, blocks, earth } = globalThis;

// THE MADE-UP PLOT, by hand (demo-site.js). Its paper has 92 cells down the plot and 62 across
// it: 93 grid points by 63. Its ground is a plane: at column c and row r it lies at
// 820 - 0.1 c - 0.02 r m. A row k of a standing view lies at 826 - 0.5 k m.
const hill = (c, r) => 820 - 0.1 * c - 0.02 * r;
// The site's very numbers, as the pad reads them off the site.
const HILL = SITE.ground.rowsCm.map((row) =>
  row.split(' ').map((cm) => SITE.ground.baseM + Number(cm) / 100),
);
const POINTS = HILL.flatMap((line, r) => line.map((height, c) => [c, r]));
assert.deepEqual([HILL.length, HILL[0].length, POINTS.length], [63, 93, 5859]);
const near = (a, b, most = 0.0001) => assert.ok(Math.abs(a - b) < most, `${a} is not ${b}`);
for (const [c, r] of POINTS) near(HILL[r][c], hill(c, r), 1e-9);
/** Grid points, each said as 'column,row'. */
const points = (text) => text.split(' ').map((point) => point.split(',').map(Number));
// Its outline, in cells: a rectangle from column 12 to 80 and from row 10 to 50 with two corners
// cut off. The side from (80, 38) to (66, 50) runs 6 rows down for every 7 columns back, so
// 6c + 7r = 746 along it; the side from (32, 50) to (12, 44) 3 rows up for every 10 columns
// back, so 10r - 3c = 404 along it. The plot has no corner that points inward: a cell lies
// within it with all of itself where its four corners lie within it, or on it.
const CORNERS = '12,44 12,10 80,10 80,38 66,50 32,50';
assert.equal(SITE.outline.map(([x, y]) => [2 * (x + 4), 2 * (28 - y)]).join(' '), CORNERS);
const within = (c, r) =>
  c >= 12 && c <= 80 && r >= 10 && r <= 50 && 6 * c + 7 * r <= 746 && 10 * r - 3 * c <= 404;
// A grid point of the plot's ground: the four cells round it are cells of the plot, so the nine
// grid points round it lie within the outline. Every other is held. The first side askew runs
// through the grid point at column 73 of row 44, and the second through the one at column 22 of
// row 47: the point across the corner from each, inside, is the plot's ground - the side
// touches a corner of its cell, and passes through nothing - and the two beside it are held.
const NINE = [-1, 0, 1].flatMap((dc) => [-1, 0, 1].map((dr) => [dc, dr]));
const ofPlot = ([c, r]) => NINE.every(([dc, dr]) => within(c + dc, r + dr));
assert.ok(points('13,11 79,37 72,43 23,46').every(ofPlot));
assert.ok(!points('12,11 79,38 73,43 72,44 22,46 23,47').some(ofPlot));
// They are 67 columns by 39 rows, 2613 - less the 96 and the 72 that the two sides cut off.
assert.equal(POINTS.filter(ofPlot).length, 2445);

const ground = (box) => ({ colour: 9, is: 'ground', ...box });
/** A box of the house: with no name and no `is`, a room. */
const wall = (x, y, z = [12, 24]) => ({ x, y, z, colour: 10 });
/** The heights of a ground at some grid points, and how far it lies over the hill at one. */
const at = (heights, ...list) => list.map(([c, r]) => heights[r][c]);
const over = (heights, [c, r]) => heights[r][c] - HILL[r][c];
/** The ground of some things - held, each time, at every grid point that is not the plot's ground. */
function shaped(things) {
  const made = earth.shaped(SITE, things);
  // RULE 3: at the outline and outside it the height is the site's very number.
  for (const [c, r] of POINTS.filter((point) => !ofPlot(point))) {
    assert.equal(made.heights[r][c], HILL[r][c], `the ground is changed at ${c}, ${r}`);
  }
  assert.ok(made.sweeps >= 1 && made.sweeps < earth.SWEEPS_MOST);
  return made;
}

// The eight boxes of the made-up house (tests/__fixtures__/sketch/made-up.json), typed in: where
// each lies, and what it is named or says it is. None is ground.
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
const AS = 'room glass room room room room open open';
assert.equal(HOUSE.map((box) => blocks.countsAs([box]).as).join(' '), AS);
const TREE = { kind: 'tree', x: 70, y: 26, floor: 'ground' };
// A terrace of 5 m by 5 m, its top in row 16 of a standing view: 826 - 8 = 818 m. And the same
// box with no word of its own on what it counts as.
const TERRACE = ground({ x: [40, 50], y: [20, 30], z: [16, 20] });
const UNSAID = { ...TERRACE, is: undefined };

// NOTHING SHAPED is null: no things; the house and a tree; a block named for a room, and one
// set to a room against its name; a block of ground beyond the plot's downhill side, column
// 80, one on that side, and one off the paper; and one that lies wholly inside a block of the
// house, the day rooms.
for (const none of [
  [],
  [...HOUSE, TREE],
  [{ ...UNSAID, name: 'Ground floor' }],
  [{ ...TERRACE, is: 'room', name: 'Ground fill' }],
  [ground({ x: [82, 90], y: [20, 26], z: [20, 24] })],
  [ground({ x: [80, 90], y: [20, 26], z: [20, 24] })],
  [ground({ x: [100, 110], y: [70, 80], z: [20, 24] })],
  [...HOUSE, ground({ x: [34, 46], y: [26, 34], z: [16, 20] })],
]) {
  assert.equal(earth.shaped(SITE, none), null);
}

// A TERRACE ALONE. Its 121 grid points lie at 818 m. Every other grid point of the plot's
// ground is free: it lies over the hill, by less than the 3.6 m that the terrace stands over it
// at its downhill corner - column 50 of row 30, where the hill lies at 820 - 5 - 0.6 = 814.4 m
// - and as far over the hill as the mean of its four neighbours, to a hundredth of a millimetre.
const alone = shaped([TERRACE]);
const onTerrace = ([c, r]) => c >= 40 && c <= 50 && r >= 20 && r <= 30;
const free = POINTS.filter((point) => ofPlot(point) && !onTerrace(point));
assert.deepEqual([POINTS.filter(onTerrace).length, free.length], [121, 2445 - 121]);
for (const point of POINTS.filter(onTerrace)) assert.deepEqual(at(alone.heights, point), [818]);
near(over(alone.heights, [50, 30]), 3.6, 1e-9);
const FOUR = NINE.filter(([dc, dr]) => Math.abs(dc) + Math.abs(dr) === 1);
for (const [c, r] of free) {
  const beside = FOUR.map(([dc, dr]) => over(alone.heights, [c + dc, r + dr]));
  const lies = over(alone.heights, [c, r]);
  assert.ok(lies > 0 && lies < 3.6, `at ${c}, ${r} the ground lies ${lies} m over the hill`);
  near(lies, (beside[0] + beside[1] + beside[2] + beside[3]) / 4, 0.00001);
}
// Only the top counts: how far down the block reaches says nothing. A block is ground by what
// `countsAs` says of it: by its name - and as a box that says nothing, in a block whose first
// box, off the plot, says ground. And a box that ends between two lines of the grid, as a file
// may hold one, reaches the grid points that lie within it: the same 121.
const first = ground({ x: [10, 11], y: [2, 3], z: [16, 20], group: 4 });
for (const same of [
  [{ ...TERRACE, z: [16, 40] }],
  [{ ...UNSAID, name: 'Ground Fill' }],
  [first, { ...UNSAID, group: 4 }],
  [{ ...TERRACE, x: [39.5, 50.5], y: [19.25, 30.75] }],
]) {
  assert.deepEqual(earth.shaped(SITE, same), alone);
}

// THE EDGE. A block of ground from column 70 to column 86, its top in row 20, 816 m: it is 816 m
// at column 79, and at columns 80 - the outline - and 86 the site's own. A step, one cell wide.
const edge = shaped([ground({ x: [70, 86], y: [20, 26], z: [20, 24] })]).heights;
for (let r = 20; r <= 26; r += 1) {
  assert.deepEqual(at(edge, [79, r], [80, r], [86, r]), [816, HILL[r][80], HILL[r][86]]);
}
// And an outline whose corners lie off the grid, one of them pointing inward, as a real plot has
// them: a made-up plot of 12 cells by 10, of a metre each, shaped like an L - in cells from
// (1.5, 1.5) to (9.5, 1.5), (9.5, 5.25), (5.25, 5.25), (5.25, 8.5) and (1.5, 8.5). The cells that
// lie within it with all of themselves are columns 2 to 8 of rows 2 to 4, and columns 2 to 4 of
// rows 5 to 7: so the plot's ground is 18 grid points. Under a block of ground over all of the
// paper those are its top, 105 m, and every other is the site's: a cell that the outline passes
// through is the site's, and the shaped ground meets the hill up to a cell inside the outline.
const ell = (c, r) => 90 + (1000 - 20 * c - 5 * r) / 100;
const ELL = {
  cellM: 1,
  xFromM: 0,
  yToM: 10,
  sideM: [90, 110],
  outline: points('1.5,8.5 9.5,8.5 9.5,4.75 5.25,4.75 5.25,1.5 1.5,1.5'),
  ground: { baseM: 90, rowsCm: [] },
};
for (let r = 0; r <= 10; r += 1) {
  ELL.ground.rowsCm.push(Array.from({ length: 13 }, (_, c) => 1000 - 20 * c - 5 * r).join(' '));
}
const raised = earth.shaped(ELL, [ground({ x: [0, 12], y: [0, 10], z: [5, 9] })]).heights;
const tops = raised.flatMap((line, r) => line.flatMap((high, c) => (high === 105 ? [[c, r]] : [])));
const EIGHTEEN = '3,3 4,3 5,3 6,3 7,3 8,3 3,4 4,4 5,4 6,4 7,4 8,4 3,5 4,5 3,6 4,6 3,7 4,7';
assert.equal(tops.join(' '), EIGHTEEN);
raised.forEach((line, r) => {
  line.forEach((high, c) => assert.ok(high === 105 || high === ell(c, r), `${c}, ${r}: ${high}`));
});

// A STRIP between two walls of the house, columns 44 to 84 - past the outline at column 80 - with
// a block of ground across its uphill end, its top at 816 m. At column 44 the hill lies at
// 815.6 - 0.02 r m: over the seven grid points of rows 18 to 24, at 815.18 m in the mean, and
// the block 0.82 m over it. At column 80 the ground is the site's. Between the two a point on a
// wall has three neighbours and a point between the walls four: summed across the strip, twice
// a column is the two beside it. So the mean of a column runs out in a straight line: at a
// column c it lies 0.82 * (80 - c) / 36 m over the hill.
const WALLS = [wall([44, 84], [16, 18]), wall([44, 84], [24, 26])];
const DAM = ground({ x: [40, 44], y: [18, 24], z: [20, 24] });
const ACROSS = [18, 19, 20, 21, 22, 23, 24];
const strip = shaped([...WALLS, DAM]).heights;
const meanAt = (c) => ACROSS.reduce((sum, r) => sum + strip[r][c] - hill(c, r), 0) / 7;
for (let c = 44; c <= 80; c += 1) near(meanAt(c), (0.82 * (80 - c)) / 36);
near(meanAt(53), 0.615);
near(meanAt(62), 0.41);
near(meanAt(71), 0.205);
// A wall is a wall whatever its height - and one that ends between two lines of the grid stands
// in every cell that it lies in with any of itself: the same cells. Inside it no ground is
// worked out.
for (const other of [wall([44, 84], [16, 18], [0, 2]), wall([44.5, 83.5], [16.5, 17.25])]) {
  assert.deepEqual(shaped([other, WALLS[1], DAM]).heights, strip);
}
assert.deepEqual(at(strip, [60, 17], [60, 25]), [HILL[17][60], HILL[25][60]]);
// With a top that falls across the plot as the hill does, 2 cm a row - from row 20 at row 18 of
// the top view to row 21 at row 43 - the block lies 0.76 m over the hill at each of the seven:
// 816 - 0.02 (r - 18) over 815.6 - 0.02 r. Then every one of the seven runs out in that line.
const fallen = shaped([...WALLS, { ...DAM, slope: { y: [18, 43], z: [20, 21] } }]).heights;
for (let c = 44; c <= 80; c += 1) {
  for (const r of ACROSS) near(fallen[r][c] - hill(c, r), (0.76 * (80 - c)) / 36);
}
near(fallen[21][53] - hill(53, 21), 0.57);
near(fallen[18][62] - hill(62, 18), 0.38);
near(fallen[24][71] - hill(71, 24), 0.19);

// A PLACE CLOSED IN: four boxes of the house round two cells, column 51 of rows 31 and 32, and a
// block of ground on the first, its top at 816 m. The place has six grid points: four are set,
// and the two under them free, with two neighbours each - the other one, and the set point over
// it. Those two set points lie p = 816 - 814.26 = 1.74 m and q = 816 - 814.16 = 1.84 m over the
// hill; so the free ones lie (2p + q) / 3 and (p + 2q) / 3 over it: at column 51 of row 33, on
// a hill of 814.24 m, at 816 + 1/75 m, and at column 52, on 814.14 m, at 816 - 4/75 m.
const LEFT = wall([50, 51], [30, 34]);
const REST = [wall([52, 53], [30, 34]), wall([51, 52], [30, 31]), wall([51, 52], [33, 34])];
const FILL = ground({ x: [51, 52], y: [31, 32], z: [20, 24] });
const SIX = '51,31 52,31 51,32 52,32 51,33 52,33';
const closed = shaped([LEFT, ...REST, FILL]).heights;
assert.deepEqual(at(closed, ...points(SIX).slice(0, 4)), [816, 816, 816, 816]);
near(closed[33][51], 816 + 1 / 75);
near(closed[33][52], 816 - 4 / 75);
// Nothing outside the place knows of it: every other grid point of the paper is the site's.
assert.equal(POINTS.filter(([c, r]) => closed[r][c] !== HILL[r][c]).join(' '), SIX);
// And the place knows nothing of what lies outside it: with the terrace in the place of that
// block - its corner against the corner of the place - the six are the site's.
const outside = shaped([LEFT, ...REST, TERRACE]).heights;
assert.deepEqual(at(outside, [50, 30]), [818]);
assert.deepEqual(at(outside, ...points(SIX)), at(HILL, ...points(SIX)));
// Two blocks of the house that touch at a corner leave a way between them. With the wall on the
// left a cell shorter, it and the wall below meet in the corner at column 51 of row 33 alone:
// the ground runs out of the place through that point, and lies over the hill beyond it.
const open = shaped([wall([50, 51], [30, 33]), ...REST, FILL]).heights;
assert.ok(over(open, [50, 34]) > 0.01 && over(open, [50, 34]) < 1.84);

// TOPS. Of two blocks of ground over one place, the higher: a second one, 817 m, over the
// terrace's downhill corner. Where both reach, 818 m - on the terrace's edge too.
const LOWER = ground({ x: [45, 55], y: [25, 35], z: [18, 22] });
const two = shaped([TERRACE, LOWER]);
assert.deepEqual(at(two.heights, ...points('47,27 50,30 51,30 53,33')), [818, 818, 817, 817]);
// A top that slopes down the plot, from row 16 at column 40 to its floor at column 50, row 20:
// 818 m, 817 m halfway, 816 m. And a plane that is said to fall to row 28 at column 50 is held
// at the floor there: the top is the straight line between its two ends, 817 m halfway still -
// where the plane itself would lie under the floor. Across the plot, from row 16 at row 20 of
// the top view to row 18 at row 30: 818 m, 817.5 m, 817 m.
const ramp = (slope) => shaped([{ ...TERRACE, slope }]).heights;
for (const low of [20, 28]) {
  const down = ramp({ x: [40, 50], z: [16, low] });
  for (let r = 20; r <= 30; r += 1) {
    assert.deepEqual(at(down, [40, r], [45, r], [50, r]), [818, 817, 816]);
  }
}
const sideways = ramp({ y: [20, 30], z: [16, 18] });
for (let c = 40; c <= 50; c += 1) {
  assert.deepEqual(at(sideways, [c, 20], [c, 25], [c, 30]), [818, 817.5, 817]);
}
// A block whose top lies under the hill cuts: with its top in row 24 the terrace is 814 m, 1.6 m
// under the hill at its uphill corner - 820 - 4 - 0.4 = 815.6 m - and no free point lies over
// the hill, or as far under it.
const cut = shaped([{ ...TERRACE, z: [24, 28] }]).heights;
for (const point of POINTS.filter(onTerrace)) assert.deepEqual(at(cut, point), [814]);
near(over(cut, [40, 20]), -1.6, 1e-9);
for (const point of free) assert.ok(over(cut, point) < 0 && over(cut, point) > -1.6);
// One that the hill runs through cuts at one corner and fills at the other: at 815 m, 0.6 m
// under the hill uphill and 0.6 m over it downhill - and the ground beyond each corner follows.
const both = shaped([{ ...TERRACE, z: [22, 26] }]).heights;
assert.deepEqual(at(both, [40, 20], [50, 30]), [815, 815]);
near(over(both, [40, 20]), -0.6, 1e-9);
near(over(both, [50, 30]), 0.6, 1e-9);
assert.ok(over(both, [39, 19]) < -0.1 && over(both, [51, 31]) > 0.1);

// THE HOUSE, and a block of ground before its porch, its top in row 24: 814 m. Column 58, where
// the porch ends, is 814 m from row 24 to row 36: the ground stands against the house. And no
// ground is worked out through the house: every grid point with a box of the house in all four
// cells round it is the site's very number - 285 inside the day rooms, 77 inside the porch, 49
// each inside the store and the garden, and 27 where two of the four meet.
const LAWN = ground({ x: [58, 72], y: [24, 36], z: [24, 28] });
const lived = shaped([...HOUSE, TREE, LAWN]);
for (let r = 24; r <= 36; r += 1) assert.deepEqual(at(lived.heights, [58, r]), [814]);
const stands = (c, r) => HOUSE.some(({ x, y }) => x[0] <= c && c < x[1] && y[0] <= r && r < y[1]);
const ROUND = NINE.filter(([dc, dr]) => dc < 1 && dr < 1);
const inHouse = POINTS.filter(([c, r]) => ROUND.every(([dc, dr]) => stands(c + dc, r + dr)));
assert.equal(inHouse.length, 285 + 77 + 49 + 49 + 27);
assert.deepEqual(at(lived.heights, ...inHouse), at(HILL, ...inHouse));
// The hill behind the house is moved too, by a little: a block of ground moves the whole plot.
assert.ok(over(lived.heights, [16, 27]) > 0.0001 && over(lived.heights, [16, 27]) < 0.01);

// THE SAME GROUND from the things in another order, number for number - and as many sweeps.
assert.deepEqual(earth.shaped(SITE, [LAWN, ...HOUSE.toReversed(), TREE]), lived);
assert.deepEqual(earth.shaped(SITE, [LOWER, TERRACE]), two);

process.stdout.write(
  'tools/sketch: the ground is the top of a block of ground, the site at the edge of the plot, and between them the mean of its neighbours, with the house holding it back\n',
);
