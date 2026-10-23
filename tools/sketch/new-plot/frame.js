// The paper of corners (ST-031, rule 7), with nothing of the ground in it: of the corners of a
// plot in LV95, as they were marked on a map, the frame that the plot gets in the pad, its
// outline in that frame, and the paper that the pad shows of it. No network, no disk, no page and
// no clock: the map's page loads this module to show the paper as it will lie, and plot.js works
// a plot out of it. It imports request.js, for the sentences and the largest paper, and nothing
// else. frame.check.js proves it.
//
// The frame, as the pad has it. `bearingDeg` is the compass bearing that x runs at: from north,
// clockwise. y runs to the left of one who looks down x. So in LV95 x points along
// (sin b, cos b) - east, north - and y along (-cos b, sin b). On the paper of the top view x runs
// to the right and y up it, and north lies `bearingDeg` degrees anticlockwise of x.
import { PAPER_MAX_M, SAID } from './request.js';

// The pad's cell, half a metre: a paper is whole cells, and a plot's file says no other.
export const CELL_M = 0.5;
// How exactly a plot is taken, in parts of one. A corner to the centimetre: a click on a map is
// good to a few decimetres. A place of the frame to the millimetre. A bearing to four decimals
// of a degree, which leaves the far end of a side of 120 m a tenth of a millimetre off its line:
// in ten-thousandths of a degree a bearing is a whole number, and so is a quarter turn.
const CM = 100;
const MM = 1000;
const BEARING = 10_000;
const HALF_TURN_DEG = 180;
const QUARTER = 90 * BEARING;
const FULL_TURN = 360 * BEARING;

/**
 * Metres to the millimetre. A nought is a plain nought: a file holds none with a minus before
 * it, and a corner that stands on an axis of its frame lies a hair to one side of it.
 */
const toMm = (metres) => Math.round(metres * MM) / MM + 0;
/** Down to a whole cell, and up to one. */
const down = (metres) => Math.floor(metres / CELL_M) * CELL_M;
const up = (metres) => Math.ceil(metres / CELL_M) * CELL_M;
/** A place of LV95 in whole centimetres - what is asked of an outline is asked of whole numbers, and is exact - and back in metres. */
const inCm = ([east, north]) => [Math.round(east * CM), Math.round(north * CM)];
const inM = ([east, north]) => [east / CM, north / CM];

/**
 * Twice the area of three places, with its sign: over nought where `c` lies to the left of the
 * way from `a` to `b`, and nought where the three lie on one line.
 */
const turn = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
/** Whether `place`, which lies on the line through `a` and `b`, lies between the two. */
const within = (a, b, place) =>
  [0, 1].every((axis) => (place[axis] - a[axis]) * (place[axis] - b[axis]) <= 0);

/** Whether two sides that share no corner meet: they cross, or an end of one lies on the other. */
function meet(a, b, c, d) {
  const [ofA, ofB, ofC, ofD] = [turn(c, d, a), turn(c, d, b), turn(a, b, c), turn(a, b, d)];
  if (Math.sign(ofA) * Math.sign(ofB) < 0 && Math.sign(ofC) * Math.sign(ofD) < 0) return true;
  return (
    (ofA === 0 && within(c, d, a)) ||
    (ofB === 0 && within(c, d, b)) ||
    (ofC === 0 && within(a, b, c)) ||
    (ofD === 0 && within(a, b, d))
  );
}

/**
 * Whether an outline crosses itself: two sides that meet anywhere but at the corner they share,
 * or lie back along each other. It is asked of every two sides that do not follow each other -
 * and that finds two that do, and lie back along each other, as well: the far corner of the
 * shorter of them lies on the longer, and the other side at that corner does not follow the
 * longer one, in an outline of four corners or more. Three corners with two sides along each
 * other lie on one line, and are refused before this is asked.
 */
function crosses(corners) {
  const count = corners.length;
  const side = (at) => [corners[at], corners[(at + 1) % count]];
  for (let one = 0; one < count; one += 1) {
    // From the next side but one on - and, of the first side, not the last, which follows it.
    const sides = one === 0 ? count - 1 : count;
    for (let other = one + 2; other < sides; other += 1) {
      if (meet(...side(one), ...side(other))) return true;
    }
  }
  return false;
}

