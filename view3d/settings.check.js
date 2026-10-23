// The check of Settings: what they say of each figure - the pad's own eight, by hand - and, on a
// made-up page with made-up keys, what they do. Every key typed into a field is handed on with
// all the field holds, and what is answered is said beside it; what is shown while a key is
// answered is not written into the field of that key, and a field says the sketch's figure again
// once it is left; "Default" is off where the figure is the default; a figure from elsewhere
// shows in its field, whatever was typed there; locked, nothing takes anything, and it is said
// why, once; and the button opens and closes them, with nothing left over. No browser, no sketch
// and no store: what is typed goes to a made-up page that answers as the pad would. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { openSettings, rowsOf } from './settings.js';

// The pad's own figures: figures.js knows no page, and loads as it is.
await import('../figures.js');
const { FIGURES, of } = globalThis.figures;
const DEFAULTS = of({});

// What Settings say of each figure, by hand, in the pad's order (story ST-024, rule 2): its
// words as a line begins, its range, and the default that "Default" brings back. All in metres.
const BY_HAND = [
  ['outerWallM', 'How thick an outer wall is', 'from 0.1 to 0.8 m', 0.4],
  ['innerWallM', 'How thick an inner wall is', 'from 0.05 to 0.5 m', 0.2],
  ['floorSlabM', 'How thick a floor is', 'from 0.1 to 0.6 m', 0.3],
  ['roofSlabM', 'How thick a roof is', 'from 0.1 to 0.8 m', 0.3],
  ['railingHighM', 'How high a railing is', 'from 0.5 to 1.5 m', 1],
  ['doorHighM', "How high a door's opening is", 'from 1.8 to 2.6 m', 2.1],
  ['windowHighM', 'How high a window is', 'from 0.3 to 2.5 m', 1.5],
  ['sillHighM', "How high a window's sill lies over the floor", 'from 0 to 1.5 m', 0.9],
];
assert.deepEqual(
  rowsOf(FIGURES),
  BY_HAND.map(([name, words, range, usual]) => ({ name, words, unit: 'm', range, usual })),
);

// A made-up page: an element keeps what it is given and what listens to it, `fire` has it hear
// an event, and the page knows which element the keys go to. Leaving that one is heard as `blur`,
// and leaving any other is not heard at all.
const page = { keysTo: null, places: new Map() };
function element(tag) {
  const heard = {};
  return {
    tag,
    children: [],
    dataset: {},
    attributes: {},
    append(...more) {
      this.children.push(...more);
    },
    addEventListener: (type, hear) => (heard[type] ??= []).push(hear),
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    fire(type, event = {}) {
      for (const hear of heard[type] ?? []) hear({ target: this, ...event });
    },
    blur() {
      if (page.keysTo !== this) return;
      page.keysTo = null;
      this.fire('blur');
    },
  };
}
// The places 3d.html has for them: the button, and - hidden - the list with the line over it.
for (const id of ['settings-open', 'settings', 'settings-said', 'figures']) {
  page.places.set(id, Object.assign(element('div'), { id, hidden: id !== 'settings-open' }));
}
const $ = (id) => page.places.get(id);
globalThis.document = { createElement: element, getElementById: $ };

// The page that is asked. It notes what it was asked; it takes a figure where the pad takes the
// text, and shows it at once, as the 3D page reads the sketch again; and it answers with the
// pad's words where the pad does not. `sketch` are the figures of a made-up sketch, and `locked`
// why none can be written: a page that is `late` learns of that only when it is asked.
let [sketch, locked, late] = [{ ...DEFAULTS }, '', false];
const LOCK = 'A made-up lock.';
const asked = [];
const shown = () => shows({ figures: sketch, locked });
const written = (name, value) => {
  if (late) locked = LOCK;
  else sketch = { ...sketch, [name]: value };
  shown();
  return locked;
};
const shows = openSettings(FIGURES, {
  typed(name, text) {
    asked.push([name, text]);
    const { value, refused } = globalThis.figures.typed(name, text);
    return refused ?? written(name, value);
  },
  usual(name) {
    asked.push([name]);
    return written(name, FIGURES[name].default);
  },
});
shown();

