// The check of the lines at a boundary distance (distances/lines.js; story ST-036, rules 1 and 2).
// First a proof of the two rules, which shares nothing with lines.js but the distance to a side:
// rule 1, each piece walked every centimetre lies inside the outline and at the distance within
// 2 cm; rule 2, wherever a grid of probes every 5 cm crosses the distance, the crossing lies
// within 2 cm of a piece; and every piece is closed. Then the hand cases, each worked out by hand
// below: the made-up plot at 4 m and 7.5 m, either winding, too far for any line, an inward corner
// and a notch, a plot with a waist, a corner that does not turn and a corner given twice. Made-up
// outlines alone: nothing of the real site, no page, no browser.
// Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/distances/lines.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

await import('./lines.js');
const { distanceLines } = globalThis;

// The story's 2 cm; the card's 1 mm of a corner, and 2 mm of a place on an arc drawn in chords.
const TOLERANCE_M = 0.02;
const CORNER_M = 0.001;
const ON_ARC_M = 0.002;
const WALK_M = 0.01;
const PROBE_M = 0.05;

// --- the proof, of its own ------------------------------------------------------------------
const sidesOf = (outline) =>
  outline.map((corner, index) => [corner, outline[(index + 1) % outline.length]]);
/** The distance from a place to a side - a side of no length too. */
function toSide([px, py], [[ax, ay], [bx, by]]) {
  const [dx, dy] = [bx - ax, by - ay];
  const squared = dx * dx + dy * dy;
  const t =
    squared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / squared));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
const far = (sides, place) => Math.min(...sides.map((side) => toSide(place, side)));
/** Whether a place lies inside: a ray along its row crosses an odd number of sides. */
function within(sides, [x, y]) {
  let inside = false;
  for (const [[x1, y1], [x2, y2]] of sides) {
    if (y1 > y !== y2 > y && x < x1 + ((y - y1) * (x2 - x1)) / (y2 - y1)) inside = !inside;
  }
  return inside;
}
const segmentsOf = (pieces) =>
  pieces.flatMap((piece) => piece.slice(1).map((q, i) => [piece[i], q]));

/** Rule 1: every piece walked every centimetre - inside the outline, and at the distance. */
function ruleOne(sides, pieces, d, name) {
  for (const [p, q] of segmentsOf(pieces)) {
    const steps = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / WALK_M));
    for (let k = 0; k <= steps; k += 1) {
      const place = [p[0] + ((q[0] - p[0]) * k) / steps, p[1] + ((q[1] - p[1]) * k) / steps];
      assert.ok(within(sides, place), `${name}: a point of a line lies outside the plot`);
      const off = Math.abs(far(sides, place) - d);
      assert.ok(off <= TOLERANCE_M, `${name}: a point of a line is ${off} m off the distance`);
    }
  }
}

/** Rule 2: wherever the distance is crossed between two probes, the crossing lies on a piece. */
function ruleTwo(sides, outline, pieces, d, name) {
  const xs = outline.map(([x]) => x);
  const ys = outline.map(([, y]) => y);
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const [nx, ny] = [Math.max(...xs) - x0, Math.max(...ys) - y0].map(
    (m) => Math.ceil(m / PROBE_M) + 1,
  );
  const g = (p) => (within(sides, p) ? far(sides, p) - d : -far(sides, p) - d);
  const field = new Float64Array(nx * ny);
  const probe = (i, j) => [x0 + i * PROBE_M, y0 + j * PROBE_M];
  for (let j = 0; j < ny; j += 1)
    for (let i = 0; i < nx; i += 1) field[j * nx + i] = g(probe(i, j));
  const segments = segmentsOf(pieces);
  const onLine = (p) => Math.min(Infinity, ...segments.map((s) => toSide(p, s)));
  const cross = (a, b) => {
    let [lo, hi] = [a, b];
    const loBelow = g(lo) < 0;
    for (let k = 0; k < 50; k += 1) {
      const mid = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2];
      if (g(mid) < 0 === loBelow) lo = mid;
      else hi = mid;
    }
    const off = onLine(lo);
    assert.ok(off <= TOLERANCE_M, `${name}: a place at the distance lies ${off} m from every line`);
  };
  for (let j = 0; j < ny; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      const below = field[j * nx + i] < 0;
      if (i + 1 < nx && below !== field[j * nx + i + 1] < 0) cross(probe(i, j), probe(i + 1, j));
      if (j + 1 < ny && below !== field[(j + 1) * nx + i] < 0) cross(probe(i, j), probe(i, j + 1));
    }
  }
}

