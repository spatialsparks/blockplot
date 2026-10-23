// How far the 3D page draws the ground, and how fine (story ST-042): of a sketch on its plot, the
// near grids - every cell within NEAR_M of what the sketch draws - and the far squares - coarser
// the further from it - of the plot's ground, and of the flat ground beyond its paper as far as
// the sketch reaches. Every height is the paper's own, `paper.groundAt`: nothing here works out
// a height of the ground. Where nothing reaches past a paper that is worked out whole, nothing
// is near and nothing far, and the land is the one the page always had. Plain arithmetic in cells
// of the top view's paper; the pad's scripts it asks - `paper`, `squares`, `windows` - come as
// arguments from read.js, which alone names the pad's globals.

/** How far around what the sketch draws the ground is drawn at every cell, in metres. */
export const NEAR_M = 20;
/** How large a far square may be for its distance from the nearest near rectangle: a sixteenth. */
export const FAR_SHARE = 1 / 16;

// The tree of a plot's ground, read once a ground: paper.js keeps its own to itself.
const trees = new WeakMap();

/** Whether a rectangle `[left, top, right, bottom]` lies wholly within another. */
const within = (a, b) => a[0] >= b[0] && a[1] >= b[1] && a[2] <= b[2] && a[3] <= b[3];
/** Whether two rectangles share some cell: touching is none. */
const overlaps = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
/** How far apart two rectangles lie, straight across the gap between them: 0 where they meet. */
const gap = (a, b) =>
  Math.hypot(Math.max(b[0] - a[2], a[0] - b[2], 0), Math.max(b[1] - a[3], a[1] - b[3], 0));
/** The rectangle that holds two. */
const both = (a, b) => [
  Math.min(a[0], b[0]),
  Math.min(a[1], b[1]),
  Math.max(a[2], b[2]),
  Math.max(a[3], b[3]),
];
/** A rectangle widened to whole cells. */
const whole = ([left, top, right, bottom]) => [
  Math.floor(left),
  Math.floor(top),
  Math.ceil(right),
  Math.ceil(bottom),
];

/**
 * The ground the 3D page draws of a sketch on its plot: `{ near, far, beyond }`. `rects` are the
 * sketch's things from above, `[left, top, right, bottom]` in cells (`sketch.rect`), every one.
 * - `near`: `{ rect, heights }` of every near rectangle - every footprint widened by NEAR_M,
 *   those that overlap or touch made one (`windows.around`), not cut to the paper, and, on a
 *   paper worked out whole (`paper.WHOLE`), the paper itself - `heights[row][column]` at its
 *   every grid point, `paper.groundAt`, from its top left;
 * - `far`: `[c0, r0, c1, r1, h00, h10, h01, h11]` of every far square - its top left and bottom
 *   right corners in cells, its heights at its top left, top right, bottom left and bottom right,
 *   `paper.groundAt`. They fill all that is drawn but the near rectangles: on a paper that is not
 *   whole the squares of its tree (`squares.walk`), and beyond the paper squares of their own on
 *   the grid of powers of two, each drawn whole where it overlaps no near rectangle and its side
 *   is at most FAR_SHARE of its distance from the nearest, and else cut into its quarters;
 * - `beyond`: how far what is drawn - the paper and every near rectangle, the rectangle that
 *   holds them all - reaches beyond the paper, in whole metres, rounded up.
 * Nothing near and nothing far where the paper is whole and every rect lies on it.
 */
