// The toolbar's colours (story ST-039): in its `#palette`, one round button in the colour to draw
// with, `#colour`, which is the Block tool in that colour, and beside it a small arrow,
// `#colours-open`, which opens the colours as a menu (views.js), `#colours`: the pad's eleven
// (paper.js), in two rows; the owner's colours, `#own-colours`, a list in the sketch's order
// (own-colours.js), each with a button that takes it off the list; and "Add a colour", a label
// round the browser's colour chooser, `#colour-chooser`.
//
// The colour to draw with is one of the eleven, by its number, or a value `#rrggbb` of the
// owner's (`paper.isOwn`), listed or not - the one picked last. The tab keeps it under the name
// it had before, `colour`: a tab that kept one of them keeps it, and anything else is red. A pick
// tells the page which tool it leaves on, by `palette.onPick`, which the page sets: a colour
// picked in the menu leaves Line on where Line is the tool - the next line is drawn in it - and
// is Block with any other; a click on `#colour` is Block, whatever the tool was. The palette
// knows the tool by `palette.show(tool)`, the last it was handed - which `refresh` of the page
// calls after every change, and which writes the button and the list anew from the sketch, so
// an Undo, an Open file and another window's change show. The page asks `palette.colour()` for
// a stroke. A pick changes nothing drawn: what is selected is the swatch's (swatch.js).
//
// The list is written in one step each way, by the rules of own-colours.js, which Undo takes
// back: a colour chosen and named is added and picked; a name refused is said in the alarm, as
// sections/list.js says a section's, and nothing is written. A colour taken off the list stays
// on what is drawn in it (Rule 3), with no name, and the pad asks first where anything is.
(() => {
  const { document, paper, sketch, views, ownColours, prompt, confirm } = globalThis;
  const { seen } = views;
  const $ = (id) => document.getElementById(id);
  const make = (tag, set, ...parts) => {
    const made = Object.assign(document.createElement(tag), set);
    made.append(...parts);
    return made;
  };
  const ASKED = `Name of the new colour: up to ${ownColours.MOST} characters`;

  /** Whether a colour that the tab kept is one to draw with: one of the eleven by its number, or a value of the owner's. */
  const drawable = (one) =>
    (Number.isInteger(one) && paper.COLOURS[one] !== undefined) || paper.isOwn(one);
  let colour = drawable(seen.colour) ? seen.colour : 1;
  // The tool the page handed last, and what the list was written from last: `show` writes it
  // anew where the sketch lists another, and leaves the rows - and a focus in them - be where not.
  let tool = null;
  let written = null;
  const palette = { colour: () => colour, show, onPick: () => {} };

  /** A pick in the menu: the colour to draw with, and Line left on where it is the tool - Block with any other. */
  function pick(value) {
    colour = value;
    palette.onPick(tool === 'line' ? 'line' : 'block');
  }

  // The button in the colour to draw with, and the arrow that opens the menu.
  const button = make('button', { type: 'button', id: 'colour' });
  button.addEventListener('click', () => palette.onPick('block'));
  const open = make('button', { type: 'button', id: 'colours-open', textContent: '▾' });
  open.setAttribute('aria-label', 'Colours');
  open.setAttribute('aria-controls', 'colours');
  // The eleven, round, each read out by its name and in its colour.
  const eleven = paper.COLOURS.map(([name, value], index) => {
    const one = make('button', { type: 'button', title: name });
    one.setAttribute('aria-label', name);
    one.style.background = value;
    one.addEventListener('click', () => pick(index));
    return one;
  });
  const own = make('ul', { id: 'own-colours' });
  const chooser = make('input', { type: 'color', id: 'colour-chooser' });
  const adds = make('label', { className: 'colour-add' }, chooser, 'Add a colour');
  const menu = make(
    'div',
    { id: 'colours', className: 'menu' },
    make('div', { className: 'eleven' }, ...eleven),
    own,
    adds,
  );
  $('palette').append(button, open, menu);
  views.menu(open, menu);

  /** A row of the owner's list: a button that picks the colour - a round swatch and its name - and one that takes it off. */
  function row({ name, value }) {
    const swatch = make('i');
    swatch.style.background = value;
    const picks = make('button', { type: 'button', title: value }, swatch, name);
    picks.dataset.colour = value;
    picks.addEventListener('click', () => pick(value));
    const off = make('button', { type: 'button', className: 'colour-off', textContent: '×' });
    off.setAttribute('aria-label', `Take ${name} off the list`);
    off.addEventListener('click', () => takeOff(name, value));
    return make('li', {}, picks, off);
  }

  /** How many of a thing, in words: "1 block", "2 lines" - and nothing of none. */
  const many = (count, thing) =>
    count === 0 ? [] : [`${count} ${thing}${count === 1 ? '' : 's'}`];

  /**
   * Takes a colour off the list, in one step. Where anything is drawn in it the pad asks first,
   * with how much is - and on no takes nothing off; where nothing is, it goes with no question.
   * What is drawn in it keeps its value (Rule 3); the colour to draw with stays what it was.
   */
  function takeOff(name, value) {
    const { blocks, lines } = ownColours.using(sketch.doc, value);
    const parts = [...many(blocks, 'block'), ...many(lines, 'line')];
    const are = blocks + lines === 1 ? 'is' : 'are';
    const asked = `${parts.join(' and ')} ${are} in "${name}". They keep its colour, with no name. Take "${name}" off the list?`;
    if (parts.length > 0 && !confirm(asked)) return;
    sketch.change((doc) => ownColours.remove(doc, value));
  }

  /**
   * A colour chosen in the browser's chooser: the pad asks its name, and adds it to the list in
   * one step and picks it; a name refused is said in the alarm, with nothing written; no name
   * given, nothing is. The menu may have shut meanwhile: what is chosen is added all the same.
   */
  chooser.addEventListener('change', () => {
    const value = chooser.value.toLowerCase();
    const text = prompt(ASKED);
    if (text === null) return;
    let added = {};
    sketch.change((doc) => {
      added = ownColours.add(doc, text, value);
    });
    if (added.refused) {
      sketch.trouble = added.refused;
      sketch.onChange();
    } else pick(value);
  });

  /**
   * Shows the colour to draw with, from the sketch as it is: `#colour` in it, read out by its
   * name (`ownColours.called`) - a value the list does not name by its value - and pressed where
   * the tool is Block; in the menu the colour to draw with marked (`aria-current`), and the
   * owner's list written anew where the sketch lists other colours than it shows.
   */
  function show(handed) {
    tool = handed;
    const name = ownColours.called(colour);
    button.style.background = paper.hex(colour);
    button.setAttribute('aria-label', name);
    button.title = `Draw a block in ${name} (B: in the colour picked last)`;
    button.setAttribute('aria-pressed', String(tool === 'block'));
    const listed = ownColours.of();
    if (JSON.stringify(listed) !== written) {
      written = JSON.stringify(listed);
      own.replaceChildren(...listed.map(row));
      own.hidden = listed.length === 0;
    }
    const marks = [...eleven.map((one, index) => [one, index]), ...[...own.children].map(owned)];
    for (const [one, value] of marks) {
      if (value === colour) one.setAttribute('aria-current', 'true');
      else one.removeAttribute('aria-current');
    }
  }
  /** A row of the list as `[the button that picks it, its value]`. */
  const owned = (item) => [item.children[0], item.children[0].dataset.colour];

  show(null);
  views.keep(() => ({ colour }));
  globalThis.palette = palette;
})();
