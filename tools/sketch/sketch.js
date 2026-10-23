// The sketch: one space of things that every view shows. A box reaches along the plot from one
// column to another (`x`), across it from one row of the top view to another (`y`), and up from
// one row of a standing view to another (`z`). An object to judge size by has a `kind`, stands with
// its middle at a column and a row, on a `floor` - a row of a standing view - or on the 'ground'.
// Boxes that have one `group` are one block: cut into shape, or merged. A box's top may `slope`.
// The views show three planes of the space. 'top' is a level of it. 'side' is a slice along the
// plot, 'end' a slice across it: each is seen from either side. What is changed in one view is
// changed in all. Here: how the sketch is kept, undone and redone, which layers a plane has, and
// what lies on each. What a tool does to it is in strokes.js.
(() => {
  const { localStorage, sessionStorage, paper, shapes, blocks, legacy, PLOT } = globalThis;
  const { CELL_M, SPANS, X0, COLS, ACROSS } = paper;
  // Of a box's three extents: the one that runs along the paper of a plane, the one that runs
  // up it, and the one that runs into it.
  const AXES = { top: ['x', 'y', 'z'], side: ['x', 'z', 'y'], end: ['y', 'z', 'x'] };

  // The first key - and the sketch's own: the one that the plot's script says (PLOT, ST-030).
  const SPACE = 'blockplot/sketch/space';
  const KEY = PLOT?.key ?? SPACE;
  const UNDO_STEPS = 100;
  // The steps to undo and redo outlast a switch of view and a reload, while the tab is open: all,
  // or the newest few that its store takes. One slot a tab: steps of another key say so, `of`.
  const STEPS_KEY = `${SPACE}/steps`;
  const OF = KEY === SPACE ? {} : { of: KEY };
  const STEPS_KEPT = [UNDO_STEPS, 20, 5, 0];
  // A text under the pad's key that is no sketch this pad can read - no JSON, another `space`, a
  // kind it does not know - is never written over. It is set aside first, as it is, under a key
  // of its own: this one and a number, from 1 on. Such a key is written once, and never again.
  const ASIDE_KEY = `${KEY}/unread`;
  const asideAt = (number) => localStorage.getItem(`${ASIDE_KEY}/${number}`);
  const NO_ROOM =
    'This browser is not keeping the sketch: it holds one that this pad cannot read, and has no ' +
    'room to set it aside, so nothing was written. Use "Save file" before you close the tab.';
  // How a layer shows while another is drawn on, in a click's order: faded where nobody set it.
  const SHOWS = ['faded', 'shown', 'hidden'];

  // The side view once showed three strips of the plot, along these lines across it, in metres:
  // a sketch of then says which strip was drawn on, where one of now says where the cut runs.
  const STRIP_LINES_M = [19, 12.5, 6.5];
  const blank = () => ({ space: 12, things: [], floors: [], notes: [], on: {}, show: {} });
  const span = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] < p[1];
  const isBox = (t) => t.kind === undefined;
  const stands = (t) => t.floor === 'ground' || Number.isFinite(t.floor);
  const isObject = (t) => shapes.known(t) && [t.x, t.y].every(Number.isFinite) && stands(t);
  const isThing = (t) => Object(t) === t && (isBox(t) ? [t.x, t.y, t.z].every(span) : isObject(t));
  // A note - a line, a label, a flat box of an old sketch - is written on a plane.
  const isNote = (n) =>
    Object.keys(AXES).includes(n?.view) &&
    [n.line, n.label, n.flat].filter(Array.isArray).length === 1;

  /** What was read from a file or from the browser, as a sketch - or null where it is none. */
  function adopt(d) {
    if (![d?.things, d?.floors, d?.notes].every(Array.isArray)) return null;
    if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(d.space)) return null;
    if (!d.things.every(isThing) || !d.notes.every(isNote)) return null;
    const [on, show] = [{ ...d.on }, { top: { ...d.show?.top } }];
    if (d.space === 1) on.side = (SPANS.top[1] - STRIP_LINES_M[on.side]) / CELL_M;
    return { ...d, space: 12, on, show };
  }

  /** The sketch that this browser keeps, or null: none yet, or none that can be read. */
  function stored() {
    try {
      return adopt(JSON.parse(localStorage.getItem(KEY)));
    } catch {
      return null;
    }
  }

  /**
   * The texts that this browser keeps as a sketch and a pad could not read, each as it was kept:
   * `aside`, the ones set aside, oldest first, and `waiting`, the one under the pad's own key
   * where this pad cannot read it - or null. It throws where the store cannot be asked.
   */
  function unread() {
    const aside = [];
    while (asideAt(aside.length + 1) !== null) aside.push(asideAt(aside.length + 1));
    return { aside, waiting: stored() === null ? localStorage.getItem(KEY) : null };
  }

  // The first time, what the sketches of before hold, a view each: they are the first key's.
  const kept = stored();
  const old = kept || KEY !== SPACE ? null : legacy.read();
  const brought = old && adopt({ ...blank(), things: old.things, notes: old.notes });
  const sketch = {
    KEY,
    doc: kept ?? brought ?? adopt(blank()),
    past: [],
    future: [],
    // What went wrong last, for the page to say: empty when nothing did.
    trouble: old?.left
      ? `Of the old side view, the layer that was drawn on was brought over. Its ${old.left} other layers stay in this browser, as they were.`
      : '',
    // The page's: called after every change, to show it.
    onChange() {},
  };

  /**
   * Keeps the sketch in this browser, and has the page say so where the browser refuses. A text
   * that waits under the pad's key, unread, is set aside before, under the next number - which
   * holds nothing - unless it is set aside already. Where the store takes no more of it, nothing
   * is written at all.
   */
  function keep() {
    let waits = false;
    try {
      const { aside, waiting } = unread();
      waits = waiting !== null && !aside.includes(waiting);
      if (waits) localStorage.setItem(`${ASIDE_KEY}/${aside.length + 1}`, waiting);
      waits = false;
      localStorage.setItem(KEY, JSON.stringify(sketch.doc));
      sketch.trouble = '';
    } catch {
      sketch.trouble = waits
        ? NO_ROOM
        : 'This browser is not keeping the sketch: use "Save file" before you close the tab.';
    }
  }

  /** Every change goes through here: it can be undone, and it is kept as soon as it is made. */
  function change(mutate) {
    const before = JSON.stringify(sketch.doc);
    mutate(sketch.doc);
    if (JSON.stringify(sketch.doc) === before) return;
    // ponytail: an undo step is the whole sketch as text; steps per thing if one reaches megabytes
    sketch.past.push(before);
    if (sketch.past.length > UNDO_STEPS) sketch.past.shift();
    sketch.future.length = 0;
    keep();
    sketch.onChange();
  }

  /** Undo is a step from the past to the future, redo one back: read as a sketch is, or dropped. */
  function step(from, to) {
    const taken = from.length > 0 ? adopt(JSON.parse(from.pop())) : null;
    if (taken === null) return;
    to.push(JSON.stringify(sketch.doc));
    sketch.doc = taken;
    keep();
    sketch.onChange();
  }

  /** Keeps the steps for this tab, as the page goes. */
  function remember() {
    for (const count of STEPS_KEPT) {
      const newest = (steps) => steps.slice(Math.max(0, steps.length - count));
      try {
        const steps = { past: newest(sketch.past), future: newest(sketch.future), ...OF };
        sessionStorage.setItem(STEPS_KEY, JSON.stringify(steps));
        return;
      } catch {
        // More than the store takes: fewer steps, and in the end none.
      }
    }
  }

  /** Takes up the steps the tab kept, as the page comes - where they are this key's. */
  function recall() {
    const texts = (steps) =>
      (Array.isArray(steps) ? steps : []).filter((s) => typeof s === 'string');
    try {
      const { past, future, of = SPACE } = JSON.parse(sessionStorage.getItem(STEPS_KEY));
      if (of !== KEY) return;
      sketch.past.splice(0, Infinity, ...texts(past));
      sketch.future.splice(0, Infinity, ...texts(future));
    } catch {
      // Nothing kept, or nothing that can be read: no steps.
    }
  }

  /**
   * A thing as it lies on the paper of a plane: left, top, right, bottom, in cells. Standing up,
   * an object on the ground stands as high as the ground lies where it stands.
   */
  function rect(t, plane) {
    const [along, upright] = AXES[plane];
    if (isBox(t)) return [t[along][0], t[upright][0], t[along][1], t[upright][1]];
    const [long, wide, high] = shapes.sizeOf(t).map((metres) => metres / CELL_M);
    // An object fits the grid where it can: what is whole cells long lies on whole cells, as
    // near as may be to where it was put. What is not - a window in a wall - lies about its middle.
    const edge = (middle, cells) =>
      Number.isInteger(cells) ? Math.round(middle - cells / 2) : middle - cells / 2;
    const [left, top] = [edge(t.x, long), edge(t.y, wide)];
    if (plane === 'top') return [left, top, left + long, top + wide];
    const ground = () => paper.groundRow(left + long / 2, top + wide / 2);
    const lift = (shapes.KINDS[t.kind].lift ?? 0) / CELL_M;
    const sill = (t.floor === 'ground' ? ground() : t.floor) - lift;
    // Along the plot an object shows its length, across the plot its width.
    const [from, to] = plane === 'side' ? [left, left + long] : [top, top + wide];
    return [from, sill - high, to, sill];
  }

  /**
   * Whether a thing lies on a layer of a plane. A slice has what it runs through, and nothing
   * else: along the plot it runs along a row of the top view, across the plot along a column.
   * A level of the top view has the boxes it cuts just above their floor - the ones that stand
   * on it and the ones that rise through it - and the objects that stand on it; the 'ground' has
   * the objects on the ground.
   */
  function lies(t, plane, key) {
    if (plane === 'top') return isBox(t) ? t.z[0] < key && key <= t.z[1] : t.floor === key;
    const [left, top, right, bottom] = rect(t, 'top');
    return plane === 'side' ? top <= key && key < bottom : left <= key && key < right;
  }

  /** The levels, from the top down: every height a thing stands at or a note was written on, and the ones made by hand. */
  function levels() {
    const { things, notes, floors } = sketch.doc;
    const noted = notes.filter((note) => note.view === 'top').map((note) => note.at);
    const stood = things.map((t) => (isBox(t) ? t.z[1] : t.floor));
    return [...new Set([...floors, ...stood, ...noted].filter(Number.isFinite))].sort(
      (a, b) => a - b,
    );
  }

  /** The layers of the top view, as they are listed: the levels, and the ground. */
  const keys = () => [...levels(), 'ground'];
  const nameOf = (plane, key) => {
    if (plane === 'side') return `Slice ${SPANS.top[1] - key * CELL_M} m across the plot`;
    if (plane === 'end') return `Slice ${X0 + key * CELL_M} m down the plot`;
    return key === 'ground' ? 'Ground' : `Level ${SPANS.side[1] - key * CELL_M} m`;
  };

  /**
   * The layer of a plane that is drawn on. Of a slice, where it runs - along a row of the top
   * view, or across the plot along a column: through the middle of the paper, until it is moved.
   * From above, the level that was picked; where that is gone, the level nearest to it; where
   * none was picked, the highest.
   */
  function on(plane = paper.PLANE) {
    const picked = sketch.doc.on[plane];
    if (plane !== 'top') {
      const most = plane === 'side' ? ACROSS : COLS;
      const there = Number.isInteger(picked) && picked >= 0 && picked <= most;
      return there ? picked : Math.round(most / 2);
    }
    const all = keys();
    if (all.includes(picked)) return picked;
    const nearer = (a, b) => (Math.abs(b - picked) < Math.abs(a - picked) ? b : a);
    return Number.isFinite(picked) && all.length > 1 ? levels().reduce(nearer) : all[0];
  }
  /** How a layer of the top view shows while another is drawn on. */
  const showOf = (key) => {
    const set = sketch.doc.show.top[key];
    return SHOWS.includes(set) ? set : SHOWS[0];
  };
  const shows = (t) => !globalThis.sections?.hides(t); // sections/model.js, where a page loads it.

  /**
   * What lies on a layer of a plane, and shows - all but what a hidden section holds (`shows`):
   * its things, each with its place among all things and its rect on the paper, and its notes -
   * the lines, labels and flat boxes drawn on it. A level has the notes drawn on that level; a
   * slice has its notes wherever it runs. The things are in the order they lie over each other,
   * the one on top last - so they are drawn, and so the pointer takes them: objects over boxes,
   * and over those what lies on a worktop or is set in a wall, whichever was made first.
   */
  function layer(plane, key) {
    const { things, notes } = sketch.doc;
    const on = (t, index) =>
      lies(t, plane, key) && shows(t) ? [{ index, thing: t, rect: rect(t, plane) }] : [];
    const over = ({ thing }) => (isBox(thing) ? 0 : 1 + (shapes.KINDS[thing.kind].lift ?? 0));
    const noted = (note) => note.view === plane && (plane !== 'top' || note.at === key);
    return {
      key,
      name: nameOf(plane, key),
      things: things.flatMap(on).sort((a, b) => over(a) - over(b)),
      notes: notes.filter(noted),
    };
  }

  /** The boxes of the block a box belongs to: the ones of its group, or the box alone. */
  const blockOf = (t) =>
    t.group === undefined ? [t] : sketch.doc.things.filter((other) => other.group === t.group);

  /**
   * How large a block is, in metres: the floor it covers, how far it reaches along the plot,
   * across it and up, how much it holds under its top, and how high above sea level its floor is.
   */
  function stats(t) {
    const boxes = blockOf(t);
    const edge = (pick, axis, end) => pick(...boxes.map((box) => box[axis][end]));
    const reach = (axis) => (edge(Math.max, axis, 1) - edge(Math.min, axis, 0)) * CELL_M;
    const holds = (b) => (b.x[1] - b.x[0]) * (b.y[1] - b.y[0]) * blocks.highOf(b);
    return {
      boxes: boxes.length,
      area: blocks.area(boxes.map((box) => rect(box, 'top'))) * CELL_M ** 2,
      long: reach('x'),
      wide: reach('y'),
      high: reach('z'),
      volume: boxes.reduce((sum, box) => sum + holds(box), 0) * CELL_M ** 3,
      floor: SPANS.side[1] - edge(Math.max, 'z', 1) * CELL_M,
    };
  }

  recall();
  globalThis.addEventListener?.('pagehide', remember);
  const keeping = { SHOWS, blank, adopt, stored, unread, keep, change, step, remember, recall };
  const showing = { AXES, isBox, rect, lies, shows, levels, keys, nameOf, on, showOf, layer };
  globalThis.sketch = Object.assign(sketch, keeping, showing, { blockOf, stats });
})();
