// The check of the one computation of a plot (ST-031, rule 7): plot.js by hand, with nothing
// running and no file read. The card's eight hand cases, on ground that is made up by a rule -
// a 32-bit height at the middle of every cell, as a tile holds one - where the answer is known:
// the frame, the paper, every height that a hand gives. A plot lies in the pad as it lies on the
// map: a mirrored one fails case 1, a turned one too, and one that always lies x along the side
// that was picked fails cases 2 and 4. Then a height at a place, the fall of a plane and the way
// that x runs, the standing paper, ground too steep for the pad, the credit and the sources to
// the letter, and the eight sites through the one writer and the one reader. All of it lies at
// the origin of the Swiss grid, and is no ground that exists. Run by check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { areaOf, read, write } from '../plot-file.js';
import { longest, paperOf } from './frame.js';
import { OVER_M, UNDER_M, fallOf, heightAt, plotOf, quarterOf } from './plot.js';

const [E0, N0] = [2_600_000, 1_200_000];
const DAY = '2026-10-13';
/** A flat list of figures in rows, so many a row: two, unless said. */
const rowsOf = (figures, by = 2) =>
  Array.from({ length: figures.length / by }, (_, at) => figures.slice(at * by, at * by + by));
/** Corners in LV95: so many metres east and north of the origin, two figures a corner. */
const corners = (...metres) => rowsOf(metres).map(([east, north]) => [E0 + east, N0 + north]);
const PENTAGON = corners(20, 10, 38, 34, 28.4, 41.2, 10, 30, 4, 22);
const RECTANGLE = corners(10, 10, 34, 10, 34, 26, 10, 26);
const CLICKED = corners(3.14159, 2.71828, 31.4, 17.3, 22.25, 40.05, -4.2, 25.9);

// The made-up grounds, in metres above sea level, at so many metres east and north of the
// origin. A slope that falls 0.1 m a metre along the pentagon's first side and rises 0.02 m a
// metre to its left; one that falls 0.1 m a metre to the left of that side; a wall of 3 m; and
// level ground.
const SLOPE = (east, north) => 560 - 0.076 * east - 0.068 * north;
const ACROSS = (east, north) => 557.2 + 0.068 * east - 0.076 * north;
const WALL = (east) => (east < 20 ? 560 : 557);
const level = (metres) => () => metres;
const TILE = { name: 'swissalti3d_2025_2600-1200', year: 2025 };

/** Made-up ground as swissALTI3D has it: the cells out to the first middle on or beyond each edge of a box, and at each middle a 32-bit height. */
function groundOf(box, heightOf, tiles = [TILE]) {
  const [west, south] = [box.minE, box.minN].map((edge) => Math.floor(edge / 0.5 - 0.5));
  const [east, north] = [box.maxE, box.maxN].map((edge) => Math.ceil(edge / 0.5 - 0.5));
  const heightsM = Array.from({ length: north - south + 1 }, (_, row) =>
    Array.from({ length: east - west + 1 }, (__, column) => {
      const middle = [(west + column + 0.5) * 0.5 - E0, (south + row + 0.5) * 0.5 - N0];
      return Math.fround(heightOf(...middle));
    }),
  );
  return { cells: { west, east, south, north }, heightsM, tiles };
}

/** The plot of corners on made-up ground: the ground of the box that the paper asks for, with x along the side. */
function made(marked, heightOf, aroundM = 5, side = longest(marked), more = {}) {
  const order = { name: 'Made-up plot', corners: marked, side, aroundM, on: ['cadastral'] };
  const ground = groundOf(paperOf(marked, side, aroundM).box, heightOf, more.tiles);
  return plotOf({ ...order, ground, day: DAY, ...more });
}
/** A site's heights, in centimetres over its base, as rows of numbers; and its paper, in metres and in cells. */
const heights = (site) => site.ground.rowsCm.map((row) => row.split(' ').map(Number));
const paper = ({ xFromM, xToM, yFromM, yToM }) => [xFromM, xToM, yFromM, yToM];
const cells = ({ xFromM, xToM, yFromM, yToM }) => [xToM - xFromM, yToM - yFromM].map((m) => m * 2);