export function reachOf({ site, paper, squares, windows }, rects) {
  const { COLS, ACROSS, CELL_M, WHOLE } = paper;
  const PAPER = [0, 0, COLS, ACROSS];
  if (WHOLE && rects.every((rect) => within(rect, PAPER))) return { near: [], far: [], beyond: 0 };
  let nearRects = windows.around(rects.map(whole), NEAR_M / CELL_M, null);
  if (WHOLE) nearRects = windows.around([...nearRects, PAPER], 0, null);
  const drawn = [PAPER, ...nearRects].reduce(both);
  const at = paper.groundAt;
  const heightsOf = ([left, top, right, bottom]) =>
    Array.from({ length: bottom - top + 1 }, (_, row) =>
      Array.from({ length: right - left + 1 }, (__, column) => at(left + column, top + row)),
    );
  const near = nearRects.map((rect) => ({ rect, heights: heightsOf(rect) }));
  const far = [];
  const cut = (square) => {
    const distance = Math.min(...nearRects.map((rect) => gap(square, rect)));
    return square[2] - square[0] > FAR_SHARE * distance;
  };
  const add = ([c0, r0, c1, r1]) =>
    far.push([c0, r0, c1, r1, at(c0, r0), at(c1, r0), at(c0, r1), at(c1, r1)]);

  /** The far squares of a square - cut into quarters where it must be - of what is drawn, but the paper where `paperless`. */
  function carve(column, row, size, paperless) {
    const stack = [[column, row, size]];
    while (stack.length > 0) {
      const [c, r, side] = stack.pop();
      const square = [c, r, c + side, r + side];
      const out = !overlaps(square, drawn) || (paperless && within(square, PAPER));
      if (out || nearRects.some((rect) => within(square, rect))) continue;
      const part =
        !within(square, drawn) ||
        nearRects.some((rect) => overlaps(square, rect)) ||
        (paperless && overlaps(square, PAPER));
      if (side === 1 || (!part && !cut(square))) add(square);
      else {
        const half = side / 2;
        stack.push([c + half, r + half, half], [c, r + half, half], [c + half, r, half]);
        stack.push([c, r, half]);
      }
    }
  }

  const ground = site.ground;
  if (ground.squares !== undefined && !trees.has(ground)) {
    trees.set(ground, squares.read(ground, COLS, ACROSS));
  }
  const tree = trees.get(ground);
  if (!WHOLE && tree) {
    squares.walk(tree, (c, r, side, isGround) => {
      if (c >= COLS || r >= ACROSS) return false;
      const square = [c, r, c + side, r + side];
      if (!within(square, PAPER)) return true;
      if (nearRects.some((rect) => within(square, rect))) return false;
      const part = nearRects.some((rect) => overlaps(square, rect));
      if (!part && !cut(square)) add(square);
      else if (isGround || side === 1) carve(c, r, side, false);
      else return true;
      return false;
    });
  }
  // Beyond the paper - and on it too, where neither the paper is near nor a tree says it.
  let root = 1;
  while (root < drawn[2] - drawn[0] || root < drawn[3] - drawn[1]) root *= 2;
  const [first, top] = [drawn[0], drawn[1]].map((at) => Math.floor(at / root) * root);
  for (let r = top; r < drawn[3]; r += root) {
    for (let c = first; c < drawn[2]; c += root) carve(c, r, root, WHOLE || Boolean(tree));
  }
  const past = Math.max(0, -drawn[0], -drawn[1], drawn[2] - COLS, drawn[3] - ACROSS);
  return { near, far, beyond: Math.ceil(past * CELL_M) };
}

/**
 * The land that read.js hands on, of the pad's scripts and the sketch's things from above: where
 * nothing is near and nothing far, the pad's own site - or, where the paper holds a grid of the
 * ground (`paper.shaped()`, else `paper.grid()`), that site with `ground.heights`, that grid
 * itself; else that site with `ground: { near, far, beyond, at }`, `at` the paper's `groundAt`.
 */
export function landOf(pad, rects) {
  const { site, paper } = pad;
  const { near, far, beyond } = reachOf(pad, rects);
  if (near.length + far.length > 0)
    return { ...site, ground: { near, far, beyond, at: paper.groundAt } };
  const heights = paper.shaped() ?? paper.grid();
  return heights === null ? site : { ...site, ground: { ...site.ground, heights } };
}
