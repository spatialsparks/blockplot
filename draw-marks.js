// What the paper draws over all the rest (draw.js): the way a top falls, from above, as an
// arrow; what is selected, as a heavier edge; and the stroke in progress. Cut out of draw.js,
// whole, for it stood at 300 lines (T-042.3). draw.js hands this script its pen each time it
// draws - `marks.take(pen)`, the canvas and how to draw and write on it - and then asks
// `marks.arrow`, `marks.mark` and `marks.stroke`. Loaded by index.html right after draw.js.
(() => {
  const { paper, shapes, blocks } = globalThis;
  const { PLANE, INK, shown } = paper;

  // The pen of the drawing in progress, as draw.js hands it.
  let ctx;
  let unit;
  let path;
  let rule;
  let write;
  let box;
  let middle;
  let edge;

  /**
   * The way a top falls, from above: an arrow on its box, from its higher end towards its lower.
   * It is half as long as the box, and lies a quarter of the way across it: clear of the name
   * and of the size that stand in the middle of a block.
   */
  function arrow([left, top, right, bottom], [dx, dy], colour) {
    const [long, wide] = dx ? [right - left, bottom - top] : [bottom - top, right - left];
    const [x, y] = dx ? [left + long / 2, top + wide / 4] : [left + wide / 4, top + long / 2];
    const reach = long / 4;
    const tip = [x + dx * reach, y + dy * reach];
    rule(x - dx * reach, y - dy * reach, ...tip, colour, 1.5);
    // The head: from a cell back along the shaft - less on a small box - and half as far to each side.
    const back = Math.min(1, reach);
    for (const side of [-0.5, 0.5]) {
      rule(tip[0] - back * (dx + side * dy), tip[1] - back * (dy - side * dx), ...tip, colour, 1.5);
    }
  }

  /**
   * What is selected: a heavier edge round its `rects` taken together, and its `label` in their
   * middle - a line `lower`, where a name stands there. The edge is round the boxes themselves,
   * their outer size, also where a top slopes: the corners that are pulled are where they were.
   * Or a `line`, its points: drawn over in ink 2 pixels wider, a square of 6 at each corner.
   */
  function mark({ rects, label, lower, line }) {
    if (line) {
      path(line, INK, 4.5);
      ctx.fillStyle = INK;
      for (const [x, y] of line) ctx.fillRect(x - 3 / unit, y - 3 / unit, 6 / unit, 6 / unit);
      return;
    }
    if (rects.length === 1) path(box(...rects[0]), INK, 3);
    else edge(blocks.outline(rects), INK, 3);
    const [x, y] = middle(rects);
    write(label, shown(x), y + (lower ? Math.max(16, 1.4 * unit) / unit : 0), INK, 13);
  }

  /**
   * What a stroke in progress will do: a `line` as it will run, or a `box` - a block as it will
   * lie, what an eraser will take, or an object as it will stand: then the `thing` itself shows.
   * Or a `label`, where it is being moved to.
   */
  function stroke({ line, box: edges, colour, thing, label }) {
    if (label) {
      write(String(label[2]), shown(label[0]), label[1], INK, Math.max(11, unit));
      return;
    }
    if (thing) {
      ctx.globalAlpha = 0.6;
      shapes.draw(ctx, thing, PLANE, edges, INK, 1.25 / unit);
      ctx.globalAlpha = 1;
    }
    if (line) path(line, colour, 2.5);
    else path(box(...edges), colour, 1.5, [5, 4]);
  }

  /** Takes the pen that draw.js draws with now: the canvas, the CSS pixels of a cell, and its ways to draw and write. */
  function take(pen) {
    ({ ctx, unit, path, rule, write, box, middle, edge } = pen);
  }

  globalThis.marks = { take, arrow, mark, stroke };
})();
