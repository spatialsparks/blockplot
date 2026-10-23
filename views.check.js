// The check of the rule for a key: one that is typed into a field is the field's, and no view's
// and no tool's (views.js) - and while a menu is open, every key is the menu's. The pad's own
// scripts on a made-up page, asked about made-up keys. The rule says yes of every kind of field,
// and no of everything else that a key is pressed on. The switch's own listener, on the pad's
// page and on the 3D page, goes to no view for a figure or a V that is typed into a field, and
// goes to one for the same key pressed on the page. A menu, of two made-up parts: a click on its
// button opens and shuts it; a click on an entry, Escape - which ends there - the pointer down
// or the focus gone elsewhere, and another menu shut it; open, the rule says yes of every key
// and the switch goes nowhere; shut, every answer is that of a page with no menu. And of
// page.js, which wants a whole page to load, the text alone: its listener asks the rule before
// anything else, and its field - the height of a block - gives the focus back once it is set:
// the list of kinds went for the gallery. No browser, and no site but the made-up one. Run by
// tools/sketch/check.js, or alone: pnpm exec node tools/sketch/views.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import process from 'node:process';

// A made-up page. Its tab kept nothing, and nobody is told when it goes; where the switch sends
// it is written down instead.
const went = [];
const tab = { getItem: () => null, setItem() {} };
Object.defineProperty(globalThis, 'sessionStorage', { value: tab, configurable: true });
Object.assign(globalThis, { addEventListener() {} });
const part = (dataset = {}) => ({ dataset, append() {}, setAttribute() {} });

let loads = 0;
/**
 * The pad's scripts, loaded anew on such a page: the made-up plot's paper under a hash - one of
 * the five views of the pad's own page - or, where the switch says `3d`, the 3D page, which has
 * no paper - with `more` parts where it is to have any: the two of a menu. It gives the rule as
 * a page gets it, the one listener of each kind that the script set, and the way to make a menu.
 */
async function page(hash, view, more = {}) {
  const parts = { views: part({ view }), title: part(), paper: view ? null : part(), ...more };
  const [heard, told] = [{}, []];
  const document = {
    getElementById: (id) => parts[id],
    createElement: () => part(),
    addEventListener: (type, hear) => told.push(type) && (heard[type] = hear),
  };
  const location = { hash, assign: (href) => went.push(href), reload() {} };
  Object.assign(globalThis, { document, location });
  loads += 1;
  await import(`./paper.js?${loads}`);
  await import(`./views.js?${loads}`);
  const { seen, keep, typing, menu } = globalThis.views;
  // The page gets the rule as it gets what the tab showed last, and the way to keep it.
  assert.deepEqual([seen, typeof keep, typeof typing], [{}, 'function', 'function']);
  // One listener for keys, as there was - and one for the pointer, and one for the focus.
  assert.deepEqual(told.sort(), ['focusin', 'keydown', 'pointerdown']);
  return { typing, press: heard.keydown, heard, menu };
}
await import('./demo-site.js');

/**
 * A made-up thing that a key is pressed on, with what a browser says of one: its tag in capital
 * letters, the kind it says it is - where its tag has kinds - and whether it is editable. What
 * the things below say was compared by hand, in sprint 24, with what the tests' browser says.
 */
const made = (tagName, type, isContentEditable = false) => ({ tagName, type, isContentEditable });
/** A key as a browser tells of it: which one, what it was pressed on, and what is held with it. */
const key = (pressed, target, held) => {
  const nothing = { ctrlKey: false, metaKey: false, altKey: false, shiftKey: false };
  return { key: pressed, target, ...nothing, ...held };
};

