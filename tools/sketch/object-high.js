// The height of the object that is selected, typed beside the paper (story ST-035): a row with a
// field for figures and the words "m high". The script makes the row itself and puts it into what
// is selected, before the line that says that nothing is - so under the colour of a block
// (swatch.js), which shows for a block alone, as this row shows for an object alone.
//
// The row shows for an object whose kind takes a height - a `high` in its row of `shapes.TAKES`,
// the one table of what a kind takes - and for nothing else: a block, an object of any other
// kind, nothing selected. Its field holds the object's height, `shapes.sizeOf`, with the least
// and the most of its kind's range, in steps of 5 cm. A staircase's length follows its height
// there, and so on every plane: it is never set here.
//
// A height is set on the field's `change` - Enter, or the focus leaving it. A value that is no
// number, or not above nought, changes nothing. Any other is held to the range and rounded to a
// whole 5 cm; where that is the height the object has, nothing changes and no step is made; else
// one `sketch.change` - one step, which Undo takes back - writes `high`, or removes it where the
// height is the kind's own. The field then shows the height and gives the focus back, as the
// toolbar's height does (page.js): while it has the focus every key is its own (`views.typing`),
// and after, a key is the page's again. The page hands the script what is selected, at every
// refresh (page.js): `objectHigh.show`.
(() => {
  const { document, shapes, sketch } = globalThis;
  const TITLE = 'How high the selected object is: a height typed here is set with Enter';
  const STEPS = 20; // A height is a whole 5 cm: so many to the metre.

  const field = Object.assign(document.createElement('input'), {
    type: 'number',
    id: 'object-high',
    step: '0.05',
    size: 4,
  });
  const row = Object.assign(document.createElement('label'), {
    id: 'object-high-row',
    className: 'group',
    title: TITLE,
    hidden: true,
  });
  row.append(field, ' m high');

  // The object that the row shows - or null: nothing is selected, a block, or a kind that takes
  // no height.
  let shown = null;

  /** The range of heights that an object's kind takes, `[least, most]` - or null: it takes none. */
  function rangeOf(thing) {
    if (!thing || sketch.isBox(thing) || !Object.hasOwn(shapes.TAKES, thing.kind)) return null;
    return shapes.TAKES[thing.kind].high ?? null;
  }

  /**
   * Shows the row for what is selected: `thing`, a thing of the sketch, or nothing. Of an object
   * whose kind takes a height the row shows, its field holding the object's height and its
   * kind's range; of anything else the row is hidden.
   */
  function show(thing) {
    const range = rangeOf(thing);
    shown = range ? thing : null;
    row.hidden = !shown;
    if (!shown) return;
    [field.min, field.max] = range.map(String);
    field.value = String(shapes.sizeOf(shown)[2]);
  }

  /**
   * A height typed: held to the range and to 5 cm, and written in one step - or nothing, where it
   * is no height or the one the object has. The row then shows the object anew.
   */
  function set(typed) {
    const range = rangeOf(shown);
    if (range && typed > 0) {
      const high = Math.round(Math.min(Math.max(typed, range[0]), range[1]) * STEPS) / STEPS;
      const own = shapes.KINDS[shown.kind].size[2];
      const thing = shown;
      if (high !== shapes.sizeOf(thing)[2]) {
        sketch.change(() => {
          if (high === own) delete thing.high;
          else thing.high = high;
        });
      }
    }
    show(shown);
  }

  field.addEventListener('change', () => {
    set(field.value === '' ? Number.NaN : Number(field.value));
    field.blur(); // A height set: the focus goes back, and a key is the page's again.
  });
  document.getElementById('none-picked').before(row);
  globalThis.objectHigh = { show };
})();
