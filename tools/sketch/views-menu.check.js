// The check of the way to shut a menu (views.js, T-000.24): `views.menu` hands its caller a
// function that shuts the menu it made, and the window that loses the focus shuts the menu that
// is open. The pad's own scripts on a made-up page whose window keeps the listeners it is told,
// with made-up menus as views.check.js makes them - which holds the rest of a menu. The way to
// shut a menu shuts it where it is open, and leaves a shut one shut and another that is open
// open, with the focus where it was; the window's blur shuts the menu that is open, and with
// none open does nothing; and once either has shut it, the keys are no menu's. No browser, and
// no site but the made-up one. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/views-menu.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

// A MADE-UP PAGE. Its tab kept nothing; its window keeps every listener it is told, by kind, and
// so does its document, one of a kind.
const tab = { getItem: () => null, setItem() {} };
Object.defineProperty(globalThis, 'sessionStorage', { value: tab, configurable: true });
const toldWindow = {};
const toldWindowOf = (type, hear) => (toldWindow[type] ??= []).push(hear);
Object.assign(globalThis, { addEventListener: toldWindowOf });
const part = (dataset = {}) => ({ dataset, append() {}, setAttribute() {} });

// A MADE-UP MENU: a button, and the part it opens with one entry. Each keeps what it is told and
// who listens to it; `did` keeps who took the focus.
const did = [];
function menuOf(name) {
  const hearing = (one) =>
    Object.assign(one, { hears: {}, addEventListener: (type, hear) => (one.hears[type] = hear) });
  const entry = { focus: () => did.push(`${name} entry`), closest: () => entry };
  const button = hearing({ said: {}, focus: () => did.push(name) });
  button.setAttribute = (what, value) => (button.said[what] = value);
  button.contains = (target) => target === button;
  const panel = hearing({ hidden: false, querySelector: () => entry });
  panel.contains = (target) => target === panel || target === entry;
  return { button, panel };
}
const [SHUT, OPEN] = ['true,false', 'false,true'];
/** What the two parts of a menu say: whether the part is hidden, and what the button says. */
const says = ({ button, panel }) => [panel.hidden, button.said['aria-expanded']].join();
const click = ({ button }) => button.hears.click({ target: button });

// The pad's page, from above, with the two parts of File: the script makes that menu itself.
const file = menuOf('file');
const parts = { views: part(), title: part(), paper: part() };
Object.assign(parts, { 'file-menu': file.button, 'file-entries': file.panel });
const heard = {};
const document = {
  getElementById: (id) => parts[id],
  createElement: () => part(),
  addEventListener: (type, hear) => (heard[type] = hear),
};
Object.assign(globalThis, { document, location: { hash: '#top', assign() {}, reload() {} } });
for (const one of ['demo-site', 'paper', 'views']) await import(`./${one}.js`);
const { menu, typing } = globalThis.views;
// THE LISTENERS: the document is told of the three it was, and the window of one more than the
// reload at a new hash - its blur, once.
assert.deepEqual(Object.keys(heard).sort(), ['focusin', 'keydown', 'pointerdown']);
assert.deepEqual(Object.keys(toldWindow).sort(), ['blur', 'hashchange']);
assert.deepEqual([toldWindow.blur.length, toldWindow.hashchange.length], [1, 1]);
const blur = () => toldWindow.blur[0]({ target: globalThis });
/** Whether a key pressed on the page is a menu's: the rule's answer for a 2 on the page. */
const keysTaken = () => typing({ key: '2', target: { tagName: 'BODY' } });

// MENU HANDS BACK A FUNCTION, of a second menu that the page makes - the swatch's colours, say.
const colours = menuOf('colours');
const shut = menu(colours.button, colours.panel);
assert.deepEqual([typeof shut, says(colours), says(file)], ['function', SHUT, SHUT]);
// SHUT, it stays shut, and nothing else is another: no menu open, no focus taken, no key taken.
shut();
assert.deepEqual([says(colours), says(file), did, keysTaken()], [SHUT, SHUT, [], false]);
// OPEN, it shuts - as a second click on its button would - and the focus stays where it was: no
// button takes it, as at Escape. The keys are the page's again.
click(colours);
assert.deepEqual([says(colours), did.splice(0), keysTaken()], [OPEN, ['colours entry'], true]);
shut();
assert.deepEqual([says(colours), says(file), did, keysTaken()], [SHUT, SHUT, [], false]);
// ANOTHER MENU OPEN is left open, and keeps the keys: the way shuts its own menu alone.
click(file);
shut();
assert.deepEqual(
  [says(file), says(colours), did.splice(0), keysTaken()],
  [OPEN, SHUT, ['file entry'], true],
);
// And the menu shut by it opens at the next click on its button, which shuts the other.
click(colours);
assert.deepEqual([says(colours), says(file), keysTaken()], [OPEN, SHUT, true]);

// THE WINDOW'S BLUR - Tab past the last control, a click in another window - shuts the menu that
// is open, whichever it is, and the keys are the page's again; nothing takes the focus.
did.length = 0;
blur();
assert.deepEqual([says(colours), says(file), did, keysTaken()], [SHUT, SHUT, [], false]);
click(file);
blur();
assert.deepEqual(
  [says(file), says(colours), did.splice(0), keysTaken()],
  [SHUT, SHUT, ['file entry'], false],
);
// With none open it does nothing; and a menu that it shut opens at the next click on its button.
blur();
assert.deepEqual([says(file), says(colours), did, keysTaken()], [SHUT, SHUT, [], false]);
click(file);
assert.deepEqual([says(file), keysTaken()], [OPEN, true]);

process.stdout.write(
  'tools/sketch: a script shuts the menu it made by the way views.menu hands back, and a window that loses the focus keeps no menu open\n',
);
