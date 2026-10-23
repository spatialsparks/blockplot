// Furniture: an object as the simple shape of its kind - a bed with its mattress and one pillow or
// two by its width, a table on its legs (story ST-024) - for objects.js. Here: how a shape is said,
// the furniture of a room, what stands outside to judge size by, and a door and a window that
// open no wall. The kitchen's and the bathroom's are fittings.js's. It imports nothing and names
// no global.
//
// HOW A SHAPE IS SAID. A kind is a few pieces, each a box - or, for what is round, a `round`, a
// `ball` or a `dome` (parts.js) - of one surface, given in shares of the object's own box as
// the object lies while it is not turned, each as [where the piece begins, where it ends]:
// - `along` its length, counted down the plot: nought is its uphill end, the left of the pad's
//   top view;
// - `across` it, counted as the rows of that view are: nought is its far side, the top of the
//   paper - the back of an object (the pad's kitchen.js) - and one is its front;
// - `up`, nought being its foot.
// So `along` and `across` are the two figures a place has in `TOP` of the pad's shapes.js: a
// piece lies on the symbol that the top view draws. A share is no size. How large a kind is, the
// pad says (`KINDS` of shapes.js), and a piece is as large as its shares of that: the metres
// beside a kind here are those of its size today. A rule module of objects says its pieces in
// these words - `box`, `round`, `ball` and `dome` - as fittings.js does, and has its rules of
// `rulesOf`; `ruleOf` is the rule of one list of pieces, for a rule that works its pieces out.
// A rule that builds its pieces by its object's size uses `bySize`: it is told the object's box
// in metres, and says the pieces in shares of it - the bed, the sofa, the table, the desk, the
// wardrobe and the fountain (T-037.3).
//
// HOW IT IS TURNED. By quarters, clockwise seen from above, as the top view turns the symbol:
// `TURNS` of shapes.js, said here a second time. The check of this module and the check of
// fittings.js have the pad draw every kind at every quarter, and fail where a piece does not
// lie on what the pad draws: who changes one changes the other.
//
// WHAT HOLDS. No two pieces of different surfaces lie in each other (holds.js): where they meet
// they touch, and say so with one figure - a mattress begins `up` where its base ends. Pieces of
// one surface may reach into each other. Nothing is cut out of anything (story, rule 4): what is
// hollow is built of its walls. And a kind is told by its outline: eight pieces are many, and
// none that tells a kind is of glass, which hides a fifth of what is behind it (surfaces.js).
// What is of wood, here and in fittings.js, is `joinery`: `wood` is a floor's, and a table of
// its floor's own surface would show on it by its shadow alone.

// Where a place of a shape comes to lie once its object is turned by quarters: its two shares,
// along and across, as two shares of the box as that lies then - down the plot, and down the
// paper of the top view.
const TURNS = [
  ([along, across]) => [along, across],
  ([along, across]) => [1 - across, along],
  ([along, across]) => [1 - along, 1 - across],
  ([along, across]) => [across, 1 - along],
];

/** How many quarters an object is turned by, none to three: four of them are none. */
const quartersOf = ({ turn }) => ((turn % 4) + 4) % 4;

/**
 * A place a share of the way on between two: the first at nought and the second at one, to the
 * last figure - a piece that reaches the side of its object ends on it. Two pieces that meet in
 * a share work the place out alike, and so have one number for it: they touch.
 */
const between = (first, second, share) => (1 - share) * first + share * second;

/** A way to say a piece of a shape: its surface, and where it lies along, across and up. */
const said = (shape) => (surface, along, across, up) => ({ shape, surface, along, across, up });
/** A piece that is a box. */
export const box = said('box');
/** A piece that is round: an upright cylinder, which fills its box side to side. */
export const round = said('round');
export const ball = said('ball');
export const dome = said('dome');

/**
 * The rule of a kind that is these pieces: each put into the box of the object, in metres,
 * turned as the object is - a part, which objects.js then lifts.
 */
export const ruleOf = (pieces) => (context, at) => {
  const thing = context.things[at];
  const { min, max } = context.boxOf(thing);
  const turned = TURNS[quartersOf(thing)];
  const x = (share) => between(min[0], max[0], share);
  // A row of the top view counts down its paper: nought across is the largest y.
  const y = (share) => between(max[1], min[1], share);
  const h = (share) => between(min[2], max[2], share);
  return pieces.map(({ shape, surface, along, across, up }) => {
    const ends = [0, 1].map((end) => turned([along[end], across[end]]));
    const [down, over] = [0, 1].map((share) => ends.map((end) => end[share]));
    return {
      of: 'piece',
      shape,
      min: [x(Math.min(...down)), y(Math.max(...over)), h(up[0])],
      max: [x(Math.max(...down)), y(Math.min(...over)), h(up[1])],
      surface,
    };
  });
};

