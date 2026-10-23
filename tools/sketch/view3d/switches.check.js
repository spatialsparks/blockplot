// The check of the 3D page's switches (story ST-033), on a made-up page: a row a section, in the
// sketch's order, and "No section" last - only where the sketch has a section, and else no row
// and the quiet line; a row a group of objects; each switch on but what is said to be off; a
// switch turned asks once, with what it holds and whether it is on now; and the rows are written
// anew where the lists changed, and not where only what is off did. And under them "Open along":
// a button a side, in the order it was given, under its heading; a click asks once, and the one
// that is open is pressed, and no other. What a switch takes away is scene/shows.check.js's,
// how a row looks a look's. No browser, and nothing of the pad. Run by tools/sketch/check.js, as
// every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { opensOf } from './showing.js';
import { openSwitches } from './switches.js';

// A made-up page: a place for every name asked for, which keeps what it is given and notes who
// listens for what on it.
const places = new Map();
const place = () => ({
  dataset: {},
  children: [],
  heard: {},
  attributes: {},
  setAttribute(name, value) {
    this.attributes[name] = value;
  },
  append(...more) {
    this.children.push(...more);
  },
  replaceChildren(...more) {
    this.children = more;
  },
  addEventListener(type, hear) {
    this.heard[type] = hear;
  },
});
globalThis.document = {
  createElement: (tag) => Object.assign(place(), { tag }),
  getElementById: (id) => places.get(id) ?? places.set(id, place()).get(id),
};
const asked = [];
const winds = { front: 'south-east', back: 'north-west', left: 'south-west', right: 'north-east' };
const shows = openSwitches(
  {
    section: (id, on) => asked.push(['section', id, on]),
    group: (name, on) => asked.push(['group', name, on]),
    open: (side) => asked.push(['open', side]),
  },
  opensOf(winds),
);
const NOTHING_OFF = { sections: [], levels: [], groups: [] };
const [sectionRows, none, objectRows] = [
  'switch-sections',
  'switch-sections-none',
  'switch-objects',
].map((id) => globalThis.document.getElementById(id));

/** The rows of a list: of each, its name, its title, and whether its switch is on. */
const rowsOf = (list) =>
  list.children.map(({ children: [label] }) => {
    const [box, words] = label.children;
    return [words.textContent, label.title, box.checked];
  });
/** The switch of a row of a list, by its name. */
const switchOf = (list, name) =>
  list.children.find(({ children: [label] }) => label.title === name).children[0].children[0];

// The made-up house of the browser tests' file of every part: two sections, the second hidden on
// the paper - which the 3D page shows - and the five groups that have a switch.
const SECTIONS = [
  { id: 1, name: 'Atelier "Süd"', hidden: false },
  { id: 2, name: 'Yard', hidden: true },
];
const GROUPS = ['Kitchen', 'Bathroom', 'Furniture', 'Garden', 'People and cars'];
shows({ sections: SECTIONS, groups: GROUPS, off: NOTHING_OFF, open: 'none' });
// Every switch is on, the first time; "No section" is last; and the quiet line is hidden.
assert.deepEqual(rowsOf(sectionRows), [
  ['Atelier "Süd"', 'Atelier "Süd"', true],
  ['Yard', 'Yard', true],
  ['No section', 'No section', true],
]);
assert.equal(none.hidden, true);
assert.deepEqual(
  rowsOf(objectRows),
  GROUPS.map((name) => [name, name, true]),
);
// Each is a checkbox, as the page's two other switches are.
for (const list of [sectionRows, objectRows]) {
  for (const {
    children: [label],
  } of list.children) {
    assert.deepEqual(
      [label.tag, label.children[0].tag, label.children[0].type],
      ['label', 'input', 'checkbox'],
    );
  }
}

