// The check of the right press, the keys that erase and the shutting of the right button's menu
// (T-037.5, right-menu.js, and `views.popup` of views.js), on the made-up page of
// check-right-menu.js. A right press on a thing selects it and opens its menu there, the first
// entry with the focus; with the left button nothing opens. Delete and
// Backspace erase what is selected, whole, as one step - and nothing with nothing selected, with
// Ctrl held, from a text field, or while a menu is open. A menu with no button: open, every key
// is its own; shut by Escape - the focus back where it was - by a pointer down outside it and not
// inside, by a pick and by the File menu opening; an entry that opens a list shuts nothing, and
// its list stands beside the menu, to the left near the window's right edge. right-menu.check.js
// holds the entries. No browser, and no site but the made-up one. Run by tools/sketch/check.js,
// or alone:
//   pnpm exec node tools/sketch/right-menu-keys.check.js
import assert from 'node:assert/strict';
import process from 'node:process';
import { ALL, ALONE, BLOCK, CHAIR, PERSON, PX, UPPER, begin, chosen } from './check-right-menu.js';
import { did, document, done, listeners, page, panel, part, text } from './check-right-menu.js';
import { things } from './check-right-menu.js';

const { sketch, categories, rightMenu, views } = globalThis;
const isOpen = () => !panel.hidden;
const canvas = page.paper;
/** A press on the paper, at a place in cells, by a button: whether the press was kept from its default. */
const pressed = (button, [x, y]) => {
  const event = { button, clientX: x * PX, clientY: y * PX, prevented: false };
  event.preventDefault = () => void (event.prevented = true);
  canvas.hears.pointerdown(event);
  canvas.hears.mousedown(event);
  return event.prevented;
};
/** A key pressed on a part, with what is held beside it, heard by every listener of the document until one ends it. */
const keyDown = (key, target = document.body, held = {}) => {
  const event = { key, target, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false };
  Object.assign(event, held, { stopped: false, preventDefault() {} });
  event.stopImmediatePropagation = () => void (event.stopped = true);
  for (const hear of listeners.keydown) if (!event.stopped) hear(event);
};

// A RIGHT PRESS on the box alone: it is selected and the menu opens there, its first entry with
// the focus - and the press gives the focus to nothing else.
begin();
did.length = 0;
assert.equal(pressed(2, [45, 15]), true);
assert.deepEqual([chosen.picked, isOpen(), did.splice(0)], [[things()[2]], true, ['Delete']]);
assert.deepEqual([panel.style.left, panel.style.top], ['450px', '150px']);
assert.equal(views.typing({ target: document.body }), true, "open, every key is the menu's");
// A key while it is open: Delete erases nothing. ESCAPE shuts it, the focus where it was.
const before = text();
keyDown('Delete');
assert.deepEqual([text(), isOpen()], [before, true]);
keyDown('Escape');
assert.deepEqual([isOpen(), document.activeElement], [false, document.body]);
assert.equal(views.typing({ target: document.body }), false, "shut, a key is the page's again");
// On the empty paper the empty paper's menu opens (T-037.6), and nothing is selected; with the
// left button on a thing, nothing opens and nothing is selected.
chosen.picked = [];
pressed(2, [90, 60]);
assert.deepEqual([isOpen(), chosen.picked], [true, []]);
keyDown('Escape');
pressed(0, [45, 15]);
assert.deepEqual([isOpen(), chosen.picked], [false, []]);

// THE KEYS. Delete erases what is selected, whole, as one step; so does Backspace; and then
// nothing is selected. With nothing selected, with Ctrl held, or typed into a field, nothing.
begin();
chosen.picked = [things()[4]];
assert.deepEqual(
  done(() => keyDown('Delete')),
  [...BLOCK, ALONE, UPPER, CHAIR],
);
assert.deepEqual(chosen.picked, []);
begin();
chosen.picked = [things()[0]];
assert.deepEqual(
  done(() => keyDown('Backspace')),
  [ALONE, UPPER, PERSON, CHAIR],
);
const FIELD = { tagName: 'INPUT', type: 'text' };
for (const [key, target, held, selected] of [
  ['Delete', document.body, {}, []],
  ['Delete', document.body, { ctrlKey: true }, [0]],
  ['Backspace', document.body, { ctrlKey: true }, [0]],
  ['Delete', FIELD, {}, [0]],
  ['Backspace', FIELD, {}, [0]],
]) {
  begin();
  chosen.picked = selected.map((index) => things()[index]);
  keyDown(key, target, held);
  assert.deepEqual(
    [things().length, sketch.past.length],
    [ALL.length, 0],
    `${key} ${target.tagName}`,
  );
}

// A MENU WITH NO BUTTON, opened from a control that had the focus: a pointer down inside it
// leaves it open, and one outside shuts it; Escape shuts it, the focus back on that control.
begin();
const zoom = part('button');
const reopen = (place) => {
  zoom.focus();
  rightMenu.openAt([things()[0]], [12, 12], place);
  assert.deepEqual([isOpen(), document.activeElement.textContent], [true, 'Delete']);
};
const [hearDown] = listeners.pointerdown;
reopen([1200, 100]);
hearDown({ target: panel.children[1] });
assert.equal(isOpen(), true, 'a pointer down inside');
hearDown({ target: canvas });
assert.equal(isOpen(), false, 'a pointer down outside');
reopen([1200, 100]);
keyDown('Escape');
assert.deepEqual([isOpen(), document.activeElement], [false, zoom]);
// Near the window's right edge it opens to the left of the place; an entry that opens a list
// shuts nothing, and its list stands to the left of the menu, its first entry with the focus.
reopen([1200, 100]);
assert.deepEqual([panel.style.left, panel.style.top], ['1000px', '100px']);
const category = panel.children.find((one) => one.textContent === 'Category ▸');
category.hears.click();
panel.hears.click({ target: category });
const list = panel.children.at(-1);
assert.deepEqual([isOpen(), list.hidden, list.className], [true, false, 'menu right-list']);
assert.deepEqual([list.style.left, document.activeElement.textContent], ['800px', 'By its name']);
// A pick in the list acts, as one step, and shuts the menu.
const FIRST = categories.LIST[0];
const row = list.children.find((one) => one.textContent === FIRST.name);
done(() => row.hears.click());
panel.hears.click({ target: row });
assert.equal(isOpen(), false, 'a pick');
// Opened at the window's left, the list of an entry stands right of the menu.
reopen([10, 10]);
panel.children.find((one) => one.textContent === 'Move to level ▸').hears.click();
assert.equal(panel.children.at(-1).style.left, '210px');
// The File menu, opening, shuts it.
const fileButton = part('button');
const filePanel = part('div');
filePanel.append(Object.assign(part('button'), { textContent: 'Open file' }));
views.menu(fileButton, filePanel);
fileButton.hears.click();
assert.deepEqual([isOpen(), filePanel.hidden], [false, false]);

process.stdout.write(
  'tools/sketch: a right press on a thing selects it and opens its menu there, which shuts as a menu does; Delete and Backspace erase what is selected, and no key does while a field or a menu has it\n',
);
