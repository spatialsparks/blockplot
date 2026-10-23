// The check of the keys of the 3D page's controls, on a made-up page with made-up keys: Page Up
// and Page Down step a level, up and down the list, and are then kept from the browser; typed
// into a field - as the pad's rule for a key says it, which the page hands over - they are the
// field's, step nothing and are left to the browser; so they are with Ctrl, Alt or the command
// key; and no other key steps. And of what a way may have no use for: the entry of File that
// saves the house asks for a file when it is clicked, and is off, with the line under it that
// says why, where the way shows no part of a house; the switch of the shadows is marked as
// away where the way has no sun. The entry of the picture asks for a picture when it is
// clicked, once, and no key does; no way marks it or turns it off. The entry of the Google Earth
// file asks for one at a click, once, and is off, with its line, where the plot says no place;
// what is typed as the raise is handed on as typed, and a kept raise put in. File itself, which
// the page marks as away until there is a stage, has that mark taken off as the controls open -
// and the buttons of Settings and of Full screen show from then on. A level's row has its switch after its button,
// "All" none, marked by what is off, and turned it asks once (story ST-033). `stood` marks the
// stand it is told as chosen and no other, `null` none, and a second moves the mark. What the controls
// show and what a click asks else, a browser test holds (tests/e2e/sketch-3d-controls.spec.ts).
// No browser, and nothing of the pad: the rule for a key is made up here. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { openPanel } from './panel.js';