/**
 * A rule whose pieces are worked out from the object's box: `piecesOf(long, deep, high)`, in
 * metres - `long` along the object, `deep` across it and `high` up, as it lies unturned: along x
 * where it is turned by none or by two quarters, along y where by one or three.
 */
export const bySize = (piecesOf) => (context, at) => {
  const thing = context.things[at];
  const { min, max } = context.boxOf(thing);
  const way = quartersOf(thing) % 2;
  const metres = (axis) => max[axis] - min[axis];
  return ruleOf(piecesOf(metres(way), metres(1 - way), metres(2)))(context, at);
};

/** The rule of each kind, by the pieces each kind is said in: a list for `KINDS` of objects.js. */
export const rulesOf = (shapes) =>
  Object.fromEntries(Object.entries(shapes).map(([kind, pieces]) => [kind, ruleOf(pieces)]));

// THE FURNITURE OF A ROOM.
// A bed 2 m long, 1 m high at its head, and as wide as its object is deep: 1 to 2 m (T-035.4).
// A head of 8 cm and a base 0.3 m high, both of wood and its whole width; on the base a mattress
// of 0.2 m, 4 cm in at its foot and at either side; and on that, at its head, pillows of 12 cm,
// 0.36 m long, where the pad draws them. Two where it is `TWO_PILLOWS_M` wide or more, in the
// shares of its width they have at 2 m: there each is 0.8 m, 12 cm in from its side; at 1.5 m
// each is 0.6 m. Narrower, one of 0.8 m across its middle: at 1 m it runs from 0.1 m to 0.9 m
// across, over a mattress of 0.92 m. At 2 m it is the five pieces it was before it had a width.
// A bed cut narrower than 1 m by its room (clear.js) keeps a tenth of what is left either side of
// its pillow, and its mattress no more than a tenth in. The head is what the pad's side view has.
const TWO_PILLOWS_M = 1.5;
const [PILLOW_M, MATTRESS_IN_M] = [0.8, 0.04];
function bed(long, deep) {
  const [half, inside] = [Math.min(PILLOW_M / 2 / deep, 0.4), Math.min(MATTRESS_IN_M / deep, 0.1)];
  const pillows =
    deep >= TWO_PILLOWS_M
      ? [
          [0.06, 0.46],
          [0.54, 0.94],
        ]
      : [[0.5 - half, 0.5 + half]];
  return [
    box('joinery', [0, 0.04], [0, 1], [0, 1]),
    box('joinery', [0.04, 1], [0, 1], [0, 0.3]),
    box('fabric', [0.04, 0.98], [inside, 1 - inside], [0.3, 0.5]),
    ...pillows.map((across) => box('fabric', [0.04, 0.22], across, [0.5, 0.62])),
  ];
}

// Sofas, tables, desks, wardrobes and fountains are built by their size (T-035.7, T-037.3), each
// piece as thick in metres at every size as at its kind's own. One cut by its room (clear.js)
// smaller than its kind's least size is laid out in shares of that least size, so that no piece
// leaves the box it is given: `least` says that size, along, across and up - the pad's `TAKES` of
// shapes.js, said a second time - and `sharesOf` gives, for each way, the share that a piece of
// so many metres is.
const sharesOf = (size, least) =>
  size.map((metres, way) => (piece) => piece / Math.max(metres, least[way]));

// A sofa of 2 m by 1 m, 0.8 m high, all of it fabric - 1.5 to 4 m long and 1 to 1.5 m deep: a
// back 0.25 m deep along its far side, as high as the sofa; an arm 0.2 m wide and 0.6 m high at
// each end, from the back to its front; and between the arms a seat 0.45 m up, from the back to
// its front. Its heights are shares of its 0.8 m. At 1.5 m by 1 m its seat is 1.1 m by 0.75 m; at
// 4 m by 1.5 m, 3.6 m by 1.25 m.
const [SOFA_BACK_M, SOFA_ARM_M] = [0.25, 0.2];
function sofa(long, deep) {
  const [along, across] = sharesOf([long, deep], [1.5, 1]);
  const [arm, back] = [along(SOFA_ARM_M), across(SOFA_BACK_M)];
  return [
    box('fabric', [arm, 1 - arm], [back, 1], [0, 0.56]),
    box('fabric', [0, 1], [0, back], [0, 1]),
    box('fabric', [0, arm], [back, 1], [0, 0.75]),
    box('fabric', [1 - arm, 1], [back, 1], [0, 0.75]),
  ];
}

