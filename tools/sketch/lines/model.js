// The lines of a sketch (ST-039): a line of the sketch, `notes[].line`, is one flat list -
// `[x1, y1, ..., xn, yn, colour]`, two points or more, the colour last where the list is odd
// (version 12). Here: its points and colour, a point put on the paper, a segment measured, where
// a line lies, on which layer it is, what is said of it, and the line in progress and its steps.
// No page, no sketch but the line it is handed, and nothing read as it loads: of the paper only
// what it is handed - how long a cell is, `cellM`, and whether a view is flipped, `flip` - and
// `paper.exact` when it says a line in words.
(() => {
  /** The points of a line, each `[x, y]`: its colour, last where the list is odd, is none. */
  const points = (line) => line.slice(1).flatMap((y, at) => (at % 2 ? [] : [[line[at], y]]));
  /** The colour of a line: its last entry, where the list is odd; else none. */
  const colourOf = (line) => (line.length % 2 ? line.at(-1) : null);
  /** The flat list a line of the sketch is, of its points and its colour. */
  const made = (list, colour) => [...list.flat(), colour];
  /** Each segment of a line, `[a, b]`, from its first point to its last. */
  const segments = (line) => points(line).flatMap((b, at, all) => (at ? [[all[at - 1], b]] : []));

  /**
   * A place of the paper, in cells, as a point of a line: the nearest grid point - or, `free`,
   * to the centimetre (Rule 1). Never -0, which a sketch would write as 0.
   */
  const snapped = (at, free, cellM) =>
    at.map((v) => (free ? Math.round(v * cellM * 100) / (cellM * 100) : Math.round(v)) + 0);

  /**
   * A segment from `a` to `b` as the view shows it: its length in metres, `m`, and its angle in
   * degrees from 0 up to 360, `deg`, counter-clockwise from the screen's right. Rows run down the
   * screen, and a flipped view's columns run leftwards.
   */
  function measured(a, b, cellM, flip) {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const deg = (Math.atan2(-dy, flip ? -dx : dx) * 180) / Math.PI;
    return { m: Math.hypot(dx, dy) * cellM, deg: (deg + 360) % 360 };
  }

  /** How far a place lies from a segment, in cells. */
  function apart([x, y], [[x1, y1], [x2, y2]]) {
    const [dx, dy] = [x2 - x1, y2 - y1];
    const long = dx * dx + dy * dy;
    const t = long ? Math.min(1, Math.max(0, ((x - x1) * dx + (y - y1) * dy) / long)) : 0;
    return Math.hypot(x - x1 - t * dx, y - y1 - t * dy);
  }
  /** Whether a place lies within `reach` cells of a segment of a line. */
  const near = (line, at, reach) => segments(line).some((segment) => apart(at, segment) <= reach);

  /** Whether a segment passes through the inside of a box. Along its edge is outside. */
  function through([left, top, right, bottom], [[x1, y1], [x2, y2]]) {
    const [dx, dy] = [x2 - x1, y2 - y1];
    let [enters, leaves] = [0, 1];
    // Each side of the box in turn: how far along the segment it is crossed, inwards or outwards.
    for (const [p, q] of [
      [-dx, x1 - left],
      [dx, right - x1],
      [-dy, y1 - top],
      [dy, bottom - y1],
    ]) {
      if (p === 0 && q <= 0) return false;
      if (p < 0) enters = Math.max(enters, q / p);
      if (p > 0) leaves = Math.min(leaves, q / p);
    }
    return enters < leaves;
  }
  /** Whether a segment of a line passes through the inside of a box `[left, top, right, bottom]`. */
  const crosses = (rect, line) => segments(line).some((segment) => through(rect, segment));
  /** Whether every point of a line lies in a box, its edge within. */
  const within = ([left, top, right, bottom], line) =>
    points(line).every(([x, y]) => x >= left && x <= right && y >= top && y <= bottom);

  /** Whether a line on every level is hidden by its own switch: `true`, and nothing else, says so. */
  const hidden = (note) => note.at === 'every' && note.hidden === true;
  /**
   * Whether a note is on a layer of a plane: on a slice wherever it runs; from above on its level -
   * or on every level, but for a line that its own switch hides, which is on none (Rule 2).
   */
  const here = (note, plane, key) =>
    note.view === plane &&
    (plane !== 'top' || note.at === key || (note.at === 'every' && !hidden(note)));

  /** What is said of a line: its corners, its length in all, its colour's `name`, and every level. */
  function words(note, cellM, name) {
    const long = segments(note.line).reduce((sum, [a, b]) => sum + measured(a, b, cellM).m, 0);
    const every =
      note.at !== 'every' ? '' : hidden(note) ? ', on every level, hidden' : ', on every level';
    const length = globalThis.paper.exact(long);
    return `Line of ${points(note.line).length} corners, ${length} m long, in ${name}${every}.`;
  }

  // A SELECTED LINE CHANGED (T-039.4): what a field says as a length or an angle, a segment set by
  // the two, and the line put on every level, hidden or recoloured - each changing the note or the
  // line it is handed, and nothing else.

  // Digits with one point or one comma among them, or none: no sign, no unit, no exponent.
  const DIGITS = /^(\d+[.,]?\d*|[.,]\d+)$/;
  /** A typed number rounded to `places` decimals by its own digits, so that 30.05 is 30.1. */
  const rounded = (digits, places) => Math.round(Number(`${digits}e${places}`)) / 10 ** places;
  /** A length typed: `{ m }`, to the centimetre and more than nought, or `{ refused }`. */
  function typedLength(text) {
    const asked = String(text ?? '').trim();
    const m = DIGITS.test(asked) ? rounded(asked.replace(',', '.'), 2) : 0;
    return m > 0 ? { m } : { refused: 'A length is a number of metres, more than nought.' };
  }
  /** An angle typed: `{ deg }`, to a tenth and taken round to 0 up to 360 - `-90` is 270 - or `{ refused }`. */
  function typedAngle(text) {
    const asked = String(text ?? '').trim();
    const minus = asked.startsWith('-');
    const digits = minus ? asked.slice(1) : asked;
    if (!DIGITS.test(digits)) return { refused: 'An angle is a number of degrees.' };
    const deg = rounded(digits.replace(',', '.'), 1) * (minus ? -1 : 1);
    return { deg: Math.round((((deg % 360) + 360) % 360) * 10) / 10 + 0 };
  }

  /**
   * The line with point `at + 1` where `m` metres at `deg` degrees from point `at` put it, as the
   * view shows the paper (`measured`), to the millimetre - every other point where it was -
   * wherever that is: the paper has no edge (ST-042). `paper` is `{ cellM, flip }`, and may say
   * more.
   */
  function setSegment(line, at, m, deg, { cellM, flip }) {
    const all = points(line);
    const [x, y] = all[at];
    const [cells, turn] = [m / cellM, (deg * Math.PI) / 180];
    const mm = (v) => Math.round(v * cellM * 1000) / (cellM * 1000) + 0;
    const end = [mm(x + (flip ? -1 : 1) * cells * Math.cos(turn)), mm(y - cells * Math.sin(turn))];
    all[at + 1] = end;
    return { line: line.length % 2 ? made(all, line.at(-1)) : all.flat() };
  }

  /** A line put on every level, or off it onto `level` - and its switch taken away with it. */
  function everyLevel(note, every, level) {
    note.at = every ? 'every' : level;
    if (!every) delete note.hidden;
  }
  /** A line on every level hidden by its own switch, or shown. */
  const hide = (note, hidden) => void (hidden ? (note.hidden = true) : delete note.hidden);
  /** A line in another colour: the last entry of its list, and nothing else of it. */
  const recolour = (note, colour) => void (note.line = made(points(note.line), colour));

  // THE LINE IN PROGRESS, `{ points, placing }`: its points so far, and whether a point follows
  // the pointer. Each step gives the next, or null for none.

  /** A press: the first point, or one more at the end - but none within `reach` cells of the last. */
  function pressed(drawing, point, reach) {
    if (!drawing) return { points: [point], placing: true };
    const last = drawing.points.at(-1);
    if (Math.hypot(point[0] - last[0], point[1] - last[1]) <= reach) return null;
    return { points: [...drawing.points, point], placing: true };
  }
  /** Escape: the point being placed dropped, where there is one; else the line. */
  const escaped = (drawing) => (drawing?.placing ? { ...drawing, placing: false } : null);
  /** The line ended: its points, where there are two or more - a line of one point is not kept. */
  const ended = (drawing) => (drawing?.points.length >= 2 ? drawing.points : null);

  const reading = { points, colourOf, made, snapped, measured, near, crosses, within };
  const changing = { typedLength, typedAngle, setSegment, everyLevel, hide, recolour };
  globalThis.lines = { ...reading, here, words, ...changing, pressed, escaped, ended };
})();
