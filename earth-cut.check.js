// The check of the rule of the cut (earth.js, story ST-028), on the made-up plot and against
// figures worked out by hand: under a cut the ground lies at its floor wherever the ground
// without the cuts lay higher, and nowhere higher. A height that a sweep made is held to a tenth
// of a millimetre, every other to the last figure; a figure of two decimals is what the rule
// leaves, held to half a centimetre; the sweeps that are said are the trial's. No browser, no
// paper, nothing of the real site: site.js is never read. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/earth-cut.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

for (const file of ['demo-site', 'categories', 'blocks', 'earth']) await import(`./${file}.js`);
const { SITE, earth } = globalThis;

// THE MADE-UP PLOT, as earth.check.js has it: at column c and row r its ground lies at
// 820 - 0.1 c - 0.02 r m, and a row k of a standing view at 826 - 0.5 k m. A grid point is the
// plot's ground where the nine grid points round it lie within the outline; every other is held.
const HILL = SITE.ground.rowsCm.map((row) =>
  row.split(' ').map((cm) => SITE.ground.baseM + Number(cm) / 100),
);
const POINTS = HILL.flatMap((line, r) => line.map((height, c) => [c, r]));
const within = (c, r) =>
  c >= 12 && c <= 80 && r >= 10 && r <= 50 && 6 * c + 7 * r <= 746 && 10 * r - 3 * c <= 404;
const NINE = [-1, 0, 1].flatMap((dc) => [-1, 0, 1].map((dr) => [dc, dr]));
const ofPlot = ([c, r]) => NINE.every(([dc, dr]) => within(c + dc, r + dr));
const near = (a, b, most = 0.0001) => assert.ok(Math.abs(a - b) < most, `${a} is not ${b}`);
const nears = (list, figures, most) => list.forEach((a, index) => near(a, figures[index], most));
const points = (text) => text.split(' ').map((point) => point.split(',').map(Number));
const ground = (box) => ({ colour: 9, is: 'ground', ...box });
const cut = (box) => ({ colour: 1, is: 'cut', ...box });
const wall = (x, y, z = [12, 24]) => ({ x, y, z, colour: 10 });
const at = (heights, ...list) => list.map(([c, r]) => heights[r][c]);
// Whether a box reaches a grid point, its edges included; the grid points it reaches; and of
// those the ones at which a ground is a height, to the last figure, or lies over one.
const reaches = (c, r) => (box) => c >= box.x[0] && c <= box.x[1] && r >= box.y[0] && r <= box.y[1];
const reach = (box) => POINTS.filter(([c, r]) => reaches(c, r)(box));
const level = (heights, box, m) => reach(box).filter(([c, r]) => heights[r][c] === m);
const above = (heights, box, m) => reach(box).filter(([c, r]) => heights[r][c] > m);
/**
 * The ground of some things, in under so many sweeps - held, each time, to the rule. At a grid
 * point that is not the plot's ground: the site's very number. At one of the plot's ground at
 * which the ground WITHOUT THE CUTS, worked out by the rule, lies over the floor of a cut that
 * reaches it - of several the lowest: that floor, to the last figure. At every other that no
 * block of ground reaches, where no box of the house is among the things: the mean of its four
 * neighbours, over the hill - NONE IS HELD DOWN. And NOTHING IS RAISED: no grid point lies
 * higher than without the cuts, both to a hundredth of a millimetre. No cut here lies in the house.
 */
