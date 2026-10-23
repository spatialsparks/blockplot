// The sketch pad's made-up site: a plot that does not exist, for the browser tests, for a look
// at the pad, and for whoever wants the pad without the real plot. `pnpm sketch --demo` serves
// this file where the page asks for site.js. It has the shape site.js has and nothing of what
// site.js holds: every figure and every name here was invented for this file, and written by
// hand. Metres in the plot's own frame: x runs downhill along the plot, y across it. Heights are
// metres above sea level. `ground` has a height at every grid point of the paper: a text a row,
// from y = yToM down to yFromM, and in it from x = xFromM on a height every cell, in centimetres
// over `baseM`. `sideM` is what the side view shows, from its bottom to its top. That shape, but
// for the point where the house of today stands: site.js still holds it, and nothing reads it.
(() => {
  // The cell is the pad's own, half a metre, here as in site.js: every other figure was invented.
  const CELL_M = 0.5;
  // The paper: 46 m down the plot and 31 m across it - 92 cells by 62.
  const [X_FROM_M, X_TO_M] = [-4, 42];
  const [Y_FROM_M, Y_TO_M] = [-3, 28];
  // What the standing views show: 20 m, 40 cells.
  const SIDE_M = [806, 826];
  // The ground is a plane. At the paper's uphill corner, x = -4 and y = 28, it lies 820 m above
  // sea level: 1400 cm over the bottom of the side view. From there it falls 0.2 m with every
  // metre down the plot and 0.04 m with every metre across it, towards y = -3: 10 cm and 2 cm a
  // cell. So it is lowest at the corner opposite, x = 42 and y = -3: 1400 - 92 * 10 - 62 * 2 =
  // 356 cm, 809.56 m.
  const CORNER_CM = 1400;
  const DOWN_CM = 10;
  const ACROSS_CM = 2;

  const columns = (X_TO_M - X_FROM_M) / CELL_M;
  const rows = (Y_TO_M - Y_FROM_M) / CELL_M;
  /** The ground at a grid point of the paper, so many cells down the plot and across it, in centimetres over the base. */
  const groundCm = (column, row) => CORNER_CM - DOWN_CM * column - ACROSS_CM * row;
  const rowsCm = Array.from({ length: rows + 1 }, (_, row) =>
    Array.from({ length: columns + 1 }, (__, column) => groundCm(column, row)).join(' '),
  );

  globalThis.SITE = {
    name: 'Made-up hillside plot',
    officialAreaM2: 644,
    cellM: CELL_M,
    bearingDeg: 232,
    // Where x = 0, y = 0 lies in LV95: the zero of the Swiss grid, the old observatory of Bern -
    // a made-up place, and no place of a real plot. Its Google Earth file stands nowhere real.
    originLV95: [2_600_000, 1_200_000],
    xFromM: X_FROM_M,
    xToM: X_TO_M,
    yFromM: Y_FROM_M,
    yToM: Y_TO_M,
    sideM: SIDE_M,
    // A rectangle of 34 m by 20 m with two corners cut off, one of 10 m by 3 m and one of 7 m by
    // 6 m: 680 - 15 - 21 = 644 m².
    outline: [
      [2, 6],
      [2, 23],
      [36, 23],
      [36, 9],
      [29, 3],
      [12, 3],
    ],
    notes: [
      [-1, 14, 'road'],
      [39, 16, 'meadow'],
    ],
    ground: { baseM: SIDE_M[0], rowsCm },
    credit: 'A made-up plot, for tests and for a look: no real property, no measured ground.',
  };
})();
