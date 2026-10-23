// The check of several selected, Copy and Paste and the empty paper's menu (T-037.6:
// selected.js, right-menu.js, footer.js), on the made-up page of check-right-menu.js. From above:
// the empty paper's menu - Select all alone, then Paste where something was copied, off with why
// on the ground - and Select all taking every block and object of the level drawn on, once each,
// and nothing a hidden section holds; the menu of several, a right press on one of them and on a
// thing among none; each pick of several one step, which Undo takes back to the byte - Delete,
// Duplicate, Turn, Section, Category, Move to level by the rows of the thing pressed; Copy and
// Paste of a block of two boxes and an object onto another level, on the ground with a block and
// without, the cells they land on, their new group, a section kept and one dropped, and pasted
// again; Ctrl+C and Ctrl+V, and from a text field nothing; and the words of several. Then, in a
// process of its own, the side view: Select all in the slice, and Paste along the paper alone.
// No browser, and no site but the made-up one. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/selected-several.check.js
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { ALL, ALONE, BLOCK, CHAIR, LEVEL, PERSON, PX, UPPER, VIEW } from './check-right-menu.js';
import { begin, chosen, document, done, listeners, page, panel, text } from './check-right-menu.js';
import { things } from './check-right-menu.js';

const { sketch, categories, rightMenu, footer, structuredClone } = globalThis;
const canvas = page.paper;
const named = (list) => list.map(({ name }) => name);
const by = (list, name) => list.find((entry) => entry.name === name);
const act = (entry) => entry.act();
/** A key pressed on a part, with what is held beside it, heard by every listener of the document until one ends it. */
const keyDown = (key, target = document.body, held = {}) => {
  const event = { key, target, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false };
  Object.assign(event, held, { stopped: false, preventDefault() {} });
  event.stopImmediatePropagation = () => void (event.stopped = true);
  for (const hear of listeners.keydown) if (!event.stopped) hear(event);
};
const ctrl = { ctrlKey: true };
/** A right press on the paper at a place in cells: the names of the entries of the menu it opened. */
const pressed = ([x, y]) => {
  canvas.hears.pointerdown({ button: 2, clientX: x * PX, clientY: y * PX });
  const names = panel.children
    .filter((one) => one.tagName === 'BUTTON')
    .map((one) => one.textContent);
  keyDown('Escape');
  return names;
};
/** What changes nothing: no step, and the sketch to the byte. */
function none(act) {
  const [before, steps] = [text(), sketch.past.length];
  act();
  assert.deepEqual([text(), sketch.past.length], [before, steps]);
}
const SECTIONS = [
  { id: 1, name: 'House' },
  { id: 2, name: 'Garage' },
];

if (VIEW === 'side') {
  // IN A SLICE, along the plot through row 15 of the top view: the block of two and the box alone
  // lie in it. Select all in this slice takes the block once and the box.
  begin({ on: { side: 15 } });
  assert.deepEqual(named(rightMenu.blank([90, 5])), ['Select all in this slice']);
  act(by(rightMenu.blank([90, 5]), 'Select all in this slice'));
  assert.deepEqual(chosen.picked, [things()[0], things()[2]]);
  // Copied and pasted with the middle of the block - column 20 - on column 70: along the paper
  // alone, by 50 columns; its heights and its place across the plot kept; a group of its own.
  sketch.copy([things()[1]]);
  const pasted = done(() => act(by(rightMenu.blank([70.6, 3.2]), 'Paste'))).slice(ALL.length);
  assert.deepEqual(
    pasted,
    BLOCK.map((box) => ({ ...box, x: box.x.map((at) => at + 50), group: 2 })),
  );
  assert.deepEqual(chosen.picked, [things()[ALL.length]]);
  // On column 340.6, far past the paper's end - it has none (ST-042): 320 columns on, as far.
  const beyond = done(() => sketch.paste([340.6, 3.2])).slice(ALL.length + 2);
  const on = (box) => ({ ...box, x: box.x.map((at) => at + 320), group: 3 });
  assert.deepEqual(beyond, BLOCK.map(on));
  process.stdout.write('side view: Select all in the slice; Paste along the paper alone\n');
  process.exit(0);
}

