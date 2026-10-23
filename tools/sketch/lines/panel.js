// The panel of a selected line, beside the paper (ST-039, T-039.4): from above a box "On every
// level" and, while it is ticked, the line's own switch "Shown"; and in every view a row for each
// segment, `1 to 2`, `2 to 3`, ..., with its length in metres and its angle in degrees as the view
// shows the paper (`lines.measured`: 0° to the right, counter-clockwise). A field changed - Enter,
// or the focus gone - sets its segment by both fields of its row: its first point stays, its end
// goes there to the millimetre, and no other point moves; a refusal is said under the row and
// nothing is written. Every write is one `sketch.change` on the note `lineTool.picked()` gives,
// by a rule of lines/model.js: one step, which Undo takes back. `globalThis.linePanel`. It reads,
// as it loads, `document`, `paper`, `sketch` and `lines`, makes its section `#line-row` and puts
// it into `#selected` before `#none-picked`. Loaded by index.html after lines/tool.js and before
// page.js, whose `refresh` hands it the line selected (`show`).
(() => {
  const { document, paper, sketch, lines } = globalThis;
  const { CELL_M, FLIP, WIDE, ROWS } = paper;
  const TOP = paper.PLANE === 'top';
  const make = (tag, set, ...parts) => {
    const made = Object.assign(document.createElement(tag), set);
    made.append(...parts);
    return made;
  };
  /** A box to tick, with its words, in a label. */
  const box = (id, words, title) => {
    const input = make('input', { type: 'checkbox', id });
    return [input, make('label', { title }, input, ` ${words}`)];
  };

  const [every, everyLabel] = box(
    'line-every',
    'On every level',
    'Draw this line on every level and the ground; unticked, it lies on the level drawn on',
  );
  const [shown, shownLabel] = box(
    'line-shown',
    'Shown',
    'This line shown on every level, or hidden',
  );
  const levels = make('p', { className: 'group', id: 'line-levels', hidden: !TOP });
  levels.append(everyLabel, shownLabel);
  const segments = make('ol', { id: 'segments' });
  const section = make('section', { id: 'line-row', hidden: true }, levels, segments);
  section.setAttribute('aria-label', 'The line selected');
  document.getElementById('none-picked').before(section);

  // The line shown, a note of the sketch; its rows, each `{ length, angle, said }`; and a
  // refusal, `{ at, text }`, said under the row of segment `at` until another change.
  let [note, rows, refused] = [null, [], null];

  /** A field of a row: text, read out by what it holds, followed by its unit. */
  const field = (name, label) =>
    make('input', { type: 'text', inputMode: 'decimal', autocomplete: 'off', name, title: label });

  /** A row for segment `at`, from point `at + 1` to point `at + 2`. */
  function rowOf(at) {
    const words = `${at + 1} to ${at + 2}`;
    const length = field('length', `Length of ${words}, in metres`);
    const angle = field(
      'angle',
      `Angle of ${words}, in degrees: 0 to the right, counter-clockwise`,
    );
    for (const one of [length, angle]) {
      one.setAttribute('aria-label', one.title);
      one.addEventListener('change', () => take(at));
    }
    const said = make('small', { className: 'refused' });
    said.setAttribute('role', 'alert');
    const item = make('li', {}, make('span', { textContent: words }), length, ' m ', angle, ' °');
    item.dataset.segment = String(at);
    item.append(said);
    segments.append(item);
    return { length, angle, said };
  }

  /** A segment's two fields, taken: its end set by both, or a refusal said and nothing written. */
  function take(at) {
    const { length, angle } = rows[at];
    const [m, deg] = [lines.typedLength(length.value), lines.typedAngle(angle.value)];
    const flat = { cellM: CELL_M, flip: FLIP, wide: WIDE, rows: ROWS };
    const set =
      m.refused || deg.refused ? null : lines.setSegment(note.line, at, m.m, deg.deg, flat);
    const why = m.refused ?? deg.refused ?? set.refused;
    refused = why ? { at, text: why } : null;
    // What the fields say now is no text of the owner's any more: they show the line as it is.
    for (const one of [length, angle]) one.dataset.said = one.value;
    const was = note;
    if (!why) sketch.change(() => void (was.line = set.line));
    show(note);
  }

  /** A field's text, but where the owner is typing into it: there what they typed stays. */
  function write(one, text) {
    if (one !== document.activeElement || one.value === one.dataset.said) one.value = text;
    one.dataset.said = text;
  }

  /**
   * Shows the line selected, `chosen` - a note of the sketch - or, of none, nothing. The boxes
   * from above: "On every level" ticked where the line says so, and there "Shown" where its own
   * switch does not hide it. A row for each segment, its length by `paper.exact` and its angle to a
   * tenth, 359.96° said as 0.0°.
   */
  function show(chosen) {
    if (chosen !== note) refused = null;
    note = chosen ?? null;
    section.hidden = !note;
    if (!note) return;
    every.checked = note.at === 'every';
    shownLabel.hidden = !every.checked;
    shown.checked = note.hidden !== true;
    const points = lines.points(note.line);
    if (rows.length !== points.length - 1) {
      segments.replaceChildren();
      rows = points.slice(1).map((_, at) => rowOf(at));
    }
    rows.forEach((row, at) => {
      const { m, deg } = lines.measured(points[at], points[at + 1], CELL_M, FLIP);
      write(row.length, paper.exact(m));
      write(row.angle, ((Math.round(deg * 10) % 3600) / 10).toFixed(1));
      row.said.textContent = refused?.at === at ? refused.text : '';
    });
  }

  // Each box one step: on every level or off it onto the layer drawn on, its switch going with
  // it; and the switch, kept with the line (T-039.1).
  every.addEventListener('change', () => {
    const was = note;
    sketch.change(() => lines.everyLevel(was, every.checked, sketch.on()));
  });
  shown.addEventListener('change', () => {
    const was = note;
    sketch.change(() => lines.hide(was, !shown.checked));
  });

  globalThis.linePanel = { show };
})();