/**
 * Why corners, in whole centimetres, are no outline of a plot - the first of the three that
 * holds - or null: two that follow each other at one place, the last and the first too; all of
 * them on one line; an outline that crosses itself. On one line is asked of the line, and not of
 * the area: corners in the order of a bow enclose nothing by the sum that an area is worked out
 * with, and are refused as what they are, an outline that crosses itself.
 */
function unfit(corners) {
  const count = corners.length;
  const isAt = ([east, north], [east2, north2]) => east === east2 && north === north2;
  if (count > 1 && corners.some((corner, at) => isAt(corner, corners[(at + 1) % count]))) {
    return SAID.same;
  }
  if (count < 3 || corners.every((corner) => turn(corners[0], corners[1], corner) === 0)) {
    return SAID.flat;
  }
  return crosses(corners) ? SAID.crosses : null;
}

/**
 * The bearing of the way from one place to another, plus so many quarter turns - none to three:
 * degrees from north, clockwise, from 0 to under 360, to four decimals. It is rounded once, from
 * half a turn under north to half a turn over it, and turned as a whole number of
 * ten-thousandths: a quarter on is 90 on to the last figure, and no bearing comes to 360.
 */
function bearingOf(from, to, quarter) {
  const degrees = (Math.atan2(to[0] - from[0], to[1] - from[1]) * HALF_TURN_DEG) / Math.PI;
  const turned = Math.round(degrees * BEARING) + quarter * QUARTER;
  return ((turned + FULL_TURN) % FULL_TURN) / BEARING;
}

/** The two axes of a frame in LV95, each `[east, north]`, of the bearing as it is written: the frame is what the file says. */
function axes(bearingDeg) {
  const angle = (bearingDeg * Math.PI) / HALF_TURN_DEG;
  const [east, north] = [Math.sin(angle), Math.cos(angle)];
  return { x: [east, north], y: [-north, east] };
}

/** The corners in a frame - its nought at `first`, both in whole centimetres - each to the millimetre. */
function outlined(corners, first, { x, y }) {
  return corners.map(([east, north]) => {
    const [byEast, byNorth] = [(east - first[0]) / CM, (north - first[1]) / CM];
    const [alongX, alongY] = [byEast * x[0] + byNorth * x[1], byEast * y[0] + byNorth * y[1]];
    return [toMm(alongX), toMm(alongY)];
  });
}

/** The area that an outline encloses, in square metres: the sum that `areaOf` of plot-file.js works it out with. */
export function enclosed(outline) {
  const twice = outline.reduce((sum, [x, y], at) => {
    const [x2, y2] = outline[(at + 1) % outline.length];
    return sum + x * y2 - x2 * y;
  }, 0);
  return Math.abs(twice) / 2;
}

/**
 * A paper along one axis: from the smallest of the figures less the ground around, down to a
 * whole cell, to the largest plus it, up to one. The first is nought or under it and the second
 * nought or over it, for the frame's nought is a corner: so an edge at nought is a plain nought.
 */
const span = (figures, aroundM) => [
  down(Math.min(...figures) - aroundM),
  up(Math.max(...figures) + aroundM),
];

/**
 * The box of LV95 that holds places, in metres: `{ minE, maxE, minN, maxN }`, as the reader of
 * the ground takes a box (`swisstopo/grid.js`) - metres by other names than cells have.
 */
function holding(places) {
  const [easts, norths] = [0, 1].map((axis) => places.map((place) => place[axis]));
  return {
    minE: Math.min(...easts),
    maxE: Math.max(...easts),
    minN: Math.min(...norths),
    maxN: Math.max(...norths),
  };
}

/**
 * The side that the paper lies along where none was picked: the longest - side `at` runs from
 * corner `at` to the next - and of the longest the first. The corners are taken to the
 * centimetre, as `paperOf` takes them: two sides are alike where they are alike to that.
 */
export function longest(corners) {
  const taken = corners.map(inCm);
  const squared = taken.map(([east, north], at) => {
    const [east2, north2] = taken[(at + 1) % taken.length];
    return (east2 - east) ** 2 + (north2 - north) ** 2;
  });
  return squared.indexOf(Math.max(...squared));
}