// A row for each figure, in their order: its words, which name its field; then the field, its
// unit and "Default"; then its range, and a place for what is refused, which the field is
// described by, both.
const listed = $('figures').children.map((row) => {
  const [label, line, within, refused] = row.children;
  const [field, unit, back] = line.children;
  return { name: row.dataset.figure, label, field, unit, back, within, refused };
});
const part = (what, of = 'textContent') => listed.map((row) => row[what][of]);
const all = (value) => Array(8).fill(value);
assert.deepEqual(
  listed.map(({ name }) => name),
  Object.keys(FIGURES),
);
assert.deepEqual(
  part('label'),
  BY_HAND.map(([, words]) => words),
);
assert.deepEqual(
  part('within'),
  BY_HAND.map(([, , range]) => range),
);
assert.deepEqual(part('label', 'htmlFor'), part('field', 'id'));
assert.equal(listed[0].field.id, 'figure-outerWallM');
assert.deepEqual([part('unit'), part('back')], [all('m'), all('Default')]);
assert.deepEqual(part('field', 'type'), all('text'));
for (const { field, within, refused } of listed) {
  assert.equal(field.attributes['aria-describedby'], `${within.id} ${refused.id}`);
  assert.notEqual(within.id, refused.id);
}
// Each field says its figure of the sketch - here the defaults, so every "Default" is off - and
// nothing stands over them: no figure is locked.
const BY_DEFAULT = ['0.4', '0.2', '0.3', '0.3', '1', '2.1', '1.5', '0.9'];
const said = () => part('field', 'value');
const off = () => part('back', 'disabled');
const over = () => [$('settings-said').hidden, $('settings-said').textContent];
assert.deepEqual([said(), off()], [BY_DEFAULT, all(true)]);
assert.deepEqual([part('field', 'disabled'), over()], [all(false), [true, '']]);

/** Types a text into a field: the keys go to that field, which hears of what it holds now. */
const type = (row, text) => {
  page.keysTo = row.field;
  row.field.value = text;
  row.field.fire('input');
};
const [outer, , , roof, railing, door] = listed;

// The outer walls, 0.3 m, a key at a time. Each key is handed on with all the field holds; "0"
// and "0." are refused in the pad's words, beside the field; "0.3" is taken, and nothing is said.
for (const text of ['0', '0.']) {
  type(outer, text);
  assert.match(outer.refused.textContent, /a number from 0\.1 to 0\.8 m\. 0 m is too little\.$/);
  assert.deepEqual([sketch.outerWallM, outer.back.disabled], [0.4, true]);
}
type(outer, '0.3');
assert.deepEqual(
  asked.splice(0),
  ['0', '0.', '0.3'].map((text) => ['outerWallM', text]),
);
assert.deepEqual([sketch.outerWallM, outer.refused.textContent], [0.3, '']);
// It is off its default: its "Default" is on, and no other.
assert.deepEqual(off(), all(true).with(0, false));
// What is shown while a key is answered is not written into the field of that key: a figure
// taken at one key does not take the point typed with the next, and a comma stays a comma. A
// door of 2.4 m is 2 m at its first key - and "2." stays "2.".
for (const text of ['2', '2.']) {
  type(door, text);
  assert.deepEqual([door.field.value, sketch.doorHighM, door.refused.textContent], [text, 2, '']);
}
type(door, '2,4');
assert.deepEqual([door.field.value, sketch.doorHighM], ['2,4', 2.4]);
// Enter leaves the field, and no other key does: left, it says the sketch's figure.
door.field.fire('keydown', { key: 'a' });
assert.deepEqual([page.keysTo, door.field.value], [door.field, '2,4']);
door.field.fire('keydown', { key: 'Enter' });
assert.deepEqual([page.keysTo, door.field.value], [null, '2.4']);

// A railing of five metres is refused beside its field, and so is what is no number. The field
// keeps what was typed while the keys go to it; left, it says the last good figure, and the
// words stay beside it - until the field is typed into again.
type(railing, '5');
assert.match(railing.refused.textContent, /from 0\.5 to 1\.5 m\. 5 m is too much\.$/);
assert.deepEqual([railing.field.value, sketch.railingHighM], ['5', 1]);
railing.field.blur();
assert.deepEqual([railing.field.value, railing.back.disabled], ['1', true]);
assert.match(railing.refused.textContent, /5 m is too much\.$/);
type(railing, 'high');
assert.match(railing.refused.textContent, /from 0\.5 to 1\.5 m\. "high" is none\.$/);
type(railing, '1.1');
assert.deepEqual([sketch.railingHighM, railing.refused.textContent], [1.1, '']);
railing.field.blur();

