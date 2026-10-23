// How a bathroom's objects look, from above and from the side: a toilet, a washbasin, a
// bathtub, a shower, a towel rail. shapes.js lists them with their sizes, and draws these shapes
// as it draws its own. From above, the back of an object is its far side until it is turned:
// there the toilet stands at the wall, there are the washbasin's tap and the shower's head, and
// there the towel rail stands. Seen from its end, the back is to the right. A bathtub and a
// shower (story ST-035), a washbasin and a towel rail (T-037.3) are drawn by their size, which
// shapes.js hands a drawing in metres: the hollow of a tub and of a washbasin, the head of a
// shower, the posts and the towel of a rail lie where the scene builds them, at any size.
(() => {
  const { SIDE, TOP, corners, WHOLE } = globalThis.shapes;
  // A tub's walls, 6 cm at its ends and 8 cm at its sides, round its hollow; a shower's head,
  // 16 cm across, its middle 0.15 m out of the corner at its back each way - in metres, as
  // scene/fittings.js has them.
  const [END_M, SIDE_M] = [0.06, 0.08];
  const [HEAD_AT_M, HEAD_M] = [0.15, 0.08];
  // A towel rail of 1.2 m, in shares down it (scene/lamps.js has it in metres): its rails at
  // 1.1 m, 0.8 m and 0.5 m, and its towel from 0.81 m down to 0.45 m. Across it, its posts of
  // 3 cm, its rails of 2 cm on their line, and before them its towel, 2 cm thick and 0.35 m wide.
  const [RAILS, TOWEL] = [
    [1.1, 0.8, 0.5],
    [0.81, 0.45],
  ].map((metres) => metres.map((one) => 1 - one / 1.2));
  const [POST, RAIL, HUNG] = [0.06, [0.01, 0.05], 0.09];
  // Along it, in metres, as scene/lamps.js has them: its posts 3 cm across, its towel 0.35 m wide
  // in its middle. A washbasin's trough as scene/fittings.js builds it: its ends 5 cm thick, its
  // drain and tap 4 cm across in its middle; and under it a door each 0.5 m or so, two at least.
  const [POST_M, TOWEL_M, BASIN_END_M, DRAIN_M, DOOR_M] = [0.03, 0.35, 0.05, 0.02, 0.5];

  Object.assign(SIDE, {
    toilet({ to, line }, across) {
      // From the front the bowl narrows to its foot; from its end it reaches forward from the
      // wall. The seat lies on it.
      if (across) to([1, 0], [0.12, 0], [0, 0.12], [0.08, 0.5], [0.4, 0.62], [0.45, 1], [1, 1]);
      else
        to([0, 0], [1, 0], [0.95, 0.4], [0.7, 0.62], [0.7, 1], [0.3, 1], [0.3, 0.62], [0.05, 0.4]);
      line([0.06, 0.07], [0.94, 0.07]);
    },
    basin({ to, line }, across, [long]) {
      // The unit under the bowl: the bowl's rim, and from the front a line between two doors.
      const doors = across ? 1 : Math.max(2, Math.round(long / DOOR_M));
      to(...WHOLE);
      line([0, 0.18], [1, 0.18]);
      for (let nth = 1; nth < doors; nth += 1) line([nth / doors, 0.18], [nth / doors, 1]);
    },
    bath({ to, line }) {
      to(...WHOLE);
      line([0, 0.08], [1, 0.08]);
    },
    shower({ to, line }, across) {
      // The glass, the tray, and the head on its pipe at the back.
      const pipe = across ? 0.85 : 0.15;
      to(...WHOLE);
      line([0, 0.97], [1, 0.97]);
      line([pipe, 0.97], [pipe, 0.08]);
      line([pipe - 0.08, 0.08], [pipe + 0.08, 0.08]);
    },
    towelrail({ to, line }, across, [long]) {
      // From the front its two posts, its three rails between them and its towel before them;
      // from its end its post to the right, and the towel before it.
      if (across) {
        to(...corners(1 - POST, 0, 1, 1));
        return to(...corners(1 - HUNG, TOWEL[0], 1 - RAIL[1], TOWEL[1]));
      }
      const [post, towel] = [POST_M / long, TOWEL_M / long / 2];
      to(...corners(0, 0, post, 1));
      to(...corners(1 - post, 0, 1, 1));
      for (const v of RAILS) line([post, v], [1 - post, v]);
      to(...corners(0.5 - towel, TOWEL[0], 0.5 + towel, TOWEL[1]));
    },
  });

  Object.assign(TOP, {
    toilet({ to, oval }) {
      // The bowl and its opening, and the part at the wall that the seat is hinged on.
      oval(0.5, 0.62, 0.38, 0.38);
      oval(0.5, 0.66, 0.24, 0.24);
      to(...corners(0.1, 0, 0.9, 0.27));
    },
    basin({ to, line, oval }, across, [long]) {
      // The bowl, a trough its ends 5 cm in, with its drain, and the tap behind it.
      const [end, drain] = [BASIN_END_M / long, DRAIN_M / long];
      to(...WHOLE);
      oval(0.5, 0.56, 0.5 - end, 0.34);
      oval(0.5, 0.56, drain, 0.05);
      line([0.5, 0.1], [0.5, 0.32]);
      oval(0.5, 0.1, drain, 0.05);
    },
    bath({ to, oval }, across, [long, deep]) {
      // The tub in its rim, and the drain at its foot: downhill, until it is turned.
      to(...WHOLE);
      oval(0.5, 0.5, 0.5 - END_M / long, 0.5 - SIDE_M / deep);
      oval(0.86, 0.5, 0.02, 0.045);
    },
    shower({ to, line, oval }, across, [long, deep]) {
      // The tray falls to the drain in its middle; the head is in a corner at the back.
      to(...WHOLE);
      line([0, 0], [1, 1]);
      line([1, 0], [0, 1]);
      oval(0.5, 0.5, 0.05, 0.05);
      oval(HEAD_AT_M / long, HEAD_AT_M / deep, HEAD_M / long, HEAD_M / deep);
    },
    towelrail({ to, oval }, across, [long]) {
      // A post at each end of its far side, its rails between them, and its towel before them.
      const [post, towel] = [POST_M / long, TOWEL_M / long / 2];
      oval(post / 2, POST / 2, post / 2, POST / 2);
      oval(1 - post / 2, POST / 2, post / 2, POST / 2);
      to(...corners(post, RAIL[0], 1 - post, RAIL[1]));
      to(...corners(0.5 - towel, RAIL[1], 0.5 + towel, HUNG));
    },
  });
})();
