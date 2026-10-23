// What is done to what is selected, whole (T-037.5, T-037.6): one thing or several. Taken away -
// by Delete, Backspace, and the right button's menu (right-menu.js) - carried to another level of
// the top view, turned, given a category, copied, pasted and duplicated. Each change is one change
// of the sketch, one step that Undo takes back. Of a box, its whole block, as a click of the eraser
// takes it (strokes.js); an object alone. Loaded by index.html after levels.js, whose way of
// carrying a box with its slope it follows (`shiftLevel`), and after sections/model.js.
(() => {
  const { paper, sketch, blocks, shapes } = globalThis;
  const { PLANE, FLIP } = paper;
  // Of a box's three extents, the ones that run along the paper of this plane, and up it.
  const [ALONG, UPRIGHT] = sketch.AXES[PLANE];
  // What is refused, and why. The paper has no edge (ST-042): a thing goes as far as it is taken.
  const REFUSED = { ground: 'A block stands on a level, not on the ground' };
  const isBox = (t) => sketch.isBox(t);
  const there = (things) => things.filter((t) => sketch.doc.things.includes(t));

  /** Of things of the sketch, the whole of each, once: of a box its block, of an object itself. */
  const wholes = (things) => [
    ...new Set(things.flatMap((t) => (isBox(t) ? sketch.blockOf(t) : [t]))),
  ];

  /** Takes away the things, whole, in one step - and nothing where none of them is in the sketch. */
  function remove(things) {
    const gone = wholes(there(things));
    if (gone.length === 0) return;
    sketch.change((doc) => {
      doc.things = doc.things.filter((t) => !gone.includes(t));
    });
  }

  /** The row a thing stands on: a box's floor, an object's - a row of the paper, or 'ground'. */
  const standsOn = (t) => (isBox(t) ? t.z[1] : t.floor);

  /**
   * The blocks among the things, each with the rows it is carried by to stand on `floor`: the
   * rows between the level of the thing pressed (`z[1]` of a box) and that level, the same for
   * all, so that they keep their heights to each other. Where the thing pressed stands on the
   * ground, there are no rows to count: each block by the rows between its first box and `floor`.
   */
  function carriedBy(things, floor, pressed = things[0]) {
    const rows = floor - standsOn(pressed);
    const seen = new Set();
    return things.filter(isBox).flatMap((box) => {
      if (seen.has(box)) return [];
      const block = sketch.blockOf(box);
      for (const part of block) seen.add(part);
      return [{ block, by: Number.isFinite(rows) ? rows : floor - box.z[1] }];
    });
  }

  /**
   * Why the things cannot be carried to a level of the top view, `floor` - a row, or 'ground' -
   * or '' where they can: a block goes on no ground, and to any level, wherever that takes its
   * boxes. An object goes anywhere.
   */
  function refusedLevel(things, floor, pressed = things[0]) {
    const moved = carriedBy(things, floor, pressed);
    return moved.length > 0 && !Number.isFinite(floor) ? REFUSED.ground : '';
  }

  /** A box moved by so many cells along, up and into the paper, and so many rows up the side view's: its slope with it. */
  function shifted(box, by, rows) {
    const go = (axis, cells) => box[axis].map((at) => at + cells);
    const to = { ...box, [ALONG]: go(ALONG, by[0]), [UPRIGHT]: go(UPRIGHT, by[1]) };
    return Object.assign(box, blocks.carried(box, { ...to, z: to.z.map((at) => at + rows) }));
  }

  /**
   * Carries the things to a level of the top view, in one step: an object's `floor` goes by the
   * rows of `carriedBy` - to `floor` itself where there are none, from or to the ground; a block
   * goes up or down whole, every box of it by as many rows, a top that slopes with it. Refused -
   * nothing changes - where `refusedLevel` says why: it answers whether it carried them.
   */
  function toLevel(things, floor, pressed = things[0]) {
    if (refusedLevel(things, floor, pressed)) return false;
    const moved = carriedBy(things, floor, pressed);
    const rows = floor - standsOn(pressed);
    sketch.change(() => {
      for (const t of things.filter((one) => !isBox(one)))
        t.floor = Number.isFinite(rows) && Number.isFinite(t.floor) ? t.floor + rows : floor;
      for (const { block, by } of moved) for (const box of block) shifted(box, [0, 0], by);
    });
    return true;
  }

  /** Turns every object among the things a quarter on, as R turns one (`sketch.turn`): one step. */
  function turnEach(things) {
    const objects = there(things).filter((t) => !isBox(t));
    sketch.change(() => {
      for (const t of objects) {
        t.turn = (shapes.turnOf(t) + 1) % 4;
        delete t.turned;
      }
    });
  }

  /** Gives every block among the things a category of the list, or '' for by its name - as `sketch.categorise` writes it: one step. */
  function categoriseEach(things, key) {
    const known = !key || globalThis.categories.LIST.some((row) => row.key === key);
    const boxes = wholes(there(things).filter(isBox));
    if (!known) return;
    sketch.change(() => {
      for (const box of boxes) {
        if (!key) delete box.category;
        else {
          box.category = key;
          delete box.is;
        }
      }
    });
  }

  /**
   * Copies of things, new to the sketch: each group among them a group of its own, and a section
   * the sketch does not have dropped from a box (sections/model.js).
   */
  function fresh(things, doc) {
    const copies = JSON.parse(JSON.stringify(things));
    const known = new Set((globalThis.sections?.list(doc) ?? []).map(({ id }) => id));
    const groups = new Map();
    let last = Math.max(0, ...doc.things.map((t) => t.group ?? 0));
    for (const t of copies) {
      if (t.group !== undefined)
        t.group = groups.get(t.group) ?? groups.set(t.group, ++last).get(t.group);
      if ('section' in t && !known.has(t.section)) delete t.section;
    }
    return copies;
  }

  /** Lays copies of things in the sketch, in one step, each moved by `cells` along and up the paper and `rows` up, as far as they say: the paper has no edge. What it laid. */
  function lay(things, cells, rows, floor) {
    let made = [];
    sketch.change((doc) => {
      made = fresh(things, doc);
      for (const t of made) {
        if (isBox(t)) shifted(t, cells, rows);
        else {
          t[ALONG] += cells[0];
          if (PLANE === 'top') [t[UPRIGHT], t.floor] = [t[UPRIGHT] + cells[1], floor(t)];
        }
      }
      doc.things.push(...made);
    });
    return made;
  }

  /** A copy of each of the things, whole, one cell right of it as seen on screen - in one step: the copies. */
  function duplicate(things) {
    const whole = wholes(there(things));
    if (whole.length === 0) return [];
    return lay(whole, [FLIP ? -1 : 1, 0], 0, (t) => t.floor);
  }

  // WHAT WAS COPIED, in this page's memory alone - never the system's clipboard: copies of the
  // things, whole, the plane and the layer they were copied on. A switch of view loads the page
  // anew, and it goes with it.
  let clip = null;
  /** Copies the things, whole: what was copied before is gone. Whether anything was. */
  function copy(things) {
    const whole = wholes(there(things));
    if (whole.length > 0)
      clip = { plane: PLANE, on: sketch.on(), things: JSON.parse(JSON.stringify(whole)) };
    return whole.length > 0;
  }
  const copied = () => clip?.plane === PLANE;

  /** The rows that copies go up from the level they were copied on to the one drawn on - none where either is the ground. */
  const rowsUp = () => {
    const [from, to] = [clip.on, sketch.on()];
    return PLANE === 'top' && Number.isFinite(from) && Number.isFinite(to) ? to - from : 0;
  };

  /** Why what was copied cannot be pasted here, or '' where it can: from above, a block on no ground - on any level, wherever that takes it. */
  function pasteRefused() {
    if (!copied()) return 'Nothing is copied';
    const boxes = PLANE === 'top' ? clip.things.filter(isBox) : [];
    return boxes.length > 0 && !Number.isFinite(sketch.on()) ? REFUSED.ground : '';
  }

  /**
   * Lays what was copied anew, in one step, so that the middle of all of it on this plane's paper
   * lies on the cell of `at`, in whole cells. From above onto the level drawn on, every thing by
   * the rows between the level it was copied on and that one - an object to it, from or to the
   * ground; in a slice along the paper alone, its heights and its places across it kept. What it
   * laid - nothing where `pasteRefused` says why.
   */
  function paste(at) {
    if (pasteRefused()) return [];
    const rects = clip.things.map((t) => sketch.rect(t, PLANE));
    const middle = (i) =>
      (Math.min(...rects.map((r) => r[i])) + Math.max(...rects.map((r) => r[i + 2]))) / 2;
    const by = [0, 1].map((i) => Math.floor(at[i]) - Math.floor(middle(i)));
    const [rows, on] = [rowsUp(), sketch.on()];
    const floor = (t) =>
      Number.isFinite(on) && Number.isFinite(t.floor) && Number.isFinite(clip.on)
        ? t.floor + rows
        : on;
    return lay(clip.things, PLANE === 'top' ? by : [by[0], 0], rows, floor);
  }

  const several = { turnEach, categoriseEach, copy, copied, paste, pasteRefused, duplicate };
  Object.assign(sketch, { remove, refusedLevel, toLevel, ...several });
})();