// The eight cases. A row: the corners, the ground, the ground around and the side; then what it
// comes to - which way x runs, of the four, the bearing, the paper, the base and the standing
// paper. In the lists after it the outline, and the height in centimetres over the base at row
// r and column c, where a hand gives every one.
const CASES = [
  [PENTAGON, SLOPE, 5, 0, 0, 36.8699, [-5, 35, -5, 25], 554, [551, 575]],
  [PENTAGON, ACROSS, 5, 0, 3, 306.8699, [-5, 25, -35, 5], 554, [551, 575]],
  [RECTANGLE, WALL, 5, 0, 0, 90, [-5, 29, -5, 21], 557, [554, 576]],
  [PENTAGON, WALL, 5, 0, 1, 126.8699, [-25, 5, -5, 35], 557, [554, 576]],
  [PENTAGON, level(560), 5, 0, 0, 36.8699, [-5, 35, -5, 25], 560, [557, 576]],
  [RECTANGLE, SLOPE, 0, 0, 0, 90, [0, 24, 0, 16], 555, [552, 575]],
  [RECTANGLE, SLOPE, 2.5, 1, 1, 90, [-26.5, 2.5, -2.5, 18.5], 555, [552, 575]],
  [CLICKED, SLOPE, 5, 0, 0, 62.7097, [-5, 39.5, -5, 29.5], 554, [551, 577]],
];
const OUTLINES = [
  [0, 0, 30, 0, 30, 12, 10, 20, 0, 20],
  [0, 0, 0, -30, 12, -30, 20, -10, 20, 0],
  [0, 0, 24, 0, 24, 16, 0, 16],
  [0, 0, 0, 30, -12, 30, -20, 10, -20, 0],
  [0, 0, 30, 0, 30, 12, 10, 20, 0, 20],
  [0, 0, 24, 0, 24, 16, 0, 16],
  [-24, 0, 0, 0, 0, 16, -24, 16],
  [0, 0, 31.799, 0, 34.099, 24.413, 4.105, 23.965],
];
const BY_HAND = [
  (r, c) => 480 - 5 * c - r,
  (r, c) => 440 - 5 * c - r,
  (r, c) => (c < 30 ? 300 : c === 30 ? 150 : 0),
  (r, c) => Math.min(300, Math.max(0, 150 - 60 * (10 + 4 * c - 3 * r))),
  () => 0,
  (r, c) => Math.round(247.2 - 3.8 * c + 3.4 * r),
  (r, c) => Math.round(249.2 - 3.8 * c + 3.4 * r),
  null,
];
const FIELDS = ['name', 'cellM', 'bearingDeg', 'originLV95', 'xFromM', 'xToM', 'yFromM', 'yToM'];
FIELDS.push('sideM', 'outline', 'notes', 'ground', 'credit', 'sources');
const SITES = CASES.map((row, at) => {
  const [marked, heightOf, aroundM, side, quarter, bearingDeg, sheet, baseM, sideM] = row;
  const { site } = made(marked, heightOf, aroundM, side);
  const which = `case ${at + 1}`;
  assert.deepEqual(Object.keys(site), FIELDS, which);
  assert.deepEqual([site.name, site.cellM, site.notes], ['Made-up plot', 0.5, []], which);
  assert.equal(site.bearingDeg, bearingDeg, which);
  // Every nought of it is a plain nought: a strict comparison tells one with a minus before it.
  assert.deepEqual(site.outline, rowsOf(OUTLINES[at]), which);
  assert.deepEqual(paper(site), sheet, which);
  assert.deepEqual([site.ground.baseM, site.sideM], [baseM, sideM], which);
  // A height at every grid point of the paper, each a whole centimetre over the base and inside
  // what the standing views show, at neither end; and where a hand gives every one, each.
  const cm = heights(site);
  const [along, across] = cells(site);
  assert.deepEqual([cm.length, ...new Set(cm.map((line) => line.length))], [across + 1, along + 1]);
  const [lowest, highest] = [Math.min(...cm.flat()), Math.max(...cm.flat())];
  assert.ok(Number.isInteger(lowest) && lowest >= 0 && lowest < 100, which);
  assert.ok(baseM > sideM[0] && baseM + highest / 100 < sideM[1], which);
  cm.forEach((line, r) => {
    const byHand = line.map((height, c) => (BY_HAND[at] ?? (() => height))(r, c));
    assert.deepEqual(line, byHand, `${which}, row ${r}`);
  });
  // In the frame that it got, the ground falls most along x: no quarter turn is left to make.
  assert.equal(quarterOf(fallOf(cm)), 0, which);
  // The area that the file has is the paper's own in that frame, to the last figure.
  assert.equal(areaOf(site), paperOf(marked, side, aroundM, quarter).areaM2, which);
  return site;
});
const [one, two, three, four, five, six, seven, eight] = SITES;