// NOTHING COPIED, AND FROM A TEXT FIELD NOTHING: Ctrl+C typed into a field copies nothing, and
// the empty paper's menu offers Select all on this level alone.
const FIELD = { tagName: 'INPUT', type: 'text' };
begin();
chosen.picked = [things()[4]];
keyDown('c', FIELD, ctrl);
assert.equal(sketch.copied(), false, 'Ctrl+C from a text field');
assert.deepEqual(pressed([90, 60]), ['Select all on this level']);

// SELECT ALL on the level drawn on, row 40: the block of two once, by its first box, the box
// alone and the person - not the box of the level above, nor the chair on the ground.
act(by(rightMenu.blank([90, 60]), 'Select all on this level'));
assert.deepEqual(chosen.picked, [things()[0], things()[2], things()[4]]);
// What a hidden section holds is not taken: the box alone, in the hidden section House.
const HIDDEN = [{ id: 1, name: 'House', hidden: true }];
const all = structuredClone(ALL);
all[2].section = 1;
begin({ things: all, sections: HIDDEN });
act(by(rightMenu.blank([90, 60]), 'Select all on this level'));
assert.deepEqual(chosen.picked, [things()[0], things()[4]]);

// THE MENU OF SEVERAL: a block and an object - Turn, Section and Category all; of two blocks no
// Turn, of two objects neither Section nor Category.
begin();
const SEVERAL = [
  'Delete',
  'Copy',
  'Duplicate',
  'Turn',
  'Section ▸',
  'Category ▸',
  'Move to level ▸',
];
assert.deepEqual(named(rightMenu.entries([things()[0], things()[4]], [12, 12])), SEVERAL);
const BLOCKS = SEVERAL.filter((name) => name !== 'Turn');
assert.deepEqual(named(rightMenu.entries([things()[0], things()[2]], [12, 12])), BLOCKS);
const OBJECTS = ['Delete', 'Copy', 'Duplicate', 'Turn', 'Move to level ▸'];
assert.deepEqual(named(rightMenu.entries([things()[4], things()[5]], [15, 30])), OBJECTS);
// A right press on one of several - the second box of a block of which the first is selected -
// opens the menu of all of them, and they stay selected; on a thing among none, that one alone.
chosen.picked = [things()[0], things()[4]];
assert.deepEqual(pressed([25, 15]), SEVERAL);
assert.deepEqual(chosen.picked, [things()[0], things()[4]]);
assert.deepEqual(pressed([45, 15]), BLOCKS);
assert.deepEqual(chosen.picked, [things()[2]]);

