// What a stroke of a tool does to the sketch, on the layer of this view's plane that is drawn
// on. A stroke runs from where the pointer went down to where it is, in cells of the plane's
// paper. Boxes that have one `group` are one block - cut into shape, or merged: they are
// moved, copied and taken away together.
(() => {
  const { paper, blocks, shapes, sketch } = globalThis;
  const { PLANE, CELL_M } = paper;
  // How high a box is that is drawn in the top view, unless another height is asked for.
  const STOREY_M = 3;
  // How deep a box is that is drawn on a slice: half of it to either side of the slice, until
  // another view makes it otherwise.
  const DEPTH_M = 6;
  // How near the pointer an eraser takes a line, and a label, in cells.
  const [REACH, LABEL_REACH] = [0.3, 1];
  // Of a box's three extents, the ones that run along the paper of this plane, up it, into it.
  const [ALONG, UPRIGHT, INTO] = sketch.AXES[PLANE];
  const half = (value) => Math.round(value * 2) / 2;
  const overlap = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

  const grid = () => globalThis.grid ?? { floor: Math.floor, round: Math.round, shown: CELL_M };
  /** What a stroke means in cells: the squares of the grid shown that it touches - of grid.js; where it is not loaded, the cells - and an eraser's reach. A line is its points (lines/model.js). */
  function shape({ from, to }) {
    const low = (i) => Math.min(from[i], to[i]);
    const high = (i) => Math.max(from[i], to[i]);
    const [on, past] = [(i, at) => grid().floor(at(i), i), grid().shown / CELL_M];
    return {
      cells: [on(0, low), on(1, low), on(0, high) + past, on(1, high) + past],
      reach: [low(0) - REACH, low(1) - REACH, high(0) + REACH, high(1) + REACH],
    };
  }

  const onLayer = () => sketch.layer(PLANE, sketch.on()).things;
  const { blockOf, shows } = sketch;
  const newGroup = (doc) => Math.max(0, ...doc.things.map((t) => t.group ?? 0)) + 1;
  /** A box as a rect of this plane says it lies: its other extent stays. */
  const laid = (t, [left, top, right, bottom]) => ({
    ...t,
    [ALONG]: [left, right],
    [UPRIGHT]: [top, bottom],
  });
  /**
   * What a cut lays of a box: a piece for each rect that is left of it, with all the box says -
   * but no piece that its slope leaves nothing of (`blocks.remains`), which would stand over the
   * slope as a box that nobody drew. A box that its slope left nothing of is cut as the box it is.
   */
  function pieces(t, rects) {
    const all = rects.map((rect) => laid(t, rect));
    return blocks.remains(t) ? all.filter(blocks.remains) : all;
  }

  /**
   * The thing on the layer drawn on that the pointer has at a place, and how: `at` is its place
   * among the things of the layer, `zone` the edge or corner of a box, or 'move' - an object is
   * moved, but from above at an end of its length where `sketch.endOf` (stretch.js) says so.
   * `reach` is how near an edge counts, in cells. Null where nothing is.
   */
  function grab(place, reach) {
    const things = onLayer();
    const rects = things.map((entry) => entry.rect);
    const found = blocks.grab(rects, place, reach);
    if (!found) return null;
    const { thing } = things[found.index];
    const zone = sketch.isBox(thing) ? found.zone : (sketch.endOf?.(thing, found.zone) ?? 'move');
    return { at: found.index, zone };
  }

  /**
   * What a stroke has `grabbed`: the thing, and the rect it has in this view. Held by its middle,
   * a block of several boxes is moved whole: `whole` has them all, and the rect holds them all.
   */
  function held({ grabbed }) {
    const { thing, rect } = onLayer()[grabbed.at];
    const all = grabbed.zone === 'move' && sketch.isBox(thing) ? blockOf(thing) : [];
    if (all.length < 2) return { thing, whole: [thing], rect };
    const rects = all.map((t) => sketch.rect(t, PLANE));
    const edge = (pick, side) => pick(...rects.map((each) => each[side]));
    const around = [edge(Math.min, 0), edge(Math.min, 1), edge(Math.max, 2), edge(Math.max, 3)];
    return { thing, whole: all, rect: around };
  }

  /** What a stroke has grabbed, as it has moved or resized it so far: its rect. A box goes by steps of the grid shown, an edge of it to a line; an object by the cell. */
  function moved(stroke) {
    const { thing, rect } = held(stroke);
    const [zone, k] = [stroke.grabbed.zone, sketch.isBox(thing) ? grid().shown / CELL_M : 1];
    const edge = (i) => rect[zone.includes('es'[i]) ? i + 2 : i];
    const by = (i, d = stroke.to[i] - stroke.from[i]) =>
      k > 1 && zone !== 'move' ? grid().round(edge(i) + d, i) - edge(i) : Math.round(d / k) * k;
    return blocks.reshape([...rect, thing.colour], zone, by(0), by(1));
  }

  /**
   * What an object stands on in a slice, at a place along it: of the ground and of the floors
   * and roofs of the boxes there, the one nearest to a row. A row of the paper, or 'ground'. A
   * block that counts as a cut offers neither: what stands in it stands on the ground (ST-028).
   */
  function standOn(place, row) {
    const cut = sketch.on();
    const ground = paper.groundRow(...paper.onSlice(place, cut));
    const along = (t) => t[ALONG][0] <= place && place <= t[ALONG][1];
    const under = (t) => sketch.isBox(t) && sketch.lies(t, PLANE, cut) && along(t) && shows(t);
    const offers = (t) => under(t) && blocks.countsAs(blockOf(t)).as !== 'cut';
    const floors = sketch.doc.things.filter(offers).flatMap((t) => t.z);
    const nearest = [ground, ...floors].reduce((a, b) =>
      Math.abs(b - row) < Math.abs(a - row) ? b : a,
    );
    return nearest === ground ? 'ground' : nearest;
  }

  /** Lays a thing where a rect of this plane says: a box by its edges, its slope with it, an object by its middle - of storage, its length first (stretch.js). */
  function put(t, drawn) {
    if (sketch.isBox(t)) return Object.assign(t, blocks.carried(t, laid(t, drawn)));
    const rect = sketch.stretch?.(t, drawn) ?? drawn;
    t[ALONG] = (rect[0] + rect[2]) / 2;
    if (PLANE === 'top') t.y = (rect[1] + rect[3]) / 2;
    else t.floor = standOn(t[ALONG], rect[3] + (shapes.KINDS[t.kind].lift ?? 0) / CELL_M);
    return t;
  }

  /**
   * The new box of a stroke, wherever it is drawn: the paper has no edge (ST-042). Drawn on a
   * slice, it is as deep as a box is to start with, about the slice. Drawn from above, its floor
   * is the level drawn on, and it is `high` metres from there - a storey, where no height is
   * asked for.
   */
  function box([left, top, right, bottom], colour, layer, high = STOREY_M) {
    if (PLANE !== 'top') {
      const reach = DEPTH_M / CELL_M / 2;
      const deep = [layer - reach, layer + reach];
      return { [ALONG]: [left, right], [INTO]: deep, z: [top, bottom], colour };
    }
    const rows = Math.max(1, Math.round(high / CELL_M));
    return { x: [left, right], y: [top, bottom], z: [layer - rows, layer], colour };
  }

  /**
   * The eraser. Dragged, its box cuts itself out of every block it reaches into - what is left
   * of a block stays one block, with no piece over its slope (`pieces`) - and takes the objects
   * and notes that lie wholly in it. A click takes the one thing on top at the pointer: a line by
   * any segment, or a label, else a whole block or an object, else a flat box of an old sketch.
   */
  function erase(doc, { cells, reach }, [x, y], layer) {
    const [left, top, right, bottom] = cells;
    const inBox = (px, py) => px >= left && px <= right && py >= top && py <= bottom;
    const within = ([l, t, r, b]) => inBox(l, t) && inBox(r, b);
    // A line is asked of lines/model.js, here and not as this loads: on every level it is on any.
    const { lines } = globalThis;
    const at = (note) => note.view === PLANE && (PLANE !== 'top' || note.at === layer);
    const here = (note) => (note.line ? lines.here(note, PLANE, layer) : at(note));
    const things = onLayer();
    if (right - left > 1 || bottom - top > 1) {
      for (const { thing, rect } of things) {
        const cut = sketch.isBox(thing) ? overlap(rect, cells) : within(rect);
        if (cut) {
          const rest = sketch.isBox(thing) ? pieces(thing, blocks.minus(rect, cells)) : [];
          const group = thing.group ?? (rest.length > 1 ? newGroup(doc) : undefined);
          if (group !== undefined) for (const piece of rest) piece.group = group;
          doc.things.splice(doc.things.indexOf(thing), 1, ...rest);
        }
      }
      const inside = (note) =>
        note.label
          ? inBox(...note.label)
          : note.line
            ? lines.within(cells, note.line)
            : within(note.flat);
      doc.notes = doc.notes.filter((note) => !(here(note) && inside(note)));
      return;
    }
    const holds = ([l, t, r, b]) => x >= l && x < r && y >= t && y < b;
    const near = ([lx, ly]) => Math.abs(lx - x) < LABEL_REACH && Math.abs(ly - y) < LABEL_REACH;
    const written = (note) =>
      here(note) && (note.line ? lines.crosses(reach, note.line) : note.label && near(note.label));
    const note = doc.notes.findLastIndex(written);
    const found = things.findLast((entry) => holds(entry.rect));
    const flat = doc.notes.findLastIndex((entry) => here(entry) && entry.flat && holds(entry.flat));
    if (note >= 0) doc.notes.splice(note, 1);
    else if (found) {
      const gone = blockOf(found.thing);
      doc.things = doc.things.filter((t) => !gone.includes(t));
    } else if (flat >= 0) doc.notes.splice(flat, 1);
  }

  /**
   * Makes one block of the blocks a stroke's box reaches into, in the colour of the first. Where
   * two of them lie in each other, the later one gives way, cut as the eraser cuts (`pieces`),
   * so that the block is nowhere double.
   */
  function merge(doc, cells) {
    const reached = onLayer().filter(
      ({ thing, rect }) => sketch.isBox(thing) && overlap(rect, cells),
    );
    const parts = [...new Set(reached.flatMap((entry) => blockOf(entry.thing)))];
    if (new Set(parts.map((t) => t.group ?? t)).size < 2) return;
    const group = newGroup(doc);
    const whole = [];
    for (const t of parts) {
      let rects = [sketch.rect(t, PLANE)];
      for (const other of whole.filter((o) => o[INTO][0] < t[INTO][1] && o[INTO][1] > t[INTO][0])) {
        rects = rects.flatMap((rect) => blocks.minus(rect, sketch.rect(other, PLANE)));
      }
      whole.push(...pieces(t, rects).map((p) => ({ ...p, colour: parts[0].colour, group })));
    }
    doc.things = [...doc.things.filter((t) => !parts.includes(t)), ...whole];
  }

  /** What the Move tool does with what it has grabbed: moves or resizes it, or a copy of it. */
  function move(doc, stroke) {
    const { thing, whole, rect } = held(stroke);
    const next = moved(stroke);
    if (rect.every((value, index) => value === next[index])) return;
    const copy = stroke.grabbed.copy ? JSON.parse(JSON.stringify(whole)) : null;
    if (copy && thing.group !== undefined) {
      const group = newGroup(doc);
      for (const part of copy) part.group = group;
    }
    const these = copy ?? whole;
    if (these.length === 1) put(these[0], next);
    else {
      // Each box of the block goes as far as the rect that holds them all went.
      const by = [next[0] - rect[0], next[1] - rect[1]];
      for (const part of these)
        put(
          part,
          sketch.rect(part, PLANE).map((value, i) => value + by[i % 2]),
        );
    }
    if (copy) doc.things.push(...copy);
  }

  /** An object as it will stand, its middle at a place of the paper and `turned` by so many
   * quarters: from above on the level drawn on; on a slice, in the slice and on what is nearest.
   * A start (object-groups.js) is its kind at its sizes, and any other key is the kind. */
  function placed(key, to, turned) {
    const { kind = key, sizes } = shapes.STARTS?.[key] ?? {};
    const [along, up] = to.map(half);
    const layer = sketch.on();
    const place =
      PLANE === 'top'
        ? { x: along, y: up, floor: layer }
        : { [ALONG]: along, [INTO]: layer, floor: standOn(along, up) };
    return { kind, ...place, ...(turned ? { turn: turned } : {}), ...sizes };
  }

  /** Turns an object by a quarter, clockwise from above. */
  function turn(thing) {
    sketch.change(() => {
      thing.turn = (shapes.turnOf(thing) + 1) % 4;
      delete thing.turned;
    });
  }

  /** Gives the block a box belongs to a colour: every box of it. */
  function paint(thing, colour) {
    sketch.change(() => {
      for (const part of blockOf(thing)) part.colour = colour;
    });
  }

  /**
   * What a finished stroke does. A line needs its `points`, two or more, and no `from` or `to`;
   * it is written on the layer `at` where it names one - the one it was drawn on, which may be
   * left by then - else on the layer drawn on. A label needs its `text`, an object its `kind` and
   * by how many quarters it is `turned`; a block drawn from above takes how `high` it is, in
   * metres; 'move' needs what it has `grabbed`, and whether a `copy` is moved, or a top pulled
   * (slopes.js).
   */
  function apply(stroke) {
    const { tool, to, colour, text, kind, turned, high, grabbed } = stroke;
    const { cells } = tool === 'line' ? {} : shape(stroke);
    const layer = sketch.on();
    if (tool === 'block' && layer === 'ground') {
      sketch.trouble =
        'A block stands on a level: pick one, make one with "New level", or draw the block in the side view.';
      sketch.onChange();
      return;
    }
    sketch.change((doc) => {
      if (tool === 'block') doc.things.push(box(cells, colour, layer, high));
      if (tool === 'erase') erase(doc, shape(stroke), to, layer);
      if (tool === 'merge') merge(doc, cells);
      if (tool === 'move' && grabbed && !sketch.pull?.(stroke)) move(doc, stroke);
      if (tool === 'line' && stroke.points?.length >= 2) {
        const line = globalThis.lines.made(stroke.points, colour); // lines/model.js
        doc.notes.push({ view: PLANE, at: stroke.at ?? layer, line });
      }
      if (tool === 'text' && text) {
        doc.notes.push({ view: PLANE, at: layer, label: [...to.map(half), text] });
      }
      if (tool === 'object') doc.things.push(placed(kind, to, turned));
    });
  }

  const acts = { shape, grab, moved, standOn, placed, turn, paint, apply };
  Object.assign(sketch, { LABEL_REACH, ...acts });
})();
