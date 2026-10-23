// The sections of a sketch (story ST-032; version 7 of the sketch file). A section is a set of
// blocks under a name of the owner's - "Home 1", "Garage and cellar" - and a block is in one
// section or in none. The sketch holds them (directive 30): at its top `sections`, the list in
// the owner's order, each entry `{ id, name }` and `hidden: true` where it is hidden on the
// paper; and on a box `section`, the `id` of the section its block is in - on every box of the
// block, as a name stands. A box names its section by that number, as it names its `group`: a
// section that is renamed, moved or hidden changes no box.
//
// Here: the one reading of all of it - `list`, `of`, `hides` - and its steps, the format's only
// writers: `make`, `rename`, `move`, `hide`, `remove`, `put`. Whoever needs a section asks
// these, and reads no `section` and no `sections` itself. What says nothing is left out: a block
// in no section has no `section`, a section that shows no `hidden`, and a sketch with no section
// no `sections`.
//
// A plain script that reads nothing as it loads - no paper, no sketch, no page: it asks
// `globalThis.sketch` when it is asked, so it is loaded in any place before a section is read.
(() => {
  /** How many characters the name of a section has at the most, as `[...name]` counts them. */
  const NAME_MOST = 60;

  // An `id` is a whole number from 1 on, one that is counted on to the last unit.
  const isId = (id) => Number.isSafeInteger(id) && id >= 1;
  const isName = (name) => typeof name === 'string' && name.trim() !== '';
  const isOf = (id) => (section) => section.id === id;

  /**
   * The sections of a sketch, in the owner's order: each `{ id, name, hidden }`, `hidden` a yes
   * or a no - nothing but `true` hides. An entry of `sections` is a section where its `id` is a
   * whole number from 1 on that no entry before it has, and its `name` a text that holds a
   * character which is no blank. Anything else in the list says nothing, and so does anything
   * under `sections` that is no list: it stays in the sketch as it was written, and refuses none.
   */
  function list(doc = globalThis.sketch.doc) {
    const entries = Array.isArray(doc?.sections) ? doc.sections : [];
    const taken = new Set();
    return entries.flatMap((entry) => {
      const { id, name, hidden } = Object(entry);
      const first = isId(id) && !taken.has(id);
      taken.add(id);
      return first && isName(name) ? [{ id, name, hidden: hidden === true }] : [];
    });
  }

  /**
   * The box that an object belongs to: of the boxes that lie on its level (`sketch.lies`) and
   * hold its middle - their edges and all - the last in the sketch, which is the one that a
   * click takes there. None for an object on the ground, and for one that stands in no box.
   */
  function standsIn(object) {
    const { sketch } = globalThis;
    const within = ([from, to], at) => from <= at && at <= to;
    const holds = (box) =>
      sketch.isBox(box) &&
      sketch.lies(box, 'top', object.floor) &&
      within(box.x, object.x) &&
      within(box.y, object.y);
    return Number.isFinite(object.floor) ? sketch.doc.things.findLast(holds) : undefined;
  }

  /**
   * The section that a thing is in, among those listed, or null. Of a box: of the boxes of its
   * block, in their order, the first that says the `id` of a listed section counts, as with a
   * name - a box that names a section which the list does not have says nothing. An object
   * belongs to the block it stands in (`standsIn`), and needs no field of its own.
   */
  function among(listed, thing) {
    const { sketch } = globalThis;
    const box = sketch.isBox(thing) ? thing : standsIn(thing);
    const byId = new Map(listed.map((section) => [section.id, section]));
    const says = box && sketch.blockOf(box).find((one) => byId.has(one.section));
    return says ? byId.get(says.section) : null;
  }

  /** The section that a thing of the sketch is in, as `list` gives it - or null, where in none. */
  const of = (thing) => among(list(), thing);

  /**
   * Whether the section that a thing is in is hidden. A sketch with no hidden section answers
   * no before it looks at the thing.
   */
  function hides(thing) {
    const listed = list();
    return listed.some((section) => section.hidden) && among(listed, thing)?.hidden === true;
  }

  /**
   * A typed text as the name of a section: `{ name }`, the text without the blanks at its two
   * ends - or `{ refused }`, why it is none, in one of three sentences. `but` is the `id` of
   * the section that is being renamed: its own name is not taken. Two names are one where they
   * differ in capitals alone.
   */
  function named(text, but) {
    const name = typeof text === 'string' ? text.trim() : '';
    if (name === '') return { refused: 'A section needs a name.' };
    const count = [...name].length;
    if (count > NAME_MOST) {
      const most = `A section's name has ${NAME_MOST} characters at the most`;
      return { refused: `${most}: this one has ${count}.` };
    }
    const same = (section) => section.name.trim().toLowerCase() === name.toLowerCase();
    const taken = list().find((section) => section.id !== but && same(section));
    return taken ? { refused: `There is a section "${taken.name}" already.` } : { name };
  }

  /**
   * Writes the sections into a sketch: `sections` then holds what the pad read of it and nothing
   * else - an entry `id`, `name`, and `hidden` where it is hidden - and a list that holds no
   * section is left out of the sketch.
   */
  function write(doc, listed) {
    const entry = ({ id, name, hidden }) => (hidden ? { id, name, hidden: true } : { id, name });
    if (listed.length > 0) doc.sections = listed.map(entry);
    else delete doc.sections;
  }

  /**
   * A step: the list as it is to be, and what else is done to the sketch with it - through
   * `sketch.change`, so one step that Undo takes back, kept at once.
   */
  function rewrite(listed, also = () => {}) {
    globalThis.sketch.change((doc) => {
      also(doc);
      write(doc, listed);
    });
  }

  /**
   * A new section at the foot of the list, under a name that `named` takes: `{ id }`, or
   * `{ refused }`. Its `id` is one more than the largest that the list or any box says: a
   * number that no box names, also where a section of before is gone from the list.
   */
  function make(text) {
    const { sketch } = globalThis;
    const { name, refused } = named(text);
    if (refused) return { refused };
    const listed = list();
    const said = sketch.doc.things.filter(sketch.isBox).map((box) => box.section);
    const id = Math.max(0, ...listed.map((section) => section.id), ...said.filter(isId)) + 1;
    rewrite([...listed, { id, name }]);
    return { id };
  }

  /**
   * Another name for a section: `{ name }`, or `{ refused }` - and neither, where the list has
   * no section of that `id`. The name it has already is taken again, and makes no step.
   */
  function rename(id, text) {
    const listed = list();
    const section = listed.find(isOf(id));
    if (!section) return {};
    const { name, refused } = named(text, id);
    if (refused) return { refused };
    const renamed = listed.map((one) => (one === section ? { ...one, name } : one));
    if (name !== section.name) rewrite(renamed);
    return { name };
  }

  /** A section a place up the list, with -1, or a place down, with 1: at an end, nothing. */
  function move(id, by) {
    const listed = list();
    const from = listed.findIndex(isOf(id));
    const to = from + by;
    if (from < 0 || (by !== -1 && by !== 1) || to < 0 || to >= listed.length) return;
    [listed[from], listed[to]] = [listed[to], listed[from]];
    rewrite(listed);
  }

  /** Hides a section on the paper, with `true`, or shows it again, with anything else. */
  function hide(id, hidden) {
    const listed = list();
    const section = listed.find(isOf(id));
    if (!section || section.hidden === (hidden === true)) return;
    section.hidden = hidden === true;
    rewrite(listed);
  }

  /**
   * Takes a section out of the list. Its blocks are in no section then: `section` is gone from
   * every box of every block that is in it, and from every other box that says its `id` - and
   * no box is changed otherwise. Undo brings the section back with its blocks.
   */
  function remove(id) {
    const { sketch } = globalThis;
    const listed = list();
    if (!listed.some(isOf(id))) return;
    const inIt = (thing) => thing.section === id || among(listed, thing)?.id === id;
    rewrite(
      listed.filter((section) => section.id !== id),
      (doc) => {
        for (const box of doc.things.filter(sketch.isBox).filter(inIt)) delete box.section;
      },
    );
  }

  /**
   * Puts the block of each box among `things` into a section: its `id` on every box of the
   * block. With null, out of every section: the field gone from every box of each. An object
   * among them is passed over - it belongs to the block it stands in - and an `id` that the
   * list does not have changes nothing.
   */
  function put(things, id) {
    const { sketch } = globalThis;
    const listed = list();
    if (id !== null && !listed.some(isOf(id))) return;
    const boxes = [...new Set(things.filter(sketch.isBox).flatMap((box) => sketch.blockOf(box)))];
    const says = (box) => (id === null ? !('section' in box) : box.section === id);
    if (boxes.every(says)) return;
    rewrite(listed, () => {
      for (const box of boxes) {
        if (id === null) delete box.section;
        else box.section = id;
      }
    });
  }

  const reading = { NAME_MOST, list, of, hides, named };
  globalThis.sections = { ...reading, make, rename, move, hide, remove, put };
})();
