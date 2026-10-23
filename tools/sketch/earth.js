// The ground as the sketch shapes it (story ST-027): the one rule for how high the ground lies
// once blocks of ground are drawn, or cuts (ST-028). A plain script, on both pages, with no
// sketch, no paper and no page in it. On a page nobody asks it but paper.js, which holds its
// answer: whoever wants the ground asks the paper - `paper.settle`, `paper.shaped`,
// `paper.groundAt`, `paper.realAt` - and never this script: `earth.shaped`, `earth.shapedBy`.
//
// The rule, in its words. A block - a box, or the boxes of one `group` - is a BLOCK OF GROUND
// or a CUT where it counts as one (`blocks.countsAs`), and else OF THE HOUSE: a room, open air,
// glass. An object is no part of it. A CELL OF THE HOUSE is one that a box of the house stands
// in, seen from above, whatever its height; every other cell of the paper is a CELL OF GROUND,
// under a block of ground or a cut too. A CELL OF THE PLOT lies within the outline with all of
// itself: its middle lies within, and no side of the outline passes through its inside - a side
// along its edge passes through nothing. A grid point is, asked in this order:
// - NO GROUND where every cell round it is of the house or off the paper: it keeps the site's
//   height and takes no part - no ground is worked out through the house;
// - HELD where a cell round it is no cell of the plot, or lies off the paper: the site's height.
//   So on the outline and outside it the ground is the site's, to the last figure;
// - SET where a box of ground reaches it, its edges included: the height of that box's top there
//   (`blocks.topOf`), level or on the straight line between its two ends, and of several boxes
//   the highest. How far down a box of ground reaches says nothing;
// - FREE, every other: it lies as far over the site's ground as the mean of its neighbours does,
//   or under it. That is how the ground runs out evenly, from a block of ground to the edge.
// The NEIGHBOURS of a grid point are the ones beside it along a line of the grid, four at the
// most, with which it shares a side of a cell of ground: across a block of the house two points
// are no neighbours, so the house holds the ground back as a wall does, and the ground stands
// against it. A place the house closes in knows nothing of what lies outside it.
//
// Of a cut ONLY THE FLOOR counts, level at `sideM[1] - z[1] * cellM`: not how high its box
// reaches, nor a top that slopes. FIRST the ground is worked out without the cuts, as above: the
// site's own where no block of ground sets a point. THEN every set or free point that a box of a
// cut reaches, its edges included, and at which that first ground lies over the box's floor is
// set at that floor: of several cuts the lowest, and a point that a block of ground set higher
// too. Where there is none, the first ground stands, and nothing is worked out twice. Else the
// ground is worked out AGAIN FROM THE START - every free point at nought, those points set, all
// else as it was. NO CEILING: no point is held down in a sweep, and none is free under a bound.
(() => {
  const { blocks } = globalThis;

  // How exactly the ground is worked out, and not how it runs: none of the three is a figure of
  // the design, and a sketch holds none of them. The free points are settled by sweeps (`swept`).
  // OVER: a sweep moves a point to the mean of its neighbours and past it, by nearly as far
  // again. Under 2 the sweeps close in, and at 1.95 a plot settles in some three hundred, the
  // made-up one and one of ten thousand grid points alike. At 1 - to the mean and no further -
  // a plot takes up to fourteen times the sweeps: ADR-0101 has the rest.
  const OVER = 1.95;
  // SETTLED_M: sweeps follow until one moved no point by this much or more - a thousandth of a
  // millimetre. The ground then lies within two thousandths of a millimetre of where sweeps
  // without end would leave it - a quarter of one in the slowest kind of place (ADR-0101).
  const SETTLED_M = 0.000001;
  // SWEEPS_MOST: and no more sweeps than these in a working out, so that no sketch makes a page
  // wait for long - a third of a second for ten thousand grid points. Reaching it is no error:
  // the ground is as far as it came, and `sweeps` says so - twice these, of two workings out.
  const SWEEPS_MOST = 5000;

  /**
   * The boxes of a sketch's things that shape the ground. `ground`, of every box of a block of
   * ground: [x from, x to, y from, y to, axis, row, row] - where it lies, and its top: the axis
   * its top slopes along and the row of a standing view the top lies in at its two ends along
   * it, as `blocks.topOf` reads them; of a level top 'x', and the row of its top twice. `house`,
   * of every box of the house: [x from, x to, y from, y to], where it stands seen from above.
   * `cuts`, of every box of a cut: where it lies, and its floor as a level top - its row twice.
   */
  function read(things) {
    const boxes = things.filter((thing) => thing.kind === undefined);
    // What a block counts as is asked once a block: of the boxes of its group, in their order.
    const counted = new Map();
    const countsAs = (box) => {
      if (box.group === undefined) return blocks.countsAs([box]).as;
      if (!counted.has(box.group)) {
        const block = boxes.filter((other) => other.group === box.group);
        counted.set(box.group, blocks.countsAs(block).as);
      }
      return counted.get(box.group);
    };
    const [ground, house, cuts] = [[], [], []];
    for (const box of boxes) {
      const [{ x, y, z }, as] = [box, countsAs(box)];
      if (as === 'ground') {
        const { axis = 'x', rows = [z[0], z[0]] } = blocks.topOf(box) ?? {};
        ground.push([...x, ...y, axis, ...rows]);
      } else if (as === 'cut') cuts.push([...x, ...y, 'x', z[1], z[1]]);
      else house.push([...x, ...y]);
    }
    return { ground, house, cuts };
  }

  /**
   * What of a sketch's things shapes the ground, as a text: the boxes of ground, where each lies
   * and its top; where the boxes of the house lie; and, where the sketch has a cut, after a bar
   * the cuts, where each lies and its floor. Empty where no block is ground and none a cut. An
   * object, a colour, a name that changes nothing, how high a box of the house or of a cut is
   * and the order of the things are not in it: the same text, the same ground.
   */
  function shapedBy(things) {
    const { ground, house, cuts } = read(things);
    if (ground.length + cuts.length === 0) return '';
    const lists = cuts.length > 0 ? [ground, house, cuts] : [ground, house];
    return lists.map((boxes) => boxes.map(String).sort().join(';')).join('|');
  }

  /** Whether a place lies within an outline: a line from it along its row crosses an odd number of sides. */
  function within(sides, x, y) {
    let inside = false;
    for (const [x1, y1, x2, y2] of sides) {
      if (y1 > y !== y2 > y && x < x1 + ((y - y1) * (x2 - x1)) / (y2 - y1)) inside = !inside;
    }
    return inside;
  }

  /** Whether a line passes through the inside of a cell. Along its edge is outside. */
  function passes([x1, y1, x2, y2], left, top) {
    const [dx, dy] = [x2 - x1, y2 - y1];
    let [enters, leaves] = [0, 1];
    // Each side of the cell in turn: how far along the line it is crossed, inwards or outwards.
    for (const [p, q] of [
      [-dx, x1 - left],
      [dx, left + 1 - x1],
      [-dy, y1 - top],
      [dy, top + 1 - y1],
    ]) {
      if (p === 0 && q <= 0) return false;
      if (p < 0) enters = Math.max(enters, q / p);
      if (p > 0) leaves = Math.min(leaves, q / p);
    }
    return enters < leaves;
  }

  // What hangs on a site alone is worked out once for each site.
  const LANDS = new WeakMap();

  /**
   * A site as the rule reads it: `cols` and `rows`, how many cells the top view's paper has;
   * `real`, the site's own height at every grid point, a row of the paper after another - the
   * point at a column and a row is `row * (cols + 1) + column` there; and `plot`, for every cell
   * whether it is a cell of the plot, with a ring of cells off the paper round the paper, none
   * of them the plot's, so that every grid point has four cells round it: the cell at a column
   * and a row is `(row + 1) * wide + column + 1` there.
   */
  function landOf(site) {
    if (LANDS.has(site)) return LANDS.get(site);
    const { cellM, xFromM, yToM, outline, ground } = site;
    const lines = ground.rowsCm.map((row) => row.split(' '));
    const [cols, rows] = [lines[0].length - 1, lines.length - 1];
    const real = Float64Array.from(lines.flat(), (cm) => ground.baseM + Number(cm) / 100);
    // The outline in cells of the paper, and its sides: each from a corner to the next.
    const corners = outline.map(([x, y]) => [(x - xFromM) / cellM, (yToM - y) / cellM]);
    const sides = corners.map((from, at) => [...from, ...corners[(at + 1) % corners.length]]);
    const wide = cols + 2;
    const plot = new Uint8Array(wide * (rows + 2));
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < cols; column += 1) {
        const cut = sides.some((side) => passes(side, column, row));
        if (!cut && within(sides, column + 0.5, row + 0.5)) plot[(row + 1) * wide + column + 1] = 1;
      }
    }
    LANDS.set(site, { cols, rows, wide, real, plot });
    return LANDS.get(site);
  }

  /** For every cell, in the ring of `plot`, whether no ground is there: off the paper, or a box of the house stands in it. */
  function solidOf({ cols, rows, wide }, house) {
    const solid = new Uint8Array(wide * (rows + 2)).fill(1);
    for (let row = 1; row <= rows; row += 1) solid.fill(0, row * wide + 1, row * wide + 1 + cols);
    for (const [x0, x1, y0, y1] of house) {
      const [left, right] = [Math.max(0, Math.floor(x0)), Math.min(cols, Math.ceil(x1))];
      const [top, bottom] = [Math.max(0, Math.floor(y0)), Math.min(rows, Math.ceil(y1))];
      for (let row = top + 1; row <= bottom && left < right; row += 1) {
        solid.fill(1, row * wide + 1 + left, row * wide + 1 + right);
      }
    }
    return solid;
  }

  /**
   * How high the top of the ground lies at every grid point that a box of ground reaches, its
   * edges included, in metres above sea level: of several boxes the highest, and -Infinity
   * where none does. A top is level, or the straight line between its two ends. Asked of the
   * cuts, their floors: `keep` says which of two heights stays, `none` what where none reaches.
   */
  function topsOf({ cellM, sideM }, { cols, rows }, boxes, keep, none) {
    const tops = new Float64Array((cols + 1) * (rows + 1)).fill(none);
    for (const [x0, x1, y0, y1, axis, row0, row1] of boxes) {
      const [left, right] = [Math.max(0, Math.ceil(x0)), Math.min(cols, Math.floor(x1))];
      for (let row = Math.max(0, Math.ceil(y0)); row <= Math.min(rows, Math.floor(y1)); row += 1) {
        for (let column = left; column <= right; column += 1) {
          // Whole numbers are multiplied before they are divided, as `blocks.topOf` does.
          const [gone, whole] = axis === 'y' ? [row - y0, y1 - y0] : [column - x0, x1 - x0];
          const top = sideM[1] - (row0 + (gone * (row1 - row0)) / whole) * cellM;
          const at = row * (cols + 1) + column;
          tops[at] = keep(tops[at], top);
        }
      }
    }
    return tops;
  }

  /**
   * Sweeps the free points until they are settled, and says how many sweeps it took. `over` has
   * for every grid point how far it lies over the site's ground: nought to begin with at a free
   * one. A sweep goes through the free points in the order of the grid - a row after another
   * from the top of the paper, along a row from its left - and moves each to the mean of its
   * neighbours as they stand by then, and past it: `now + OVER * (mean - now)`. Sweeps follow
   * until one moved no point by SETTLED_M or more, SWEEPS_MOST at the most. `free` says where
   * each free point lies; its neighbours are those of `near` up to its place in `ends`, from
   * where the ones of the point before end.
   */
  function swept(over, free, near, ends) {
    let [sweeps, moved] = [0, Infinity];
    while (moved >= SETTLED_M && sweeps < SWEEPS_MOST) {
      moved = 0;
      let from = 0;
      for (let index = 0; index < free.length; index += 1) {
        let sum = 0;
        for (let next = from; next < ends[index]; next += 1) sum += over[near[next]];
        const now = over[free[index]];
        const then = now + OVER * (sum / (ends[index] - from) - now);
        moved = Math.max(moved, Math.abs(then - now));
        over[free[index]] = then;
        from = ends[index];
      }
      sweeps += 1;
    }
    return sweeps;
  }

  /**
   * One working out: every grid point by its kind, the free ones swept, the ground at every
   * point - laid out as `real` is, `high`, and in rows, `heights`. Null, before a sweep, where it
   * sets no point - told the cuts' `floors` and the ground `without` them, where no cut bites.
   */
  function worked({ cols, rows, wide, real, plot }, solid, tops, floors, without) {
    // Every grid point by its kind. `high` is the ground, the site's to begin with. Of the free
    // points, in the order of the grid, `free` says where each lies and `near` which points are
    // its neighbours: above it, to its left, to its right, below it - in that order.
    const high = real.slice();
    const over = new Float64Array(real.length);
    const [free, near, ends] = [[], [], []];
    let set = 0;
    for (let row = 0; row <= rows; row += 1) {
      for (let column = 0; column <= cols; column += 1) {
        const at = row * (cols + 1) + column;
        // The four cells round the point - above it to its left and to its right, and below it
        // - and whether ground lies in each: a cell of the paper with no box of the house in it.
        const first = row * wide + column;
        const round = [first, first + 1, first + wide, first + wide + 1];
        const [nw, ne, sw, se] = round.map((cell) => solid[cell] === 0);
        // No ground: it takes no part. Then held: nought over the site's ground, as `over` has it.
        if (!(nw || ne || sw || se)) continue;
        if (round.some((cell) => plot[cell] === 0)) continue;
        // Set: its top or, bitten, a cut's floor - and how far that lies over the site's ground.
        const bitten = floors !== undefined && without[at] > floors[at];
        if (bitten || tops[at] > -Infinity) {
          high[at] = bitten ? floors[at] : tops[at];
          over[at] = high[at] - real[at];
          if (bitten || floors === undefined) set += 1;
          continue;
        }
        // Free: a neighbour is a point with which it shares a side of a cell of ground.
        free.push(at);
        if (nw || ne) near.push(at - cols - 1);
        if (nw || sw) near.push(at - 1);
        if (ne || se) near.push(at + 1);
        if (sw || se) near.push(at + cols + 1);
        ends.push(near.length);
      }
    }
    if (set === 0) return null;
    const sweeps = swept(over, free, near, ends);
    for (const at of free) high[at] = real[at] + over[at];
    const heights = [];
    for (let row = 0; row <= rows; row += 1) {
      heights.push(Array.from(high.subarray(row * (cols + 1), (row + 1) * (cols + 1))));
    }
    return { high, heights, sweeps };
  }

  /**
   * The ground of a site (a SITE, site.js) as a sketch's things shape it, as the sketch holds them:
   * null where nothing is shaped - no block of ground and no cut, or none that sets a point of the
   * plot's ground - and else `{ heights, sweeps }`: `heights[row][column]`, metres above sea level
   * at every grid point of the top view's paper, a row after another from its top, and the `sweeps`
   * of its workings out. The rule is the head of this script. The same things give the same grid,
   * number for number, in whatever order they come and on every machine: plain numbers and the four
   * operations on them, in one order. A set point is its top or its floor, and a point that is
   * neither set nor free is the site's very number: nothing is added to it, and nothing taken off.
   */
  function shaped(site, things) {
    const { ground, house, cuts } = read(things);
    if (ground.length + cuts.length === 0) return null;
    const land = landOf(site);
    const [solid, tops] = [solidOf(land, house), topsOf(site, land, ground, Math.max, -Infinity)];
    const first = worked(land, solid, tops);
    const floors = cuts.length > 0 && topsOf(site, land, cuts, Math.min, Infinity);
    const second = floors && worked(land, solid, tops, floors, first?.high ?? land.real);
    if (!second) return first && { heights: first.heights, sweeps: first.sweeps };
    return { heights: second.heights, sweeps: second.sweeps + (first?.sweeps ?? 0) };
  }

  globalThis.earth = { OVER, SETTLED_M, SWEEPS_MOST, shaped, shapedBy };
})();