// A table of 2 m by 1 m, 0.75 m high - 1 to 4 m long, 1 to 1.5 m deep, 0.7 to 1.1 m high: a top
// 0.0525 m thick, and four round legs 8 cm across, each 8 cm in from its end and from its side,
// up to the top - where the pad draws them. At 1 m by 1 m by 0.7 m its legs fill a square of
// 0.84 m, outside to outside, and are 0.6475 m high; at 4 m by 1.5 m by 1.1 m they fill 3.84 m
// by 1.34 m, and are 1.0475 m high.
const [TOP_M, LEG_IN_M, LEG_M] = [0.0525, 0.08, 0.08];
function table(long, deep, high) {
  const [along, across, up] = sharesOf([long, deep, high], [1, 1, 0.7]);
  const under = 1 - up(TOP_M);
  const ends = (share) => [
    [share(LEG_IN_M), share(LEG_IN_M + LEG_M)],
    [1 - share(LEG_IN_M + LEG_M), 1 - share(LEG_IN_M)],
  ];
  const legs = ends(along).flatMap((end) => ends(across).map((side) => [end, side]));
  return [
    box('joinery', [0, 1], [0, 1], [under, 1]),
    ...legs.map(([end, side]) => round('joinery', end, side, [0, under])),
  ];
}

// A chair of 0.5 m by 0.5 m, 0.9 m high: a seat 0.45 m up, on it a back of 8 cm along its far
// side, and under it four legs of 5 cm, each 2 cm in.
const chair = [
  box('joinery', [0, 1], [0, 1], [0.43, 0.5]),
  box('joinery', [0, 1], [0, 0.16], [0.5, 1]),
  box('joinery', [0.04, 0.14], [0.04, 0.14], [0, 0.43]),
  box('joinery', [0.04, 0.14], [0.86, 0.96], [0, 0.43]),
  box('joinery', [0.86, 0.96], [0.04, 0.14], [0, 0.43]),
  box('joinery', [0.86, 0.96], [0.86, 0.96], [0, 0.43]),
];

// A desk of 1.5 m by 1 m, 0.75 m high - 1 to 3 m long, 0.5 to 1 m deep, 0.65 to 1.25 m high: a
// top 0.0525 m thick on its two sides, each 6 cm in from its back and its front, from the floor
// to the top - at its left end a board 6 cm thick, 4.5 cm in from that end, and at its right end,
// to the right of whoever sits at it and looks at its far side, drawers 0.525 m wide, ending
// 4.5 cm in from that end. At 1 m long the two stand 0.325 m apart; at 3 m, 2.325 m.
const [SIDE_IN_M, BOARD_M, DRAWERS_M, DESK_IN_M] = [0.045, 0.06, 0.525, 0.06];
function desk(long, deep, high) {
  const [along, across, up] = sharesOf([long, deep, high], [1, 0.5, 0.65]);
  const [under, sides] = [1 - up(TOP_M), [across(DESK_IN_M), 1 - across(DESK_IN_M)]];
  return [
    box('joinery', [0, 1], [0, 1], [under, 1]),
    box('joinery', [along(SIDE_IN_M), along(SIDE_IN_M + BOARD_M)], sides, [0, under]),
    box('joinery', [1 - along(SIDE_IN_M + DRAWERS_M), 1 - along(SIDE_IN_M)], sides, [0, under]),
  ];
}

