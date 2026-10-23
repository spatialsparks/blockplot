// What is written on the paper: the names of blocks, which go where their block goes, and the
// labels that lie where they were put - until Select moves them. And what a block is said to
// be, which stands on its boxes as its name does, and is told in words beside the paper: the
// category that was picked for it, and what it is set to count as.
(() => {
  const { paper, sketch, blocks } = globalThis;
  const { PLANE } = paper;
  const half = (value) => Math.round(value * 2) / 2;
  const onLayer = (note) => note.view === PLANE && (PLANE !== 'top' || note.at === sketch.on());
  // What a block can be set to count as, in the order the key C goes through them.
  const COUNTS = ['room', 'open', 'glass', 'ground', 'cut'];

  /** The name of the block a box belongs to, if it has one. */
  const named = (thing) => sketch.blockOf(thing).find((box) => box.name)?.name;

  /** Names the block a box belongs to: every box of it. No name takes the name away. */
  function name(thing, text) {
    sketch.change(() => {
      for (const box of sketch.blockOf(thing)) {
        if (text) box.name = text;
        else delete box.name;
      }
    });
  }

  /**
   * Says what the block a box belongs to counts as - 'room', 'open', 'glass', 'ground' or 'cut'
   * - on every box of it. No `as` takes that away: the block is read from its category or its
   * name again. An object has nothing to count as, and is left as it is.
   */
  function count(thing, as) {
    if (!sketch.isBox(thing)) return;
    sketch.change(() => {
      for (const box of sketch.blockOf(thing)) {
        if (as) box.is = as;
        else delete box.is;
      }
    });
  }

  /**
   * A step on in what a block counts as: read from its category or its name, then set - a
   * room, open air, glass, ground, a cut - and after a cut read from its category or its name
   * again. The round begins wherever no box of the block says `is`.
   */
  function countNext(thing) {
    const { as, by } = blocks.countsAs(sketch.blockOf(thing));
    count(thing, by === 'is' ? COUNTS[COUNTS.indexOf(as) + 1] : COUNTS[0]);
  }

  /**
   * Picks the category of the block a box belongs to: `key`, the word of a row of the list
   * (categories.js), on every box of it - and `is` off every box, for the category says what
   * the block counts as: what C had set is taken away. No key takes the category away, and
   * leaves `is` as it is: the block is read from its name again. One change, and one step to
   * undo. An object has no category, and a word that no row has is none: neither changes
   * anything.
   */
  function categorise(thing, key) {
    const known = globalThis.categories.LIST.some((row) => row.key === key);
    if (!sketch.isBox(thing) || (key && !known)) return;
    sketch.change(() => {
      for (const box of sketch.blockOf(thing)) {
        if (!key) delete box.category;
        else {
          box.category = key;
          delete box.is;
        }
      }
    });
  }

  /**
   * The word that stands on a block that has no name: the name of the category that was picked
   * for it, as the list shows it. None where the block has a name, where no category was picked
   * for it, and of an object.
   */
  function worded(thing) {
    const { category, by } = globalThis.categories.of(sketch.blockOf(thing));
    const stands = sketch.isBox(thing) && by === 'picked' && !named(thing);
    return stands ? category.name : undefined;
  }

  /** The box on top at a place, of the layer drawn on: what stands in it is looked through. */
  function boxAt([x, y]) {
    const holds = ([left, top, right, bottom]) => x >= left && x < right && y >= top && y < bottom;
    const { things } = sketch.layer(PLANE, sketch.on());
    return things.findLast((entry) => sketch.isBox(entry.thing) && holds(entry.rect))?.thing;
  }

  /** The label the pointer has at a place: its place among the notes, or -1 where none is near. */
  function labelAt([x, y]) {
    const near = ([lx, ly]) =>
      Math.abs(lx - x) < sketch.LABEL_REACH && Math.abs(ly - y) < sketch.LABEL_REACH;
    return sketch.doc.notes.findLastIndex(
      (note) => note.label && onLayer(note) && near(note.label),
    );
  }

  /** A label as it lies once it has gone as far as a stroke went, by half cells. */
  function labelMoved(index, from, to) {
    const [x, y, text] = sketch.doc.notes[index].label;
    return [x + half(to[0] - from[0]), y + half(to[1] - from[1]), text];
  }

  function moveLabel(index, from, to) {
    sketch.change((doc) => (doc.notes[index].label = labelMoved(index, from, to)));
  }

  const said = { named, name, count, countNext, categorise, worded };
  Object.assign(sketch, said, { boxAt, labelAt, labelMoved, moveLabel });
})();