// EACH PICK OF SEVERAL, ONE STEP. Delete: the block whole, the box alone and the person.
begin();
const three = () => [things()[0], things()[2], things()[4]];
chosen.picked = three();
assert.deepEqual(
  done(() => act(by(rightMenu.entries(three(), [12, 12]), 'Delete'))),
  [UPPER, CHAIR],
);
assert.deepEqual(chosen.picked, []);
// Delete, the key: the same, one step.
begin();
chosen.picked = three();
assert.deepEqual(
  done(() => keyDown('Delete')),
  [UPPER, CHAIR],
);
// Duplicate: each one cell right - the block in a group of its own - and the copies selected.
begin();
const right = (one) => ({
  ...one,
  x: Array.isArray(one.x) ? one.x.map((at) => at + 1) : one.x + 1,
});
const twins = done(() => act(by(rightMenu.entries(three(), [12, 12]), 'Duplicate'))).slice(6);
assert.deepEqual(twins, [
  ...BLOCK.map((box) => ({ ...right(box), group: 2 })),
  right(ALONE),
  right(PERSON),
]);
assert.deepEqual(chosen.picked, [things()[6], things()[8], things()[9]]);
// Turn: each object a quarter on, and no box.
begin();
const turned = done(() =>
  act(by(rightMenu.entries([things()[2], things()[4], things()[5]], [45, 15]), 'Turn')),
);
assert.deepEqual(turned.slice(2), [ALONE, UPPER, { ...PERSON, turn: 1 }, { ...CHAIR, turn: 1 }]);
// Section: the two blocks into Garage; none marked before, for they are in none - "In no section"
// is - and Garage after.
begin({ sections: SECTIONS });
const blocks = () => [things()[0], things()[2]];
const sectionOf = () => by(rightMenu.entries(blocks(), [12, 12]), 'Section ▸').list;
const marked = (list) => list.flatMap((entry) => (entry.marked ? [entry.name] : []));
assert.deepEqual(marked(sectionOf()), ['In no section']);
const garage = done(() => act(by(sectionOf(), 'Garage')));
assert.deepEqual(
  garage.slice(0, 3),
  [...BLOCK, ALONE].map((box) => ({ ...box, section: 2 })),
);
assert.deepEqual(marked(sectionOf()), ['Garage']);
// Category: a row of the list on every box of both blocks, one step; marked then.
begin();
const FIRST = categories.LIST[0];
const categoryOf = () => by(rightMenu.entries(blocks(), [12, 12]), 'Category ▸').list;
const kitchen = done(() => act(by(categoryOf(), FIRST.name)));
assert.deepEqual(
  kitchen.slice(0, 3),
  [...BLOCK, ALONE].map((box) => ({ ...box, category: FIRST.key })),
);
assert.deepEqual(marked(categoryOf()), [FIRST.name]);
// Move to level: by the rows between the level of the thing pressed and the one picked, every
// thing by as many - the box alone, on row 40, and the box of the level above, on row 30, pressed
// on the box alone and carried to row 30: ten rows up each, so they keep their heights.
begin();
const LEVELS = [30, LEVEL].map((key) => sketch.nameOf('top', key));
const pair = () => [things()[2], things()[3]];
const levelOf = (pressed) =>
  by(rightMenu.entries(pair(), [45, 15], pressed), 'Move to level ▸').list;
assert.deepEqual(marked(levelOf(things()[2])), [LEVELS[1]]);
const up = done(() => act(by(levelOf(things()[2]), LEVELS[0])));
assert.deepEqual(up.slice(2, 4), [
  { ...ALONE, z: [26, 30] },
  { ...UPPER, z: [10, 20] },
]);
// Pressed on the box above, the level it stands on is marked.
begin();
assert.deepEqual(marked(levelOf(things()[3])), [LEVELS[0]]);
// On where a block goes off the plot's paper - the paper has no edge (ST-042): a box with its
// top in row 5, carried ten rows up with the box alone, to row -5.
const TALL = { x: [0, 4], y: [0, 4], z: [5, LEVEL], colour: 4 };
begin({ things: [...structuredClone(ALL), TALL] });
const tall = by(rightMenu.entries([things()[2], things()[6]], [45, 15]), 'Move to level ▸').list;
assert.deepEqual(
  tall.map(({ off, why }) => (off ? why : '')),
  ['', 'It stands there already'],
);
const offPaper = done(() => act(by(tall, LEVELS[0])));
assert.deepEqual(offPaper[2], { ...ALONE, z: [26, 30] });
assert.deepEqual(offPaper[6], { ...TALL, z: [-5, 30] });