// Case 1, and what it is there for: a plot lies in the pad as it lies on the map. A mirrored
// plot - y to the right of x - says [30, -12] for its third corner and 420 for its first
// height; a turned one a bearing of 126.8699 and a paper of 60 by 80 cells.
assert.deepEqual(one.outline[2], [30, 12], 'y runs to the left of x: mirrored, it is [30, -12]');
assert.equal(heights(one)[0][0], 480, 'the first height: mirrored, it is 420');
assert.equal(one.bearingDeg, 36.8699, 'x runs along the side: turned, it is 126.8699');
assert.deepEqual(one.originLV95, [E0 + 20, N0 + 10], 'x = 0, y = 0: the first corner of the side');
assert.deepEqual(cells(one), [80, 60], 'turned, the paper is 60 by 80 cells');
assert.deepEqual([heights(one).length, heights(one)[0].length, areaOf(one)], [61, 81, 520]);
// Case 2: the same corners on ground that falls to the left of the side. A plot that always
// lies x along the side that was picked says a bearing of 36.8699 and 80 by 60 cells.
assert.equal(two.bearingDeg, 306.8699, 'x runs down the ground: along the side, it is 36.8699');
assert.deepEqual(cells(two), [60, 80], 'along the side, the paper is 80 by 60 cells');
assert.deepEqual([heights(two).length, heights(two)[0].length], [81, 61]);
// Case 3: every one of the 53 rows has 30 heights of 300, one of 150 and 38 of 0. The plane
// falls 1761 / 27370 m a column.
assert.deepEqual([heights(three).length, new Set(three.ground.rowsCm).size], [53, 1]);
assert.equal(three.ground.rowsCm[0], [...Array(30).fill(300), 150, ...Array(38).fill(0)].join(' '));
const metresOf = (site) => heights(site).map((line) => line.map((height) => height / 100));
assert.ok(Math.abs(fallOf(metresOf(three)).downX - (2 * 1761) / 27370) < 1e-12);
assert.equal(fallOf(metresOf(three)).downX.toFixed(6), '0.128681');
assert.equal(Math.abs(fallOf(metresOf(three)).downY), 0, 'and not at all down y');
// Case 4: the wall under the pentagon falls east, and of the four ways the nearest is to the
// right of the side. A grid point lies 10 + 4c - 3r tenths of a metre east of the wall, and the
// wall is a slope over one cell: of 4941 heights 2223 are 300 and 2620 are 0, and between them
// lie its 3 m by the shares 0.1, 0.3, 0.5, 0.7 and 0.9 of a cell; four of them typed in.
assert.equal(four.bearingDeg, 126.8699, 'x runs to the right of the side: along it, 36.8699');
const counted = Object.groupBy(heights(four).flat(), (height) => height);
const HOW_MANY = [0, 2620, 30, 20, 90, 20, 150, 19, 210, 19, 270, 20, 300, 2223];
const tally = Object.entries(counted).map(([height, all]) => [Number(height), all.length]);
assert.deepEqual(tally, rowsOf(HOW_MANY));
const wall = heights(four);
assert.deepEqual([wall[70][50], wall[68][49], wall[71][51], wall[68][48]], [150, 30, 90, 270]);
const fall = fallOf(metresOf(four));
assert.deepEqual([fall.downX.toFixed(6), fall.downY.toFixed(6)], ['0.098232', '0.073442']);
// Case 5: on flat ground x runs along the side, as it was marked. Case 6: the first row begins
// 247 243 240 236, the second 251 247 243; its four corners. Case 7: the side runs north, and
// x to its right. Case 8: its four corners, and its area to the thousandth.
assert.ok(five.ground.rowsCm.every((line) => line === Array(81).fill(0).join(' ')));
const ends = (lines) => [lines[0], lines.at(-1)].flatMap((line) => [line[0], line.at(-1)]);
assert.deepEqual(heights(six)[0].slice(0, 4), [247, 243, 240, 236]);
assert.deepEqual(heights(six)[1].slice(0, 3), [251, 247, 243]);
assert.deepEqual(ends(heights(six)), [247, 65, 356, 174]);
assert.deepEqual(heights(seven)[0].slice(0, 4), [249, 245, 242, 238]);
assert.deepEqual(ends(heights(eight)), [532, 92, 620, 180]);
assert.equal(areaOf(eight).toFixed(3), '746.638');

