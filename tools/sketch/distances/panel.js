// The boundary distances on the plan (story ST-036): a panel at the top of the right side, opened
// and shut by its button in the toolbar, with a field for each distance and the switch that
// shows their lines - and the lines themselves, drawn from above inside the plot's outline, each
// in its colour and labelled with its figure.
//
// A field writes the sketch's distance as it is left or at Enter, by the pad's own way of
// changing the sketch: one step for Undo, kept at once. The figures are the sketch's (model.js);
// the switch is the view's, kept for the tab and never written into the sketch. The colours are
// no design data: no sketch holds them. A plain script, loaded by index.html alone, after
// model.js, lines.js and views.js and before page.js, whose `refresh` calls `show`.
(() => {
  const { document, distances, distanceLines, sketch, views, paper, SITE } = globalThis;
  // Each distance's colour, by its name: blue, magenta, green.
  const COLOURS = { smallM: '#2563eb', largeM: '#c026d3', annexM: '#0f766e' };
  // A line in CSS pixels, and the size of its label.
  const LINE_PX = 1.5;
  const LABEL_PX = 11;
  const $ = (id) => document.getElementById(id);
  const make = (tag, has) => Object.assign(document.createElement(tag), has);

  // Whether the lines show: a tab that kept nothing starts with them shown.
  let lit = views.seen.distancesShown !== false;
  // The lines at each figure, worked out once: the outline does not change under a page.
  const worked = new Map();
  function linesAt(value) {
    if (!worked.has(value)) worked.set(value, distanceLines.at(SITE.outline, value));
    return worked.get(value);
  }

  /** A row of the panel for a distance: its words, its field with "m" and its colour, its range, and what is said beside it. */
  function rowOf({ name, words }) {
    const id = `distance-${name}`;
    const field = make('input', { id, type: 'text', inputMode: 'decimal', autocomplete: 'off' });
    const unit = make('span', { textContent: 'm' });
    const colour = make('span', { className: 'colour' });
    colour.style.background = COLOURS[name];
    const range = `from ${distances.FROM_M} to ${distances.TO_M} m`;
    const within = make('small', { id: `${id}-range`, textContent: range });
    const said = make('small', { id: `${id}-said`, className: 'refused' });
    said.setAttribute('role', 'alert');
    field.setAttribute('aria-describedby', `${within.id} ${said.id}`);
    const line = make('span', { className: 'group' });
    line.append(field, unit, colour);
    const item = make('li');
    item.dataset.distance = name;
    const label = make('label', { htmlFor: id, textContent: words[0].toUpperCase() });
    label.textContent += words.slice(1);
    item.append(label, line, within, said);
    $('distance-fields').append(item);
    // `shown`, the text the field said of the sketch last; `refused`, why the owner's text was not taken.
    const row = { name, field, said, shown: '', refused: '' };
    field.addEventListener('input', () => {
      row.refused = '';
    });
    field.addEventListener('change', () => take(row));
    return row;
  }

  /** A text typed as a distance, as its field is left or at Enter: written, or refused in words beside the field, where the text stays. */
  function take(row) {
    const { value, refused = '' } = distances.typed(row.field.value);
    row.refused = refused;
    if (refused === '') {
      row.shown = row.field.value;
      sketch.change((doc) => distances.set(doc, row.name, value));
    }
    show();
  }

  const rows = distances.LISTED.map(rowOf);

  /**
   * The fields and the words beside them follow the sketch. A field says the sketch's figure, or
   * nothing - but a text of the owner's that was not taken it leaves, until it is typed into
   * again or the sketch holds another figure there. Beside it: why a text was refused, or that
   * the sketch's figure gives no line.
   */
  function show() {
    const held = distances.of(sketch.doc);
    for (const row of rows) {
      const value = held[row.name];
      const text = value === undefined ? '' : String(value);
      if (row.field.value === row.shown || text !== row.shown) {
        row.field.value = text;
        row.refused = '';
      }
      row.shown = text;
      const none =
        value !== undefined && linesAt(value).length === 0
          ? `No place of the plot is ${distances.label(value)} from its outline: there is no line.`
          : '';
      row.said.textContent = row.refused || none;
    }
    $('distances-shown').checked = lit;
  }

  /**
   * What the paper draws now: nothing where the view is not from above or the switch is off;
   * else, in the order of `LISTED`, each distance that the sketch holds and that gives a line -
   * `{ name, label, colour, pieces }`, the pieces in the plot's metres.
   */
  function drawn() {
    if (paper.PLANE !== 'top' || !lit) return [];
    return Object.entries(distances.of(sketch.doc)).flatMap(([name, value]) => {
      const pieces = linesAt(value);
      const label = distances.label(value);
      return pieces.length === 0 ? [] : [{ name, label, colour: COLOURS[name], pieces }];
    });
  }

  /** The middle of a piece's longest side, in the plot's metres. */
  function middle(piece) {
    let [best, length] = [0, -1];
    for (let at = 1; at < piece.length; at += 1) {
      const side = Math.hypot(piece[at][0] - piece[at - 1][0], piece[at][1] - piece[at - 1][1]);
      if (side > length) [best, length] = [at, side];
    }
    const [[x1, y1], [x2, y2]] = [piece[best - 1], piece[best]];
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }

  /** Draws the lines with the paper's pen: each piece, solid, in its colour, and its label once, at the middle of its longest side. */
  function draw(pen) {
    for (const { label, colour, pieces } of drawn()) {
      for (const piece of pieces) {
        pen.path(piece.map(paper.cell), colour, LINE_PX);
        const [column, row] = paper.cell(middle(piece));
        pen.write(label, paper.shown(column), row, colour, LABEL_PX);
      }
    }
  }

  // The button opens the panel and shuts it again.
  const [button, place] = [$('distances-open'), $('distances')];
  button.addEventListener('click', () => {
    place.hidden = !place.hidden;
    button.setAttribute('aria-expanded', String(!place.hidden));
  });
  // The switch is the view's: the page draws again, and the sketch is not touched.
  $('distances-shown').checked = lit;
  $('distances-shown').addEventListener('change', () => {
    lit = $('distances-shown').checked;
    sketch.onChange();
  });
  views.keep(() => ({ distancesShown: lit }));

  globalThis.distancePanel = { show, drawn, draw };
})();
