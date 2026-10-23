// The ground in windows (story ST-042): on a paper larger than WHOLE_M each way, the rule of
// earth.js is not run over the whole paper - a block of ground on a plot of a kilometre would
// sweep four million grid points - but in windows: a rectangle around what shapes the ground,
// REACH_M wider every way, and windows that overlap or touch made one. paper.js asks it, in
// `settle`, and hands each window to `earth.shaped` as a site of its own (`paper.land`) with the
// things moved onto that window's paper; a window's edge is held at the site's own height, as
// earth.js holds a grid point beside a cell off its paper, so the ground is one across it. A plain
// script, loaded on the two pages that settle the ground before paper.js, with no page in it.
(() => {
  // How far a block of ground or a cut shapes the ground around it on a paper that is not whole,
  // in metres. Tried (T-042.0): a window of 40 m around a block of 10 m is 90 m, worked out in
  // about a fifth of a second whatever the plot's size.
  const REACH_M = 40;
  // The largest paper whose ground is worked out whole, along it and across it, in metres: the
  // cap that New plot had (PAPER_MAX_M), so every plot's file of before is such a paper.
  const WHOLE_M = 120;

  /**
   * Where the boxes that shape the ground lie from above, `[left, top, right, bottom]` in cells:
   * every box whose block counts as ground or as a cut (`blocks.countsAs`), the boxes of one
   * `group` asked once, as earth.js asks them. An object is none.
   */
  function shapers(things) {
    const { blocks } = globalThis;
    const boxes = things.filter((thing) => thing.kind === undefined);
    const counted = new Map();
    const countsAs = (box) => {
      if (box.group === undefined) return blocks.countsAs([box]).as;
      if (!counted.has(box.group)) {
        const block = boxes.filter((other) => other.group === box.group);
        counted.set(box.group, blocks.countsAs(block).as);
      }
      return counted.get(box.group);
    };
    const shaping = boxes.filter((box) => ['ground', 'cut'].includes(countsAs(box)));
    return shaping.map(({ x, y }) => [x[0], y[0], x[1], y[1]]);
  }

  /** Whether two rectangles overlap or touch. */
  const meet = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
  /** The rectangle that holds two. */
  const both = (a, b) => [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.max(a[2], b[2]),
    Math.max(a[3], b[3]),
  ];

  /**
   * The windows around rectangles: each widened by `reach` cells every way and cut to `bounds`
   * where they are given - one that then holds no cell is none - and those that overlap or touch
   * made the one that holds both, again until none do; in the order of their top left corners,
   * by row and then by column.
   */
  function around(rects, reach, bounds) {
    const [left, top, right, bottom] = bounds ?? [-Infinity, -Infinity, Infinity, Infinity];
    let windows = rects.map(([l, t, r, b]) => [
      Math.max(l - reach, left),
      Math.max(t - reach, top),
      Math.min(r + reach, right),
      Math.min(b + reach, bottom),
    ]);
    windows = windows.filter(([l, t, r, b]) => l < r && t < b);
    for (let merged = true; merged;) {
      merged = false;
      const next = [];
      for (const window of windows) {
        const at = next.findIndex((other) => meet(other, window));
        if (at < 0) next.push(window);
        else [next[at], merged] = [both(next[at], window), true];
      }
      windows = next;
    }
    return windows.toSorted((a, b) => a[1] - b[1] || a[0] - b[0]);
  }

  /**
   * The boxes of a sketch's things on a window's paper: `x` less its left, `y` less its top, and
   * a slope said at lines of the paper moved as far; `z` as it was. No object.
   */
  function shifted(things, [left, top]) {
    const by = { x: left, y: top };
    const boxes = things.filter((thing) => thing.kind === undefined);
    return boxes.map((box) => {
      const moved = { ...box, x: box.x.map((at) => at - left), y: box.y.map((at) => at - top) };
      if (box.slope === undefined) return moved;
      const axis = 'x' in box.slope ? 'x' : 'y';
      const slope = { ...box.slope, [axis]: box.slope[axis].map((at) => at - by[axis]) };
      return { ...moved, slope };
    });
  }

  globalThis.windows = { REACH_M, WHOLE_M, shapers, around, shifted };
})();