function shaped(things, most = 400) {
  const made = earth.shaped(SITE, things) ?? assert.fail('nothing is shaped');
  const [cuts, tops] = ['cut', 'ground'].map((as) => things.filter((thing) => thing.is === as));
  const uncut = things.filter((thing) => !cuts.includes(thing));
  const bare = earth.shaped(SITE, uncut)?.heights ?? HILL;
  const lies = (c, r) => made.heights[r][c] - HILL[r][c];
  const mean = (c, r) => (lies(c - 1, r) + lies(c + 1, r) + lies(c, r - 1) + lies(c, r + 1)) / 4;
  for (const [c, r] of POINTS) {
    const [high, lay, plain] = [made.heights[r][c], bare[r][c], tops.length === uncut.length];
    const floor = Math.min(...cuts.filter(reaches(c, r)).map(({ z }) => 826 - 0.5 * z[1]));
    if (!ofPlot([c, r])) assert.equal(high, HILL[r][c], `the ground is changed at ${c}, ${r}`);
    else if (lay > floor) assert.equal(high, floor, `not the floor at ${c}, ${r}`);
    else if (plain && !tops.some(reaches(c, r))) near(lies(c, r), mean(c, r), 0.00001);
    assert.ok(high - lay < 0.00001, `the ground is raised at ${c}, ${r}`);
  }
  assert.ok(made.sweeps >= 1 && made.sweeps < most, `${made.sweeps} sweeps`);
  return made;
}

// The made-up house, its lawn, a terrace of 818 m, and two walls with a dam of 816 m across the
// strip between them - earth.check.js's, typed in - and three places of 5 m by 5 m.
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
const LAWN = ground({ x: [58, 72], y: [24, 36], z: [24, 28] });
const TERRACE = ground({ x: [40, 50], y: [20, 30], z: [16, 20] });
const WALLS = [wall([44, 84], [16, 18]), wall([44, 84], [24, 26])];
const DAM = ground({ x: [40, 44], y: [18, 24], z: [20, 24] });
const PLACE = { x: [40, 50], y: [20, 30] };
const CORNER = { x: [45, 55], y: [25, 35] };
const NEXT = { x: [50, 60], y: [20, 30] };
const FIVE = points('44,24 45,25 50,30 51,31 55,35');

// NOTHING SHAPED is null: a cut over the hill everywhere, its floor in row 14, 819 m, on a hill
// of 815.6 m at the most; one off the plot, and one on its downhill side, column 80, and beyond
// - held points, over a floor of 811 m; and one inside the day rooms: points of no ground.
for (const none of [
  [cut({ ...PLACE, z: [10, 14] })],
  [cut({ x: [82, 90], y: [20, 26], z: [10, 30] })],
  [cut({ x: [80, 90], y: [20, 26], z: [10, 30] })],
  [...HOUSE, cut({ x: [34, 46], y: [26, 34], z: [18, 24] })],
]) {
  assert.equal(earth.shaped(SITE, none), null);
}

// A CUT ALONE, its floor in row 24, 814 m: under the hill at every grid point it reaches, for
// the hill is lowest at its downhill corner, 820 - 5 - 0.6 = 814.4 m. The first ground is the
// site's own, at no sweep: so this is the grid of the block of ground with its top there,
// number for number and in as many sweeps, 269. ONLY THE FLOOR COUNTS: not how high the box
// reaches, nor a top that slopes. A box may end between two lines of the grid; a cut is one by
// its name and by its category as by `is`; and two boxes, the downhill one first, make it up.
const CUT = cut({ ...PLACE, z: [16, 24] });
const alone = shaped([CUT]);
assert.equal(level(alone.heights, PLACE, 814).length, 121);
const half = (from) => ({ ...CUT, x: [from, from + 5] });
for (const same of [
  [ground({ ...PLACE, z: [24, 28] })],
  [{ ...CUT, z: [2, 24] }],
  [{ ...CUT, slope: { x: [40, 50], z: [16, 22] } }],
  [{ ...CUT, x: [39.5, 50.5], y: [19.25, 30.75] }],
  [{ ...CUT, is: undefined, name: 'Ground cut' }],
  [{ ...CUT, is: undefined, category: 'ground-cut' }],
  [half(45), half(40)],
]) {
  assert.deepEqual(earth.shaped(SITE, same), alone);
}

