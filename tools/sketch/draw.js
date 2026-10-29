// How the paper is drawn: the layers under the grid and the site (land.js) - the one drawn on
// over the others - then what is selected, and the stroke in progress, which draw-marks.js draws
// with the pen this script hands it. One unit of the drawing is one cell of the plane's paper; a
// flipped view shows that paper from behind. A box is drawn under its top: what it fills of this
// plane, and what a top that slopes shows, blocks.js says. The canvas is the window (zoom.js):
// what lies outside it is clipped, and the grid and the ground are worked out over what shows.
(() => {
  const { paper, shapes, blocks, land } = globalThis;
  const { PLANE, FLIP, WIDE, ROWS, INK, hex, shown } = paper;

  // How strongly a layer shows: its boxes, and their edges with its objects, lines and labels.
  // The layer drawn on shows in full, and so does one shown beside it; a faded one less.
  const FULL = { boxes: 0.6, ink: 1 };
  const FADED = { boxes: 0.2, ink: 0.3 };
  // From above, the window beyond the plot's paper: a pale grey under the grid (ST-042).
  const BEYOND = '#f4f5f7';

  let ctx;
  // The screen's own pixels a CSS pixel and a cell, and CSS pixels a cell.
  let ratio;
  let scale;
  let unit;
  // The screen's pixels from the paper's corner, as the view shows it, to the window's: whole.
  let origin;

  /** Lays the drawing on the canvas, `shift` of the screen's pixels on - from behind where the view is flipped. */
  const lay = (shift) => {
    const [x, y] = [(FLIP ? WIDE * scale : 0) - origin[0] + shift, shift - origin[1]];
    ctx.setTransform(FLIP ? -scale : scale, 0, 0, scale, x, y);
  };
  /** A row, or a column of the plane's paper, on the nearest whole pixel of the screen. */
  const row = (at) => Math.round(at * scale) / scale;
  const column = (at) => (FLIP ? WIDE - row(WIDE - at) : row(at));

  function path(points, colour, width, dash = []) {
    ctx.beginPath();
    points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.strokeStyle = colour;
    ctx.lineJoin = 'round';
    ctx.lineWidth = width / unit;
    ctx.setLineDash(dash.map((length) => length / unit));
    ctx.stroke();
  }

  /** A straight line from one place to another. */
  const rule = (x1, y1, x2, y2, ...style) =>
    path(
      [
        [x1, y1],
        [x2, y2],
      ],
      ...style,
    );

  /** The points of a line of the sketch, two or more, each `[x, y]`: its colour, last, is none. */
  const corners = (line) => line.slice(1).flatMap((y, at) => (at % 2 ? [] : [[line[at], y]]));

  /** The corners of a box, round and back to the first. */
  const box = (left, top, right, bottom) => [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
    [left, top],
  ];

  /**
   * Text in a size in CSS pixels, on a white halo, at a place in cells of the paper as the
   * screen shows it: `shown` says where a column of the plane's paper is there.
   */
  function write(text, x, y, colour, size, align = 'center') {
    ctx.save();
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.font = `${size}px system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeStyle = '#fff';
    const [left, top] = [x * unit - origin[0] / ratio, y * unit - origin[1] / ratio];
    ctx.strokeText(text, left, top);
    ctx.fillStyle = colour;
    ctx.fillText(text, left, top);
    ctx.restore();
  }

  /**
   * A box of a layer as it shows under its top, by `blocks.js` and nothing else: its `shape`,
   * what it fills of this plane (`blocks.fills`) - the rect, and after it the rows its top is
   * drawn in at its left and at its right. And of a top that slopes (`blocks.topOn`): a `line`
   * across the box at its lower end, where this view looks along the slope, or the way it
   * `falls`, from above.
   */
  function seen({ thing, rect }) {
    const top = blocks.topOn(thing, PLANE);
    const [left, , right] = rect;
    const line = top?.low === undefined ? [] : [[left, top.low, right, top.low]];
    return { shape: blocks.fills(thing, PLANE, rect), line, falls: top?.falls };
  }

  /**
   * The edge of boxes taken together under their tops, as `blocks.outline` gives it for rects,
   * in pieces as long as they run: each box is the shape it fills. A top that slopes is one
   * piece, from end to end; a side begins at the row of the top there.
   */
  function rim(shapes) {
    const [pieces, lines] = [[], new Map()];
    // On a line, upright or level, where an edge of a box begins and where it ends.
    const mark = (line, from, to) => lines.set(line, [...(lines.get(line) ?? []), from, to]);
    for (const [left, , right, bottom, atLeft, atRight] of shapes) {
      if (atLeft === atRight) mark(`y${atLeft}`, left, right);
      else pieces.push([left, atLeft, right, atRight]);
      mark(`y${bottom}`, left, right);
      mark(`x${left}`, atLeft, bottom);
      mark(`x${right}`, atRight, bottom);
    }
    for (const [line, marks] of lines) {
      const [at, level] = [Number(line.slice(1)), line[0] === 'y'];
      marks.sort((a, b) => a - b);
      // From a mark to the next the line is one box's: an edge. Then two boxes meet, or none is.
      for (let i = 0; i < marks.length; i += 2) {
        const [from, to] = [marks[i], marks[i + 1]];
        if (from < to) pieces.push(level ? [from, at, to, at] : [at, from, at, to]);
      }
    }
    return pieces;
  }

  /**
   * The boxes of a layer - and the flat ones among its notes - as colour, under the grid: a box
   * under its top, and so under the line of it where that slopes along the paper.
   */
  function boxes({ things, notes }, alpha) {
    const flats = notes.flatMap((note) => (note.flat ? [note.flat] : []));
    const solid = things.filter(({ thing }) => !thing.kind);
    ctx.save();
    // On whole pixels: two boxes side by side leave no seam.
    lay(0);
    ctx.globalAlpha = alpha;
    // The first `count` places of a rect on whole pixels - its columns and rows - the rest as it was.
    const on = (rect, count) =>
      rect.map((at, k) => (k >= count ? at : k % 2 || k > 3 ? row(at) : column(at)));
    for (const [left, top, right, bottom, colour] of flats.map((flat) => on(flat, 4))) {
      ctx.fillStyle = hex(colour);
      ctx.fillRect(left, top, right - left, bottom - top);
    }
    for (const entry of solid) {
      const [left, , right, bottom, atLeft, atRight] = on(seen(entry).shape, 6);
      ctx.fillStyle = hex(entry.thing.colour);
      if (atLeft === atRight) ctx.fillRect(left, atLeft, right - left, bottom - atLeft);
      else {
        // Under a top that slopes along the paper: from its two ends down to the floor.
        ctx.beginPath();
        ctx.moveTo(left, atLeft);
        ctx.lineTo(right, atRight);
        ctx.lineTo(right, bottom);
        ctx.lineTo(left, bottom);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /** The middle of rects taken together. */
  function middle(rects) {
    const reach = (pick, side) => pick(...rects.map((rect) => rect[side]));
    return [0, 1].map((side) => (reach(Math.min, side) + reach(Math.max, side + 2)) / 2);
  }

  /** An edge, in its pieces: of boxes taken together, where two of them meet there is none. */
  function edge(pieces, colour, width) {
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of pieces) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = colour;
    ctx.lineWidth = width / unit;
    ctx.lineCap = 'square';
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  /**
   * What a layer has over the grid: the edges of its blocks and their names, its objects, its
   * lines and labels. The boxes of one block have one edge between them all, and one name in
   * their middle. The edge runs along a top that slopes; a top looked at along its slope has a
   * line across it, and from above an arrow down it - all in the block's ink.
   */
  function ink({ things, notes }, alpha) {
    ctx.globalAlpha = alpha;
    const whole = new Map();
    for (const entry of things.filter(({ thing }) => !thing.kind)) {
      const block = entry.thing.group ?? entry;
      whole.set(block, [...(whole.get(block) ?? []), entry]);
    }
    const names = [];
    for (const parts of whole.values()) {
      const rects = parts.map((entry) => entry.rect);
      const [shows, colour] = [parts.map(seen), hex(parts[0].thing.colour)];
      const under = rim(shows.map(({ shape }) => shape));
      edge([...under, ...shows.flatMap(({ line }) => line)], colour, 1.5);
      shows.forEach(
        ({ falls }, part) => falls && globalThis.marks.arrow(rects[part], falls, colour),
      );
      const named = parts.find((entry) => entry.thing.name)?.thing.name;
      // Without a name, the category that was picked for it: asked now, the sketch loads later.
      const name = named ?? globalThis.sketch.worded(parts[0].thing);
      // ponytail: the middle of the box round a block; of an L, that may lie beside the block
      if (name) names.push([String(name), ...middle(rects)]);
    }
    for (const { thing, rect } of things) {
      if (thing.kind) shapes.draw(ctx, thing, PLANE, rect, INK, 1.25 / unit);
    }
    for (const { flat, line, label } of notes) {
      if (flat) path(box(...flat), hex(flat[4]), 1, [2, 3]);
      if (line) path(corners(line), hex(line.length % 2 ? line.at(-1) : null), 2.5);
      if (label) write(String(label[2]), shown(label[0]), label[1], INK, Math.max(11, unit));
    }
    for (const [name, x, y] of names) write(name, shown(x), y, INK, Math.max(11, unit));
    ctx.globalAlpha = 1;
  }

  /**
   * Draws the paper at `px` CSS pixels a cell, the place `left`, `top` at the window's top left
   * corner (zoom.js), on a canvas as large as the window. `layers` are the layers that show, from
   * the lowest to the one drawn on, the last: each its `things` with their rects, its `notes`, and
   * whether it is `faded`. `cuts` says where the two slices run: 'side' along a row of the
   * top view, 'end' along a column. `picked` is what is selected - one mark, or a list of them,
   * one for each of several things selected - and `preview` the stroke in progress.
   */
  paper.draw = (canvas, { px, left = 0, top = 0, layers, cuts, picked, preview }) => {
    ratio = globalThis.devicePixelRatio || 1;
    // A cell is `px` CSS pixels, a part of a pixel or many (ADR of T-042.3): a box, a grid line
    // and a hairline are laid on whole pixels of the screen, and the window's corner is on one.
    [scale, unit] = [px * ratio, px];
    origin = [Math.round(left * scale), Math.round(top * scale)];
    const [wide, high] = [canvas.clientWidth * ratio, canvas.clientHeight * ratio].map(Math.round);
    if (canvas.width !== wide || canvas.height !== high)
      [canvas.width, canvas.height] = [wide, high];
    ctx = canvas.getContext('2d');
    const { marks } = globalThis; // Loaded after this script: asked as the paper is drawn.
    // What the window shows, in cells - its columns as the view shows them - where it has a size.
    const view = [origin[0], origin[1], origin[0] + wide, origin[1] + high].map((at) => at / scale);
    const pen = { ctx, ratio, unit, path, rule, write, view: wide > 0 ? view : undefined };
    marks.take({ ...pen, box, middle, edge }); // What is drawn over all the rest: draw-marks.js.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    // Over swisstopo's map, from above (under/lay.js), no ground: neither grey beyond nor white.
    const over = globalThis.under?.shows() === true;
    ctx.fillStyle = PLANE === 'top' ? BEYOND : '#fff';
    if (over) ctx.clearRect(0, 0, wide, high);
    else ctx.fillRect(0, 0, wide, high);
    // Half a pixel on, so that a hairline on a grid line fills one row of pixels, not two.
    lay(0.5);
    ctx.fillStyle = '#fff';
    if (!over) ctx.fillRect(0, 0, WIDE, ROWS);
    const strength = (layer) => (layer.faded ? FADED : FULL);
    if (PLANE !== 'top') land.ground(pen, cuts[PLANE]);
    for (const layer of layers) boxes(layer, strength(layer).boxes);
    land.grid(pen);
    land.site(pen, cuts);
    for (const layer of layers) ink(layer, strength(layer).ink);
    for (const one of [picked ?? []].flat()) marks.mark(one);
    if (preview) marks.stroke(preview);
    globalThis.under?.lay(); // The map's pictures follow the window, under the canvas.
  };
})();
