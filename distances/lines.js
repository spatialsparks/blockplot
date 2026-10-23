// The lines at a boundary distance (story ST-036, rules 1 and 2): the places inside a plot's
// outline that lie exactly a distance from it. A point of such a line lies inside the plot, and
// its distance to the nearest point of the outline is the distance; and every place of the plot
// that is that far from the outline lies on the line - round about a corner that turns inward,
// and nowhere in a notch narrower than twice the distance.
//
// Worked out as points, not drawn as a stroke clipped to the plot: a stroke gives no line that a
// check can hold to the two rules, and no place to write a label. The rule, in three sentences:
// every place at exactly the distance lies on a candidate - a side moved inward by the distance,
// or the arc of that radius about a corner that turns inward. A place of a candidate is on the
// line where no side is nearer than the distance. The parts of the candidates so kept are joined
// end to end into closed pieces.
//
// A plain script that reads nothing as it loads - no paper, no plot, no sketch, no page - and
// knows no outline but the one it is handed. No page loads it yet: the plan's drawing is T-036.3's.
(() => {
  /** The longest step along an arc, in metres. */
  const STEP_M = 0.05;
  /** How far the middle of a chord of an arc may lie from the arc, in metres. */
  const SAGITTA_M = 0.002;
  /** Two ends this near, in metres, are one point. */
  const JOIN_M = 0.001;
  /** A place is at the distance where it is no nearer to a side than the distance less this. */
  const KEEP_M = 1e-7;
  /** How often an interval is halved, or cut in three, to find an end or a lowest point. */
  const HALVINGS = 60;
  const THIRDINGS = 100;

  /** The sides of an outline, a corner given twice, or a last corner repeating the first, once. */
  function sidesOf(outline) {
    const corners = outline.filter(([x, y], index) => {
      const [x2, y2] = outline[(index + 1) % outline.length];
      return x !== x2 || y !== y2;
    });
    return corners.map((corner, index) => [corner, corners[(index + 1) % corners.length]]);
  }

  /** Twice the area an outline encloses: above nought anticlockwise, below it clockwise. */
  const twiceArea = (outline) =>
    outline.reduce((sum, [x, y], index) => {
      const [x2, y2] = outline[(index + 1) % outline.length];
      return sum + x * y2 - x2 * y;
    }, 0);

  /** The distance from a place to a side. */
  function toSide([px, py], [[ax, ay], [bx, by]]) {
    const [dx, dy] = [bx - ax, by - ay];
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }

  /** The distance from a place to the outline: to its nearest side. */
  const far = (sides, place) =>
    sides.reduce((least, side) => Math.min(least, toSide(place, side)), Infinity);

  /** A point of the straight line from one place to another, at a share `t` of the way. */
  const along = (from, to) => (t) => [
    from[0] + t * (to[0] - from[0]),
    from[1] + t * (to[1] - from[1]),
  ];

  /**
   * The candidates: every side moved inward by `d`, its whole length - inward by the winding, so
   * either - and, about every corner that turns inward, the arc of radius `d` from the one side's
   * inward normal to the other's, the short way. A corner that does not turn has none.
   */
  function candidates(sides, d, turn) {
    const inward = ([[ax, ay], [bx, by]]) => {
      const length = Math.hypot(bx - ax, by - ay);
      return [(-turn * (by - ay)) / length, (turn * (bx - ax)) / length];
    };
    const straight = sides.map((side) => {
      const [nx, ny] = inward(side);
      const [[ax, ay], [bx, by]] = side;
      return along([ax + d * nx, ay + d * ny], [bx + d * nx, by + d * ny]);
    });
    const arcs = sides.flatMap((side, index) => {
      const next = sides[(index + 1) % sides.length];
      const [ux, uy] = [side[1][0] - side[0][0], side[1][1] - side[0][1]];
      const [vx, vy] = [next[1][0] - next[0][0], next[1][1] - next[0][1]];
      if (turn * (ux * vy - uy * vx) >= 0) return [];
      const [n1, n2] = [inward(side), inward(next)];
      const from = Math.atan2(n1[1], n1[0]);
      const sweep = Math.atan2(n1[0] * n2[1] - n1[1] * n2[0], n1[0] * n2[0] + n1[1] * n2[1]);
      const [cx, cy] = side[1];
      const at = (t) => [cx + d * Math.cos(from + t * sweep), cy + d * Math.sin(from + t * sweep)];
      const chord = 2 * Math.acos(Math.max(-1, 1 - SAGITTA_M / d));
      const steps = Math.max(1, Math.ceil(Math.abs(sweep) / Math.min(chord, STEP_M / d)));
      return [{ at, steps }];
    });
    return { straight, arcs };
  }

  /**
   * Where one side is nearer than `d` along a straight candidate: one interval of its shares, or
   * null. Along a straight line the distance to a side is convex, so it is one interval: its
   * lowest point by a ternary search, its two ends by bisection.
   */
  function nearer(at, side, d) {
    const [p, q] = [at(0), at(1)];
    const [[ax, ay], [bx, by]] = side;
    const missesX =
      Math.max(p[0], q[0]) < Math.min(ax, bx) - d || Math.min(p[0], q[0]) > Math.max(ax, bx) + d;
    const missesY =
      Math.max(p[1], q[1]) < Math.min(ay, by) - d || Math.min(p[1], q[1]) > Math.max(ay, by) + d;
    if (missesX || missesY) return null;
    const isNearer = (t) => toSide(at(t), side) < d - KEEP_M;
    let [lo, hi] = [0, 1];
    for (let k = 0; k < THIRDINGS; k += 1) {
      const [a, b] = [lo + (hi - lo) / 3, hi - (hi - lo) / 3];
      if (toSide(at(a), side) < toSide(at(b), side)) hi = b;
      else lo = a;
    }
    const low = (lo + hi) / 2;
    if (!isNearer(low)) return null;
    const end = (inT, outT) => {
      for (let k = 0; k < HALVINGS; k += 1) {
        const mid = (inT + outT) / 2;
        if (isNearer(mid)) inT = mid;
        else outT = mid;
      }
      return outT;
    };
    return [isNearer(0) ? 0 : end(low, 0), isNearer(1) ? 1 : end(low, 1)];
  }

  /** The runs of a straight candidate that no side takes: cut exactly, however short. */
  function straightRuns(at, sides, d) {
    const taken = sides
      .map((side) => nearer(at, side, d))
      .filter(Boolean)
      .sort((a, b) => a[0] - b[0]);
    const runs = [];
    let from = 0;
    for (const [a, b] of [...taken, [1, 1]]) {
      if (a > from) runs.push([at(from), at(a)]);
      from = Math.max(from, b);
    }
    return runs;
  }

  /** The runs of an arc where no side is nearer: walked, each end found by bisection. */
  function arcRuns({ at, steps }, sides, d) {
    const kept = (t) => far(sides, at(t)) >= d - KEEP_M;
    const edge = (inT, outT) => {
      for (let k = 0; k < HALVINGS; k += 1) {
        const mid = (inT + outT) / 2;
        if (kept(mid)) inT = mid;
        else outT = mid;
      }
      return inT;
    };
    const runs = [];
    let run = null;
    for (let k = 0; k <= steps; k += 1) {
      const [t, lastT] = [k / steps, (k - 1) / steps];
      const now = kept(t);
      if (now && run) run.push(at(t));
      else if (now) run = k === 0 ? [at(0)] : [at(edge(t, lastT)), at(t)];
      else if (run) {
        run.push(at(edge(lastT, t)));
        runs.push(run);
        run = null;
      }
    }
    if (run) runs.push(run);
    return runs;
  }

  const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= JOIN_M;

  /**
   * The runs joined end to end: from a run, on to the run that begins - or, turned round, ends -
   * where it ends, until the piece closes. A run of no length - a point, where the plot is exactly
   * twice the distance across - is none.
   */
  function joined(runs) {
    const left = runs.filter((run) => run.some((p) => !near(p, run[0])));
    const pieces = [];
    while (left.length > 0) {
      const piece = [...left.shift()];
      for (;;) {
        const end = piece.at(-1);
        if (piece.length > 2 && near(end, piece[0])) {
          piece[piece.length - 1] = piece[0];
          break;
        }
        const index = left.findIndex((run) => near(run[0], end) || near(run.at(-1), end));
        if (index < 0) break;
        const [run] = left.splice(index, 1);
        piece.push(...(near(run[0], end) ? run : [...run].reverse()).slice(1));
      }
      pieces.push(piece);
    }
    return pieces;
  }

  /**
   * The lines at `metres` inside an outline - `[[x, y], ...]` in the plot's own metres, either
   * winding, a corner given twice allowed: a list of closed polylines in the same metres, each
   * with its first point repeated as its last, in no promised order. An empty list where no place
   * of the plot is that far from its outline.
   */
  function at(outline, metres) {
    const sides = sidesOf(outline);
    const turn = Math.sign(twiceArea(outline));
    if (sides.length < 3 || turn === 0 || !(metres > 0)) return [];
    const { straight, arcs } = candidates(sides, metres, turn);
    const runs = [
      ...straight.flatMap((line) => straightRuns(line, sides, metres)),
      ...arcs.flatMap((arc) => arcRuns(arc, sides, metres)),
    ];
    return joined(runs);
  }

  globalThis.distanceLines = { at };
})();