// A CUT THAT THE HILL RUNS THROUGH, its floor in row 22, 815 m. The hill lies over 815 m where
// 5 c + r < 250: at 59 of the 121 - columns 40 to 43 whole, 44 down to row 29, 45 down to row
// 24 - and those are 815 m. At (44, 30), (45, 25) and (46, 20) the hill is 815 m itself: not
// over the floor, so free, and under it. NOTHING IS FILLED: no grid point lies over the hill,
// and the box's downhill corner lies under the hill's 814.4 m - where a block of ground fills.
const through = shaped([cut({ ...PLACE, z: [14, 22] })]).heights;
const bitten = reach(PLACE).filter(([c, r]) => 5 * c + r < 250);
assert.deepEqual([bitten.length, level(through, PLACE, 815)], [59, bitten]);
assert.ok(points('44,30 45,25 46,20').every(([c, r]) => HILL[r][c] === 815 && through[r][c] < 815));
assert.ok(POINTS.every(([c, r]) => through[r][c] <= HILL[r][c]) && through[30][50] < 814.39);

// A CUT BITES INTO A FILL AND ITS RUN-OUT: the terrace, 818 m, and a cut over its downhill
// corner, its floor in row 18, 817 m. Of the cut's 121 grid points 65 are 817 m, the ones at
// which the terrace alone leaves the ground over 817 m: the 36 that the terrace reaches too,
// and 29 in its run-out - up to column 52 on rows 25 to 29, 51 on rows 30 and 31, 50 on row 32,
// 48 on row 33, and (45, 34) - where it leaves 817.61 m at (51, 25), 817.74 m at (45, 31) and
// 817.10 m at (51, 31). The 56 others lie lower, 816.86 m at the most. Twice: 288 sweeps, 290.
const LAST = { 25: 52, 26: 52, 27: 52, 28: 52, 29: 52, 30: 51, 31: 51, 32: 50, 33: 48, 34: 45 };
const terrace = shaped([TERRACE]);
const bit = shaped([TERRACE, cut({ ...CORNER, z: [10, 18] })], 800).heights;
const floored = reach(CORNER).filter(([c, r]) => c <= LAST[r]);
assert.deepEqual([floored.length, level(bit, PLACE, 817).length, bit[24][44]], [65, 36, 818]);
assert.deepEqual(level(bit, CORNER, 817), floored);
assert.deepEqual(above(terrace.heights, CORNER, 817), floored);
nears(at(terrace.heights, ...points('51,25 45,31 51,31')), [817.61, 817.74, 817.1], 0.005);
near(Math.max(...at(bit, ...reach(CORNER).filter(([c, r]) => !(c <= LAST[r])))), 816.86, 0.005);

// THE SECOND WORKING OUT BEGINS FROM THE START, and `sweeps` is both together: the terrace
// under a cut over its very place, its floor at 817 m, is the grid of the terrace with its top
// there, number for number, in the sweeps of the two terraces added, 288 and 282. And where
// NOTHING BITES - that cut with its floor at 819 m - the terrace alone, in as many sweeps.
const lower = shaped([ground({ ...PLACE, z: [18, 22] })]);
const lowered = shaped([TERRACE, cut({ ...PLACE, z: [10, 18] })], 800);
assert.deepEqual(lowered, { heights: lower.heights, sweeps: terrace.sweeps + lower.sweeps });
assert.deepEqual(earth.shaped(SITE, [TERRACE, cut({ ...PLACE, z: [10, 14] })]), terrace);

// A CUT AND A BLOCK OF GROUND OVER ONE PLACE - the lower is the ground: the cut alone, 814 m,
// and a block of ground over its downhill corner. With the block's top at 817 m the cut's 121
// points are 814 m, and the block's others 817 m. With its top at 813 m the 36 points that both
// reach are 813 m; 33 of the cut's are 814 m, the ones at which the block alone leaves the
// ground higher - on row 20 columns 40 to 46; the 52 others are free still: at (44, 24) 813.55 m
// for the block's 813.61 m, NOT RAISED TO THE FLOOR. And of TWO CUTS the lower floor, 813.5 m.
const filled = shaped([CUT, ground({ ...CORNER, z: [18, 22] })], 800).heights;
assert.equal(level(filled, PLACE, 814).length, 121);
assert.deepEqual(at(filled, ...FIVE), [814, 814, 814, 817, 817]);
const PIT = ground({ ...CORNER, z: [26, 30] });
const [pit, dug] = [shaped([PIT]).heights, shaped([CUT, PIT], 800).heights];
assert.deepEqual(at(dug, ...FIVE.slice(1), [40, 20]), [813, 813, 813, 813, 814]);
assert.deepEqual([level(dug, PLACE, 813).length, level(dug, PLACE, 814).length], [36, 33]);
assert.deepEqual(level(dug, PLACE, 814), above(pit, PLACE, 814));
assert.equal(level(dug, { x: [40, 46], y: [20, 20] }, 814).length, 7);
nears([pit[24][44], dug[24][44]], [813.61, 813.55], 0.005);
const two = shaped([CUT, cut({ ...CORNER, z: [16, 25] })]).heights;
assert.deepEqual(at(two, ...FIVE), [814, 813.5, 813.5, 813.5, 813.5]);

