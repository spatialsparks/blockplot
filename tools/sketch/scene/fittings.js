// The fittings of a kitchen and of a bathroom: an island, a run of counter, a hob, a sink and a
// fridge; a toilet, a washbasin, a bathtub and a shower - each the simple shape of its kind
// (story ST-024), for objects.js. How a shape is said, how it is turned and what holds of its
// pieces is furniture.js's to say, whose way of saying it this is. It imports that neighbour
// and names no global.
//
// The back of a fitting is its far side while it is not turned (the pad's kitchen.js and
// bathroom.js): there a counter stands at its wall, there are the tap of a sink and the cistern
// of a toilet, and the doors of a fridge are across it. A hob and a sink lie on a worktop: the
// pad lifts their boxes 0.9 m, and they are as high as what shows of them over it.
//
// BY SIZE. An island, a counter, a bathtub and a shower (story ST-035), a sink and a washbasin
// (ST-037) are built for the size they say, by `bySize`: told their box in metres, they work out
// their pieces in shares of it, each as thick in metres at any size as at its kind's own. At that
// size each is the pieces it was before it had one - but a counter, which has gained its fronts.
// No count of eight holds for a counter: at 6 m it is twelve pieces. A fridge takes a length too,
// 0.5 to 1 m, and needs no rule by it: every piece of it runs its whole length.
import { box, bySize, round, rulesOf } from './furniture.js';

// A KITCHEN.
// Units 0.9 m high, and 0.85 to 1.1 m: a body under a worktop of stone, 4.5 cm thick, its whole
// length and depth, at the top - which reaches some 2 cm over the body round an island, and at a
// counter's front and ends.
const WORKTOP_M = 0.045;
const worktopOf = (high) => box('stone', [0, 1], [0, 1], [1 - WORKTOP_M / high, 1]);

// An island of 2.5 m by 1 m - 1 to 5 m long, 1 to 1.5 m deep: a body of paint, 2.5 cm in at each
// end and 2 cm at each side, under its worktop: 2.45 m by 0.96 m at its own size, 0.95 m by
// 0.96 m at 1 m by 1 m, and 4.95 m by 1.46 m at 5 m by 1.5 m.
function island(long, deep, high) {
  const [end, side] = [0.025 / long, 0.02 / deep];
  return [
    box('paint', [end, 1 - end], [side, 1 - side], [0, 1 - WORKTOP_M / high]),
    worktopOf(high),
  ];
}

// A counter of 2.5 m - 0.5 to 6 m long, and 0.5 m deep at every length - with its back at its
// wall: a body of joinery, 2 cm in at each end, from its back to 0.46 m; its worktop, the second
// piece; and before the body, from 0.46 to 0.48 m, a front of paint about each `FRONT_M` of its
// length, evenly, 1.5 cm between two and at each end, as a cupboard's doors (storage.js), from
// 0.1 m up to the worktop: 1 at 0.5 m, 4 at 2.5 m, 6 at 3.5 m and 10 at 6 m. A counter takes no
// depth, so its 0.46 and 0.48 m are said as shares of its 0.5 m: one that its room cuts shallower
// (clear.js) stays within its box.
const [FRONT_M, GAP_M, PLINTH_M] = [0.6, 0.015, 0.1];
const [BODY, FRONT] = [0.92, 0.96];
function counter(long, deep, high) {
  const [end, under] = [0.02 / long, 1 - WORKTOP_M / high];
  const count = Math.max(1, Math.round(long / FRONT_M));
  const wide = (long - (count + 1) * GAP_M) / count;
  const fronts = Array.from({ length: count }, (_, nth) => {
    const from = GAP_M + nth * (wide + GAP_M);
    const along = [from / long, (from + wide) / long];
    return box('paint', along, [BODY, FRONT], [PLINTH_M / high, under]);
  });
  return [box('joinery', [end, 1 - end], [0, BODY], [0, under]), worktopOf(high), ...fronts];
}

