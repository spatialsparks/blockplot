// Lamps, a plant in its pot and a towel rail (story ST-034): what stands on a stem or hangs on a
// rail - each the few pieces of its kind, for objects.js. Said in the words of furniture.js,
// `box`, `round`, `ball`, `dome` and `rulesOf`: shares of the object's own box as it lies while
// it is not turned, `along` it - nought its uphill end, the left of the pad's top view - `across`
// it - nought its far side, its back - and `up`, nought its foot; and the towel rail by its
// length, in `bySize` (T-037.3). It imports furniture.js and names no global.
//
// A lamp is an object, and lights nothing: the 3D page's light is the one sun. Every piece lies
// on what the pad draws from above (the pad's furniture.js and bathroom.js), and what holds of
// furniture holds here (holds.js): pieces of different surfaces touch, with one figure where they
// meet. The metres beside a kind are those of its size today (`KINDS` of shapes.js), and where
// one stands higher than its floor - a table lamp, a pendant lamp - the pad lifts its box, and
// objects.js its pieces: they are said here from the foot of the box. A share is no size.
import { ball, box, bySize, dome, round, rulesOf } from './furniture.js';

/** Shares of a height in metres. */
const sharesOf = (high, ...metres) => metres.map((one) => one / high);
/** What is round and stands in the middle of a square object, so wide a share of it. */
const middle = (share) => [0.5 - share / 2, 0.5 + share / 2];
// A stem of 3 cm, of a lamp of 0.5 m by 0.5 m: a share of 0.06 of it.
const STEM = middle(0.06);

// A FLOOR LAMP of 0.5 m by 0.5 m, 1.6 m high. A foot of metal, round, 0.3 m across and 3 cm high,
// at its middle; on it a stem of metal, round, 3 cm across, up to 1.3 m; on that a shade of
// fabric, round, 0.4 m across, from 1.3 m to its top.
const [FLOOR_FOOT, FLOOR_SHADE] = sharesOf(1.6, 0.03, 1.3);
const floorlamp = [
  round('metal', middle(0.6), middle(0.6), [0, FLOOR_FOOT]),
  round('metal', STEM, STEM, [FLOOR_FOOT, FLOOR_SHADE]),
  round('fabric', middle(0.8), middle(0.8), [FLOOR_SHADE, 1]),
];

// A TABLE LAMP of 0.5 m by 0.5 m, 0.5 m high, its box lifted 0.75 m: on a table's height. A foot
// of ceramic, round, 0.15 m across and 0.2 m high; a stem of metal, 3 cm across, from it up to
// 0.25 m; and a shade of fabric, round, 0.3 m across, from 0.25 m to its top.
const [TABLE_FOOT, TABLE_SHADE] = sharesOf(0.5, 0.2, 0.25);
const tablelamp = [
  round('ceramic', middle(0.3), middle(0.3), [0, TABLE_FOOT]),
  round('metal', STEM, STEM, [TABLE_FOOT, TABLE_SHADE]),
  round('fabric', middle(0.6), middle(0.6), [TABLE_SHADE, 1]),
];

// A PENDANT LAMP of 0.5 m by 0.5 m, 1.1 m high, its box lifted 1.6 m: its cord reaches 2.7 m
// over its floor. A shade of metal, a dome 0.4 m across and 0.25 m high at its foot - a bowl,
// closed below as every shape is; and from its top up to the box's a cord of metal, round, 1 cm
// across.
const [BOWL] = sharesOf(1.1, 0.25);
const pendant = [
  dome('metal', middle(0.8), middle(0.8), [0, BOWL]),
  round('metal', middle(0.02), middle(0.02), [BOWL, 1]),
];

// A PLANT of 0.5 m by 0.5 m, 1.2 m high. A pot of ceramic, round, 0.35 m across and 0.35 m high,
// at its middle; and on its rim its leaves, a ball of leaf as wide as the plant, up to its top.
const [RIM] = sharesOf(1.2, 0.35);
const plant = [
  round('ceramic', middle(0.7), middle(0.7), [0, RIM]),
  ball('leaf', [0, 1], [0, 1], [RIM, 1]),
];

// A TOWEL RAIL of 0.5 m by 0.5 m, 1.2 m high - 0.5 to 1.5 m long, built by its size (T-037.3) -
// all of it metal but its towel. Two posts, round, 3 cm across, at the two ends of its far side,
// from its foot to its top; between them three rails, boxes of 2 cm, on the line of the posts, at
// 0.5 m, 0.8 m and 1.1 m; and a towel of fabric, 0.35 m wide in its middle and 2 cm thick, hung
// before the middle rail - touching it - from its top down to 0.45 m. It lies before the lowest
// rail and touches that one too, and lies in no metal. Across it and up it, all is as at its own
// size, in shares of its 0.5 m and its 1.2 m: its rails are 0.44 m long at 0.5 m, 1.44 m at 1.5 m.
// One cut by its room shorter than 0.5 m is laid out on 0.5 m.
const [POST_M, TOWEL_M] = [0.03, 0.35];
const [POST, RAIL] = [0.06, [0.01, 0.05]];
function towelrail(long) {
  const along = (metres) => metres / Math.max(long, 0.5);
  const post = along(POST_M);
  const rail = (metres) =>
    box('metal', [post, 1 - post], RAIL, sharesOf(1.2, metres - 0.01, metres + 0.01));
  return [
    round('metal', [0, post], [0, POST], [0, 1]),
    round('metal', [1 - post, 1], [0, POST], [0, 1]),
    rail(0.5),
    rail(0.8),
    rail(1.1),
    box('fabric', middle(along(TOWEL_M)), [RAIL[1], 0.09], sharesOf(1.2, 0.45, 0.81)),
  ];
}

/** The rule of each of these kinds: for `KINDS` of objects.js, which lifts their parts. */
export const lamps = {
  ...rulesOf({ floorlamp, tablelamp, pendant, plant }),
  towelrail: bySize(towelrail),
};