// A STRIP between the two walls, columns 44 to 84 on rows 18 to 24. A cut across its uphill
// end, its floor at 814 m: column 44 is 814 m, 1.18 m under the hill in the mean of its seven
// rows, and from there the mean of a column runs out in a straight line to the site's at column
// 80: -1.18 (80 - c) / 36 m. A cut in its middle instead, columns 56 to 64, its floor at 813 m:
// its 63 points are 813 m, in the mean of a column 0.98 m under the hill at column 56, 0.58 m
// at 60 and 0.18 m at 64; from there -0.18 (80 - c) / 16 m; and uphill of it a straight line
// too, at column 50 the mean of 44 and 56. And the dam, 816 m, under a cut with its floor at
// 815.5 m: 35 points at 815.5 m, 0.32 (80 - c) / 36 m over the hill. Twice: 248 sweeps and 230.
const END = { x: [40, 44], y: [18, 24] };
const MIDDLE = { x: [56, 64], y: [18, 24] };
const sum = (list) => list.reduce((total, value) => total + value, 0);
const means = (heights, ...columns) =>
  columns.map((c) => sum([18, 19, 20, 21, 22, 23, 24].map((r) => heights[r][c] - HILL[r][c])) / 7);
const strip = shaped([...WALLS, cut({ ...END, z: [10, 24] })]).heights;
assert.equal(level(strip, END, 814).length, 35);
nears(means(strip, 44, 53, 62, 71, 80), [-1.18, -0.885, -0.59, -0.295, 0]);
const mid = shaped([...WALLS, cut({ ...MIDDLE, z: [10, 26] })]).heights;
assert.equal(level(mid, MIDDLE, 813).length, 63);
nears(means(mid, 56, 60, 64, 68, 72, 76, 80), [-0.98, -0.58, -0.18, -0.135, -0.09, -0.045, 0]);
near(means(mid, 50)[0], (means(mid, 44)[0] + means(mid, 56)[0]) / 2);
const dammed = shaped([...WALLS, DAM, cut({ ...END, z: [10, 21] })], 800).heights;
assert.equal(level(dammed, END, 815.5).length, 35);
nears(means(dammed, 44, 53, 62, 71, 80), [0.32, 0.24, 0.16, 0.08, 0]);

// A PLACE CLOSED IN: the four boxes of earth.check.js round two cells, and a cut on the first,
// its floor at 813 m. The four points it reaches are 813 m; the two under them, with
// p = 813 - 814.26 and q = 813 - 814.16, lie (2p + q) / 3 and (p + 2q) / 3 over the hill: at
// 813 + 1/75 m and at 813 - 4/75 m. Every other grid point of the paper is the site's.
const LEFT = wall([50, 51], [30, 34]);
const REST = [wall([52, 53], [30, 34]), wall([51, 52], [30, 31]), wall([51, 52], [33, 34])];
const SIX = '51,31 52,31 51,32 52,32 51,33 52,33';
const closed = shaped([LEFT, ...REST, cut({ x: [51, 52], y: [31, 32], z: [20, 26] })]).heights;
nears(at(closed, ...points(SIX)), [813, 813, 813, 813, 813 + 1 / 75, 813 - 4 / 75]);
assert.equal(POINTS.filter(([c, r]) => closed[r][c] !== HILL[r][c]).join(' '), SIX);

