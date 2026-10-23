// An object dragged to its size (stories ST-034, ST-035): with Select, in the top view, an object
// of a kind that may be sized is dragged by whole cells, the far side staying where it was - as a
// block is resized. By an end, where its kind takes a length - a `long` in its row of
// `shapes.TAKES` - it is made longer or shorter; by a long side, where it takes a depth - a
// `deep` there - deeper or shallower; by a corner, where it takes both, both. It then says its
// `long` and its `deep` anew, in whole half metres within what its kind takes - or none, where
// it is its kind's own size again; but a staircase keeps the length it was dragged to, its
// kind's own too, for one that says none is as long as its flight. What it is not dragged by - an end or a side its kind takes
// nothing for, its middle, any slice, any kind that takes neither - moves it as ever, and a move
// leaves every size it says as it was written: a size is set from above alone. A corner holds
// both only on an object more than a cell each way; on one a cell deep it counts as the end it
// lies at, on one a cell long as the side, so that an end in reach always lengthens a thin
// object. `grab` of strokes.js asks `endOf` what the pointer has, and `put` hands an object that
// a stroke has moved or resized to `stretch`, before it lays its middle.
(() => {
  const { paper, shapes, sketch } = globalThis;
  const { PLANE, CELL_M } = paper;
  // The paper's two axes - along the plot, across it: their letters, and their edges in a rect.
  const AXES = [
    { letters: 'we', edges: [0, 2] },
    { letters: 'ns', edges: [1, 3] },
  ];

  /** What its kind takes, in `TAKES`, where it may be sized here - from above. Else null. */
  const takes = (thing) => (PLANE === 'top' && shapes.TAKES[thing.kind]) || null;
  /**
   * An object's two ways as it lies, its length first, then its depth: each with its field, its
   * place in a kind's size and in a size on the paper, and that axis's letters and edges.
   */
  const ways = (thing) =>
    ['long', 'deep'].map((field, own) => {
      const axis = own ^ (shapes.turnOf(thing) % 2);
      return { field, own, axis, ...AXES[axis] };
    });

  /**
   * Where the pointer has an object by `zone` - an edge or a corner, as `blocks.grab` names it -
   * the letters of the zone it is dragged by: of the end of its length where its kind takes a
   * `long`, of its long side where it takes a `deep`, and of a corner both where it takes both
   * and is more than a cell each way. Anything else is 'move' - whose letters are no compass's,
   * though it holds an 'e'.
   */
  function endOf(thing, zone) {
    const kind = takes(thing);
    if (!kind || zone === 'move') return 'move';
    const cells = shapes.sizeOf(thing).map((metres) => metres / CELL_M);
    const [[end, long], [side, deep]] = ways(thing).map(({ field, axis, letters }) => [
      kind[field] ? [...zone].find((letter) => letters.includes(letter)) : undefined,
      cells[axis],
    ]);
    if (end && side) return deep <= 1 ? end : long <= 1 ? side : zone;
    return end ?? side ?? 'move';
  }

  /**
   * Lays the size that a rect of the top view gives onto an object of a kind that may be sized:
   * each way along which the rect is longer or shorter than the object, held within what its
   * kind takes and to whole half metres - its field where it differs from the kind's own, and
   * none where it is the kind's own, but a staircase's length always. Held, the rect is shortened at the edge that moved: the
   * edge that is where the object's was stays. A way the rect is as long as the object is left
   * as written - so a move changes no size. The rect the object then has, for its middle; of
   * any other object, and in a slice, the rect as it was, and nothing done.
   */
  function stretch(thing, rect) {
    const kind = takes(thing);
    if (!kind) return rect;
    const was = sketch.rect(thing, 'top');
    const held = [...rect];
    for (const { field, own, edges } of ways(thing)) {
      const [low, high] = edges;
      const range = kind[field];
      if (!range || rect[high] - rect[low] === was[high] - was[low]) continue;
      const metres = Math.round((rect[high] - rect[low]) * CELL_M * 2) / 2;
      const size = Math.min(Math.max(metres, range[0]), range[1]);
      if (rect[high] === was[high]) held[low] = rect[high] - size / CELL_M;
      else held[high] = rect[low] + size / CELL_M;
      const kept = field === 'long' && shapes.FLIGHTS.includes(thing.kind);
      if (!kept && size === shapes.KINDS[thing.kind].size[own]) delete thing[field];
      else thing[field] = size;
    }
    return held;
  }

  Object.assign(sketch, { endOf, stretch });
})();