/** The lines of an outline at a distance, held to both rules and closed; and how many pieces. */
function proven(outline, d, count, name) {
  const pieces = distanceLines.at(outline, d);
  assert.equal(pieces.length, count, `${name}: ${pieces.length} pieces, not ${count}`);
  for (const piece of pieces) {
    assert.ok(piece.length >= 4, `${name}: a piece of fewer than three points`);
    assert.deepEqual(piece.at(-1), piece[0], `${name}: a piece is not closed`);
  }
  const sides = sidesOf(outline);
  ruleOne(sides, pieces, d, name);
  ruleTwo(sides, outline, pieces, d, name);
  return pieces;
}

const nearest = (pieces, [x, y]) =>
  Math.min(...pieces.flat().map(([px, py]) => Math.hypot(px - x, py - y)));
/** Each corner within 1 mm of a point of the pieces. */
function cornersOn(pieces, corners, name) {
  for (const corner of corners) {
    const off = nearest(pieces, corner);
    assert.ok(off <= CORNER_M, `${name}: the corner ${corner} lies ${off} m from every point`);
  }
}

// --- the made-up plot --------------------------------------------------------------------------
// tools/sketch/example/plot.json: the rectangle 2..36 x 3..23 with two corners cut, wound
// clockwise. The cut sides: (2,6)-(12,3), on 3x + 10y = 66, its normal of length sqrt(109); and
// (36,9)-(29,3), on 6x - 7y = 153, its normal of length sqrt(85). Moved in by d, each lies on
// 3x + 10y = 66 + d sqrt(109) and 6x - 7y = 153 - d sqrt(85).
const MADE_UP = [
  [2, 6],
  [2, 23],
  [36, 23],
  [36, 9],
  [29, 3],
  [12, 3],
];
// At 4 m: the rectangle moved in by 4 is 6..32 x 7..19. x = 6 on 3x + 10y = 66 + 41.761 gives
// y = 8.976; y = 7 gives x = 12.587. x = 32 on 6x - 7y = 153 - 36.878 gives y = 10.840; y = 7
// gives x = 27.520.
const AT_4 = [
  [6, 8.976],
  [6, 19],
  [32, 19],
  [32, 10.84],
  [27.52, 7],
  [12.587, 7],
];
// At 7.5 m: 9.5..28.5 x 10.5..15.5. x = 9.5 on 3x + 10y = 66 + 78.302 gives y = 11.580; y = 10.5
// gives x = 13.101. x = 28.5 on 6x - 7y = 153 - 69.147 gives y = 12.450; y = 10.5 gives x = 26.226.
const AT_7_5 = [
  [9.5, 11.58],
  [9.5, 15.5],
  [28.5, 15.5],
  [28.5, 12.45],
  [26.226, 10.5],
  [13.101, 10.5],
];
const at4 = proven(MADE_UP, 4, 1, 'the made-up plot at 4 m');
cornersOn(at4, AT_4, 'the made-up plot at 4 m');
assert.equal(at4[0].length, 7, 'the made-up plot at 4 m: six corners, and the first again');
cornersOn(
  proven(MADE_UP, 7.5, 1, 'the made-up plot at 7.5 m'),
  AT_7_5,
  'the made-up plot at 7.5 m',
);

// Either winding: turned round, anticlockwise, the same line.
const TURNED = [...MADE_UP].reverse();
cornersOn(
  proven(TURNED, 4, 1, 'the made-up plot turned round'),
  AT_4,
  'the made-up plot turned round',
);

// No line: the plot is 20 m across, so no place lies more than 10 m from its outline.
proven(MADE_UP, 10.5, 0, 'the made-up plot at 10.5 m');
proven(MADE_UP, 30, 0, 'the made-up plot at 30 m');

