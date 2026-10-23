// The made-up page of the right button's menu, as its three checks have it (T-037.5, T-037.6):
// right-menu.check.js, the entries and their picks, right-menu-keys.check.js, the press, the
// keys and the shutting, and selected-several.check.js, several, Copy and Paste. The pad's own scripts on a made-up store, the made-up plot, and a page
// that keeps what is made and who listens; and a made-up sketch on it. No check of its own, by
// its name: every check that imports it holds it - one each, for a page loads its scripts once.
import assert from 'node:assert/strict';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });

// A MADE-UP PAGE. A part keeps what it was given, the parts put into it - and they the part they
// were put into - its style and what was said of it, and the listeners it was told, one of a
// kind. It answers the few questions the scripts ask: an entry that is not off, whether a part
// lies in another, where it lies on the window - every part 200 by 300 pixels. `did` says which
// part took the focus, by its words.
export const did = [];
const MATCHES = {
  'button:enabled': (one) => one.tagName === 'BUTTON' && !one.disabled,
  'button:enabled:not([aria-haspopup])': (one) =>
    one.tagName === 'BUTTON' && !one.disabled && !('aria-haspopup' in one.said),
};
export const SIZE = [200, 300];
/** A made-up part of a page, by its tag. */
export function part(tagName) {
  const made = {
    tagName: tagName.toUpperCase(),
    children: [],
    hears: {},
    said: {},
    style: {},
    dataset: {},
  };
  const take = (more) => more.forEach((one) => (one.parent = made));
  made.append = (...more) => void (take(more), made.children.push(...more));
  made.replaceChildren = (...more) => void (take(more), (made.children = more));
  made.addEventListener = (type, hear) => void (made.hears[type] = hear);
  made.setAttribute = (what, value) => void (made.said[what] = value);
  made.focus = () => void ((document.activeElement = made), did.push(made.textContent));
  made.contains = (other) => other === made || made.children.some((one) => one.contains(other));
  made.closest = (sel) => (MATCHES[sel](made) ? made : (made.parent?.closest(sel) ?? null));
  made.querySelector = (sel) =>
    made.children.find(MATCHES[sel]) ??
    made.children.map((one) => one.querySelector(sel)).find(Boolean) ??
    null;
  [made.offsetWidth, made.offsetHeight] = SIZE;
  made.getBoundingClientRect = () => {
    const [left, top] = [parseFloat(made.style.left) || 0, parseFloat(made.style.top) || 0];
    return { left, top, right: left + SIZE[0], bottom: top + SIZE[1] };
  };
  return made;
}
// What the scripts ask the page for: the switch of views, the title and the paper (views.js),
// the pad's words of what is selected, which the list of categories is put after - and that
// list, by its id - and the body. The listeners the document was told, by kind, in their order.
export const page = Object.fromEntries(
  ['views', 'title', 'paper', 'picked'].map((id) => [id, part('p')]),
);
page.picked.after = (...more) => void (page.picked.followed = more);
export const listeners = {};
const listOf = () => page.picked.followed[0].children[0];
export const document = {
  body: part('body'),
  getElementById: (id) => page[id] ?? (id === 'category' ? listOf() : null),
  createElement: part,
  addEventListener: (type, hear) => (listeners[type] ??= []).push(hear),
};
document.activeElement = document.body;
// The view: from above, or - where the check asks it by SKETCH_VIEW, as selected-several.check.js
// does of a process of its own - the side view.
export const VIEW = process.env.SKETCH_VIEW === 'side' ? 'side' : 'top';
const location = { hash: `#${VIEW}`, assign() {}, reload() {} };
const land = { ground() {}, grid() {}, site() {} };
Object.assign(globalThis, { document, location, land, addEventListener() {} });
Object.assign(globalThis, { innerWidth: 1280, innerHeight: 800 });
// What the window shows (zoom.js): the paper's corner at its corner, ten pixels a cell (PX).
globalThis.zoom = { px: 10, left: 0, top: 0 };

// The pad's scripts on the made-up plot, in the order of index.html, as far as the menu needs
// them; the menu's script last but for page.js, which the check stands in for.
const NEEDED =
  'demo-site paper figures shapes categories blocks draw draw-marks legacy sketch sections/model';
const MORE = 'strokes labels selected footer views category-list pointer right-menu';
for (const one of [...NEEDED.split(' '), ...MORE.split(' ')]) await import(`./${one}.js`);
const { SITE, paper, sketch, rightMenu, structuredClone } = globalThis;
assert.deepEqual([SITE.name, paper.PLANE], ['Made-up hillside plot', VIEW]);
// The paper lies at the window's top left corner, ten pixels a cell.
export const PX = 10;
page.paper.getBoundingClientRect = () => {
  const [width, height] = [paper.WIDE * PX, paper.ROWS * PX];
  return { left: 0, top: 0, width, height };
};
// The page's part: what is selected, and the way to select.
export const chosen = { picked: [] };
rightMenu.selected = () => chosen.picked;
rightMenu.select = (things) => void (chosen.picked = things);
/** The menu, as the script made it: the one part it put in the body. */
export const [panel] = document.body.children;

// THE SKETCH: on the level drawn on, row 40, a block of two boxes, a box alone and a person; a
// second level, row 30, with a box on it; and a chair on the ground.
export const LEVEL = 40;
export const BLOCK = [
  { x: [10, 20], y: [10, 20], z: [30, LEVEL], colour: 1, group: 1 },
  { x: [20, 30], y: [10, 20], z: [34, LEVEL], colour: 1, group: 1 },
];
export const ALONE = { x: [40, 50], y: [10, 20], z: [36, LEVEL], colour: 2 };
export const UPPER = { x: [40, 50], y: [30, 40], z: [20, 30], colour: 3 };
export const PERSON = { kind: 'person', x: 15.5, y: 30.5, floor: LEVEL };
export const CHAIR = { kind: 'chair', x: 60, y: 30, floor: 'ground' };
export const ALL = [...BLOCK, ALONE, UPPER, PERSON, CHAIR];
export const text = () => JSON.stringify(sketch.doc);
export const things = () => sketch.doc.things;
/** The sketch begun anew, with more of a sketch where it is given, no step and nothing selected. */
export function begin(more = {}) {
  const doc = { ...sketch.blank(), things: structuredClone(ALL), ...more };
  sketch.doc = sketch.adopt({ ...doc, on: { ...doc.on, top: LEVEL } });
  [sketch.past.length, sketch.future.length, chosen.picked] = [0, 0, []];
}
/** A change: one step, which Undo takes back to the byte. The things it leaves. */
export function done(act) {
  const [before, steps] = [text(), sketch.past.length];
  act();
  const [after, more] = [text(), sketch.past.length - steps];
  sketch.step(sketch.past, sketch.future);
  assert.deepEqual([after === before, more, text()], [false, 1, before]);
  sketch.step(sketch.future, sketch.past);
  return structuredClone(things());
}