// Each of the eight is a site that the one writer takes, and that the one reader gives back as
// it was, its fields in the order of the format's table.
for (const [at, site] of SITES.entries()) {
  const { text, refused } = write(site);
  assert.equal(refused, undefined, `case ${at + 1}`);
  assert.deepEqual(read(text).site, site, `case ${at + 1}`);
  assert.equal(JSON.stringify(read(text).site), JSON.stringify(site), `case ${at + 1}`);
}

// A height at a place: read between the four middles of cells around it, by two weights each
// way. Two rows of three cells: their middles lie at E 5.25, 5.75 and 6.25, N 10.25 and 10.75.
// At a middle it is the cell's own height, to the last figure; between them, by hand.
const ODD = [100, 102, 110, 104, 106, 120].map((height) => Math.fround(height + 0.123));
const SMALL = { cells: { west: 10, east: 12, south: 20, north: 21 }, heightsM: rowsOf(ODD, 3) };
const at = ([east, north]) => heightAt(SMALL, [east, north]);
const MIDDLES = [5.25, 10.25, 5.75, 10.25, 6.25, 10.25, 5.25, 10.75, 5.75, 10.75, 6.25, 10.75];
assert.deepEqual(rowsOf(MIDDLES).map(at), ODD);
const even = (height) => Math.round((height - 0.123) * 1000) / 1000;
const BETWEEN = rowsOf([5.5, 10.25, 5.25, 10.5, 5.5, 10.5, 5.375, 10.25, 6, 10.625]);
assert.deepEqual(BETWEEN.map(at).map(even), [101, 102, 103, 100.5, 111.25]);
// A place that the ground does not cover is no height, on any of its four sides - but one that
// lies a hair off it, which is read at its edge. And a cell that holds no height gives none.
const OFF = [5.2, 10.5, 6.3, 10.5, 5.5, 10.2, 5.5, 10.8, 5.249, 10.25, Number.NaN, 10.5];
for (const place of rowsOf(OFF)) assert.throws(() => at(place), RangeError, `${place}`);
const HAIR = [5.25 - 1e-9, 10.25 - 1e-9, 6.25 + 1e-9, 10.75 + 1e-9];
assert.deepEqual(rowsOf(HAIR).map(at), [ODD[0], ODD[5]]);
const holed = (heightsM) => () => heightAt({ ...SMALL, heightsM }, [5.5, 10.5]);
assert.throws(holed([ODD.slice(0, 3), [104, Number.NaN, 120]]), RangeError);
assert.throws(holed([[Number.NaN, 102, 110], ODD.slice(3)]), RangeError);
assert.throws(holed([ODD.slice(0, 3), [104]]), RangeError);
assert.throws(holed([ODD.slice(0, 3)]), RangeError);
assert.throws(holed([[100, '102', 110], ODD.slice(3)]), RangeError);
// And a plot on ground that does not cover its paper is none: it throws.
const short = groundOf(paperOf(PENTAGON, 0, 2).box, SLOPE);
const order = { name: 'None', corners: PENTAGON, side: 0, aroundM: 5, on: ['photo'], day: DAY };
assert.throws(() => plotOf({ ...order, ground: short }), RangeError);

