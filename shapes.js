// The kinds of object: the parts of a house that are no block, and the things a home holds and
// that one judges size by. A kind is a row of `KINDS`, under the key a sketch names it by: its
// name, its size in metres - along the plot, across it, and up - its fill on the paper, and,
// where it does not stand on the floor, `lift`, how far over it. Every kind is listed here,
// whichever file draws it: a sketch with a kind that is not listed cannot be read. Each has a
// simple shape from above and from the side: the staircases are drawn in stairs.js, a kitchen's
// kinds in kitchen.js, a bathroom's in bathroom.js, the furniture's in furniture.js, the garden's
// in garden.js, and the person, the car, the door and the window here - object-groups.js says
// which group a kind is of. The sizes are common ones, not anybody's measurements, and on the
// floor whole cells of half a metre, so that an object fits the grid; what stands in a wall alone
// is thinner, and sits on its line.
//
// WHAT A KIND TAKES is one table, `TAKES`: for each kind that may be sized, the least and the
// most that an object of it may say in the place of its kind's own - `long`, its length, `deep`,
// its depth across it, `high`, its height - in metres; a length and a depth in whole half metres,
// a height in whole 5 cm. A kind that `TAKES` has no row for takes nothing, and a sketch with a
// size its kind does not take cannot be read, as one with a kind it does not know. A staircase
// may say a length of its own (ST-037); one that says none is as long as its flight, worked out
// from its height - the fewest steps of which none rises more than `RISE_M`, each `GOING_M`
// deep, rounded up to a whole half metre - and never stored.
(() => {
  const KINDS = {
    person: { name: 'Person', size: [0.5, 0.5, 1.8], fill: '#eceff2' },
    bed: { name: 'Bed', size: [2, 2, 1], fill: '#eceff2' },
    car: { name: 'Car', size: [4.5, 2, 1.5], fill: '#eceff2' },
    tree: { name: 'Tree', size: [6, 6, 8], fill: '#cfe8c5' },
    bush: { name: 'Bush', size: [1.5, 1.5, 1.2], fill: '#cfe8c5' },
    fountain: { name: 'Fountain', size: [2, 2, 1], fill: '#cfe3f5' },
    stairs: { name: 'Staircase, one storey', size: [4.5, 1, 3], fill: '#eceff2' },
    widestairs: { name: 'Wide staircase, one storey', size: [4.5, 1.5, 3], fill: '#eceff2' },
    spiral: { name: 'Spiral staircase, one storey', size: [2, 2, 3], fill: '#eceff2' },
    // How high these two are, and how far a window is lifted, the sketch says: below the list.
    door: { name: 'Door', fill: '#f3e3cf' },
    window: { name: 'Window', fill: '#d9ecf7' },
    // A worktop is 0.9 m up, and a hob and a sink lie on one: of the sink, the tap shows.
    island: { name: 'Kitchen island', size: [2.5, 1, 0.9], fill: '#efe6d8' },
    counter: { name: 'Kitchen counter', size: [2.5, 0.5, 0.9], fill: '#efe6d8' },
    hob: { name: 'Hob', size: [0.5, 0.5, 0.1], lift: 0.9, fill: '#dde2e7' },
    sink: { name: 'Sink', size: [1, 0.5, 0.3], lift: 0.9, fill: '#dde2e7' },
    fridge: { name: 'Fridge', size: [0.5, 0.5, 2], fill: '#eceff2' },
    // A washbasin is the bowl on the unit under it; a shower is its tray and the glass round it.
    toilet: { name: 'Toilet', size: [0.5, 0.5, 0.4], fill: '#f7f9fa' },
    basin: { name: 'Washbasin', size: [0.5, 0.5, 0.85], fill: '#f7f9fa' },
    bath: { name: 'Bathtub', size: [2, 1, 0.6], fill: '#f7f9fa' },
    shower: { name: 'Shower', size: [1, 1, 2], fill: '#d9ecf7' },
    // Furniture. A sofa's seat is 0.45 m up, and a chair's; a table and a desk are 0.75 m high.
    sofa: { name: 'Sofa', size: [2, 1, 0.8], fill: '#eceff2' },
    table: { name: 'Table', size: [2, 1, 0.75], fill: '#efe6d8' },
    chair: { name: 'Chair', size: [0.5, 0.5, 0.9], fill: '#efe6d8' },
    desk: { name: 'Desk', size: [1.5, 1, 0.75], fill: '#efe6d8' },
    wardrobe: { name: 'Wardrobe', size: [1.5, 0.5, 2], fill: '#efe6d8' },
    // Storage: as long as the sketch says, from half a metre to six.
    cupboard: { name: 'Cupboard', size: [1, 0.5, 2], fill: '#efe6d8' },
    sideboard: { name: 'Sideboard', size: [1.5, 0.5, 0.8], fill: '#efe6d8' },
    shelf: { name: 'Shelf', size: [1, 0.5, 2], fill: '#efe6d8' },
    officechair: { name: 'Office chair', size: [0.5, 0.5, 1.1], fill: '#eceff2' },
    armchair: { name: 'Armchair', size: [1, 1, 0.8], fill: '#eceff2' },
    cornersofa: { name: 'Corner sofa', size: [3, 2, 0.8], fill: '#eceff2' },
    // A table lamp stands at a table's height; a pendant hangs from 1.6 m, its cord up to 2.7 m.
    floorlamp: { name: 'Floor lamp', size: [0.5, 0.5, 1.6], fill: '#eceff2' },
    tablelamp: { name: 'Table lamp', size: [0.5, 0.5, 0.5], lift: 0.75, fill: '#eceff2' },
    pendant: { name: 'Pendant lamp', size: [0.5, 0.5, 1.1], lift: 1.6, fill: '#eceff2' },
    plant: { name: 'Plant', size: [0.5, 0.5, 1.2], fill: '#cfe8c5' },
    towelrail: { name: 'Towel rail', size: [0.5, 0.5, 1.2], fill: '#f7f9fa' },
    // The garden's: a bench's seat is 0.45 m up; a parasol's canopy from 2.1 m; a grill a hob's.
    bench: { name: 'Bench', size: [1.5, 0.5, 0.8], fill: '#efe6d8' },
    gardentable: { name: 'Garden table', size: [1, 1, 0.75], fill: '#efe6d8' },
    lounger: { name: 'Sun lounger', size: [2, 0.5, 0.8], fill: '#efe6d8' },
    parasol: { name: 'Parasol', size: [2.5, 2.5, 2.5], fill: '#eceff2' },
    grill: { name: 'Grill', size: [0.5, 0.5, 1], fill: '#dde2e7' },
  };
  // What each kind that may be sized takes, by the stories' tables (ST-035, ST-037): `[from, to]`.
  const TAKES = {
    stairs: { long: [2, 8], deep: [1, 2], high: [2, 4.5] },
    widestairs: { long: [2, 8], deep: [1, 2], high: [2, 4.5] },
    spiral: { high: [2, 4.5] },
    island: { long: [1, 5], deep: [1, 1.5], high: [0.85, 1.1] },
    counter: { long: [0.5, 6], high: [0.85, 1.1] },
    bath: { long: [1.5, 2], deep: [1, 1.5] },
    shower: { long: [1, 2], deep: [1, 2] },
    bed: { deep: [1, 2] },
    sofa: { long: [1.5, 4], deep: [1, 1.5] },
    cornersofa: { long: [2, 4], deep: [1.5, 3] },
    table: { long: [1, 4], deep: [1, 1.5], high: [0.7, 1.1] },
    desk: { long: [1, 3], deep: [0.5, 1], high: [0.65, 1.25] },
    cupboard: { long: [0.5, 6], high: [1, 2.5] },
    sideboard: { long: [0.5, 6], high: [0.5, 1.2] },
    shelf: { long: [0.5, 6], high: [0.5, 2.5] },
    wardrobe: { long: [0.5, 6], high: [1, 2.5] },
    basin: { long: [0.5, 2] },
    sink: { long: [0.5, 2] },
    fridge: { long: [0.5, 1] },
    towelrail: { long: [0.5, 1.5] },
    bench: { long: [1, 4] },
    lounger: { long: [1.5, 2.5] },
    armchair: { long: [1, 1.5], deep: [1, 1.5] },
    gardentable: { long: [1, 4], deep: [1, 2], high: [0.7, 1.1] },
    fountain: { long: [1, 6], deep: [1, 6] },
    parasol: { long: [1.5, 4], deep: [1.5, 4] },
    bush: { long: [0.5, 4], deep: [0.5, 4], high: [0.5, 3] },
    tree: { long: [2, 12], deep: [2, 12], high: [3, 25] },
  };
  // A size is a whole step of its field: half a metre of a length and a depth, 5 cm of a height -
  // that one up to the noise of a figure worked out in binary.
  const halves = (metres) => Number.isInteger(2 * metres);
  const fives = (metres) => Math.abs(20 * metres - Math.round(20 * metres)) < 1e-9;
  const WHOLE_STEP = { long: halves, deep: halves, high: fives };
  // A staircase's flight: the most a step rises - `RISE_M` of the scene's steps.js, said a second
  // time, as `TURNS` is; whoever changes one changes the other - and how deep a step is.
  const [RISE_M, GOING_M] = [0.19, 0.28];
  const FLIGHTS = ['stairs', 'widestairs'];
  // A figure worked out is off by its last digit: within this, a height is a whole number of rises.
  const HAIR = 1e-9;
  /** A flight's length in metres, by its height: its steps' run, rounded up to a half metre. */
  const flightOf = (high) => Math.ceil(2 * GOING_M * Math.ceil(high / RISE_M - HAIR) - HAIR) / 2;

  // A door is as high as the sketch says the opening of a door is, and a window as high as it
  // says a window is, with its sill as far over the floor: figures of the sketch that the pad
  // holds (figures.js, which says each default), asked whenever a size is asked for - so that a
  // figure that was changed shows in every view at once.
  // ponytail: all eight figures are read for the one; one alone if a layer of hundreds of windows drags
  const figure = (name) => globalThis.figures.of(globalThis.sketch?.doc)[name];
  const asked = (get) => ({ get, enumerable: true });
  Object.defineProperties(KINDS.door, { size: asked(() => [1, 1, figure('doorHighM')]) });
  Object.defineProperties(KINDS.window, {
    size: asked(() => [1.5, 0.3, figure('windowHighM')]),
    lift: asked(() => figure('sillHighM')),
  });

  /** How an object is turned: by quarters, clockwise from above. A sketch of before says `turned`. */
  const turnOf = (t) => (Number.isInteger(t.turn) ? t.turn % 4 : t.turned ? 1 : 0);

  /**
   * The size of an object in metres: along the plot, across it, up. Each is the object's own where
   * it says one, else its kind's - but a staircase that says no length is as long as its flight.
   * By a quarter it lies across.
   */
  function sizeOf(t) {
    const [ownLong, ownDeep, ownHigh] = KINDS[t.kind].size;
    const [deep, high] = [t.deep ?? ownDeep, t.high ?? ownHigh];
    const long = t.long ?? (FLIGHTS.includes(t.kind) ? flightOf(high) : ownLong);
    return turnOf(t) % 2 === 1 ? [deep, long, high] : [long, deep, high];
  }

  /** Whether the pad reads an object as it says itself: a kind it has, of sizes its kind takes. */
  function known(t) {
    if (!Object.hasOwn(KINDS, t.kind)) return false;
    const takes = Object.hasOwn(TAKES, t.kind) ? TAKES[t.kind] : {};
    return Object.keys(WHOLE_STEP).every((field) => {
      const [metres, range] = [t[field], takes[field]];
      if (metres === undefined) return true;
      if (typeof metres !== 'number' || !range || !WHOLE_STEP[field](metres)) return false;
      return range[0] <= metres && metres <= range[1];
    });
  }

  // A shape is drawn into a box one wide and one high, its top left corner at (0, 0), as the
  // object lies when it is not turned: `to` draws places joined into a filled shape, `line` an
  // open line through them, `oval` an oval by its middle and its two radii. From the side,
  // `across` says that the object is seen from its end.
  /** A part of the box, for `to`: its corners, from its left and top to its right and bottom. */
  const corners = (left, top, right, bottom) => [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
  ];
  const WHOLE = corners(0, 0, 1, 1);
  const SIDE = {
    person({ to, oval }) {
      oval(0.5, 0.07, 0.22, 0.07);
      to(
        [0.1, 0.17],
        [0.9, 0.17],
        [0.8, 0.55],
        [0.7, 1],
        [0.55, 1],
        [0.5, 0.62],
        [0.45, 1],
        [0.3, 1],
        [0.2, 0.55],
      );
    },
    car({ to, oval }) {
      to(
        [0, 0.55],
        [0.22, 0.45],
        [0.34, 0.08],
        [0.7, 0.08],
        [0.86, 0.45],
        [1, 0.55],
        [1, 0.85],
        [0, 0.85],
      );
      oval(0.2, 0.83, 0.075, 0.17);
      oval(0.8, 0.83, 0.075, 0.17);
    },
    door({ to, oval }) {
      to([0.05, 0], [0.95, 0], [0.95, 1], [0.05, 1]);
      oval(0.8, 0.52, 0.04, 0.02);
    },
    window({ to, line }) {
      to(...WHOLE);
      line([0.5, 0], [0.5, 1]);
      line([0, 0.5], [1, 0.5]);
    },
  };
  const TOP = {
    person({ oval }) {
      oval(0.5, 0.5, 0.5, 0.3);
      oval(0.5, 0.5, 0.22, 0.22);
    },
    car({ to }) {
      to([0.03, 0], [0.97, 0], [1, 0.15], [1, 0.85], [0.97, 1], [0.03, 1], [0, 0.85], [0, 0.15]);
      to([0.3, 0.1], [0.3, 0.9], [0.72, 0.9], [0.72, 0.1]);
    },
    door({ line }) {
      // The leaf stands open at its hinge, and the arc is the way it swings shut.
      const swing = Array.from({ length: 9 }, (_, k) => {
        const angle = (k / 8) * (Math.PI / 2);
        return [Math.sin(angle), 1 - Math.cos(angle)];
      });
      line([0, 1], [0, 0]);
      line(...swing);
    },
    window({ to, line }) {
      to(...WHOLE);
      line([0, 0.5], [1, 0.5]);
    },
  };

  // Where a place of a shape comes to lie once the object is turned by quarters, from above; from
  // the side a half turn shows it the other way round.
  const TURNS = [
    ([u, v]) => [u, v],
    ([u, v]) => [1 - v, u],
    ([u, v]) => [1 - u, 1 - v],
    ([u, v]) => [v, 1 - u],
  ];

  /**
   * Draws an object's shape into its box on the paper of a plane, `view`: 'top', 'side' or 'end'.
   * `ctx` is the canvas, its unit a cell, and `hair` the width of a thin line in that unit. The
   * shape is filled lightly and drawn in `ink`. A drawing is given the pen, whether it is seen
   * from its end, and the object's size as it lies unturned: `[long, deep, high]` in metres.
   */
  function draw(ctx, thing, view, [left, top, right, bottom], ink, hair) {
    // The paper of a slice across the plot is seen from uphill: for an object, that is a quarter
    // on from the side the paper of a slice along the plot is seen from.
    const turn = (turnOf(thing) + (view === 'end' ? 3 : 0)) % 4;
    const across = turn % 2 === 1;
    const turned = view === 'top' ? TURNS[turn] : TURNS[turn >= 2 ? 2 : 0];
    const place = (at) => {
      const [u, v] = view === 'top' ? turned(at) : [turned(at)[0], at[1]];
      return [left + u * (right - left), top + v * (bottom - top)];
    };
    ctx.fillStyle = KINDS[thing.kind].fill;
    ctx.strokeStyle = ink;
    ctx.lineWidth = hair;
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    const through = (places) => {
      ctx.beginPath();
      for (const at of places) ctx.lineTo(...place(at));
    };
    const pen = {
      to(...places) {
        through(places);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      },
      line(...places) {
        through(places);
        ctx.stroke();
      },
      oval(u, v, wide, high, from = 0) {
        const lying = view === 'top' && across;
        const radii = lying ? [high, wide] : [wide, high];
        ctx.beginPath();
        ctx.ellipse(
          ...place([u, v]),
          radii[0] * (right - left),
          radii[1] * (bottom - top),
          0,
          from,
          2 * Math.PI,
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      },
    };
    (view === 'top' ? TOP : SIDE)[thing.kind](pen, across, sizeOf({ ...thing, turn: 0 }));
  }

  // SIDE and TOP are for the files that draw more kinds: each adds its shapes to them.
  const sizes = { TAKES, RISE_M, FLIGHTS, sizeOf, known };
  globalThis.shapes = { KINDS, SIDE, TOP, corners, WHOLE, turnOf, draw, ...sizes };
})();