// The 22 kinds of <input> that the HTML standard has, each by what its `type` says - `text`
// also of a field that names no kind, and of one whose kind the browser does not know. Twelve
// take text or figures: a key typed there is part of what the field holds. Ten take neither.
const TYPED = 'text search tel url email password number date month week time datetime-local';
const PRESSED = 'checkbox radio range button submit reset image file color hidden';
// What is contenteditable says so of itself, and of every part of it that a key is typed into.
const fields = [
  ...TYPED.split(' ').map((type) => [`a field of the kind ${type}`, made('INPUT', type)]),
  ['a text area', made('TEXTAREA', 'textarea')],
  ['a list', made('SELECT', 'select-one')],
  ['a list of which several are picked', made('SELECT', 'select-multiple')],
  ['what is contenteditable', made('DIV', undefined, true)],
  ['a part of what is contenteditable', made('SPAN', undefined, true)],
];
// A checkbox, a radio button and a slider are among the ten. A link says a kind too, an empty
// one, and is no field. And the page itself: its body, where a key goes that is pressed on
// nothing; the paper; and the document, which says nothing of itself - a made-up key is sent it.
const others = [
  ...PRESSED.split(' ').map((type) => [`an input of the kind ${type}`, made('INPUT', type)]),
  ['a button', made('BUTTON', 'submit')],
  ['a link', made('A', '')],
  ['the paper', made('CANVAS')],
  ['the page itself', made('BODY')],
  ['the document', {}],
];
// Each of the 22 kinds is on one side, and five things more on either.
assert.deepEqual([fields.length, others.length], [12 + 5, 10 + 5]);

// The pad's own page, on its third view of seven, the other side.
const pad = await page('#far');
for (const [what, target] of fields) {
  assert.equal(pad.typing(key('2', target)), true, `${what} is a field`);
}
for (const [what, target] of others) {
  assert.equal(pad.typing(key('2', target)), false, `${what} is no field`);
}
// Whatever is held with it, a key typed into a field is the field's: Ctrl+Z there is no undo of
// the sketch. And held keys make no field of the page.
const [text, body] = [made('INPUT', 'text'), made('BODY')];
for (const held of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey']) {
  assert.equal(pad.typing(key('z', text, { [held]: true })), true, held);
  assert.equal(pad.typing(key('z', body, { [held]: true })), false, held);
}

/** Where the switch of a page goes when a key is pressed: the addresses it sent the page to. */
const goes = ({ press }, ...pressed) => {
  press(key(...pressed));
  return went.splice(0);
};

// The listener itself. Pressed on the page, a 2 goes to the second view, the side view, and a V
// to the next one, the front view. Typed into a field of text, neither goes anywhere.
assert.deepEqual(goes(pad, '2', body), ['#side']);
assert.deepEqual(goes(pad, 'V', body), ['#front']);
assert.deepEqual(goes(pad, 'v', body), ['#front']);
assert.deepEqual(goes(pad, '2', text), []);
assert.deepEqual(goes(pad, 'V', text), []);
assert.deepEqual(goes(pad, 'v', text), []);
// So of every kind of field - and of whatever is none, the key is the switch's.
for (const [what, target] of fields) {
  assert.deepEqual([goes(pad, '2', target), goes(pad, 'v', target)], [[], []], what);
}
for (const [what, target] of others) {
  assert.deepEqual([goes(pad, '2', target), goes(pad, 'v', target)], [['#side'], ['#front']], what);
}
// The rule is asked before the key is read: a browser that fills a field in may send a key
// that names none, and the switch leaves that one alone as well.
assert.doesNotThrow(() => pad.press({ target: text }));
assert.deepEqual(went, []);

// On the page, a key is what it was. Each of the keys 1 to 7 goes to its view, once, but the
// key of the view that shows; with Ctrl, the command key or Alt a key is the browser's; and a
// key that is no view's goes nowhere - an 8 neither, for there are seven views.
const round = (shown) => [...'1234567'].map((one) => goes(shown, one, body).join());
assert.deepEqual(round(pad), ['#top', '#side', '', '#front', '#back', '3d.html', 'info.html']);
for (const held of ['ctrlKey', 'metaKey', 'altKey']) {
  assert.deepEqual(goes(pad, '2', body, { [held]: true }), [], held);
  assert.deepEqual(goes(pad, 'v', body, { [held]: true }), [], held);
}
for (const other of ['0', '8', 'b', 'Enter', ' ', 'PageUp']) {
  assert.deepEqual(goes(pad, other, body), [], `the key ${other}`);
}

// The 3D page and the Info page load the same script: from either a view of the five is on the
// pad's page, and V goes round all seven, from Info to the first. A field there takes its keys.
const solid = await page('', '3d');
const flat = ['top', 'side', 'far', 'front', 'back'].map((view) => `index.html#${view}`);
assert.deepEqual(round(solid), [...flat, '', 'info.html']);
assert.deepEqual(goes(solid, 'V', body), ['info.html']);
const info = await page('', 'info');
assert.deepEqual(round(info), [...flat, '3d.html', '']);
assert.deepEqual(goes(info, 'V', body), ['index.html#top']);
assert.deepEqual(goes(solid, '2', text), []);
assert.deepEqual(goes(solid, 'V', text), []);
for (const [what, target] of fields) {
  assert.equal(solid.typing(key('2', target)), true, `${what} is a field on the 3D page`);
}

