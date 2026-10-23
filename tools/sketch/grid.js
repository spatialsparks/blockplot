// The grid that the paper shows, and the zoom's rungs (story ST-042), `globalThis.grid`. Of ten
// steps, from half a metre to 500 m, the paper shows the finest whose lines stand at least
// APART_PX of the screen's pixels apart, every STRONG-th line stronger (land.js draws it), and
// none where even the coarsest stands closer. What a click snaps to is the step the paper was
// last drawn with, `shown` (Rule 2): `floor` and `round` give the line of it at or before a place
// of the plane's paper, and the nearest - a box and a line's point ask them (strokes.js,
// lines/tool.js). The lines lie where the paper's metres are a whole multiple of the step: of
// the plot's frame along and across, of the height above sea level up. Every edge of a paper
// lies on a whole half-metre, so every line lies on a whole cell, and a place snapped is a whole
// number of cells (Rule 1). A plain script with no page in it: loaded by index.html after
// paper.js and before land.js.
(() => {
  const { paper } = globalThis;
  const { CELL_M, metres } = paper;
  // The steps of the grid, in metres; how far apart its lines stand at the least, in pixels of
  // the screen; and every how many lines one is stronger.
  const STEPS_M = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
  const APART_PX = 8;
  const STRONG = 5;
  // The zoom's rungs, screen pixels a cell: 10 and 20 among them, at which the pad opens the
  // made-up plot in a window of 1 440 and of 2 400, and 8 in the browser tests' of 1 280.
  const LADDER = [
    0.006, 0.008, 0.01, 0.015, 0.02, 0.03, 0.04, 0.06, 0.08, 0.1, 0.15, 0.2, 0.3, 0.4, 0.6, 0.8, 1,
    1.5, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 32,
  ];
  // A comparison of pixels allows for this much: 0.008 × 500 / 0.5 is 8 to the last figure, or
  // a hair under it.
  const HAIR = 1e-9;

  /** The rung at or under a number of pixels a cell: the first, under the first. */
  const rung = (px) => LADDER.findLast((one) => one <= Number(px)) ?? LADDER[0];
  /** The rung `by` rungs on from that of `px` - 1 larger, -1 smaller - held to the two ends. */
  function next(px, by) {
    const at = LADDER.indexOf(rung(px)) + by;
    return LADDER[Math.min(Math.max(at, 0), LADDER.length - 1)];
  }
  /** Of the steps, the finest whose lines stand at least APART_PX apart at `unit` CSS pixels a cell; null where none does. */
  const stepAt = (unit) =>
    STEPS_M.find((step) => (unit * step) / CELL_M >= APART_PX - HAIR) ?? null;

  /** The lines of the grid shown along an axis of the plane's paper (0 along, 1 up): one of them, and how many cells apart they stand. */
  function lattice(axis) {
    const every = grid.shown / CELL_M;
    const [m0, m1] = [metres([0, 0])[axis], metres([1, 1])[axis]];
    // The metres at a place run m0 + place × (m1 - m0): a line at a whole multiple of the step.
    const zero = -m0 / (m1 - m0);
    return [((zero % every) + every) % every, every];
  }
  /** A place on the paper, in cells, put on a line of the grid shown by `snap`, along `axis`. */
  function on(place, axis, snap) {
    const [one, every] = lattice(axis);
    return one + snap((place - one) / every) * every + 0;
  }

  const grid = {
    STEPS_M,
    APART_PX,
    STRONG,
    LADDER,
    rung,
    next,
    stepAt,
    // The step the paper was last drawn with, in metres: what a click snaps to. The finest until
    // the paper is drawn, and the coarsest where it shows none.
    shown: STEPS_M[0],
    /** The line of the grid shown at or before a place of the plane's paper, along it (`axis` 0) or up it (1). */
    floor: (place, axis) => on(place, axis, Math.floor),
    /** The line of the grid shown nearest to a place of the plane's paper. */
    round: (place, axis) => on(place, axis, Math.round),
  };
  globalThis.grid = grid;
})();
