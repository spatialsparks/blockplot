// What the page says in words: in the footer, where the pointer is and how large the stroke in
// progress or the thing under the pointer is; and of the thing that is selected, how large it is
// - of a block, first what it counts as, and last how its top slopes and how a top is sloped.
// Of a block of ground, no floor, no height and no volume: where its top lies above sea level,
// level or sloping, and no more. Of a cut, where its floor lies, and nothing of its top. And of
// a block its category, in a sentence of its own: which one, and by what - or that it has none.
// Of a straight staircase, how many steps it has and how large they are (story ST-037). And of
// several things selected, how many (T-037.6).
(() => {
  const { SITE, paper, sketch, shapes, blocks } = globalThis;
  const { PLANE, CELL_M, SPANS, exact } = paper;
  // The side the top view measures from, and the side view looks from - and the one across from it.
  const NEAR_SIDE = paper.wind(SITE.bearingDeg + 90);
  const FAR_SIDE = paper.wind(SITE.bearingDeg + 270);
  // What a block counts as, in words (blocks.countsAs): a phrase for each word it can answer.
  const COUNTED = {
    room: 'a room',
    open: 'open air',
    glass: 'glass',
    ground: 'ground',
    cut: 'a cut',
  };
  // And by what, where it is not read off the block's name: a box says so, or its category does.
  const COUNTED_BY = { is: 'set by hand', category: 'by its category' };
  // Which way a top falls, by the step on the top view's paper that leads down it (blocks.topOn):
  // its columns count down the plot, and its rows towards the side that it measures from.
  const WAYS = {
    '1,0': 'down the plot',
    '-1,0': 'up the plot',
    '0,1': `towards the ${NEAR_SIDE} side`,
    '0,-1': `towards the ${FAR_SIDE} side`,
  };
  // How a top is sloped (slopes.js): said of every block that is selected in a standing view.
  const TO_SLOPE =
    ' With Shift held down, drag a top corner of a box down to slope its top, or back up to level it.';
  // A length on the grid is exact, to the centimetre; one read off the pointer or the ground is not.
  const about = (value) => value.toFixed(1);
  const down = (x) => `${about(x)} m down the plot`;
  const across = (y) => `${about(y)} m from the ${NEAR_SIDE} boundary`;

  // A step's rise or going in words: centimetres to a tenth, and no ".0".
  const cm = (metres) => `${Number((metres * 100).toFixed(1))} cm`;
  /**
   * The steps of a straight staircase in words, as `shapes.stepsOf` (stairs.js) counts them -
   * "16 steps, each 17.5 cm by 28.1 cm", its rise by its going - and `null` of any other thing,
   * or where the page loads no stairs.js.
   */
  function stepsSaid(thing) {
    const steps = shapes.stepsOf?.(thing);
    return steps ? `${steps.count} steps, each ${cm(steps.rise)} by ${cm(steps.going)}` : null;
  }

  function sized([left, top, right, bottom]) {
    const [wide, high] = [(right - left) * CELL_M, (bottom - top) * CELL_M];
    return `${exact(wide)} m by ${exact(high)} m, ${exact(wide * high)} m²`;
  }

  /**
   * Where the pointer is on the paper. `stroke` is the stroke in progress as the paper shows it,
   * a line - its points, of which the last segment is measured, as the view shows it
   * (lines/model.js) - or a box; `held` is what Select would have at the pointer, if anything.
   * Beyond the plot's paper - from above, or along a slice - it ends saying that the ground
   * there is not measured (ST-042, Rule 4).
   */
  function measure(at, stroke, held) {
    const ground = PLANE === 'top' ? at : paper.onSlice(at[0], sketch.on());
    const beyond = paper.measured(...ground) ? '' : ' — no measured ground here';
    return `${said(at, stroke, held)}${beyond}`;
  }
  /** What `measure` says of the pointer's place, but whether the ground there is measured. */
  function said(at, stroke, held) {
    const [along, up] = paper.metres(at);
    let where = `${down(along)}, ${across(up)}`;
    if (PLANE !== 'top') {
      const above = up - paper.groundAt(...paper.onSlice(at[0], sketch.on()));
      const side = above < 0 ? 'below' : 'above';
      const place = PLANE === 'side' ? down(along) : across(along);
      where = `${place}, ${about(up)} m above sea level, ${about(Math.abs(above))} m ${side} the ground at the slice`;
    }
    if (stroke?.line?.length > 1) {
      const { m, deg } = globalThis.lines.measured(...stroke.line.slice(-2), CELL_M, paper.FLIP);
      const tenths = Math.round(deg * 10) % 3600; // 359.96° is said 0.0°, not 360.0°.
      return `${where} — ${exact(m)} m at ${(tenths / 10).toFixed(1)}°`;
    }
    if (stroke?.box) return `${where} — ${sized(stroke.box)}`;
    if (!held) return where;
    const { thing, rect } = sketch.layer(PLANE, sketch.on()).things[held.at];
    if (thing.kind) {
      const steps = stepsSaid(thing);
      const what = `${where} — a ${shapes.KINDS[thing.kind].name.toLowerCase()} of ${sized(rect)}`;
      return steps ? `${what}; ${steps}` : what;
    }
    const boxes = sketch.blockOf(thing).length;
    const whole = boxes > 1 ? `a block of ${boxes} boxes, this one` : 'a block of';
    return `${where} — ${whole} ${sized(rect)}`;
  }

  /**
   * What a block counts as, `as`, and how that is `said`, with by what: what was set by hand,
   * against its category or its name, or with it; else its category, where one was picked; else
   * its name, whether that gives a category or none - and a block without a name is a room.
   */
  function counted(thing) {
    const { as, by } = blocks.countsAs(sketch.blockOf(thing));
    const read = sketch.named(thing) ? 'by its name' : 'as it has no name';
    return { as, said: `${COUNTED[as]}, ${COUNTED_BY[by] ?? read}` };
  }

  /**
   * What is said of a block's category, as the one reading of the list gives it
   * (`categories.of`): its name as the list shows it, and whether it was picked from the list or
   * the block's name gave it - or that the block has none, and why.
   */
  function categorised(thing) {
    const { category, by } = globalThis.categories.of(sketch.blockOf(thing));
    const how = by === 'picked' ? 'picked from the list' : 'by its name';
    if (category) return `Category: ${category.name}, ${how}.`;
    const why = sketch.named(thing) ? 'its name holds no word of the list' : 'it has no name';
    return `No category: ${why}.`;
  }

  /**
   * What is said of a box whose top slopes, after all that is said of its block: which way the
   * top falls - down the plot, up it, or towards one of its two sides - and how high its two
   * ends lie over the box's floor, the higher one first. Of `ground`, how high they lie above
   * sea level: ground has no floor to measure from, and its height is read against the hill and
   * the house. Nothing, of a top that is level.
   */
  function sloped(box, ground) {
    const falls = blocks.topOn(box, 'top')?.falls;
    if (!falls) return '';
    // Rows count downward: the higher end lies in the smaller one.
    const { rows } = blocks.topOf(box);
    const ends = [Math.min(...rows), Math.max(...rows)];
    const lies = (row) => (ground ? SPANS.side[1] - row * CELL_M : (box.z[1] - row) * CELL_M);
    const [from, to] = ends.map((row) => exact(lies(row)));
    const whose = sketch.blockOf(box).length > 1 ? 'The top of this box' : 'Its top';
    const over = ground ? 'above sea level' : 'over its floor';
    return ` ${whose} falls ${WAYS[falls.join()]}, from ${from} m ${over} to ${to} m.`;
  }

  /**
   * What is said of the thing that is selected: its `words` beside the paper, a `label` on it,
   * and its `category`, a sentence of its own (`categorised`) - empty, of an object. Of a block
   * - all its boxes - the words say what it counts as, with the key that changes it, and the
   * floor it covers; of the box that is selected, how its top slopes, where it does; and in a
   * standing view, how a top is sloped. Of an object, what it is; of a
   * straight staircase, its steps too.
   *
   * Of a block of ground only the top counts (story ST-027): how far down its boxes reach says
   * nothing. So it has no floor, no height and no volume in words - what it covers, how far it
   * reaches, and one sentence on its top, in metres above sea level: where the box that is
   * selected slopes, which way its top falls and where its two ends lie; and else how high the
   * top of the block lies - the highest top of its boxes, as they were drawn.
   *
   * Of a cut only the floor counts (story ST-028): how high it reaches says nothing, and neither
   * does a top of it that slopes. So it has no height and no volume either, and no floor of a
   * room - what it covers, how far it reaches, and where its floor lies above sea level: the
   * lowest floor of its boxes.
   */
  function picked(thing) {
    if (thing.kind) {
      const { name } = shapes.KINDS[thing.kind];
      const [long, wide, high] = shapes.sizeOf(thing);
      const level = `the level at ${SPANS.side[1] - thing.floor * CELL_M} m`;
      const floor = thing.floor === 'ground' ? 'the ground' : level;
      const steps = stepsSaid(thing);
      const size = `${long} m by ${wide} m, ${high} m high${steps ? `, ${steps}` : ''}`;
      const words = `${name}: ${size}, on ${floor}. R turns it.`;
      return { label: name, words, category: '' };
    }
    const size = sketch.stats(thing);
    const [area, long, wide, high] = [size.area, size.long, size.wide, size.high].map(exact);
    const whole =
      sketch.named(thing) ?? (size.boxes > 1 ? `Block of ${size.boxes} boxes` : 'Block');
    const { as, said } = counted(thing);
    const ground = as === 'ground';
    const falls = sloped(thing, ground);
    const covers = `${area} m², ${long} m by ${wide} m.`;
    const floor = ` Its floor is ${exact(size.floor)} m above sea level.`;
    // Of ground, one sentence on its top: how it falls, or else how high it lies.
    const top = falls || ` Its top is ${exact(size.floor + size.high)} m above sea level.`;
    const room = `${area} m² of floor, ${long} m by ${wide} m, ${high} m high, ${exact(size.volume)} m³.${floor}${falls}`;
    const large = ground ? `${covers}${top}` : as === 'cut' ? `${covers}${floor}` : room;
    return {
      label: PLANE === 'top' ? `${area} m²` : `${PLANE === 'side' ? long : wide} × ${high} m`,
      words: `${whole}: ${said}. C changes it. ${large}${PLANE === 'top' ? '' : TO_SLOPE}`,
      category: categorised(thing),
    };
  }

  /** The words of several things selected (T-037.6): how many, and what Delete and the right button do to them. Of fewer, none. */
  const several = (things) =>
    things.length > 1
      ? `${things.length} things selected: Delete erases them, and the right button acts on all of them.`
      : '';

  globalThis.footer = { NEAR_SIDE, measure, picked, several };
})();
