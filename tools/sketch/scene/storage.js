// Storage, as long as the sketch says (story ST-034): a cupboard, a sideboard and a shelf, each
// the few pieces of its kind, worked out anew for each object from how long its box is - for
// objects.js. Said in the words of furniture.js, `box` and `bySize`: shares of the object's own
// box as it lies while it is not turned, `along` it, `across` it - nought its back - and `up`.
// It imports furniture.js and names no global.
//
// A box is as long as its object along the object: along x where it is turned by none or by
// two quarters, along y where by one or three. That is the box that clear.js gives - cut where
// its room ends - so a cupboard that was cut has a door each half metre of what is left. What
// holds of furniture holds here (holds.js): pieces of different surfaces touch, and pieces of
// one surface - a shelf's boards and its sides - may reach into each other. No count of eight
// holds: a cupboard of 6 m is a body and twelve doors.
import { box, bySize } from './furniture.js';

// A door each half metre of a cupboard's length, with 1.5 cm between two and at either end, as
// the wardrobe's (furniture.js); the doors stand before the body, across the last of its depth
// that the pad draws (the pad's furniture.js), over a plinth of a share of its height.
const DOOR_M = 0.5;
const GAP_M = 0.015;
const BODY = 0.85;
const PLINTH = 0.04;
// A shelf is 0.35 m deep against its back, of boards and of sides 2 cm thick: five boards, at
// its foot, at its top and three between, evenly, and an upright at each whole metre between its
// two sides.
const SHELF = 0.7;
const BOARD_M = 0.02;
const BOARDS = 5;
const UPRIGHT_M = 1;

/** The pieces of a cupboard of this length: its body, and a door each half metre of it. */
function cupboard(long) {
  const count = Math.max(1, Math.floor(long / DOOR_M + 1e-9));
  const wide = (long - (count + 1) * GAP_M) / count;
  const doors = Array.from({ length: count }, (_, nth) => {
    const from = GAP_M + nth * (wide + GAP_M);
    return box('paint', [from / long, (from + wide) / long], [BODY, 1], [PLINTH, 1]);
  });
  return [box('joinery', [0, 1], [0, BODY], [0, 1]), ...doors];
}

/** The pieces of a shelf of this length and height: its two sides, an upright a metre, five boards. */
function shelf(long, deep, high) {
  const [side, board] = [BOARD_M / long, BOARD_M / high];
  const upright = (at) => box('joinery', [at - side / 2, at + side / 2], [0, SHELF], [0, 1]);
  const metres = Array.from(
    { length: Math.ceil(long / UPRIGHT_M - 1e-9) - 1 },
    (_, nth) => nth + 1,
  );
  const boards = Array.from({ length: BOARDS }, (_, nth) => {
    const from = (nth * (1 - board)) / (BOARDS - 1);
    return box('joinery', [0, 1], [0, SHELF], [from, from + board]);
  });
  return [
    box('joinery', [0, side], [0, SHELF], [0, 1]),
    box('joinery', [1 - side, 1], [0, SHELF], [0, 1]),
    ...metres.map((metre) => upright((metre * UPRIGHT_M) / long)),
    ...boards,
  ];
}

/** The rule of each kind of storage: for `KINDS` of objects.js, which lifts their parts. */
export const storage = {
  cupboard: bySize(cupboard),
  // A sideboard is a low cupboard, by the same rule.
  sideboard: bySize(cupboard),
  shelf: bySize(shelf),
};
