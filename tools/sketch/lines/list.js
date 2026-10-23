// The lines on every level, listed left of the paper (ST-039, T-039.4): from above, under the
// levels and outside their list, the words "On every level" and a button for each line of the top
// view that says `at: "every"` - hidden by its own switch or not - in the sketch's order. A click
// selects that line, as Select does, so that a hidden line is found again and shown with its own
// box in the panel beside the paper (lines/panel.js). `globalThis.everyList`. It reads, as it
// loads, `document`, `paper`, `sketch`, `lines` and `ownColours`, makes its section `#every-lines`
// and puts it after `#layers`; `layers.js` does not name it. Loaded by index.html after
// lines/tool.js and before page.js, whose `refresh` hands it the line selected.
(() => {
  const { document, paper, sketch, lines, ownColours } = globalThis;
  const make = (tag, set) => Object.assign(document.createElement(tag), set);

  const section = make('section', { id: 'every-lines', hidden: true });
  section.setAttribute('aria-label', 'Lines on every level');
  const title = make('h2', { textContent: 'On every level' });
  section.append(title);
  document.getElementById('layers').after(section);

  /** A line of the list in words: `Line of 4 corners, in Boundary`, and `, hidden` where its switch hides it. */
  function said(note) {
    const corners = lines.points(note.line).length;
    const hidden = note.hidden === true ? ', hidden' : '';
    return `Line of ${corners} corners, in ${ownColours.called(lines.colourOf(note.line))}${hidden}`;
  }

  /** A button for a line on every level: its place among the notes, its words, and marked where it is the line selected. */
  function button(note, chosen) {
    const one = make('button', { type: 'button', textContent: said(note) });
    one.title = 'Select this line: beside the paper it is shown or hidden on every level';
    one.dataset.line = String(sketch.doc.notes.indexOf(note));
    if (note === chosen) one.setAttribute('aria-current', 'true');
    one.addEventListener('click', () => {
      globalThis.lineTool.pick(note);
      sketch.onChange();
    });
    return one;
  }

  /**
   * The list follows the sketch, the line selected `chosen` marked in it. Hidden in a slice, and
   * where no line is on every level.
   */
  function show(chosen) {
    const every = sketch.doc.notes.filter((note) => note.view === 'top' && note.at === 'every');
    section.hidden = paper.PLANE !== 'top' || every.length === 0;
    // The button that had the focus has it again, once the list is written anew.
    const inUse = section.contains?.(document.activeElement) && document.activeElement.dataset.line;
    section.replaceChildren(title, ...every.map((note) => button(note, chosen)));
    if (inUse) section.querySelector(`[data-line="${inUse}"]`)?.focus();
  }

  globalThis.everyList = { show };
})();
