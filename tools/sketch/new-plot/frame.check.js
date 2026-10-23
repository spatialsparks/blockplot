// The check of the paper of corners (ST-031, rule 7): frame.js by hand, with nothing running and
// no file read. The side that a paper lies along; of the card's eight hand cases every figure
// that the paper alone gives - the bearing, the origin, the outline, the paper, the area - with
// the way that x runs said by hand, for the ground says it in plot.check.js; where a frame lies
// on the map; the four quarters of one plot, which are one sheet of ground; and what is refused,
// each in its sentence, typed in, and the first that holds. All of it lies at the origin of the
// Swiss grid, and is no plot that exists. Run by check.js, as every check is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { CELL_M, isLV95, longest, onMap, paperOf } from './frame.js';
import { PAPER_MAX_M } from './request.js';

const [E0, N0] = [2_600_000, 1_200_000];
/** Places of a flat list of figures, two a place. */
const pairs = (figures) =>
  Array.from({ length: figures.length / 2 }, (_, at) => [figures[2 * at], figures[2 * at + 1]]);
/** Corners in LV95: so many metres east and north of the origin, two figures a corner. */
const corners = (...metres) => pairs(metres).map(([east, north]) => [E0 + east, N0 + north]);
/** A place to the millimetre - and a place of LV95 so, in metres from the origin. */
const toMm = (place) => place.map((metres) => Math.round(metres * 1000) / 1000 + 0);
const mm = ([east, north]) => toMm([east - E0, north - N0]);
/** A paper in cells, along x and along y. */
const cells = ({ xFromM, xToM, yFromM, yToM }) => [xToM - xFromM, yToM - yFromM].map((m) => m * 2);
assert.equal(CELL_M, 0.5);

// The pentagon: its first side runs 3 east for 4 north, and is the longest, 30 m. The rectangle,
// 24 m east by 16 m north. And corners as a click gives them, with what they are taken as.
const PENTAGON = corners(20, 10, 38, 34, 28.4, 41.2, 10, 30, 4, 22);
const RECTANGLE = corners(10, 10, 34, 10, 34, 26, 10, 26);
const CLICKED = corners(3.14159, 2.71828, 31.4, 17.3, 22.25, 40.05, -4.2, 25.9);
const TAKEN = corners(3.14, 2.72, 31.4, 17.3, 22.25, 40.05, -4.2, 25.9);

// The longest side, and of the longest the first: the rectangle has two of 24 m. A side runs
// from its corner to the next, the last one back to the first; and it is as long as it is to
// the centimetre, as a corner is taken - a side that is 4 mm longer is no longer.
assert.equal(longest(PENTAGON), 0);
assert.equal(longest(RECTANGLE), 0, 'of two sides alike, the first');
assert.equal(longest(corners(10, 10, 10, 26, 34, 26, 34, 10)), 1);
assert.equal(longest(corners(0, 0, 3, 0, 3, 4)), 2, 'the side from the last corner to the first');
assert.equal(longest(corners(0, 0, 10, 0, 10, 10.004, 0, 10)), 0, 'alike to the centimetre');
assert.equal(longest(corners(0, 0, 10, 0, 10, 10.01, 0, 10)), 1);
assert.equal(
  longest(corners(0, 0, 7, 7, 7, -5)),
  1,
  'as the crow flies: 12 m, where askew is 9.9 m',
);
assert.equal(longest(CLICKED), 0);