// The fall of a plane, by hand: one that falls 0.1 m a metre down x and rises 0.02 m a metre
// down y - a row is half a metre down y, and a column half a metre down x. And of six heights.
const plane = (downX, downY, lines = 5, columns = 9) =>
  Array.from({ length: lines }, (_, r) =>
    Array.from({ length: columns }, (__, c) => 500 - downX * 0.5 * c + downY * 0.5 * r),
  );
const fell = fallOf(plane(0.1, -0.02));
assert.ok(Math.abs(fell.downX - 0.1) < 1e-12 && Math.abs(fell.downY + 0.02) < 1e-12);
const stepped = fallOf(rowsOf([3, 3, 0, 3, 0, 0], 3));
assert.ok(Math.abs(stepped.downX - 3) < 1e-12 && Math.abs(stepped.downY + 2) < 1e-12);
// Which way x runs: the way that the ground falls most, of along the side, to its right - which
// is down -y - back along it and to its left. Of two that fall alike, the first of that order:
// so along the side on dead flat ground - a micrometre in a kilometre is alike, and more is a
// fall. A row: the fall down x, the fall down y, and the way.
const MOST = [0.1, 0.02, 0, 0.02, -0.1, 1, -0.1, 0.02, 2, 0.02, 0.1, 3];
const ALIKE = [0.1, -0.1, 0, -0.1, -0.1, 1, -0.1, 0.1, 2, 0.1, 0.1, 0];
const FLAT = [0, 0, 0, -1e-12, 1e-12, 0, 1e-12, -3e-12, 0, 0, 1e-9, 0, 0, 2e-9, 3];
for (const [downX, downY, way] of rowsOf([...MOST, ...ALIKE, ...FLAT], 3)) {
  assert.equal(quarterOf({ downX, downY }), way, `down x ${downX}, down y ${downY}`);
}
assert.equal(quarterOf(fallOf(plane(0.05, -0.05, 41, 41))), 0, 'a plane that falls askew: alike');
assert.equal(made(PENTAGON, level(431.7)).site.bearingDeg, 36.8699, 'dead flat, off a whole metre');

// The standing paper: from a storey under the base to a house over the highest ground, up to a
// whole metre. A height is taken to the centimetre first, and the base and the top are read
// off that: ground at a whole metre, or a tenth of a millimetre beside one, has its base there
// and every height nought; a centimetre beside it, a metre more; a millimetre under the sea, a
// base of plain nought. A row: the ground, the base, every height, and the standing paper.
assert.deepEqual([UNDER_M, OVER_M], [3, 16]);
const STANDING = [560, 560, 0, 557, 576, 559.9999, 560, 0, 557, 576, 560.0001, 560, 0, 557, 576];
STANDING.push(560.01, 560, 1, 557, 577, 559.99, 559, 99, 556, 576, -0.001, 0, 0, -3, 16);
for (const [metres, baseM, height, from, to] of rowsOf(STANDING, 5)) {
  const { ground, sideM } = made(RECTANGLE, level(metres)).site;
  assert.deepEqual([ground.baseM, sideM], [baseM, [from, to]], `${metres} m`);
  assert.deepEqual([...new Set(ground.rowsCm.join(' ').split(' '))], [String(height)]);
}
// Ground too steep for the pad: the pentagon on ground that falls 24.55 m a metre along its
// first side, from 1622.75 m to 640.75 m - and with 24.5 m a metre, the 1000 m that it takes.
const steep = (by) => (east, north) => 1500 - by * (0.6 * (east - 20) + 0.8 * (north - 10));
const STEEP =
  'Its standing paper would be 1002 m high, from 637 m to 1639 m above sea level, and the pad takes 1000 m: the ground is too steep for it.';
