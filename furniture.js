// How furniture looks from above and from the side - a bed, a sofa, a table, a chair, a desk, a
// wardrobe, storage, the seats, three lamps and a plant - listed and drawn by shapes.js as its
// own; some by their size, each piece as thick at any size as at its own (T-035.4, T-035.7,
// T-037.3). An object's back is its far side until it is turned; seen from its end, to the right.
(() => {
  const { SIDE, TOP, corners, WHOLE } = globalThis.shapes;
  // How far down its box a seat lies, of a sofa and of a chair: 0.45 m up, of 0.8 m and of 0.9 m.
  // An arm of the sofa is 0.6 m up.
  const [SOFA_SEAT, SOFA_ARM, CHAIR_SEAT] = [0.44, 0.25, 0.5];
  // How thick the seat of a chair is, as a share of how high it stands: some 5 cm.
  const SLAB = 0.07;
  // A sofa, a corner sofa, a table and a desk by their size, each piece in metres, as the scene's
  // furniture.js and seats.js build them (T-035.7) - but a table's legs from the side, 7 cm wide
  // and 7 cm in, as they were drawn before.
  const [SOFA_BACK_M, SOFA_ARM_M, CORNER_SEAT_M, TOP_M] = [0.25, 0.2, 1, 0.0525];
  const [LEG_IN_M, LEG_M, LEG_SIDE_M] = [0.08, 0.08, 0.07];
  const [SIDE_IN_M, BOARD_M, DRAWERS_M, DESK_IN_M] = [0.045, 0.06, 0.525, 0.06];
  /** A corner sofa's places, in shares of its length and its depth. */
  const cornerOf = ([long, deep]) => ({
    end: SOFA_BACK_M / long,
    right: 1 - SOFA_ARM_M / long,
    corner: CORNER_SEAT_M / long,
    rear: SOFA_BACK_M / deep,
    middle: CORNER_SEAT_M / deep,
  });
  // A bed is drawn by its width, as scene/furniture.js builds it (T-035.4): two pillows where it
  // is 1.5 m wide or more, at these shares of its width, and one of 0.8 m where it is narrower.
  const [TWO_PILLOWS_M, PILLOW_M] = [1.5, 0.8];
  const TWO_PILLOWS = [
    [0.06, 0.46],
    [0.54, 0.94],
  ];
  // Storage is drawn in shares of its box, whatever its length: where a cupboard's doors begin,
  // across it, and over what height its plinth is - and how deep a shelf's boards are, and where
  // the three between its foot and its top lie. How many doors and uprights, scene/storage.js says.
  const [DOORS, PLINTH, BOARDS] = [0.85, 0.96, 0.7];
  const BETWEEN = [0.25, 0.5, 0.75];
  // An office chair, from the side, in shares down its 1.1 m: the foot of its back at 0.6 m, its
  // seat from 0.48 m to 0.4 m, its column down to its foot of 5 cm. From above, its back of 8 cm,
  // and its foot a circle as wide as it is, a line of so many places round, under its seat.
  const [CHAIR_BACK, OFFICE_SEAT, OFFICE_UNDER, FOOT] = [0.45, 0.56, 0.64, 0.95];
  const ROUND = 24;
  const circle = Array.from({ length: ROUND + 1 }, (_, k) => {
    const angle = (k / ROUND) * 2 * Math.PI;
    return [0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle)];
  });
  // An armchair, as scene/seats.js builds it: its arms 0.15 m, its back 0.2 m deep, its legs 5 cm,
  // in metres; down its 0.8 m the top of its arms at 0.6 m, of its seat at 0.42 m, its legs 0.1 m.
  const [ARM_M, BACK_M, ARM_TOP, SEAT_TOP, LEGS] = [0.15, 0.2, 0.25, 0.475, 0.875];
  // A wardrobe's doors, as scene/furniture.js lays them out: one each 0.75 m or so, 1.5 cm apart
  // and in at its ends, over a plinth of 8 cm. In shares of its length, the middles of its joints,
  // its two ends too, and a door's handle 7.5 cm from the joint nearer the wardrobe's middle.
  const [DOOR_M, GAP_M, HANDLE_M, PLINTH_M] = [0.75, 0.015, 0.075, 0.08];
  const jointsOf = (long, n = Math.max(1, Math.round(long / DOOR_M))) =>
    Array.from({ length: n + 1 }, (_, k) => (GAP_M / 2 + (k * (long - GAP_M)) / n) / long);
  // The lamps and the plant from the side, in shares down their height (scene/lamps.js has them
  // in metres): a floor lamp's shade down to 1.3 m of its 1.6 m, and its foot of 3 cm; a table
  // lamp's shade down to 0.25 m of its 0.5 m, and its foot of 0.2 m; a pendant lamp's bowl of
  // 0.25 m of its 1.1 m; a plant's pot of 0.35 m of its 1.2 m. A stem is 3 cm, a cord 1 cm.
  const down = (high, ...metres) => metres.map((one) => 1 - one / high);
  const [FLOOR_SHADE, FLOOR_FOOT] = down(1.6, 1.3, 0.03);
  const [TABLE_SHADE, TABLE_FOOT] = down(0.5, 0.25, 0.2);
  const [[BOWL], [RIM]] = [down(1.1, 0.25), down(1.2, 0.35)];
  const [STEM, CORD] = [0.03, 0.01];
  /** A lamp that stands, from the side: its shade, `wide` a share across, over its stem and foot. */
  const standing = ({ to }, [shade, wide], [foot, footWide]) => {
    to(...corners(0.5 - wide / 2, 0, 0.5 + wide / 2, shade));
    to(...corners(0.5 - STEM, shade, 0.5 + STEM, foot));
    to(...corners(0.5 - footWide / 2, foot, 0.5 + footWide / 2, 1));
  };
  /** A lamp from above: the circle of its shade, `wide` a share across, and the dot of its stem. */
  const fromAbove =
    (wide, stem = STEM) =>
    ({ oval }) => {
      oval(0.5, 0.5, wide / 2, wide / 2);
      oval(0.5, 0.5, stem, stem);
    };
  /** A cupboard and a sideboard: their body, the line over their plinth, and the doors' front. */
  const closed = {
    side({ to, line }, across) {
      to(...WHOLE);
      line([0, PLINTH], [1, PLINTH]);
      if (across) line([1 - DOORS, 0], [1 - DOORS, PLINTH]);
    },
    top({ to, line }) {
      to(...WHOLE);
      line([0, DOORS], [1, DOORS]);
    },
  };

  Object.assign(SIDE, {
    bed({ to }) {
      to([0, 0], [0.05, 0], [0.05, 0.5], [1, 0.5], [1, 1], [0, 1]);
      to([0.07, 0.38], [0.27, 0.38], [0.27, 0.5], [0.07, 0.5]);
    },
    sofa({ to, line }, across, [long, deep]) {
      // From its end the back, and the arm before the seat; from the front the back over the
      // seat of two cushions, between the arms.
      const [arm, back] = [SOFA_ARM_M / long, SOFA_BACK_M / deep];
      if (across) {
        to(...corners(1 - back, 0, 1, 1));
        return to(...corners(0, SOFA_ARM, 1, 1));
      }
      to(...corners(arm, 0, 1 - arm, SOFA_SEAT));
      to(...corners(arm, SOFA_SEAT, 1 - arm, 1));
      to(...corners(0, SOFA_ARM, arm, 1));
      to(...corners(1 - arm, SOFA_ARM, 1, 1));
      line([0.5, 0], [0.5, 1]);
    },
    table({ to }, across, [long, deep, high]) {
      // The top on its legs, a little in from its ends: two of the four show.
      const [slab, leg] = [TOP_M / high, LEG_SIDE_M / (across ? deep : long)];
      to(...corners(0, 0, 1, slab));
      to(...corners(leg, slab, 2 * leg, 1));
      to(...corners(1 - 2 * leg, slab, 1 - leg, 1));
    },
    chair({ to }, across) {
      // From its end the back to the right, down to the floor, with the seat and a leg before
      // it; from the front the back over the seat, and two legs.
      const under = CHAIR_SEAT + SLAB;
      if (across) {
        to(...corners(0.88, 0, 1, 1));
        to(...corners(0, CHAIR_SEAT, 0.88, under));
        return to(...corners(0.02, under, 0.12, 1));
      }
      to(...corners(0.08, 0, 0.92, CHAIR_SEAT));
      to(...corners(0, CHAIR_SEAT, 1, under));
      to(...corners(0.04, under, 0.14, 1));
      to(...corners(0.86, under, 0.96, 1));
    },
    desk({ to, line }, across, [long, deep, high]) {
      // The top; from its end one side under it, from the front a side to the left and three
      // drawers to the right, as high each as the others.
      const [slab, side, inside] = [TOP_M / high, DESK_IN_M / deep, SIDE_IN_M / long];
      to(...corners(0, 0, 1, slab));
      if (across) return to(...corners(side, slab, 1 - side, 1));
      const drawers = 1 - inside - DRAWERS_M / long;
      to(...corners(inside, slab, inside + BOARD_M / long, 1));
      to(...corners(drawers, slab, 1 - inside, 1));
      for (const v of [1, 2].map((nth) => slab + (nth * (1 - slab)) / 3)) {
        line([drawers, v], [1 - inside, v]);
      }
    },
    wardrobe({ to, line }, across, [long, , high]) {
      // On its plinth. From its end the doors, to the left; from the front a line between two
      // doors, and a handle on each: at 1.5 m at 0.45 and 0.55, as before.
      const [plinth, joints, by] = [1 - PLINTH_M / high, jointsOf(long), HANDLE_M / long];
      const handle = (k) => (2 * k + 2 < joints.length ? joints[k + 1] - by : joints[k] + by);
      to(...WHOLE);
      line([0, plinth], [1, plinth]);
      if (across) return line([0.1, 0], [0.1, plinth]);
      for (const u of joints.slice(1, -1)) line([u, 0], [u, plinth]);
      for (const u of joints.slice(1).map((_, k) => handle(k))) line([u, 0.45], [u, 0.55]);
    },
    cupboard: closed.side,
    sideboard: closed.side,
    shelf({ to, line }, across) {
      // From the front a line for each board between its foot and its top; from its end its
      // side, and before it where its boards end.
      to(...WHOLE);
      if (across) return line([1 - BOARDS, 0], [1 - BOARDS, 1]);
      for (const v of BETWEEN) line([0, v], [1, v]);
    },
    officechair({ to }, across) {
      // Its back over its seat - from its end, to the right - on its column and its foot.
      to(...(across ? corners(0.84, 0, 1, CHAIR_BACK) : corners(0, 0, 1, CHAIR_BACK)));
      to(...corners(0, OFFICE_SEAT, 1, OFFICE_UNDER));
      to(...corners(0.44, OFFICE_UNDER, 0.56, FOOT));
      to(...corners(0, FOOT, 1, 1));
    },
    armchair({ to }, across, [long, deep]) {
      // From the front its back over its seat, between its arms; from its end the back to the
      // right, and an arm before it. Under it two of its four short legs.
      const [arm, back, leg] = [ARM_M / long, BACK_M / deep, 0.05 / (across ? deep : long)];
      if (across) {
        to(...corners(1 - back, 0, 1, LEGS));
        to(...corners(0, ARM_TOP, 1 - back, LEGS));
      } else {
        to(...corners(arm, 0, 1 - arm, SEAT_TOP));
        to(...corners(arm, SEAT_TOP, 1 - arm, LEGS));
        to(...corners(0, ARM_TOP, arm, LEGS));
        to(...corners(1 - arm, ARM_TOP, 1, LEGS));
      }
      to(...corners(leg, LEGS, 2 * leg, 1));
      to(...corners(1 - 2 * leg, LEGS, 1 - leg, 1));
    },
    cornersofa({ to, line }, across, size) {
      // From its end, the back along that end, and to the right the back along its far side; from
      // the front the back over the seat, the back of its left end, its arm to the right, and
      // where its second seat comes forward.
      const { end, right, corner, rear } = cornerOf(size);
      if (across) {
        to(...corners(0, 0, 1 - rear, 1));
        return to(...corners(1 - rear, 0, 1, 1));
      }
      to(...corners(end, 0, right, SOFA_SEAT));
      to(...corners(end, SOFA_SEAT, right, 1));
      to(...corners(0, 0, end, 1));
      to(...corners(right, SOFA_ARM, 1, 1));
      line([corner, SOFA_SEAT], [corner, 1]);
    },
    floorlamp: (pen) => standing(pen, [FLOOR_SHADE, 0.8], [FLOOR_FOOT, 0.6]),
    tablelamp: (pen) => standing(pen, [TABLE_SHADE, 0.6], [TABLE_FOOT, 0.3]),
    pendant({ line, oval }) {
      // Its bowl under its cord.
      line([0.5, 0], [0.5, BOWL]);
      oval(0.5, 1, 0.4, 1 - BOWL, Math.PI);
    },
    plant({ to, oval }) {
      // Its pot under a round crown, as a tree is drawn.
      to(...corners(0.15, RIM, 0.85, 1));
      oval(0.5, RIM / 2, 0.5, RIM / 2);
    },
  });

  Object.assign(TOP, {
    bed({ to, line }, across, [, deep]) {
      // The pillows lie at the head: the uphill end, until the bed is turned. Two where it is
      // `TWO_PILLOWS_M` wide or more, else one of `PILLOW_M` across its middle.
      to(...WHOLE);
      const half = PILLOW_M / 2 / deep;
      const pillows = deep >= TWO_PILLOWS_M ? TWO_PILLOWS : [[0.5 - half, 0.5 + half]];
      for (const [from, until] of pillows) to(...corners(0.04, from, 0.22, until));
      line([0.3, 0], [0.3, 1]);
    },
    sofa({ to, line }, across, [long, deep]) {
      // The back along its far side, an arm at each end, and between them two cushions.
      const [arm, back] = [SOFA_ARM_M / long, SOFA_BACK_M / deep];
      to(...WHOLE);
      to(...corners(0, 0, 1, back));
      to(...corners(0, back, arm, 1));
      to(...corners(1 - arm, back, 1, 1));
      line([0.5, back], [0.5, 1]);
    },
    table({ to, oval }, across, [long, deep]) {
      // The top, and where its four legs stand under it.
      to(...WHOLE);
      const [middle, half] = [LEG_IN_M + LEG_M / 2, LEG_M / 2];
      for (const u of [middle / long, 1 - middle / long]) {
        for (const v of [middle / deep, 1 - middle / deep]) oval(u, v, half / long, half / deep);
      }
    },
    chair({ to }) {
      // The seat, and the back along its far side.
      to(...WHOLE);
      to(...corners(0, 0, 1, 0.16));
    },
    desk({ to, line }, across, [long]) {
      // The top, and where the drawers stand under it: to the right of whoever sits at it.
      to(...WHOLE);
      const drawers = 1 - (SIDE_IN_M + DRAWERS_M) / long;
      line([drawers, 0], [drawers, 1]);
    },
    wardrobe({ to, line }, across, [long]) {
      // Crossed out, as a unit that stands as high as a person; its doors are at its front.
      to(...WHOLE);
      line([0, 0], [1, DOORS]);
      line([1, 0], [0, DOORS]);
      line([0, DOORS], [1, DOORS]);
      for (const u of jointsOf(long).slice(1, -1)) line([u, DOORS], [u, 1]);
    },
    cupboard: closed.top,
    sideboard: closed.top,
    shelf({ to, line }) {
      // Its boards, against its back, and before them the floor it leaves free.
      to(...WHOLE);
      line([0, BOARDS], [1, BOARDS]);
    },
    officechair({ to, line }) {
      // The seat, the back along its far side, and under the seat its foot, a circle.
      to(...WHOLE);
      to(...corners(0, 0, 1, 0.16));
      line(...circle);
    },
    armchair({ to }, across, [long, deep]) {
      // The back along its far side, and an arm at each end.
      to(...WHOLE);
      to(...corners(0, 0, 1, BACK_M / deep));
      to(...corners(0, BACK_M / deep, ARM_M / long, 1));
      to(...corners(1 - ARM_M / long, BACK_M / deep, 1, 1));
    },
    cornersofa({ to }, across, size) {
      // An L: the seat along its far side, and at its left end the second that comes forward;
      // its two backs, along its far side and along its left end, and its arm at its right end.
      const { end, right, corner, rear, middle } = cornerOf(size);
      to([0, 0], [1, 0], [1, middle], [corner, middle], [corner, 1], [0, 1]);
      to(...corners(0, 0, 1, rear));
      to(...corners(0, rear, end, 1));
      to(...corners(right, rear, 1, middle));
    },
    floorlamp: fromAbove(0.8),
    tablelamp: fromAbove(0.6),
    pendant: fromAbove(0.8, CORD),
    plant({ oval }) {
      // The circle of its leaves.
      oval(0.5, 0.5, 0.5, 0.5);
    },
  });
})();
