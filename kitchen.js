// How a kitchen's objects look, from above and from the side: an island, a run of counter, a
// hob, a sink, a fridge. shapes.js lists them with their sizes, and draws these shapes as it
// draws its own - a sink by its length (T-037.3), which shapes.js hands a drawing in metres. From
// above, the back of an object is its far side until it is turned: there is the sink's tap, and
// the fridge's door is across from it. Seen from its end, the back is to the right.
(() => {
  const { SIDE, TOP, corners, WHOLE } = globalThis.shapes;
  const slab = ({ to }) => to(...WHOLE);
  // A sink by its length, as scene/fittings.js builds it, in metres: its basin from 6 cm to
  // `Math.min(0.56, long - 0.06)` m from its uphill end, its drain and its tap - 3 cm each side of
  // their middle - over the basin's middle, and the drainer's grooves every 8 cm of it, from 0.1 m
  // past the basin to 0.1 m short of its far end: four at 1 m, none at 0.5 m. In shares of it.
  const [HOLLOW_M, BASIN_M, TAP_M, GROOVE_M, GROOVE_IN_M] = [0.06, 0.56, 0.03, 0.08, 0.1];
  function sinkOf(long) {
    const end = Math.min(BASIN_M, long - HOLLOW_M);
    const count = Math.floor((long - end - 2 * GROOVE_IN_M) / GROOVE_M + 1e-9) + 1;
    const grooves = Array.from(
      { length: Math.max(0, count) },
      (_, k) => end + GROOVE_IN_M + k * GROOVE_M,
    );
    const share = (metres) => metres / long;
    return {
      from: share(HOLLOW_M),
      to: share(end),
      tap: share((HOLLOW_M + end) / 2),
      wide: share(TAP_M),
      grooves: grooves.map(share),
    };
  }

  /** Units under a worktop, from the side: the worktop, the plinth and, from the front, the doors. */
  function units({ to, line }, across) {
    to(...WHOLE);
    line([0, 0.05], [1, 0.05]);
    line([0, 0.89], [1, 0.89]);
    for (const u of across ? [] : [0.25, 0.5, 0.75]) line([u, 0.05], [u, 0.89]);
  }

  Object.assign(SIDE, {
    island: units,
    counter: units,
    hob: slab,
    sink({ to, line, oval }, across, [long]) {
      // The rim, and the tap over it: from the front its spout comes on, over the basin's middle;
      // from the end it reaches from the back over the basin.
      const { tap, wide } = sinkOf(long);
      to(...corners(0, 0.9, 1, 1));
      if (across) return line([0.89, 0.9], [0.89, 0.05], [0.6, 0.05], [0.6, 0.25]);
      line([tap, 0.9], [tap, 0.05]);
      oval(tap, 0.12, wide, 0.1);
    },
    fridge({ to, line }, across) {
      // From the front the fridge over the freezer, a handle on each door; from the end the
      // doors, to the left.
      to(...WHOLE);
      if (across) return line([0.1, 0], [0.1, 1]);
      line([0, 0.65], [1, 0.65]);
      line([0.85, 0.35], [0.85, 0.58]);
      line([0.85, 0.72], [0.85, 0.85]);
    },
  });

  Object.assign(TOP, {
    island: slab,
    counter: slab,
    hob({ to, oval }) {
      to(...WHOLE);
      for (const u of [0.27, 0.73]) for (const v of [0.27, 0.73]) oval(u, v, 0.17, 0.17);
    },
    sink({ to, line, oval }, across, [long]) {
      // The basin with its drain, the grooves of the drainer beside it, and the tap behind it.
      const { from, to: end, tap, wide, grooves } = sinkOf(long);
      to(...WHOLE);
      to(...corners(from, 0.22, end, 0.9));
      oval(tap, 0.56, wide, 0.06);
      for (const u of grooves) line([u, 0.22], [u, 0.9]);
      line([tap, 0.11], [tap, 0.4]);
      oval(tap, 0.11, wide, 0.06);
    },
    fridge({ to, line }) {
      // Crossed out, as a unit that stands as high as a person; the doors are at its front.
      to(...WHOLE);
      line([0, 0], [1, 0.9]);
      line([1, 0], [0, 0.9]);
      line([0, 0.9], [1, 0.9]);
    },
  });
})();
