// Settings, beside the stage of the 3D page: the figures the house is built with - how thick its
// walls, its floors and its roofs are, how high a railing, a door, a window and its sill - each
// with its words, a field with its unit, its range, and a way back to its default. 3d.html has
// their place, closed: this lists them there, opens the list by its button, and hears it. It
// decides nothing and keeps nothing. What is typed it hands to its caller at every key, who says
// whether the sketch took it; and what a field says is the sketch's figure, as its caller read
// it - but for the field that is typed into, which holds what was typed until it is left, or
// until a sketch that was changed elsewhere is shown.

/**
 * What Settings say of each figure, whatever a sketch holds of it: a row for each, in the order
 * they are listed - its `name`; `words`, what it is, as a line begins; its `unit`; `range`, the
 * range it can be within, in words; and `usual`, its default. `listed` are the figures by their
 * names, each `{ words, unit, default, from, to }`: the pad's own list of them.
 */
export const rowsOf = (listed) =>
  Object.entries(listed).map(([name, { words, unit, default: usual, from, to }]) => ({
    name,
    words: `${words[0].toUpperCase()}${words.slice(1)}`,
    unit,
    range: `from ${from} to ${to} ${unit}`,
    usual,
  }));

/**
 * Opens Settings, and gives `shows({ figures, locked })`: every field says its figure of
 * `figures` - the eight of the sketch, by their names - "Default" is off where that is the
 * default, and nothing is said beside a field. `locked` is why no figure can be changed, in
 * words, and empty where one can: locked, the words stand over the fields, and neither a field
 * nor "Default" takes anything.
 *
 * `listed` are the figures as `rowsOf` takes them. `asked` is what the page does when it is
 * asked: `typed(name, text)` at every key typed into a field, with all that the field holds by
 * then, and `usual(name)` by "Default". Each answers with nothing where the sketch holds the
 * figure now, and else with why it does not, in words: those are said beside the field.
 *
 * What the page shows while it answers a key is not written into the field of that key: "1.",
 * on the way from 1.2 to 1.5, would lose its point to the 1 it made, and a comma would turn
 * into a point under the typist's hands. Whatever else is shown - a sketch that was changed
 * elsewhere - is written into every field. Left, by Enter or for anything else, a field says
 * the sketch's figure again: what was refused is gone from it, and the words beside it stay,
 * until something is shown or typed again or Settings are closed.
 */
export function openSettings(listed, asked) {
  const { document } = globalThis;
  const $ = (id) => document.getElementById(id);
  const make = (tag, has) => Object.assign(document.createElement(tag), has);
  // The figures of the sketch as they were shown last: what a field says once it is left. And
  // the field whose key is being answered, while it is.
  let held = {};
  let answered = null;

  const rows = rowsOf(listed).map(({ name, words, unit, range, usual }) => {
    const id = `figure-${name}`;
    const field = make('input', { id, type: 'text', inputMode: 'decimal', autocomplete: 'off' });
    const back = make('button', { type: 'button', textContent: 'Default' });
    back.title = `Back to ${usual} ${unit}`;
    const within = make('small', { id: `${id}-range`, textContent: range });
    const refused = make('small', { id: `${id}-refused`, className: 'refused' });
    refused.setAttribute('role', 'alert');
    field.setAttribute('aria-describedby', `${within.id} ${refused.id}`);
    // What the page answers is said beside the field - unless the answer locked the fields:
    // then the words over them say why.
    const says = (words) => {
      refused.textContent = field.disabled ? '' : words;
    };
    field.addEventListener('input', () => {
      answered = field;
      try {
        says(asked.typed(name, field.value));
      } finally {
        answered = null;
      }
    });
    field.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') field.blur();
    });
    field.addEventListener('blur', () => {
      field.value = String(held[name]);
    });
    back.addEventListener('click', () => says(asked.usual(name)));

    const line = make('span', { className: 'group' });
    line.append(field, make('span', { textContent: unit }), back);
    const row = make('li');
    row.dataset.figure = name;
    row.append(make('label', { htmlFor: id, textContent: words }), line, within, refused);
    $('figures').append(row);
    return { name, usual, field, back, refused };
  });

  // Opened and closed by the button. Either way nothing that was typed is left over: no field
  // is typed into, each says the sketch's figure, and nothing is said beside one.
  const [button, place] = [$('settings-open'), $('settings')];
  button.addEventListener('click', () => {
    place.hidden = !place.hidden;
    button.setAttribute('aria-expanded', String(!place.hidden));
    for (const { name, field, refused } of rows) {
      field.blur();
      field.value = String(held[name]);
      refused.textContent = '';
    }
  });

  return ({ figures, locked }) => {
    held = figures;
    const said = $('settings-said');
    said.textContent = locked;
    said.hidden = locked === '';
    for (const { name, usual, field, back, refused } of rows) {
      if (field !== answered || locked !== '') {
        field.value = String(figures[name]);
        refused.textContent = '';
      }
      field.disabled = locked !== '';
      back.disabled = locked !== '' || figures[name] === usual;
    }
  };
}