// The eight cases, as far as the paper gives them. A row: the corners, the side, the ground
// around, the quarter by hand; then the bearing, the origin, the paper and the area - and in the
// lists after it the outline, and the paper in cells. Case 5 is the paper of case 1.
const CASES = [
  [PENTAGON, 0, 5, 0, 36.8699, [20, 10], [-5, 35, -5, 25], 520],
  [PENTAGON, 0, 5, 3, 306.8699, [20, 10], [-5, 25, -35, 5], 520],
  [RECTANGLE, 0, 5, 0, 90, [10, 10], [-5, 29, -5, 21], 384],
  [PENTAGON, 0, 5, 1, 126.8699, [20, 10], [-25, 5, -5, 35], 520],
  [PENTAGON, 0, 5, 0, 36.8699, [20, 10], [-5, 35, -5, 25], 520],
  [RECTANGLE, 0, 0, 0, 90, [10, 10], [0, 24, 0, 16], 384],
  [RECTANGLE, 1, 2.5, 1, 90, [34, 10], [-26.5, 2.5, -2.5, 18.5], 384],
  [CLICKED, 0, 5, 0, 62.7097, [3.14, 2.72], [-5, 39.5, -5, 29.5], 746.638],
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
const CELLS = pairs([80, 60, 60, 80, 68, 52, 60, 80, 80, 60, 48, 32, 58, 42, 89, 69]);
CASES.forEach(([marked, side, aroundM, quarter, bearingDeg, origin, paper, areaM2], at) => {
  const made = paperOf(marked, side, aroundM, quarter);
  const which = `case ${at + 1}`;
  assert.equal(made.refused, undefined, which);
  assert.equal(made.bearingDeg, bearingDeg, which);
  assert.deepEqual(mm(made.origin), origin, which);
  // Every nought of it is a plain nought: a strict comparison tells one with a minus before it.
  assert.deepEqual(made.outline, pairs(OUTLINES[at]), which);
  assert.deepEqual([made.xFromM, made.xToM, made.yFromM, made.yToM], paper, which);
  assert.deepEqual(cells(made), CELLS[at], which);
  assert.equal(made.areaM2.toFixed(3), areaM2.toFixed(3), which);
  // The corners as they were taken, to the centimetre, and the origin the first of the side.
  assert.deepEqual(made.corners, marked === CLICKED ? TAKEN : marked, which);
  assert.deepEqual(made.origin, made.corners[side], which);
});

// Case 1, and what it is there for. A mirrored plot - y to the right of x - says [30, -12] for
// its third corner; a turned one a bearing of 126.8699 and a paper of 60 by 80 cells.
const first = paperOf(PENTAGON, 0, 5);
assert.deepEqual(first.outline[2], [30, 12], 'y runs to the left of x: mirrored, it is [30, -12]');
assert.equal(first.bearingDeg, 36.8699, 'x runs along the side: turned, it is 126.8699');
assert.deepEqual(cells(first), [80, 60], 'turned, the paper is 60 by 80 cells');
// Its sheet: the paper's four corners in LV95, round the paper from where x and y are least -
// anticlockwise on the map - and the box that holds them and no more, to the millimetre: metres
// under the names that the reader of the ground takes a box by.
assert.deepEqual(first.sheet.map(mm), pairs([21, 3, 45, 35, 21, 53, -3, 21]));
const { minE, maxE, minN, maxN } = first.box;
assert.deepEqual([mm([minE, minN]), mm([maxE, maxN])], pairs([-3, 3, 45, 53]));
assert.deepEqual(Object.keys(first.box), ['minE', 'maxE', 'minN', 'maxN']);
const [easts, norths] = [0, 1].map((axis) => first.sheet.map((corner) => corner[axis]));
assert.deepEqual([minE, maxE], [Math.min(...easts), Math.max(...easts)]);
assert.deepEqual([minN, maxN], [Math.min(...norths), Math.max(...norths)]);
// The box lies on no whole metres, by a micrometre: the bearing is written 0.0000024 degrees
// over the side's own, and that turns each corner about the origin by its lever - 11 m, 25 m
// and twice 1 m back.
const over = ((36.8699 - (Math.atan2(3, 4) * 180) / Math.PI) * Math.PI) / 180;
const beside = [minE - (E0 - 3), maxE - (E0 + 45), minN - (N0 + 3), maxN - (N0 + 53)];
[11, 25, -1, -1].forEach((lever, at) => {
  assert.ok(Math.abs(beside[at] - lever * over) < 1e-9, `${beside[at]} m beside a whole metre`);
});
assert.equal((beside[1] * 1e6).toFixed(2), '1.03', 'a micrometre, and no more');
// Case 8: the area is the outline's as it is rounded, to the millimetre - the corners as they
// were marked enclose 746.647 m².
assert.equal(paperOf(CLICKED, 0, 5).areaM2.toFixed(3), '746.638');
// A side that runs due north: a bearing of nought. One that runs a hair west of north: a
// bearing of four decimals, under 360 - and half a turn on, to the last figure.
assert.equal(paperOf(RECTANGLE, 1, 2.5).bearingDeg, 0);
assert.deepEqual(paperOf(RECTANGLE, 1, 2.5).outline, pairs([0, 24, 0, 0, 16, 0, 16, 24]));
assert.equal(paperOf(RECTANGLE, 3, 2.5).bearingDeg, 180);
assert.equal(paperOf(corners(0, 0, -0.01, 100, -50, 50), 0, 0).bearingDeg, 359.9943);
assert.equal(paperOf(corners(0, 0, -0.01, 100, -50, 50), 0, 0, 2).bearingDeg, 179.9943);

// Where a frame lies on the map: x along (sin b, cos b), and y to its left. With x due east, y
// runs north; with x due north, west. And the pentagon's corners, each from its place in the
// frame back to where it was marked.
const lies = (origin, bearingDeg, place) => toMm(onMap({ origin, bearingDeg })(place));
assert.deepEqual(lies([0, 0], 90, [2, 0]), [2, 0]);
assert.deepEqual(lies([0, 0], 90, [0, 2]), [0, 2], 'y to the left of x: mirrored, it is [0, -2]');
assert.deepEqual(lies([0, 0], 0, [2, 0]), [0, 2]);
assert.deepEqual(lies([0, 0], 0, [0, 2]), [-2, 0]);
assert.deepEqual(lies([7, -3], 180, [2, 1]), [8, -5]);
assert.deepEqual(mm(onMap(first)([30, 12])), [28.4, 41.2], 'mirrored, it lies at [47.6, 26.8]');
first.outline.forEach((place, at) => assert.deepEqual(mm(onMap(first)(place)), mm(PENTAGON[at])));
// A place of LV95: the grid's zero and swisstopo's worked example are; LV03's six figures, one
// figure, one that is none, a text and an east a figure too long are not.
assert.equal(isLV95([E0, N0]) && isLV95([2_700_000, 1_100_000]), true);
const NOT_LV95 = [[600_000, 200_000], [E0], [E0, NaN], [String(E0), N0], [3_000_000, N0]];
for (const place of NOT_LV95) assert.equal(isLV95(place), false, JSON.stringify(place));

// The four quarters of a plot: each bearing a quarter on, and one sheet of ground - of the
// pentagon, and of the corners that a click gives, whose paper ends on no corner. A quarter on,
// x is what -y was and y what x was; the sheet begins a corner back, and its four corners are
// the same places, but for the last figure of a sum.
const HAIR_M = 1e-6;
const QUARTERS = [
  [PENTAGON, [36.8699, 126.8699, 216.8699, 306.8699], [-35, 5, -25, 5], 520],
  [CLICKED, [62.7097, 152.7097, 242.7097, 332.7097], [-39.5, 5, -29.5, 5], 746.638],
];
for (const [marked, bearings, halfTurned, areaM2] of QUARTERS) {
  const turned = [0, 1, 2, 3].map((quarter) => paperOf(marked, 0, 5, quarter));
  const [along] = turned;
  assert.deepEqual(
    turned.map((paper) => paper.bearingDeg),
    bearings,
  );
  assert.deepEqual(
    [turned[2].xFromM, turned[2].xToM, turned[2].yFromM, turned[2].yToM],
    halfTurned,
  );
  turned.forEach((paper, quarter) => {
    const before = turned[(quarter + 3) % 4];
    const quarterOn = before.outline.map(([x, y]) => [0 - y, x]);
    assert.deepEqual(paper.outline, quarterOn, `quarter ${quarter}`);
    const spans = [0 - before.yToM, 0 - before.yFromM, before.xFromM, before.xToM];
    assert.deepEqual([paper.xFromM, paper.xToM, paper.yFromM, paper.yToM], spans);
    paper.sheet.forEach((corner, at) => {
      const same = along.sheet[(at + 4 - quarter) % 4];
      const apart = Math.hypot(corner[0] - same[0], corner[1] - same[1]);
      assert.ok(apart < HAIR_M, `quarter ${quarter}, corner ${at}: ${apart} m apart`);
    });
    for (const edge of ['minE', 'maxE', 'minN', 'maxN']) {
      assert.ok(
        Math.abs(paper.box[edge] - along.box[edge]) < HAIR_M,
        `quarter ${quarter}: ${edge}`,
      );
    }
    assert.deepEqual([paper.origin, paper.corners], [along.origin, along.corners]);
    assert.ok(Math.abs(paper.areaM2 - along.areaM2) < 1e-9, `quarter ${quarter}`);
    assert.equal(paper.areaM2.toFixed(3), areaM2.toFixed(3), `quarter ${quarter}`);
  });
}

// What is refused, each in its sentence. Two corners that follow each other at one place - the
// last and the first too, and two that are a millimetre apart, which the centimetre makes one;
// a centimetre apart, they are two.
const refused = (marked, ...more) => paperOf(marked, 0, 5, ...more).refused;
const SAME = 'Two corners that follow each other lie at one place.';
assert.equal(refused(corners(0, 0, 10, 0, 10, 0, 5, 5)), SAME);
assert.equal(refused(corners(0, 0, 10, 0, 5, 5, 0, 0)), SAME, 'the last and the first');
assert.equal(refused(corners(0, 0, 10, 0, 10.001, 0, 5, 5)), SAME, 'a millimetre apart');
assert.equal(refused(corners(0, 0, 10, 0, 10.01, 0, 5, 5)), undefined, 'a centimetre apart');
assert.equal(refused(corners(0, 0, 0, 0)), SAME, 'two corners, and at one place');
// Corners that all lie on one line: three, and four, which enclose nothing - and fewer than
// three. A triangle with a fourth corner in the middle of one side is an outline.
const FLAT = 'Its outline encloses no area.';
assert.equal(refused(corners(0, 0, 5, 5, 10, 10)), FLAT);
assert.equal(refused(corners(0, 0, 5, 5, 10, 10, 2, 2)), FLAT);
assert.equal(refused(corners(0, 0, 3.33, 4.44, 6.66, 8.88)), FLAT, 'on a line, off the grid');
for (const few of [corners(0, 0, 10, 0), corners(0, 0), []]) assert.equal(refused(few), FLAT);
assert.equal(paperOf(corners(0, 0, 10, 0, 20, 0, 10, 10), 0, 5).areaM2, 100);
assert.equal(paperOf(corners(0, 0, 1, 0, 0, 1), 0, 5).areaM2, 0.5, 'half a square metre is one');
// An outline that crosses itself. The rectangle's corners in the order 1, 2, 4, 3, which
// enclose nothing by the sum that an area is worked out with; two sides that cross askew, of
// four corners and of eight. A side that lies back along the one before it, and the last back
// along the first: found by the corner that then lies on another side - as the first corner of
// a side does on the side before the last, and the second on the next side but one. A corner
// on a side further on; and two corners at one place that do not follow each other.
const CROSSES = 'Its outline crosses itself.';
assert.equal(
  refused(corners(10, 10, 34, 10, 10, 26, 34, 26)),
  CROSSES,
  'by the line, not the area',
);
assert.equal(refused(corners(0, 0, 10, 0, 2, 8, 9, 7)), CROSSES);
assert.equal(refused(corners(0, 0, 10, 0, 10, 4, 4, 4, 4, 2, 12, 2, 12, 8, 0, 8)), CROSSES);
assert.equal(refused(corners(0, 0, 10, 0, 5, 0, 5, 5)), CROSSES, 'back along the side before');
assert.equal(refused(corners(0, 0, 10, 0, 5, 5, 4, 0)), CROSSES, 'the last back along the first');
assert.equal(refused(corners(5, 0, 5, 5, 0, 0, 10, 0)), CROSSES, 'its first corner on a side');
assert.equal(refused(corners(5, 5, 5, 0, 10, 0, 0, 0)), CROSSES, 'its second corner on a side');
assert.equal(refused(corners(0, 0, 10, 0, 10, 10, 5, 0, 0, 10)), CROSSES, 'a corner on a side');
assert.equal(refused(corners(0, 0, 10, 0, 5, 5, 10, 10, 0, 10, 5, 5)), CROSSES, 'two at one place');
// And what is none: two sides on one line that do not touch, in outlines of eight corners that
// wind; a side that ends beside one that runs askew, in the box that holds it and off its
// line; and the pentagon the other way round.
assert.equal(refused(corners(0, 0, 10, 10, 0, 10, 2, 6)), undefined, 'beside a side askew');
assert.equal(refused(corners(0, 0, 10, 0, 10, 4, 4, 4, 4, 6, 10, 6, 10, 8, 0, 8)), undefined);
assert.equal(refused(corners(0, 0, 4, 0, 4, 4, 8, 4, 8, 0, 12, 0, 12, 8, 0, 8)), undefined);
assert.equal(refused(PENTAGON.toReversed()), undefined);
// The first that holds: at one place before on one line, on one line before crossing, and
// crossing before a paper that is too large.
assert.equal(refused(corners(0, 0, 0, 0, 5, 5)), SAME);
assert.equal(refused(corners(0, 0, 10, 0, 5, 0)), FLAT);
assert.equal(refused(corners(0, 0, 200, 0, 0, 200, 200, 200)), CROSSES);
// An outline that is none once it is taken to the millimetre: a needle of 120 m, a centimetre
// wide at its far end - its three corners lie on no one line, and its sides do not cross.
assert.equal(paperOf(corners(0, 0, 120, 0.01, 119.99, 0.01), 0, 0).refused, FLAT);

// A paper that is too large: a plot of 991 m by 20 m with 5 m around it - said along the side
// and across it, whatever the quarter and whichever side - and one of 990 m, which fits.
const long = (metres) => corners(0, 0, metres, 0, metres, 20, 0, 20);
const LARGE =
  'Its paper would be 1001 m by 30 m, and the pad takes 1000 m each way: mark a smaller plot, or less ground around it.';
const ACROSS = LARGE.replace('1001 m by 30 m', '30 m by 1001 m');
assert.equal(PAPER_MAX_M, 1000);
for (const quarter of [0, 1, 2, 3]) assert.equal(refused(long(991), quarter), LARGE);
for (const quarter of [0, 1, 2, 3]) assert.equal(paperOf(long(991), 1, 5, quarter).refused, ACROSS);
assert.equal(paperOf(corners(0, 0, 20, 0, 20, 991, 0, 991), 0, 5).refused, ACROSS);
assert.equal(refused(long(990.2)), LARGE.replace('1001 m', '1000.5 m'));
assert.deepEqual(cells(paperOf(long(990), 0, 5)), [2000, 60]);
assert.deepEqual(cells(paperOf(long(990), 0, 5, 3)), [60, 2000]);
assert.equal(paperOf(long(991), 0, 4.5).refused, undefined, 'with less ground around, it fits');

process.stdout.write(
  'tools/sketch/new-plot: a paper lies along its side, y to the left of x, one sheet of ground in all four quarters, and an outline that is none is refused in the first sentence that holds; a place of LV95 is told from one of LV03\n',
);