assert.deepEqual(made(PENTAGON, steep(24.55)), { refused: STEEP });
assert.deepEqual(made(PENTAGON, steep(24.5)).site.sideM, [639, 1639]);
// What the paper refuses, the plot refuses in its sentence - and reads no ground: none is there.
const bow = corners(10, 10, 34, 10, 10, 26, 34, 26);
const long = corners(0, 0, 991, 0, 991, 20, 0, 20);
const LARGE =
  'Its paper would be 1001 m by 30 m, and the pad takes 1000 m each way: mark a smaller plot, or less ground around it.';
assert.deepEqual(plotOf({ ...order, corners: bow }), { refused: 'Its outline crosses itself.' });
assert.deepEqual(plotOf({ ...order, corners: long }), { refused: LARGE });

// What the file says for good, to the letter (rule 6): for each of the three that the corners
// can be marked on, the credit and the sources - a tile a line, of two years, in the ground's
// order - with the day that was handed over, and the frame as the file has it.
const TILES = [{ name: 'swissalti3d_2021_2599-1200', year: 2021 }, TILE];
const ON = [['cadastral'], ['photo'], ['cadastral', 'photo']];
const CREDITS = [
  'Outline: marked by hand on the cadastral map, no survey. Ground: swissALTI3D. © swisstopo, © Cadastral Surveying Switzerland / FL',
  'Outline: marked by hand on the aerial photo, no survey. Ground: swissALTI3D. © swisstopo',
  'Outline: marked by hand on the cadastral map and the aerial photo, no survey. Ground: swissALTI3D. © swisstopo, © Cadastral Surveying Switzerland / FL',
];
const OUTLINED = [
  'Outline: marked by hand on the cadastral map, on 2026-10-13. No survey: a corner is good to a few decimetres, and is no boundary of the land register. © swisstopo, © Cadastral Surveying Switzerland / FL',
  'Outline: marked by hand on the aerial photo, on 2026-10-13. No survey: a corner is good to a few decimetres, and is no boundary of the land register. © swisstopo',
  'Outline: marked by hand on the cadastral map and the aerial photo, on 2026-10-13. No survey: a corner is good to a few decimetres, and is no boundary of the land register. © swisstopo, © Cadastral Surveying Switzerland / FL',
];
const GROUND = [
  'Ground: swissALTI3D of swisstopo, the tile swissalti3d_2021_2599-1200 in its state of 2021, read on 2026-10-13: a height every 0.5 m, read between the four cells around it, in whole centimetres. © swisstopo',
  'Ground: swissALTI3D of swisstopo, the tile swissalti3d_2025_2600-1200 in its state of 2025, read on 2026-10-13: a height every 0.5 m, read between the four cells around it, in whole centimetres. © swisstopo',
];
const FRAME =
  'Frame: x = 0, y = 0 lies at E 2600020.00, N 1200010.00 in LV95; x runs at 36.8699 degrees from north, clockwise, and y to its left. Heights are metres above sea level, LN02.';
ON.forEach((on, which) => {
  const { credit, sources } = made(PENTAGON, SLOPE, 5, 0, { on, tiles: TILES }).site;
  assert.deepEqual([credit, sources], [CREDITS[which], [OUTLINED[which], ...GROUND, FRAME]]);
});
assert.deepEqual([one.credit, one.sources], [CREDITS[0], [OUTLINED[0], GROUND[1], FRAME]]);
const later = made(CLICKED, SLOPE, 5, 0, { on: ['photo'], day: '2027-02-28' }).site.sources;
assert.deepEqual(later, [
  OUTLINED[1].replace(DAY, '2027-02-28'),
  GROUND[1].replace(DAY, '2027-02-28'),
  'Frame: x = 0, y = 0 lies at E 2600003.14, N 1200002.72 in LV95; x runs at 62.7097 degrees from north, clockwise, and y to its left. Heights are metres above sea level, LN02.',
]);
assert.ok(seven.sources[2].includes('E 2600034.00, N 1200010.00 in LV95; x runs at 90 degrees'));

process.stdout.write(
  'tools/sketch/new-plot: eight made-up plots come out as a hand works them out - y to the left of x, x down the ground - and each is a plot that the one writer takes\n',
);