// A wardrobe of 1.5 m by 0.5 m, 2 m high - 0.5 to 6 m long, 1 to 2.5 m high: a body of joinery its
// whole length and height, across to 0.85 of its depth; before it, over a plinth of 8 cm, doors of
// paint up to its top, one each 0.75 m or so - `Math.max(1, Math.round(long / 0.75))` - evenly,
// 1.5 cm between two and at each end, as a cupboard's (storage.js): 1 at 0.5 and 1 m, 2 at 1.5 m -
// today's three pieces - 3 at 2 and 2.5 m, 4 at 3 m, 8 at 6 m. A door is 0.47 m wide at 0.5 m,
// 0.73125 m at 3 m. One cut by its room shorter than 0.5 m is laid out on 0.5 m: one door.
const [DOOR_M, GAP_M, PLINTH_M, DOORS] = [0.75, 0.015, 0.08, 0.85];
function wardrobe(long, deep, high) {
  const [along, , up] = sharesOf([long, deep, high], [0.5, 0.5, 1]);
  const metres = Math.max(long, 0.5);
  const count = Math.max(1, Math.round(metres / DOOR_M));
  const wide = (metres - (count + 1) * GAP_M) / count;
  const doors = Array.from({ length: count }, (_, nth) => {
    const from = GAP_M + nth * (wide + GAP_M);
    return box('paint', [along(from), along(from + wide)], [DOORS, 1], [up(PLINTH_M), 1]);
  });
  return [box('joinery', [0, 1], [0, DOORS], [0, 1]), ...doors];
}

// WHAT STANDS OUTSIDE, TO JUDGE SIZE BY.
// A person of 1.8 m: a round body 0.5 m across the shoulders and 0.3 m deep, and on it a head -
// a figure of one surface, as one in a model of card is.
const person = [
  round('fabric', [0, 1], [0.2, 0.8], [0, 0.86]),
  ball('fabric', [0.28, 0.72], [0.28, 0.72], [0.86, 1]),
];

// A car of 4.5 m by 2 m, 1.5 m high: a body of paint 0.22 m off the ground, on it a cabin where
// the pad draws the cabin - of paint too, and no glass: a cabin that is seen through is not seen
// at a glance - and four wheels of 0.63 m, beside the body, for what is of another surface may
// not lie in it.
const car = [
  box('paint', [0, 1], [0.07, 0.93], [0.15, 0.5]),
  box('paint', [0.3, 0.72], [0.1, 0.9], [0.5, 0.92]),
  ball('metal', [0.13, 0.27], [0, 0.07], [0, 0.42]),
  ball('metal', [0.13, 0.27], [0.93, 1], [0, 0.42]),
  ball('metal', [0.73, 0.87], [0, 0.07], [0, 0.42]),
  ball('metal', [0.73, 0.87], [0.93, 1], [0, 0.42]),
];

// A fountain of 2 m by 2 m, 1 m high - 1 to 6 m each way: a round basin of stone over its whole
// box, 0.42 m high; water in it - a round one 3 cm thick that lies on it, 12 cm in from every side,
// for no basin is hollowed out; and in its middle a column 0.2 m across, up to 0.72 m, that bears
// a bowl 0.16 m thick, half its length and half its depth, where the pad draws its inner ring (the
// pad's garden.js) - so that drawing does not change with its size. Its water is 0.76 m across at
// 1 m by 1 m, 1.76 m at 2 m, and 5.76 m by 2.76 m at 6 m by 3 m; its bowl 3 m by 1.5 m there.
const [WATER_IN_M, COLUMN_M] = [0.12, 0.2];
function fountain(long, deep) {
  const [along, across] = sharesOf([long, deep], [1, 1]);
  const inside = (share) => [share(WATER_IN_M), 1 - share(WATER_IN_M)];
  const column = (share) => [0.5 - share(COLUMN_M) / 2, 0.5 + share(COLUMN_M) / 2];
  return [
    round('stone', [0, 1], [0, 1], [0, 0.42]),
    round('water', inside(along), inside(across), [0.42, 0.45]),
    round('stone', column(along), column(across), [0.45, 0.72]),
    round('stone', [0.25, 0.75], [0.25, 0.75], [0.72, 0.88]),
  ];
}

/** The rule of each of these kinds: for `KINDS` of objects.js, which lifts their parts. */
export const furniture = {
  bed: bySize(bed),
  sofa: bySize(sofa),
  table: bySize(table),
  chair: ruleOf(chair),
  desk: bySize(desk),
  wardrobe: bySize(wardrobe),
  ...rulesOf({ person, car }),
  fountain: bySize(fountain),
  ...rulesOf({
    // A DOOR AND A WINDOW THAT OPEN NO WALL. One that opens a wall gives no part: the opening is
    // its wall's (openings.js). One that stands in none is what it is without a wall. A door: its
    // leaf of 5 cm, shut - along the edge of its square that the pad swings it to.
    door: [box('joinery', [0, 1], [0.95, 1], [0, 1])],
    // A window: its pane, some 4 cm thick as a pane in a wall is, where the pad draws its line.
    window: [box('glass', [0, 1], [0.43, 0.57], [0, 1])],
  }),
};
