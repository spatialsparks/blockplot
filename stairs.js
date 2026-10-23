// How a staircase looks, from above and from the side: the staircase of one storey, the wide one
// and the spiral one. shapes.js lists them with their sizes, and draws these shapes as it draws
// its own; they were drawn there once, and are drawn here, to make room there for the sizes of
// objects (T-035.1). How a staircase is built in 3D is the scene's (scene/steps.js), and it lies
// on what is drawn here from above: steps.check.js fails where the two differ. And how many
// steps a straight staircase has, and how large they are - `shapes.stepsOf`, for the words of
// footer.js - by the rule the scene builds them by: said twice, as `RISE_M` is, and held to one
// count at every size by scene/flight-steps.check.js (story ST-037).
(() => {
  const { SIDE, TOP, WHOLE, RISE_M, FLIGHTS, sizeOf } = globalThis.shapes;
  // Twice a rise and a going, in metres, of a staircase with a length of its own: a common figure
  // of comfort, read off no building rule (ST-037: rule 3 is comfort, not law). The scene's
  // steps.js says it a second time; whoever changes one changes the other.
  const STRIDE_M = 0.63;
  // A figure worked out is off by its last digit: within this, a height is a whole number of rises.
  const HAIR = 1e-9;
  // A staircase from the side, and from above: how many steps are drawn.
  const STEPS = 9;
  // A spiral staircase winds once round its post in a storey, clockwise from above, and its first
  // step is at the uphill side until it is turned: how many steps are drawn of it.
  // ponytail: it winds one way only; a mirrored kind when a plan needs the other hand.
  const TREADS = 12;
  /** A place round a spiral staircase's post: a part of a turn on from its first step, `far` out. */
  const round = (part, far) => {
    const angle = part * 2 * Math.PI;
    return [0.5 - far * Math.cos(angle), 0.5 - far * Math.sin(angle)];
  };
  const steps = Array.from({ length: STEPS }, (_, k) => [
    [k / STEPS, 1 - (k + 1) / STEPS],
    [(k + 1) / STEPS, 1 - (k + 1) / STEPS],
  ]).flat();

  Object.assign(SIDE, {
    stairs({ to, line }, across) {
      // Along its flight it climbs to the right; from its end it is a step over a step.
      if (!across) return to([0, 1], ...steps, [1, 1]);
      to(...WHOLE);
      for (let k = 1; k < STEPS; k += 1) line([0, k / STEPS], [1, k / STEPS]);
    },
    spiral({ to }, across) {
      // Each step reaches from the post as far down the plot as it does from above, a step
      // higher than the one before; then the post, in front of them.
      for (let k = 0; k < TREADS; k += 1) {
        const [u, v] = round(k / TREADS, 0.5);
        const end = across ? 1 - v : u;
        const [low, high] = [1 - k / TREADS, 1 - (k + 1) / TREADS];
        to([0.5, low], [end, low], [end, high], [0.5, high]);
      }
      to([0.45, 0], [0.55, 0], [0.55, 1], [0.45, 1]);
    },
  });

  Object.assign(TOP, {
    stairs({ to, line }) {
      // The steps across the flight, and an arrow up it.
      to(...WHOLE);
      for (let k = 1; k < STEPS; k += 1) line([k / STEPS, 0], [k / STEPS, 1]);
      line([0.06, 0.5], [0.94, 0.5]);
      line([0.86, 0.3], [0.94, 0.5], [0.86, 0.7]);
    },
    spiral({ line, oval }) {
      // The steps round the post, and an arrow up them: from the middle of the first step to
      // the middle of the last but one.
      const up = Array.from({ length: 2 * TREADS - 3 }, (_, k) =>
        round((k + 1) / (2 * TREADS), 0.3),
      );
      const barbs = (TREADS - 2.25) / TREADS;
      oval(0.5, 0.5, 0.5, 0.5);
      for (let k = 0; k < TREADS; k += 1) line([0.5, 0.5], round(k / TREADS, 0.5));
      line(...up);
      line(round(barbs, 0.2), up.at(-1), round(barbs, 0.4));
      oval(0.5, 0.5, 0.05, 0.05);
    },
  });

  // A wide staircase is drawn as the staircase is: nine steps and the arrow, in a wider box.
  [SIDE.widestairs, TOP.widestairs] = [SIDE.stairs, TOP.stairs];

  /**
   * The steps of a straight staircase, `{ count, rise, going }` in metres, by its size unturned:
   * of one that says a length of its own, as many as the whole number nearest (2 x height +
   * length) / `STRIDE_M`, at the least two (ST-037, rule 3); of one that says none, the fewest of
   * which none rises more than `RISE_M`, over its flight's length - as before (rule 2). Each
   * rises its height over their count, and goes its length over it. Of any other kind, `null`.
   */
  function stepsOf(thing) {
    if (!FLIGHTS.includes(thing.kind)) return null;
    const [long, , high] = sizeOf({ ...thing, turn: 0 });
    const own = typeof thing.long === 'number';
    const strides = Math.max(2, Math.round((2 * high + long) / STRIDE_M));
    const count = own ? strides : Math.ceil(high / RISE_M - HAIR);
    return { count, rise: high / count, going: long / count };
  }
  globalThis.shapes.stepsOf = stepsOf;
})();
