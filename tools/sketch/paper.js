// The paper of the sketch pad: what a view shows of the site. From above (#top), the parcel
// outline. Standing up, a slice of the plot on its ground: along the plot, seen from either
// side of it (#side, #far), or across it, seen from either end (#front, #back). A position is
// in metres of the plot's own frame (site.js) or in cells from the top left corner of the
// plane's paper; a view that is flipped shows that paper from behind. land.js and draw.js draw.
//
// And the ground, which every view asks of the paper and of nothing else (story ST-027). It is
// one: the site's own, as the blocks of ground of the sketch shape it, and its cuts (ST-028).
// - `settle(things)`, with a sketch's things as the sketch holds them - `sketch.doc.things`,
//   and not the things as a view places them - has the ground be as they shape it, by the rule
//   of earth.js, and says whether it worked the ground out anew: it does so only where what
//   shapes the ground is another than the last time - a box of ground or of a cut that changed,
//   and not how high a cut's box reaches. A page calls it when its sketch changed, before it
//   asks the ground.
// - `shaped()` is the grid that was settled last - `heights[row][column]`, metres above sea
//   level at every grid point of the top view's paper, a row after another from its top - or
//   null while the ground is the site's own. It is the paper's: who asks it changes nothing of it.
//   On a paper over 120 m it is null, and `settledIn()` the windows that were settled (ST-042).
// - `groundAt(column, row)` and `groundRow(column, row)` are that one ground at a place of the
//   top view's paper, in metres above sea level and as a row of a standing paper.
// - `realAt(column, row)` and `realRow(column, row)` are the site's own, whatever was settled:
//   for what is to show where ground was filled and where it was cut.
// - The paper has no edge (ST-042): beyond the plot's paper the ground is flat at the height of
//   its nearest edge, and `measured(column, row)` says it is not the plot's own there.
// Until a page calls `settle`, and with no block of ground and no cut, the ground is the site's
// own: `groundAt` is `realAt`, to the last figure.
(() => {
  const { SITE } = globalThis;
  // Each view: its name, the plane it shows, and - standing up - where it looks from, as a
  // bearing on from the plot's own. The front of the house is its downhill end.
  const VIEWS = {
    top: { name: 'Top view', plane: 'top' },
    side: { name: 'Side view', plane: 'side', from: 90 },
    far: { name: 'Other side', plane: 'side', from: 270, flip: true },
    front: { name: 'Front view', plane: 'end', from: 0, flip: true },
    back: { name: 'Back view', plane: 'end', from: 180 },
  };
  const VIEW = Object.keys(VIEWS).find((view) => globalThis.location.hash === `#${view}`) ?? 'top';
  const { plane: PLANE, flip: FLIP = false } = VIEWS[VIEW];
  const CELL_M = SITE.cellM;
  const INK = '#1f2933';
  const FAINT = '#52606d';
  const COLOURS = [
    ['ink', INK],
    ['red', '#d9482b'],
    ['orange', '#f08c00'],
    ['yellow', '#e6c229'],
    ['green', '#5a9e4b'],
    ['teal', '#1f9e8f'],
    ['blue', '#2f7ed8'],
    ['purple', '#8a63d2'],
    ['pink', '#e0719f'],
    ['brown', '#9c6b43'],
    ['grey', '#8795a1'],
  ];
  const WINDS = [
    'north',
    'north-east',
    'east',
    'south-east',
    'south',
    'south-west',
    'west',
    'north-west',
  ];

  // What the papers show from their bottom edge to their top edge: from above, metres across
  // the plot; standing up, metres above sea level.
  const SPANS = { top: [SITE.yFromM, SITE.yToM], side: SITE.sideM };
  const X0 = SITE.xFromM;
  // The space in cells: along the plot, across it - the rows of the top view - and up.
  const COLS = (SITE.xToM - X0) / CELL_M;
  const ACROSS = (SPANS.top[1] - SPANS.top[0]) / CELL_M;
  const UP = (SPANS.side[1] - SPANS.side[0]) / CELL_M;
  // This plane's paper. From left to right it shows metres down the plot - or, of a slice across
  // the plot, the rows of the top view: metres across the plot, the other way round.
  const [LEFT_M, STEP_M] = PLANE === 'end' ? [SPANS.top[1], -CELL_M] : [X0, CELL_M];
  const [Y0, Y1] = PLANE === 'top' ? SPANS.top : SPANS.side;
  const WIDE = PLANE === 'end' ? ACROSS : COLS;
  const ROWS = PLANE === 'top' ? ACROSS : UP;
  const cell = ([a, b]) => [(a - LEFT_M) / STEP_M, (Y1 - b) / CELL_M];
  const metres = ([column, row]) => [LEFT_M + column * STEP_M, Y1 - row * CELL_M];
  /** Where a column of the plane's paper shows on the screen: counted from the right in a flipped view. */
  const shown = (column) => (FLIP ? WIDE - column : column);
  /** A colour of the owner's (ST-039): its value, a text `#rrggbb` in small letters. */
  const isOwn = (colour) => typeof colour === 'string' && /^#[0-9a-f]{6}$/.test(colour);
  /** A colour as `[name, hex]`: of the eleven, by their number, theirs; of the owner's, its value twice; else ink's. */
  const named = (colour) =>
    isOwn(colour) ? [colour, colour] : (Number.isInteger(colour) && COLOURS[colour]) || COLOURS[0];
  const hex = (colour) => named(colour)[1];
  /** A length or an area that is exact on the grid, written to the centimetre and no further. */
  const exact = (value) => String(Number(value.toFixed(2)));
  /** The compass word for a bearing in degrees: 146 is south-east. */
  const wind = (bearing) => WINDS[Math.round(bearing / 45) % WINDS.length];

  // The site's own ground: of a plot of version 1 or 2, metres above sea level at every grid
  // point of the top view's paper, and the texts they were read of; of version 3, its squares.
  // WHOLE: a paper of at most `windows.WHOLE_M` each way - any, where windows.js is not loaded.
  const { baseM: BASE_M, rowsCm, squares: SQUARES } = SITE.ground;
  const TREE = SQUARES === undefined ? null : globalThis.squares.read(SITE.ground, COLS, ACROSS);
  const TEXTS = TREE ? null : rowsCm.map((row) => row.split(' '));
  const GROUND = TEXTS?.map((row) => row.map((cm) => BASE_M + Number(cm) / 100));
  const WHOLE_M = globalThis.windows?.WHOLE_M ?? Infinity;
  const WHOLE = Math.max(COLS, ACROSS) * CELL_M <= WHOLE_M;
  const PAPER = [0, 0, COLS, ACROSS];
  // The one ground as it was settled last - a grid, or on a paper that is not WHOLE its windows,
  // `[{ rect, heights }]` - and what shaped it, as a text.
  let settled = null;
  let inWindows = [];
  let settledBy = '';

  /** A ground at a place of the paper of `heights`, in metres above sea level: between the four grid points of `heights` around it. */
  function heightAt(heights, column, row) {
    const [cols, rows] = [heights[0].length - 1, heights.length - 1];
    const within = (value, most) => Math.min(Math.max(value, 0), most);
    const [c, r] = [within(column, cols), within(row, rows)];
    const [c0, r0] = [Math.min(Math.floor(c), cols - 1), Math.min(Math.floor(r), rows - 1)];
    const along = (line) => line[c0] + (line[c0 + 1] - line[c0]) * (c - c0);
    return along(heights[r0]) + (along(heights[r0 + 1]) - along(heights[r0])) * (r - r0);
  }
  /** The site's own ground at a place of the top view's paper, whatever was settled: of a tree, `earth`'s own expression. */
  const realAt = (column, row) =>
    TREE ? BASE_M + TREE.cmAt(column, row) / 100 : heightAt(GROUND, column, row);
  /** The ground at a place of the top view's paper, in metres above sea level: the one ground, as it was settled. */
  function groundAt(column, row) {
    const inside = ({ rect: [l, t, r, b] }) => column >= l && column <= r && row >= t && row <= b;
    const { rect = PAPER, heights } = settled
      ? { heights: settled }
      : (inWindows.find(inside) ?? {});
    return heights ? heightAt(heights, column - rect[0], row - rect[1]) : realAt(column, row);
  }

  // A site of a rectangle of the paper, by its rectangle as a text: each made once while in use.
  const lands = new Map();
  /** The site as earth.js reads it, cut to a rectangle of the top view's paper `[left, top, right, bottom]` in cells, its ground the grid's own texts: of the whole paper of a plot of version 1 or 2, SITE. */
  function land(rect) {
    const [left, top, right, bottom] = rect;
    if (!TREE && String(rect) === String(PAPER)) return SITE;
    if (lands.has(String(rect))) return lands.get(String(rect));
    const text = (c, r) => (TREE ? String(TREE.cmAt(c, r)) : TEXTS[r][c]);
    const span = (from, to, of) => Array.from({ length: to - from + 1 }, (_, k) => of(from + k));
    const rowsCm = span(top, bottom, (r) => span(left, right, (c) => text(c, r)).join(' '));
    const [xFromM, yToM] = [X0 + left * CELL_M, SPANS.top[1] - top * CELL_M];
    const [xToM, yFromM] = [X0 + right * CELL_M, SPANS.top[1] - bottom * CELL_M];
    const ground = { baseM: BASE_M, rowsCm };
    lands.set(String(rect), { ...SITE, xFromM, xToM, yFromM, yToM, ground });
    return lands.get(String(rect));
  }
  let own;
  /** The site's own ground at every grid point, `heights[row][column]`, made once - or null: of a plot of version 1 or 2, and of a paper that is not WHOLE. */
  function grid() {
    if (!TREE || !WHOLE) return null;
    own ??= land(PAPER).ground.rowsCm.map((row) => row.split(' ').map((cm) => BASE_M + cm / 100));
    return own;
  }
  /** The row of a standing paper that the ground lies in, at a place of the top view's paper - and the site's own. */
  const groundRow = (column, row) => (SPANS.side[1] - groundAt(column, row)) / CELL_M;
  const realRow = (column, row) => (SPANS.side[1] - realAt(column, row)) / CELL_M;

  /**
   * Has the ground be as a sketch's things shape it - as the sketch holds them - and says whether
   * it worked it out anew: only where what shapes it is another than the last time
   * (`earth.shapedBy`). Where no earth.js was loaded, nothing is shaped. On a paper that is not
   * WHOLE, in windows around what shapes it (windows.js). `shaped()` may be null after it: no
   * block of ground and no cut, or none that shapes the ground of the plot.
   */
  function settle(things) {
    const { earth, windows } = globalThis;
    const by = earth ? earth.shapedBy(things) : '';
    if (by === settledBy) return false;
    settledBy = by;
    if (WHOLE) settled = earth?.shaped(land(PAPER), things)?.heights ?? null;
    if (WHOLE) return true;
    const reach = windows.REACH_M / CELL_M;
    const rects = by === '' ? [] : windows.around(windows.shapers(things), reach, PAPER);
    const kept = new Set(rects.map(String));
    for (const key of lands.keys()) if (!kept.has(key)) lands.delete(key);
    inWindows = rects.flatMap((rect) => {
      const heights = earth.shaped(land(rect), windows.shifted(things, rect))?.heights;
      return heights ? [{ rect, heights }] : [];
    });
    return true;
  }
  /** The grid that was settled last, `heights[row][column]` - or null while the ground is the site's own, and on a paper that is not WHOLE. */
  const shaped = () => settled;
  /** The windows settled last, `[{ rect, heights }]`: on a WHOLE paper, none. */
  const settledIn = () => inWindows;
  /** Whether a place of the top view's paper lies on the plot's paper, whose ground the plot holds: beyond it, the ground is unmeasured (ST-042, Rule 4). */
  const measured = (column, row) => column >= 0 && column <= COLS && row >= 0 && row <= ACROSS;
  /** A place along this view's slice, as a place of the top view's paper: `cut` is where the slice runs. */
  const onSlice = (place, cut) => (PLANE === 'end' ? [cut, place] : [place, cut]);

  /**
   * Where a slice enters and leaves the plot's outline, in metres along it; nowhere beside the
   * plot. A slice along the plot runs `at` so many metres across it, one across the plot so many
   * metres down it.
   */
  function plotSpan(at, plane) {
    const [along, across] = plane === 'end' ? [1, 0] : [0, 1];
    const found = [];
    SITE.outline.forEach((from, index) => {
      const to = SITE.outline[(index + 1) % SITE.outline.length];
      if (from[across] > at !== to[across] > at) {
        const share = (at - from[across]) / (to[across] - from[across]);
        found.push(from[along] + share * (to[along] - from[along]));
      }
    });
    return found.length > 0 ? [Math.min(...found), Math.max(...found)] : [];
  }

  /**
   * The page's check of its own data, run when it opens: the outline must enclose the area the
   * land register states, to a square metre - where the plot states one: what a plot does not
   * say, the pad does not check (ST-030) - and the ground must have a height at every grid point
   * of the paper, within what the standing views show.
   */
  function siteFaults() {
    const faults = [];
    const twice = SITE.outline.reduce((sum, [x, y], index) => {
      const [x2, y2] = SITE.outline[(index + 1) % SITE.outline.length];
      return sum + x * y2 - x2 * y;
    }, 0);
    const [area, stated] = [Math.abs(twice) / 2, SITE.officialAreaM2];
    if (stated !== undefined && !(Math.abs(area - stated) <= 1)) {
      faults.push(
        `the outline encloses ${area.toFixed(1)} m², and the land register states ${stated} m²`,
      );
    }
    const inside = (height) => height > SPANS.side[0] && height < SPANS.side[1];
    // Of a tree, its lowest and highest corner: a face lies between its corners.
    const ends = TREE && [TREE.lowest, TREE.highest].map((cm) => BASE_M + cm / 100);
    const rows = (GROUND ?? []).every((row) => row.length === COLS + 1);
    const whole = TREE || (GROUND.length === ACROSS + 1 && rows);
    if (!whole || !(ends || GROUND.flat()).every(inside)) faults.push('the ground lacks a height');
    return faults;
  }

  const views = { VIEWS, VIEW, PLANE, FLIP };
  const frame = { CELL_M, SPANS, X0, Y0, Y1, COLS, ACROSS, UP, WIDE, ROWS };
  const colours = { INK, FAINT, COLOURS, isOwn, named, hex, exact };
  const ground = { settle, shaped, settledIn, groundAt, groundRow, realAt, realRow };
  const site = { ...ground, WHOLE, land, grid, measured, onSlice, plotSpan, siteFaults };
  globalThis.paper = { ...views, ...frame, ...colours, ...site, cell, metres, shown, wind };
})();
