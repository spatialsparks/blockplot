// How what stands in a garden looks, from above and from the side: a tree, a bush, a fountain -
// and a bench, a garden table, a sun lounger, a parasol and a grill (T-034.6). shapes.js lists
// them with their sizes, and draws these shapes as it draws its own; the first three were drawn
// there once, and are drawn here, to make room there for more kinds (T-034.1). What the five of
// T-034.6 are built of in 3D is scene/garden.js's: a piece lies on what is drawn here from above.
// The back of a bench is at its far side until it is turned, and a lounger's at its head, its
// uphill end; seen from its end, the back is to the right. A bench, a garden table, a lounger and
// a parasol take a size (ST-037): what is drawn of their pieces is drawn in metres, by the size
// that shapes.draw hands a drawing, as scene/garden.js builds them; at its kind's own size each
// is drawn as before. The tree, the bush and the fountain are drawn in shares of their box.
(() => {
  const { SIDE, TOP, corners, WHOLE } = globalThis.shapes;
  // In metres, as scene/garden.js has them. A bench 0.8 m high: its ends of 4 cm, its posts 4 cm
  // deep, its back 3 cm deep from 0.55 m up, its seat from 0.41 m to 0.45 m.
  const [END_M, POST_M, BACK_M] = [0.04, 0.04, 0.03];
  const down = (high, ...metres) => metres.map((one) => 1 - one / high);
  const [SEAT, UNDER, BACK_FROM] = down(0.8, 0.45, 0.41, 0.55);
  // A garden table: its top of 4 cm, its foot of 3 cm, 0.5 m across, its column 6 cm; one of each
  // in its middle up to 2 m long, longer two, each a quarter of its length in from its end.
  const [TABLE_TOP_M, TABLE_FOOT_M, FOOT_M, COLUMN_M, ONE_COLUMN_M] = [0.04, 0.03, 0.5, 0.06, 2];
  // A sun lounger 0.8 m high: its legs of 5 cm up to 0.25 m, its frame and its cushion of 5 cm
  // each on them, and its back, the first 0.3 m of its length.
  const [LEGS, CUSHION] = down(0.8, 0.25, 0.35);
  const [LEG_M, HEAD_M] = [0.05, 0.3];
  // A parasol 2.5 m high: its foot of stone 0.5 m across and 0.1 m high, its pole of 4 cm, its
  // canopy from 2.1 m.
  const [CANOPY, PARASOL_FOOT] = down(2.5, 2.1, 0.1);
  const [PARASOL_FOOT_M, POLE_M] = [0.5, 0.04];
  /** From the side, where something so many metres across stands, its middle at a share. */
  const standing = (metres, wide, at = 0.5) => [at - metres / wide / 2, at + metres / wide / 2];
  // A grill of 0.5 m by 0.5 m, 1 m high: its legs of 3 cm, a little in from its corners, up to
  // 0.55 m; its kettle on them up to 0.97 m; its handle of 12 cm by 3 cm on the lid.
  const [KETTLE, LID] = down(1, 0.55, 0.97);
  const GRILL_LEGS = [0.14, 0.8];
  const HANDLE = [0.38, 0.47, 0.62, 0.53];

  Object.assign(SIDE, {
    tree({ to, oval }) {
      to([0.46, 0.55], [0.54, 0.55], [0.54, 1], [0.46, 1]);
      oval(0.5, 0.34, 0.5, 0.34);
    },
    bush({ oval }) {
      oval(0.5, 1, 0.5, 1, Math.PI);
    },
    fountain({ to, oval }) {
      to([0, 0.55], [1, 0.55], [0.9, 1], [0.1, 1]);
      to([0.45, 0.2], [0.55, 0.2], [0.55, 0.55], [0.45, 0.55]);
      oval(0.5, 0.2, 0.2, 0.08);
    },
    bench({ to }, across, [long, deep]) {
      // From its end, the frame up to the seat and the post at its back, to the right; from the
      // front its two ends, the seat between them, and the back over it.
      if (across) {
        to(...corners(0, SEAT, 1, 1));
        return to(...corners(1 - POST_M / deep, 0, 1, SEAT));
      }
      const end = END_M / long;
      to(...corners(0, 0, end, 1));
      to(...corners(1 - end, 0, 1, 1));
      to(...corners(end, SEAT, 1 - end, UNDER));
      to(...corners(end, 0, 1 - end, BACK_FROM));
    },
    gardentable({ to }, across, [long, deep, high]) {
      // Its round top on its column, and the column on its foot - from the front two of each
      // where it is longer than 2 m.
      const [under, foot] = down(high, high - TABLE_TOP_M, TABLE_FOOT_M);
      const wide = across ? deep : long;
      const middles = !across && long > ONE_COLUMN_M ? [0.25, 0.75] : [0.5];
      to(...corners(0, 0, 1, under));
      for (const at of middles) {
        const [column, base] = [COLUMN_M, FOOT_M].map((metres) => standing(metres, wide, at));
        to(...corners(column[0], under, column[1], foot));
        to(...corners(base[0], foot, base[1], 1));
      }
    },
    lounger({ to }, across, [long, deep]) {
      // On its legs, the frame and the cushion, and the back raised at its head.
      const leg = LEG_M / (across ? deep : long);
      to(...corners(0, LEGS, leg, 1));
      to(...corners(1 - leg, LEGS, 1, 1));
      to(...corners(0, CUSHION, 1, LEGS));
      to(...corners(0, 0, across ? 1 : HEAD_M / long, CUSHION));
    },
    parasol({ to, oval }, across, [long, deep]) {
      // The round canopy on its pole, and the pole on its foot.
      const wide = across ? deep : long;
      const [pole, foot] = [POLE_M, PARASOL_FOOT_M].map((metres) => standing(metres, wide));
      oval(0.5, CANOPY, 0.5, CANOPY, Math.PI);
      to(...corners(pole[0], CANOPY, pole[1], PARASOL_FOOT));
      to(...corners(foot[0], PARASOL_FOOT, foot[1], 1));
    },
    grill({ to, oval }, across) {
      // The kettle on two of its four legs, and the handle on its lid.
      for (const leg of GRILL_LEGS) to(...corners(leg, KETTLE, leg + 0.06, 1));
      oval(0.5, (LID + KETTLE) / 2, 0.5, (KETTLE - LID) / 2);
      const [left, , right] = across ? [HANDLE[1], 0, HANDLE[3]] : HANDLE;
      to(...corners(left, 0, right, LID));
    },
  });

  Object.assign(TOP, {
    tree({ oval }) {
      oval(0.5, 0.5, 0.5, 0.5);
      oval(0.5, 0.5, 0.04, 0.04);
    },
    bush({ oval }) {
      oval(0.5, 0.5, 0.5, 0.5);
    },
    fountain({ oval }) {
      oval(0.5, 0.5, 0.5, 0.5);
      oval(0.5, 0.5, 0.25, 0.25);
    },
    bench({ to }, across, [long, deep]) {
      // Its two ends, the seat between them, and the back along its far side.
      const end = END_M / long;
      to(...WHOLE);
      to(...corners(end, 0, 1 - end, 1));
      to(...corners(end, 0, 1 - end, BACK_M / deep));
    },
    gardentable({ oval }) {
      // The circle of its top.
      oval(0.5, 0.5, 0.5, 0.5);
    },
    lounger({ to }, across, [long]) {
      // Its cushion, and the back at its head.
      to(...WHOLE);
      to(...corners(0, 0, HEAD_M / long, 1));
    },
    parasol({ oval }, across, [long, deep]) {
      // The circle of its canopy, and the dot of its pole.
      oval(0.5, 0.5, 0.5, 0.5);
      oval(0.5, 0.5, POLE_M / long / 2, POLE_M / deep / 2);
    },
    grill({ to, oval }) {
      // The circle of its kettle, and the handle on its lid.
      oval(0.5, 0.5, 0.5, 0.5);
      to(...corners(...HANDLE));
    },
  });
})();
