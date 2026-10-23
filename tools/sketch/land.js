// How the site is drawn on the paper: the grid with its figures, and the site itself - from
// above the parcel outline and the lines of the two slices, standing up the ground along the
// slice. draw.js hands each of these its pen: the canvas, and how to draw and write on it - and
// the window it shows, `view` (zoom.js): the grid, its figures and the ground of a slice are
// worked out over what shows, and the words of the paper's edges stand at the window's. A pen
// with no window shows the plot's paper.
//
// The ground of a slice is the one ground, as the paper holds it (story ST-027): the site's own,
// or as the blocks of ground of the sketch shape it. Once it is shaped, a slice shows the site's
// own too, as a thin line under the line of the ground: between the two a fill shows tinted, and
// a cut shows as paper. Beyond the plot's paper the ground is flat at its nearest edge's height,
// and drawn lighter (ST-042, Rule 4).
(() => {
  const { SITE, paper } = globalThis;
  const { PLANE, FLIP, CELL_M, SPANS, X0, WIDE, ROWS, INK, FAINT } = paper;
  const { cell, metres, shown, wind, groundRow, realRow, onSlice, plotSpan } = paper;

  // A slice: its line in the top view, and where the other slice crosses a standing view.
  const CUT = '#b45309';
  const DASH = [10, 4, 2, 4];
  // Grid lines (grid.js): a line every step of the grid shown, and every STRONG-th, where the
  // metres are a multiple of so many steps, stronger, with its figure beside it.
  const GRID = ['#e3e7eb', '#cdd3da'];
  // The tint under the ground of a slice: on the plot's paper, and beyond it lighter.
  const TINT = ['#f1ebe0', '#f7f4ee'];
  // What lies to the left of the paper and to the right of it, as this view shows it.
  const ENDS =
    PLANE === 'end'
      ? [wind(SITE.bearingDeg - 90), wind(SITE.bearingDeg + 90)]
      : [`uphill, ${wind(SITE.bearingDeg + 180)}`, `downhill, ${wind(SITE.bearingDeg)}`];
  if (FLIP) ENDS.reverse();

  /**
   * What the pen's window shows, in cells: its `left` and `right` as the view shows its columns,
   * its `top` and `bottom`, and the columns of the plane's paper `from` one `to` the other.
   */
  function windowOf({ view = [0, 0, WIDE, ROWS] }) {
    const [left, top, right, bottom] = view;
    const [from, to] = [shown(left), shown(right)].sort((a, b) => a - b);
    return { left, top, right, bottom, from, to };
  }

  /**
   * The grid of the step shown at `unit` CSS pixels a cell, as `grid.stepAt` has it - which
   * `grid.shown` is set to - with the rulers' figures at its strong lines, over the window.
   */
  function grid(pen) {
    const { rule, write, unit, ratio } = pen;
    const { left, top, bottom, from, to } = windowOf(pen);
    const { grid: steps } = globalThis;
    const [hairline, scale, step] = [1 / ratio, unit * ratio, steps.stepAt(unit)];
    steps.shown = step ?? steps.STEPS_M.at(-1);
    const along = (column) => metres([column, 0])[0];
    // Each line laid on a whole pixel of the screen, as the screen shows it: sharp at any step.
    const sharp = (place) => Math.round(place * scale) / scale;
    const strong = (m) => Math.round(m / steps.shown) % steps.STRONG === 0;
    // The places of the lines along the paper (axis 0) and up it (1) that show, with their metres.
    function lines(axis, low, high) {
      const every = steps.shown / CELL_M;
      const found = [];
      for (let at = steps.floor(low, axis); at <= high; at += every) {
        if (at >= low) found.push([at, metres([at, at])[axis]]);
      }
      return found;
    }
    // The strong lines last, so that a finer one does not cut them.
    for (const [index, colour] of (step === null ? [] : GRID).entries()) {
      for (const [i, m] of lines(0, from, to)) {
        const x = shown(sharp(shown(i)));
        if (strong(m) === (index === 1)) rule(x, top, x, bottom, colour, hairline);
      }
      for (const [j, m] of lines(1, top, bottom)) {
        if (strong(m) === (index === 1)) rule(from, sharp(j), to, sharp(j), colour, hairline);
      }
    }
    // The figures, at every strong line: along the window's top, and down its left side from a
    // metre under its top to a metre over its foot. None on its left and bottom edges, where the
    // other figures and the captions stand: at 0.5 m a figure stands every 2.5 m, closer to them.
    const labelled = steps.STRONG * steps.shown;
    const [low, high] = [along(from), along(to)].sort((a, b) => a - b);
    const after = (edge) => Math.ceil((edge + CELL_M) / labelled);
    for (let n = after(low); n * labelled < high; n += 1) {
      const m = n * labelled;
      const x = shown(cell([m, 0])[0]) + 3 / unit;
      write(`${paper.exact(m)} m`, x, top + 9 / unit, FAINT, 10, 'left');
    }
    const [foot, head] = [metres([0, bottom])[1], metres([0, top])[1]];
    for (let n = after(foot + 1); n * labelled <= head - 1; n += 1) {
      const y = n * labelled;
      write(`${paper.exact(y)} m`, left + 3 / unit, cell([0, y])[1] - 7 / unit, FAINT, 10, 'left');
    }
  }

  /**
   * The places along a slice that the window shows, a place a pixel at the most: on the plot's
   * paper (`inside`), and beyond it on either side (`beyond`) - each a list with its two ends.
   */
  function spans(pen) {
    const { from, to } = windowOf(pen);
    const step = pen.unit < 1 ? Math.ceil(1 / pen.unit) : 1;
    const run = (low, high) => {
      const all = [];
      for (let place = low; place < high; place += step) all.push(place);
      return low < high ? [[...all, high]] : [];
    };
    const [first, last] = [Math.floor(from), Math.ceil(to)];
    const inside = run(Math.max(0, first), Math.min(WIDE, last));
    const beyond = [...run(first, Math.min(0, last)), ...run(Math.max(WIDE, first), last)];
    return { inside, beyond };
  }
  /** The ground along a slice at these places, in cells: the one ground, as it is shaped - or, by `realRow`, the site's own. */
  const relief = (cut, places, rowAt = groundRow) =>
    places.map((place) => [place, rowAt(...onSlice(place, cut))]);

  /** The ground under a slice, tinted: beyond the plot's paper lighter, down to the window's foot. */
  function ground(pen, cut) {
    const { ctx } = pen;
    const foot = Math.max(ROWS, windowOf(pen).bottom);
    const { inside, beyond } = spans(pen);
    const tinted = [...beyond.map((places) => [places, TINT[1]])];
    for (const [places, tint] of [...tinted, ...inside.map((places) => [places, TINT[0]])]) {
      ctx.beginPath();
      ctx.moveTo(places[0], foot);
      for (const [place, row] of relief(cut, places)) ctx.lineTo(place, row);
      ctx.lineTo(places.at(-1), foot);
      ctx.fillStyle = tint;
      ctx.fill();
    }
  }

  /** The north arrow, its shaft's middle at a place. */
  function north({ rule, write }, [x, y]) {
    const angle = (SITE.bearingDeg * Math.PI) / 180;
    const [dx, dy] = [Math.cos(angle), -Math.sin(angle)];
    const tip = [x + 3 * dx, y + 3 * dy];
    rule(x - 3 * dx, y - 3 * dy, ...tip, INK, 1.5);
    // The head: from a cell back along the shaft and half a cell to each side of it.
    for (const side of [-0.5, 0.5]) {
      rule(tip[0] - dx - side * dy, tip[1] - dy + side * dx, ...tip, INK, 1.5);
    }
    write('N', tip[0] + 1.2 * dx, tip[1] + 1.2 * dy, INK, 12);
  }

  /**
   * The site. From above: the outline, the lines of the two slices across the window - `cuts`
   * says where each runs - and the north arrow at its top right. Standing up: the ground along
   * this view's slice, lighter beyond the plot's paper, where the slice enters the plot and
   * leaves it, and where the other slice crosses it - and, while the paper holds a shaped ground,
   * the site's own along the slice, with a second line of words that says so.
   */
  function site(pen, cuts) {
    const { ctx, path, rule, write, unit } = pen;
    const { left, top, right, bottom, from, to } = windowOf(pen);
    if (PLANE === 'top') {
      rule(from, cuts.side, to, cuts.side, CUT, 1.5, DASH);
      rule(cuts.end, top, cuts.end, bottom, CUT, 1.5, DASH);
      // A grip at either end of each line on the plot's paper: the lines are dragged with Select.
      ctx.fillStyle = CUT;
      const grips = [1, WIDE - 1].map((x) => [x, cuts.side]);
      for (const [x, y] of [...grips, [cuts.end, 1], [cuts.end, ROWS - 1]]) {
        ctx.fillRect(x - 5 / unit, y - 5 / unit, 10 / unit, 10 / unit);
      }
      write('side slice', left + 3 / unit, cuts.side - 7 / unit, CUT, 10, 'left');
      write('front slice', cuts.end + 4 / unit, top + 24 / unit, CUT, 10, 'left');
      path([...SITE.outline, SITE.outline[0]].map(cell), INK, 2.5);
      for (const [x, y, text] of SITE.notes) write(text, ...cell([x, y]), FAINT, 11);
      globalThis.distancePanel?.draw(pen);
      north(pen, [right - 7, top + 7]);
    } else {
      const [cut, other] = PLANE === 'side' ? [cuts.side, cuts.end] : [cuts.end, cuts.side];
      const { inside, beyond } = spans(pen);
      // The ground as it was, on every slice once the sketch shapes the ground and on none
      // before: a line of one pixel, drawn first. The line of the ground lies over it, and hides
      // it wherever the two are one - no two heights are held against each other to tell.
      const shaped = paper.shaped() !== null;
      if (shaped) for (const places of inside) path(relief(cut, places, realRow), FAINT, 1);
      for (const places of inside) path(relief(cut, places), INK, 2.5);
      for (const places of beyond) path(relief(cut, places), FAINT, 1.5);
      const [x, y] = [left + 60 / unit, top + 24 / unit];
      write('— the ground along the slice', x, y, INK, 11, 'left');
      if (shaped) write('— the ground as it was', x, y + 14 / unit, FAINT, 11, 'left');
      const at = PLANE === 'side' ? SPANS.top[1] - cut * CELL_M : X0 + cut * CELL_M;
      for (const edge of plotSpan(at, PLANE)) {
        const column = cell([edge, 0])[0];
        rule(column, 0, column, ROWS, FAINT, 1, [3, 5]);
        write('plot boundary', shown(column), ROWS - 26 / unit, FAINT, 10);
      }
      rule(other, 0, other, ROWS, CUT, 1, DASH);
      const crossing = PLANE === 'side' ? 'front slice' : 'side slice';
      write(crossing, shown(other), ROWS - 42 / unit, CUT, 10);
    }
    const foot = bottom - 10 / unit;
    write(`◀ ${ENDS[0]}`, left + 6 / unit, foot, FAINT, 11, 'left');
    write(`${ENDS[1]} ▶`, right - 6 / unit, foot, FAINT, 11, 'right');
  }

  globalThis.land = { grid, ground, site };
})();