// A MENU, made up: a button, and the part it opens with its entries - a button each, off or
// not - and a word that is no entry. Each keeps what it is told and who listens to it; `did`
// keeps who took the focus. They know one selector, an entry's, and no entry can be told to listen.
const did = [];
function menuOf(name, ...off) {
  const found = (asked, entry) => (assert.equal(asked, 'button:enabled'), entry ?? null);
  const hearing = (one, hears = {}) =>
    Object.assign(one, { hears, addEventListener: (type, hear) => (hears[type] = hear) });
  const entries = off.map((disabled, at) => {
    const entry = { disabled, focus: () => did.push(`${name} ${at + 1}`) };
    return Object.assign(entry, { closest: (asked) => found(asked, disabled ? null : entry) });
  });
  const [word, first] = [{ closest: found }, entries.find((entry) => !entry.disabled)];
  const button = hearing({ said: {}, focus: () => did.push(name) });
  button.setAttribute = (what, value) => (button.said[what] = value);
  button.contains = (target) => target === button;
  const panel = hearing({ hidden: false, querySelector: (asked) => found(asked, first) });
  panel.contains = (target) => [panel, word, ...entries].includes(target);
  return { button, panel, entries, word, parts: { 'file-menu': button, 'file-entries': panel } };
}
const [SHUT, OPEN] = ['true,false', 'false,true'];
/** What the two parts of a menu say: whether the part is hidden, and what the button says. */
const says = ({ button, panel }) => [panel.hidden, button.said['aria-expanded']].join();
const click = ({ button }) => button.hears.click({ target: button });
/** Every answer of a page to a 2 and a V pressed on each thing: the rule's, and where the switch goes. */
const answers = (shown) =>
  [...fields, ...others].map(([, thing]) =>
    [shown.typing(key('2', thing)), goes(shown, '2', thing), goes(shown, 'v', thing)].join('|'),
  );
/** Escape pressed on a thing: whether the key ended at the switch, and who took the focus since. */
function escaped(shown, target) {
  let ended = false;
  shown.press({ ...key('Escape', target), stopImmediatePropagation: () => (ended = true) });
  return [ended, ...did.splice(0)].join();
}

