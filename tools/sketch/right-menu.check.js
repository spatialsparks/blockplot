// The check of the right button's menu (T-037.5, right-menu.js): its entries and what each does,
// on the made-up page of check-right-menu.js. The entries of a box, of an object and of a block
// where the sketch has no sections, in their order - which are off, and why; the levels, and a
// block carried off the plot's paper; the categories under the words of the list beside the paper;
// each pick doing its one step, which Undo takes back - Delete, Turn, Move to level, Category,
// Section - and Duplicate laying its copy one cell right and selecting it; and `placed` at the
// four corners of a window of 1280 by 800 and in its middle. right-menu-keys.check.js holds the
// press, the keys and the shutting. No browser, and no site but the made-up one. Run by
// tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/right-menu.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { ALL, ALONE, BLOCK, CHAIR, LEVEL, PERSON, SIZE, UPPER } from './check-right-menu.js';
import { begin, chosen, done, panel, things } from './check-right-menu.js';

const { sketch, categories, rightMenu, structuredClone } = globalThis;
// THE MENU, as the script made it: one part in the body, hidden, of the look of a menu.
assert.deepEqual(
  [panel.className, panel.said.role, panel.hidden],
  ['menu right-menu', 'menu', true],
);

const named = (list) => list.map(({ name, word }) => name ?? `[${word}]`);
const offs = (list) => list.flatMap(({ name, off, why }) => (off ? [`${name}: ${why}`] : []));
const by = (list, name) => list.find((entry) => entry.name === name);
const LEVELS = [30, LEVEL].map((key) => sketch.nameOf('top', key));
begin();
assert.deepEqual(sketch.levels(), [30, LEVEL]);

// THE ENTRIES OF A BOX where the sketch has no sections: Delete, Copy, Duplicate, Section - off, and
// why - Category and Move to level; no Turn. Its levels, and not the ground: the one it stands on
// marked and off.
const ofBox = rightMenu.entries([things()[0]], [12, 12]);
const STANDS = 'It stands there already';
assert.deepEqual(named(ofBox), [
  'Delete',
  'Copy',
  'Duplicate',
  'Section ▸',
  'Category ▸',
  'Move to level ▸',
]);
assert.deepEqual(offs(ofBox), ['Section ▸: The sketch has no sections']);
const boxLevels = by(ofBox, 'Move to level ▸').list;
assert.deepEqual(named(boxLevels), LEVELS);
assert.deepEqual(offs(boxLevels), [`${LEVELS[1]}: ${STANDS}`]);
assert.deepEqual(
  boxLevels.map((entry) => entry.marked),
  [false, true],
);
// Its categories: "By its name", marked, then the words of the groups of the list beside the
// paper, each over its rows of the pad's one list, in that list's order.
const ofCategory = by(ofBox, 'Category ▸').list;
const GROUPS = { room: 'A room', open: 'Open air', glass: 'Glass', ground: 'Ground', cut: 'A cut' };
const ROWS = categories.LIST.flatMap((row, index, all) => [
  ...(all[index - 1]?.as === row.as ? [] : [`[${GROUPS[row.as]}]`]),
  row.name,
]);
const markedOf = (list) => list.flatMap((entry) => (entry.marked ? [entry.name] : []));
assert.deepEqual(named(ofCategory), ['By its name', ...ROWS]);
assert.deepEqual(markedOf(ofCategory), ['By its name']);
// THE ENTRIES OF AN OBJECT: Delete, Copy, Duplicate, Turn and Move to level, with the ground; none off
// but its own level.
const ofPerson = rightMenu.entries([things()[4]], [15, 30]);
assert.deepEqual(named(ofPerson), ['Delete', 'Copy', 'Duplicate', 'Turn', 'Move to level ▸']);
const personLevels = by(ofPerson, 'Move to level ▸').list;
assert.deepEqual(named(personLevels), [...LEVELS, 'Ground']);
assert.deepEqual(offs(personLevels), [`${LEVELS[1]}: ${STANDS}`]);
// A block that a level takes off the plot's paper: a box on row 40 with its top in row 5 has it
// in row -5 on row 30. The paper has no edge (ST-042): that level is on, and takes it there.
const TALL = { x: [0, 4], y: [0, 4], z: [5, LEVEL], colour: 4 };
begin({ things: [...structuredClone(ALL), TALL] });
const tallTo = by(rightMenu.entries([things()[6]], [1, 1]), 'Move to level ▸').list;
assert.deepEqual(offs(tallTo), [`${LEVELS[1]}: ${STANDS}`]);
assert.deepEqual(done(() => by(tallTo, LEVELS[0]).act())[6], { ...TALL, z: [-5, 30] });

// EACH PICK, one step. Delete: of a box, its whole block; of an object, the object - and then
// nothing is selected.
const act = (entry) => entry.act();
const pickOf = (list, ...names) =>
  names.reduce((entries, name) => by(entries, name).list ?? by(entries, name), list);