// A made-up page: a place for every name that is asked for, which takes what it is given, notes
// who listens for what on it and what it is marked with, and a document that notes the same.
const places = new Map();
const place = () => {
  const [heard, marks] = [{}, new Set()];
  const toggle = (mark, on) => (on ? marks.add(mark) : marks.delete(mark));
  return {
    hidden: true,
    dataset: {},
    heard,
    marks,
    children: [],
    classList: { toggle },
    append(...more) {
      this.children.push(...more);
    },
    replaceChildren(...more) {
      this.children = more;
    },
    // Of what it holds, the buttons: a level's row is an item, which holds its own.
    querySelectorAll() {
      return this.children.filter(({ type }) => type === 'button');
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    addEventListener: (type, hear) => (heard[type] = hear),
  };
};
const heard = [];
globalThis.document = {
  createElement: place,
  getElementById: (id) => places.get(id) ?? places.set(id, place()).get(id),
  addEventListener: (type, hear) => heard.push({ type, hear }),
};
// File as 3d.html has it until there is a stage: marked as away, so not seen, and in its place.
const file = globalThis.document.getElementById('file-group');
file.marks.add('away');
// The pad's rule, made up: a key is typed into a field where what it was pressed on says so.
const typing = ({ target }) => target.field === true;
const [steps, saves, pictures, earths, raises, levels] = [[], [], [], [], [], []];
const asked = { save: () => saves.push('asked'), picture: () => pictures.push('asked') };
Object.assign(asked, { earth: () => earths.push('asked'), raise: (text) => raises.push(text) });
asked.level = (level, on) => levels.push([level, on]);
const stands = ['front', 'back', 'left', 'right', 'above'].map((stand) => ({ stand, name: stand }));
const shows = openPanel(
  { ways: [], stands, levelName: String, sun: 'a made-up sun', typing },
  { step: (by) => steps.push(by), ...asked },
);
// The controls show once they are opened: there is a stage for them to work on. So does the
// group of the toolbar that holds nothing but such controls, With: until then it is hidden, and
// its word with it - and so do the two buttons of the toolbar in no group, Settings and Full
// screen. And File is seen: the mark is off it.
for (const id of 'ways stands with ground-row shadows-row settings-open full-screen side'.split(
  ' ',
)) {
  assert.equal(places.get(id).hidden, false, id);
}
assert.deepEqual([...file.marks], []);
assert.deepEqual(
  heard.map(({ type }) => type),
  ['keydown'],
);
const [{ hear }] = heard;

/** A key pressed on the page, or as `more` says: the steps the page took, and whether it kept the key from the browser. */
function pressed(key, more = {}) {
  let kept = false;
  steps.length = 0;
  hear({ key, target: {}, preventDefault: () => (kept = true), ...more });
  return [[...steps], kept];
}
// Page Down is a step down the list and Page Up a step up it, however the browser writes the
// key: the page takes the key, and the browser scrolls nothing with it.
assert.deepEqual(pressed('PageDown'), [[1], true]);
assert.deepEqual(pressed('PageUp'), [[-1], true]);
assert.deepEqual(pressed('pagedown'), [[1], true]);
// Pressed on a button or on a switch, they still step: neither is a field.
assert.deepEqual(pressed('PageDown', { target: { field: false } }), [[1], true]);
// Typed into a field, each is the field's: no level is stepped, and the key is left to the
// browser, which does with it what it does in a field.
const field = { target: { field: true } };
assert.deepEqual(pressed('PageDown', field), [[], false]);
assert.deepEqual(pressed('PageUp', field), [[], false]);
// With Ctrl, Alt or the command key a key is the browser's.
for (const held of ['ctrlKey', 'altKey', 'metaKey']) {
  assert.deepEqual(pressed('PageDown', { [held]: true }), [[], false], held);
}
// No other key steps a level - a figure, a letter, an arrow - and a key that has no name neither.
for (const key of ['2', 'v', 'ArrowDown', 'Enter', 'End', undefined]) {
  assert.deepEqual(pressed(key), [[], false], String(key));
}
// And no key asks for a file, or for a picture: a click on its entry does, once a click - on
// the entry of the picture for a picture and no file, on the entry of the file the other way
// round.
assert.deepEqual([saves, pictures], [[], []]);
places.get('picture').heard.click();
assert.deepEqual([saves, pictures], [[], ['asked']]);
const save = places.get('save');
save.heard.click();
assert.deepEqual([saves, pictures], [['asked'], ['asked']]);
// The entry says of itself what it saves, to a pointer that rests on it: a file, in metres.
assert.match(save.title, /one file/);
assert.match(save.title, /in metres/);

// What a way has no use for. The switch of the shadows is marked as away where the way has no
// sun to cast them, and keeps its place in the page. The entry of the file is off where the way
// does not show the house as its parts, and the line under it, which says why, shows; where it
// does, the entry is on and the line hidden. Each by its own word of the way, whatever the
// other says - and the entry is never marked: it stands in a menu, and takes no place.
const marked = (sunlit, built) => {
  shows({ cuts: [], cut: 'all', ground: true, way: 'made-up', shadows: true, sunlit, built });
  const [shadows, why] = ['shadows-row', 'save-why'].map((id) => places.get(id));
  return [[...shadows.marks], [...save.marks], save.disabled, why.hidden];
};
assert.deepEqual(marked(false, false), [['away'], [], true, false]);
assert.deepEqual(marked(true, true), [[], [], false, true]);
assert.deepEqual(marked(true, false), [[], [], true, false]);
assert.deepEqual(marked(false, true), [['away'], [], false, true]);
// Marked or not, the switch is a place of the page that shows: nothing hides it but the mark.
// And File stays seen, in whichever way.
assert.deepEqual([places.get('shadows-row').hidden, [...file.marks]], [false, []]);
// The entry of the picture is no way's to turn off or to mark: it is to be had in every way.
const picture = places.get('picture');
assert.deepEqual([picture.disabled, [...picture.marks]], [undefined, []]);

// The Google Earth file (ST-016). Its entry asks for one at a click, once, and nothing else
// does. It is off where the plot says no place, and the line under it, which says why, shows;
// where the plot says one, it is on and the line hidden - in whichever way, built or not.
const [earth, earthWhy, raised] = ['earth', 'earth-why', 'earth-raise'].map((id) => places.get(id));
assert.deepEqual([earths, saves, pictures], [[], ['asked'], ['asked']]);
earth.heard.click();
assert.deepEqual([earths, saves, pictures], [['asked'], ['asked'], ['asked']]);
const placedAs = (placed, built) => {
  shows({ cuts: [], cut: 'all', ground: true, way: 'made-up', shadows: true, built, placed });
  return [earth.disabled, earthWhy.hidden, [...earth.marks]];
};
assert.deepEqual(placedAs(false, true), [true, false, []]);
assert.deepEqual(placedAs(true, false), [false, true, []]);
assert.deepEqual(placedAs(true, true), [false, true, []]);
assert.deepEqual(placedAs(undefined, false), [true, false, []]);
// What is typed into the field of the raise is handed on as it is typed, at each input - a sign,
// a comma, a word, nothing - and decides nothing here. A kept raise is put into the field.
for (const text of ['-2,5', 'x', '']) {
  raised.value = text;
  raised.heard.input();
}
assert.deepEqual(raises, ['-2,5', 'x', '']);
shows.raised('2.5');
assert.equal(raised.value, '2.5');
assert.deepEqual(earths, ['asked']);

// The switch of a level (story ST-033). A level's row has its button, and after it a checkbox
// named by the level's name; "All" has none. Each is on but where `off` holds its level.
const told = { cut: 'all', ground: true, way: 'made-up', shadows: true, built: true };
shows({ ...told, cuts: ['all', 817, 814], off: { levels: [814] } });
const rows = places.get('levels').children;
const kinds = rows.map(({ children }) => children.map(({ type }) => type));
assert.deepEqual(kinds, [['button'], ['button', 'checkbox'], ['button', 'checkbox']]);
const [high, low] = rows.slice(1).map(({ children: [, on] }) => on);
assert.deepEqual([high.ariaLabel, low.ariaLabel], ['817', '814']);
assert.deepEqual([high.checked, low.checked], [true, false]);
// Turned, it asks once, with its level and whether it is on now - and asks for no cut.
steps.length = 0;
high.checked = false;
high.heard.change();
assert.deepEqual([levels, steps], [[[817, false]], []]);
low.checked = true;
low.heard.change();
assert.deepEqual(levels, [
  [817, false],
  [814, true],
]);
// What is off is the caller's to say: the rows stay the rows they were, marked anew.
shows({ ...told, cuts: ['all', 817, 814], off: { levels: [817] } });
assert.equal(places.get('levels').children, rows);
assert.deepEqual([high.checked, low.checked], [false, true]);

// The stand the view is at (T-000.23): `stood` marks the one it is told, by its name, and every
// other not; `null` marks none; and a second `stood` moves the mark. It decides nothing.
const pressedStands = () =>
  places.get('stands').children.map((one) => [one.dataset.stand, one['aria-pressed']]);
const marks = (chosen) => stands.map(({ stand }) => [stand, String(stand === chosen)]);
shows.stood('front');
assert.deepEqual(pressedStands(), marks('front'));
shows.stood('back');
assert.deepEqual(pressedStands(), marks('back'));
shows.stood(null);
assert.deepEqual(pressedStands(), marks(null));
shows.stood('above');
assert.deepEqual(pressedStands(), marks('above'));

process.stdout.write(
  "tools/sketch/view3d: Page Up and Page Down step a level, and typed into a field they are the field's; the entry of the file asks for one at a click, and is off, with why, where a way shows no part; the entry of the picture asks for one at a click, in every way; the entry of the Google Earth file asks for one at a click, and is off, with why, where the plot says no place, and its raise is handed on as typed; a level has its switch, which asks once; File, Settings and Full screen are seen once there is a stage; a stand is marked as told, and no other\n",
);
