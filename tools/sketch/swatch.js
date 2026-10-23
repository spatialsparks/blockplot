// The colour of the block that is selected, beside the paper (story ST-029): a swatch in that
// colour with the colour's name beside it and, at a click on it, the pad's colours, to paint the
// block with. The script makes its parts itself and puts them into what is selected, before the
// line that says that nothing is - so under the list of categories (category-list.js): a row
// that holds the swatch, a button; the name of its colour; and the colours, a menu of that
// button (views.js), a button for each colour of the pad's one list (paper.js), in its order -
// and after them one for each colour of the owner's, in the order of the sketch's list
// (own-colours.js, ST-039), written anew at every show.
//
// The swatch shows the colour of the box that is selected, as the paper draws it (`paper.hex`):
// a colour the pad has not is its first, ink. Beside it its name, `ownColours.called`: of a
// listed value its name, of a plain one the value. A pick paints the block that the box belongs
// to, every box of it, by the one writer of a colour, `sketch.paint` (strokes.js): one step,
// which Undo takes back. Nobody else is told of a pick: the colour that the Block tool draws in
// is the palette's (palette.js), and stays what it was. Nothing is added to the owner's list
// here, and nothing taken off it. Where no thing is selected and a line is (ST-039, T-039.4),
// the swatch is the line's, and a pick recolours it: `lines.recolour`, one step.
//
// The colours are a menu, and while it is open every key is its own (`views.typing`): Escape, a
// click elsewhere and the focus gone elsewhere, in the page or out of it, shut it with nothing
// painted, and what is selected stays so. The page hands the script what is selected, at every
// refresh (page.js): `swatch.show` - which shuts the menu, by the way `views.menu` handed back,
// where nothing is to show.
(() => {
  const { document, paper, sketch, views, ownColours } = globalThis;
  const TITLE =
    'The colour of the selected block: a click opens the colours, and a pick paints the block';

  const make = (tag, set, ...parts) => {
    const made = Object.assign(document.createElement(tag), set);
    made.append(...parts);
    return made;
  };
  // The swatch, a button: it says what it opens, as the button of a menu does, and views.js has
  // it say whether that is open. Its colour and its name are written when a block is shown.
  const button = make('button', { type: 'button', id: 'swatch', title: TITLE });
  button.setAttribute('aria-controls', 'swatch-palette');
  const name = make('span', { id: 'swatch-name' });
  // The colours: each a button in its colour that says its place in the list, under its name -
  // which is what it says to a pointer, and what it is read out by.
  // A colour of the owner's is one too, which says its value in the place of a place.
  const entry = (title, value, colour) => {
    const one = make('button', { type: 'button', title });
    one.dataset.colour = colour;
    one.setAttribute('aria-label', title);
    one.style.background = value;
    one.addEventListener('click', () => pick(colour));
    return one;
  };
  const colours = paper.COLOURS.map(([title, value], index) => entry(title, value, index));
  const palette = make('span', { id: 'swatch-palette', className: 'menu' }, ...colours);
  // A row of controls, as the stylesheet has one (frame.css): the menu hangs from it.
  const row = make('div', { id: 'swatch-row', className: 'group', hidden: true });
  row.append(button, name, palette);

  // The block that the swatch shows, by the box of it that is selected - or null: nothing is
  // selected, or an object. And the line it shows, where no thing is selected and a line is.
  let [shown, line] = [null, null];
  // What the swatch says of a line selected (ST-039, T-039.4).
  const OF_A_LINE =
    'The colour of the selected line: a click opens the colours, and a pick recolours the line';

  /**
   * Shows the swatch for what is selected: `thing`, a thing of the sketch, or nothing. Of a block
   * the row shows: the swatch is in the colour of the box that is selected, as the paper draws
   * it, beside that colour's name, and in the menu that colour is marked (`aria-current`: pressed
   * is said of a tool). With no thing selected and a line selected - asked of the Line tool
   * here, not as the script loads - the same of the line's colour, titled for a line. With
   * nothing selected, and of an object, the row is hidden - and the menu shut: open, it would
   * keep the keys of a page that shows none. It is shut by the way that `views.menu` handed
   * back, which shuts it where it is open and leaves it be where it is shut.
   */
  function show(thing) {
    shown = thing && sketch.isBox(thing) ? thing : null;
    line = thing ? null : (globalThis.lineTool?.picked() ?? null);
    row.hidden = !shown && !line;
    if (row.hidden) {
      shut();
      return;
    }
    const colour = shown ? shown.colour : globalThis.lines.colourOf(line.line);
    button.title = shown ? TITLE : OF_A_LINE;
    // The owner's colours after the eleven, as the sketch lists them now.
    const own = ownColours.of().map(({ name: title, value }) => entry(title, value, value));
    palette.replaceChildren(...colours, ...own);
    // Which colour the paper draws it in: by that its name, and the mark in the menu - of the
    // eleven by its name, of the owner's by its value; a plain value is marked nowhere.
    const value = paper.hex(colour);
    const at = paper.isOwn(colour)
      ? own.findIndex((one) => one.dataset.colour === colour)
      : paper.COLOURS.findIndex(([named]) => named === paper.named(colour)[0]);
    const marked = at < 0 ? null : (paper.isOwn(colour) ? own : colours)[at];
    name.textContent = ownColours.called(colour);
    button.style.background = value;
    button.setAttribute('aria-label', `Colour: ${name.textContent}`);
    for (const one of [...colours, ...own]) {
      if (one === marked) one.setAttribute('aria-current', 'true');
      else one.removeAttribute('aria-current');
    }
  }

  /**
   * A pick: the block takes the colour, every box of it - one step, or none where every box has
   * it already; or the line selected takes it, `lines.recolour` in one `sketch.change`, and
   * nothing else of the sketch changes. The swatch then shows it anew itself: where nothing
   * changed, the page is not told. The click goes on to the menu, which shuts (views.js).
   */
  function pick(colour) {
    const [box, picked] = [shown, line];
    if (box) sketch.paint(box, colour);
    else if (picked) sketch.change(() => globalThis.lines.recolour(picked, colour));
    show(box);
  }

  document.getElementById('none-picked').before(row);
  // The colours are a menu, and the way to shut it is what views.js hands back.
  const shut = views.menu(button, palette);
  globalThis.swatch = { show };
})();