// The pad's page with the two parts of File, the first of three entries off: the script makes
// the menu, shut whatever the page said. SHUT, every answer is that of the page with no menu.
const file = menuOf('file', true, false, false);
const [off, on] = file.entries;
const menued = await page('#far', undefined, file.parts);
const before = answers(pad);
assert.equal(before.filter((one) => one === 'false|#side|#front').length, others.length);
assert.deepEqual([says(file), answers(menued)], [SHUT, before]);
// A CLICK ON THE BUTTON opens it, and the first entry that is not off takes the focus. OPEN, it
// has every key, pressed wherever and with whatever is held: the switch goes to no view.
const KEYS = before.map(() => 'true||');
click(file);
assert.deepEqual([says(file), did.splice(0), answers(menued)], [OPEN, ['file 2'], KEYS]);
for (const held of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey'])
  assert.equal(menued.typing(key('z', body, { [held]: true })), true, held);
// A SECOND CLICK shuts it, and nothing takes the focus: every answer is that of before again.
click(file);
assert.deepEqual([says(file), did.splice(0), answers(menued)], [SHUT, [], before]);
// ESCAPE shuts it, gives the button the focus and ends there: whoever hears a key after the
// switch does not hear this one. Shut, an Escape is not the menu's, and goes on to the page.
click(file);
assert.deepEqual([escaped(menued, on), says(file)], ['true,file 2,file', SHUT]);
assert.deepEqual([escaped(menued, body), says(file), went], ['false', SHUT, []]);
// A CLICK ON AN ENTRY shuts it, heard by the part and by no entry: the click comes up from the
// entry, which has heard it by then. On the word, or on an entry that is off, it shuts nothing.
click(file);
for (const none of [file.word, off]) file.panel.hears.click({ target: none });
assert.deepEqual([says(file), Object.keys(file.panel.hears)], [OPEN, ['click']]);
file.panel.hears.click({ target: on });
assert.equal(says(file), SHUT);
// THE POINTER DOWN ELSEWHERE shuts it, and so does THE FOCUS GONE ELSEWHERE; on the button or
// in the part - the part itself, the word, an entry, on or off - neither does.
for (const elsewhere of ['pointerdown', 'focusin']) {
  click(file);
  for (const target of [file.button, file.panel, file.word, on, off]) {
    menued.heard[elsewhere]({ target });
    assert.equal(says(file), OPEN, elsewhere);
  }
  menued.heard[elsewhere]({ target: made('CANVAS') });
  assert.equal(says(file), SHUT, elsewhere);
}
// ONE IS OPEN AT A TIME: a second menu, made by the page - its one entry off, so nothing takes
// the focus - shuts the first as it opens and has the keys, and the first shuts the second.
const other = menuOf('other', true);
menued.menu(other.button, other.panel);
assert.equal(says(other), SHUT);
did.length = 0;
for (const one of [file, other]) click(one);
assert.deepEqual([says(file), says(other), did.splice(0)], [SHUT, OPEN, ['file 2']]);
assert.equal(menued.typing(key('2', body)), true);
click(file);
assert.deepEqual([says(file), says(other)], [OPEN, SHUT]);
assert.deepEqual([escaped(menued, body), says(file)], ['true,file 2,file', SHUT]);
assert.deepEqual(answers(menued), before);
// THE 3D PAGE has the same two parts and the same script: open, no key is a view's there either.
const save = menuOf('file', false);
const menuedSolid = await page('', '3d', save.parts);
click(save);
assert.deepEqual([says(save), round(menuedSolid)], [OPEN, Array(7).fill('')]);
assert.deepEqual([escaped(menuedSolid, body), says(save)], ['true,file 1,file', SHUT]);
assert.deepEqual(round(menuedSolid), [...flat, '', 'info.html']);

// Of page.js, which wants a whole page to load, the text alone. Wherever it listens for keys,
// it asks the rule before anything else: between the listener's opening and the question there
// is nothing but whole lines of comment. So a key typed into a field is read by nothing of the
// page's - no tool, no turn, no step of a level, no undo of the sketch.
const FIRST = /^\(event\) => \{\s*(\/\/[^\n]*\n\s*)*if \(views\.typing\(event\)\) return;/;
const heard = (source) => source.split(/addEventListener\(\s*'keydown',\s*/).slice(1);
const script = readFileSync(`${import.meta.dirname}/page.js`, 'utf8');
const listeners = heard(script);
assert.ok(listeners.length > 0, 'page.js listens for keys');
for (const one of listeners) assert.match(one, FIRST);
// And the pattern takes a listener that asks first, under a comment, and refuses one that reads
// the key first, one that never asks, one that asks and goes on, and one that asks in a comment.
const ASKED = '  if (views.typing(event)) return;\n';
const READ = '  const key = event.key.toLowerCase();\n';
const written = (...lines) =>
  heard(`document.addEventListener('keydown', (event) => {\n${lines.join('')}});\n`)[0];
assert.match(written('  // The field has it.\n', ASKED, READ), FIRST);
assert.doesNotMatch(written(READ, ASKED), FIRST);
assert.doesNotMatch(written(READ), FIRST);
assert.doesNotMatch(written('  views.typing(event);\n', READ), FIRST);
assert.doesNotMatch(written(`  // ${ASKED.trim()}\n`, READ), FIRST);

// And of the field that page.js wires, by the text as well: the height of a block gives the
// focus back to the page - by a blur, on its `change`: once a height is set, and not while one
// is typed, which says `input`. So undo and redo, a step of a level and Escape are the page's
// again right after, with no click between. The line stands by itself in the script, and in no
// comment. The list of kinds was the second such field: an object is picked in the gallery now,
// whose tiles are buttons and no fields (ST-029).
const GIVEN = "$('high').addEventListener('change', () => $('high').blur());";
assert.ok(
  script.includes(`\n  ${GIVEN}\n`),
  'in page.js the height of a block gives the focus back on its change, by a line of its own',
);

process.stdout.write(
  "tools/sketch: a key typed into a field is the field's, and a field once set gives the focus back; a menu opens at a click on its button, shuts at a pick, at Escape and where the pointer or the focus goes elsewhere, and has every key while it is open\n",
);
