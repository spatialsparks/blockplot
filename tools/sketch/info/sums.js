// What the sketch adds up to (story ST-032): the floor of its rooms and of what stands under
// glass, its open air - terraces, balconies, gardens - the volume of those rooms and that glass,
// and a rough cost: for the whole house, by section, by level and by category. In m², m³ and
// francs, and none of it rounded: rounding happens where a figure is shown, on the Info page
// (T-032.5). They are the sketch's own figures - the floor of a block as it is drawn, its walls
// included, and what it encloses from its floor to its top - and no area of the building law.
//
// A block's floor and its volume are the pad's one computation of them, `sketch.stats`, which
// the pad's sentence of a selected block asks as well (directive 32): nothing here works out
// either. What a block counts as is `blocks.countsAs`, its category `categories.of`, its section
// `sections.of`, the rates that the sketch holds `rates.of`, and what a rate multiplies
// `rates.PER`; and the size of a cell and the height of the paper's top are the paper's, `CELL_M`
// and `SPANS`. Nothing asks whether a section is hidden: hiding changes what is seen, never what
// is counted. Each block is counted by its own floor: where blocks lie over each other on one
// level, the floor that is counted twice there is said.
//
// A plain script that reads nothing as it loads - no paper, no sketch, no page: it asks
// `globalThis` for the pad's scripts when it is asked, so it is loaded in any place before then.
(() => {
  // What of a block counts, by what it counts as: of a room and of glass, the floor it covers
  // and the volume under its top; of open air, the area it covers, and no volume. Ground and a
  // cut are no part of the house: they are in no row, and counted apart.
  const ROOMS = ['room', 'glass'];
  const OPEN = 'open';
  const APART = ['ground', 'cut'];
  // The unit of `rates.PER` that says a rate multiplies a volume: else it multiplies an area.
  const PER_VOLUME = 'm³';
  // The words of a row that is no section, no category and no level - the whole house too.
  const [NO_SECTION, NO_CATEGORY, TOTAL] = ['No section', 'No category', 'Total'];

  // A row with nothing counted in it: no block, no floor, no open air, no volume and no cost.
  const NOTHING = { blocks: 0, floor: 0, open: 0, volume: 0, cost: null };
  /** A row: its name, what else names it - an `id`, a `level`, a `key` - and its figures. */
  const row = (name, more) => ({ name, ...more, ...NOTHING, without: [] });

  /**
   * Adds a block, or a row, to a row: how many blocks, the floor, the open air and the volume,
   * added up; the costs of what has one - and none where nothing has one; and what is without a
   * rate, of what `rates.PER` names, in its order: `room`, `glass`, `open`.
   */
  function add(to, part) {
    for (const figure of ['blocks', 'floor', 'open', 'volume']) to[figure] += part[figure];
    if (part.cost !== null) to.cost = (to.cost ?? 0) + part.cost;
    const left = new Set([...to.without, ...part.without]);
    to.without = Object.keys(globalThis.rates.PER).filter((as) => left.has(as));
    return to;
  }

  /** A table: its rows, and their total - the sum of the rows, added up in their order. */
  const table = (rows) => ({ rows, total: rows.reduce(add, row(TOTAL)) });

  /**
   * What a block of the house adds to a row, of its boxes: its figures, by `sketch.stats` alone,
   * and its cost - its quantity, a volume or an area as `rates.PER` says, times its rate: its
   * category's own, where the sketch holds one and the block counts as its category does; else
   * the rate of what it counts as; else it has none, and no cost. And where it stands in a
   * table: its section, its category, and its level - the row of a standing view that its
   * lowest floor lies in, which the pad's levels are keyed by.
   */
  function counted(boxes, as, held) {
    const { sketch, categories, sections, rates, paper } = globalThis;
    const size = sketch.stats(boxes[0]);
    const { category } = categories.of(boxes);
    const own = category?.as === as ? held.category[category.key] : undefined;
    const rate = own ?? held.as[as];
    const room = ROOMS.includes(as);
    const quantity = rates.PER[as] === PER_VOLUME ? size.volume : size.area;
    return {
      boxes,
      section: sections.of(boxes[0]),
      category,
      level: (paper.SPANS.side[1] - size.floor) / paper.CELL_M,
      blocks: 1,
      floor: room ? size.area : 0,
      open: as === OPEN ? size.area : 0,
      volume: room ? size.volume : 0,
      cost: rate === undefined ? null : quantity * rate,
      without: rate === undefined ? [as] : [],
    };
  }

  /**
   * By section: every section of the list, in its order and with its `id` - one that holds no
   * block of the house too - and after them "No section", where a block is in none.
   */
  function bySection(house) {
    const listed = globalThis.sections.list();
    const rows = new Map(listed.map(({ id, name }) => [id, row(name, { id })]));
    const none = row(NO_SECTION, { id: null });
    for (const block of house) add(rows.get(block.section?.id) ?? none, block);
    return table([...rows.values(), ...(none.blocks > 0 ? [none] : [])]);
  }

  /**
   * By level: every level that a block of the house stands on, from the top down - the rows of
   * a standing view count downward - each with its row, `level`, and named as the pad names it.
   */
  function byLevel(house) {
    const levels = [...new Set(house.map((block) => block.level))].sort((a, b) => a - b);
    const named = (level) => row(globalThis.sketch.nameOf('top', level), { level });
    const rows = new Map(levels.map((level) => [level, named(level)]));
    for (const block of house) add(rows.get(block.level), block);
    return table([...rows.values()]);
  }

  /**
   * By category: every category that a block of the house has, or that has a rate of its own,
   * in the order of the pad's list - with its `key`, what it counts as, `as`, and its own `rate`
   * or null - and after them "No category", where a block has none.
   */
  function byCategory(house, held) {
    const has = (key) => house.some(({ category }) => category?.key === key);
    const shown = globalThis.categories.LIST.filter(
      ({ key }) => has(key) || Object.hasOwn(held.category, key),
    );
    const rated = ({ key, name, as }) => row(name, { key, as, rate: held.category[key] ?? null });
    const rows = new Map(shown.map((category) => [category.key, rated(category)]));
    const none = row(NO_CATEGORY, { key: null, as: null, rate: null });
    for (const block of house) add(rows.get(block.category?.key) ?? none, block);
    return table([...rows.values(), ...(none.blocks > 0 ? [none] : [])]);
  }

  /**
   * Floor that is counted twice: on each level, what its blocks count together - floor and open
   * air - less what all their boxes cover together seen from above, where that is more than
   * nothing. Space that two blocks share on different levels is no floor counted twice.
   */
  function twice(house, levels) {
    const { sketch, blocks, paper } = globalThis;
    return levels.flatMap(({ level, name, floor, open }) => {
      const boxes = house.flatMap((block) => (block.level === level ? block.boxes : []));
      const covered = blocks.area(boxes.map((box) => sketch.rect(box, 'top'))) * paper.CELL_M ** 2;
      const m2 = floor + open - covered;
      return m2 > 0 ? [{ level, name, m2 }] : [];
    });
  }

  /**
   * What the sketch that the pad's scripts hold, `sketch.doc`, adds up to: how many blocks it
   * has, of whatever kind; how many of them count as ground and as a cut, `apart`, in no row;
   * the whole house, a row; the three tables; the floor counted twice, level by level; and
   * `through`, how many blocks of the house have boxes whose floors lie in more than one row - a
   * stairwell through two storeys - each one room all the same, on the level of its lowest floor.
   */
  function of() {
    const { sketch, blocks, rates } = globalThis;
    const held = rates.of(sketch.doc);
    const first = (thing) => sketch.isBox(thing) && sketch.blockOf(thing)[0] === thing;
    const firsts = sketch.doc.things.filter(first);
    const apart = Object.fromEntries(APART.map((as) => [as, 0]));
    const house = [];
    for (const one of firsts) {
      const boxes = sketch.blockOf(one);
      const { as } = blocks.countsAs(boxes);
      if (APART.includes(as)) apart[as] += 1;
      else house.push(counted(boxes, as, held));
    }
    const levels = byLevel(house);
    const floors = ({ boxes }) => new Set(boxes.map((box) => box.z[1])).size;
    return {
      blocks: firsts.length,
      apart,
      house: house.reduce(add, row(TOTAL)),
      sections: bySection(house),
      levels,
      categories: byCategory(house, held),
      twice: twice(house, levels.rows),
      through: house.filter((block) => floors(block) > 1).length,
    };
  }

  globalThis.sums = { of };
})();
