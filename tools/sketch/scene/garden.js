// What stands in a garden, of the house's own surfaces (story ST-034): a bench, a garden table, a
// sun lounger, a parasol and a grill - each the few pieces of its kind, for objects.js. Said in
// the words of furniture.js, `box`, `round`, `ball`, `dome` and `rulesOf`: shares of the object's
// own box as it lies while it is not turned, `along` it - nought its uphill end, the left of the
// pad's top view - `across` it - nought its far side, its back - and `up`, nought its foot. It
// imports furniture.js and names no global. The tree and the bush are objects.js's own, built by
// their box already, and the fountain furniture.js's.
//
// BY SIZE. A bench, a garden table, a sun lounger and a parasol (story ST-037) are built for the
// size they say, by `bySize`: told their box in metres, they work out their pieces in shares of
// it, each as thick in metres at any size as at its kind's own, where they are today's pieces.
// The grill takes no size.
//
// The back of a bench is along its far side, where a chair's is, and a lounger's at its head,
// its uphill end, where a bed's pillows are - until it is turned. Every piece lies on what the
// pad draws from above (the pad's garden.js), and what holds of furniture holds here (holds.js):
// pieces of different surfaces touch, with one figure where they meet. The metres beside a kind
// are those of its size today (`KINDS` of shapes.js). A share is no size.
import { ball, box, bySize, dome, round, rulesOf } from './furniture.js';

/** Shares of a length in metres. */
const sharesOf = (whole, ...metres) => metres.map((one) => one / whole);
/** What is round, so wide a share of its object, and stands with its middle at a share of it. */
const middle = (share, at = 0.5) => [at - share / 2, at + share / 2];
/**
 * For each way of an object's box - along, across, up, in metres - the share that a piece of so
 * many metres is; one cut by its room smaller than `least`, its kind's least size (the pad's
 * `TAKES`, said a second time), laid out in shares of that, as furniture.js's tables are.
 */
const metresIn = (size, least) =>
  size.map((metres, way) => (piece) => piece / Math.max(metres, least[way]));

// A BENCH of 1.5 m by 0.5 m, 0.8 m high - 1 to 4 m long, built by its size (T-037.4). At each end
// a frame of metal, a box 4 cm thick and its whole depth, up to the seat at 0.45 m, and on it a
// post 4 cm deep along its far side, up to its top; between the two ends a seat of joinery, from
// 0.41 m to 0.45 m; and between the posts a back of joinery 3 cm deep along its far side, from
// 0.55 m to its top. No frame between: at 1 m and at 4 m alike its seat runs 4 cm short of each
// end, 0.92 m and 3.92 m long. Across it and up, it is the shares of today.
const END_M = 0.04;
const [POST, BACK] = sharesOf(0.5, 0.04, 0.03);
const [SEAT, UNDER, BACK_FROM] = sharesOf(0.8, 0.45, 0.41, 0.55);
const benchEnd = (ends) => [
  box('metal', ends, [0, 1], [0, SEAT]),
  box('metal', ends, [0, POST], [SEAT, 1]),
];
function bench(long) {
  const [along] = metresIn([long], [1]);
  const end = along(END_M);
  return [
    ...benchEnd([0, end]),
    ...benchEnd([1 - end, 1]),
    box('joinery', [end, 1 - end], [0, 1], [UNDER, SEAT]),
    box('joinery', [end, 1 - end], [0, BACK], [BACK_FROM, 1]),
  ];
}

// A GARDEN TABLE of 1 m by 1 m, 0.75 m high - 1 to 4 m long, 1 to 2 m deep, 0.7 to 1.1 m high,
// built by its size (T-037.4). A top of joinery, round over its whole box - an oval where it is
// longer than deep - and 4 cm thick; under it a column of metal, round, 6 cm across, from its
// foot up to the top; and a foot of metal, round, 0.5 m across and 3 cm high. Up to
// `ONE_COLUMN_M` long one column and foot in its middle; longer, two of each, each a quarter of
// its length in from its end: at 4 m by 2 m their middles 1 m from its ends, 1 m from its sides.
const [TABLE_TOP_M, COLUMN_M, FOOT_M, FOOT_HIGH_M, ONE_COLUMN_M] = [0.04, 0.06, 0.5, 0.03, 2];
function gardentable(long, deep, high) {
  const [along, across, up] = metresIn([long, deep, high], [1, 1, 0.7]);
  const [foot, under] = [up(FOOT_HIGH_M), 1 - up(TABLE_TOP_M)];
  const middles = long > ONE_COLUMN_M ? [0.25, 0.75] : [0.5];
  const standing = (metres, at, rise) =>
    round('metal', middle(along(metres), at), middle(across(metres)), rise);
  return [
    round('joinery', [0, 1], [0, 1], [under, 1]),
    ...middles.flatMap((at) => [
      standing(COLUMN_M, at, [foot, under]),
      standing(FOOT_M, at, [0, foot]),
    ]),
  ];
}