// --- an inward corner and a notch --------------------------------------------------------------
// An L, anticlockwise, with a notch 2 m wide and 5 m deep in its foot (x 10..12, y 0..5). At 4 m
// the foot's line y = 4 runs from x = 4 to x = 6, where the notch's left side moved in, x = 6,
// takes over up to y = 5; then the arc about (10, 5) to (10, 9); y = 9 over the notch's top; the
// arc about (12, 5) to (16, 5); x = 16 down to y = 4; y = 4 on to x = 26; x = 26 up to y = 8; the
// arc about the inward corner (16, 12) from (16, 8) to (12, 12); x = 12 up to y = 20; y = 20 to
// x = 4; and down. The middle of an arc lies 4 / sqrt(2) = 2.828 off its centre each way.
const NOTCHED = [
  [0, 0],
  [10, 0],
  [10, 5],
  [12, 5],
  [12, 0],
  [30, 0],
  [30, 12],
  [16, 12],
  [16, 24],
  [0, 24],
];
const notched = proven(NOTCHED, 4, 1, 'the notched L at 4 m');
const SHARP = [
  [4, 4],
  [6, 4],
  [16, 4],
  [26, 4],
  [26, 8],
  [12, 20],
  [4, 20],
];
cornersOn(notched, SHARP, 'the notched L at 4 m');
const segments = segmentsOf(notched);
for (const place of [
  [11, 9],
  [13.172, 9.172],
  [7.172, 7.828],
]) {
  const off = Math.min(...segments.map((s) => toSide(place, s)));
  assert.ok(off <= ON_ARC_M, `the notched L: ${place} lies ${off} m from the line`);
}
// The notch, narrower than twice the distance, holds no line: nothing between its sides below
// the line over its top.
const inNotch = notched[0].filter(
  ([x, y]) => x > 10 + CORNER_M && x < 12 - CORNER_M && y < 9 - CORNER_M,
);
assert.deepEqual(inNotch, [], 'the notched L: a line in the notch');

// --- a plot with a waist ---------------------------------------------------------------------
// Two squares of 20 m and a neck 6 m wide (y 7..13, x 20..26). At 4 m the arcs about the neck's
// corners (20, 7) and (20, 13) meet at y = 10, 3 m from each: x = 20 - sqrt(16 - 9) = 17.354;
// and about (26, 7) and (26, 13) at x = 26 + sqrt(7) = 28.646. So two pieces, one each side. At
// 2.9 m the neck, 6 m across, still holds a line along it: one piece.
const WAISTED = [
  [0, 0],
  [20, 0],
  [20, 7],
  [26, 7],
  [26, 0],
  [46, 0],
  [46, 20],
  [26, 20],
  [26, 13],
  [20, 13],
  [20, 20],
  [0, 20],
];
const waisted = proven(WAISTED, 4, 2, 'the waisted plot at 4 m');
const reach = waisted.map((piece) => piece.map(([x]) => x));
const [left, right] = reach.sort((a, b) => Math.min(...a) - Math.min(...b));
assert.ok(
  Math.abs(Math.max(...left) - (20 - Math.sqrt(7))) <= CORNER_M,
  'the left piece reaches 17.354',
);
assert.ok(
  Math.abs(Math.min(...right) - (26 + Math.sqrt(7))) <= CORNER_M,
  'the right piece from 28.646',
);
proven(WAISTED, 2.9, 1, 'the waisted plot at 2.9 m');

// --- a corner that does not turn, and a corner given twice ------------------------------------
// (19, 23) lies in the made-up plot's top side, and (2, 6) is its first corner again: the same
// line through the same six corners. At 9.99 m the plot is a sliver 2 cm wide - y 12.99..13.01 -
// that still closes.
const DOUBLED = [...MADE_UP.slice(0, 2), [19, 23], ...MADE_UP.slice(2), [2, 6]];
const doubled = proven(DOUBLED, 4, 1, 'a corner that does not turn, and one given twice');
cornersOn(doubled, AT_4, 'a corner that does not turn, and one given twice');
proven(DOUBLED, 9.99, 1, 'the sliver at 9.99 m');

process.stdout.write('distances/lines.check.js: the lines at a distance held\n');