// COPY AND PASTE from above: the block of two and the person, copied on row 40 - no step - and
// pasted on the level of row 30 with the middle of them all - column 20, row 20 of the top view's
// paper, the block from 10 to 30 and 10 to 20, the person's cell 30 - on the cell of [70.4, 50.7]:
// 50 columns and 30 rows on, and ten rows up the side view's paper, in a group of their own.
begin();
none(() => assert.equal(sketch.copy([things()[1], things()[4]]), true));
sketch.doc.on.top = 30;
assert.deepEqual(named(rightMenu.blank([70, 50])), ['Paste', 'Select all on this level']);
const UP_TEN = (box, group) => ({
  ...box,
  x: box.x.map((at) => at + 50),
  y: [40, 50],
  z: [box.z[0] - 10, 30],
  group,
});
const COPIED = (group) => [
  ...BLOCK.map((box) => UP_TEN(box, group)),
  { ...PERSON, x: 65.5, y: 60.5, floor: 30 },
];
const once = done(() => act(by(rightMenu.blank([70.4, 50.7]), 'Paste')));
assert.deepEqual(once.slice(ALL.length), COPIED(2));
assert.deepEqual(chosen.picked, [things()[6], things()[8]]);
// Pasted again: once more, in a group of its own.
const twice = done(() => act(by(rightMenu.blank([70.4, 50.7]), 'Paste')));
assert.deepEqual(twice.slice(ALL.length + 3), COPIED(3));
// Far past the plot's paper, 300 columns and 270 rows on - it has no edge (ST-042): as far.
const plus = (at, by) => (Array.isArray(at) ? at.map((one) => one + by) : at + by);
const farther = done(() => sketch.paste([370.4, 320.7])).slice(ALL.length + 6);
const far = (t) => ({ ...t, x: plus(t.x, 300), y: plus(t.y, 270) });
assert.deepEqual(farther, COPIED(4).map(far));
// On the ground: off with a block among them, and why - nothing pasted; without one, the person
// on the ground.
sketch.doc.on.top = 'ground';
const PASTE = by(rightMenu.blank([70, 50]), 'Paste');
assert.deepEqual([PASTE.off, PASTE.why], [true, 'A block stands on a level, not on the ground']);
none(() => assert.deepEqual(sketch.paste([70, 50]), []));
sketch.copy([things()[4]]);
const grounded = done(() => act(by(rightMenu.blank([80.5, 20.5]), 'Paste'))).at(-1);
assert.deepEqual(grounded, { ...PERSON, x: 80.5, y: 20.5, floor: 'ground' });
// A section the sketch still has is kept, one it no longer has is dropped: the block in Garage,
// the box alone in House - and House taken away before the paste.
const sectioned = structuredClone(ALL);
for (const [index, section] of [
  [0, 2],
  [1, 2],
  [2, 1],
])
  sectioned[index].section = section;
begin({ things: sectioned, sections: SECTIONS });
sketch.copy([things()[0], things()[2]]);
sketch.doc.sections = [SECTIONS[1]];
const kept = done(() => sketch.paste([70, 50])).slice(ALL.length);
assert.deepEqual(
  kept.map((box) => box.section),
  [2, 2, undefined],
);

// CTRL+C AND CTRL+V: the person copied, the pointer on the paper at [80.2, 20.6]: pasted there,
// one step. From a text field, and once the pointer has left the paper, nothing.
begin();
chosen.picked = [things()[4]];
keyDown('c', document.body, ctrl);
canvas.hears.pointermove({ clientX: 80.2 * PX, clientY: 20.6 * PX });
none(() => keyDown('v', FIELD, ctrl));
const keyed = done(() => keyDown('v', document.body, ctrl)).at(-1);
assert.deepEqual(keyed, { ...PERSON, x: 80.5, y: 20.5 });
canvas.hears.pointerleave();
none(() => keyDown('v', document.body, ctrl));

// THE WORDS OF SEVERAL, right of the paper; of one or none, none of these.
assert.equal(
  footer.several(three()),
  '3 things selected: Delete erases them, and the right button acts on all of them.',
);
assert.deepEqual([footer.several([things()[0]]), footer.several([])], ['', '']);

// THE SIDE VIEW, in a process of its own: a page loads its scripts once.
const side = spawnSync(process.execPath, [import.meta.filename], {
  env: { ...process.env, SKETCH_VIEW: 'side' },
  stdio: 'inherit',
});
assert.equal(side.status, 0, 'the side view');

process.stdout.write(
  'tools/sketch: several selected - Select all, Delete, each pick of the menu one step - and Copy and Paste from above and in a slice, with groups of their own and no section the sketch has not; nothing from a text field\n',
);
