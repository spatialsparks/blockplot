// The Line tool (ST-039, T-039.2): its events on the paper and the page's keys, and nothing to
// decide - lines/model.js decides. Each press sets a point, on the grid or with Alt to the
// centimetre; Enter or a double-click ends the line, kept where it has two points or more; Escape
// drops the point being placed, a second the line; a press dragged with no line in progress is a
// line of two points, kept at once. Another tool or layer ends the line as Enter does. And the
// line that Select took: which it is, its words, and Delete. `globalThis.lineTool`. Loaded by
// index.html after pointer.js and before right-menu.js and page.js, which hands it the tool and
// the layer at every refresh (`state`), and draws what it gives (`preview`, `picked`).
(() => {
  const { document, paper, sketch, lines, ownColours, palette, pointer, views } = globalThis;
  const { CELL_M } = paper;
  const canvas = document.getElementById('paper');
  // The tool and the layer drawn on, as the page said last; the line in progress, `{ points,
  // placing }`; where a press went down that began one, for a drag; and whether Alt is held.
  let [tool, layer, drawing, down, free] = [null, null, null, null, false];
  // The line Select took, a note of the sketch.
  let chosen = null;

  const on = () => tool === 'line';
  const redraw = () => lineTool.onChange();
  /** A place as a point: the nearest point of the grid shown (grid.js), or with Alt to the centimetre. */
  const point = (at, alt) =>
    alt ? lines.snapped(at, true, CELL_M) : at.map((v, axis) => globalThis.grid.round(v, axis));
  /** A point more, where the model gives one. */
  const press = (at, alt) =>
    (drawing = lines.pressed(drawing, point(at, alt), pointer.reach()) ?? drawing);

  /** The line in progress ended, as Enter ends it: kept, on the layer it was drawn on, where it has two points. */
  function end() {
    const points = lines.ended(drawing);
    drawing = null;
    if (points) sketch.apply({ tool: 'line', points, colour: palette.colour(), at: layer });
    else redraw();
  }

  /** The tool and the layer drawn on, from the page: another of either ends the line in progress. */
  function state(next, key) {
    if (drawing && (next !== 'line' || key !== layer)) end();
    [tool, layer] = [next, key];
  }

  /** The line in progress as the paper draws it: its points, and while placing the point at the pointer. */
  function preview(over) {
    if (!drawing) return null;
    const follows = drawing.placing && over ? [point(over, free)] : [];
    return { line: [...drawing.points, ...follows], colour: paper.hex(palette.colour()) };
  }

  /** The line selected, while it is in the sketch; else none. */
  const picked = () => (sketch.doc.notes.includes(chosen) ? chosen : null);
  /** What is said of the line selected - `Line of 4 corners, 23.45 m long, in red.` - or nothing. */
  function words() {
    const note = picked();
    if (!note) return '';
    return lines.words(note, CELL_M, ownColours.called(lines.colourOf(note.line)));
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (!on() || event.button !== 0) return;
    const at = pointer.at(event);
    down = drawing ? null : at;
    press(at, event.altKey);
    canvas.setPointerCapture(event.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (event) => void (free = event.altKey));
  // A press dragged farther than the grab's reach, with no line in progress: a line of two points.
  canvas.addEventListener('pointerup', (event) => {
    const [from, at] = [down, pointer.at(event)];
    down = null;
    if (!on() || !from || Math.hypot(at[0] - from[0], at[1] - from[1]) <= pointer.reach()) return;
    press(at, event.altKey);
    end();
  });
  canvas.addEventListener('pointercancel', () => void (down = null));
  canvas.addEventListener('dblclick', () => on() && drawing && end());

  // Heard before the page's keys: while a line is in progress, Enter and Escape are the tool's alone.
  document.addEventListener('keydown', (event) => {
    if (views.typing(event)) return;
    const { key } = event;
    if (on() && key === 'Alt') {
      event.preventDefault(); // A release of Alt would take the focus to the browser's menu.
      free = true;
    }
    if (drawing && (key === 'Enter' || key === 'Escape')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (key === 'Enter') return end();
      drawing = lines.escaped(drawing);
      return redraw();
    }
    if (key === 'Escape') chosen = null; // And the page's Escape selects nothing else.
    const alone = !(event.ctrlKey || event.metaKey || event.altKey || event.shiftKey);
    const note = picked();
    if (!note || !alone || (key !== 'Delete' && key !== 'Backspace')) return;
    event.preventDefault();
    chosen = null;
    sketch.change((doc) => doc.notes.splice(doc.notes.indexOf(note), 1));
  });
  document.addEventListener('keyup', (event) => {
    if (event.key !== 'Alt') return;
    free = false;
    if (on()) event.preventDefault();
  });

  /** Selects a line, a note of the sketch, or none: the page then selects no thing. */
  const pick = (note) => void (chosen = note);
  // How the page is drawn again: the page's, until it hands it over (page.js).
  const lineTool = { state, preview, picked, words, pick, onChange() {} };
  globalThis.lineTool = lineTool;
})();
