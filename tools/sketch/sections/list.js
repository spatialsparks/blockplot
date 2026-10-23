// The sections beside the paper (story ST-032, task T-032.4), on the pad's page alone. Left of
// the paper, under the levels or the slice and over their hint: "Sections", three buttons - "New
// section", and for the section that is picked "Rename" and "Remove" - the list, a row a section
// as a level's row is, and two sentences that say how. Right of the paper, under the colour of
// the selected block: its section, in a list. Every button asks the model (sections/model.js)
// and nothing else, and what the model refuses, the alarm says (`sketch.trouble`).
//
// A section picked in the list is a tool, as a colour is the Block tool: while one is picked the
// page's tool is 'section', and the paper is the section's to fill - a click puts a block in, or
// takes it out where it is in it, and a box puts every block that it reaches in (`fill`). The
// page hands the script what is selected and its tool at every refresh, and takes the tool that
// it gives back (`show`, page.js); and the paper draws the section's things in full and the rest
// of the layer drawn on faded, by `picked` (layers.lit). The script makes its parts itself, as
// category-list.js does, and puts its row on the right after the swatch's (swatch.js).
(() => {
  const { document, prompt, paper, sketch, sections } = globalThis;
  const HINT =
    'Pick a section, then click the blocks that belong to it, or drag a box over them: a second ' +
    'click on a block takes it out again. The word beside a section hides its blocks on the ' +
    'paper, and what stands in them, until it is pressed again.';
  const TITLES = {
    add: 'A set of blocks under a name of your own - a home, a building: name it, click its blocks',
    rename: 'Another name for the section that is picked',
    remove: 'The section that is picked, out of the list: its blocks stay, in no section',
    pick:
      'Pick this section, then click the blocks that belong to it or drag a box over them. ' +
      'Escape, or another tool, ends it',
    hide: 'Hides the blocks of this section on the paper, and what stands in them, or shows them',
    choice: 'The section that the selected block is in: pick another, or No section',
  };
  // A stroke's box reaches a block as Merge's does (strokes.js): where the two overlap.
  const overlap = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const make = (tag, set, ...parts) => {
    const made = Object.assign(document.createElement(tag), set);
    made.append(...parts);
    return made;
  };
  const button = (textContent, title, act) => {
    const made = make('button', { type: 'button', textContent, title });
    made.addEventListener('click', act);
    return made;
  };

  // The section that is picked, by its `id`, or null - and whether a click on its name asked for
  // it just now: the one show at which another tool than the section's does not end the pick.
  let picked = null;
  let fresh = false;
  // The box of the selected block, whose section stands right of the paper - or null.
  let shown = null;

  /** Has the page say what the model refused, in the alarm. */
  function say(refused) {
    sketch.trouble = refused;
    sketch.onChange();
  }
  /** Picks a section - none, with null - and has the page show it, as layers.js does a layer. */
  function pick(id) {
    [picked, fresh] = [id, id !== null];
    sketch.onChange();
  }

  // "New section" asks for a name, as "New level" asks for a height; "Rename" asks with the name
  // the section has. A question put away changes nothing; an empty name is the model's to refuse.
  const ASKED = `Name of the new section, ${sections.NAME_MOST} characters at the most`;
  const add = button('New section', TITLES.add, () => {
    const text = prompt(ASKED, '');
    const { id, refused } = text === null ? {} : sections.make(text);
    if (refused) say(refused);
    else if (id !== undefined) pick(id);
  });
  const rename = button('Rename', TITLES.rename, () => {
    const { name } = sections.list().find(({ id }) => id === picked) ?? {};
    const text = name === undefined ? null : prompt('Name of the section', name);
    const { refused } = text === null ? {} : sections.rename(picked, text);
    if (refused) say(refused);
  });
  // No question: nothing of the design goes, and Undo brings the section back with its blocks.
  const remove = button('Remove', TITLES.remove, () => sections.remove(picked));
  const list = make('ul', { id: 'sections' });

  /** How many blocks a section holds, in words: hidden or not, ground or a cut, each is one. */
  function counted(id) {
    const boxes = sketch.doc.things.filter((thing) => sketch.isBox(thing));
    const its = boxes.filter((box) => sections.of(box)?.id === id);
    const blocks = new Set(its.map((box) => sketch.blockOf(box)[0])).size;
    return blocks === 0 ? 'no block yet' : `${blocks} ${blocks > 1 ? 'blocks' : 'block'}`;
  }

  /**
   * A section's row, as a level's row is: its name, which picks it; its switch, a quiet word; two
   * arrows; and under them how many blocks it holds.
   */
  function row({ id, name, hidden }) {
    // A second click on the name of the section that is picked ends the pick.
    const named = button(name, TITLES.pick, () => pick(id === picked ? null : id));
    named.setAttribute('aria-pressed', String(id === picked));
    const switched = button(hidden ? 'hidden' : 'shown', TITLES.hide, () => {
      sections.hide(id, !hidden);
    });
    const arrow = (sign, by, way) => {
      const title = `Move this section ${way} in the list`;
      const made = button(sign, title, () => sections.move(id, by));
      // A sign is no name to read out: the arrow's name is what its title says, in words.
      made.setAttribute('aria-label', title);
      return made;
    };
    const controls = [named, switched, arrow('▲', -1, 'up'), arrow('▼', 1, 'down')];
    // By these the list finds the button that was in use, once it has been written anew.
    controls.forEach((one, place) => (one.dataset.held = `${place} ${id}`));
    const item = make('li', {}, ...controls, make('small', { textContent: counted(id) }));
    item.dataset.section = String(id);
    return item;
  }

  // Right of the paper: the section of the selected block, "No section" first with no word for
  // a value. A pick goes to the model, and the list gives the focus back - on Escape too - for
  // while a list has it every key is its own (views.typing), as with the list of categories.
  const choice = make('select', { id: 'section', title: TITLES.choice, style: 'width: 100%' });
  const side = make('div', { id: 'section-row', hidden: true }, choice);
  /** The list on the right, at the section of the block that is selected: none for the rest. */
  function beside(listed) {
    side.hidden = !shown;
    if (!shown) return;
    const option = (value, textContent) => make('option', { value, textContent });
    const named = listed.map(({ id, name }) => option(String(id), name));
    choice.replaceChildren(option('', 'No section'), ...named);
    choice.value = String(sections.of(shown)?.id ?? '');
  }
  choice.addEventListener('change', () => {
    if (shown) sections.put([shown], choice.value === '' ? null : Number(choice.value));
    beside(sections.list());
    choice.blur();
  });
  for (const heard of ['keydown', 'keyup'])
    choice.addEventListener(heard, (event) => event.key === 'Escape' && choice.blur());

  /**
   * Shows the sections for what is selected and the page's tool, and gives back the tool that is
   * to be: 'section' while a section is picked; 'move' where the page's tool was the section's
   * and none is picked any more; else the tool it was handed. A pick ends at a show that is
   * handed another tool - but the show that a click on a name asked for - and where the section
   * is gone from the list, as after an Undo.
   */
  function show(selected, tool) {
    if (tool !== 'section' && !fresh) picked = null;
    fresh = false;
    const listed = sections.list();
    if (!listed.some(({ id }) => id === picked)) picked = null;
    shown = selected && sketch.isBox(selected) ? selected : null;
    const held = document.activeElement?.dataset?.held;
    list.replaceChildren(...listed.map(row));
    if (held) list.querySelector(`[data-held="${held}"]`)?.focus();
    for (const one of [rename, remove]) one.hidden = picked === null;
    beside(listed);
    if (picked !== null) return 'section';
    return tool === 'section' ? 'move' : tool;
  }

  /**
   * A stroke of the pick, on the layer drawn on: a click - a stroke within one cell, as the
   * eraser tells one - puts the block on top there into the section that is picked, or takes it
   * out where it is in it, and a box puts every block whose rects it overlaps into it, in one
   * step. What stands in a block is looked through (`sketch.boxAt`), and what a hidden section
   * holds lies on no layer: no stroke reaches it. With no section picked, nothing.
   */
  function fill(stroke) {
    if (picked === null) return;
    const { cells } = sketch.shape(stroke);
    const [left, top, right, bottom] = cells;
    if (right - left > 1 || bottom - top > 1) {
      const { things } = sketch.layer(paper.PLANE, sketch.on());
      const reaches = ({ thing, rect }) => sketch.isBox(thing) && overlap(rect, cells);
      const boxes = things.filter(reaches).map(({ thing }) => thing);
      sections.put(boxes, picked);
      return;
    }
    const box = sketch.boxAt(stroke.to);
    if (box) sections.put([box], sections.of(box)?.id === picked ? null : picked);
  }

  // The two buttons for the section that is picked are not there while none is - never off: the
  // words of every button of a side are held to their ground, which the faint words of what is
  // off are not (sketch-look.spec.ts).
  Object.assign(add, { id: 'section-add' });
  Object.assign(rename, { id: 'section-rename', hidden: true });
  Object.assign(remove, { id: 'section-remove', hidden: true });
  const title = make('h2', { id: 'sections-title', textContent: 'Sections' });
  const tools = make('p', { id: 'section-tools', className: 'group' }, add, rename, remove);
  const hint = make('p', { id: 'sections-hint', textContent: HINT });
  document.getElementById('layers-hint').before(title, tools, list, hint);
  document.getElementById('swatch-row').after(side);
  globalThis.sectionList = { show, fill, picked: () => picked };
})();