begin();
chosen.picked = [things()[1]];
assert.deepEqual(
  done(() => act(pickOf(rightMenu.entries([things()[1]], [22, 12]), 'Delete'))),
  [ALONE, UPPER, PERSON, CHAIR],
);
assert.deepEqual(chosen.picked, []);
begin();
assert.deepEqual(
  done(() => act(pickOf(rightMenu.entries([things()[4]], [15, 30]), 'Delete'))),
  [...BLOCK, ALONE, UPPER, CHAIR],
);
// Turn: a quarter, as R. Move to level: the person to the ground; the block of two up to row
// 30, every box by ten rows.
begin();
assert.deepEqual(done(() => act(pickOf(rightMenu.entries([things()[4]], [15, 30]), 'Turn')))[4], {
  ...PERSON,
  turn: 1,
});
begin();
const toGround = pickOf(rightMenu.entries([things()[4]], [15, 30]), 'Move to level ▸', 'Ground');
assert.deepEqual(done(() => act(toGround))[4], { ...PERSON, floor: 'ground' });
begin();
const up = pickOf(rightMenu.entries([things()[0]], [12, 12]), 'Move to level ▸', LEVELS[0]);
assert.deepEqual(done(() => act(up)).slice(0, 2), [
  { ...BLOCK[0], z: [20, 30] },
  { ...BLOCK[1], z: [24, 30] },
]);
// Category: a row of the list, on every box of the block, and marked then; "By its name" back.
begin();
const FIRST = categories.LIST[0];
const picks = (name) => pickOf(rightMenu.entries([things()[0]], [12, 12]), 'Category ▸', name);
const kitchen = done(() => act(picks(FIRST.name)));
assert.deepEqual(
  kitchen.slice(0, 2),
  BLOCK.map((box) => ({ ...box, category: FIRST.key })),
);
assert.deepEqual(markedOf(by(rightMenu.entries([things()[0]], [12, 12]), 'Category ▸').list), [
  FIRST.name,
]);
assert.deepEqual(done(() => act(picks('By its name'))).slice(0, 2), BLOCK);
// Section, where the sketch has two: both by name, then "In no section", which is marked; a pick
// puts the block in it, and marks it.
const SECTIONS = [
  { id: 1, name: 'House' },
  { id: 2, name: 'Garage' },
];
begin({ sections: SECTIONS });
const inSections = () => by(rightMenu.entries([things()[1]], [22, 12]), 'Section ▸');
assert.deepEqual(
  [named(inSections().list), markedOf(inSections().list), offs([inSections()])],
  [['House', 'Garage', 'In no section'], ['In no section'], []],
);
const garage = done(() => act(by(inSections().list, 'Garage')));
assert.deepEqual(
  garage.slice(0, 2),
  BLOCK.map((box) => ({ ...box, section: 2 })),
);
assert.deepEqual(markedOf(inSections().list), ['Garage']);
// DUPLICATE: a copy one cell right of the thing, as a drag with Ctrl lays one - the person, and
// the block of two whole, in a group of its own - and the copy is selected.
begin();
const [person] = done(() =>
  act(pickOf(rightMenu.entries([things()[4]], [15.4, 30.2]), 'Duplicate')),
).slice(6);
assert.deepEqual([person, chosen.picked], [{ ...PERSON, x: PERSON.x + 1 }, [things()[6]]]);
begin();
const copies = done(() => act(pickOf(rightMenu.entries([things()[0]], [12, 12]), 'Duplicate')));
assert.deepEqual(
  copies.slice(6),
  BLOCK.map((box) => ({ ...box, x: box.x.map((at) => at + 1), group: 2 })),
);
assert.deepEqual(chosen.picked, [things()[6]]);

// PLACED: where a menu of 200 by 300 pixels opens, pressed at the four corners of a window of
// 1280 by 800, and in its middle: inward, whole. One taller than the window lies at its top.
const WINDOW = [1280, 800];
const PLACES = [
  [
    [0, 0],
    [0, 0],
  ],
  [
    [1279, 0],
    [1079, 0],
  ],
  [
    [0, 799],
    [0, 499],
  ],
  [
    [1279, 799],
    [1079, 499],
  ],
  [
    [640, 400],
    [640, 400],
  ],
  [
    [1080, 500],
    [1080, 500],
  ],
  [
    [1081, 501],
    [881, 201],
  ],
];
for (const [at, to] of PLACES) assert.deepEqual(rightMenu.placed(at, SIZE, WINDOW), to, String(at));
assert.deepEqual(rightMenu.placed([100, 50], [200, 900], WINDOW), [100, 0]);
assert.deepEqual(rightMenu.placed([150, 50], [200, 300], [300, 800]), [0, 50]);

process.stdout.write(
  "tools/sketch: the right button's menu has the entries of what it is pressed on, in their order, off with why, each pick one step, and opens inward and whole\n",
);