// A switch turned asks once, with what it holds and whether it is on now: a section by its id,
// "No section" by the scene's word for it, a group by its name.
const turned = (box, on) => {
  box.checked = on;
  box.heard.change();
};
turned(switchOf(sectionRows, 'Atelier "Süd"'), false);
assert.deepEqual(asked, [['section', 1, false]]);
turned(switchOf(sectionRows, 'No section'), false);
turned(switchOf(objectRows, 'People and cars'), false);
turned(switchOf(sectionRows, 'Atelier "Süd"'), true);
assert.deepEqual(asked, [
  ['section', 1, false],
  ['section', 'none', false],
  ['group', 'People and cars', false],
  ['section', 1, true],
]);

// What is off is said by the caller, and only that is off: the rows stay the rows they were.
const before = sectionRows.children;
shows({
  sections: SECTIONS,
  groups: GROUPS,
  off: { sections: [2, 'none'], levels: [814], groups: ['Garden'] },
});
assert.equal(sectionRows.children, before);
assert.deepEqual(
  rowsOf(sectionRows).map(([name, , on]) => [name, on]),
  [
    ['Atelier "Süd"', true],
    ['Yard', false],
    ['No section', false],
  ],
);
assert.deepEqual(
  rowsOf(objectRows).map(([, , on]) => on),
  [true, true, true, false, true],
);
// A section renamed is a list changed: written anew, with the new name, and what is off still off.
shows({
  sections: [SECTIONS[0], { ...SECTIONS[1], name: 'Garden and yard' }],
  groups: GROUPS,
  off: { sections: [2], levels: [], groups: [] },
});
assert.notEqual(sectionRows.children, before);
assert.deepEqual(
  rowsOf(sectionRows).map(([name, , on]) => [name, on]),
  [
    ['Atelier "Süd"', true],
    ['Garden and yard', false],
    ['No section', true],
  ],
);

// A sketch with no section: no row - "No section" neither - and the quiet line that says where
// sections are made. The groups are listed as before.
asked.length = 0;
shows({ sections: [], groups: GROUPS, off: NOTHING_OFF, open: 'none' });
assert.deepEqual(rowsOf(sectionRows), []);
assert.equal(none.hidden, false);
assert.equal(objectRows.children.length, 5);
turned(switchOf(objectRows, 'Kitchen'), false);
assert.deepEqual(asked, [['group', 'Kitchen', false]]);

// "Open along", under the objects: its heading, then its list - a button a side, as opensOf
// gives them, each `[data-open]` its key, saying its name and in full by its title. "None" is
// pressed the first time, and no other; a click asks once, by the key, and presses nothing
// itself: what is open is the caller's to say, and then that one alone is pressed.
const [heading, opening] = globalThis.document.getElementById('switches').children;
assert.deepEqual(
  [heading.tag, heading.id, heading.textContent, opening.tag, opening.id],
  ['h2', 'switch-opens-title', 'Open along', 'ul', 'switch-opens'],
);
assert.equal(opening.attributes['aria-labelledby'], 'switch-opens-title');
const sides = opening.children.map(({ children: [pick] }) => pick);
assert.deepEqual(
  sides.map((pick) => [pick.tag, pick.type, pick.dataset.open, pick.textContent, pick.title]),
  opensOf(winds).map(({ open, name, title }) => ['button', 'button', open, name, title]),
);
const pressed = () => sides.filter((pick) => pick.attributes['aria-pressed'] === 'true');
assert.deepEqual(
  sides.map((pick) => pick.attributes['aria-pressed']),
  ['true', 'false', 'false', 'false', 'false'],
);
asked.length = 0;
sides[1].heard.click();
assert.deepEqual(asked, [['open', 'front']]);
assert.deepEqual(pressed(), [sides[0]]);
shows({ sections: [], groups: GROUPS, off: NOTHING_OFF, open: 'far' });
assert.deepEqual(
  pressed().map((pick) => pick.dataset.open),
  ['far'],
);
// The list is made once: a sketch read anew lists its sections again, and the sides stay.
assert.equal(globalThis.document.getElementById('switches').children.length, 2);

process.stdout.write(
  'tools/sketch/view3d: the 3D page lists a switch a section, "No section" last where there is one and the quiet line where there is none, and a switch a group of objects; a switch turned asks once, and what is off shows off; and the sides to open along, one pressed at a time\n',
);