// A hob of 0.5 m by 0.5 m: a plate of 2 cm that lies 2 cm in, and on it four rings of 17 cm,
// where the pad draws them - without them it is a plate, and no hob.
const hob = [
  box('metal', [0.04, 0.96], [0.04, 0.96], [0, 0.2]),
  round('ceramic', [0.1, 0.44], [0.1, 0.44], [0.2, 0.3]),
  round('ceramic', [0.1, 0.44], [0.56, 0.9], [0.2, 0.3]),
  round('ceramic', [0.56, 0.9], [0.1, 0.44], [0.2, 0.3]),
  round('ceramic', [0.56, 0.9], [0.56, 0.9], [0.2, 0.3]),
];

// A sink of 1 m by 0.5 m - 0.5 to 2 m long, built by its size (T-037.3) - all of metal. Its basin
// is not cut into the worktop, for nothing is cut: it is the hollow left over a thin bottom by its
// rims - behind the basin, before it, at its uphill end, and the drainer's piece beside it - where
// the pad draws the basin. Its bottom and its rims run from 2 cm in at its uphill end to 2 cm in at
// its far end; the hollow from 6 cm to `Math.min(0.56, long - 0.06)` m from its uphill end; the
// drainer's piece from there to the rims' end: 0.42 m of it at 1 m, 1.42 m at 2 m, and at 0.5 m a
// rim of 4 cm, and no drainer. Over the hollow's middle, behind it, the tap, 6 cm across, and on
// the tap its spout, 4 cm wide, out over the basin. Across it and up it, all is as at 1 m, in
// shares of its 0.5 m and its 0.3 m. One cut by its room shorter than 0.5 m is laid out on 0.5 m.
const [SINK_IN_M, HOLLOW_M, BASIN_M, TAP_M, SPOUT_M] = [0.02, 0.06, 0.56, 0.06, 0.04];
function sink(long) {
  const metres = Math.max(long, 0.5);
  const along = (...at) => at.map((one) => one / metres);
  const [rims, end] = [along(SINK_IN_M, metres - SINK_IN_M), Math.min(BASIN_M, metres - HOLLOW_M)];
  const middle = (HOLLOW_M + end) / 2;
  const wide = (across) => along(middle - across / 2, middle + across / 2);
  return [
    box('metal', rims, [0.04, 0.96], [0, 0.02]),
    box('metal', rims, [0.04, 0.22], [0.02, 0.1]),
    box('metal', rims, [0.9, 0.96], [0.02, 0.1]),
    box('metal', along(SINK_IN_M, HOLLOW_M), [0.22, 0.9], [0.02, 0.1]),
    box('metal', along(end, metres - SINK_IN_M), [0.22, 0.9], [0.02, 0.1]),
    round('metal', wide(TAP_M), [0.05, 0.17], [0.1, 0.9]),
    box('metal', wide(SPOUT_M), [0.05, 0.4], [0.9, 1]),
  ];
}

// A fridge of 0.5 m by 0.5 m, 2 m high: a body, and at its front the door of the freezer under
// the door of the fridge, 0.7 m up, as the pad's side view has them - told apart by the gap of
// 2 cm that is left between them, over a plinth of 8 cm.
const fridge = [
  box('metal', [0, 1], [0, 0.9], [0, 1]),
  box('metal', [0, 1], [0.9, 1], [0.04, 0.345]),
  box('metal', [0, 1], [0.9, 1], [0.355, 1]),
];

// A BATHROOM.
// A toilet of 0.5 m by 0.5 m, 0.4 m high: a round bowl of 0.38 m, 4 cm lower than the cistern
// behind it - which is no higher than the toilet's box, the pad's, and so no tank on a wall.
// The bowl narrows to its foot, as the pad's side view has it: 18 cm of bowl on a foot as high
// and 20 cm wide, which stands before the cistern.
const toilet = [
  round('ceramic', [0.12, 0.88], [0.24, 1], [0.45, 0.9]),
  box('ceramic', [0.1, 0.9], [0, 0.27], [0, 1]),
  box('ceramic', [0.3, 0.7], [0.27, 0.55], [0, 0.45]),
];