// THE OUTLINE: a cut over the plot's downhill side, column 80, and beyond, its floor at 811 m:
// 811 m from column 70 to 79, and the site's own at 80, on each row from 20 to 26. With its
// floor at 812 m the hill lies over it where 5 c + r < 400: the 40 points of columns 70 to 74,
// and of 75 down to row 24, are 812 m, and no other.
const EDGE = { x: [70, 86], y: [20, 26] };
const edge = shaped([cut({ ...EDGE, z: [20, 30] })]).heights;
assert.equal(level(edge, { x: [70, 79], y: [20, 26] }, 811).length, 70);
const brink = reach(EDGE).filter(([c, r]) => 5 * c + r < 400);
const brim = shaped([cut({ ...EDGE, z: [20, 28] })]).heights;
assert.deepEqual([brink.length, level(brim, EDGE, 812)], [40, brink]);

// AGAINST THE HOUSE: its eight boxes, the lawn, and a cut beside the day rooms, from their side
// to the plot's edge, its floor at 814 m, theirs - the cut of the made-up sketch (T-028.5). Row
// 22, the side of the house, is 814 m from column 30 to 50, where the hill stood at 816.56 m to
// 814.56 m; column 40 is 814 m from row 11 to 22, the site's 815.8 m at row 10, on the outline,
// and the site's at row 23, inside the day rooms, as all 487 grid points inside a block of the
// house are. Twice, for the lawn is ground: 289 sweeps and 290. THE SAME THINGS IN ANOTHER
// ORDER: the same grid, as many sweeps. And that box set to a room holds the ground back.
const BESIDE = { x: [30, 50], y: [10, 22], z: [18, 24] };
const lived = shaped([...HOUSE, LAWN, cut(BESIDE)], 800);
assert.equal(level(lived.heights, { x: [30, 50], y: [22, 22] }, 814).length, 21);
assert.equal(level(lived.heights, { x: [40, 40], y: [11, 22] }, 814).length, 12);
assert.deepEqual(at(lived.heights, [40, 10], [40, 23]), [HILL[10][40], HILL[23][40]]);
const stands = (c, r) => HOUSE.some(({ x, y }) => x[0] <= c && c < x[1] && y[0] <= r && r < y[1]);
const ROUND = NINE.filter(([dc, dr]) => dc < 1 && dr < 1);
const inHouse = POINTS.filter(([c, r]) => ROUND.every(([dc, dr]) => stands(c + dc, r + dr)));
assert.equal(inHouse.length, 487);
assert.deepEqual(at(lived.heights, ...inHouse), at(HILL, ...inHouse));
assert.deepEqual(earth.shaped(SITE, [cut(BESIDE), LAWN, ...HOUSE.toReversed()]), lived);
const room = shaped([...HOUSE, LAWN, { ...BESIDE, colour: 1 }]).heights;
assert.deepEqual(room[22].slice(31, 50), HILL[22].slice(31, 50));

