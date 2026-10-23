// The ground as squares (story ST-042): how a plot's file of version 3 keeps its ground, made and
// read. A plain script with no page, no disk and no network in it - the three pages load it
// before paper.js, and plot-file.js imports it for its effect - so the server and a page read a
// ground alike. docs/STORAGE_FORMAT.md, "The plot file - version 3", says every word of it.
//
// THE ROOT is the smallest square of 2^k cells that holds the paper's columns and its rows, its
// top left corner at the paper's top left grid point. THE TREE is one text, a character a square,
// depth first: a square, then its four quarters - top left, top right, bottom left, bottom right
// - each wholly before the next. `+` is a square split into four; `o` a square of ground, wholly
// on the paper; `.` a square wholly beyond it. A square partly beyond the paper is split, and a
// square of one cell never is. A square of ground is THE FACE of its four corners: at a share u
// along it and v down it, `top = a + (b - a) u`, `bottom = c + (d - c) u`, `top + (bottom - top)
// v` - paper.js's `heightAt`, to the operation. A place on the line between two squares is in the
// right or the lower one; on the paper's right or bottom edge, in the square left of it or above
// it; beyond the paper, at the paper's nearest edge. THE CORNERS are a text a row of grid points
// of the paper, from the top down: the height of every corner of a square of ground on that row,
// left to right, each once, in centimetres over `baseM`, one blank between two.
//
// MADE WITHIN 5 CM (Rule 3): a square is split where the face of its four corners misses a height
// at a grid point within it or on its edge by more than TOLERANCE_CM, down to one cell. A corner's
// height is the height it was made of, not fitted.
(() => {
  // How far the ground kept may stray from the heights it was made of, in centimetres: the
  // owner's word of 2026-10-20 (ST-042, History). A figure of the plot's file, never of a sketch.
  const TOLERANCE_CM = 5;
  const [SPLIT, GROUND, BEYOND] = ['+', 'o', '.'];
  const NO_TREE = "Its ground's squares are no tree of its paper.";
  const LACKS = 'Its ground lacks a height:';

  /** The root's side in cells: the smallest power of two that holds both counts. */
  function rootOf(cols, rows) {
    let size = 1;
    while (size < cols || size < rows) size *= 2;
    return size;
  }
  /** A square's height at a share along it and down it, of its four corners: the face. */
  function face(a, b, c, d, u, v) {
    const top = a + (b - a) * u;
    const bottom = c + (d - c) * u;
    return top + (bottom - top) * v;
  }
  /** What a square is to the paper: beyond it wholly, on it wholly, or partly beyond it. */
  function placeOf(column, row, size, cols, rows) {
    if (column >= cols || row >= rows) return BEYOND;
    return column + size <= cols && row + size <= rows ? GROUND : SPLIT;
  }
  /** Whether the face of a square's corners holds every grid point within it and on its edge. */
  function holds(cm, wide, column, row, size) {
    const at = (c, r) => cm[(row + r) * wide + column + c];
    const [a, b, c, d] = [at(0, 0), at(size, 0), at(0, size), at(size, size)];
    for (let r = 0; r <= size; r += 1) {
      for (let k = 0; k <= size; k += 1) {
        if (Math.abs(face(a, b, c, d, k / size, r / size) - at(k, r)) > TOLERANCE_CM) return false;
      }
    }
    return true;
  }
  /** Each of a square's four quarters, in the order of the tree. */
  const quarters = (column, row, half) => [
    [column, row, half],
    [column + half, row, half],
    [column, row + half, half],
    [column + half, row + half, half],
  ];

  /**
   * The tree of a paper of `cols` by `rows` cells, made of `cm` - a height in centimetres over
   * `baseM` at every grid point, a row after another from the top, `cols + 1` a row, a list or a
   * typed list: `{ squares, cornersCm }`, each corner's height as `String` writes it.
   */
  function make(cm, cols, rows) {
    const wide = cols + 1;
    const corner = new Uint8Array(wide * (rows + 1));
    const said = [];
    const stack = [[0, 0, rootOf(cols, rows)]];
    while (stack.length > 0) {
      const [column, row, size] = stack.pop();
      let kind = placeOf(column, row, size, cols, rows);
      if (kind === GROUND && size > 1 && !holds(cm, wide, column, row, size)) kind = SPLIT;
      said.push(kind);
      if (kind === SPLIT) stack.push(...quarters(column, row, size / 2).toReversed());
      if (kind !== GROUND) continue;
      for (const at of [row * wide + column, (row + size) * wide + column]) {
        corner[at] = 1;
        corner[at + size] = 1;
      }
    }
    const cornersCm = [];
    for (let row = 0; row <= rows; row += 1) {
      const heights = [];
      for (let at = row * wide; at < (row + 1) * wide; at += 1) {
        if (corner[at] === 1) heights.push(String(cm[at]));
      }
      cornersCm.push(heights.join(' '));
    }
    return { squares: said.join(''), cornersCm };
  }

  /**
   * The tree read as a paper of `cols` by `rows` cells has it: `{ size, skip, corner }` - the
   * root's side; for every square, where in the text the square after it and its quarters
   * begins; and for every grid point whether it is a corner of a square of ground - or null,
   * where the text is no tree of that paper.
   */
  function parse(text, cols, rows) {
    const size = rootOf(cols, rows);
    const wide = cols + 1;
    const [skip, corner] = [new Int32Array(text.length), new Uint8Array(wide * (rows + 1))];
    const stack = [[0, 0, size, -1]];
    let at = 0;
    while (stack.length > 0) {
      const [column, row, side, closes] = stack.pop();
      if (closes >= 0) {
        skip[closes] = at;
        continue;
      }
      if (at >= text.length) return null;
      const [kind, place, self] = [text[at], placeOf(column, row, side, cols, rows), at];
      at += 1;
      skip[self] = at;
      if (kind === SPLIT && side > 1 && place !== BEYOND) {
        stack.push([0, 0, 0, self], ...quarters(column, row, side / 2).toReversed());
      } else if (kind !== place || kind === SPLIT) return null;
      if (kind !== GROUND) continue;
      for (const point of [row * wide + column, (row + side) * wide + column]) {
        corner[point] = 1;
        corner[point + side] = 1;
      }
    }
    return at === text.length ? { size, skip, corner } : null;
  }

  /** A row of heights as its texts, a text a height: what stands between two blanks. */
  const heightsOf = (line) => (line === '' ? [] : line.split(' '));
  /** A height is what `Number` makes of a text, where that is finite and the text holds something. */
  const isHeight = (text) => text.trim() !== '' && Number.isFinite(Number(text));
  const counted = (count, one) => `${count} ${count === 1 ? one : `${one}s`}`;

  /**
   * The sentence of the format's list that holds of a ground of version 3 - whose `baseM` is a
   * number, `squares` a text and `cornersCm` a list of texts - on a paper of `cols` by `rows`
   * cells: the first that holds, or null.
   */
  function fault({ squares, cornersCm }, cols, rows) {
    const tree = parse(squares, cols, rows);
    if (tree === null) return NO_TREE;
    if (cornersCm.length !== rows + 1) {
      const has = counted(cornersCm.length, 'row');
      return `${LACKS} ${rows + 1} rows of corners are needed, and it has ${has}.`;
    }
    const wide = cols + 1;
    for (let row = 0; row <= rows; row += 1) {
      const corners = tree.corner.subarray(row * wide, (row + 1) * wide).reduce((a, b) => a + b, 0);
      const heights = heightsOf(cornersCm[row]).length;
      if (heights === corners) continue;
      const of = `${counted(corners, 'corner')} of squares, and ${counted(heights, 'height')}`;
      return `${LACKS} row ${row + 1} has ${of}.`;
    }
    const amiss = cornersCm.findIndex((line) => !heightsOf(line).every(isHeight));
    return amiss < 0 ? null : `${LACKS} row ${amiss + 1} holds what is no number.`;
  }

  // What a tree read holds beyond what it gives: its text, its paper and where its squares lie.
  const INSIDE = new WeakMap();

  /**
   * The tree of a ground that `fault` passed, read: `{ cmAt, lowest, highest, count }` -
   * `cmAt(column, row)`, the ground at any place in centimetres over `baseM`, clamped to the
   * paper; the lowest and the highest corner; how many squares of ground. In typed lists.
   */
  function read({ squares, cornersCm }, cols, rows) {
    const { size, skip, corner } = parse(squares, cols, rows);
    const wide = cols + 1;
    const cm = new Float64Array(wide * (rows + 1));
    let [lowest, highest] = [Infinity, -Infinity];
    for (let row = 0; row <= rows; row += 1) {
      const heights = heightsOf(cornersCm[row]).map(Number);
      for (let at = row * wide, next = 0; at < (row + 1) * wide; at += 1) {
        if (corner[at] === 0) continue;
        cm[at] = heights[next];
        [lowest, highest, next] = [Math.min(lowest, cm[at]), Math.max(highest, cm[at]), next + 1];
      }
    }
    /** The square of ground that holds a cell: down from the root, a quarter at a time. */
    function squareOf(cell, line) {
      let [at, column, row, side] = [0, 0, 0, size];
      while (squares[at] === SPLIT) {
        side /= 2;
        const [right, lower] = [cell >= column + side, line >= row + side];
        at += 1;
        for (let quarter = Number(right) + 2 * Number(lower); quarter > 0; quarter -= 1) {
          at = skip[at];
        }
        [column, row] = [column + (right ? side : 0), row + (lower ? side : 0)];
      }
      return [column, row, side];
    }
    function cmAt(c, r) {
      const [x, y] = [Math.min(Math.max(c, 0), cols), Math.min(Math.max(r, 0), rows)];
      const cell = [Math.min(Math.floor(x), cols - 1), Math.min(Math.floor(y), rows - 1)];
      const [column, row, side] = squareOf(...cell);
      const at = (k, l) => cm[(row + l) * wide + column + k];
      const [u, v] = [(x - column) / side, (y - row) / side];
      return face(at(0, 0), at(side, 0), at(0, side), at(side, side), u, v);
    }
    let count = 0;
    for (const kind of squares) count += kind === GROUND ? 1 : 0;
    const tree = { cmAt, lowest, highest, count };
    INSIDE.set(tree, { squares, size, skip });
    return tree;
  }

  /**
   * Every square of a tree that `read` gave, depth first: `visit(column, row, size, ground)`,
   * `ground` true of a square of ground. Where it returns true of a split square its quarters
   * follow; else none of them.
   */
  function walk(tree, visit) {
    const { squares, size, skip } = INSIDE.get(tree);
    const stack = [[0, 0, 0, size]];
    while (stack.length > 0) {
      const [at, column, row, side] = stack.pop();
      const kind = squares[at];
      if (!visit(column, row, side, kind === GROUND) || kind !== SPLIT) continue;
      const half = side / 2;
      const starts = [at + 1];
      for (let quarter = 1; quarter < 4; quarter += 1) starts.push(skip[starts.at(-1)]);
      const placed = quarters(column, row, half).map((square, k) => [starts[k], ...square]);
      stack.push(...placed.toReversed());
    }
  }

  globalThis.squares = { TOLERANCE_CM, make, fault, read, walk };
})();
