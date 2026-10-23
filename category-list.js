// The list of categories beside the paper (story ST-028): what the block that is selected is,
// picked from the pad's one list (categories.js). The script makes its parts itself and puts them
// into the aside, right after the pad's words of what is selected: a row that holds the list and,
// under it, the sentence that says which category the block has and by what (footer.js).
//
// The list stands at the category that was picked for the block, and at its first entry, "by its
// name", while none was: the text of that entry says what the name gives. So the list itself
// tells a picked Kitchen, "Kitchen", from one by its name, "By its name: Kitchen" - and the very
// category that a name gives can be picked, for it is another entry: a list tells of no pick that
// changes nothing. A pick goes to the one writer, `sketch.categorise` (labels.js), and what a
// block is, is read by the one reading, `categories.of`: no field and no name is read here.
//
// The list is a field, and while it has the focus every key is its own (views.typing) - a B
// typed there would pick a Bedroom. So it gives the focus back once a category is picked, and on
// Escape; and one key takes the focus to it, K. The page hands it what is selected, at every
// refresh (page.js): `categoryList.show`.
(() => {
  const { document, categories, sketch, footer, views } = globalThis;
  // What a block counts as (blocks.countsAs), in the pad's words: the list has a group for each.
  const GROUPS = {
    room: 'A room',
    open: 'Open air',
    glass: 'Glass',
    ground: 'Ground',
    cut: 'A cut',
  };
  const TITLE =
    'The category of the selected block, which says what it counts as: pick one, or have it ' +
    'read from its name (K)';

  const make = (tag, set, ...parts) => {
    const made = Object.assign(document.createElement(tag), set);
    made.append(...parts);
    return made;
  };
  // The first entry, with no word for a value: its text is written when a block is shown.
  const byName = make('option', { value: '' });
  // After it the rows of the pad's one list, in their order, each in the group of what it counts
  // as - a group is made where the list first names it. No row is stated here.
  const groups = new Map();
  for (const { key, name, as } of categories.LIST) {
    if (!groups.has(as)) groups.set(as, make('optgroup', { label: GROUPS[as] }));
    groups.get(as).append(make('option', { value: key, textContent: name }));
  }
  // As wide as the aside, whatever its first entry says: its size does not change with the block.
  const set = { id: 'category', title: TITLE, style: 'width: 100%' };
  const list = make('select', set, byName, ...groups.values());
  const said = make('p', { id: 'category-said' });
  const row = make('div', { id: 'category-row', hidden: true }, list, said);

  // The block that the list shows, by a box of it - or null: nothing is selected, or an object.
  let shown = null;

  /**
   * Shows the list for what is selected: `thing`, a thing of the sketch, or nothing. Of a block
   * the row shows: the list stands at the category that was picked for it - or at its first
   * entry, where none was - that entry says what the block's name gives, and the sentence under
   * the list is the pad's own (`footer.picked`). With nothing selected, and of an object, the row
   * is hidden: the list is not to be had, and K does nothing.
   */
  function show(thing) {
    shown = thing && sketch.isBox(thing) ? thing : null;
    row.hidden = !shown;
    if (!shown) return;
    const boxes = sketch.blockOf(shown);
    const { category, by } = categories.of(boxes);
    // What the name gives, the one reading says too: asked of the block with nothing picked.
    const named = categories.of(boxes.map((box) => ({ ...box, category: undefined }))).category;
    byName.textContent = `By its name: ${named?.name ?? 'no category'}`;
    list.value = by === 'picked' ? category.key : '';
    said.textContent = footer.picked(shown).category;
  }

  // A pick: the word of the entry goes to the one writer - none, of the first entry, which takes
  // the category away. Then the list shows the block anew, and gives the focus back to the page.
  list.addEventListener('change', () => {
    if (shown) sketch.categorise(shown, list.value);
    show(shown);
    list.blur();
  });
  // Escape shuts the list with nothing picked, and gives the focus back. An open list may take
  // the key for itself, as Chromium's does: the page then hears no more than the key come up.
  for (const heard of ['keydown', 'keyup'])
    list.addEventListener(heard, (event) => event.key === 'Escape' && list.blur());
  // K takes the focus to the list, and opens it where the browser lets a script open one.
  document.addEventListener('keydown', (event) => {
    // A key typed into a field is the field's; with Ctrl, Alt or the command key it is the browser's.
    if (views.typing(event) || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!shown || event.key.toLowerCase() !== 'k') return;
    // The key ends here: it is not typed into the list, which would take it for a Kitchen.
    event.preventDefault();
    list.focus();
    try {
      list.showPicker();
    } catch {
      // Not opened: the list has the focus, and its own keys open and walk it.
    }
  });

  document.getElementById('picked').after(row);
  globalThis.categoryList = { show };
})();
