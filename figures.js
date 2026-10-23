// The figures of the house: how thick its walls, its floors and its roofs are, and how high a
// railing, a door, a window and a window's sill. They are settings: each holds for the whole
// house, has a default and a range, and is kept in the sketch where it differs from its default
// - `doc.figures` (story ST-024, rule 2). Here: what each is, what a sketch says of each, what a
// typed text is as one, and how one is written into a sketch. Each default is said here and
// nowhere else: shapes.js asks here how high a door and a window are. Nothing here knows a page,
// and both pages load it.
(() => {
  // Each figure: its name in a sketch, what it is, its default, and its range - the one within
  // which the house can still be built from its blocks. Metres, all of them.
  const UNIT = 'm';
  const LISTED = [
    ['outerWallM', 'how thick an outer wall is', 0.4, 0.1, 0.8],
    ['innerWallM', 'how thick an inner wall is', 0.2, 0.05, 0.5],
    ['floorSlabM', 'how thick a floor is', 0.3, 0.1, 0.6],
    ['roofSlabM', 'how thick a roof is', 0.3, 0.1, 0.8],
    ['railingHighM', 'how high a railing is', 1, 0.5, 1.5],
    ['doorHighM', "how high a door's opening is", 2.1, 1.8, 2.6],
    ['windowHighM', 'how high a window is', 1.5, 0.3, 2.5],
    ['sillHighM', "how high a window's sill lies over the floor", 0.9, 0, 1.5],
  ];
  /** By its name, in the order they are listed: `{ words, unit, default, from, to }`. */
  const FIGURES = Object.fromEntries(
    LISTED.map(([name, words, usual, from, to]) => [
      name,
      { words, unit: UNIT, default: usual, from, to },
    ]),
  );
  // What a figure is typed as: digits, with a point or a comma among them or none, and a sign
  // before them or none. Nothing else: no unit, no exponent, no blank within.
  const TYPED = /^[+-]?(\d+[.,]?\d*|[.,]\d+)$/;
  // A typed figure is taken to the centimetre.
  const PER_M = 100;

  /** Whether a figure can be this: a number within its range. */
  const holds = (name, value) =>
    Number.isFinite(value) && value >= FIGURES[name].from && value <= FIGURES[name].to;

  /**
   * Every figure as a number, by its name: the sketch's, where the sketch holds one within its
   * range, and the default for whatever else it holds, or does not. A sketch that says nothing
   * of its figures - every sketch drawn before there were any - has the eight defaults.
   */
  function of(doc) {
    const said = Object(doc?.figures);
    return Object.fromEntries(
      Object.entries(FIGURES).map(([name, figure]) => [
        name,
        holds(name, said[name]) ? said[name] : figure.default,
      ]),
    );
  }

  /**
   * What a typed text is as a figure: `{ value }`, a number within the figure's range, to the
   * centimetre - or `{ refused }`, why it is none, in words that name the range. A comma is read
   * as a point.
   */
  function typed(name, text) {
    const { words, unit, from, to } = FIGURES[name];
    const asked = String(text).trim();
    const what = `${words[0].toUpperCase()}${words.slice(1)}: a number from ${from} to ${to} ${unit}.`;
    if (!TYPED.test(asked)) return { refused: `${what} "${asked}" is none.` };
    // No zero below zero: a sill at -0 is a sill at 0.
    const value = Math.round(Number(asked.replace(',', '.')) * PER_M) / PER_M + 0;
    if (holds(name, value)) return { value };
    return { refused: `${what} ${value} ${unit} is too ${value < from ? 'little' : 'much'}.` };
  }

  /**
   * Writes a figure into a sketch: `doc.figures` then holds the figures that differ from their
   * defaults, in the order they are listed, and nothing else. A figure set to its default is
   * left out, and a `figures` that holds none is left out too: a sketch whose figures are all
   * the defaults has the bytes of one that never held a figure. What is no number within the
   * figure's range is not written: the sketch stays as it is.
   */
  function set(doc, name, value) {
    if (!holds(name, value)) return;
    const off = Object.entries({ ...of(doc), [name]: value }).filter(
      ([key, held]) => held !== FIGURES[key].default,
    );
    if (off.length > 0) doc.figures = Object.fromEntries(off);
    else delete doc.figures;
  }

  globalThis.figures = { FIGURES, of, typed, set };
})();