/**
 * Where the places of a frame lie on the map. Of a frame - `origin`, its nought in LV95, and
 * `bearingDeg`, as a paper of `paperOf` has both - what gives of `[x, y]`, metres in the frame,
 * the place `[east, north]` in LV95.
 */
export function onMap({ origin, bearingDeg }) {
  const { x, y } = axes(bearingDeg);
  return ([alongX, alongY]) => [
    origin[0] + alongX * x[0] + alongY * y[0],
    origin[1] + alongX * x[1] + alongY * y[1],
  ];
}

/**
 * Whether `place` is a place of LV95: `[east, north]`, two finite numbers of its figures - an
 * east from 2 000 000 to under 3 000 000, a north from 1 000 000 to under 2 000 000. LV03's
 * figures have six digits, and are none.
 */
export function isLV95(place) {
  if (!Array.isArray(place) || place.length !== 2 || !place.every(Number.isFinite)) return false;
  const [east, north] = place;
  return east >= 2_000_000 && east < 3_000_000 && north >= 1_000_000 && north < 2_000_000;
}

/**
 * The frame and the paper of corners - or `{ refused }`, one sentence of `SAID`. `corners` are
 * places of LV95, `[east, north]`, in the order they were marked; `side` is the corner at which
 * the side begins that the paper lies along; `aroundM` the ground around the plot; `quarter`
 * which way x runs: 0 along the side as it was marked, 1 to its right, 2 back along it, 3 to
 * its left. By this rule, and in this order:
 *
 * - A corner is taken to the centimetre. Then refused, the first that holds: `same`, `flat`,
 *   `crosses` (`unfit`).
 * - The frame's origin is the first corner of the side, so the side lies along a line of the
 *   paper's grid. Its bearing is the side's own - from its first corner to its second - plus
 *   `quarter` quarter turns, to four decimals; the axes are worked out of the bearing so written.
 * - The outline: each corner in the frame, to the millimetre. One that the millimetre leaves no
 *   area is refused with `flat` too: a plot's file takes none.
 * - The paper: whole cells that hold the outline and the ground around it. Refused with `large`
 *   where it is longer than `PAPER_MAX_M` either way - said along the side and across it,
 *   whatever the quarter.
 *
 * What it gives: `origin` and `bearingDeg`, the frame; `corners`, as they were taken; `outline`;
 * `xFromM`, `xToM`, `yFromM`, `yToM`, the paper; `sheet`, the paper's four corners in LV95, one
 * after the other round the paper - anticlockwise on the map, from the corner where x and y are
 * least; `box`, the box of LV95 that holds those four, `{ minE, maxE, minN, maxN }` in metres:
 * what the ground is asked for - on no whole metres where the paper lies askew; and `areaM2`,
 * the area that the outline encloses, worked out of the outline as it is rounded - the area that
 * the plot's file has. The paper is one sheet of ground whichever way x runs: a quarter on, the
 * sheet begins a corner back.
 */
export function paperOf(corners, side, aroundM, quarter = 0) {
  const taken = corners.map(inCm);
  const refused = unfit(taken);
  if (refused !== null) return { refused };
  const [first, second] = [taken[side], taken[(side + 1) % taken.length]];
  const bearingDeg = bearingOf(first, second, quarter);
  const outline = outlined(taken, first, axes(bearingDeg));
  const areaM2 = enclosed(outline);
  if (!(areaM2 > 0)) return { refused: SAID.flat };
  const [xs, ys] = [0, 1].map((axis) => outline.map((place) => place[axis]));
  const [[xFromM, xToM], [yFromM, yToM]] = [span(xs, aroundM), span(ys, aroundM)];
  const long = [xToM - xFromM, yToM - yFromM];
  if (Math.max(...long) > PAPER_MAX_M) {
    // Along the side and across it: with x across the side, the other way round.
    const [alongM, acrossM] = quarter % 2 === 0 ? long : [long[1], long[0]];
    return { refused: SAID.large(alongM, acrossM) };
  }
  const origin = inM(first);
  const sheet = [
    [xFromM, yFromM],
    [xToM, yFromM],
    [xToM, yToM],
    [xFromM, yToM],
  ].map(onMap({ origin, bearingDeg }));
  const frame = { origin, bearingDeg, corners: taken.map(inM), outline };
  return { ...frame, xFromM, xToM, yFromM, yToM, sheet, box: holding(sheet), areaM2 };
}