// A washbasin of 0.5 m by 0.5 m, 0.85 m high - 0.5 to 2 m long, built by its size (T-037.3): a
// unit of joinery its whole length, and on it a bowl of ceramic as long as the unit and 15 cm
// high, as the pad's side view has it - a trough, built as a tub is, of a bottom of 4 cm its whole
// length and of a rim round the hollow that the pad draws: at the back 11 cm of it and at the
// front 5 cm, each its whole length, and 5 cm at each end. Across it and up it, all is as at its
// own size, in shares of its 0.5 m and its 0.85 m: its hollow is 0.4 m long at 0.5 m, 1.9 m at
// 2 m. One cut by its room shorter than 0.5 m is laid out on 0.5 m.
const BASIN_END_M = 0.05;
function basin(long) {
  const end = BASIN_END_M / Math.max(long, 0.5);
  return [
    box('joinery', [0, 1], [0, 1], [0, 0.82]),
    box('ceramic', [0, 1], [0, 1], [0.82, 0.87]),
    box('ceramic', [0, 1], [0, 0.22], [0.87, 1]),
    box('ceramic', [0, 1], [0.9, 1], [0.87, 1]),
    box('ceramic', [0, end], [0.22, 0.9], [0.87, 1]),
    box('ceramic', [1 - end, 1], [0.22, 0.9], [0.87, 1]),
  ];
}

// A bathtub of 2 m by 1 m, 0.6 m high - 1.5 to 2 m long: a tub, built of its bottom of 0.15 m and
// of its four walls, from the bottom to its top - 6 cm at its ends and 8 cm at its sides, round
// the hollow that the pad draws (the pad's bathroom.js, which has these two too): a hollow of
// 1.88 m by 0.84 m at its own size, and of 1.38 m by 0.84 m at 1.5 m.
const [BOTTOM_M, END_M, SIDE_M] = [0.15, 0.06, 0.08];
function bath(long, deep, high) {
  const [end, side, bottom] = [END_M / long, SIDE_M / deep, BOTTOM_M / high];
  return [
    box('ceramic', [0, 1], [0, 1], [0, bottom]),
    box('ceramic', [0, end], [0, 1], [bottom, 1]),
    box('ceramic', [1 - end, 1], [0, 1], [bottom, 1]),
    box('ceramic', [end, 1 - end], [0, side], [bottom, 1]),
    box('ceramic', [end, 1 - end], [1 - side, 1], [bottom, 1]),
  ];
}

// A shower of 1 m by 1 m, 2 m high - 1 to 2 m by 1 to 2 m: a tray of 6 cm over its whole size,
// and glass of 2 cm along its two sides away from the corner at its back where the pad draws its
// head, which is the corner of a room - the pane at its downhill end its whole depth, the other
// along its front up to that pane. In the corner its pipe stands, 4 cm across, from 0.13 to 0.17 m
// out of the corner each way, up to 1.84 m, and bears the head, 16 cm across, from 0.07 to
// 0.23 m, up to 1.9 m: at every size as at 1 m by 1 m, and so clear of the glass. Glass hides a
// fifth of what is behind it, and a tray alone is a step.
const [TRAY_M, GLASS_M, PIPE_UP_M, HEAD_UP_M] = [0.06, 0.02, 1.84, 1.9];
const [PIPE_M, HEAD_M] = [
  [0.13, 0.17],
  [0.07, 0.23],
];
function shower(long, deep, high) {
  const [tray, end, side] = [TRAY_M / high, 1 - GLASS_M / long, 1 - GLASS_M / deep];
  const [pipe, head] = [PIPE_M, HEAD_M].map((out) =>
    [long, deep].map((m) => out.map((at) => at / m)),
  );
  return [
    box('ceramic', [0, 1], [0, 1], [0, tray]),
    box('glass', [end, 1], [0, 1], [tray, 1]),
    box('glass', [0, end], [side, 1], [tray, 1]),
    round('metal', ...pipe, [tray, PIPE_UP_M / high]),
    round('metal', ...head, [PIPE_UP_M / high, HEAD_UP_M / high]),
  ];
}

/** The rule of each of these kinds: for `KINDS` of objects.js, which lifts their parts. */
export const fittings = {
  island: bySize(island),
  counter: bySize(counter),
  ...rulesOf({ hob }),
  sink: bySize(sink),
  ...rulesOf({ fridge, toilet }),
  basin: bySize(basin),
  bath: bySize(bath),
  shower: bySize(shower),
};