// "Default" asks for the default, and what it answers is said as what a key answers: the figure
// is the default again, its "Default" is off, and what was said beside its field is gone.
type(outer, '9');
outer.field.blur();
assert.match(outer.refused.textContent, /9 m is too much\.$/);
asked.length = 0;
outer.back.fire('click');
assert.deepEqual(asked.splice(0), [['outerWallM']]);
assert.deepEqual([sketch.outerWallM, outer.field.value, outer.back.disabled], [0.4, '0.4', true]);
assert.equal(outer.refused.textContent, '');

// A figure from elsewhere - another window changed the sketch - shows in its field at once, and
// its "Default" is on. No key is answered then: every field says the sketch's figure, the one
// that the keys go to as well, whatever was typed into it; and nothing is said beside a field.
type(outer, '0.');
type(railing, '7');
assert.deepEqual(
  [outer.refused.textContent === '', railing.refused.textContent === ''],
  [false, false],
);
sketch = { ...sketch, roofSlabM: 0.5, outerWallM: 0.7 };
shown();
assert.deepEqual([roof.field.value, roof.back.disabled], ['0.5', false]);
assert.deepEqual([outer.field.value, outer.back.disabled], ['0.7', false]);
assert.deepEqual(said(), ['0.7', '0.2', '0.3', '0.5', '1.1', '2.4', '1.5', '0.9']);
assert.deepEqual(part('refused'), all(''));
// And a key that is answered leaves nothing beside another field: what was refused there before
// was an attempt that is over.
type(railing, '7');
railing.field.blur();
type(door, '2.5');
assert.deepEqual(
  [railing.refused.textContent, door.field.value, sketch.doorHighM],
  ['', '2.5', 2.5],
);
door.field.blur();

// Locked - the browser keeps what cannot be read - it is said over the fields why; no field and
// no "Default" takes anything, a figure off its default neither; every field says the figure
// that was read, the one that the keys go to as well; and nothing is said beside a field.
type(railing, '7');
[sketch, locked] = [{ ...DEFAULTS, roofSlabM: 0.5 }, LOCK];
shown();
assert.deepEqual([over(), part('field', 'disabled'), off()], [[false, LOCK], all(true), all(true)]);
assert.deepEqual([said(), part('refused')], [BY_DEFAULT.with(3, '0.5'), all('')]);
// A browser sends no key to a field that takes none.
page.keysTo = null;
// No longer locked, every field and the one "Default" take what they took.
locked = '';
shown();
assert.deepEqual([over(), part('field', 'disabled')], [[true, ''], all(false)]);
assert.deepEqual(off(), all(true).with(3, false));
// And where the page learns only from a key that it is locked, the words stand over the fields,
// once: the answer is not said beside the field as well, and the field says the sketch's figure.
late = true;
type(door, '2.2');
assert.deepEqual([over(), door.refused.textContent, sketch.doorHighM], [[false, LOCK], '', 2.1]);
assert.deepEqual([part('field', 'disabled'), door.field.value], [all(true), '2.1']);
[locked, late, page.keysTo] = ['', false, null];
shown();

// The button opens Settings and closes them, and says which on itself. Either way nothing typed
// is left over: the field that the keys went to is left, and says the sketch's figure; and
// nothing is said beside a field.
const [button, place] = [$('settings-open'), $('settings')];
assert.equal(place.hidden, true);
type(railing, '7');
assert.match(railing.refused.textContent, /7 m is too much\.$/);
button.fire('click');
assert.deepEqual([place.hidden, button.attributes['aria-expanded']], [false, 'true']);
assert.deepEqual([page.keysTo, railing.field.value, railing.refused.textContent], [null, '1', '']);
button.fire('click');
assert.deepEqual([place.hidden, button.attributes['aria-expanded']], [true, 'false']);

process.stdout.write(
  'tools/sketch/view3d: Settings list the eight figures with their ranges, hand on every key, say what is refused beside the field, and are locked where nothing can be written\n',
);
