// The switches of the 3D page, left of its stage and under the levels (story ST-033): a row for
// each section of the sketch, in the pad's order, and "No section" last - where it has any - and
// a row for each group of objects that a switch takes away; and under them "Open along", the
// sides the house opens along, one picked at a time. 3d.html has their place, `#switches`, in
// the side that is hidden until there is a stage: this fills it and hears it. It decides
// nothing: a switch turned or a side picked is asked of its caller, and what is off and what is
// open, its caller says. Nothing here is written into the sketch. How it looks is side.css's.
import { NO_SECTION } from '../scene/shows.js';

/** The row of what is in no section, last of the sections: it holds what no block takes in. */
const NO_SECTION_NAME = 'No section';

/**
 * Fills `#switches`, and gives `shows({ sections, groups, off, open })`: it lists `sections`, the
 * sketch's, each `{ id, name }` in its order, and after them "No section" - or, where the sketch
 * has none, no row and the quiet line that says where sections are made; and `groups`, the
 * names of the groups of objects that have a switch (showing.js, `switchable`). The lists are
 * written anew where either changed. Every switch is on but what `off` - `{ sections, groups }`,
 * as `shownBy` takes it (scene/shows.js) - says is off. Each row says its name, and in full by
 * its title, where the side is too narrow for it.
 *
 * `asked` is what the page does when a switch is turned: `section(id, on)` - `id` a section's,
 * or `NO_SECTION` - and `group(name, on)`, `on` whether it is on now. A turn asks once.
 *
 * And under the objects, made once, "Open along": a button a row of `opens` (showing.js,
 * `opensOf`), `[data-open]` its key, which says its name and in full by its title, and asks
 * `asked.open(key)` once as it is clicked; `shows` presses the one that `open` says, and no other.
 */
export function openSwitches(asked, opens = []) {
  const { document } = globalThis;
  const $ = (id) => document.getElementById(id);
  const make = (tag, more) => Object.assign(document.createElement(tag), more);
  // Each switch listed now, with the list of `off` that says it, and what it says there.
  let switches = [];

  /** A row: its switch, which asks `ask(key, on)` as it is turned, and its name beside it. */
  function row(name, list, key, ask) {
    const box = make('input', { type: 'checkbox', checked: true });
    box.addEventListener('change', () => ask(key, box.checked));
    switches.push({ box, list, key });
    const label = make('label', { title: name });
    label.append(box, make('span', { textContent: name }));
    const item = make('li', {});
    item.append(label);
    return item;
  }

  /** A side to open the house along: a button, pressed where it is the one that is open. */
  function side({ open, name, title }) {
    const pick = make('button', { type: 'button', textContent: name, title });
    pick.dataset.open = open;
    pick.addEventListener('click', () => asked.open(open));
    const item = make('li', {});
    item.append(pick);
    return { pick, item };
  }
  const sides = opens.map(side);
  const listing = make('ul', { id: 'switch-opens' });
  listing.setAttribute('aria-labelledby', 'switch-opens-title');
  listing.append(...sides.map(({ item }) => item));
  const heading = make('h2', { id: 'switch-opens-title', textContent: 'Open along' });
  $('switches').append(heading, listing);

  let listed = '';
  return function shows({ sections, groups, off, open }) {
    const now = JSON.stringify([sections, groups]);
    if (now !== listed) {
      listed = now;
      switches = [];
      const section = (id, on) => asked.section(id, on);
      const rows = sections.map(({ id, name }) => row(name, 'sections', id, section));
      if (sections.length > 0) rows.push(row(NO_SECTION_NAME, 'sections', NO_SECTION, section));
      $('switch-sections').replaceChildren(...rows);
      $('switch-sections-none').hidden = sections.length > 0;
      const group = (name, on) => asked.group(name, on);
      $('switch-objects').replaceChildren(
        ...groups.map((name) => row(name, 'groups', name, group)),
      );
    }
    for (const { box, list, key } of switches) box.checked = !off[list].includes(key);
    for (const { pick } of sides)
      pick.setAttribute('aria-pressed', String(pick.dataset.open === open));
  };
}