// A SUN LOUNGER of 2 m by 0.5 m, 0.8 m high - 1.5 to 2.5 m long, built by its size (T-037.4).
// Four legs of joinery, boxes of 5 cm at its corners, up to 0.25 m; on them a frame of joinery 5
// cm thick, its whole length; on that a cushion of fabric 5 cm thick; and at its head the first
// 0.3 m of its length, a back of fabric raised from the cushion up to its top - a fifth of it at
// 1.5 m, 0.12 of it at 2.5 m. Across it and up, it is the shares of today.
const [LEG_M, HEAD_M] = [0.05, 0.3];
const [LEG_ACROSS] = sharesOf(0.5, 0.05);
const [LEGS, FRAME, CUSHION] = sharesOf(0.8, 0.25, 0.3, 0.35);
const loungerLeg = (along, across) => box('joinery', along, across, [0, LEGS]);
function lounger(long) {
  const [along] = metresIn([long], [1.5]);
  const [leg, head] = [along(LEG_M), along(HEAD_M)];
  return [
    loungerLeg([0, leg], [0, LEG_ACROSS]),
    loungerLeg([0, leg], [1 - LEG_ACROSS, 1]),
    loungerLeg([1 - leg, 1], [0, LEG_ACROSS]),
    loungerLeg([1 - leg, 1], [1 - LEG_ACROSS, 1]),
    box('joinery', [0, 1], [0, 1], [LEGS, FRAME]),
    box('fabric', [0, 1], [0, 1], [FRAME, CUSHION]),
    box('fabric', [0, head], [0, 1], [CUSHION, 1]),
  ];
}

// A PARASOL of 2.5 m by 2.5 m, 2.5 m high - 1.5 to 4 m each way, built by its size (T-037.4). A
// foot of stone, round, 0.5 m across and 0.1 m high, at its middle; on it a pole of metal, round,
// 4 cm across, up to 2.1 m; and on the pole a canopy of fabric, a dome over its whole box - an
// oval one where it is longer than deep - from 2.1 m to its top, at every size.
const [PARASOL_FOOT_M, POLE_M] = [0.5, 0.04];
const [PARASOL_FOOT, CANOPY] = sharesOf(2.5, 0.1, 2.1);
function parasol(long, deep) {
  const [along, across] = metresIn([long, deep], [1.5, 1.5]);
  const standing = (metres) => [middle(along(metres)), middle(across(metres))];
  return [
    round('stone', ...standing(PARASOL_FOOT_M), [0, PARASOL_FOOT]),
    round('metal', ...standing(POLE_M), [PARASOL_FOOT, CANOPY]),
    dome('fabric', [0, 1], [0, 1], [CANOPY, 1]),
  ];
}

// A GRILL of 0.5 m by 0.5 m, 1 m high. Four legs of metal, round, 3 cm across, 7 cm in from its
// sides, up to 0.55 m; on them a kettle of metal, a ball as wide as the grill, from 0.55 m to
// 0.97 m; and on its lid a handle of joinery, a box 12 cm long, 3 cm deep and 3 cm high.
const [KETTLE, LID] = [0.55, 0.97];
const GRILL_LEGS = [
  [0.14, 0.2],
  [0.8, 0.86],
];
const grill = [
  ...GRILL_LEGS.flatMap((along) =>
    GRILL_LEGS.map((across) => round('metal', along, across, [0, KETTLE])),
  ),
  ball('metal', [0, 1], [0, 1], [KETTLE, LID]),
  box('joinery', middle(0.24), middle(0.06), [LID, 1]),
];

/** The rule of each of these kinds: for `KINDS` of objects.js, which lifts their parts. */
export const garden = {
  bench: bySize(bench),
  gardentable: bySize(gardentable),
  lounger: bySize(lounger),
  parasol: bySize(parasol),
  ...rulesOf({ grill }),
};