// BESIDE A DEEPER PIT OF GROUND A CUT TAKES NOTHING: a block of ground with its top at 812 m,
// and beside it a cut with its floor at 814 m. Under the cut the pit alone leaves the ground at
// 812 m to 812.77 m, under the floor at every point: the grid of the pit alone, number for
// number and in as many sweeps - though the hill itself stands over 814 m at 59 of those points,
// where 5 c + r < 300. Beside that block with its top at 815 m the cut bites, in 253 sweeps
// and 249: the block alone leaves the ground over 814 m at 85 of the cut's 121 points - columns
// 50 to 57 on rows 20 to 27, 50 to 56 on rows 28 to 30 - and those are 814 m: on row 25 columns
// 55 to 57 too, where the hill lies at 814 m and under, its run-out at 814.30 m to 814.04 m.
const DITCH = cut({ ...NEXT, z: [16, 24] });
const deep = shaped([ground({ ...PLACE, z: [28, 32] })]);
assert.deepEqual(earth.shaped(SITE, [ground({ ...PLACE, z: [28, 32] }), DITCH]), deep);
const under = at(deep.heights, ...reach(NEXT));
nears([Math.min(...under), Math.max(...under)], [812, 812.77], 0.005);
assert.equal(above(HILL, NEXT, 814).length, 59);
const HIGHER = ground({ ...PLACE, z: [22, 26] });
const [higher, bites] = [shaped([HIGHER]).heights, shaped([HIGHER, DITCH], 800).heights];
const eighty = reach(NEXT).filter(([c, r]) => c <= (r <= 27 ? 57 : 56));
assert.equal(eighty.length, 85);
assert.deepEqual([level(bites, NEXT, 814), above(higher, NEXT, 814)], [eighty, eighty]);
nears(at(higher, [55, 25], [56, 25], [57, 25]), [814.3, 814.17, 814.04], 0.005);
// OF TWO CUTS SIDE BY SIDE EACH HOLDS ITS FLOOR: a cut of 812 m, and that cut of 814 m beside
// it. On row 25: 812 m at columns 49 and 50, and 814 m at columns 51 to 54, where the hill
// stands over 814 m - and where the deeper cut alone leaves 812.09 m to 812.33 m.
const DEEP = cut({ ...PLACE, z: [16, 28] });
assert.deepEqual(shaped([DEEP, DITCH]).heights[25].slice(49, 55), [812, 812, 814, 814, 814, 814]);
nears(at(shaped([DEEP]).heights, [51, 25], [54, 25]), [812.09, 812.33], 0.005);

// THE TEXT, by hand: where a sketch has a cut, the text of before, a bar, and the cuts - where
// each lies, and the row of its floor twice. With no cut it is the text of before, to the
// letter; empty where no block is ground and none a cut. A cut's height is not in it.
const SHED = { x: [52, 60], y: [20, 30], z: [14, 20], colour: 2, name: 'Shed' };
const BEFORE = '40,50,20,30,x,16,16|52,60,20,30';
assert.equal(earth.shapedBy([CUT, SHED]), '|52,60,20,30|40,50,20,30,x,24,24');
assert.equal(earth.shapedBy([SHED, CUT, TERRACE]), `${BEFORE}|40,50,20,30,x,24,24`);
assert.deepEqual([[TERRACE, SHED], [SHED]].map(earth.shapedBy), [BEFORE, '']);
assert.equal(earth.shapedBy([{ ...CUT, z: [2, 24] }, SHED]), earth.shapedBy([CUT, SHED]));
assert.notEqual(earth.shapedBy([{ ...CUT, z: [16, 26] }, SHED]), earth.shapedBy([CUT, SHED]));

// WHAT IT COSTS, in sweeps, the same on every machine: on the made-up plot under 400 for a
// working out, as every case above. On the plane of earth-paper.check.js, 10 125 grid points: a
// cut of four cells by four, 2 m under the plane, and a house with a cut of 20 m by 6 m along
// its side, each under 500; that house with a terrace before it and the cut, twice, under 1 000.
const rowsCm = Array.from({ length: 81 }, (_, r) =>
  Array.from({ length: 125 }, (__, c) => 4000 - 10 * c - 2 * r).join(' '),
);
const outline = points('0.5,0.5 0.5,39.5 61.5,39.5 61.5,0.5');
const frame = { cellM: 0.5, xFromM: 0, yToM: 40, sideM: [780, 830], outline };
const PLANE = { ...frame, ground: { baseM: 780, rowsCm } };
const cost = (...things) => earth.shaped(PLANE, things).sweeps;
const [BIG, ALONG] = [wall([40, 80], [30, 50]), cut({ x: [40, 80], y: [18, 30], z: [20, 40] })];
const FILL = ground({ x: [90, 110], y: [30, 50], z: [36, 40] });
assert.ok(cost(cut({ x: [60, 64], y: [38, 42], z: [20, 38] })) < 500 && cost(BIG, ALONG) < 500);
assert.ok(cost(BIG, FILL, ALONG) < 1000 && cost(BIG, FILL, ALONG) > cost(BIG, FILL));

process.stdout.write(
  'tools/sketch: under a cut the ground lies at its floor wherever it lay higher without the cuts, nothing is raised, and the house and the edge of the plot hold as they did\n',
);
