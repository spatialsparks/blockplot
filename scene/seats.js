// Seats (story ST-034): an office chair, an armchair and a corner sofa - each the few pieces of
// its kind, for objects.js. Said in the words of furniture.js, `box`, `round` and `rulesOf`:
// shares of the object's own box as it lies while it is not turned, `along` it - nought its
// uphill end, the left of the pad's top view - `across` it - nought its far side, its back -
// and `up`, nought its foot - and the armchair and the corner sofa in `bySize`, by their size
// (T-035.7, T-037.3). It imports furniture.js and names no global.
//
// The back of each is its far side until it is turned, as a chair's and a sofa's are (the pad's
// furniture.js), and every piece lies on what the pad draws from above. What holds of furniture
// holds here (holds.js): pieces of different surfaces touch, with one figure where they meet,
// and pieces of one surface may reach into each other. The metres beside a kind are those of its
// size today (`KINDS` of shapes.js); a share is no size.
import { box, bySize, round, rulesOf } from './furniture.js';

// AN OFFICE CHAIR of 0.5 m by 0.5 m, 1.1 m high. A foot of metal, round, as wide as the chair and
// 5 cm high - its five arms, seen as their disc; on it a column of metal, round, 6 cm across, up
// to the seat; a seat of fabric 8 cm thick, its top at 0.48 m; and a back of fabric, 8 cm thick,
// along its far side, from 0.6 m to its top.
const OFFICE_M = 1.1;
const [FOOT, SEAT, SEAT_TOP, BACK] = [0.05, 0.4, 0.48, 0.6].map((metres) => metres / OFFICE_M);
const officechair = [
  round('metal', [0, 1], [0, 1], [0, FOOT]),
  round('metal', [0.44, 0.56], [0.44, 0.56], [FOOT, SEAT]),
  box('fabric', [0, 1], [0, 1], [SEAT, SEAT_TOP]),
  box('fabric', [0, 1], [0, 0.16], [BACK, 1]),
];

// AN ARMCHAIR of 1 m by 1 m, 0.8 m high - 1 to 1.5 m each way, built by its size (T-037.3) - on
// four short legs of joinery, round, 5 cm across and 10 cm high, each 5 cm in from its end and
// from its side. On them, from 0.1 m up: a seat of fabric up to 0.42 m, between its arms and
// before its back; a back of fabric along its far side, 0.2 m deep, to its top; and an arm of
// fabric at each end, 0.15 m wide and 0.6 m high. Its heights are shares of its 0.8 m. At 1 m by
// 1 m its seat is 0.7 m by 0.8 m; at 1.5 m by 1.5 m, 1.2 m by 1.3 m. One cut by its room smaller
// than 1 m by 1 m is laid out in shares of that size, as a corner sofa is.
const [LEGS, ARMCHAIR_SEAT, ARM] = [0.1, 0.42, 0.6].map((metres) => metres / 0.8);
const [CHAIR_ARM_M, CHAIR_BACK_M, LEG_IN_M, LEG_M] = [0.15, 0.2, 0.05, 0.05];
function armchair(long, deep) {
  const [along, across] = [long, deep].map((metres) => (piece) => piece / Math.max(metres, 1));
  const [arm, back] = [along(CHAIR_ARM_M), across(CHAIR_BACK_M)];
  const ends = (share) => [
    [share(LEG_IN_M), share(LEG_IN_M + LEG_M)],
    [1 - share(LEG_IN_M + LEG_M), 1 - share(LEG_IN_M)],
  ];
  const legs = ends(along).flatMap((end) => ends(across).map((side) => [end, side]));
  return [
    box('fabric', [arm, 1 - arm], [back, 1], [LEGS, ARMCHAIR_SEAT]),
    box('fabric', [0, 1], [0, back], [LEGS, 1]),
    box('fabric', [0, arm], [back, 1], [LEGS, ARM]),
    box('fabric', [1 - arm, 1], [back, 1], [LEGS, ARM]),
    ...legs.map(([end, side]) => round('joinery', end, side, [0, LEGS])),
  ];
}

// A CORNER SOFA of 3 m by 2 m, 0.8 m high - 2 to 4 m long and 1.5 to 3 m deep, built by its size
// (T-035.7) - of one hand, never mirrored, all of it fabric. Along its far side a back 0.25 m
// deep, as high as it is; at its left end, the uphill end until it is turned, a back 0.25 m
// thick, its whole depth. The long seat, 0.45 m up, runs from that end's back to 0.2 m short of
// its right end, and from its back to 1 m out; at its right end an arm 0.2 m wide and 0.6 m high,
// as far out as the long seat; and the second seat runs from the end's back to 1 m along, from
// 1 m out to its front: at 1.5 m deep it comes forward 0.5 m, at 3 m, 2 m. Its heights are shares
// of its 0.8 m. One cut by its room (clear.js) smaller than 2 m by 1.5 m is laid out in shares of
// that size, as furniture.js lays out a sofa: no piece leaves the box it is given.
const [BACK_M, ARM_M, SEAT_M, LEAST] = [0.25, 0.2, 1, [2, 1.5]];
const [SOFA_SEAT, SOFA_ARM] = [0.56, 0.75];
function cornersofa(long, deep) {
  const [along, across] = [long, deep].map(
    (metres, way) => (piece) => piece / Math.max(metres, LEAST[way]),
  );
  const [end, arm, corner] = [along(BACK_M), 1 - along(ARM_M), along(SEAT_M)];
  const [rear, middle] = [across(BACK_M), across(SEAT_M)];
  return [
    box('fabric', [0, 1], [0, rear], [0, 1]),
    box('fabric', [0, end], [rear, 1], [0, 1]),
    box('fabric', [end, arm], [rear, middle], [0, SOFA_SEAT]),
    box('fabric', [end, corner], [middle, 1], [0, SOFA_SEAT]),
    box('fabric', [arm, 1], [rear, middle], [0, SOFA_ARM]),
  ];
}

/** The rule of each of these kinds: for `KINDS` of objects.js, which lifts their parts. */
export const seats = {
  ...rulesOf({ officechair }),
  armchair: bySize(armchair),
  cornersofa: bySize(cornersofa),
};
