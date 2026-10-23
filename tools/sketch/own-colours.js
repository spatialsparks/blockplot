// The colours of the owner's (story ST-039; version 12 of the sketch file). Beside the pad's
// eleven, which a box and a line name by their number (paper.js), the owner adds colours of
// their own with the browser's colour chooser, each under a name. What is drawn in one holds it
// by its value - `things[].colour`, and the last entry of `notes[].line`: a text `#rrggbb`, in
// small letters, as the chooser gives it (`paper.isOwn`). The names stand in a list of the
// sketch (directive 30), `colours`: each entry `{ name, value }`, in the order they were added,
// and no list where there is none. Removed from the list, a colour stays on what was drawn in it
// (Rule 3): a value that the list does not name is a plain colour, called by its value.
//
// Here: the one reading of the list - `of`, `called`, `using` - and its steps, the format's only
// writers: `add`, `remove`, each called in a `sketch.change`, so one step that Undo takes back.
// The list is read leniently, as `sections` and `distances` are, by this script and never by
// `sketch.adopt`: an entry that is no such name and such a value, or that is alike one listed
// before it, is not listed, stays in the sketch as it was written, and refuses no file. The
// model is sections/model.js.
//
// A plain script that reads nothing as it loads - no page, no sketch: it asks `globalThis.paper`
// and the sketch it is handed - or `globalThis.sketch` - when it is asked. index.html loads it
// after paper.js.
(() => {
  /** How many characters a colour's name has at the most, as `[...name]` counts them. */
  const MOST = 30;

  const isName = (name) => typeof name === 'string' && name.trim() !== '';
  const fits = (name) => [...name].length <= MOST;
  // Two names are one where they differ in capitals or in the blanks at their two ends alone.
  const same = (one, other) => one.trim().toLowerCase() === other.trim().toLowerCase();
  const sketchOf = (doc) => doc ?? globalThis.sketch.doc;

  /**
   * The colours of the list of a sketch, in their order: each `{ name, value }`. An entry is
   * listed where its `name` holds a character that is no blank and has 30 characters at the
   * most, its `value` is a colour of the owner's, and neither is alike a name or a value listed
   * before it. Anything else, and anything under `colours` that is no list, is not listed.
   */
  function of(doc) {
    const entries = sketchOf(doc).colours;
    const listed = [];
    for (const entry of Array.isArray(entries) ? entries : []) {
      const { name, value } = Object(entry);
      if (!isName(name) || !fits(name) || !globalThis.paper.isOwn(value)) continue;
      const alike = listed.some((one) => same(one.name, name) || one.value === value);
      if (!alike) listed.push({ name, value });
    }
    return listed;
  }

  /** The name the pad shows of a colour: of the eleven theirs, of a listed value its name, of any other value the value itself, of anything else ink. */
  function called(colour, doc) {
    const { paper } = globalThis;
    if (!paper.isOwn(colour)) return paper.named(colour)[0];
    return of(doc).find((one) => one.value === colour)?.name ?? colour;
  }

  /**
   * Adds a colour to the end of the list of `doc` - the list made where there is none - and
   * gives `{ name }`, the name as written, without the blanks at its two ends; or `{ refused }`,
   * why it is not added, in one sentence, with nothing written. Called in a `sketch.change`.
   */
  function add(doc, text, value) {
    if (!globalThis.paper.isOwn(value)) return { refused: 'A colour is written #rrggbb.' };
    const name = typeof text === 'string' ? text.trim() : '';
    if (name === '') return { refused: 'A colour needs a name.' };
    if (!fits(name)) return { refused: `A colour's name is ${MOST} characters at the most.` };
    const listed = of(doc);
    const named = listed.find((one) => same(one.name, name));
    if (named) return { refused: `There is a colour "${named.name}" already.` };
    const held = listed.find((one) => one.value === value);
    if (held) return { refused: `That colour is on the list already, as "${held.name}".` };
    if (Array.isArray(doc.colours)) doc.colours.push({ name, value });
    else doc.colours = [{ name, value }];
    return { name };
  }

  /** How much is drawn in a value: `{ blocks, lines }` - the boxes of one `group` one block. */
  function using(doc, value) {
    const { things, notes } = sketchOf(doc);
    const boxes = things.filter((thing) => thing.kind === undefined && thing.colour === value);
    const blocks = new Set(boxes.map((box, at) => box.group ?? `alone ${at}`)).size;
    const lines = notes.filter((note) => Array.isArray(note.line) && note.line.at(-1) === value);
    return { blocks, lines: lines.length };
  }

  /**
   * Takes a colour off the list of `doc`, every entry of that value, and the list away where no
   * entry is left. Nothing drawn changes: what is in that value keeps it. Called in a `sketch.change`.
   */
  function remove(doc, value) {
    if (!Array.isArray(doc.colours)) return;
    doc.colours = doc.colours.filter((entry) => Object(entry).value !== value);
    if (doc.colours.length === 0) delete doc.colours;
  }

  globalThis.ownColours = { MOST, of, called, add, using, remove };
})();
