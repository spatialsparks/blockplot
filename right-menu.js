// The right button's menu on the pad's paper (T-037.5), from above and in every slice: a right
// press on a block or an object selects it, as a left press with Select does, whatever the tool,
// and opens a menu of it where it was pressed - Delete, Duplicate, Turn, Section ▸, Category ▸,
// Move to level ▸, each doing as one step what the pad does by its key or its button. Several
// selected (T-037.6), a press on one of them acts on all: each pick one step. On the empty paper
// it opens Paste, where something was copied, and Select all of the layer drawn on; on a label or
// a line nothing. And the keys: Delete and Backspace take away what is selected, Ctrl+C copies it
// and Ctrl+V pastes at the pointer's last place on the paper (selected.js).
//
// The menu is one of views.js's, with no button (`views.popup`): it shuts as every menu does, and
// while it is open every key is its own. Its look is the menu's of frame.css, and its place
// right-menu.css's. The page hands it what is selected and takes what it selects (page.js):
// `rightMenu.selected`, a function giving a list, and `rightMenu.select(things)`. Loaded by
// index.html after pointer.js, selected.js, sections/model.js and category-list.js - whose list
// it reads its groups of categories from - and before page.js.
(() => {
  const { document, paper, sketch, sections, categories, views, pointer } = globalThis;
  const OFF = {
    sections: 'The sketch has no sections',
    here: 'It stands there already',
  };

  /**
   * Where a menu of a size, [wide, high], opens that was asked for at a place of a window of a
   * size: its top left corner there - or, where it would reach past the window's right or bottom
   * edge, to the left of or above the place; never past the left or the top edge. In pixels.
   */
  function placed([x, y], [wide, high], [width, height]) {
    const along = (at, size, most) => Math.max(0, at + size > most ? at - size : at);
    return [along(x, wide, width), along(y, high, height)];
  }

  // What the menu is pressed on, whole: of a box its block, of an object the object.
  const isBox = (thing) => sketch.isBox(thing);
  const onLayer = () => sketch.layer(paper.PLANE, sketch.on()).things;
  /** One of each whole among things, in their order: the first box of a block, and each object. */
  const ones = (things) =>
    things.filter(
      (t, i) => !isBox(t) || things.findIndex((o) => sketch.blockOf(t).includes(o)) === i,
    );
  /** What is common to all of a list, or undefined where they differ. */
  const common = (list) => (new Set(list).size === 1 ? list[0] : undefined);

  /** Takes away the things, and selects nothing. */
  function remove(things) {
    sketch.remove(things);
    rightMenu.select([]);
  }

  /** A copy of a thing, one cell right of it on the paper - as a drag with Ctrl lays one - selected; of several, of each. */
  function duplicate(things, at) {
    if (things.length > 1) return rightMenu.select(ones(sketch.duplicate(things)));
    const [thing] = things;
    const index = onLayer().findIndex((entry) => entry.thing === thing);
    if (index < 0) return;
    const count = sketch.doc.things.length;
    const to = [at[0] + (paper.FLIP ? -1 : 1), at[1]];
    const grabbed = { at: index, zone: 'move', copy: true };
    sketch.apply({ tool: 'move', from: at, to, grabbed });
    const made = sketch.doc.things.slice(count);
    if (made.length > 0) rightMenu.select(made.slice(0, 1));
  }

  /** The sections of the sketch by name, the one the blocks are in marked, and "In no section". */
  function sectionsOf(things) {
    const name = 'Section ▸';
    const listed = sections.list();
    if (listed.length === 0) return { name, off: true, why: OFF.sections };
    const now = common(things.filter(isBox).map((box) => sections.of(box)?.id ?? null));
    const pick = (id) => () => sections.put(things, id);
    const entry = (id, said) => ({ name: said, marked: now === id, act: pick(id) });
    return {
      name,
      list: [...listed.map(({ id, name: said }) => entry(id, said)), entry(null, 'In no section')],
    };
  }

  /**
   * "By its name", then the categories under the words of their groups - read from the list
   * beside the paper (category-list.js), as it shows them - the one picked for the blocks marked.
   */
  function categoriesOf(things) {
    const keyOf = ({ category, by }) => (by === 'picked' ? category.key : '');
    const now = common(
      things.filter(isBox).map((box) => keyOf(categories.of(sketch.blockOf(box)))),
    );
    const entry = (key, said) => ({
      name: said,
      marked: now === key,
      act: () => sketch.categoriseEach(things, key),
    });
    const list = [entry('', 'By its name')];
    const groups = [...(document.getElementById('category')?.children ?? [])];
    for (const group of groups.filter((one) => one.tagName === 'OPTGROUP')) {
      list.push({ word: group.label });
      for (const option of group.children) list.push(entry(option.value, option.textContent));
    }
    return { name: 'Category ▸', list };
  }

  /**
   * The levels of the top view, and of objects the ground: the one the thing pressed stands on
   * marked and off, and off each level that a block cannot be carried to, with why
   * (`sketch.refusedLevel`). Several go by the rows between that one and the level picked.
   */
  function levelsOf(things, pressed) {
    const stands = isBox(pressed) ? pressed.z[1] : pressed.floor;
    const keys = things.some(isBox) ? sketch.levels() : sketch.keys();
    const list = keys.map((key) => {
      const marked = stands === key;
      const why = marked ? OFF.here : sketch.refusedLevel(things, key, pressed);
      const act = () => sketch.toLevel(things, key, pressed);
      return { name: sketch.nameOf('top', key), marked, off: Boolean(why), why, act };
    });
    return { name: 'Move to level ▸', list };
  }

  /**
   * The entries of the menu of things, in their order: each a `name` and what it does, `act` -
   * or the `list` it opens - or `off`, with `why`. An entry that does not apply is left out:
   * Turn is where an object is among them, Section and Category where a block is. `at` is where
   * it was pressed, in cells, and `pressed` the thing it was pressed on.
   */
  function entries(things, at, pressed = things[0]) {
    const list = [
      { name: 'Delete', act: () => remove(things) },
      { name: 'Copy', act: () => sketch.copy(things) },
      { name: 'Duplicate', act: () => duplicate(things, at) },
    ];
    if (!things.every(isBox)) list.push({ name: 'Turn', act: () => sketch.turnEach(things) });
    if (things.some(isBox)) list.push(sectionsOf(things), categoriesOf(things));
    return [...list, levelsOf(things, pressed)];
  }

  /** Pastes what was copied at a place, in cells, and selects it. */
  const paste = (at) => rightMenu.select(ones(sketch.paste(at)));

  /** The entries of the empty paper: Paste, where something was copied - off, with why, where it cannot be here - and Select all. */
  function blank(at) {
    const why = sketch.copied() ? sketch.pasteRefused() : null;
    const list =
      why === null ? [] : [{ name: 'Paste', off: Boolean(why), why, act: () => paste(at) }];
    const all = paper.PLANE === 'top' ? 'Select all on this level' : 'Select all in this slice';
    const act = () => rightMenu.select(ones(onLayer().map((entry) => entry.thing)));
    return [...list, { name: all, act }];
  }

  // THE MENU on the page: a part of views.js's, with a part beside it for the list of an entry.
  const make = (tag, set) => Object.assign(document.createElement(tag), set);
  const panel = make('div', { className: 'menu right-menu', id: 'right-menu' });
  const beside = make('div', { className: 'menu right-list', hidden: true });
  panel.setAttribute('role', 'menu');
  beside.setAttribute('role', 'menu');
  const open = views.popup(panel);
  const windowOf = () => [globalThis.innerWidth, globalThis.innerHeight];
  const sizeOf = (part) => [part.offsetWidth, part.offsetHeight];
  const moveTo = (part, [x, y]) => Object.assign(part.style, { left: `${x}px`, top: `${y}px` });

  /** Writes entries into a part: a button each - off, marked, or opening a list - a word of a group, and under an entry that is off why. */
  function fill(part, list) {
    const made = list.flatMap((entry) => {
      if (entry.word) return [make('small', { textContent: entry.word })];
      const one = make('button', {
        type: 'button',
        textContent: entry.name,
        disabled: !!entry.off,
      });
      const marked = entry.marked !== undefined;
      one.setAttribute('role', marked ? 'menuitemradio' : 'menuitem');
      if (marked) one.setAttribute('aria-checked', String(entry.marked));
      if (entry.list) one.setAttribute('aria-haspopup', 'menu');
      one.addEventListener('click', () => (entry.list ? show(one, entry.list) : entry.act()));
      return entry.why ? [one, make('small', { className: 'why', textContent: entry.why })] : [one];
    });
    part.replaceChildren(...made);
  }

  /** Opens the list of an entry beside the menu: to its right, or to its left where the right has no room. */
  function show(entry, list) {
    fill(beside, list);
    beside.hidden = false;
    panel.append(beside);
    const [wide, high] = sizeOf(beside);
    const [width] = windowOf();
    const { left, right } = panel.getBoundingClientRect();
    const x = right + wide <= width ? right : Math.max(0, left - wide);
    moveTo(beside, [
      x,
      placed([0, entry.getBoundingClientRect().top], [wide, high], windowOf())[1],
    ]);
    beside.querySelector('button:enabled')?.focus();
  }

  /** Opens the menu of things where it was pressed - a place of the window, in pixels - inward, whole: of no things, the empty paper's. */
  function openAt(things, at, place, pressed = things[0]) {
    fill(panel, things.length > 0 ? entries(things, at, pressed) : blank(at));
    beside.hidden = true;
    moveTo(panel, place);
    open();
    moveTo(panel, placed(place, sizeOf(panel), windowOf()));
  }

  /**
   * A right press on the paper: on a block or an object, it is selected and its menu opens there -
   * on one of several selected, the menu of all of them; on the empty paper, its menu.
   */
  function press(event) {
    if (event.button !== 2) return;
    const [at, place] = [pointer.at(event), [event.clientX, event.clientY]];
    const grabbed = pointer.grab(at);
    const thing = grabbed?.at === undefined ? null : onLayer()[grabbed.at]?.thing;
    if (!grabbed) return openAt([], at, place);
    if (!thing) return;
    const now = rightMenu.selected();
    if (now.some((one) => sketch.blockOf(one).includes(thing)))
      return openAt(now, at, place, thing);
    rightMenu.select([thing]);
    openAt([thing], at, place);
  }

  const canvas = document.getElementById('paper');
  canvas.addEventListener('pointerdown', press);
  // The pointer's last place on the paper, where Ctrl+V pastes: none once it has left it.
  let last = null;
  canvas.addEventListener('pointermove', (event) => void (last = pointer.at(event)));
  canvas.addEventListener('pointerleave', () => void (last = null));
  // The press gives the focus to nothing else: the menu's first entry keeps it.
  canvas.addEventListener('mousedown', (event) => event.button === 2 && event.preventDefault());
  document.body.append(panel);

  // Delete and Backspace, with nothing held beside them, take away what is selected, whole; Ctrl+C
  // copies it, and Ctrl+V pastes what was copied where the pointer is on the paper.
  document.addEventListener('keydown', (event) => {
    if (views.typing(event)) return;
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
      const copies = key === 'c' && sketch.copy(rightMenu.selected());
      const pastes = key === 'v' && last !== null && sketch.copied();
      if (copies || pastes) event.preventDefault();
      if (pastes) paste(last);
      return;
    }
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    const things = rightMenu.selected();
    if (things.length > 0) remove(things);
  });

  // What is selected, and the way to select: the page's, until it hands them over (page.js).
  const rightMenu = { placed, entries, blank, openAt, selected: () => [], select() {} };
  globalThis.rightMenu = rightMenu;
})();
